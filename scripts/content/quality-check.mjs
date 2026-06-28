import { listFiles, readText, frontmatterMarkdown, writeText } from '../lib/content-utils.mjs';

function runQualityGate(content) {
  const checks = [];
  const words = content.split(/\s+/).filter(Boolean);
  const h2 = (content.match(/^##\s+/gm) || []).length;
  const has = (re) => re.test(content);
  checks.push(['wordCount', words.length >= 350, `${words.length} words`]);
  checks.push(['h2Structure', h2 >= 4, `${h2} H2 sections`]);
  checks.push(['specifications', has(/specifications|specs|features|technical/i), 'specification language']);
  checks.push(['prosCons', has(/pros|cons/i), 'pros/cons language']);
  checks.push(['faq', has(/faq|frequently asked/i), 'FAQ section']);
  checks.push(['comparison', has(/comparison|compared|vs|versus/i), 'comparison context']);
  checks.push(['affiliateDisclosure', has(/affiliate|amazon associate|commission/i), 'affiliate disclosure']);
  const passed = checks.filter(([, ok]) => ok).length;
  return { passed: passed >= 6, score: passed, checks: checks.map(([name, passed, detail]) => ({ name, passed, detail })) };
}

const files = listFiles('src/content/reviews', '.md');
const results = files.map((file) => {
  const parsed = frontmatterMarkdown(readText(file));
  return { file, title: parsed.data.title, ...runQualityGate(parsed.body) };
});
writeText('data/quality-report.json', JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2));
for (const result of results) console.log(`${result.passed ? 'PASS' : 'FAIL'} ${result.file} score=${result.score}`);
if (results.some((r) => !r.passed)) process.exit(1);
