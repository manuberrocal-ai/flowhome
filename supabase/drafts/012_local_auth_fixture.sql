-- LOCAL DISPOSABLE DATABASE ONLY. This does not authenticate any real user.
-- Replace the null UID stub only for explicit editorial decision fixture databases.
do $$ begin
  if current_database() !~ '^flowhome_test_fh17[a-z0-9]+$' then
    raise exception 'Requires named local editorial fixture database';
  end if;
end; $$;
create or replace function auth.uid() returns uuid language sql stable set search_path='' as $$
  select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid
$$;
