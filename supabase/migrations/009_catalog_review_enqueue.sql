-- Prepared locally. Requires 006; do not apply remotely without approval.
begin;

create or replace function public.block10_enqueue_catalog_review(p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = pg_catalog, public as $$
declare
  v_asin text; v_revision text; v_key text; v_id text; v_trace text;
  v_job public.block10_jobs%rowtype;
  v_inserted boolean;
begin
  if jsonb_typeof(p_payload) is distinct from 'object' then
    return jsonb_build_object('status', 'invalid_payload');
  end if;
  if not (p_payload ?& array['schemaVersion','intent','asin','market','productSlug','revision'])
     or p_payload - array['schemaVersion','intent','asin','market','productSlug','revision'] <> '{}'::jsonb
     or p_payload->'schemaVersion' is distinct from '1'::jsonb
     or p_payload->'intent' is distinct from '"catalog-review"'::jsonb
     or p_payload->'market' is distinct from '"US"'::jsonb
     or jsonb_typeof(p_payload->'asin') is distinct from 'string'
     or jsonb_typeof(p_payload->'revision') is distinct from 'string' then
    return jsonb_build_object('status', 'invalid_payload');
  end if;
  v_asin := p_payload->>'asin'; v_revision := p_payload->>'revision';
  if v_asin !~ '^[A-Z0-9]{10}$' or v_revision !~ '^[a-f0-9]{64}$'
     or (p_payload->'productSlug' <> 'null'::jsonb and
       (jsonb_typeof(p_payload->'productSlug') is distinct from 'string'
        or length(p_payload->>'productSlug') not between 1 and 160
        or p_payload->>'productSlug' !~ '^[a-z0-9]+(-[a-z0-9]+)*$')) then
    return jsonb_build_object('status', 'invalid_payload');
  end if;
  -- Canonical typed arrays match Block8 buildIdempotencyKey. All interpolated
  -- values are constrained ASCII identifiers; no JSON whitespace ambiguity.
  v_key := 'job:v2:' || encode(sha256(convert_to(
    '[["string","catalog-review"],["string","US:' || v_asin || '"],["string","' || v_asin || '"],["string","' || v_revision || '"]]', 'UTF8')), 'hex');
  v_id := 'jobid:v2:' || encode(sha256(convert_to('[["string","' || v_key || '"]]', 'UTF8')), 'hex');
  v_trace := 'trace:v2:' || encode(sha256(convert_to('[["string","catalog-review"],["string","review:' || v_revision || '"]]', 'UTF8')), 'hex');
  insert into public.block10_jobs
    (id, idempotency_key, source, partition_key, payload, trace_id, correlation_id)
  values (v_id, v_key, 'catalog-review', 'US:' || v_asin, p_payload, v_trace, 'review:' || v_revision)
  on conflict (idempotency_key) do nothing
  returning * into v_job;
  v_inserted := found;
  if not v_inserted then
    select * into v_job from public.block10_jobs where idempotency_key = v_key for update;
    if not found then return jsonb_build_object('status', 'retry_required'); end if;
    if v_job.payload is distinct from p_payload or v_job.id <> v_id
       or v_job.source <> 'catalog-review' or v_job.partition_key <> 'US:' || v_asin then
      return jsonb_build_object('status', 'conflict');
    end if;
  end if;
  -- No UPDATE: repeat requests cannot reset leases, attempts or completed work.
  return jsonb_build_object('status', case when v_inserted then 'inserted' else 'duplicate' end,
    'id', v_job.id, 'idempotencyKey', v_job.idempotency_key, 'state', v_job.state);
end;
$$;

revoke all on function public.block10_enqueue_catalog_review(jsonb) from public, anon, authenticated, service_role;
grant execute on function public.block10_enqueue_catalog_review(jsonb) to service_role;
commit;
