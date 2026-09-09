import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';

// Explicit local fixture harness. Never selects a remote connection or starts Docker.
const container = 'flowhome-fh17c-pg-local';
const database = process.argv[2] ?? 'flowhome_test';
assert.match(database, /^flowhome_test(?:_[a-z0-9]{1,16})?$/, 'only explicitly named local fixture databases');
function docker(args, input = '') {
  return new Promise((resolve, reject) => {
    const child = spawn('docker', args, { windowsHide: true, timeout: 30000, stdio: ['pipe', 'pipe', 'pipe'] });
    let stdout = ''; let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', reject);
    child.on('close', (code) => code === 0 ? resolve(stdout.trim()) : reject(new Error(`local_fixture_command_failed:${code}:${stderr.slice(0, 240)}`)));
    child.stdin.end(input);
  });
}
const sql = (query) => docker(['exec', '-i', container, 'psql', '-U', 'postgres', '-d', database, '-v', 'ON_ERROR_STOP=1', '-Atq'], `set statement_timeout='10s'; ${query}`);
const payload = JSON.stringify({ schemaVersion: 1, intent: 'catalog-review', asin: 'B099999991', market: 'US', productSlug: null, revision: 'c'.repeat(64) });
const enqueue = `select public.block10_enqueue_catalog_review('${payload}'::jsonb);`;
const parseResult = (output) => JSON.parse(output.split('\n').find((line) => line.startsWith('{')));

const [info] = JSON.parse(await docker(['inspect', container]));
assert.equal(info.Name, `/${container}`);
assert.equal(info.HostConfig.NetworkMode, 'none');
assert.ok(!info.HostConfig.PortBindings || Object.keys(info.HostConfig.PortBindings).length === 0);
assert.equal(await sql("select count(*) from public.block10_jobs;"), '0', 'requires empty disposable fixture database');

const submissions = (await Promise.all([
  sql(`begin; set local role service_role; ${enqueue} select pg_sleep(0.3); commit;`),
  sql(`begin; set local role service_role; ${enqueue} commit;`),
])).map(parseResult);
assert.deepEqual(submissions.map((result) => result.status).sort(), ['duplicate', 'inserted']);
assert.equal(submissions[0].id, submissions[1].id);
assert.equal(await sql('select count(*) from public.block10_jobs;'), '1');

const claim = (worker) => sql(`set role service_role; select coalesce(jsonb_agg(to_jsonb(j)), '[]'::jsonb) from public.block10_claim_catalog_reviews('${worker}',1,60) j;`).then(JSON.parse);
const claims = await Promise.all([claim('fixture-a'), claim('fixture-b')]);
assert.equal(claims.flat().length, 1);
const claimed = claims.flat()[0];
const finish = (worker, token) => sql(`set role service_role; select public.block10_finish_job('${claimed.id}','${worker}','${token}','completed',null,null,null);`);
assert.equal(await finish('wrong-worker', claimed.lease_token), 'f');
assert.equal(await finish(claimed.lease_owner_id, claimed.lease_token), 't');
assert.equal(await sql('select count(*) from public.block10_review_job_audit;'), '3');

await docker(['restart', container]);
let ready = false;
for (let attempt = 0; attempt < 30; attempt++) {
  try { await docker(['exec', container, 'pg_isready', '-U', 'postgres', '-d', database]); ready = true; break; }
  catch { await new Promise((resolve) => setTimeout(resolve, 500)); }
}
assert.ok(ready, 'PostgreSQL must become ready after restart');
const afterRestart = parseResult(await sql(`set role service_role; ${enqueue}`));
assert.equal(afterRestart.status, 'duplicate');
assert.equal(afterRestart.state, 'completed');
assert.equal(afterRestart.id, claimed.id);
assert.equal(await sql('select attempts from public.block10_jobs;'), '1');
assert.equal(await sql('select count(*) from public.block10_review_job_audit;'), '3');
console.log(JSON.stringify({ postgres: await sql('show server_version;'), database, simultaneousEnqueues: submissions.map((result) => result.status), simultaneousClaims: claims.map((rows) => rows.length), wrongOwnerRejected: true, stateAfterRestart: afterRestart.state, duplicateAfterRestart: true, auditEventsAfterRestart: 3, fixtureRetained: true }));
