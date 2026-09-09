# Rollback and stop controls

No production deployment occurred in this work. Local changes are isolated on `improve/flowhome-v3-2026-09-04`; merge `116e04d` reconciled the original `17a4ec1` base with main while preserving V3. Preserve unrelated work and inspect the diff before reverting specific changes; never reset the entire workspace.

To stop future daily processing, set the kill switch and disable the scheduled-workflow variable. Running jobs may be cancelled by the owner. The runtime rejects auto-publication; there is no automated source mutation to roll back.

For a future approved publication, record the exact deployed commit/artifact and previous Pages deployment first. Revert only the reviewed patch or restore the exact previous deployment using the hosting runbook. Re-run anonymous CTA, shortlist, product truth, routes and visual checks. This document does not authorize a deployment or rollback action.

Follow the [verified release and recovery procedure](release-artifact-runbook.md): the workflow now requires an exact approved rollback deployment ID, checks it against current successful production, and preserves selected metadata. Restoration is an explicit Pages dashboard action, not an automatic reaction to failure. Preview deployments are not valid targets. If the publication step succeeds but its record fails, inspect production before restarting anything.

Generated report corruption is recovered by re-running; hashes prevent reuse of damaged evidence. Preserve the failed report when investigating. Do not remove broad directories or secrets. A stale lock can be removed only after verifying its recorded process is no longer active.
