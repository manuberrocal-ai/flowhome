-- Disposable local fixture only. Roll back the second job after testing leases.
begin;
do $$
declare
  p jsonb := jsonb_build_object('schemaVersion',1,'intent','catalog-review','asin','B099999992',
    'market','US','productSlug',null,'revision',repeat('d',64));
  r jsonb; first_claim public.block10_jobs%rowtype; second_claim public.block10_jobs%rowtype;
begin
  r := public.block10_enqueue_catalog_review(p);
  if r->>'status' is distinct from 'inserted' then raise exception 'Fresh fixture required'; end if;
  select * into first_claim from public.block10_claim_catalog_reviews('retry-fixture-a',1,60);
  if first_claim.id is distinct from r->>'id' then raise exception 'Unexpected fixture claimed'; end if;
  -- Move only this test lease into the past; no clock or production changes.
  update public.block10_jobs set lease_expires_at=now()-interval '1 second' where id=first_claim.id;
  if public.block10_finish_job(first_claim.id,'retry-fixture-a',first_claim.lease_token,'completed',null,null,null) then
    raise exception 'Expired lease was allowed to finish';
  end if;
  select * into second_claim from public.block10_claim_catalog_reviews('retry-fixture-b',1,60);
  if second_claim.id is distinct from first_claim.id or second_claim.attempts <> 2
     or second_claim.lease_token = first_claim.lease_token then raise exception 'Reclaim failed'; end if;
  if not public.block10_finish_job(second_claim.id,'retry-fixture-b',second_claim.lease_token,
    'retry',now()+interval '1 minute','retryable','fixture_retry') then raise exception 'Retry was not recorded'; end if;
  if exists(select 1 from public.block10_claim_catalog_reviews('retry-fixture-c',1,60)) then raise exception 'Retry claimed before available_at'; end if;
  update public.block10_jobs set available_at=now()-interval '1 second' where id=first_claim.id;
  select * into second_claim from public.block10_claim_catalog_reviews('retry-fixture-c',1,60);
  if second_claim.attempts <> 3 then raise exception 'Attempts not preserved'; end if;
  if not public.block10_finish_job(second_claim.id,'retry-fixture-c',second_claim.lease_token,
    'completed',null,null,null) then raise exception 'Retry completion failed'; end if;
end;
$$;
rollback;
