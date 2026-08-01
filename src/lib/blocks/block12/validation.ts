import {
  BLOCK12_DOMAINS,
  OPERATIONAL_CONTRACTS,
  PROVISIONAL_THRESHOLDS,
  type OperationalContract,
} from './contracts.ts';

const evidenceKinds = new Set([
  'real_local',
  'synthetic',
  'mocked',
  'simulated',
  'externally_blocked',
  'time_volume_dependent',
]);

const connectionStates = new Set([
  'connected_local',
  'definition_present_remote_execution_unobserved',
  'not_connected',
]);

export function validateOperationalCatalog(
  contracts: readonly OperationalContract[] = OPERATIONAL_CONTRACTS,
): string[] {
  const errors: string[] = [];
  if (contracts.length !== BLOCK12_DOMAINS.length) {
    errors.push('catalog_must_have_ten_domains');
  }

  for (const domain of BLOCK12_DOMAINS) {
    const contract = contracts.find((item) => item.domain === domain);
    if (!contract) {
      errors.push(`missing:${domain}`);
      continue;
    }
    if (!contract.title || !contract.trigger || !contract.alertChannel) {
      errors.push(`identity_or_trigger:${domain}`);
    }
    if (
      !contract.slo.target ||
      !contract.slo.window ||
      !contract.slo.measurementSource ||
      contract.slo.observed !== false
    ) {
      errors.push(`slo:${domain}`);
    }
    if (
      !contract.severity ||
      !connectionStates.has(contract.connection) ||
      !contract.owner.role ||
      contract.owner.humanAssignment !== 'pending' ||
      !contract.responseTarget ||
      !contract.runbookAnchor ||
      !contract.rollback ||
      !contract.escalation ||
      !contract.postmortem ||
      !contract.cadence
    ) {
      errors.push(`operations:${domain}`);
    }
    if (
      contract.evidence.length === 0 ||
      contract.evidence.some((item) => !evidenceKinds.has(item.kind))
    ) {
      errors.push(`evidence:${domain}`);
    }
  }
  if (PROVISIONAL_THRESHOLDS.minimumOutcomesPerSegment !== 30) {
    errors.push('minimum_sample_changed');
  }
  return errors;
}
