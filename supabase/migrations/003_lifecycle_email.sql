-- Block 7: authenticated, consent-only lifecycle metadata. No email is persisted here.
create table if not exists public.lifecycle_subscribers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lifecycle_preferences (
  user_id uuid primary key references public.lifecycle_subscribers(user_id) on delete cascade,
  version integer not null check (version = 1),
  categories text[] not null default '{}',
  market text not null check (market in ('US', 'CA')),
  frequency text not null check (frequency in ('weekly', 'monthly', 'important-only')),
  types text[] not null default '{}',
  consented boolean not null default false,
  status text not null default 'unsubscribed' check (status in ('active', 'unsubscribed')),
  suppression_reason text check (suppression_reason is null or suppression_reason in ('account', 'one_click', 'delete', 'admin')),
  consented_at timestamptz,
  updated_at timestamptz not null default now(),
  check (categories <@ array['video-doorbell','smart-thermostat','smart-speaker','smart-plug','smart-lock','smart-lighting','smart-hub','smart-display','security-camera','robot-vacuum','motion-sensor','air-purifier','garage-door-opener','smart-blinds']),
  check (types <@ array['onboarding','digest','price-drop','restock','comparison-follow-up','recommendation','reactivation'])
);
alter table public.lifecycle_preferences add column if not exists dispatch_version integer not null default 0;

create table if not exists public.lifecycle_consent_history (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.lifecycle_subscribers(user_id) on delete cascade,
  consent_version integer not null check (consent_version = 1),
  action text not null check (action in ('granted', 'updated', 'unsubscribed')),
  suppression_reason text,
  recorded_at timestamptz not null default now()
);

create table if not exists public.lifecycle_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.lifecycle_subscribers(user_id) on delete cascade,
  type text not null check (type in ('onboarding','digest','price-drop','restock','comparison-follow-up','recommendation','reactivation')),
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object'),
  idempotency_key text not null unique check (idempotency_key ~ '^[A-Za-z0-9:_-]{16,160}$'),
  state text not null default 'pending' check (state in ('pending','claimed','retry','dead','suppressed','mock')),
  attempts integer not null default 0 check (attempts between 0 and 5),
  available_at timestamptz not null default now(), claimed_at timestamptz, created_at timestamptz not null default now(), completed_at timestamptz
);
create index if not exists lifecycle_jobs_available_idx on public.lifecycle_jobs (state, available_at) where state in ('pending', 'retry');

-- A dispatch lease reserves a frequency slot before provider invocation. It is
-- deliberately separate from claim state: claiming alone never authorizes a send.
create table if not exists public.lifecycle_dispatch_leases (
  job_id uuid primary key references public.lifecycle_jobs(id) on delete cascade,
  user_id uuid not null references public.lifecycle_subscribers(user_id) on delete cascade,
  type text not null check (type in ('onboarding','digest','price-drop','restock','comparison-follow-up','recommendation','reactivation')),
  preference_version integer not null,
  lease_token uuid not null unique default gen_random_uuid(),
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists lifecycle_dispatch_leases_user_idx on public.lifecycle_dispatch_leases (user_id, type, expires_at);

create table if not exists public.lifecycle_webhook_events (
  provider_event_id text primary key check (length(provider_event_id) between 1 and 128),
  job_id text not null check (length(job_id) between 1 and 128),
  event_type text not null check (event_type in ('delivered','opened','clicked','bounced','complained','failed')),
  occurred_at timestamptz not null, received_at timestamptz not null default now()
);

alter table public.lifecycle_subscribers enable row level security;
alter table public.lifecycle_preferences enable row level security;
alter table public.lifecycle_consent_history enable row level security;
alter table public.lifecycle_jobs enable row level security;
alter table public.lifecycle_dispatch_leases enable row level security;
alter table public.lifecycle_webhook_events enable row level security;
revoke all on table public.lifecycle_subscribers, public.lifecycle_preferences, public.lifecycle_consent_history, public.lifecycle_jobs, public.lifecycle_dispatch_leases, public.lifecycle_webhook_events from public, anon, authenticated;

create or replace function public.lifecycle_require_user()
returns uuid language plpgsql security definer set search_path = pg_catalog, public as $$
declare v_user uuid := auth.uid();
begin if v_user is null then raise exception 'Authentication is required' using errcode = '28000'; end if; return v_user; end; $$;

create or replace function public.get_lifecycle_preferences()
returns jsonb language plpgsql security definer set search_path = pg_catalog, public as $$
declare v_user uuid := public.lifecycle_require_user(); v_result jsonb;
begin
  select jsonb_build_object('version', coalesce(p.version, 1), 'categories', coalesce(to_jsonb(p.categories), '[]'::jsonb), 'market', coalesce(p.market, 'US'), 'frequency', coalesce(p.frequency, 'weekly'), 'types', coalesce(to_jsonb(p.types), '[]'::jsonb), 'consented', coalesce(p.consented, false), 'status', coalesce(p.status, 'unset'), 'suppressed', coalesce(p.status = 'unsubscribed', false), 'suppressionReason', p.suppression_reason) into v_result from (select v_user as user_id) u left join public.lifecycle_preferences p on p.user_id = u.user_id;
  return v_result;
end; $$;

create or replace function public.save_lifecycle_preferences(p_preferences jsonb, p_consent_version integer)
returns void language plpgsql security definer set search_path = pg_catalog, public as $$
declare v_user uuid := public.lifecycle_require_user(); v_previous_status text; v_categories text[]; v_types text[];
begin
  if p_consent_version <> 1 or coalesce(p_preferences->>'version','') <> '1' or coalesce(p_preferences->>'consented','false') <> 'true' then raise exception 'Explicit current consent is required' using errcode = '22023'; end if;
  if jsonb_typeof(p_preferences->'categories') <> 'array' or jsonb_typeof(p_preferences->'types') <> 'array' or coalesce(p_preferences->>'market','') not in ('US','CA') or coalesce(p_preferences->>'frequency','') not in ('weekly','monthly','important-only') then raise exception 'Invalid lifecycle preferences' using errcode = '22023'; end if;
  select coalesce(array_agg(value), '{}') into v_categories from jsonb_array_elements_text(p_preferences->'categories') value;
  select coalesce(array_agg(value), '{}') into v_types from jsonb_array_elements_text(p_preferences->'types') value;
  if not (v_categories <@ array['video-doorbell','smart-thermostat','smart-speaker','smart-plug','smart-lock','smart-lighting','smart-hub','smart-display','security-camera','robot-vacuum','motion-sensor','air-purifier','garage-door-opener','smart-blinds']) or not (v_types <@ array['onboarding','digest','price-drop','restock','comparison-follow-up','recommendation','reactivation']) then raise exception 'Non-canonical lifecycle preference' using errcode = '22023'; end if;
  select status into v_previous_status from public.lifecycle_preferences where user_id = v_user;
  insert into public.lifecycle_subscribers (user_id) values (v_user) on conflict (user_id) do update set updated_at = now();
  insert into public.lifecycle_preferences (user_id, version, categories, market, frequency, types, consented, status, suppression_reason, consented_at) values (v_user, 1, v_categories, p_preferences->>'market', p_preferences->>'frequency', v_types, true, 'active', null, now())
  on conflict (user_id) do update set categories = excluded.categories, market = excluded.market, frequency = excluded.frequency, types = excluded.types, consented = true, status = 'active', suppression_reason = null, consented_at = case when public.lifecycle_preferences.status = 'unsubscribed' then now() else public.lifecycle_preferences.consented_at end, dispatch_version = public.lifecycle_preferences.dispatch_version + 1, updated_at = now();
  insert into public.lifecycle_consent_history (user_id, consent_version, action) values (v_user, 1, case when v_previous_status = 'active' then 'updated' else 'granted' end);
  if 'onboarding' = any(v_types) then insert into public.lifecycle_jobs (user_id, type, idempotency_key) values (v_user, 'onboarding', 'onboarding:' || v_user::text || ':v1') on conflict (idempotency_key) do nothing; end if;
end; $$;

create or replace function public.unsubscribe_lifecycle_preferences(p_reason text)
returns void language plpgsql security definer set search_path = pg_catalog, public as $$
declare v_user uuid := public.lifecycle_require_user();
begin
  if p_reason not in ('account', 'one_click') then raise exception 'Invalid suppression reason' using errcode = '22023'; end if;
  with changed as (update public.lifecycle_preferences set status = 'unsubscribed', suppression_reason = p_reason, dispatch_version = dispatch_version + 1, updated_at = now() where user_id = v_user and status <> 'unsubscribed' returning user_id) insert into public.lifecycle_consent_history (user_id, consent_version, action, suppression_reason) select user_id, 1, 'unsubscribed', p_reason from changed;
  update public.lifecycle_jobs set state = 'suppressed', completed_at = now() where user_id = v_user and state in ('pending','claimed','retry');
  delete from public.lifecycle_dispatch_leases where user_id = v_user;
end; $$;

create or replace function public.unsubscribe_lifecycle_one_click(p_user_id uuid)
returns void language plpgsql security definer set search_path = pg_catalog, public as $$
begin
  with changed as (update public.lifecycle_preferences set status = 'unsubscribed', suppression_reason = 'one_click', dispatch_version = dispatch_version + 1, updated_at = now() where user_id = p_user_id and status <> 'unsubscribed' returning user_id) insert into public.lifecycle_consent_history (user_id, consent_version, action, suppression_reason) select user_id, 1, 'unsubscribed', 'one_click' from changed;
  update public.lifecycle_jobs set state = 'suppressed', completed_at = now() where user_id = p_user_id and state in ('pending','claimed','retry');
  delete from public.lifecycle_dispatch_leases where user_id = p_user_id;
end; $$;

create or replace function public.export_lifecycle_data()
returns jsonb language plpgsql security definer set search_path = pg_catalog, public as $$
declare v_user uuid := public.lifecycle_require_user();
begin return jsonb_build_object('preferences', coalesce((select to_jsonb(p) - 'user_id' from public.lifecycle_preferences p where p.user_id = v_user), '{}'::jsonb), 'consent_history', coalesce((select jsonb_agg(jsonb_build_object('consent_version', h.consent_version, 'action', h.action, 'suppression_reason', h.suppression_reason, 'recorded_at', h.recorded_at) order by h.id) from public.lifecycle_consent_history h where h.user_id = v_user), '[]'::jsonb)); end; $$;

create or replace function public.delete_lifecycle_data()
returns void language plpgsql security definer set search_path = pg_catalog, public as $$
declare v_user uuid := public.lifecycle_require_user();
begin delete from public.lifecycle_subscribers where user_id = v_user; end; $$;

create or replace function public.enqueue_lifecycle_job(p_user_id uuid, p_type text, p_payload jsonb, p_idempotency_key text)
returns void language plpgsql security definer set search_path = pg_catalog, public as $$
declare v_payload jsonb;
begin
  if p_type not in ('onboarding','digest','price-drop','restock','comparison-follow-up','recommendation','reactivation') or p_idempotency_key !~ '^[A-Za-z0-9:_-]{16,160}$' or jsonb_typeof(p_payload) <> 'object' or not (array(select jsonb_object_keys(p_payload)) <@ array['product_slug','comparison_slug','market','event_key']) or coalesce(p_payload->>'product_slug','') !~ '^[a-z0-9-]{0,120}$' or coalesce(p_payload->>'comparison_slug','') !~ '^[a-z0-9-]{0,120}$' or coalesce(p_payload->>'event_key','') !~ '^[A-Za-z0-9:_-]{0,120}$' or coalesce(p_payload->>'market','US') not in ('US','CA') then raise exception 'Invalid minimized lifecycle job' using errcode = '22023'; end if;
  v_payload := jsonb_strip_nulls(jsonb_build_object('product_slug', nullif(p_payload->>'product_slug',''), 'comparison_slug', nullif(p_payload->>'comparison_slug',''), 'market', nullif(p_payload->>'market',''), 'event_key', nullif(p_payload->>'event_key','')));
  insert into public.lifecycle_jobs (user_id, type, payload, idempotency_key) select p_user_id, p_type, v_payload, p_idempotency_key where exists (select 1 from public.lifecycle_preferences p where p.user_id = p_user_id and p.consented and p.status = 'active' and p_type = any(p.types)) on conflict (idempotency_key) do nothing;
end; $$;

create or replace function public.expire_stale_lifecycle_claims(p_max_age_seconds integer)
returns integer language plpgsql security definer set search_path = pg_catalog, public as $$
declare v_count integer;
begin
  delete from public.lifecycle_dispatch_leases where consumed_at is null and expires_at <= now();
  update public.lifecycle_jobs set state = 'dead', completed_at = now() where state = 'claimed' and claimed_at < now() - make_interval(secs => least(greatest(coalesce(p_max_age_seconds, 900), 60), 86400));
  get diagnostics v_count = row_count;
  delete from public.lifecycle_dispatch_leases l using public.lifecycle_jobs j where j.id = l.job_id and j.state <> 'claimed';
  return v_count;
end; $$;

create or replace function public.claim_lifecycle_jobs(p_limit integer)
returns table (id uuid, user_id uuid, type text, idempotency_key text, attempts integer, recipient_email text, preferences jsonb)
language sql security definer set search_path = pg_catalog, public as $$
  with candidates as (select j.id from public.lifecycle_jobs j join public.lifecycle_preferences p on p.user_id = j.user_id where j.state in ('pending','retry') and j.available_at <= now() and j.attempts < 5 and p.consented and p.status = 'active' order by j.available_at, j.id limit least(greatest(coalesce(p_limit, 0), 0), 100) for update of j skip locked), claimed as (update public.lifecycle_jobs j set state = 'claimed', claimed_at = now(), attempts = j.attempts + 1 from candidates c where j.id = c.id returning j.*) select j.id, j.user_id, j.type, j.idempotency_key, j.attempts, u.email as recipient_email, jsonb_build_object('types', p.types, 'frequency', p.frequency, 'consented', p.consented, 'status', p.status) from claimed j join public.lifecycle_preferences p on p.user_id = j.user_id join auth.users u on u.id = j.user_id;
$$;

create or replace function public.authorize_lifecycle_dispatch(p_job_id uuid)
returns uuid language plpgsql security definer set search_path = pg_catalog, public as $$
declare v_preference public.lifecycle_preferences%rowtype; v_job public.lifecycle_jobs%rowtype; v_type_window interval; v_type_count integer; v_global_count integer; v_lease uuid;
begin
  -- Serialize every reservation for one recipient on the preference row.
  select p.* into v_preference from public.lifecycle_preferences p join public.lifecycle_jobs j on j.user_id = p.user_id where j.id = p_job_id for update of p;
  if not found then return null; end if;
  select * into v_job from public.lifecycle_jobs where id = p_job_id for update;
  if not found or v_job.state <> 'claimed' or not v_preference.consented or v_preference.status <> 'active' or not (v_job.type = any(v_preference.types)) then return null; end if;
  if v_job.type = 'digest' and v_preference.frequency = 'important-only' then return null; end if;
  delete from public.lifecycle_dispatch_leases where job_id = p_job_id and consumed_at is null and expires_at <= now();
  if exists (select 1 from public.lifecycle_dispatch_leases where job_id = p_job_id and (consumed_at is not null or expires_at > now())) then return null; end if;
  select count(*) into v_global_count from (select 1 from public.lifecycle_jobs where user_id = v_job.user_id and state = 'mock' and completed_at >= now() - interval '24 hours' union all select 1 from public.lifecycle_dispatch_leases where user_id = v_job.user_id and (consumed_at is not null or expires_at > now())) reserved;
  if v_global_count >= 4 then return null; end if;
  if v_job.type = 'onboarding' then
    select count(*) into v_type_count from (select 1 from public.lifecycle_jobs where user_id = v_job.user_id and type = v_job.type and state = 'mock' union all select 1 from public.lifecycle_dispatch_leases where user_id = v_job.user_id and type = v_job.type and (consumed_at is not null or expires_at > now())) completed;
  else
    v_type_window := case when v_job.type = 'digest' and v_preference.frequency = 'weekly' then interval '7 days' when v_job.type = 'digest' then interval '28 days' when v_job.type in ('price-drop','restock') then interval '24 hours' when v_job.type in ('comparison-follow-up','recommendation') then interval '7 days' else interval '30 days' end;
    select count(*) into v_type_count from (select 1 from public.lifecycle_jobs where user_id = v_job.user_id and type = v_job.type and state = 'mock' and completed_at >= now() - v_type_window union all select 1 from public.lifecycle_dispatch_leases where user_id = v_job.user_id and type = v_job.type and (consumed_at is not null or expires_at > now())) completed;
  end if;
  if v_type_count >= (case v_job.type when 'onboarding' then 1 when 'digest' then 1 when 'price-drop' then 3 when 'restock' then 2 when 'comparison-follow-up' then 1 when 'recommendation' then 2 when 'reactivation' then 1 else 0 end) then return null; end if;
  insert into public.lifecycle_dispatch_leases (job_id, user_id, type, preference_version, expires_at) values (v_job.id, v_job.user_id, v_job.type, v_preference.dispatch_version, now() + interval '60 seconds') returning lease_token into v_lease;
  return v_lease;
end; $$;

create or replace function public.consume_lifecycle_dispatch_lease(p_job_id uuid, p_lease_token uuid)
returns boolean language plpgsql security definer set search_path = pg_catalog, public as $$
declare v_preference public.lifecycle_preferences%rowtype; v_consumed uuid;
begin
  -- This is the final one-time authorization immediately before provider.send.
  select p.* into v_preference from public.lifecycle_preferences p join public.lifecycle_jobs j on j.user_id = p.user_id where j.id = p_job_id for update of p;
  if not found then return false; end if;
  perform 1 from public.lifecycle_jobs where id = p_job_id and state = 'claimed' for update;
  if not found or not v_preference.consented or v_preference.status <> 'active' then return false; end if;
  update public.lifecycle_dispatch_leases set consumed_at = now() where job_id = p_job_id and lease_token = p_lease_token and preference_version = v_preference.dispatch_version and consumed_at is null and expires_at > now() returning job_id into v_consumed;
  return v_consumed is not null;
end; $$;

create or replace function public.finish_lifecycle_job(p_job_id uuid, p_state text, p_next_attempt_at timestamptz)
returns void language plpgsql security definer set search_path = pg_catalog, public as $$
begin
  if p_state not in ('retry','dead','suppressed','mock') then raise exception 'Invalid state' using errcode = '22023'; end if;
  update public.lifecycle_jobs set state = p_state, available_at = coalesce(p_next_attempt_at, available_at), completed_at = case when p_state in ('dead','suppressed','mock') then now() else null end where id = p_job_id and state = 'claimed';
  delete from public.lifecycle_dispatch_leases where job_id = p_job_id;
end; $$;

create or replace function public.record_lifecycle_webhook(p_event jsonb)
returns void language plpgsql security definer set search_path = pg_catalog, public as $$
begin insert into public.lifecycle_webhook_events (provider_event_id, job_id, event_type, occurred_at) values (p_event->>'providerEventId', p_event->>'jobId', p_event->>'eventType', (p_event->>'occurredAt')::timestamptz) on conflict (provider_event_id) do nothing; end; $$;

revoke all on function public.lifecycle_require_user(), public.get_lifecycle_preferences(), public.save_lifecycle_preferences(jsonb,integer), public.unsubscribe_lifecycle_preferences(text), public.unsubscribe_lifecycle_one_click(uuid), public.export_lifecycle_data(), public.delete_lifecycle_data(), public.enqueue_lifecycle_job(uuid,text,jsonb,text), public.expire_stale_lifecycle_claims(integer), public.claim_lifecycle_jobs(integer), public.authorize_lifecycle_dispatch(uuid), public.consume_lifecycle_dispatch_lease(uuid,uuid), public.finish_lifecycle_job(uuid,text,timestamptz), public.record_lifecycle_webhook(jsonb) from public, anon, authenticated, service_role;
grant execute on function public.get_lifecycle_preferences(), public.save_lifecycle_preferences(jsonb,integer), public.unsubscribe_lifecycle_preferences(text), public.export_lifecycle_data(), public.delete_lifecycle_data() to authenticated;
grant execute on function public.unsubscribe_lifecycle_one_click(uuid), public.enqueue_lifecycle_job(uuid,text,jsonb,text), public.expire_stale_lifecycle_claims(integer), public.claim_lifecycle_jobs(integer), public.authorize_lifecycle_dispatch(uuid), public.consume_lifecycle_dispatch_lease(uuid,uuid), public.finish_lifecycle_job(uuid,text,timestamptz), public.record_lifecycle_webhook(jsonb) to service_role;
