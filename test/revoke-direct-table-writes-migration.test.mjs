import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile, readdir } from 'node:fs/promises';

const migration = new URL('../supabase/migrations/008_revoke_direct_table_writes.sql', import.meta.url);
const migrationsDirectory = new URL('../supabase/migrations/', import.meta.url);

const targetTables = [
  'cart_sync_entries',
  'lifecycle_subscribers',
  'lifecycle_preferences',
  'lifecycle_consent_history',
  'lifecycle_jobs',
  'lifecycle_dispatch_leases',
  'lifecycle_webhook_events',
];

test('direct table-write grant closure is transactional, exact, and self-verifying', async () => {
  const sql = await readFile(migration, 'utf8');
  const revoke = sql.match(/revoke\s+all\s+on\s+table\s+([\s\S]*?)\s+from\s+public\s*,\s*anon\s*,\s*authenticated\s*,\s*service_role\s*;/i);
  const assertion = sql.match(/do\s+\$\$([\s\S]*?)\$\$\s*;/i)?.[1] ?? '';

  assert.match(sql, /^\s*begin;/im);
  assert.match(sql, /commit;\s*$/i);
  assert.ok(revoke, 'missing explicit table grant revocation');
  assert.deepEqual(
    revoke[1].split(',').map((table) => table.trim().replace(/^public\./i, '')),
    targetTables,
  );
  assert.ok(assertion, 'missing runtime privilege assertion');
  assert.match(assertion, /information_schema\.role_table_grants/i);
  assert.deepEqual(
    [...assertion.matchAll(/'([a-z_]+)'/gi)]
      .map((match) => match[1].toLowerCase())
      .filter((value) => targetTables.includes(value)),
    targetTables,
  );
  assert.match(assertion, /upper\(grantee\)\s+in\s*\(\s*'PUBLIC'\s*,\s*'ANON'\s*,\s*'AUTHENTICATED'\s*,\s*'SERVICE_ROLE'\s*\)/i);
  assert.match(assertion, /upper\(privilege_type\)\s+in\s*\(\s*'INSERT'\s*,\s*'UPDATE'\s*,\s*'DELETE'\s*,\s*'TRUNCATE'\s*,\s*'REFERENCES'\s*,\s*'TRIGGER'\s*\)/i);
  assert.match(assertion, /if\s+v_write_grant_count\s*<>\s*0\s+then[\s\S]*?raise exception/i);
  assert.doesNotMatch(sql, /\bexecute\b/i, 'the migration must not use dynamic SQL');
  assert.doesNotMatch(sql, /\bgrant\b/i, 'the migration must not grant table privileges');
  assert.doesNotMatch(sql, /\bon\s+function\b/i, 'existing function execution grants must remain untouched');
});

test('forward migration version 008 is unique', async () => {
  const files = (await readdir(migrationsDirectory)).filter((file) => /^\d+_.*\.sql$/.test(file));
  const versions = files.map((file) => file.match(/^\d+/)[0]);

  assert.equal(new Set(versions).size, versions.length, 'migration versions must be unique');
  assert.equal(files.filter((file) => file.startsWith('008_')).length, 1);
  assert.ok(files.includes('008_revoke_direct_table_writes.sql'));
});
