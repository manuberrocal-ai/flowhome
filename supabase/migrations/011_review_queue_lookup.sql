-- Read-only reconciliation. Prepared locally; no automatic remote activation.
begin;
create function public.block10_lookup_catalog_review(p_payload jsonb,p_idempotency_key text)
returns jsonb language plpgsql security definer set search_path=pg_catalog,public as $$
declare v_job public.block10_jobs%rowtype;
begin
  if p_idempotency_key is null or p_idempotency_key !~ '^job:v2:[a-f0-9]{64}$'
     or jsonb_typeof(p_payload) is distinct from 'object' then return jsonb_build_object('status','invalid_payload'); end if;
  select * into v_job from public.block10_jobs where idempotency_key=p_idempotency_key and source='catalog-review';
  if not found then return jsonb_build_object('status','missing'); end if;
  if v_job.payload is distinct from p_payload then return jsonb_build_object('status','conflict'); end if;
  return jsonb_build_object('status','duplicate','id',v_job.id,'idempotencyKey',v_job.idempotency_key,'state',v_job.state);
end;
$$;
revoke all on function public.block10_lookup_catalog_review(jsonb,text) from public,anon,authenticated,service_role;
grant execute on function public.block10_lookup_catalog_review(jsonb,text) to service_role;
commit;
