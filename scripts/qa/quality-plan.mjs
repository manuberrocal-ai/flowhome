import { join } from 'node:path';

export const CORE_QUALITY_COMMANDS = Object.freeze(['test', 'lint', 'typecheck', 'quality:check', 'links:check', 'build', 'seo:audit']);
export const DAILY_QUALITY_COMMANDS = Object.freeze([...CORE_QUALITY_COMMANDS, 'qa:browser']);

export function qualityCommandSkipReason(command, results) {
  if (command === 'build' && !CORE_QUALITY_COMMANDS.slice(0, CORE_QUALITY_COMMANDS.indexOf('build')).every((required) => results.some((result) => result.command === required && result.status === 'passed'))) return 'prerequisite_failed';
  if (['seo:audit', 'qa:browser', 'lighthouse:mobile'].includes(command) && !results.some((result) => result.command === 'build' && result.status === 'passed')) return 'build_failed';
  return null;
}

export function qualityCommandEnvironment({ env, reportDir, profile }) {
  const result = { ...env,
    QUALITY_REPORT_PATH: join(reportDir, 'editorial-quality.json'),
    LINK_CHECK_REPORT_PATH: join(reportDir, 'commercial-links.json'),
    BROWSER_QA_OUTPUT: join(reportDir, 'screenshots'), BROWSER_QA_PROFILE: profile,
    SEO_AUDIT_REPORT_PATH: join(reportDir, 'seo-audit/report.json'),
    LIGHTHOUSE_OUTPUT_DIR: join(reportDir, 'lighthouse'),
  };
  // Targeted CLI audits may override routes/samples; a coordinated quality run
  // must use the runner's full median-of-three defaults, not inherited shell state.
  delete result.LIGHTHOUSE_ROUTES;
  delete result.LIGHTHOUSE_RUNS;
  return result;
}
