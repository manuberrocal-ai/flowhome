import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';

const container = 'flowhome-fh17c-pg-local';
const database = process.argv[2];
assert.match(database ?? '', /^flowhome_test_fh17[a-z0-9]{1,12}$/);
function docker(args, input = '') {
  const promise = new Promise((resolve, reject) => {
    const child = spawn('docker', args, { windowsHide: true, timeout: 30000, stdio: ['pipe', 'pipe', 'pipe'] });
    let output = '';
    child.stdout.on('data', chunk => { output += chunk; });
    child.stderr.resume();
    child.on('error', reject);
    child.on('close', code => code === 0 ? resolve(output.trim()) : reject(Error(`local_race_failed:${code}`)));
    child.stdin.end(input);
  });
  // Some sessions intentionally finish while another is being observed.
  promise.catch(() => {});
  return promise;
}
const sql = query => docker(['exec', '-i', container, 'psql', '-U', 'postgres', '-d', database, '-v', 'ON_ERROR_STOP=1', '-Atq'], `set statement_timeout='10s'; ${query}`);
const literal = value => `'${JSON.stringify(value).replaceAll("'", "''")}'::jsonb`;
const parse = output => JSON.parse(output.split('\n').find(line => line.startsWith('{')));
const [info] = JSON.parse(await docker(['inspect', container]));
assert.equal(info.Name, `/${container}`);
assert.equal(info.HostConfig.NetworkMode, 'none');
assert.ok(!info.HostConfig.PortBindings || Object.keys(info.HostConfig.PortBindings).length === 0);
assert.equal(info.State.Running, true);
const actor = 'aaaaaaaa-3333-4333-8333-333333333333';
assert.equal(await sql(`select count(*) from auth.users where id='${actor}';`), '0', 'requires unused race fixture');
await sql(`begin; insert into auth.users(id) values('${actor}'); insert into public.block10_editorial_reviewers values('${actor}',true,clock_timestamp()+interval '1 hour'); commit;`);
async function prepare(asin) {
  const payload = { schemaVersion: 1, intent: 'catalog-review', asin, market: 'US', productSlug: null, revision: 'e'.repeat(64) };
  const job = parse(await sql(`select public.block10_enqueue_catalog_review(${literal(payload)});`));
  assert.equal(job.status, 'inserted');
  await sql(`insert into public.block10_editorial_heads(job_id,revision,evidence_digest,evidence_valid_until,evidence_revoked) values('${job.id}','${payload.revision}','${'f'.repeat(64)}',clock_timestamp()+interval '1 hour',false);`);
  return { jobId: job.id, revision: payload.revision, evidenceDigest: 'f'.repeat(64), expectedVersion: 0, decision: 'approve', reason: 'evidence-reviewed' };
}
async function observe(name, condition) {
  for (let attempt = 0; attempt < 30; attempt++) {
    if (await sql(`select count(*) from pg_stat_activity where datname=current_database() and application_name='${name}' and ${condition};`) === '1') return;
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  assert.fail(`Session state was not observed: ${name}`);
}
async function race(intent, update, expected) {
  const holder = sql(`set application_name='fh17j-holder'; begin; ${update} select pg_sleep(3); commit;`);
  await observe('fh17j-holder', "wait_event='PgSleep'");
  const waiter = sql(`set application_name='fh17j-waiter'; begin; set local role authenticated; select set_config('request.jwt.claim.sub','${actor}',true); select public.block10_decide_catalog_review(${literal(intent)}); commit;`);
  await observe('fh17j-waiter', "wait_event_type='Lock'");
  const [, output] = await Promise.all([holder, waiter]);
  const result = parse(output);
  assert.equal(result.status, expected);
  assert.equal(await sql(`select count(*) from public.block10_editorial_decisions where job_id='${intent.jobId}';`), '0');
  assert.equal(await sql(`select version from public.block10_editorial_heads where job_id='${intent.jobId}';`), '0');
  return { status: result.status, blockedSessionObserved: true, events: 0, version: 0 };
}
const expiry = await prepare('B099999995');
const expired = await race(expiry, `update public.block10_editorial_heads set evidence_valid_until=clock_timestamp()+interval '1 second' where job_id='${expiry.jobId}';`, 'stale_evidence');
const revocation = await prepare('B099999996');
const revoked = await race(revocation, `update public.block10_editorial_reviewers set active=false where user_id='${actor}';`, 'unauthorized');
console.log(JSON.stringify({ database, expiredWhileWaiting: expired, revokedWhileWaiting: revoked, fixturesRetained: true, realAuthenticationTested: false }));
