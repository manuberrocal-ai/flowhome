/** Pure Block 12 contracts. They do not open connections or mutate infrastructure. */

export const BLOCK12_DOMAINS = [
  'site_flow_availability',
  'broken_retailer_ctas',
  'expired_offers',
  'ingestion_lag',
  'jobs_queues_apis',
  'cwv_budgets',
  'indexation',
  'traffic_conversion_citability',
  'consent_security_incidents',
  'anomalies',
] as const;

export type Block12Domain = typeof BLOCK12_DOMAINS[number];
export type Severity = 'sev1' | 'sev2' | 'sev3' | 'sev4';
export type EvidenceKind =
  | 'real_local'
  | 'synthetic'
  | 'mocked'
  | 'simulated'
  | 'externally_blocked'
  | 'time_volume_dependent';
export type ConnectionState =
  | 'connected_local'
  | 'definition_present_remote_execution_unobserved'
  | 'not_connected';
export type DecisionState = 'continue' | 'revise' | 'defer' | 'stop' | 'externally_blocked';
export type Cadence = 'daily' | 'weekly' | 'monthly' | 'quarterly';

const DECISION_STATES = new Set<DecisionState>([
  'continue',
  'revise',
  'defer',
  'stop',
  'externally_blocked',
]);

export type Evidence = Readonly<{
  kind: EvidenceKind;
  reference: string;
  observed: boolean;
  note: string;
}>;

export type ProvisionalSlo = Readonly<{
  target: string;
  window: string;
  measurementSource: string;
  observed: false;
}>;

export type OperationalContract = Readonly<{
  domain: Block12Domain;
  title: string;
  slo: ProvisionalSlo;
  severity: Severity;
  trigger: string;
  alertChannel: string;
  connection: ConnectionState;
  owner: Readonly<{ role: string; humanAssignment: 'pending' }>;
  responseTarget: string;
  runbookAnchor: string;
  rollback: string;
  escalation: string;
  postmortem: string;
  cadence: Cadence;
  evidence: readonly Evidence[];
}>;

export const BLAMELESS_POSTMORTEM_TEMPLATE =
  'BLOCK12_RUNBOOKS.md#blameless-postmortem-template';

const localEvidence = (reference: string, note: string): Evidence => ({
  kind: 'real_local',
  reference: `local definition/artefact observed: ${reference}`,
  observed: true,
  note,
});

const syntheticEvidence = (reference: string, note: string): Evidence => ({
  kind: 'synthetic',
  reference,
  observed: false,
  note,
});

const blockedEvidence = (reference: string, note: string): Evidence => ({
  kind: 'externally_blocked',
  reference,
  observed: false,
  note,
});

const mockedEvidence = (reference: string, note: string): Evidence => ({
  kind: 'mocked',
  reference,
  observed: false,
  note,
});

const simulatedEvidence = (reference: string, note: string): Evidence => ({
  kind: 'simulated',
  reference,
  observed: false,
  note,
});

const timeVolumeEvidence = (reference: string, note: string): Evidence => ({
  kind: 'time_volume_dependent',
  reference,
  observed: false,
  note,
});

type Definition = Readonly<{
  domain: Block12Domain;
  title: string;
  slo: string;
  window: string;
  source: string;
  severity: Severity;
  trigger: string;
  channel: string;
  connection: ConnectionState;
  role: string;
  response: string;
  cadence: Cadence;
  evidence: readonly Evidence[];
}>;

const definitions: readonly Definition[] = [
  {
    domain: 'site_flow_availability',
    title: 'Site and critical-flow availability',
    slo: 'Candidate 99.9% availability; critical flow 100% synthetic release check',
    window: '30 days for candidate SLO; every release for synthetic check',
    source: 'local test gates; future deployed uptime source not connected',
    severity: 'sev1',
    trigger: 'candidate availability below 99.9% or critical-flow release check fails',
    channel: 'local test record; remote alert channel pending',
    connection: 'definition_present_remote_execution_unobserved',
    role: 'Engineering/reliability owner',
    response: '15 minutes',
    cadence: 'daily',
    evidence: [localEvidence('npm test / npm run typecheck', 'local artefact observed; execution is a separate gate'), syntheticEvidence('release critical-flow fixture', 'synthetic, not user traffic'), simulatedEvidence('flag disable/restore drill', 'pure simulation'), blockedEvidence('deployed uptime monitor', 'not connected')],
  },
  {
    domain: 'broken_retailer_ctas',
    title: 'Retailer CTA integrity',
    slo: '100% contract-valid CTA per release; remote destination status Unknown',
    window: 'Each release and weekly review',
    source: 'links:check and local CTA contracts; no remote destination probe',
    severity: 'sev2',
    trigger: 'invalid canonical CTA or known broken local link',
    channel: 'local links/test record; commercial escalation channel pending',
    connection: 'connected_local',
    role: 'Commercial owner',
    response: '4 hours',
    cadence: 'daily',
    evidence: [localEvidence('npm run links:check', 'local check only'), syntheticEvidence('CTA contract fixtures', 'synthetic cases'), blockedEvidence('retailer destination telemetry', 'remote status Unknown')],
  },
  {
    domain: 'expired_offers',
    title: 'Offer freshness and expiry',
    slo: '0 expired offers surfaced; price freshness 7d and availability freshness 24h',
    window: 'Daily freshness review',
    source: 'local deals:detect and Block 8 freshness contracts; fixtures/reports may be used',
    severity: 'sev2',
    trigger: 'expired offer appears in a surfaced catalog or freshness threshold is exceeded',
    channel: 'local quality/data record; alert channel pending',
    connection: 'connected_local',
    role: 'Data owner',
    response: '4 hours',
    cadence: 'daily',
    evidence: [localEvidence('npm run deals:detect', 'local definition/artefact; not productive monitoring'), syntheticEvidence('Block 8 offer fixtures', 'synthetic contract'), mockedEvidence('Block 8 freshness adapter', 'mock boundary'), blockedEvidence('live retailer feed', 'not connected')],
  },
  {
    domain: 'ingestion_lag',
    title: 'Source ingestion lag',
    slo: 'p95 lag ≤15 minutes',
    window: 'Rolling 24 hours; provisional Block 10 threshold',
    source: 'Block 10 queue/lag contract and local fixtures',
    severity: 'sev2',
    trigger: 'p95 lag exceeds 15 minutes or source freshness fails',
    channel: 'local data record; remote alert channel pending',
    connection: 'not_connected',
    role: 'Data/automation owner',
    response: '4 hours',
    cadence: 'daily',
    evidence: [syntheticEvidence('Block 10 lag fixture', 'contract only'), mockedEvidence('Block 10 queue/lag adapter', 'mock boundary'), timeVolumeEvidence('source volume window', 'requires time and source volume'), blockedEvidence('active source connector', 'not connected')],
  },
  {
    domain: 'jobs_queues_apis',
    title: 'Jobs, queues, and APIs',
    slo: 'Fail-closed queue/API invariants; no unbounded retry or lost idempotency',
    window: 'Every local test run and future production window',
    source: 'typecheck/tests and Block 10 queue contracts',
    severity: 'sev1',
    trigger: 'invariant violation, DLQ growth, unsafe retry, or API error boundary breach',
    channel: 'local test record; security/engineering channel pending',
    connection: 'connected_local',
    role: 'Engineering owner',
    response: '30 minutes',
    cadence: 'daily',
    evidence: [localEvidence('npm run typecheck and focused tests', 'local artefact observed; execution is a separate gate'), syntheticEvidence('queue/DLQ fixtures', 'synthetic contract'), mockedEvidence('queue/DLQ adapter', 'mock boundary'), blockedEvidence('active production queue', 'not connected')],
  },
  {
    domain: 'cwv_budgets',
    title: 'CWV and performance budgets',
    slo: 'Lighthouse 90/95/95/95; LCP ≤2.5 seconds; CLS ≤0.1; TBT ≤200ms',
    window: 'Three-sample local release check; field CWV 30d candidate',
    source: 'lighthouse:mobile and existing SEO budgets',
    severity: 'sev2',
    trigger: 'any provisional budget fails or required metric is missing',
    channel: 'local Lighthouse record; UX escalation channel pending',
    connection: 'connected_local',
    role: 'UX/accessibility owner',
    response: '1 business day',
    cadence: 'weekly',
    evidence: [localEvidence('npm run lighthouse:mobile', 'local definition/artefact observed; execution is a separate gate'), simulatedEvidence('budget regression drill', 'pure simulation'), blockedEvidence('field CWV telemetry', 'not connected')],
  },
  {
    domain: 'indexation',
    title: 'Indexation and SEO budgets',
    slo: 'Existing SEO budgets and local canonical/robots/sitemap contracts remain valid',
    window: 'Each release and weekly search window',
    source: 'seo:audit and local build-output contracts; search exports future',
    severity: 'sev2',
    trigger: 'local SEO contract failure or comparable search evidence indicates regression',
    channel: 'local SEO record; search-owner channel pending',
    connection: 'connected_local',
    role: 'SEO/growth owner',
    response: '1 business day',
    cadence: 'weekly',
    evidence: [localEvidence('npm run seo:audit', 'local contract'), blockedEvidence('GSC/Bing current validation', 'external source not connected')],
  },
  {
    domain: 'traffic_conversion_citability',
    title: 'Traffic, conversion, and citability outcomes',
    slo: 'Use comparable windows, Wilson 95% intervals, and ≥30 outcomes per segment; no early lift claim',
    window: 'D0/D30/D60/D90 like-for-like windows',
    source: 'GSC/GA4/Bing/Amazon exports only after approval; current records are baselines',
    severity: 'sev3',
    trigger: 'pre-agreed interval/threshold decision rule is met with sufficient volume',
    channel: 'scorecard; analytics/privacy channel pending',
    connection: 'not_connected',
    role: 'Analytics owner',
    response: '3 business days',
    cadence: 'weekly',
    evidence: [syntheticEvidence('90-day gate fixtures', 'time/volume protocol only'), mockedEvidence('aggregate outcome adapter', 'mock boundary'), timeVolumeEvidence('D0/D30/D60/D90 outcomes', 'requires comparable time and volume'), blockedEvidence('approved current outcome exports', 'not connected')],
  },
  {
    domain: 'consent_security_incidents',
    title: 'Consent and security incidents',
    slo: 'Consent fail-closed and no PII/secret leakage in local contracts',
    window: 'Every release and incident window',
    source: 'local privacy/security tests and audit contracts',
    severity: 'sev1',
    trigger: 'consent bypass, PII/secret exposure, or security control failure',
    channel: 'restricted local incident record; security channel pending',
    connection: 'connected_local',
    role: 'Security/privacy owner',
    response: '15 minutes',
    cadence: 'daily',
    evidence: [localEvidence('local privacy/security tests', 'technical contract only'), blockedEvidence('external incident channel', 'not connected')],
  },
  {
    domain: 'anomalies',
    title: 'Operational anomalies',
    slo: 'Deterministic anomaly detection with bounded false-positive review; provisional thresholds per source',
    window: 'Daily local review; monthly threshold calibration',
    source: 'Block 8–10 anomaly contracts and synthetic fixtures',
    severity: 'sev2',
    trigger: 'anomaly contract fires or unexplained change survives triage',
    channel: 'local data record; alert channel pending',
    connection: 'not_connected',
    role: 'Data/automation owner',
    response: '4 hours',
    cadence: 'weekly',
    evidence: [syntheticEvidence('Block 8–10 anomaly fixtures', 'synthetic contract'), mockedEvidence('anomaly adapter', 'mock boundary'), timeVolumeEvidence('source anomaly window', 'requires comparable time and volume'), blockedEvidence('active anomaly monitor', 'not connected')],
  },
];

const makeContract = (definition: Definition): OperationalContract => ({
  domain: definition.domain,
  title: definition.title,
  slo: {
    target: definition.slo,
    window: definition.window,
    measurementSource: definition.source,
    observed: false,
  },
  severity: definition.severity,
  trigger: definition.trigger,
  alertChannel: definition.channel,
  connection: definition.connection,
  owner: { role: definition.role, humanAssignment: 'pending' },
  responseTarget: definition.response,
  runbookAnchor: `BLOCK12_RUNBOOKS.md#${definition.domain}`,
  rollback: 'simulate disable flags/restore last-known-valid snapshot; external mutation blocked',
  escalation: 'domain owner → Engineering owner → Product owner; human approval required',
  postmortem: BLAMELESS_POSTMORTEM_TEMPLATE,
  cadence: definition.cadence,
  evidence: definition.evidence,
});

export const OPERATIONAL_CONTRACTS: readonly OperationalContract[] = Object.freeze(
  definitions.map(makeContract),
);

export const PROVISIONAL_THRESHOLDS = Object.freeze({
  ingestionLagP95Minutes: 15,
  freshnessPriceDays: 7,
  freshnessAvailabilityHours: 24,
  freshnessTrendDays: 14,
  freshnessHistoryDays: 90,
  lighthouse: [90, 95, 95, 95] as const,
  lcpMs: 2500,
  cls: 0.1,
  tbtMs: 200,
  minimumOutcomesPerSegment: 30,
  gateDays: 90,
});

export const INFRASTRUCTURE_BOUNDARY = Object.freeze({
  localScripts: [
    'test',
    'typecheck',
    'quality:check',
    'deals:detect',
    'links:check',
    'seo:audit',
    'lighthouse:mobile',
  ] as const,
  workflowPaths: [
    '.github/workflows/quality.yml',
    '.github/workflows/quality-check.yml',
    '.github/workflows/automation.yml',
    '.github/workflows/trends-monitor.yml',
    '.github/workflows/batched-deploy.yml',
  ] as const,
  workflowDefinition: 'definition present',
  remoteExecution: 'not observed',
  blocks8To10AndLifecycle: 'contract/mock; no active infrastructure',
});

export type WilsonInterval = Readonly<{ lower: number; upper: number }>;

export function wilson95(successes: number, trials: number): WilsonInterval {
  if (
    !Number.isInteger(successes) ||
    !Number.isInteger(trials) ||
    trials <= 0 ||
    successes < 0 ||
    successes > trials
  ) {
    throw new RangeError('invalid_binomial_counts');
  }
  const z = 1.959963984540054;
  const p = successes / trials;
  const z2 = z * z;
  const denominator = 1 + z2 / trials;
  const centre = (p + z2 / (2 * trials)) / denominator;
  const margin =
    (z * Math.sqrt((p * (1 - p) + z2 / (4 * trials)) / trials)) /
    denominator;
  return Object.freeze({
    lower: Math.max(0, centre - margin),
    upper: Math.min(1, centre + margin),
  });
}

export type GateInput = Readonly<{
  day: number;
  outcomesBySegment: Readonly<Record<string, number>>;
  comparableWindows: number;
  confidenceIntervalsComputed: boolean;
  biasReviewComplete: boolean;
  decision?: DecisionState | 'success';
  externalBlocked?: boolean;
}>;

export type GateResult = Readonly<{ state: DecisionState; reason: string }>;

export function evaluate90DayGate(input: GateInput): GateResult {
  if (!Number.isInteger(input.day) || input.day < 0) {
    throw new RangeError('invalid_gate_day');
  }
  if (input.decision === 'success') {
    throw new RangeError('success_is_not_a_valid_gate_state');
  }
  if (input.decision !== undefined && !DECISION_STATES.has(input.decision)) {
    throw new RangeError('invalid_gate_decision');
  }
  if (input.externalBlocked === true) {
    return Object.freeze({
      state: 'externally_blocked',
      reason: 'external dependency or approval is not connected',
    });
  }
  if (
    input.outcomesBySegment === null ||
    typeof input.outcomesBySegment !== 'object' ||
    Array.isArray(input.outcomesBySegment)
  ) {
    throw new RangeError('outcomes_by_segment_must_be_a_record');
  }
  const segments = Object.entries(input.outcomesBySegment);
  if (segments.length === 0) {
    throw new RangeError('outcomes_by_segment_must_not_be_empty');
  }
  if (
    segments.some(
      ([, count]) => !Number.isInteger(count) || count < 0,
    )
  ) {
    throw new RangeError('outcome_counts_must_be_non_negative_integers');
  }
  if (
    input.day < PROVISIONAL_THRESHOLDS.gateDays ||
    segments.some(([, count]) => count < PROVISIONAL_THRESHOLDS.minimumOutcomesPerSegment)
  ) {
    return Object.freeze({
      state: 'defer',
      reason: 'time_volume_dependent: day 90 and 30 outcomes per segment are required',
    });
  }
  if (!Number.isInteger(input.comparableWindows) || input.comparableWindows < 2) {
    return Object.freeze({
      state: 'defer',
      reason: 'insufficient_comparable_windows',
    });
  }
  if (input.confidenceIntervalsComputed !== true) {
    return Object.freeze({
      state: 'defer',
      reason: 'confidence_intervals_required',
    });
  }
  if (input.biasReviewComplete !== true) {
    return Object.freeze({
      state: 'defer',
      reason: 'bias_review_required',
    });
  }
  return Object.freeze({
    state: input.decision ?? 'defer',
    reason: 'provisional decision; not a business-success claim',
  });
}

export type RollbackMode = 'simulated' | 'external';
export type RollbackPlan = Readonly<{
  mode: RollbackMode;
  action: 'disable_flags_restore_last_known_valid_snapshot';
  mutated: false;
  blocked: boolean;
}>;

export function simulateRollback(mode: RollbackMode): RollbackPlan {
  if (mode !== 'simulated' && mode !== 'external') {
    throw new RangeError('invalid_rollback_mode');
  }
  return Object.freeze({
    mode,
    action: 'disable_flags_restore_last_known_valid_snapshot',
    mutated: false as const,
    blocked: mode === 'external',
  });
}
