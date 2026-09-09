-- Disposable plain PostgreSQL ONLY. Minimal Supabase dependencies for SQL tests.
-- auth.uid() is a null fixture: this does NOT test hosted Auth or cross-user RLS.
-- Roles are cluster-wide, so a second disposable database may share them.
do $$
declare role_name text;
begin
  foreach role_name in array array['anon','authenticated','service_role'] loop
    if not exists(select 1 from pg_roles where rolname=role_name) then
      execute format('create role %I nologin',role_name);
    elsif exists(select 1 from pg_roles where rolname=role_name and (rolsuper or rolcanlogin)) then
      raise exception 'Unexpected privileged fixture role';
    end if;
  end loop;
end;
$$;
create schema auth;
create schema extensions;
create extension pgcrypto with schema extensions;
create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb);
create function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;
