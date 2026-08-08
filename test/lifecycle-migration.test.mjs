import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

const migration = new URL('../supabase/migrations/003_lifecycle_email.sql', import.meta.url);

test('lifecycle dispatch cap wraps its CASE expression before the PL/pgSQL IF terminator', async () => {
  const sql = await readFile(migration, 'utf8');
  const authorizeDispatch = sql.match(/create or replace function public\.authorize_lifecycle_dispatch[\s\S]*?end;\s*\$\$;/i)?.[0] ?? '';

  assert.ok(authorizeDispatch, 'missing authorize_lifecycle_dispatch function');
  assert.match(authorizeDispatch, /if\s+v_type_count\s*>=\s*\(case\s+v_job\.type[\s\S]*?\bend\)\s+then\s+return null;\s+end if;/i);
  assert.doesNotMatch(authorizeDispatch, /if\s+v_type_count\s*>=\s+case\s+/i);
});
