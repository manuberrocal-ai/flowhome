import fs from 'node:fs';
import path from 'node:path';

export const root = process.cwd();
export function readText(file) { return fs.readFileSync(path.join(root, file), 'utf8'); }
export function writeText(file, content) { fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true }); fs.writeFileSync(path.join(root, file), content, 'utf8'); }
export function listFiles(dir, ext = '') {
  const full = path.join(root, dir);
  if (!fs.existsSync(full)) return [];
  return fs.readdirSync(full).filter((f) => !ext || f.endsWith(ext)).map((f) => path.join(dir, f));
}
export function parseFlatYaml(text) {
  const out = {};
  let currentArray = null;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trimEnd();
    if (!line || line.trim().startsWith('#')) continue;
    if (currentArray && line.trim().startsWith('- ')) { out[currentArray].push(line.trim().slice(2).replace(/^['"]|['"]$/g, '')); continue; }
    currentArray = null;
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!match) continue;
    const [, key, value] = match;
    if (value === '') { out[key] = []; currentArray = key; continue; }
    if (value === 'true' || value === 'false') out[key] = value === 'true';
    else if (!Number.isNaN(Number(value)) && value.trim() !== '') out[key] = Number(value);
    else out[key] = value.replace(/^['"]|['"]$/g, '');
  }
  return out;
}
export function readProducts() { return listFiles('src/content/products', '.yaml').map((file) => ({ file, ...parseFlatYaml(readText(file)) })); }
export function readDeals() { return listFiles('src/content/deals', '.yaml').map((file) => ({ file, ...parseFlatYaml(readText(file)) })); }
export function frontmatterMarkdown(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  return match ? { data: parseFlatYaml(match[1]), body: match[2] } : { data: {}, body: text };
}
