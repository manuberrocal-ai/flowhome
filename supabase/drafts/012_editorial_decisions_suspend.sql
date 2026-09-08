-- DRAFT operational suspension, not a destructive rollback.
-- Apply only to the explicitly authorized database. No automatic remote use.
-- Preserves events, versions, evidence and memberships for investigation/recovery.
begin;
revoke all on function public.block10_decide_catalog_review(jsonb)
  from public, anon, authenticated, service_role;
commit;
-- Re-enablement requires a separately reviewed grant and the remaining gates.
-- Never drop decision tables or reset versions to make a retry succeed.
