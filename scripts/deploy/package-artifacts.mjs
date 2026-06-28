import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const artifacts = path.join(root, 'artifacts');
fs.mkdirSync(artifacts, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const distZip = path.join(artifacts, `flowhome-dist-${stamp}.zip`);
const projectZip = path.join(artifacts, `flowhome-project-${stamp}.zip`);

function psQuote(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function zip(paths, target) {
  const list = Array.isArray(paths) ? paths : [paths];
  const existing = list.filter((item) => item.includes('*') ? fs.existsSync(path.dirname(item)) : fs.existsSync(item));
  if (existing.length === 0) throw new Error(`No existing paths for ${target}`);
  const arrayLiteral = '@(' + existing.map(psQuote).join(',') + ')';
  const command = `$paths = ${arrayLiteral}; Compress-Archive -Path $paths -DestinationPath ${psQuote(target)} -Force`;
  const result = spawnSync('powershell', ['-NoProfile', '-Command', command], { stdio: 'inherit' });
  if (result.status !== 0) throw new Error(`Failed to create ${target}`);
}

zip(path.join(root, 'dist', '*'), distZip);
zip([
  path.join(root, 'src'),
  path.join(root, 'public'),
  path.join(root, 'scripts'),
  path.join(root, 'docs'),
  path.join(root, '.github'),
  path.join(root, 'package.json'),
  path.join(root, 'package-lock.json'),
  path.join(root, 'astro.config.mjs'),
  path.join(root, 'tsconfig.json'),
  path.join(root, 'wrangler.toml'),
  path.join(root, 'README.md'),
  path.join(root, '.env.example'),
], projectZip);

console.log(JSON.stringify({ distZip, projectZip }, null, 2));

