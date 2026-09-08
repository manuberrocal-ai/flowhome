-- Manual capability rollback: stop new review claims but preserve audit/data
-- and keep legacy consumers isolated. Re-enable only through reviewed migration.
begin;
revoke execute on function public.block10_claim_catalog_reviews(text,integer,integer) from service_role;
commit;
