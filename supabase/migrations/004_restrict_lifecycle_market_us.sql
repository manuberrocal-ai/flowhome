-- Canada is not an implemented lifecycle market. Keep persisted preferences and
-- minimized lifecycle job payloads US-only until market-specific delivery exists.
update public.lifecycle_preferences set market = 'US' where market <> 'US';
alter table public.lifecycle_preferences drop constraint if exists lifecycle_preferences_market_check;
alter table public.lifecycle_preferences add constraint lifecycle_preferences_market_check check (market = 'US');

create or replace function public.save_lifecycle_preferences(p_preferences jsonb, p_consent_version integer)
returns void language plpgsql security definer set search_path = pg_catalog, public as $$
declare v_user uuid := public.lifecycle_require_user(); v_previous_status text; v_categories text[]; v_types text[];
begin
  if p_consent_version <> 1 or coalesce(p_preferences->>'version','') <> '1' or coalesce(p_preferences->>'consented','false') <> 'true' then raise exception 'Explicit current consent is required' using errcode = '22023'; end if;
  if jsonb_typeof(p_preferences->'categories') <> 'array' or jsonb_typeof(p_preferences->'types') <> 'array' or coalesce(p_preferences->>'market','') <> 'US' or coalesce(p_preferences->>'frequency','') not in ('weekly','monthly','important-only') then raise exception 'Invalid lifecycle preferences' using errcode = '22023'; end if;
  select coalesce(array_agg(value), '{}') into v_categories from jsonb_array_elements_text(p_preferences->'categories') value;
  select coalesce(array_agg(value), '{}') into v_types from jsonb_array_elements_text(p_preferences->'types') value;
  if not (v_categories <@ array['video-doorbell','smart-thermostat','smart-speaker','smart-plug','smart-lock','smart-lighting','smart-hub','smart-display','security-camera','robot-vacuum','motion-sensor','air-purifier','garage-door-opener','smart-blinds']) or not (v_types <@ array['onboarding','digest','price-drop','restock','comparison-follow-up','recommendation','reactivation']) then raise exception 'Non-canonical lifecycle preference' using errcode = '22023'; end if;
  select status into v_previous_status from public.lifecycle_preferences where user_id = v_user;
  insert into public.lifecycle_subscribers (user_id) values (v_user) on conflict (user_id) do update set updated_at = now();
  insert into public.lifecycle_preferences (user_id, version, categories, market, frequency, types, consented, status, suppression_reason, consented_at) values (v_user, 1, v_categories, 'US', p_preferences->>'frequency', v_types, true, 'active', null, now())
  on conflict (user_id) do update set categories = excluded.categories, market = excluded.market, frequency = excluded.frequency, types = excluded.types, consented = true, status = 'active', suppression_reason = null, consented_at = case when public.lifecycle_preferences.status = 'unsubscribed' then now() else public.lifecycle_preferences.consented_at end, dispatch_version = public.lifecycle_preferences.dispatch_version + 1, updated_at = now();
  insert into public.lifecycle_consent_history (user_id, consent_version, action) values (v_user, 1, case when v_previous_status = 'active' then 'updated' else 'granted' end);
  if 'onboarding' = any(v_types) then insert into public.lifecycle_jobs (user_id, type, idempotency_key) values (v_user, 'onboarding', 'onboarding:' || v_user::text || ':v1') on conflict (idempotency_key) do nothing; end if;
end; $$;

create or replace function public.enqueue_lifecycle_job(p_user_id uuid, p_type text, p_payload jsonb, p_idempotency_key text)
returns void language plpgsql security definer set search_path = pg_catalog, public as $$
declare v_payload jsonb;
begin
  if p_type not in ('onboarding','digest','price-drop','restock','comparison-follow-up','recommendation','reactivation') or p_idempotency_key !~ '^[A-Za-z0-9:_-]{16,160}$' or jsonb_typeof(p_payload) <> 'object' or not (array(select jsonb_object_keys(p_payload)) <@ array['product_slug','comparison_slug','market','event_key']) or coalesce(p_payload->>'product_slug','') !~ '^[a-z0-9-]{0,120}$' or coalesce(p_payload->>'comparison_slug','') !~ '^[a-z0-9-]{0,120}$' or coalesce(p_payload->>'event_key','') !~ '^[A-Za-z0-9:_-]{0,120}$' or coalesce(p_payload->>'market','US') <> 'US' then raise exception 'Invalid minimized lifecycle job' using errcode = '22023'; end if;
  v_payload := jsonb_strip_nulls(jsonb_build_object('product_slug', nullif(p_payload->>'product_slug',''), 'comparison_slug', nullif(p_payload->>'comparison_slug',''), 'market', 'US', 'event_key', nullif(p_payload->>'event_key','')));
  insert into public.lifecycle_jobs (user_id, type, payload, idempotency_key) select p_user_id, p_type, v_payload, p_idempotency_key where exists (select 1 from public.lifecycle_preferences p where p.user_id = p_user_id and p.market = 'US' and p.consented and p.status = 'active' and p_type = any(p.types)) on conflict (idempotency_key) do nothing;
end; $$;
