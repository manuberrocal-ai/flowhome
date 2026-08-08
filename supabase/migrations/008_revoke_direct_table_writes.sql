-- Close remaining direct table-write grants while preserving function execution grants.
begin;

revoke all on table
  public.cart_sync_entries,
  public.lifecycle_subscribers,
  public.lifecycle_preferences,
  public.lifecycle_consent_history,
  public.lifecycle_jobs,
  public.lifecycle_dispatch_leases,
  public.lifecycle_webhook_events
from public, anon, authenticated, service_role;

do $$
declare
  v_write_grant_count integer;
begin
  select count(*)
  into v_write_grant_count
  from information_schema.role_table_grants
  where table_schema = 'public'
    and table_name in (
      'cart_sync_entries',
      'lifecycle_subscribers',
      'lifecycle_preferences',
      'lifecycle_consent_history',
      'lifecycle_jobs',
      'lifecycle_dispatch_leases',
      'lifecycle_webhook_events'
    )
    and upper(grantee) in ('PUBLIC', 'ANON', 'AUTHENTICATED', 'SERVICE_ROLE')
    and upper(privilege_type) in ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER');

  if v_write_grant_count <> 0 then
    raise exception 'Direct write grants remain on protected tables';
  end if;
end;
$$;

commit;
