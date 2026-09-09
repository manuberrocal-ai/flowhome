import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';

// Explicit disposable local fixture; never starts Docker or selects a remote DB.
const container = 'flowhome-fh17c-pg-local';
const database = process.argv[2];
assert.match(database ?? '', /^flowhome_test_fh17[a-z0-9]{1,12}$/);
function docker(args, input = '') {
  return new Promise((resolve, reject) => {
    const child = spawn('docker', args, { windowsHide: true, timeout: 30000, stdio: ['pipe', 'pipe', 'pipe'] });
    let stdout = '';
    child.stdout.on('data', chunk => { stdout += chunk; });
    // SQL errors may contain input. Do not reproduce them in this runner's logs.
    child.stderr.resume();
    child.on('error', reject);
    child.on('close', code => code === 0 ? resolve(stdout.trim()) : reject(Error(`local_decision_fixture_failed:${code}`)));
    child.stdin.end(input);
  });
}
const sql = query => docker(['exec', '-i', container, 'psql', '-U', 'postgres', '-d', database, '-v', 'ON_ERROR_STOP=1', '-Atq'], `set statement_timeout='10s'; ${query}`);
const literal = value => `'${JSON.stringify(value).replaceAll("'", "''")}'::jsonb`;
const parse = output => JSON.parse(output.split('\n').find(line => line.startsWith('{')));
const [info] = JSON.parse(await docker(['inspect', container]));
assert.equal(info.Name, `/${container}`);
assert.equal(info.HostConfig.NetworkMode, 'none');
assert.ok(!info.HostConfig.PortBindings || Object.keys(info.HostConfig.PortBindings).length === 0);
assert.equal(info.State.Running, true);
assert.equal(await sql('select count(*) from public.block10_editorial_reviewers;'), '0', 'requires unused fixture');
assert.equal(await sql('select count(*) from public.block10_editorial_heads;'), '0', 'requires unused fixture');
const actor = 'aaaaaaaa-2222-4222-8222-222222222222';
await sql(`begin; insert into auth.users(id) values('${actor}'); insert into public.block10_editorial_reviewers values('${actor}',true,clock_timestamp()+interval '1 hour'); commit;`);
async function prepare(asin) {
  const payload = { schemaVersion: 1, intent: 'catalog-review', asin, market: 'US', productSlug: null, revision: 'c'.repeat(64) };
  const job = parse(await sql(`select public.block10_enqueue_catalog_review(${literal(payload)});`));
  assert.equal(job.status, 'inserted');
  await sql(`insert into public.block10_editorial_heads(job_id,revision,evidence_digest,evidence_valid_until,evidence_revoked) values('${job.id}','${payload.revision}','${'d'.repeat(64)}',clock_timestamp()+interval '1 hour',false);`);
  return { jobId: job.id, revision: payload.revision, evidenceDigest: 'd'.repeat(64), expectedVersion: 0, decision: 'approve', reason: 'evidence-reviewed' };
}
const decide = (intent, hold = false) => sql(`begin; set local role authenticated; select set_config('request.jwt.claim.sub','${actor}',true); select public.block10_decide_catalog_review(${literal(intent)}); ${hold ? 'select pg_sleep(0.3);' : ''} commit;`).then(parse);
const same = await prepare('B099999993');
const identical = await Promise.all([decide(same, true), decide(same)]);
assert.deepEqual(identical.map(row => row.status).sort(), ['duplicate', 'recorded']);
assert.ok(identical.every(row => row.version === 1 && row.publicationAuthorized === false));
const different = await prepare('B099999994');
const conflicts = await Promise.all([decide(different, true), decide({ ...different, decision: 'reject', reason: 'insufficient-evidence' })]);
assert.deepEqual(conflicts.map(row => row.status).sort(), ['recorded', 'version_conflict']);
assert.equal(await sql('select count(*) from public.block10_editorial_decisions;'), '2');
assert.equal(await sql('select sum(version) from public.block10_editorial_heads;'), '2');
await docker(['restart', container]);
let ready = false;
for (let attempt = 0; attempt < 30; attempt++) {
  try { await docker(['exec', container, 'pg_isready', '-U', 'postgres', '-d', database]); ready = true; break; }
  catch { await new Promise(resolve => setTimeout(resolve, 500)); }
}
assert.ok(ready, 'PostgreSQL did not become ready after local restart');
const recovered = await decide(same);
assert.equal(recovered.status, 'duplicate');
assert.equal(recovered.version, 1);
assert.equal(await sql('select count(*) from public.block10_editorial_decisions;'), '2');
console.log(JSON.stringify({ database, postgres: await sql('show server_version;'), identical: identical.map(row => row.status), distinct: conflicts.map(row => row.status), eventsAfterRestart: 2, recovered: recovered.status, publicationAuthorized: false, fixturesRetained: true, realAuthenticationTested: false }));
