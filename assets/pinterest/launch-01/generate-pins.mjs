import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = new URL('.', import.meta.url).pathname.replace(/^\/[A-Za-z]:/, match => match.slice(1));
const read = file => fs.readFile(path.join(root, file), 'utf8');
const data = JSON.parse(await read('pins.json'));
const W = 1000, H = 1500;
const palette = { navy: '#0f172a', navy2: '#172554', cyan: '#0891b2', cyanLight: '#22d3ee', orange: '#f97316', orangeDark: '#ea580c', white: '#ffffff', slate: '#cbd5e1' };
const fail = message => { throw new Error(`Validation failed: ${message}`); };
const allText = JSON.stringify(data).toLowerCase();
const repoRoot = path.resolve(root, '../../..');
if (data.status !== 'draft' || data.published !== false || data.approvalRequiredBeforePublishing !== true) fail('publishing flags');
if (data.credentials !== null) fail('credentials must be null');
const expectedBlockerIds = new Set(['correct-roborock-q5-plus-source-claims', 'correct-roomba-j7-plus-source-claims']);
if (!Array.isArray(data.prePublishBlockers) || data.prePublishBlockers.length !== 2 || new Set(data.prePublishBlockers.map(blocker => blocker.id)).size !== 2 || data.prePublishBlockers.some(blocker => !expectedBlockerIds.has(blocker.id) || blocker.resolved !== true || blocker.resolvedAt !== '2026-07-18' || blocker.resolutionCommit !== 'e798068' || blocker.productionVerified !== true || !Array.isArray(blocker.sourceFiles) || blocker.sourceFiles.length === 0 || !blocker.officialEvidenceUrl || !blocker.reason.includes('corrected and deployed to production'))) fail('pre-publish blockers');
if (data.boards.length !== 3 || data.pins.length !== 9) fail('expected 3 boards and 9 pins');
const boardIds = new Set(data.boards.map(board => board.id));
if (data.pins.some(pin => !boardIds.has(pin.board))) fail('pin references unknown board');
for (const pin of data.pins) {
  if (typeof pin.source !== 'string' || !pin.source.trim()) fail(`empty source for ${pin.id}`);
  const sourcePath = path.resolve(repoRoot, pin.source);
  if (!sourcePath.startsWith(repoRoot + path.sep)) fail(`source escapes repo for ${pin.id}`);
  try { if (!(await fs.stat(sourcePath)).isFile()) fail(`source is not a file for ${pin.id}`); } catch { fail(`missing source for ${pin.id}`); }
}
const ids = data.pins.map(pin => pin.id), urls = data.pins.map(pin => pin.canonical);
if (new Set(ids).size !== ids.length || new Set(urls).size !== urls.length) fail('duplicate IDs or canonicals');
if (data.pins.some(pin => !/^https:\/\/flowhome\.dev\//.test(pin.canonical))) fail('non-HTTPS FlowHome URL');
if (data.pins.some(pin => pin.title.length > 100)) fail('title over 100 characters');
if (data.pins.some(pin => !['Read the guide', 'Read the review'].includes(pin.overlay.CTA))) fail('invalid CTA');
if (/(amazon|price|rating|\bstars?\b|guarantee|guaranteed|fastest|#1|tested|performance claim)/i.test(allText)) fail('unsupported claim term');
const q5Metadata = JSON.stringify(data.pins.find(pin => pin.id === 'roborock-q5-plus-review'));
const j7Metadata = JSON.stringify(data.pins.find(pin => pin.id === 'roomba-j7-plus-review'));
if (/mop/i.test(q5Metadata)) fail('stale Roborock Q5+ mopping claim');
if (/lidar/i.test(j7Metadata)) fail('stale Roomba j7+ LiDAR claim');

const esc = value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const wrap = (text, max = 28) => { const words = text.split(/\s+/), lines = []; let line = ''; for (const word of words) { if ((line + ' ' + word).trim().length > max && line) { lines.push(line); line = word; } else line = (line + ' ' + word).trim(); } if (line) lines.push(line); return lines.slice(0, 4); };
const textBlock = (lines, x, y, size, weight, fill, lineHeight = size * 1.15) => lines.map((line, i) => `<text x="${x}" y="${y + i * lineHeight}" font-family="Arial, system-ui, sans-serif" font-size="${size}" font-weight="${weight}" fill="${fill}">${esc(line)}</text>`).join('');
const motif = (category, variant) => {
  if (category === 'robot') return variant % 2 ? `<circle cx="770" cy="410" r="210" fill="none" stroke="${palette.cyanLight}" stroke-width="5" opacity=".3"/><circle cx="770" cy="410" r="120" fill="none" stroke="${palette.cyan}" stroke-width="18" opacity=".7"/><path d="M580 410h380M770 220v380" stroke="${palette.white}" opacity=".12" stroke-width="3"/><circle cx="770" cy="410" r="28" fill="${palette.orange}"/>` : `<path d="M560 520 C650 400 650 260 790 300 S910 470 835 540 650 590 610 470" fill="none" stroke="${palette.cyanLight}" stroke-width="26" opacity=".75"/><circle cx="610" cy="470" r="42" fill="${palette.orange}"/><circle cx="610" cy="470" r="16" fill="${palette.white}"/>`;
  if (category === 'lighting') return variant % 2 ? `<path d="M720 230c-90 0-150 70-150 155 0 53 24 86 58 120 18 18 24 38 24 67h136c0-29 6-49 24-67 34-34 58-67 58-120 0-85-60-155-150-155z" fill="${palette.orange}" opacity=".85"/><path d="M690 590h60M685 625h70" stroke="${palette.white}" stroke-width="14" stroke-linecap="round"/><path d="M720 160v-60M560 220l-45-45M880 220l45-45" stroke="${palette.cyanLight}" stroke-width="12" stroke-linecap="round"/>` : `<circle cx="760" cy="360" r="155" fill="${palette.cyan}" opacity=".75"/><circle cx="760" cy="360" r="82" fill="${palette.orange}"/><path d="M760 155v-75M555 235l-52-52M965 235l52-52M555 485l-52 52M965 485l52 52" stroke="${palette.cyanLight}" stroke-width="12" stroke-linecap="round"/>`;
  return variant % 2 ? `<rect x="610" y="290" width="300" height="210" rx="38" fill="${palette.cyan}" opacity=".8"/><circle cx="690" cy="395" r="28" fill="${palette.orange}"/><circle cx="830" cy="395" r="28" fill="${palette.cyanLight}"/><path d="M760 290V190M760 500v100M610 395H510M910 395h100" stroke="${palette.white}" stroke-width="12" opacity=".8"/><path d="M690 395h140" stroke="${palette.white}" stroke-width="5" opacity=".5"/>` : `<circle cx="760" cy="390" r="112" fill="none" stroke="${palette.cyanLight}" stroke-width="24"/><circle cx="760" cy="390" r="42" fill="${palette.orange}"/><path d="M760 170v-62M760 610v62M540 390h-62M980 390h62M605 235l-44-44M915 545l44 44" stroke="${palette.white}" stroke-width="10" stroke-linecap="round" opacity=".72"/>`;
};
const svgFor = (pin, index) => {
  const category = pin.board.startsWith('robot') ? 'robot' : pin.board.startsWith('smart-lighting') ? 'lighting' : 'hub';
  const gradient = `g${index}`;
  const headline = wrap(pin.overlay.headline, 22), subhead = wrap(pin.overlay.subhead, 34);
  const footerKind = pin.kind === 'guide' ? 'EDITORIAL GUIDE' : 'EDITORIAL REVIEW';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs><linearGradient id="${gradient}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${palette.navy}"/><stop offset=".58" stop-color="${palette.navy2}"/><stop offset="1" stop-color="#075985"/></linearGradient><pattern id="grid${index}" width="48" height="48" patternUnits="userSpaceOnUse"><path d="M48 0H0V48" fill="none" stroke="${palette.cyanLight}" stroke-opacity=".1" stroke-width="2"/></pattern></defs><rect width="1000" height="1500" fill="url(#${gradient})"/><rect width="1000" height="1500" fill="url(#grid${index})"/><circle cx="90" cy="104" r="34" fill="${palette.orange}"/><path d="M77 105l13-16 13 16v21H77zM72 104l18-20 18 20" fill="none" stroke="${palette.white}" stroke-width="3"/><text x="148" y="114" font-family="Arial, system-ui, sans-serif" font-size="38" font-weight="700" fill="${palette.white}">FlowHome</text><rect x="700" y="76" width="214" height="54" rx="27" fill="${palette.white}" fill-opacity=".14" stroke="${palette.cyanLight}" stroke-opacity=".6"/><text x="807" y="111" text-anchor="middle" font-family="Arial, system-ui, sans-serif" font-size="22" font-weight="700" letter-spacing="2" fill="${palette.cyanLight}">${pin.kind.toUpperCase()}</text><g>${motif(category, index)}</g><rect x="72" y="710" width="856" height="530" rx="42" fill="${palette.white}" fill-opacity=".96"/><rect x="72" y="710" width="12" height="530" rx="6" fill="${palette.orange}"/>${textBlock(headline, 126, 820, 66, 700, palette.navy, 76)}${textBlock(subhead, 126, 1015, 31, 400, '#334155', 48)}<rect x="126" y="1145" width="360" height="64" rx="32" fill="${palette.orangeDark}"/><text x="306" y="1187" text-anchor="middle" font-family="Arial, system-ui, sans-serif" font-size="25" font-weight="700" fill="${palette.white}">${esc(pin.overlay.CTA)}</text><text x="72" y="1385" font-family="Arial, system-ui, sans-serif" font-size="21" font-weight="700" letter-spacing="2" fill="${palette.cyanLight}">FLOWHOME.DEV  /  ${footerKind}</text></svg>`;
};

await fs.mkdir(path.join(root, 'sources'), { recursive: true });
await fs.mkdir(path.join(root, 'png'), { recursive: true });
const composites = [];
for (const [index, pin] of data.pins.entries()) {
  const svg = svgFor(pin, index);
  const svgPath = path.join(root, pin.image.replace(/^png\//, 'sources/').replace(/\.png$/, '.svg'));
  const pngPath = path.join(root, pin.image);
  await fs.writeFile(svgPath, svg, 'utf8');
  if (pin.id === 'roborock-q5-plus-review' && /mop/i.test(svg)) fail('stale Roborock Q5+ mopping claim in SVG');
  if (pin.id === 'roomba-j7-plus-review' && /lidar/i.test(svg)) fail('stale Roomba j7+ LiDAR claim in SVG');
  await sharp(Buffer.from(svg)).png().toFile(pngPath);
  const label = Buffer.from(`<svg width="1000" height="70"><rect width="1000" height="70" fill="#f8fafc"/><text x="24" y="44" font-family="Arial" font-size="27" font-weight="700" fill="#0f172a">${esc(pin.id)}</text></svg>`);
  composites.push({ input: await sharp(pngPath).resize(1000, 1500).toBuffer(), left: (index % 3) * 1000, top: Math.floor(index / 3) * 1570 });
  composites.push({ input: label, left: (index % 3) * 1000, top: Math.floor(index / 3) * 1570 + 1500 });
}
await sharp({ create: { width: 3000, height: 4710, channels: 4, background: '#f8fafc' } }).composite(composites).png().toFile(path.join(root, 'contact-sheet.png'));
if ((await fs.readdir(path.join(root, 'sources'))).filter(file => file.endsWith('.svg')).length !== 9) fail('source count after generation');
if ((await fs.readdir(path.join(root, 'png'))).filter(file => file.endsWith('.png')).length !== 9) fail('PNG count after generation');
for (const pin of data.pins) { const meta = await sharp(path.join(root, pin.image)).metadata(); if (meta.width !== W || meta.height !== H) fail(`wrong dimensions for ${pin.id}`); }
console.log(`Generated ${data.pins.length} SVG sources, ${data.pins.length} PNGs, and contact sheet at ${root}`);
