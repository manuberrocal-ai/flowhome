import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';

// Isolated existing container only; never starts a service or applies a migration.
const container = 'flowhome-fh17c-pg-local';
const database = process.argv[2];
assert.match(database ?? '', /^flowhome_test_fh16[a-z0-9]{1,12}$/);
function docker(args, input = '', observe) {
  return new Promise((resolve, reject) => {
    const child = spawn('docker', args, { windowsHide: true, timeout: 30000, stdio: ['pipe', 'pipe', 'pipe'] });
    let output = '';
    child.stdout.on('data', chunk => { output += chunk; observe?.(output); });
    child.stderr.resume();
    child.on('error', reject);
    child.on('close', code => code === 0 ? resolve(output.trim()) : reject(Error(`local_budget_fixture_failed:${code}`)));
    child.stdin.end(input);
  });
}
const [info] = JSON.parse(await docker(['inspect', container]));
assert.equal(info.State.Running, true);
assert.equal(info.HostConfig.NetworkMode, 'none');
assert.ok(!info.HostConfig.PortBindings || Object.keys(info.HostConfig.PortBindings).length === 0);
const sql = (query, observe) => docker(['exec', '-i', container, 'psql', '-U', 'postgres', '-d', database, '-v', 'ON_ERROR_STOP=1', '-Atq'], `set statement_timeout='10s'; ${query}`, observe);
assert.equal(await sql('select count(*) from public.block10_commerce_attempt_budgets;'), '0', 'requires unused fixture');
await sql(`insert into public.block10_commerce_attempt_budgets(account_ref,revision,approval_ref,enabled,starts_at,expires_at,max_attempts)
  values('test:parallel','r1','synthetic:not-approval',true,clock_timestamp()-interval '1 hour',clock_timestamp()+interval '1 hour',3);`);
const results = await Promise.all(Array.from({ length: 12 }, () => sql("select public.block10_reserve_commerce_attempt('test:parallel','r1');")));
assert.equal(results.filter(value => value === 't').length, 3);
assert.equal(results.filter(value => value === 'f').length, 9);
assert.equal(await sql("select used_attempts from public.block10_commerce_attempt_budgets where account_ref='test:parallel';"), '3');
assert.equal(await sql("select has_function_privilege('service_role','public.block10_reserve_commerce_attempt(text,text)','execute');"), 'f');
await sql(`insert into public.block10_commerce_attempt_budgets(account_ref,revision,approval_ref,enabled,starts_at,expires_at,max_attempts)
  values('test:lock','r1','synthetic:not-approval',true,clock_timestamp()-interval '1 hour',clock_timestamp()+interval '1 hour',1);`);
let started;
const ready = new Promise(resolve => { started = resolve; });
const held = sql(`begin; update public.block10_commerce_attempt_budgets set expires_at=clock_timestamp()+interval '1 second' where account_ref='test:lock';
  select 'LOCKED'; select pg_sleep(3); commit;`, output => { if (output.includes('LOCKED')) started(); });
await Promise.race([ready, held.then(() => { throw Error('Missing lock observation'); })]);
const waiting = sql("set application_name='fh16s_waiter'; select public.block10_reserve_commerce_attempt('test:lock','r1');");
let lockObserved = false;
for (let attempt = 0; attempt < 10; attempt++) {
  if (await sql("select count(*) from pg_stat_activity where datname=current_database() and application_name='fh16s_waiter' and wait_event_type='Lock';") === '1') { lockObserved = true; break; }
  await new Promise(resolve => setTimeout(resolve, 50));
}
const afterLock = await waiting;
await held;
assert.equal(lockObserved, true, 'must observe actual database lock wait');
assert.equal(afterLock, 'f', 'expiry must be rechecked after acquiring lock');
assert.equal(await sql("select used_attempts from public.block10_commerce_attempt_budgets where account_ref='test:lock';"), '0');
console.log(JSON.stringify({ concurrentRequests: 12, admitted: 3, denied: 9, consumed: 3, expiredWhileLockedDenied: true, serviceExecutionEnabled: false, fixturesRetained: true, realProviderQuotaValidated: false }));
