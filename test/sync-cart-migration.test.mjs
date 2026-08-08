import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile, readdir } from 'node:fs/promises';

const migration = new URL('../supabase/migrations/007_fix_sync_cart_insert.sql', import.meta.url);
const migrationsDirectory = new URL('../supabase/migrations/', import.meta.url);

test('sync_cart forward fix is transactional, complete, and preserves function access', async () => {
  const sql = await readFile(migration, 'utf8');
  const syncCart = sql.match(/create or replace function public\.sync_cart\(p_cart jsonb\)[\s\S]*?\$\$;/i)?.[0] ?? '';

  assert.match(sql, /^\s*begin;/im);
  assert.match(sql, /commit;\s*$/i);
  assert.ok(syncCart, 'migration must replace the complete sync_cart function');
  for (const text of [
    'language plpgsql',
    'security definer',
    'set search_path = pg_catalog, public',
    "raise exception 'Authentication is required' using errcode = '28000'",
    "raise exception 'Invalid cart payload' using errcode = '22023'",
    "raise exception 'Invalid cart entry' using errcode = '22023'",
    'on conflict (user_id, asin) do update set',
    'where excluded.logical_clock > public.cart_sync_entries.logical_clock',
    'excluded.device_id > public.cart_sync_entries.device_id',
  ]) assert.match(syncCart, new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));

  assert.match(syncCart, /insert into public\.cart_sync_entries\s*\(\s*user_id,\s*asin,\s*quantity,\s*logical_clock,\s*device_id,\s*item,\s*updated_at\s*\)\s*values\s*\([\s\S]*?jsonb_build_object\([\s\S]*?\),\s*now\(\)\s*\)/i);
  assert.doesNotMatch(syncCart, /insert into public\.cart_sync_entries\s*\(\s*user_id,\s*asin,\s*quantity,\s*logical_clock,\s*device_id,\s*item\s*\)[\s\S]*?now\(\)/i);
  assert.match(sql, /revoke all on function public\.sync_cart\(jsonb\) from public, anon;/i);
  assert.match(sql, /grant execute on function public\.sync_cart\(jsonb\) to authenticated;/i);
});

test('migration runner directory retains unique forward versions', async () => {
  const files = (await readdir(migrationsDirectory)).filter((file) => /^\d+_.*\.sql$/.test(file));
  const versions = files.map((file) => file.match(/^\d+/)[0]);

  assert.equal(new Set(versions).size, versions.length, 'migration versions must be unique');
  assert.ok(files.includes('007_fix_sync_cart_insert.sql'));
});
