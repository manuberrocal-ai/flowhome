-- Local disposable PostgreSQL, after migrations 001-010. All fixtures roll back.
begin;
do $$
declare p jsonb := jsonb_build_object('schemaVersion',1,'intent','catalog-review','asin','B099999993',
  'market','US','productSlug',null,'revision',repeat('e',64));
  result jsonb; review_job public.block10_jobs%rowtype; legacy_job public.block10_jobs%rowtype;
  blocked boolean := false;
begin
  result := public.block10_enqueue_catalog_review(p);
  if result->>'status' is distinct from 'inserted' then raise exception 'Fresh fixture required'; end if;
  insert into public.block10_jobs(id,idempotency_key,source,partition_key,payload,trace_id,correlation_id)
    values('fixture-legacy-job','fixture-legacy-key','other-source','US','{}','fixture-trace','fixture-correlation');
  select * into legacy_job from public.block10_claim_jobs('legacy-worker',1,60);
  if legacy_job.id is distinct from 'fixture-legacy-job' then raise exception 'Legacy consumer claimed review'; end if;
  if exists(select 1 from public.block10_claim_jobs('legacy-worker',100,60)) then raise exception 'Legacy queue leaked review'; end if;
  select * into review_job from public.block10_claim_catalog_reviews('review-worker',1,60);
  if review_job.id is distinct from result->>'id' then raise exception 'Review consumer claimed wrong source'; end if;
  if not public.block10_finish_job(review_job.id,'review-worker',review_job.lease_token,'completed',null,null,null) then
    raise exception 'Review completion failed';
  end if;
  if (select count(*) from public.block10_review_job_audit where job_id=review_job.id) <> 3 then
    raise exception 'Expected enqueue, claim and completion audit events';
  end if;
  if exists(select 1 from public.block10_review_job_audit where job_id='fixture-legacy-job') then raise exception 'Unrelated job audited'; end if;
  begin
    update public.block10_review_job_audit set next_state='pending' where job_id=review_job.id;
  exception when insufficient_privilege then blocked := true;
  end;
  if not blocked then raise exception 'Audit mutation permitted'; end if;
  blocked := false;
  begin
    update public.block10_jobs set payload=payload || '{"price":99}' where id=review_job.id;
  exception when invalid_parameter_value then blocked := true;
  end;
  if not blocked then raise exception 'Review identity mutation permitted'; end if;
  if has_function_privilege('service_role','public.block10_claim_scoped_jobs(text,integer,integer,boolean)','EXECUTE')
     or has_table_privilege('service_role','public.block10_review_job_audit','INSERT')
     or has_table_privilege('anon','public.block10_review_job_audit','SELECT') then raise exception 'Unexpected direct permissions'; end if;
end;
$$;
rollback;
