-- LOCAL disposable database only, after migrations. Run with ON_ERROR_STOP.
-- This script rolls back all fixtures; it is not a concurrency/restart test.
begin;
do $$
declare
  p jsonb := jsonb_build_object('schemaVersion',1,'intent','catalog-review','asin','B012345678',
    'market','US','productSlug',null,'revision',repeat('a',64));
  result jsonb;
  expected_key text := 'job:v2:bbd0dc3c6329c841876e6121f505d35c67ce814a35bdcdd75110ebddf74c3e94';
  expected_id text := 'jobid:v2:54a51ed768385bdbbfd54737d037b64cc28df56e62d58d58d7368327f0f6dfb7';
begin
  if exists(select 1 from public.block10_jobs where idempotency_key = expected_key) then
    raise exception 'Fixture already exists; use a disposable database';
  end if;
  result := public.block10_enqueue_catalog_review(p);
  if result->>'status' is distinct from 'inserted' or result->>'id' is distinct from expected_id
     or result->>'idempotencyKey' is distinct from expected_key then
    raise exception 'Insertion or cross-language key parity failed';
  end if;
  update public.block10_jobs set state='completed', attempts=1 where id=expected_id;
  result := public.block10_enqueue_catalog_review(p);
  if result->>'status' is distinct from 'duplicate' or result->>'state' is distinct from 'completed' then
    raise exception 'Duplicate changed review state';
  end if;
  result := public.block10_enqueue_catalog_review(p || '{"productSlug":"different-model"}'::jsonb);
  if result->>'status' is distinct from 'conflict' then raise exception 'Identity conflict accepted'; end if;
  result := public.block10_enqueue_catalog_review(p || '{"price":99}'::jsonb);
  if result->>'status' is distinct from 'invalid_payload' then raise exception 'Commercial data accepted'; end if;
  result := public.block10_enqueue_catalog_review(p - 'productSlug');
  if result->>'status' is distinct from 'invalid_payload' then raise exception 'Missing identity field accepted'; end if;
  result := public.block10_enqueue_catalog_review(null);
  if result->>'status' is distinct from 'invalid_payload' then raise exception 'SQL null accepted'; end if;
  if has_function_privilege('anon', 'public.block10_enqueue_catalog_review(jsonb)', 'EXECUTE')
     or has_function_privilege('authenticated', 'public.block10_enqueue_catalog_review(jsonb)', 'EXECUTE') then
    raise exception 'Public RPC access was granted';
  end if;
  if not has_function_privilege('service_role', 'public.block10_enqueue_catalog_review(jsonb)', 'EXECUTE') then
    raise exception 'Service RPC grant missing';
  end if;
end;
$$;
rollback;
