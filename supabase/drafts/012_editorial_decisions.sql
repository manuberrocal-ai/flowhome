-- DRAFT: not in migrations; requires 006, 009, 010, 011 and Supabase Auth.
-- No remote application or membership/evidence provisioning is authorized here.
begin;

create table public.block10_editorial_reviewers (
  user_id uuid primary key references auth.users(id) on delete restrict,
  active boolean not null default false,
  expires_at timestamptz not null
);
create table public.block10_editorial_heads (
  job_id text primary key references public.block10_jobs(id) on delete restrict,
  revision text not null check (revision ~ '^[a-f0-9]{64}$'),
  evidence_digest text not null check (evidence_digest ~ '^[a-f0-9]{64}$'),
  evidence_valid_until timestamptz not null,
  evidence_revoked boolean not null default true,
  version bigint not null default 0 check (version between 0 and 9007199254740991)
);
create table public.block10_editorial_decisions (
  job_id text not null references public.block10_editorial_heads(job_id) on delete restrict,
  version bigint not null check (version between 1 and 9007199254740991),
  actor_id uuid not null references auth.users(id) on delete restrict,
  revision text not null check (revision ~ '^[a-f0-9]{64}$'),
  evidence_digest text not null check (evidence_digest ~ '^[a-f0-9]{64}$'),
  decision text not null,
  reason text not null,
  recorded_at timestamptz not null default clock_timestamp(),
  primary key (job_id, version),
  check ((decision='approve' and reason='evidence-reviewed') or
    (decision='reject' and reason in ('identity-mismatch','insufficient-evidence','editorial-correction-required')))
);

alter table public.block10_editorial_reviewers enable row level security;
alter table public.block10_editorial_heads enable row level security;
alter table public.block10_editorial_decisions enable row level security;
revoke all on public.block10_editorial_reviewers, public.block10_editorial_heads,
  public.block10_editorial_decisions from public, anon, authenticated, service_role;
create trigger block10_editorial_decisions_immutable before update or delete on public.block10_editorial_decisions
  for each row execute function public.block10_audit_append_only();

-- Only trusted provisioning may register reviewed evidence and reviewer membership.
-- There are deliberately no provisioning RPCs, seed users, or grants to service_role.
create function public.block10_decide_catalog_review(p_intent jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  v_actor uuid := auth.uid();
  v_member public.block10_editorial_reviewers%rowtype;
  v_job public.block10_jobs%rowtype;
  v_head public.block10_editorial_heads%rowtype;
  v_previous public.block10_editorial_decisions%rowtype;
  v_expected bigint;
begin
  if v_actor is null then return jsonb_build_object('status','unauthorized'); end if;
  -- Lock membership too: a concurrent revocation must serialize with this decision.
  select * into v_member from public.block10_editorial_reviewers where user_id=v_actor for share;
  if not found or not v_member.active or v_member.expires_at <= clock_timestamp() then
    return jsonb_build_object('status','unauthorized');
  end if;
  if jsonb_typeof(p_intent) is distinct from 'object'
    or not (p_intent ?& array['jobId','revision','evidenceDigest','expectedVersion','decision','reason'])
    or p_intent - array['jobId','revision','evidenceDigest','expectedVersion','decision','reason'] <> '{}'::jsonb
    then return jsonb_build_object('status','invalid_intent'); end if;
  if jsonb_typeof(p_intent->'jobId') is distinct from 'string'
    or p_intent->>'jobId' !~ '^jobid:v2:[a-f0-9]{64}$'
    or jsonb_typeof(p_intent->'revision') is distinct from 'string'
    or p_intent->>'revision' !~ '^[a-f0-9]{64}$'
    or jsonb_typeof(p_intent->'evidenceDigest') is distinct from 'string'
    or p_intent->>'evidenceDigest' !~ '^[a-f0-9]{64}$'
    or jsonb_typeof(p_intent->'expectedVersion') is distinct from 'number'
    or p_intent->>'expectedVersion' !~ '^[0-9]{1,16}$'
    or jsonb_typeof(p_intent->'decision') is distinct from 'string'
    or jsonb_typeof(p_intent->'reason') is distinct from 'string' then
    return jsonb_build_object('status','invalid_intent');
  end if;
  v_expected := (p_intent->>'expectedVersion')::bigint;
  if v_expected > 9007199254740990 or not (
    (p_intent->>'decision'='approve' and p_intent->>'reason'='evidence-reviewed') or
    (p_intent->>'decision'='reject' and p_intent->>'reason' in
      ('identity-mismatch','insufficient-evidence','editorial-correction-required'))) then
    return jsonb_build_object('status','invalid_intent');
  end if;
  select * into v_job from public.block10_jobs where id=p_intent->>'jobId' for share;
  if not found or v_job.source <> 'catalog-review' or v_job.payload->>'revision' is distinct from p_intent->>'revision' then
    return jsonb_build_object('status','stale_revision');
  end if;
  select * into v_head from public.block10_editorial_heads where job_id=v_job.id for update;
  if not found then return jsonb_build_object('status','unregistered_evidence'); end if;
  if v_head.revision is distinct from p_intent->>'revision'
    or v_head.evidence_digest is distinct from p_intent->>'evidenceDigest'
    or v_head.evidence_revoked or v_head.evidence_valid_until <= clock_timestamp()
    or v_member.expires_at <= clock_timestamp() then
    return jsonb_build_object('status','stale_evidence');
  end if;
  select * into v_previous from public.block10_editorial_decisions
    where job_id=v_job.id and version=v_expected+1;
  if found then
    if v_previous.actor_id=v_actor and v_previous.revision=p_intent->>'revision'
      and v_previous.evidence_digest=p_intent->>'evidenceDigest'
      and v_previous.decision=p_intent->>'decision' and v_previous.reason=p_intent->>'reason' then
      return jsonb_build_object('status','duplicate','version',v_previous.version,'publicationAuthorized',false);
    end if;
    return jsonb_build_object('status','version_conflict');
  end if;
  if v_head.version <> v_expected then return jsonb_build_object('status','version_conflict'); end if;
  insert into public.block10_editorial_decisions(job_id,version,actor_id,revision,evidence_digest,decision,reason)
    values(v_job.id,v_expected+1,v_actor,v_head.revision,v_head.evidence_digest,p_intent->>'decision',p_intent->>'reason');
  update public.block10_editorial_heads set version=v_expected+1 where job_id=v_job.id;
  return jsonb_build_object('status','recorded','version',v_expected+1,'publicationAuthorized',false);
end;
$$;
revoke all on function public.block10_decide_catalog_review(jsonb) from public, anon, authenticated, service_role;
grant execute on function public.block10_decide_catalog_review(jsonb) to authenticated;
commit;
