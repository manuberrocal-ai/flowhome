-- DRAFT: requires 012; local review only, not an authorized remote migration.
begin;
create table public.block10_editorial_provisioning_audit (
  id bigint generated always as identity primary key,
  target_kind text not null check (target_kind in ('reviewer','evidence')),
  target_id text not null,
  operation text not null check (operation in ('baseline','insert','update','delete')),
  database_session_role text not null,
  before_state jsonb,
  after_state jsonb,
  recorded_at timestamptz not null default clock_timestamp()
);
alter table public.block10_editorial_provisioning_audit enable row level security;
revoke all on public.block10_editorial_provisioning_audit from public,anon,authenticated,service_role;
revoke all on sequence public.block10_editorial_provisioning_audit_id_seq from public,anon,authenticated,service_role;
create trigger block10_editorial_provisioning_immutable before update or delete on public.block10_editorial_provisioning_audit
  for each row execute function public.block10_audit_append_only();

create function public.block10_audit_editorial_provisioning()
returns trigger language plpgsql security definer set search_path='' as $$
declare v_before jsonb; v_after jsonb; v_kind text; v_id text;
begin
  if tg_op <> 'INSERT' then v_before := to_jsonb(old); end if;
  if tg_op <> 'DELETE' then v_after := to_jsonb(new); end if;
  if tg_table_schema <> 'public' then raise exception 'Unexpected audit source'; end if;
  if tg_table_name='block10_editorial_reviewers' then
    v_kind := 'reviewer'; v_id := coalesce(v_after->>'user_id',v_before->>'user_id');
  elsif tg_table_name='block10_editorial_heads' then
    v_kind := 'evidence'; v_id := coalesce(v_after->>'job_id',v_before->>'job_id');
    -- Version-only transitions are already in the immutable decision ledger.
    v_before := v_before - 'version'; v_after := v_after - 'version';
  else raise exception 'Unexpected audit source'; end if;
  if tg_op='UPDATE' and v_before is not distinct from v_after then return new; end if;
  insert into public.block10_editorial_provisioning_audit
    (target_kind,target_id,operation,database_session_role,before_state,after_state)
    values(v_kind,v_id,lower(tg_op),session_user,v_before,v_after);
  if tg_op='DELETE' then return old; end if;
  return new;
end;
$$;
revoke all on function public.block10_audit_editorial_provisioning() from public,anon,authenticated,service_role;
create trigger block10_editorial_reviewer_provisioning after insert or update or delete on public.block10_editorial_reviewers
  for each row execute function public.block10_audit_editorial_provisioning();
create trigger block10_editorial_evidence_provisioning after insert or update or delete on public.block10_editorial_heads
  for each row execute function public.block10_audit_editorial_provisioning();
-- Snapshot existing state honestly; never invent a historic human approval.
insert into public.block10_editorial_provisioning_audit(target_kind,target_id,operation,database_session_role,after_state)
  select 'reviewer',user_id::text,'baseline',session_user,to_jsonb(r) from public.block10_editorial_reviewers r;
insert into public.block10_editorial_provisioning_audit(target_kind,target_id,operation,database_session_role,after_state)
  select 'evidence',job_id,'baseline',session_user,to_jsonb(h)-'version' from public.block10_editorial_heads h;
commit;
