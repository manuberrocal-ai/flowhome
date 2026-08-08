-- Block 10 shared data platform. Prepared locally only; do not apply without
-- reviewed source, privacy, security, and operations approval.
begin;

create table if not exists public.block10_products (
  id text primary key check (id ~ '^[A-Za-z0-9:_-]{1,160}$'),
  compatibility_node_id text unique,
  source text not null check (source in ('catalog', 'manual', 'block9')),
  state text not null default 'active' check (state in ('draft', 'active', 'archived', 'unknown')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.block10_human_approvals (
  id text primary key check (id ~ '^[A-Za-z0-9:_-]{1,160}$'), action text not null check (action in ('publish','spend','destructive','legal_privacy','replay','rollback','kill_switch','feature_enable','experiment_activate')),
  actor_id text not null check (actor_id ~ '^[A-Za-z0-9:_-]{1,160}$'), state text not null default 'requested' check (state in ('requested','approved','rejected','revoked')),
  reason text not null check (length(reason) between 1 and 240), approved_at timestamptz, expires_at timestamptz,
  created_at timestamptz not null default now(), check ((state = 'approved') = (approved_at is not null)), check (expires_at is null or expires_at > created_at)
);
create table if not exists public.block10_merchants (
  id text primary key check (id ~ '^[A-Za-z0-9:_-]{1,160}$'), name text not null check (length(name) between 1 and 160), domain text,
  market text not null check (market in ('US','CA','MX','GB','DE','ES','unknown')), currency text not null check (currency in ('USD','CAD','MXN','GBP','EUR','unknown')),
  affiliate_tag text, authorised boolean not null default false, source text not null check (source in ('manual','affiliate-feed','amazon-creators-api','Unknown')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.block10_product_variants (
  id text primary key check (id ~ '^[A-Za-z0-9:_-]{1,160}$'), product_id text not null references public.block10_products(id) on delete restrict,
  marketplace_id text, marketplace_id_type text not null check (marketplace_id_type in ('asin','sku','gtin','unknown')),
  title text not null check (length(title) between 1 and 500), market text not null check (market in ('US','CA','MX','GB','DE','ES','unknown')),
  currency text not null check (currency in ('USD','CAD','MXN','GBP','EUR','unknown')), category text, source text not null check (source in ('catalog','manual','block9')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (market, marketplace_id, marketplace_id_type)
);
create table if not exists public.block10_price_snapshots (
  id text primary key, variant_id text not null references public.block10_product_variants(id) on delete restrict, merchant_id text not null references public.block10_merchants(id) on delete restrict,
  price numeric(14,2) not null check (price > 0), list_price numeric(14,2) check (list_price is null or list_price >= price), currency text not null check (currency in ('USD','CAD','MXN','GBP','EUR','unknown')),
  market text not null check (market in ('US','CA','MX','GB','DE','ES','unknown')), source text not null check (source in ('manual','affiliate-feed','amazon-creators-api','Unknown')),
  captured_at timestamptz not null, idempotency_key text not null unique check (idempotency_key ~ '^[A-Za-z0-9:_-]{3,160}$'), anomaly boolean not null default false, affiliate_url text,
  created_at timestamptz not null default now()
);
create table if not exists public.block10_offers (
  id text primary key, variant_id text not null references public.block10_product_variants(id) on delete restrict, merchant_id text not null references public.block10_merchants(id) on delete restrict,
  market text not null check (market in ('US','CA','MX','GB','DE','ES','unknown')), currency text not null check (currency in ('USD','CAD','MXN','GBP','EUR','unknown')),
  price numeric(14,2) not null check (price > 0), list_price numeric(14,2) check (list_price is null or list_price >= price), availability text not null check (availability in ('in-stock','out-of-stock','preorder','discontinued','unknown')),
  availability_captured_at timestamptz not null, shipping jsonb not null default '{}'::jsonb check (jsonb_typeof(shipping) = 'object'), coupons jsonb not null default '[]'::jsonb check (jsonb_typeof(coupons) = 'array'),
  affiliate_url text, source text not null check (source in ('manual','affiliate-feed','amazon-creators-api','Unknown')), captured_at timestamptz not null, expires_at timestamptz,
  last_snapshot_id text references public.block10_price_snapshots(id) on delete restrict, lifecycle text not null check (lifecycle in ('pending_review','active','suppressed','expired','unknown')),
  review text not null check (review in ('approved','rejected','pending','overridden','unknown')), confidence text not null check (confidence in ('high','medium','low','unknown')),
  idempotency_key text not null unique check (idempotency_key ~ '^[A-Za-z0-9:_-]{3,160}$'), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), check (expires_at is null or expires_at >= captured_at)
);
create table if not exists public.block10_trend_topics (
  id text primary key, slug text not null check (slug ~ '^[a-z0-9-]{1,160}$'), market text not null check (market in ('US','CA','MX','GB','DE','ES','unknown')),
  label text not null check (length(label) between 1 and 240), eligible boolean not null default false, source text not null check (source in ('manual','affiliate-feed','Unknown')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (slug, market)
);
create table if not exists public.block10_trend_signals (
  id text primary key, topic_id text not null references public.block10_trend_topics(id) on delete restrict, source text not null check (source in ('manual','affiliate-feed','Unknown')),
  delta numeric(5,4) not null check (delta between -1 and 1), weight numeric(4,3) not null check (weight > 0 and weight <= 1), captured_at timestamptz not null,
  idempotency_key text not null unique check (idempotency_key ~ '^[A-Za-z0-9:_-]{3,160}$'), anomaly boolean not null default false, created_at timestamptz not null default now()
);
create table if not exists public.block10_deal_candidates (
  id text primary key, variant_id text not null references public.block10_product_variants(id) on delete restrict, offer_id text references public.block10_offers(id) on delete restrict,
  topic_id text references public.block10_trend_topics(id) on delete restrict, market text not null check (market in ('US','CA','MX','GB','DE','ES','unknown')),
  currency text not null check (currency in ('USD','CAD','MXN','GBP','EUR','unknown')), deal_score jsonb not null check (jsonb_typeof(deal_score) = 'object'), trend_score jsonb not null check (jsonb_typeof(trend_score) = 'object'),
  label text not null check (label in ('lowest_price','good_deal','fair_price','unknown')), promotable boolean not null default false, generated_at timestamptz not null, source text not null check (source in ('rules','manual')), created_at timestamptz not null default now()
);
create table if not exists public.block10_content_assets (
  id text primary key, product_id text references public.block10_products(id) on delete restrict, state text not null check (state in ('draft','review','published','archived','unknown')),
  source text not null check (source in ('editorial','manual','import')), version text not null check (version ~ '^[A-Za-z0-9._-]{1,80}$'), approval_id text references public.block10_human_approvals(id) on delete restrict,
  publication_count integer not null default 0 check (publication_count >= 0), publication_limit integer not null default 0 check (publication_limit >= 0), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (publication_count <= publication_limit), check (state <> 'published' or approval_id is not null)
);
create table if not exists public.block10_campaigns (
  id text primary key, state text not null check (state in ('draft','approved','active','paused','completed','unknown')), source text not null check (source in ('manual','approved-import')),
  version text not null check (version ~ '^[A-Za-z0-9._-]{1,80}$'), spend_limit_minor bigint not null check (spend_limit_minor >= 0), spent_minor bigint not null default 0 check (spent_minor between 0 and spend_limit_minor), approval_id text references public.block10_human_approvals(id) on delete restrict,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), check ((state not in ('active') and spent_minor = 0) or approval_id is not null)
);
create table if not exists public.block10_experiments (
  id text not null check (id ~ '^[A-Za-z0-9:_-]{1,160}$'), version text not null check (version ~ '^[A-Za-z0-9._-]{1,80}$'), state text not null check (state in ('draft','active','paused','killed')),
  definition jsonb not null check (jsonb_typeof(definition) = 'object'), source text not null check (source in ('block6','manual')), approval_id text references public.block10_human_approvals(id) on delete restrict, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), primary key (id, version), check (state <> 'active' or approval_id is not null)
);
create table if not exists public.block10_analytics_events (
  id bigint generated always as identity primary key, event_name text not null check (event_name in ('affiliate_click','list_add','quiz_start','quiz_complete','calculator_used','compare_open','feed_follow','experiment_exposure')),
  payload jsonb not null check (jsonb_typeof(payload) = 'object'), trace_id text not null check (trace_id ~ '^[A-Za-z0-9:_-]{3,160}$'), occurred_at timestamptz not null, source text not null default 'analytics-sanitizer' check (source = 'analytics-sanitizer'),
  idempotency_key text not null unique check (idempotency_key ~ '^[A-Za-z0-9:_-]{3,160}$'), created_at timestamptz not null default now()
);
create table if not exists public.block10_jobs (
  id text primary key, idempotency_key text not null unique check (idempotency_key ~ '^[A-Za-z0-9:_-]{3,160}$'), source text not null check (source ~ '^[A-Za-z0-9:_-]{1,80}$'), partition_key text not null check (length(partition_key) between 1 and 160),
  payload jsonb not null check (jsonb_typeof(payload) = 'object'), state text not null default 'pending' check (state in ('pending','claimed','retry','dead','completed')), attempts integer not null default 0 check (attempts between 0 and 5),
  available_at timestamptz not null default now(), lease_token text unique, lease_owner_id text check (lease_owner_id is null or lease_owner_id ~ '^[A-Za-z0-9:_-]{1,80}$'), lease_expires_at timestamptz, failure_class text check (failure_class in ('retryable','uncertain','permanent')), failure_reason text,
  trace_id text not null check (trace_id ~ '^[A-Za-z0-9:_-]{3,160}$'), correlation_id text not null check (correlation_id ~ '^[A-Za-z0-9:_-]{1,120}$'), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check ((state = 'claimed') = (lease_token is not null and lease_owner_id is not null and lease_expires_at is not null))
);
create table if not exists public.block10_rate_limit_observations (
  source text not null check (source ~ '^[A-Za-z0-9:_-]{1,80}$'), observed_at timestamptz not null default now(), trace_id text not null check (trace_id ~ '^[A-Za-z0-9:_-]{3,160}$'), primary key (source, observed_at, trace_id)
);
create table if not exists public.block10_versioned_artifacts (
  id text not null check (id ~ '^[A-Za-z0-9:_-]{1,160}$'), version text not null check (version ~ '^[A-Za-z0-9._-]{1,80}$'), kind text not null check (kind in ('rule','model','prompt')), minimum_sample_size integer not null default 0, immutable boolean not null default true check (immutable), reviewed boolean not null default false, reviewed_at timestamptz, explanation text not null check (length(explanation) between 1 and 2000),
  source text not null check (source in ('reviewed','manual')), created_at timestamptz not null default now(), primary key (id, version), check ((reviewed = false) = (reviewed_at is null)), check ((kind = 'model' and minimum_sample_size >= 1) or (kind in ('rule','prompt') and minimum_sample_size = 0))
);
create table if not exists public.block10_feature_controls (
  id text primary key check (id ~ '^[A-Za-z0-9:_-]{1,160}$'), scope text not null check (scope in ('global','domain')), domain text,
  enabled boolean not null default false, kill_switch boolean not null default false, approval_id text references public.block10_human_approvals(id) on delete restrict,
  reason text not null check (length(reason) between 1 and 240), updated_at timestamptz not null default now(),
  check ((scope = 'global') = (domain is null)), check (not enabled or (not kill_switch and approval_id is not null))
);
create table if not exists public.block10_drift_observations (
  id bigint generated always as identity primary key, artifact_id text not null, artifact_version text not null,
  status text not null check (status in ('pass','drifted','insufficient_evidence')), sample_size integer not null check (sample_size >= 0), threshold numeric(8,6) not null check (threshold >= 0), observed_at timestamptz not null default now(), trace_id text not null check (trace_id ~ '^[A-Za-z0-9:_-]{3,160}$')
  , foreign key (artifact_id, artifact_version) references public.block10_versioned_artifacts(id, version) on delete restrict
);
create table if not exists public.block10_alert_decisions (
  id bigint generated always as identity primary key, trace_id text not null check (trace_id ~ '^[A-Za-z0-9:_-]{3,160}$'), severity text not null check (severity in ('warning','critical')),
  reason text not null check (length(reason) between 1 and 160), source text not null check (source ~ '^[A-Za-z0-9:_-]{1,80}$'), decided_at timestamptz not null default now(), resolved_at timestamptz
);
create table if not exists public.block10_governance_decisions (
  id text primary key check (id ~ '^[A-Za-z0-9:_-]{1,160}$'), action text not null check (action in ('publish_content','spend_campaign','destructive_change','legal_privacy_change','recommend','rollback_version')),
  outcome text not null check (outcome in ('allowed','blocked','rollback')), rule_artifact_id text, rule_artifact_version text, model_artifact_id text, model_artifact_version text, prompt_artifact_id text, prompt_artifact_version text,
  target_artifact_version text, approval_id text references public.block10_human_approvals(id) on delete restrict, explanation text not null check (length(explanation) between 1 and 2000), trace_id text not null check (trace_id ~ '^[A-Za-z0-9:_-]{3,160}$'), decided_at timestamptz not null default now(),
  foreign key (rule_artifact_id, rule_artifact_version) references public.block10_versioned_artifacts(id, version) on delete restrict, foreign key (model_artifact_id, model_artifact_version) references public.block10_versioned_artifacts(id, version) on delete restrict, foreign key (prompt_artifact_id, prompt_artifact_version) references public.block10_versioned_artifacts(id, version) on delete restrict,
  foreign key (rule_artifact_id, target_artifact_version) references public.block10_versioned_artifacts(id, version) on delete restrict,
  check (outcome = 'blocked' or (rule_artifact_id is not null and rule_artifact_version is not null)), check ((model_artifact_id is null and model_artifact_version is null and prompt_artifact_id is null and prompt_artifact_version is null) or (model_artifact_id is not null and model_artifact_version is not null and prompt_artifact_id is not null and prompt_artifact_version is not null)), check (outcome <> 'rollback' or (action = 'rollback_version' and target_artifact_version is not null and rule_artifact_version <> target_artifact_version)), check (action <> 'rollback_version' or outcome = 'rollback')
);
create table if not exists public.block10_admin_audit_log (
  id text primary key, actor_id text not null check (actor_id ~ '^[A-Za-z0-9:_-]{1,160}$'), action text not null check (action in ('review','override','replay','kill_switch','approval','feature_control','experiment_state','publish','spend','governance')),
  target_type text not null check (length(target_type) between 1 and 80), target_id text not null check (length(target_id) between 1 and 160), reason text not null check (length(reason) between 1 and 240),
  approval_id text references public.block10_human_approvals(id) on delete restrict, outcome text not null check (outcome in ('applied','blocked','rejected','no_change')), trace_id text not null check (trace_id ~ '^[A-Za-z0-9:_-]{3,160}$'), source text not null default 'block10-admin' check (source = 'block10-admin'), recorded_at timestamptz not null default now(),
  before_state jsonb, after_state jsonb, check ((outcome = 'applied') or (before_state is null and after_state is null))
);

-- A foreign key proves existence; these guarded service-side triggers also prove
-- that the referenced approval is currently approved, unexpired, and scoped to
-- the risky action. Direct public writes are revoked below.
create or replace function public.block10_has_current_approval(p_approval_id text, p_action text, p_at timestamptz)
returns boolean language sql security definer set search_path = pg_catalog, public as $$
  select exists (select 1 from public.block10_human_approvals a
    where a.id = p_approval_id and a.action = p_action and a.state = 'approved'
      and a.approved_at <= p_at and (a.expires_at is null or a.expires_at > p_at));
$$;
create or replace function public.block10_require_approved_approval(p_approval_id text, p_action text)
returns void language plpgsql security definer set search_path = pg_catalog, public as $$
begin
  if p_approval_id is null or not public.block10_has_current_approval(p_approval_id, p_action, now()) then
    raise exception 'A current approved % approval is required', p_action using errcode = '42501';
  end if;
end; $$;
create or replace function public.block10_require_reviewed_artifact(p_id text, p_version text, p_kind text)
returns void language plpgsql security definer set search_path = pg_catalog, public as $$
begin
  if p_id is null or p_version is null or not exists (
    select 1 from public.block10_versioned_artifacts a
    where a.id = p_id and a.version = p_version and a.kind = p_kind and a.immutable and a.reviewed and a.reviewed_at <= now()
  ) then raise exception 'A reviewed immutable % artifact is required', p_kind using errcode = '42501'; end if;
end; $$;
create or replace function public.block10_guard_content_asset()
returns trigger language plpgsql security definer set search_path = pg_catalog, public as $$
begin if new.state = 'published' then perform public.block10_require_approved_approval(new.approval_id, 'publish'); end if; return new; end; $$;
create or replace function public.block10_guard_campaign()
returns trigger language plpgsql security definer set search_path = pg_catalog, public as $$
begin if new.state = 'active' or new.spent_minor > 0 then perform public.block10_require_approved_approval(new.approval_id, 'spend'); end if; return new; end; $$;
create or replace function public.block10_guard_governance_decision()
returns trigger language plpgsql security definer set search_path = pg_catalog, public as $$
declare v_action text; v_drift_status text; v_drift_sample_size integer; v_minimum_sample_size integer;
begin
  if new.outcome = 'blocked' then return new; end if;
  perform public.block10_require_reviewed_artifact(new.rule_artifact_id, new.rule_artifact_version, 'rule');
  if new.model_artifact_id is not null then
    perform public.block10_require_reviewed_artifact(new.model_artifact_id, new.model_artifact_version, 'model');
    perform public.block10_require_reviewed_artifact(new.prompt_artifact_id, new.prompt_artifact_version, 'prompt');
    select a.minimum_sample_size into v_minimum_sample_size from public.block10_versioned_artifacts a where a.id = new.model_artifact_id and a.version = new.model_artifact_version;
    select d.status, d.sample_size into v_drift_status, v_drift_sample_size from public.block10_drift_observations d where d.artifact_id = new.model_artifact_id and d.artifact_version = new.model_artifact_version order by d.observed_at desc, d.id desc limit 1;
    if v_drift_status is distinct from 'pass' or v_drift_sample_size < v_minimum_sample_size then raise exception 'Latest model drift evidence is insufficient' using errcode = '42501'; end if;
  end if;
  v_action := case new.action when 'publish_content' then 'publish' when 'spend_campaign' then 'spend' when 'destructive_change' then 'destructive' when 'legal_privacy_change' then 'legal_privacy' else null end;
  if new.action = 'rollback_version' then
    perform public.block10_require_approved_approval(new.approval_id, 'rollback');
    perform public.block10_require_reviewed_artifact(new.rule_artifact_id, new.target_artifact_version, 'rule');
  elsif v_action is not null then perform public.block10_require_approved_approval(new.approval_id, v_action);
  end if;
  return new;
end; $$;
drop trigger if exists block10_content_asset_approval_guard on public.block10_content_assets;
create trigger block10_content_asset_approval_guard before insert or update on public.block10_content_assets for each row execute function public.block10_guard_content_asset();
drop trigger if exists block10_campaign_approval_guard on public.block10_campaigns;
create trigger block10_campaign_approval_guard before insert or update on public.block10_campaigns for each row execute function public.block10_guard_campaign();
drop trigger if exists block10_governance_approval_guard on public.block10_governance_decisions;
create trigger block10_governance_approval_guard before insert or update on public.block10_governance_decisions for each row execute function public.block10_guard_governance_decision();
create or replace function public.block10_guard_experiment()
returns trigger language plpgsql security definer set search_path = pg_catalog, public as $$ begin if new.state = 'active' then perform public.block10_require_approved_approval(new.approval_id, 'experiment_activate'); end if; return new; end; $$;
create or replace function public.block10_guard_feature_control()
returns trigger language plpgsql security definer set search_path = pg_catalog, public as $$ begin if new.enabled then perform public.block10_require_approved_approval(new.approval_id, 'feature_enable'); end if; return new; end; $$;
create or replace function public.block10_audit_append_only()
returns trigger language plpgsql security definer set search_path = pg_catalog, public as $$ begin raise exception 'Block 10 audit is append-only' using errcode = '42501'; end; $$;
create or replace function public.block10_validate_admin_audit()
returns trigger language plpgsql security definer set search_path = pg_catalog, public as $$
declare v_snapshot_text text;
begin
  if new.actor_id !~ '^[A-Za-z0-9:_-]{1,160}$' or new.target_id !~ '^[A-Za-z0-9:_-]{1,160}$' then
    raise exception 'Invalid admin audit actor or target id' using errcode = '22023';
  end if;
  if new.reason is null or length(btrim(new.reason)) not between 1 and 240 then
    raise exception 'Invalid admin audit reason' using errcode = '22023';
  end if;
  if new.before_state is not null and jsonb_typeof(new.before_state) <> 'object' then
    raise exception 'Admin audit before_state must be an object' using errcode = '22023';
  end if;
  if new.after_state is not null and jsonb_typeof(new.after_state) <> 'object' then
    raise exception 'Admin audit after_state must be an object' using errcode = '22023';
  end if;
  if new.outcome in ('blocked','rejected','no_change') and (new.before_state is not null or new.after_state is not null) then
    raise exception 'Non-applied admin audit outcomes cannot include snapshots' using errcode = '22023';
  end if;
  v_snapshot_text := coalesce(new.before_state::text, '') || ' ' || coalesce(new.after_state::text, '');
  if (new.reason || ' ' || v_snapshot_text) ~* '(@|https?://|token|secret|password|authorization|bearer|cookie|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+|[A-Za-z0-9_-]{32,})' then
    raise exception 'Admin audit reason or snapshots contain PII, secrets, URLs, or credential-like values' using errcode = '22023';
  end if;
  return new;
end; $$;
create or replace function public.block10_artifact_append_only()
returns trigger language plpgsql security definer set search_path = pg_catalog, public as $$ begin raise exception 'Block 10 versioned artifacts are append-only' using errcode = '42501'; end; $$;
create or replace function public.block10_validate_analytics_payload()
returns trigger language plpgsql security definer set search_path = pg_catalog, public as $$
declare v_allowed text[]; begin
  v_allowed := case new.event_name when 'affiliate_click' then array['page_type','cta_position','product_slug','category','discount','campaign','experiment'] when 'list_add' then array['page_type','cta_position','product_slug','category','campaign','experiment'] when 'quiz_start' then array['page_type','campaign','experiment'] when 'quiz_complete' then array['page_type','goal','ecosystem','budget','installation','extra','result_count','campaign','experiment'] when 'calculator_used' then array['page_type','device_type','estimated_savings','campaign','experiment'] when 'compare_open' then array['page_type','cta_position','campaign','experiment'] when 'feed_follow' then array['page_type','cta_position','campaign','experiment'] when 'experiment_exposure' then array['page_type','experiment_id','variant_id','assignment_version','mutual_exclusion_group','assignment_bucket','campaign','experiment'] else array[]::text[] end;
  if jsonb_typeof(new.payload) <> 'object' or exists (select 1 from jsonb_object_keys(new.payload) k where not (k = any(v_allowed))) or new.payload::text ~* '(@|https?://|token|secret|password|authorization|bearer|cookie)' then raise exception 'Invalid analytics payload' using errcode = '22023'; end if; return new;
end; $$;
create or replace function public.block10_write_admin_audit(p_actor_id text, p_action text, p_target_type text, p_target_id text, p_reason text, p_approval_id text, p_outcome text, p_trace_id text, p_before_state jsonb default null, p_after_state jsonb default null)
returns void language sql security definer set search_path = pg_catalog, public as $$
  insert into public.block10_admin_audit_log (id, actor_id, action, target_type, target_id, reason, approval_id, outcome, trace_id, before_state, after_state)
  values (encode(extensions.gen_random_bytes(16), 'hex'), p_actor_id, p_action, p_target_type, p_target_id, p_reason, p_approval_id, p_outcome, p_trace_id, p_before_state, p_after_state);
$$;

create or replace function public.block10_feature_enabled(p_domain text)
returns boolean language sql security definer set search_path = pg_catalog, public as $$
  select p_domain is not null
     and exists (select 1 from public.block10_feature_controls c where c.scope = 'global' and c.domain is null and c.enabled and not c.kill_switch)
     and exists (select 1 from public.block10_feature_controls c where c.scope = 'domain' and c.domain = p_domain and c.enabled and not c.kill_switch)
     and not exists (select 1 from public.block10_feature_controls c where c.scope = 'global' and c.domain is null and c.kill_switch)
     and not exists (select 1 from public.block10_feature_controls c where c.scope = 'domain' and c.domain = p_domain and c.kill_switch);
$$;

create or replace function public.block10_record_human_approval(
  p_id text, p_action text, p_actor_id text, p_state text, p_reason text,
  p_approved_at timestamptz, p_expires_at timestamptz, p_trace_id text,
  p_at timestamptz default now()
)
returns boolean language plpgsql security definer set search_path = pg_catalog, public as $$
declare
  v_now timestamptz := coalesce(p_at, now()); v_actor text; v_reason text; v_trace text;
  v_approval_id text := p_id; v_ok boolean := true;
begin
  v_actor := case when p_actor_id ~ '^[A-Za-z0-9:_-]{1,160}$' then p_actor_id else 'system' end;
  v_reason := left(regexp_replace(btrim(coalesce(p_reason, '')), '[^A-Za-z0-9 .,;:_-]', ' ', 'g'), 240);
  if v_reason !~ '^[A-Za-z0-9 .,;:_-]{1,240}$' or v_reason ~* '(@|https?://|token|secret|password|authorization|bearer|cookie)' then v_reason := 'approval request'; end if;
  v_trace := case when p_trace_id ~ '^[A-Za-z0-9:_-]{3,160}$' then p_trace_id else 'block10-approval' end;
  if p_id is null or p_id !~ '^[A-Za-z0-9:_-]{1,160}$' or p_actor_id is null or p_actor_id !~ '^[A-Za-z0-9:_-]{1,160}$'
     or p_action not in ('publish','spend','destructive','legal_privacy','replay','rollback','kill_switch','feature_enable','experiment_activate')
     or p_state not in ('requested','approved','rejected','revoked')
     or p_reason is null or length(btrim(p_reason)) not between 1 and 240
     or p_reason ~* '(@|https?://|token|secret|password|authorization|bearer|cookie)'
     or (p_state = 'approved' and (p_approved_at is null or p_approved_at > v_now or (p_expires_at is not null and p_expires_at <= v_now)))
     or (p_state <> 'approved' and p_approved_at is not null)
     or (p_expires_at is not null and p_expires_at <= coalesce(p_approved_at, v_now)) then v_ok := false;
  end if;
  if v_ok then
    perform 1 from public.block10_human_approvals where id = p_id for update;
    insert into public.block10_human_approvals (id, action, actor_id, state, reason, approved_at, expires_at)
      values (p_id, p_action, p_actor_id, p_state, btrim(p_reason), p_approved_at, p_expires_at)
      on conflict (id) do update set action=excluded.action, actor_id=excluded.actor_id, state=excluded.state,
        reason=excluded.reason, approved_at=excluded.approved_at, expires_at=excluded.expires_at;
  end if;
  perform public.block10_write_admin_audit(v_actor, 'approval', 'human_approval', case when v_approval_id ~ '^[A-Za-z0-9:_-]{1,160}$' then v_approval_id else 'unknown' end, v_reason,
    case when v_ok then p_id else null end, case when v_ok then 'applied' else 'blocked' end, v_trace);
  return v_ok;
end; $$;

create or replace function public.block10_set_feature_control(
  p_id text, p_scope text, p_domain text, p_enabled boolean, p_kill_switch boolean,
  p_approval_id text, p_reason text, p_trace_id text, p_at timestamptz default now()
)
returns boolean language plpgsql security definer set search_path = pg_catalog, public as $$
declare v_old public.block10_feature_controls%rowtype; v_approval public.block10_human_approvals%rowtype;
  v_now timestamptz := coalesce(p_at, now()); v_ok boolean := true; v_actor text := 'system'; v_reason text; v_trace text;
begin
  v_reason := left(regexp_replace(btrim(coalesce(p_reason, '')), '[^A-Za-z0-9 .,;:_-]', ' ', 'g'), 240);
  if v_reason is null or v_reason !~ '^[A-Za-z0-9 .,;:_-]{1,240}$' or v_reason ~* '(@|https?://|token|secret|password|authorization|bearer|cookie)' then v_reason := 'feature control request'; end if;
  v_trace := case when p_trace_id ~ '^[A-Za-z0-9:_-]{3,160}$' then p_trace_id else 'block10-feature' end;
  select * into v_old from public.block10_feature_controls where id = p_id for update;
  select * into v_approval from public.block10_human_approvals where id = p_approval_id;
  if v_approval.id is not null then v_actor := v_approval.actor_id; end if;
  if p_id is null or p_id !~ '^[A-Za-z0-9:_-]{1,160}$' or p_scope not in ('global','domain')
     or (p_scope = 'global' and p_domain is not null) or (p_scope = 'domain' and (p_domain is null or p_domain !~ '^[A-Za-z0-9._:-]{1,160}$'))
      or (p_enabled is true and p_kill_switch is true)
      or p_reason is null or length(btrim(p_reason)) not between 1 and 240
      or p_reason ~* '(@|https?://|token|secret|password|authorization|bearer|cookie|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+|[A-Za-z0-9_-]{32,})'
      or not public.block10_has_current_approval(p_approval_id, case when p_enabled and not p_kill_switch then 'feature_enable' else 'kill_switch' end, v_now) then v_ok := false;
  end if;
  if v_ok then
    insert into public.block10_feature_controls (id, scope, domain, enabled, kill_switch, approval_id, reason, updated_at)
       values (p_id, p_scope, p_domain, p_enabled and not p_kill_switch, p_kill_switch, p_approval_id, v_reason, v_now)
      on conflict (id) do update set scope=excluded.scope, domain=excluded.domain, enabled=excluded.enabled,
        kill_switch=excluded.kill_switch, approval_id=excluded.approval_id, reason=excluded.reason, updated_at=excluded.updated_at;
  end if;
  perform public.block10_write_admin_audit(v_actor, 'feature_control', 'feature_control', case when p_id ~ '^[A-Za-z0-9:_-]{1,160}$' then p_id else 'unknown' end, v_reason,
    case when v_approval.id is null then null else p_approval_id end, case when v_ok then 'applied' else 'blocked' end, v_trace,
    case when v_ok and v_old.id is not null then jsonb_build_object('enabled',v_old.enabled,'kill_switch',v_old.kill_switch) end,
    case when v_ok then jsonb_build_object('enabled',p_enabled and not p_kill_switch,'kill_switch',p_kill_switch) end);
  return v_ok;
end; $$;

create or replace function public.block10_set_experiment_state(
  p_id text, p_version text, p_state text, p_approval_id text, p_trace_id text, p_at timestamptz default now()
)
returns boolean language plpgsql security definer set search_path = pg_catalog, public as $$
declare v_experiment public.block10_experiments%rowtype; v_approval public.block10_human_approvals%rowtype;
  v_now timestamptz := coalesce(p_at, now()); v_ok boolean := true; v_actor text := 'system'; v_reason text := 'experiment state transition';
  v_action text := case when p_state = 'active' then 'experiment_activate' when p_state in ('paused','killed') then 'kill_switch' else null end;
begin
  select * into v_experiment from public.block10_experiments where id=p_id and version=p_version for update;
  select * into v_approval from public.block10_human_approvals where id=p_approval_id;
  if v_approval.id is not null then v_actor := v_approval.actor_id; end if;
  if p_id is null or p_id !~ '^[A-Za-z0-9:_-]{1,160}$' or p_version is null or p_version !~ '^[A-Za-z0-9._-]{1,80}$'
     or p_state not in ('active','paused','killed') or v_experiment.id is null
     or v_action is null or not public.block10_has_current_approval(p_approval_id, v_action, v_now) then v_ok := false;
  end if;
  if v_ok then
    update public.block10_experiments set state=p_state, approval_id=p_approval_id, updated_at=v_now where id=p_id and version=p_version;
  end if;
  perform public.block10_write_admin_audit(v_actor, 'experiment_state', 'experiment', case when p_id ~ '^[A-Za-z0-9:_-]{1,160}$' then p_id else 'unknown' end, v_reason,
    case when v_approval.id is null then null else p_approval_id end, case when v_ok then 'applied' else 'blocked' end,
    case when p_trace_id ~ '^[A-Za-z0-9:_-]{3,160}$' then p_trace_id else 'block10-experiment' end,
    case when v_ok then jsonb_build_object('state',v_experiment.state) end,
    case when v_ok then jsonb_build_object('state',p_state) end);
  return v_ok;
end; $$;

create or replace function public.block10_claim_jobs(p_worker_id text, p_limit integer, p_lease_seconds integer)
returns setof public.block10_jobs language plpgsql security definer set search_path = pg_catalog, public as $$
declare v_now timestamptz := now(); v_ids text[];
begin
  if p_worker_id is null or p_worker_id !~ '^[A-Za-z0-9:_-]{1,80}$' or p_limit is null or p_limit < 1 or p_limit > 100 or p_lease_seconds is null or p_lease_seconds < 1 or p_lease_seconds > 3600 then return; end if;
  update public.block10_jobs set state='dead', failure_class='permanent', failure_reason='lease_exhausted', lease_owner_id=null, lease_token=null, lease_expires_at=null, updated_at=v_now
    where state='claimed' and lease_expires_at <= v_now and attempts >= 5;
  with candidates as (
    select id from public.block10_jobs
    where ((state in ('pending','retry') and available_at <= v_now) or (state='claimed' and lease_expires_at <= v_now)) and attempts < 5
    order by available_at, id limit p_limit for update skip locked
  ), claimed as (
    update public.block10_jobs j set state='claimed', attempts=j.attempts+1, lease_owner_id=p_worker_id,
      lease_token=encode(extensions.gen_random_bytes(16),'hex'), lease_expires_at=v_now + make_interval(secs => p_lease_seconds), updated_at=v_now
      from candidates c where j.id=c.id returning j.*
  ) select array_agg(id) into v_ids from claimed;
  if v_ids is not null then return query select * from public.block10_jobs where id = any(v_ids) order by available_at, id; end if;
end; $$;

create or replace function public.block10_finish_job(p_id text, p_worker_id text, p_lease_token text, p_state text, p_next_attempt_at timestamptz, p_failure_class text, p_failure_reason text)
returns boolean language plpgsql security definer set search_path = pg_catalog, public as $$
declare v_state text := p_state; v_class text := p_failure_class; v_reason text := p_failure_reason;
begin
  if p_id is null or p_worker_id is null or p_worker_id !~ '^[A-Za-z0-9:_-]{1,80}$' or p_lease_token is null or p_lease_token !~ '^[A-Za-z0-9a-f]{32}$' or p_state not in ('completed','retry','dead')
     or (p_failure_class is not null and p_failure_class not in ('retryable','uncertain','permanent'))
     or (p_failure_reason is not null and (length(btrim(p_failure_reason)) not between 1 and 240 or p_failure_reason ~* '(@|https?://|token|secret|password|authorization|bearer|cookie)')) then return false; end if;
  if p_state = 'retry' and (p_next_attempt_at is null or p_next_attempt_at <= now()) then return false; end if;
  if p_state = 'completed' then v_class := null; v_reason := null; end if;
  update public.block10_jobs set state=case when v_state='retry' and attempts >= 5 then 'dead' else v_state end,
    available_at=case when v_state='retry' and attempts < 5 then p_next_attempt_at else available_at end,
    failure_class=case when v_state='retry' and attempts >= 5 then 'permanent' else v_class end,
    failure_reason=case when v_state='retry' and attempts >= 5 then 'retry_attempt_cap' else v_reason end,
    lease_owner_id=null, lease_token=null, lease_expires_at=null, updated_at=now()
    where id=p_id and state='claimed' and lease_owner_id=p_worker_id and lease_token=p_lease_token and lease_expires_at > now();
  return found;
end; $$;

create or replace function public.block10_replay_dead_job(p_job_id text, p_approval_id text, p_at timestamptz)
returns boolean language plpgsql security definer set search_path = pg_catalog, public as $$
declare v_job public.block10_jobs%rowtype; v_approval public.block10_human_approvals%rowtype; v_actor text := 'system'; v_reason text := 'invalid replay approval'; v_trace text := 'block10-replay'; v_before jsonb; v_after jsonb;
begin
  select * into v_job from public.block10_jobs where id=p_job_id for update;
  select * into v_approval from public.block10_human_approvals where id=p_approval_id;
  if v_approval.id is not null then v_actor := v_approval.actor_id; v_reason := left(regexp_replace(btrim(v_approval.reason), '[^A-Za-z0-9 .,;:_-]', ' ', 'g'), 240); if v_reason ~* '(@|https?://|token|secret|password|authorization|bearer|cookie)' then v_reason := 'replay approval'; end if; end if;
  if v_job.id is not null then v_trace := v_job.trace_id; end if;
  if v_job.id is null or not public.block10_has_current_approval(p_approval_id, 'replay', p_at) or v_job.state <> 'dead' or v_job.failure_class = 'uncertain' then
    perform public.block10_write_admin_audit(v_actor, 'replay', 'job', coalesce(nullif(p_job_id,''), 'unknown'), v_reason, case when v_approval.id is null then null else p_approval_id end, 'blocked', v_trace); return false;
  end if;
  v_before := jsonb_build_object('state', v_job.state, 'attempts', v_job.attempts, 'failure_class', v_job.failure_class);
  update public.block10_jobs set state='pending', attempts=0, available_at=p_at, failure_class=null, failure_reason=null, lease_owner_id=null, lease_token=null, lease_expires_at=null, updated_at=now() where id=p_job_id;
  v_after := jsonb_build_object('state', 'pending', 'attempts', 0);
  perform public.block10_write_admin_audit(v_actor, 'replay', 'job', p_job_id, v_reason, p_approval_id, 'applied', v_trace, v_before, v_after); return true;
end; $$;

create or replace function public.block10_publish_content_asset(
  p_asset_id text, p_approval_id text, p_trace_id text, p_at timestamptz
)
returns boolean language plpgsql security definer set search_path = pg_catalog, public as $$
declare
  v_asset public.block10_content_assets%rowtype;
  v_approval public.block10_human_approvals%rowtype;
  v_now timestamptz := coalesce(p_at, now());
  v_trace text := case when p_trace_id ~ '^[A-Za-z0-9:_-]{3,160}$' then p_trace_id else 'block10-publish' end;
  v_actor text := 'system';
  v_ok boolean := false;
begin
  select * into v_asset from public.block10_content_assets where id = p_asset_id for update;
  select * into v_approval from public.block10_human_approvals where id = p_approval_id;
  if v_approval.id is not null then v_actor := v_approval.actor_id; end if;
  if v_asset.id is not null and public.block10_feature_enabled('content')
     and public.block10_has_current_approval(p_approval_id, 'publish', v_now)
     and v_asset.state in ('draft','review') and v_asset.publication_count < v_asset.publication_limit then
    begin
      update public.block10_content_assets
         set state = 'published', approval_id = p_approval_id,
             publication_count = publication_count + 1, updated_at = v_now
       where id = p_asset_id and state in ('draft','review')
         and publication_count < publication_limit
         and public.block10_feature_enabled('content')
         and public.block10_has_current_approval(p_approval_id, 'publish', v_now);
      v_ok := found;
    exception when others then
      v_ok := false;
    end;
  end if;
  if v_ok then
    perform public.block10_write_admin_audit(v_actor, 'publish', 'content_asset', p_asset_id,
      'content publication reserved and applied', p_approval_id, 'applied', v_trace,
      jsonb_build_object('state', v_asset.state, 'publication_count', v_asset.publication_count),
      jsonb_build_object('state', 'published', 'publication_count', v_asset.publication_count + 1));
  else
    perform public.block10_write_admin_audit(v_actor, 'publish', 'content_asset',
      case when p_asset_id ~ '^[A-Za-z0-9:_-]{1,160}$' then p_asset_id else 'unknown' end,
      'content publication blocked', null, 'blocked', v_trace);
  end if;
  return v_ok;
end; $$;

create or replace function public.block10_reserve_campaign_spend(
  p_campaign_id text, p_delta_minor bigint, p_approval_id text, p_trace_id text, p_at timestamptz
)
returns boolean language plpgsql security definer set search_path = pg_catalog, public as $$
declare
  v_campaign public.block10_campaigns%rowtype;
  v_approval public.block10_human_approvals%rowtype;
  v_now timestamptz := coalesce(p_at, now());
  v_trace text := case when p_trace_id ~ '^[A-Za-z0-9:_-]{3,160}$' then p_trace_id else 'block10-spend' end;
  v_actor text := 'system';
  v_ok boolean := false;
begin
  select * into v_campaign from public.block10_campaigns where id = p_campaign_id for update;
  select * into v_approval from public.block10_human_approvals where id = p_approval_id;
  if v_approval.id is not null then v_actor := v_approval.actor_id; end if;
  if p_delta_minor is not null and p_delta_minor > 0 and v_campaign.id is not null
     and public.block10_feature_enabled('campaign')
     and public.block10_has_current_approval(p_approval_id, 'spend', v_now)
     and v_campaign.state in ('draft','approved','paused')
     and v_campaign.spent_minor + p_delta_minor <= v_campaign.spend_limit_minor then
    begin
      update public.block10_campaigns
         set state = 'active', approval_id = p_approval_id,
             spent_minor = spent_minor + p_delta_minor, updated_at = v_now
       where id = p_campaign_id and state in ('draft','approved','paused')
         and spent_minor + p_delta_minor <= spend_limit_minor
         and public.block10_feature_enabled('campaign')
         and public.block10_has_current_approval(p_approval_id, 'spend', v_now);
      v_ok := found;
    exception when others then
      v_ok := false;
    end;
  end if;
  if v_ok then
    perform public.block10_write_admin_audit(v_actor, 'spend', 'campaign', p_campaign_id,
      'campaign spend reserved and applied', p_approval_id, 'applied', v_trace,
      jsonb_build_object('state', v_campaign.state, 'spent_minor', v_campaign.spent_minor),
      jsonb_build_object('state', 'active', 'spent_minor', v_campaign.spent_minor + p_delta_minor));
  else
    perform public.block10_write_admin_audit(v_actor, 'spend', 'campaign',
      case when p_campaign_id ~ '^[A-Za-z0-9:_-]{1,160}$' then p_campaign_id else 'unknown' end,
      'campaign spend reservation blocked', null, 'blocked', v_trace);
  end if;
  return v_ok;
end; $$;

create or replace function public.block10_record_governance_decision(
  p_id text, p_action text, p_outcome text, p_rule_artifact_id text, p_rule_artifact_version text,
  p_model_artifact_id text, p_model_artifact_version text, p_prompt_artifact_id text,
  p_prompt_artifact_version text, p_target_artifact_version text, p_approval_id text,
  p_explanation text, p_trace_id text, p_decided_at timestamptz default now()
)
returns boolean language plpgsql security definer set search_path = pg_catalog, public as $$
declare
  v_now timestamptz := coalesce(p_decided_at, now());
  v_trace text := case when p_trace_id ~ '^[A-Za-z0-9:_-]{3,160}$' then p_trace_id else 'block10-governance' end;
  v_id text := case when p_id ~ '^[A-Za-z0-9:_-]{1,160}$' then p_id else 'governance' end;
  v_explanation text := left(regexp_replace(btrim(coalesce(p_explanation, '')), '[^A-Za-z0-9 .,;:_-]', ' ', 'g'), 2000);
  v_approval public.block10_human_approvals%rowtype;
  v_actor text := 'system';
  v_ok boolean := false;
  v_blocked_id text;
begin
  select * into v_approval from public.block10_human_approvals where id = p_approval_id;
  if p_action <> 'recommend' and v_approval.id is not null then v_actor := v_approval.actor_id; end if;
  if v_explanation is null or v_explanation !~ '^[A-Za-z0-9 .,;:_-]{1,2000}$'
     or v_explanation ~* '(@|https?://|token|secret|password|authorization|bearer|cookie)' then
    v_explanation := 'governance decision rejected';
  end if;
  begin
    insert into public.block10_governance_decisions
      (id, action, outcome, rule_artifact_id, rule_artifact_version, model_artifact_id, model_artifact_version,
       prompt_artifact_id, prompt_artifact_version, target_artifact_version, approval_id, explanation, trace_id, decided_at)
    values (v_id, p_action, p_outcome, p_rule_artifact_id, p_rule_artifact_version, p_model_artifact_id,
       p_model_artifact_version, p_prompt_artifact_id, p_prompt_artifact_version, p_target_artifact_version,
       p_approval_id, v_explanation, v_trace, v_now);
    v_ok := true;
  exception when others then
    v_ok := false;
  end;
  if v_ok then
    perform public.block10_write_admin_audit(v_actor, 'governance', 'governance_decision', v_id,
      'governance decision applied', p_approval_id, 'applied', v_trace);
  else
     v_blocked_id := left(v_id, 136) || ':blocked:' || substr(md5(v_trace || ':' || v_id), 1, 16);
    begin
      insert into public.block10_governance_decisions
        (id, action, outcome, explanation, trace_id, decided_at)
      values (v_blocked_id, case when p_action in ('publish_content','spend_campaign','destructive_change','legal_privacy_change','recommend','rollback_version') then p_action else 'recommend' end,
        'blocked', 'governance decision blocked', v_trace, v_now)
      on conflict (id) do nothing;
    exception when others then
      null;
    end;
    perform public.block10_write_admin_audit('system', 'governance', 'governance_decision', v_id,
      'governance decision blocked', null, 'blocked', v_trace);
  end if;
  return v_ok;
end; $$;

create trigger block10_experiment_approval_guard before insert or update on public.block10_experiments for each row execute function public.block10_guard_experiment();
create trigger block10_feature_control_approval_guard before insert or update on public.block10_feature_controls for each row execute function public.block10_guard_feature_control();
create trigger block10_analytics_payload_guard before insert or update on public.block10_analytics_events for each row execute function public.block10_validate_analytics_payload();
create trigger block10_admin_audit_validate before insert on public.block10_admin_audit_log for each row execute function public.block10_validate_admin_audit();
create trigger block10_admin_audit_append_only before update or delete on public.block10_admin_audit_log for each row execute function public.block10_audit_append_only();
create trigger block10_artifact_append_only before update or delete on public.block10_versioned_artifacts for each row execute function public.block10_artifact_append_only();

create index if not exists block10_snapshots_variant_captured_idx on public.block10_price_snapshots (variant_id, captured_at desc);
create index if not exists block10_offers_review_idx on public.block10_offers (lifecycle, review, expires_at);
create index if not exists block10_signals_topic_captured_idx on public.block10_trend_signals (topic_id, captured_at desc);
create index if not exists block10_events_occurred_idx on public.block10_analytics_events (event_name, occurred_at desc);
create index if not exists block10_jobs_claim_idx on public.block10_jobs (state, available_at, id) where state in ('pending','retry');
create index if not exists block10_jobs_lease_owner_idx on public.block10_jobs (lease_owner_id, lease_token, lease_expires_at) where state = 'claimed';
create index if not exists block10_jobs_expired_claimed_idx on public.block10_jobs (lease_expires_at, available_at, id) where state = 'claimed' and lease_expires_at is not null;
create index if not exists block10_jobs_trace_idx on public.block10_jobs (trace_id, correlation_id);
create index if not exists block10_rate_limit_source_idx on public.block10_rate_limit_observations (source, observed_at desc);
create index if not exists block10_audit_target_idx on public.block10_admin_audit_log (target_type, target_id, recorded_at desc);
create index if not exists block10_approvals_active_idx on public.block10_human_approvals (action, state, expires_at) where state = 'approved';
create index if not exists block10_feature_controls_scope_idx on public.block10_feature_controls (scope, domain, enabled, kill_switch);
create index if not exists block10_drift_artifact_idx on public.block10_drift_observations (artifact_id, observed_at desc);
create index if not exists block10_alert_trace_idx on public.block10_alert_decisions (trace_id, decided_at desc);
create index if not exists block10_governance_trace_idx on public.block10_governance_decisions (trace_id, decided_at desc);

-- Lifecycle is mapped, never duplicated: these views project existing Block 7 data.
create or replace view public.block10_user_preferences as select user_id, version, categories, market, frequency, types, consented, status, suppression_reason, consented_at, updated_at from public.lifecycle_preferences;
create or replace view public.block10_consent_records as select user_id, consent_version, action, suppression_reason, recorded_at from public.lifecycle_consent_history;

-- Tables and projection views are private. Service functions must enforce reviewed
-- transactions; no public, anon, or authenticated table write is ever granted.
alter table public.block10_products enable row level security;
alter table public.block10_human_approvals enable row level security;
alter table public.block10_merchants enable row level security;
alter table public.block10_product_variants enable row level security;
alter table public.block10_price_snapshots enable row level security;
alter table public.block10_offers enable row level security;
alter table public.block10_trend_topics enable row level security;
alter table public.block10_trend_signals enable row level security;
alter table public.block10_deal_candidates enable row level security;
alter table public.block10_content_assets enable row level security;
alter table public.block10_campaigns enable row level security;
alter table public.block10_experiments enable row level security;
alter table public.block10_analytics_events enable row level security;
alter table public.block10_jobs enable row level security;
alter table public.block10_rate_limit_observations enable row level security;
alter table public.block10_versioned_artifacts enable row level security;
alter table public.block10_feature_controls enable row level security;
alter table public.block10_drift_observations enable row level security;
alter table public.block10_alert_decisions enable row level security;
alter table public.block10_governance_decisions enable row level security;
alter table public.block10_admin_audit_log enable row level security;
revoke all on table public.block10_products, public.block10_human_approvals, public.block10_merchants, public.block10_product_variants, public.block10_price_snapshots, public.block10_offers, public.block10_trend_topics, public.block10_trend_signals, public.block10_deal_candidates, public.block10_content_assets, public.block10_campaigns, public.block10_experiments, public.block10_analytics_events, public.block10_jobs, public.block10_rate_limit_observations, public.block10_versioned_artifacts, public.block10_feature_controls, public.block10_drift_observations, public.block10_alert_decisions, public.block10_governance_decisions, public.block10_admin_audit_log from public, anon, authenticated;
revoke all on table public.block10_products, public.block10_human_approvals, public.block10_merchants, public.block10_product_variants, public.block10_price_snapshots, public.block10_offers, public.block10_trend_topics, public.block10_trend_signals, public.block10_deal_candidates, public.block10_content_assets, public.block10_campaigns, public.block10_experiments, public.block10_analytics_events, public.block10_jobs, public.block10_rate_limit_observations, public.block10_versioned_artifacts, public.block10_feature_controls, public.block10_drift_observations, public.block10_alert_decisions, public.block10_governance_decisions, public.block10_admin_audit_log from service_role;
revoke all on public.block10_user_preferences, public.block10_consent_records from public, anon, authenticated;
  revoke all on function public.block10_has_current_approval(text,text,timestamptz), public.block10_require_approved_approval(text,text), public.block10_require_reviewed_artifact(text,text,text), public.block10_guard_content_asset(), public.block10_guard_campaign(), public.block10_guard_governance_decision(), public.block10_guard_experiment(), public.block10_guard_feature_control(), public.block10_audit_append_only(), public.block10_validate_admin_audit(), public.block10_artifact_append_only(), public.block10_validate_analytics_payload(), public.block10_write_admin_audit(text,text,text,text,text,text,text,text,jsonb,jsonb), public.block10_feature_enabled(text), public.block10_record_human_approval(text,text,text,text,text,timestamptz,timestamptz,text,timestamptz), public.block10_set_feature_control(text,text,text,boolean,boolean,text,text,text,timestamptz), public.block10_set_experiment_state(text,text,text,text,text,timestamptz), public.block10_claim_jobs(text,integer,integer), public.block10_finish_job(text,text,text,text,timestamptz,text,text), public.block10_replay_dead_job(text,text,timestamptz), public.block10_publish_content_asset(text,text,text,timestamptz), public.block10_reserve_campaign_spend(text,bigint,text,text,timestamptz), public.block10_record_governance_decision(text,text,text,text,text,text,text,text,text,text,text,text,text,timestamptz) from public, anon, authenticated, service_role;
grant execute on function public.block10_feature_enabled(text), public.block10_record_human_approval(text,text,text,text,text,timestamptz,timestamptz,text,timestamptz), public.block10_set_feature_control(text,text,text,boolean,boolean,text,text,text,timestamptz), public.block10_set_experiment_state(text,text,text,text,text,timestamptz) to service_role;
grant execute on function public.block10_claim_jobs(text,integer,integer), public.block10_finish_job(text,text,text,text,timestamptz,text,text), public.block10_replay_dead_job(text,text,timestamptz) to service_role;
grant execute on function public.block10_publish_content_asset(text,text,text,timestamptz), public.block10_reserve_campaign_spend(text,bigint,text,text,timestamptz), public.block10_record_governance_decision(text,text,text,text,text,text,text,text,text,text,text,text,text,timestamptz) to service_role;

commit;
