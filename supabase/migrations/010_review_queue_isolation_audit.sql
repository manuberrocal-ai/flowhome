-- Local preparation; requires 006 and 009. Remote activation needs approval.
begin;

create table public.block10_review_job_audit (
  id bigint generated always as identity primary key,
  job_id text not null references public.block10_jobs(id) on delete restrict,
  event_kind text not null check (event_kind in ('baseline','insert','update')),
  prior_state text,
  next_state text not null,
  attempts integer not null check (attempts between 0 and 5),
  revision text not null check (revision ~ '^[a-f0-9]{64}$'),
  recorded_at timestamptz not null default clock_timestamp()
);
alter table public.block10_review_job_audit enable row level security;
revoke all on public.block10_review_job_audit from public, anon, authenticated, service_role;
revoke all on sequence public.block10_review_job_audit_id_seq from public, anon, authenticated, service_role;
create trigger block10_review_audit_immutable before update or delete on public.block10_review_job_audit
  for each row execute function public.block10_audit_append_only();

create function public.block10_audit_review_job()
returns trigger language plpgsql security definer set search_path = pg_catalog, public as $$
begin
  if tg_op = 'UPDATE' and (old.source = 'catalog-review' or new.source = 'catalog-review')
    and (old.source is distinct from new.source or old.id is distinct from new.id
      or old.idempotency_key is distinct from new.idempotency_key or old.payload is distinct from new.payload
      or old.partition_key is distinct from new.partition_key) then
    raise exception 'Review identity is immutable' using errcode='22023';
  end if;
  if new.source = 'catalog-review' then
    insert into public.block10_review_job_audit(job_id,event_kind,prior_state,next_state,attempts,revision)
      values(new.id,lower(tg_op),case when tg_op='UPDATE' then old.state else null end,
        new.state,new.attempts,new.payload->>'revision');
  end if;
  return new;
end;
$$;
revoke all on function public.block10_audit_review_job() from public, anon, authenticated, service_role;
create trigger block10_review_job_audit after insert or update on public.block10_jobs
  for each row execute function public.block10_audit_review_job();
-- Record observed current state, never invent historical transition events.
insert into public.block10_review_job_audit(job_id,event_kind,next_state,attempts,revision)
  select id,'baseline',state,attempts,payload->>'revision' from public.block10_jobs where source='catalog-review';

create function public.block10_claim_scoped_jobs(p_worker_id text,p_limit integer,p_lease_seconds integer,p_review boolean)
returns setof public.block10_jobs language plpgsql security definer set search_path = pg_catalog, public as $$
declare v_now timestamptz := now(); v_ids text[];
begin
  if p_review is null or p_worker_id is null or p_worker_id !~ '^[A-Za-z0-9:_-]{1,80}$'
    or p_limit is null or p_limit < 1 or p_limit > 100
    or p_lease_seconds is null or p_lease_seconds < 1 or p_lease_seconds > 3600 then return; end if;
  update public.block10_jobs set state='dead',failure_class='permanent',failure_reason='lease_exhausted',
    lease_owner_id=null,lease_token=null,lease_expires_at=null,updated_at=v_now
    where (source='catalog-review') = p_review and state='claimed' and lease_expires_at <= v_now and attempts >= 5;
  with candidates as (
    select id from public.block10_jobs where (source='catalog-review') = p_review
      and ((state in ('pending','retry') and available_at <= v_now) or (state='claimed' and lease_expires_at <= v_now))
      and attempts < 5 order by available_at,id limit p_limit for update skip locked
  ), claimed as (
    update public.block10_jobs j set state='claimed',attempts=j.attempts+1,lease_owner_id=p_worker_id,
      lease_token=encode(extensions.gen_random_bytes(16),'hex'),lease_expires_at=v_now+make_interval(secs=>p_lease_seconds),updated_at=v_now
      from candidates c where j.id=c.id returning j.id
  ) select array_agg(id) into v_ids from claimed;
  if v_ids is not null then return query select * from public.block10_jobs where id=any(v_ids) order by available_at,id; end if;
end;
$$;
revoke all on function public.block10_claim_scoped_jobs(text,integer,integer,boolean) from public, anon, authenticated, service_role;

create or replace function public.block10_claim_jobs(p_worker_id text,p_limit integer,p_lease_seconds integer)
returns setof public.block10_jobs language sql security definer set search_path = pg_catalog, public as $$
  select * from public.block10_claim_scoped_jobs(p_worker_id,p_limit,p_lease_seconds,false);
$$;
create function public.block10_claim_catalog_reviews(p_worker_id text,p_limit integer,p_lease_seconds integer)
returns setof public.block10_jobs language sql security definer set search_path = pg_catalog, public as $$
  select * from public.block10_claim_scoped_jobs(p_worker_id,p_limit,p_lease_seconds,true);
$$;
revoke all on function public.block10_claim_jobs(text,integer,integer),public.block10_claim_catalog_reviews(text,integer,integer) from public, anon, authenticated, service_role;
grant execute on function public.block10_claim_jobs(text,integer,integer),public.block10_claim_catalog_reviews(text,integer,integer) to service_role;
commit;
