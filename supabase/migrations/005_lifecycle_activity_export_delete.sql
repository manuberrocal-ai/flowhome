-- Block 7 surgical follow-up. Prepared only; do not apply without approval.
-- Upgrade the initial text job reference to lifecycle-owned foreign keys so
-- export and deletion have a complete, cascade-safe activity boundary.
begin;

delete from public.lifecycle_webhook_events e
where e.job_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
   or not exists (select 1 from public.lifecycle_jobs j where j.id::text = e.job_id);

alter table public.lifecycle_webhook_events drop constraint if exists lifecycle_webhook_events_job_id_check;
alter table public.lifecycle_webhook_events alter column job_id type uuid using job_id::uuid;
alter table public.lifecycle_webhook_events add column if not exists user_id uuid;
update public.lifecycle_webhook_events e set user_id = j.user_id from public.lifecycle_jobs j where j.id = e.job_id and e.user_id is null;
alter table public.lifecycle_webhook_events alter column user_id set not null;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'lifecycle_webhook_events_job_id_fkey') then
    alter table public.lifecycle_webhook_events add constraint lifecycle_webhook_events_job_id_fkey foreign key (job_id) references public.lifecycle_jobs(id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'lifecycle_webhook_events_user_id_fkey') then
    alter table public.lifecycle_webhook_events add constraint lifecycle_webhook_events_user_id_fkey foreign key (user_id) references public.lifecycle_subscribers(user_id) on delete cascade;
  end if;
end $$;
create index if not exists lifecycle_webhook_events_user_idx on public.lifecycle_webhook_events (user_id, occurred_at);

create or replace function public.export_lifecycle_data()
returns jsonb language plpgsql security definer set search_path = pg_catalog, public as $$
declare v_user uuid := public.lifecycle_require_user();
begin
  return jsonb_build_object(
    'preferences', coalesce((select to_jsonb(p) - 'user_id' from public.lifecycle_preferences p where p.user_id = v_user), '{}'::jsonb),
    'consent_history', coalesce((select jsonb_agg(jsonb_build_object('consent_version', h.consent_version, 'action', h.action, 'suppression_reason', h.suppression_reason, 'recorded_at', h.recorded_at) order by h.id) from public.lifecycle_consent_history h where h.user_id = v_user), '[]'::jsonb),
    'jobs', coalesce((select jsonb_agg(to_jsonb(j) - 'user_id' order by j.created_at, j.id) from public.lifecycle_jobs j where j.user_id = v_user), '[]'::jsonb),
    'webhook_events', coalesce((select jsonb_agg(jsonb_build_object('provider_event_id', e.provider_event_id, 'job_id', e.job_id, 'event_type', e.event_type, 'occurred_at', e.occurred_at, 'received_at', e.received_at) order by e.received_at, e.provider_event_id) from public.lifecycle_webhook_events e where e.user_id = v_user), '[]'::jsonb)
  );
end; $$;

create or replace function public.delete_lifecycle_data()
returns void language plpgsql security definer set search_path = pg_catalog, public as $$
declare v_user uuid := public.lifecycle_require_user();
begin
  -- The subscriber root and both webhook foreign keys cascade all lifecycle activity atomically.
  delete from public.lifecycle_subscribers where user_id = v_user;
end; $$;

create or replace function public.record_lifecycle_webhook(p_event jsonb)
returns void language plpgsql security definer set search_path = pg_catalog, public as $$
begin
  insert into public.lifecycle_webhook_events (provider_event_id, job_id, user_id, event_type, occurred_at)
  select p_event->>'providerEventId', j.id, j.user_id, p_event->>'eventType', (p_event->>'occurredAt')::timestamptz
  from public.lifecycle_jobs j where j.id = (p_event->>'jobId')::uuid
  on conflict (provider_event_id) do nothing;
end; $$;

commit;
