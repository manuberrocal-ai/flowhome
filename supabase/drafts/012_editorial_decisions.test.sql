-- Draft regression suite. Disposable LOCAL Supabase fixture only, after draft 012.
-- Synthetic JWT settings test the DB boundary, never real authentication.
-- Use psql ON_ERROR_STOP. All fixture changes roll back.
begin;
do $$
declare
  v_actor uuid := 'aaaaaaaa-1111-4111-8111-111111111111';
  v_job text;
  v_intent jsonb;
  v_result jsonb;
  v_payload jsonb := jsonb_build_object('schemaVersion',1,'intent','catalog-review','asin','B099999992',
    'market','US','productSlug',null,'revision',repeat('a',64));
  v_table text;
  v_case record;
begin
  if exists(select 1 from auth.users where id=v_actor) then raise exception 'Fixture user already exists'; end if;
  insert into auth.users(id) values(v_actor);
  v_result := public.block10_enqueue_catalog_review(v_payload);
  if v_result->>'status' is distinct from 'inserted' then raise exception 'Fixture job already exists'; end if;
  v_job := v_result->>'id';
  v_intent := jsonb_build_object('jobId',v_job,'revision',repeat('a',64),
    'evidenceDigest',repeat('b',64),'expectedVersion',0,'decision','approve','reason','evidence-reviewed');
  perform set_config('request.jwt.claim.sub',v_actor::text,true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',v_actor,'role','authenticated')::text,true);
  execute 'set local role authenticated';
  v_result := public.block10_decide_catalog_review(v_intent);
  execute 'reset role';
  if v_result->>'status' is distinct from 'unauthorized' then raise exception 'Unlisted user accepted'; end if;
  insert into public.block10_editorial_reviewers values(v_actor,true,clock_timestamp()+interval '1 hour');
  execute 'set local role authenticated';
  v_result := public.block10_decide_catalog_review(v_intent);
  execute 'reset role';
  if v_result->>'status' is distinct from 'unregistered_evidence' then raise exception 'Unregistered evidence accepted'; end if;
  insert into public.block10_editorial_heads(job_id,revision,evidence_digest,evidence_valid_until,evidence_revoked)
    values(v_job,repeat('a',64),repeat('b',64),clock_timestamp()+interval '1 hour',false);
  for v_case in select * from (values
    ('{"expectedVersion":null}'::jsonb,'invalid_intent'),
    ('{"expectedVersion":"0"}'::jsonb,'invalid_intent'),
    ('{"expectedVersion":-1}'::jsonb,'invalid_intent'),
    ('{"expectedVersion":0.5}'::jsonb,'invalid_intent'),
    ('{"expectedVersion":9007199254740991}'::jsonb,'invalid_intent'),
    ('{"decision":null}'::jsonb,'invalid_intent'),
    ('{"reason":null}'::jsonb,'invalid_intent'),
    ('{"jobId":null}'::jsonb,'invalid_intent'),
    ('{"evidenceDigest":null}'::jsonb,'invalid_intent'),
    ('{"revision":null}'::jsonb,'invalid_intent'),
    (jsonb_build_object('revision',repeat('c',64)),'stale_revision'),
    (jsonb_build_object('evidenceDigest',repeat('c',64)),'stale_evidence'),
    ('{"expectedVersion":3}'::jsonb,'version_conflict')
  ) as cases(patch,status) loop
    execute 'set local role authenticated';
    v_result := public.block10_decide_catalog_review(v_intent || v_case.patch);
    execute 'reset role';
    if v_result->>'status' is distinct from v_case.status then raise exception 'Invalid intent matrix failed'; end if;
  end loop;
  perform set_config('request.jwt.claim.sub','',true);
  execute 'set local role authenticated';
  v_result := public.block10_decide_catalog_review(v_intent);
  execute 'reset role';
  if v_result->>'status' is distinct from 'unauthorized' then raise exception 'Missing UID accepted'; end if;
  perform set_config('request.jwt.claim.sub',v_actor::text,true);
  update public.block10_editorial_reviewers set active=false where user_id=v_actor;
  execute 'set local role authenticated';
  v_result := public.block10_decide_catalog_review(v_intent);
  execute 'reset role';
  if v_result->>'status' is distinct from 'unauthorized' then raise exception 'Revoked reviewer accepted'; end if;
  update public.block10_editorial_reviewers set active=true,expires_at=clock_timestamp()-interval '1 second' where user_id=v_actor;
  execute 'set local role authenticated';
  v_result := public.block10_decide_catalog_review(v_intent);
  execute 'reset role';
  if v_result->>'status' is distinct from 'unauthorized' then raise exception 'Expired reviewer accepted'; end if;
  update public.block10_editorial_reviewers set expires_at=clock_timestamp()+interval '1 hour' where user_id=v_actor;
  update public.block10_editorial_heads set evidence_valid_until=clock_timestamp()-interval '1 second' where job_id=v_job;
  execute 'set local role authenticated';
  v_result := public.block10_decide_catalog_review(v_intent);
  execute 'reset role';
  if v_result->>'status' is distinct from 'stale_evidence' then raise exception 'Expired evidence accepted'; end if;
  update public.block10_editorial_heads set evidence_valid_until=clock_timestamp()+interval '1 hour' where job_id=v_job;
  execute 'set local role authenticated';
  v_result := public.block10_decide_catalog_review(v_intent || '{"actorId":"injected"}'::jsonb);
  execute 'reset role';
  if v_result->>'status' is distinct from 'invalid_intent' then raise exception 'Injected identity accepted'; end if;
  execute 'set local role authenticated';
  v_result := public.block10_decide_catalog_review(v_intent);
  execute 'reset role';
  if v_result->>'status' is distinct from 'recorded' or v_result->>'version' is distinct from '1'
    or v_result->'publicationAuthorized' is distinct from 'false'::jsonb then raise exception 'Recording contract failed'; end if;
  execute 'set local role authenticated';
  v_result := public.block10_decide_catalog_review(v_intent);
  execute 'reset role';
  if v_result->>'status' is distinct from 'duplicate' then raise exception 'Lost acknowledgement replay failed'; end if;
  execute 'set local role authenticated';
  v_result := public.block10_decide_catalog_review(v_intent || '{"decision":"reject","reason":"insufficient-evidence"}'::jsonb);
  execute 'reset role';
  if v_result->>'status' is distinct from 'version_conflict' then raise exception 'Conflicting replay accepted'; end if;
  if (select count(*) from public.block10_editorial_decisions where job_id=v_job) <> 1
    or (select version from public.block10_editorial_heads where job_id=v_job) <> 1 then raise exception 'Replay changed durable state'; end if;
  if (select actor_id from public.block10_editorial_decisions where job_id=v_job) <> v_actor then raise exception 'Wrong actor persisted'; end if;
  execute 'set local role authenticated';
  v_result := public.block10_decide_catalog_review(v_intent || '{"expectedVersion":1,"decision":"reject","reason":"editorial-correction-required"}'::jsonb);
  execute 'reset role';
  if v_result->>'status' is distinct from 'recorded' or v_result->>'version' is distinct from '2' then
    raise exception 'Next legitimate decision failed'; end if;
  if (select count(*) from public.block10_editorial_decisions where job_id=v_job) <> 2
    or (select version from public.block10_editorial_heads where job_id=v_job) is distinct from 2::bigint then
    raise exception 'Next version and event disagree'; end if;
  execute 'set local role authenticated';
  begin
    update public.block10_editorial_heads set version=99 where job_id=v_job;
    raise exception 'Direct version write accepted';
  exception when insufficient_privilege then null;
  end;
  execute 'reset role';
  update public.block10_editorial_heads set evidence_revoked=true where job_id=v_job;
  execute 'set local role authenticated';
  v_result := public.block10_decide_catalog_review(v_intent);
  execute 'reset role';
  if v_result->>'status' is distinct from 'stale_evidence' then raise exception 'Revoked evidence accepted'; end if;
  begin
    delete from public.block10_editorial_decisions where job_id=v_job;
    raise exception 'Audit deletion accepted';
  exception when insufficient_privilege then null;
  end;
  foreach v_table in array array['block10_editorial_reviewers','block10_editorial_heads','block10_editorial_decisions'] loop
    if has_table_privilege('authenticated','public.'||v_table,'SELECT,INSERT,UPDATE,DELETE')
      or has_table_privilege('anon','public.'||v_table,'SELECT,INSERT,UPDATE,DELETE')
      or has_table_privilege('service_role','public.'||v_table,'SELECT,INSERT,UPDATE,DELETE') then raise exception 'Unexpected direct table grant'; end if;
  end loop;
  if has_function_privilege('anon','public.block10_decide_catalog_review(jsonb)','EXECUTE')
    or has_function_privilege('service_role','public.block10_decide_catalog_review(jsonb)','EXECUTE') then raise exception 'Unexpected RPC grant'; end if;
end;
$$;
rollback;
