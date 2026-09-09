-- Disposable LOCAL database only. Changes revert; existing fixtures are preserved.
begin;
-- Transaction-scoped local re-enablement to check the real decision consumer.
-- ROLLBACK restores the previously suspended function grant.
grant execute on function public.block10_decide_catalog_review(jsonb) to authenticated;
do $$
declare
  v_user uuid := 'aaaaaaaa-4444-4444-8444-444444444444';
  v_job text;
  v_result jsonb;
  v_count bigint;
begin
  select count(*) into v_count from public.block10_editorial_provisioning_audit;
  if exists(select 1 from auth.users where id=v_user) then raise exception 'Fixture already exists'; end if;
  insert into auth.users(id) values(v_user);
  insert into public.block10_editorial_reviewers values(v_user,true,clock_timestamp()+interval '1 hour');
  update public.block10_editorial_reviewers set active=false where user_id=v_user;
  -- Identical writes must not fabricate a new administrative transition.
  update public.block10_editorial_reviewers set active=false where user_id=v_user;
  if (select count(*) from public.block10_editorial_provisioning_audit) <> v_count+2 then raise exception 'Reviewer audit count'; end if;
  if not exists(select 1 from public.block10_editorial_provisioning_audit where target_id=v_user::text
    and operation='update' and before_state->'active'='true'::jsonb and after_state->'active'='false'::jsonb
    and database_session_role=session_user) then raise exception 'Before/after/session lost'; end if;
  v_result := public.block10_enqueue_catalog_review(jsonb_build_object('schemaVersion',1,'intent','catalog-review',
    'asin','B099999997','market','US','productSlug',null,'revision',repeat('a',64)));
  if v_result->>'status' is distinct from 'inserted' then raise exception 'Fixture job exists'; end if;
  v_job := v_result->>'id';
  insert into public.block10_editorial_heads(job_id,revision,evidence_digest,evidence_valid_until,evidence_revoked)
    values(v_job,repeat('a',64),repeat('b',64),clock_timestamp()+interval '1 hour',false);
  update public.block10_editorial_heads set evidence_revoked=true where job_id=v_job;
  if (select count(*) from public.block10_editorial_provisioning_audit) <> v_count+4 then raise exception 'Evidence audit count'; end if;
  if exists(select 1 from public.block10_editorial_provisioning_audit where target_id=v_job
    and (before_state ? 'version' or after_state ? 'version')) then raise exception 'Decision version leaked into provisioning'; end if;
  begin
    delete from public.block10_editorial_provisioning_audit where target_id=v_job;
    raise exception 'Audit deletion allowed';
  exception when insufficient_privilege then null;
  end;
  execute 'set local role authenticated';
  begin
    insert into public.block10_editorial_reviewers values(v_user,false,clock_timestamp());
    raise exception 'Reviewer self-enrollment allowed';
  exception when insufficient_privilege then null;
  end;
  begin
    perform 1 from public.block10_editorial_provisioning_audit;
    raise exception 'Audit disclosed to authenticated';
  exception when insufficient_privilege then null;
  end;
  execute 'reset role';
  execute 'set local role service_role';
  begin
    update public.block10_editorial_heads set evidence_revoked=false where job_id=v_job;
    raise exception 'Service self-certification allowed';
  exception when insufficient_privilege then null;
  end;
  execute 'reset role';
  update public.block10_editorial_reviewers set active=true where user_id=v_user;
  update public.block10_editorial_heads set evidence_revoked=false where job_id=v_job;
  perform set_config('request.jwt.claim.sub',v_user::text,true);
  execute 'set local role authenticated';
  v_result := public.block10_decide_catalog_review(jsonb_build_object('jobId',v_job,'revision',repeat('a',64),
    'evidenceDigest',repeat('b',64),'expectedVersion',0,'decision','approve','reason','evidence-reviewed'));
  execute 'reset role';
  if v_result->>'status' is distinct from 'recorded' then raise exception 'Decision consumer regression'; end if;
  if (select count(*) from public.block10_editorial_provisioning_audit) <> v_count+6 then
    raise exception 'Version-only decision fabricated provisioning event'; end if;
  delete from public.block10_editorial_reviewers where user_id=v_user;
  if not exists(select 1 from public.block10_editorial_provisioning_audit where target_id=v_user::text
    and operation='delete' and before_state is not null and after_state is null) then raise exception 'Removal not recorded'; end if;
end;
$$;
rollback;
