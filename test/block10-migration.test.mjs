import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile, readdir } from 'node:fs/promises';

const migration = new URL('../supabase/migrations/006_shared_data_platform.sql', import.meta.url);
const rollback = new URL('../supabase/rollbacks/006_shared_data_platform.rollback.sql', import.meta.url);
const migrationsDirectory = new URL('../supabase/migrations/', import.meta.url);

test('migration runner directory contains unique forward versions only', async () => {
  const files = (await readdir(migrationsDirectory)).filter((file) => /^\d+_.*\.sql$/.test(file));
  const versions = files.map((file) => file.match(/^\d+/)[0]);

  assert.equal(new Set(versions).size, versions.length, 'migration versions must be unique');
  assert.deepEqual(
    files.filter((file) => /(rollback|manual|destructive)/i.test(file)),
    [],
    'manual or destructive SQL must remain outside the migration runner directory',
  );
});

test('migration is additive, transactional, constrained, indexed, private, and maps lifecycle', async () => {
  const sql = await readFile(migration, 'utf8');
  for (const text of ['begin;', 'commit;', 'block10_products', 'block10_merchants', 'block10_product_variants', 'block10_price_snapshots', 'block10_offers', 'block10_trend_signals', 'block10_deal_candidates', 'block10_content_assets', 'block10_campaigns', 'block10_experiments', 'block10_analytics_events', 'block10_jobs', 'block10_human_approvals', 'block10_feature_controls', 'block10_drift_observations', 'block10_alert_decisions', 'block10_governance_decisions', 'block10_admin_audit_log', 'enable row level security', 'revoke all on table', 'lifecycle_preferences', 'lifecycle_consent_history', 'idempotency_key text not null unique', 'block10_jobs_claim_idx', 'publication_count <= publication_limit', "state <> 'published' or approval_id is not null", "spent_minor between 0 and spend_limit_minor", 'block10_require_approved_approval', 'block10_campaign_approval_guard', 'minimum_sample_size integer not null default 0', "kind = 'model' and minimum_sample_size >= 1", "kind in ('rule','prompt') and minimum_sample_size = 0", 'foreign key (rule_artifact_id, target_artifact_version)', 'block10_require_reviewed_artifact', 'a.kind = p_kind', 'a.immutable and a.reviewed', 'order by d.observed_at desc, d.id desc', "v_drift_status is distinct from 'pass'", 'v_drift_sample_size < v_minimum_sample_size', "if new.outcome = 'blocked' then return new"]) assert.match(sql, new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
  assert.match(sql, /action[^\r\n]*rollback_version/i);
  assert.match(sql, /rollback_version[^\r\n]*outcome = 'rollback'/i);
  const experimentsTable = sql.match(/create table if not exists public\.block10_experiments[\s\S]*?\n\);/i)?.[0] ?? '';
  assert.match(experimentsTable, /primary key \(id, version\)/i);
  assert.doesNotMatch(experimentsTable, /id text primary key/i);
  assert.doesNotMatch(sql, /grant\s+(insert|update|delete|all)\b[^;]*\b(anon|authenticated|public)/i);
  assert.match(sql, /revoke all on function[^;]*block10_require_reviewed_artifact/i);
  assert.match(sql, /check \(outcome = 'blocked' or \(rule_artifact_id is not null and rule_artifact_version is not null\)\)/i);
  assert.match(sql, /target_artifact_version[^;]*rule_artifact_version <> target_artifact_version/i);
   for (const text of ['block10_has_current_approval', 'approved_at <= p_at', 'block10_write_admin_audit', 'SECURITY DEFINER', 'lease_exhausted', "state='claimed' and lease_expires_at <= v_now", 'for update skip locked', 'lease_owner_id=p_worker_id', 'lease_expires_at > now()', 'retry_attempt_cap', 'block10_replay_dead_job', "block10_has_current_approval(p_approval_id, 'replay', p_at)", "failure_class = 'uncertain'", 'block10_write_admin_audit', 'block10_jobs_expired_claimed_idx', 'from service_role', 'grant execute on function public.block10_claim_jobs', 'block10_finish_job(text,text,text,text,timestamptz,text,text)', 'block10_replay_dead_job(text,text,timestamptz)']) assert.match(sql, new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
});

test('rollback refuses destructive work while Block 10-owned rows exist', async () => {
  const sql = await readFile(rollback, 'utf8');
  assert.match(sql, /Refusing destructive Block 10 rollback/);
  assert.match(sql, /if v_rows <> 0 then raise exception/i);
  assert.match(sql, /begin;[\s\S]*commit;/i);
});

test('rollback drops every function created by the forward migration', async () => {
  const [sql, down] = await Promise.all([readFile(migration, 'utf8'), readFile(rollback, 'utf8')]);
  const names = [...sql.matchAll(/create or replace function public\.([A-Za-z0-9_]+)\s*\(/gi)].map((match) => match[1]);

  assert.ok(names.length > 0, 'forward migration must define functions');
  for (const name of new Set(names)) {
    assert.match(down, new RegExp(`drop function if exists public\\.${name}\\s*\\(`, 'i'), `missing rollback for ${name}`);
  }
});

test('rollback drops lifecycle triggers before the first function drop and on the right tables', async () => {
  const sql = await readFile(rollback, 'utf8');
  const triggerTables = [
    ['block10_content_asset_approval_guard', 'block10_content_assets'],
    ['block10_campaign_approval_guard', 'block10_campaigns'],
    ['block10_governance_approval_guard', 'block10_governance_decisions'],
    ['block10_experiment_approval_guard', 'block10_experiments'],
    ['block10_feature_control_approval_guard', 'block10_feature_controls'],
    ['block10_analytics_payload_guard', 'block10_analytics_events'],
    ['block10_admin_audit_validate', 'block10_admin_audit_log'],
    ['block10_admin_audit_append_only', 'block10_admin_audit_log'],
    ['block10_artifact_append_only', 'block10_versioned_artifacts'],
  ];

  const firstFunctionDrop = sql.search(/drop function if exists/i);
  assert.ok(firstFunctionDrop >= 0, 'missing first function drop');

  for (const [trigger, table] of triggerTables) {
    const pattern = new RegExp(`drop trigger if exists ${trigger} on public\\.${table};`, 'i');
    assert.match(sql, pattern);
    assert.ok(sql.search(pattern) < firstFunctionDrop, `${trigger} must be dropped before the first function drop`);
  }

  assert.equal((sql.match(/drop trigger if exists block10_admin_audit_validate on public\.block10_admin_audit_log;/gi) ?? []).length, 1);
});

test('admin audit enforces SQL-side immutable, conservative reason and snapshot sanitization', async () => {
  const sql = await readFile(migration, 'utf8');
  const auditTable = sql.match(/create table if not exists public\.block10_admin_audit_log[\s\S]*?\n\);/i)?.[0] ?? '';
  assert.match(auditTable, /approval_id text references public\.block10_human_approvals\(id\)/i);
  for (const action of ['review', 'override', 'replay', 'kill_switch', 'approval', 'feature_control', 'experiment_state', 'publish', 'spend', 'governance']) assert.match(auditTable, new RegExp(`'${action}'`));
  assert.match(sql, /create or replace function public\.block10_validate_admin_audit\(\)[\s\S]*?new\.actor_id[\s\S]*?new\.target_id[\s\S]*?btrim\(new\.reason\)[\s\S]*?jsonb_typeof\(new\.before_state\)[\s\S]*?jsonb_typeof\(new\.after_state\)[\s\S]*?new\.outcome in \('blocked','rejected','no_change'\)[\s\S]*?new\.before_state::text[\s\S]*?https\?:\/\/[\s\S]*?token\|secret\|password\|authorization\|bearer\|cookie/i);
  assert.match(sql, /create trigger block10_admin_audit_validate before insert on public\.block10_admin_audit_log/i);
  assert.match(sql, /create trigger block10_admin_audit_append_only before update or delete on public\.block10_admin_audit_log/i);
  assert.match(sql, /revoke all on function[^;]*block10_validate_admin_audit/i);
});

test('durable queue blockers have static SQL coverage and rollback cleanup', async () => {
  const sql = await readFile(migration, 'utf8');
  const down = await readFile(rollback, 'utf8');
   const claimJobs = sql.match(/create or replace function public\.block10_claim_jobs[\s\S]*?end;\s*\$\$;/i)?.[0] ?? '';
  assert.match(claimJobs, /lease_exhausted/i);
  assert.match(claimJobs, /attempts >= 5/i);
  assert.match(sql, /state='claimed'[\s\S]*?lease_owner_id=p_worker_id[\s\S]*?lease_token=p_lease_token[\s\S]*?lease_expires_at > now\(\)/i);
  assert.match(sql, /state='pending'[\s\S]*?attempts=0[\s\S]*?block10_write_admin_audit/i);
  assert.match(down, /drop function if exists public\.block10_replay_dead_job[\s\S]*?drop function if exists public\.block10_write_admin_audit[\s\S]*?drop function if exists public\.block10_has_current_approval/i);
});

test('controlled approval, feature, and experiment mutators are audited and service-only', async () => {
  const sql = await readFile(migration, 'utf8');
  const down = await readFile(rollback, 'utf8');
  for (const name of ['block10_feature_enabled', 'block10_record_human_approval', 'block10_set_feature_control', 'block10_set_experiment_state']) assert.match(sql, new RegExp(`create or replace function public\\.${name}`));
  assert.match(sql, /global[\s\S]*not c\.kill_switch[\s\S]*scope = 'domain'[\s\S]*c\.domain = p_domain/i);
  assert.match(sql, /p_action not in \('publish','spend'[\s\S]*'feature_enable','experiment_activate'\)/i);
  assert.match(sql, /from public\.block10_human_approvals where id = p_id for update/i);
  assert.match(sql, /on conflict \(id\) do update/i);
  assert.match(sql, /'approval',[\s\S]*case when v_ok then 'applied' else 'blocked'/i);
  assert.match(sql, /case when p_enabled and not p_kill_switch then 'feature_enable' else 'kill_switch' end/i);
  assert.match(sql, /p_enabled and not p_kill_switch/i);
  assert.match(sql, /where id=p_id and version=p_version for update/i);
  assert.match(sql, /'experiment_activate'[\s\S]*'kill_switch'/i);
  assert.match(sql, /'experiment_state',[\s\S]*case when v_ok then 'applied' else 'blocked'/i);
  assert.match(sql, /grant execute on function public\.block10_feature_enabled[\s\S]*to service_role/i);
  assert.match(sql, /revoke all on function[^;]*block10_set_experiment_state/i);
  assert.match(down, /drop function if exists public\.block10_set_experiment_state[\s\S]*drop function if exists public\.block10_feature_enabled/i);
});

test('Block 10 publication, spend reservation, and governance mutators are atomic and narrow', async () => {
  const sql = await readFile(migration, 'utf8');
  const down = await readFile(rollback, 'utf8');
  const extractFunctionBody = (source, name) => {
    const match = source.match(new RegExp(String.raw`create or replace function public\.${name}[\s\S]*?end;\s*\$\$;`, 'i'));
    assert.ok(match, `missing function body for ${name}`);
    return match[0];
  };
  const publish = extractFunctionBody(sql, 'block10_publish_content_asset');
  const spend = extractFunctionBody(sql, 'block10_reserve_campaign_spend');
  const governance = extractFunctionBody(sql, 'block10_record_governance_decision');
  for (const text of ["block10_feature_enabled('content')", "block10_has_current_approval(p_approval_id, 'publish', v_now)", 'publication_count < publication_limit', 'publication_count = publication_count + 1', "state = 'published'", 'exception when others', 'perform public.block10_write_admin_audit', "'applied'", "'blocked'"]) assert.match(publish, new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
  for (const text of ['p_delta_minor > 0', "block10_feature_enabled('campaign')", "block10_has_current_approval(p_approval_id, 'spend', v_now)", 'spent_minor + p_delta_minor <= spend_limit_minor', 'spent_minor = spent_minor + p_delta_minor', 'exception when others', 'perform public.block10_write_admin_audit', "'applied'", "'blocked'"]) assert.match(spend, new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
  for (const text of ['exception when others', 'perform public.block10_write_admin_audit', "'applied'", "'blocked'", "on conflict (id) do nothing"]) assert.match(governance, new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
  assert.match(sql, /No external spend occurs|spend reserved/i);
  assert.match(sql, /grant execute on function public\.block10_publish_content_asset[\s\S]*?block10_reserve_campaign_spend[\s\S]*?block10_record_governance_decision[\s\S]*?to service_role/i);
  assert.match(sql, /revoke all on function[^;]*block10_record_governance_decision/i);
  assert.match(down, /drop function if exists public\.block10_record_governance_decision[\s\S]*?drop function if exists public\.block10_reserve_campaign_spend[\s\S]*?drop function if exists public\.block10_publish_content_asset/i);
});

test('Block 10 edge cases preserve kill precedence, sanitized reasons, approval actors, and bounded ids', async () => {
  const sql = await readFile(migration, 'utf8');
  const feature = sql.match(/create or replace function public\.block10_feature_enabled[\s\S]*?end;\s*\$\$;/i)?.[0] ?? '';
  const featureControl = sql.match(/create or replace function public\.block10_set_feature_control[\s\S]*?end;\s*\$\$;/i)?.[0] ?? '';
  const governance = sql.match(/create or replace function public\.block10_record_governance_decision[\s\S]*?end;\s*\$\$;/i)?.[0] ?? '';

  assert.match(feature, /exists[\s\S]*scope = 'global'[\s\S]*not c\.kill_switch[\s\S]*scope = 'domain'[\s\S]*c\.domain = p_domain/i);
  assert.match(feature, /not exists[\s\S]*scope = 'global'[\s\S]*c\.kill_switch/i);
  assert.match(feature, /not exists[\s\S]*scope = 'domain'[\s\S]*c\.domain = p_domain[\s\S]*c\.kill_switch/i);
  assert.match(featureControl, /p_reason ~\* '[^']*eyJ\[A-Za-z0-9_-\]\+\\\.[^']*\[A-Za-z0-9_-\]\{32,\}/i);
  assert.match(featureControl, /values \(p_id,[\s\S]*p_approval_id, v_reason, v_now\)/i);
  assert.doesNotMatch(featureControl, /values \(p_id,[\s\S]*p_approval_id, btrim\(p_reason\),/i);
  assert.match(featureControl, /case when v_ok then 'applied' else 'blocked'[\s\S]*case when v_ok and v_old\.id is not null/si);
  assert.match(governance, /select \* into v_approval from public\.block10_human_approvals where id = p_approval_id/i);
  assert.match(governance, /p_action <> 'recommend' and v_approval\.id is not null then v_actor := v_approval\.actor_id/i);
  assert.match(governance, /block10_write_admin_audit\(v_actor, 'governance'/i);
  assert.match(governance, /v_blocked_id := left\(v_id, 136\) \|\| ':blocked:' \|\| substr\(md5\([^)]*\), 1, 16\)/i);
});
