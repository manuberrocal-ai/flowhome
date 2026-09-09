-- Manual capability rollback only; preserve every existing job and review.
begin;
drop function if exists public.block10_enqueue_catalog_review(jsonb);
commit;
