/** Render only fixed labels and counts, never raw transport messages or payloads. */
export function reviewPersistenceSummary(report, total) {
  const entries = report.entries ?? [];
  const inserted = entries.filter((entry) => entry.status === 'inserted').length;
  const existing = entries.filter((entry) => entry.status === 'duplicate').length;
  const unresolved = entries.length - inserted - existing;
  const notAttempted = Math.max(0, total - entries.length);
  const actions = {
    disabled: 'No durable store configured; this is a local review report only.',
    dry_run: 'Dry run: no durable reads or writes were attempted.',
    skipped_quality: 'No durable reads or writes attempted. Resolve failed or missing quality evidence before rerunning.',
    confirmed: 'Persistence confirmed at run time, not a live queue query or human approval.',
    needs_attention: 'Stop and inspect review-persistence.json. Resolve the cause, then rerun to reconcile existing identities. Do not delete jobs or reset their state to retry.',
  };
  const status = Object.hasOwn(actions, report.status) ? report.status : 'unknown';
  return `Review persistence: ${status}. Inserted: ${inserted}; already present: ${existing}; unresolved: ${unresolved}; not attempted: ${notAttempted}.\n\n${actions[status] ?? 'Persistence state is unknown; inspect the evidence before taking action.'}`;
}
