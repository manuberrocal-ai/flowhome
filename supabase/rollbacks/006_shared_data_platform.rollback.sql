-- Block 10 manual rollback. DO NOT execute automatically and never run this
-- against a database containing Block 10 rows. First disable flags/workers,
-- export reviewed evidence, obtain security/privacy approval, then verify every
-- count below is zero. A non-zero count is a deliberate refusal to destroy data.
begin;
do $$
declare v_rows bigint;
begin
  select coalesce(sum(n), 0) into v_rows from (
    select count(*) n from public.block10_products union all select count(*) from public.block10_human_approvals union all select count(*) from public.block10_merchants union all select count(*) from public.block10_product_variants union all select count(*) from public.block10_price_snapshots union all select count(*) from public.block10_offers union all select count(*) from public.block10_trend_topics union all select count(*) from public.block10_trend_signals union all select count(*) from public.block10_deal_candidates union all select count(*) from public.block10_content_assets union all select count(*) from public.block10_campaigns union all select count(*) from public.block10_experiments union all select count(*) from public.block10_analytics_events union all select count(*) from public.block10_jobs union all select count(*) from public.block10_rate_limit_observations union all select count(*) from public.block10_versioned_artifacts union all select count(*) from public.block10_feature_controls union all select count(*) from public.block10_drift_observations union all select count(*) from public.block10_alert_decisions union all select count(*) from public.block10_governance_decisions union all select count(*) from public.block10_admin_audit_log
  ) counts;
  if v_rows <> 0 then raise exception 'Refusing destructive Block 10 rollback: % Block 10-owned rows exist. Follow the reviewed export/retention procedure in BLOCK10_DATA_PLATFORM_RUNBOOK.md.', v_rows; end if;
end $$;
drop view if exists public.block10_consent_records;
  drop view if exists public.block10_user_preferences;
drop trigger if exists block10_content_asset_approval_guard on public.block10_content_assets;
drop trigger if exists block10_campaign_approval_guard on public.block10_campaigns;
drop trigger if exists block10_governance_approval_guard on public.block10_governance_decisions;
drop trigger if exists block10_experiment_approval_guard on public.block10_experiments;
drop trigger if exists block10_feature_control_approval_guard on public.block10_feature_controls;
drop trigger if exists block10_analytics_payload_guard on public.block10_analytics_events;
drop trigger if exists block10_admin_audit_validate on public.block10_admin_audit_log;
drop trigger if exists block10_admin_audit_append_only on public.block10_admin_audit_log;
drop trigger if exists block10_artifact_append_only on public.block10_versioned_artifacts;
drop function if exists public.block10_record_governance_decision(text,text,text,text,text,text,text,text,text,text,text,text,text,timestamptz);
drop function if exists public.block10_reserve_campaign_spend(text,bigint,text,text,timestamptz);
drop function if exists public.block10_publish_content_asset(text,text,text,timestamptz);
drop function if exists public.block10_replay_dead_job(text,text,timestamptz);
drop function if exists public.block10_set_experiment_state(text,text,text,text,text,timestamptz);
drop function if exists public.block10_set_feature_control(text,text,text,boolean,boolean,text,text,text,timestamptz);
drop function if exists public.block10_record_human_approval(text,text,text,text,text,timestamptz,timestamptz,text,timestamptz);
drop function if exists public.block10_feature_enabled(text);
drop function if exists public.block10_finish_job(text,text,text,text,timestamptz,text,text);
drop function if exists public.block10_claim_jobs(text,integer,integer);
drop function if exists public.block10_write_admin_audit(text,text,text,text,text,text,text,text,jsonb,jsonb);
drop function if exists public.block10_validate_analytics_payload();
drop function if exists public.block10_validate_admin_audit();
drop function if exists public.block10_audit_append_only();
drop function if exists public.block10_artifact_append_only();
drop function if exists public.block10_guard_feature_control();
drop function if exists public.block10_guard_experiment();
drop function if exists public.block10_guard_governance_decision();
drop function if exists public.block10_guard_campaign();
drop function if exists public.block10_guard_content_asset();
drop function if exists public.block10_require_reviewed_artifact(text,text,text);
drop function if exists public.block10_require_approved_approval(text,text);
drop function if exists public.block10_has_current_approval(text,text,timestamptz);
drop table if exists public.block10_governance_decisions;
drop table if exists public.block10_alert_decisions;
drop table if exists public.block10_drift_observations;
drop table if exists public.block10_feature_controls;
drop table if exists public.block10_admin_audit_log;
drop table if exists public.block10_versioned_artifacts;
drop table if exists public.block10_rate_limit_observations;
drop table if exists public.block10_jobs;
drop table if exists public.block10_analytics_events;
drop table if exists public.block10_experiments;
drop table if exists public.block10_campaigns;
drop table if exists public.block10_content_assets;
drop table if exists public.block10_deal_candidates;
drop table if exists public.block10_trend_signals;
drop table if exists public.block10_trend_topics;
drop table if exists public.block10_offers;
drop table if exists public.block10_price_snapshots;
drop table if exists public.block10_product_variants;
drop table if exists public.block10_merchants;
drop table if exists public.block10_products;
drop table if exists public.block10_human_approvals;
commit;
