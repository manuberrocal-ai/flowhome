import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

test('source and public checkout bytes remain LF with autocrlf enabled while binary images stay intact', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'flowhome-eol-'));
  const git = (...args) => execFileSync('git', args, { cwd: root, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  git('init', '--quiet');
  git('config', 'core.autocrlf', 'true');
  git('config', 'core.safecrlf', 'false');
  writeFileSync(path.join(root, '.gitattributes'), readFileSync(new URL('../.gitattributes', import.meta.url)));
  mkdirSync(path.join(root, 'public', '.well-known'), { recursive: true });
  mkdirSync(path.join(root, 'public', 'images'));
  mkdirSync(path.join(root, 'src', 'content'), { recursive: true });
  const texts = ['public/_headers', 'public/favicon.svg', 'public/.well-known/security.txt', 'public/images/quiz.svg', 'src/content/review.md', 'README.md'];
  for (const file of texts) writeFileSync(path.join(root, file), 'first\r\nsecond\r\n');
  const binary = Buffer.from([82, 73, 70, 70, 0, 13, 10, 255, 128, 10]);
  writeFileSync(path.join(root, 'public/images/product.webp'), binary);
  git('add', '--all');
  const output = path.join(root, 'checkout');
  mkdirSync(output);
  git('checkout-index', '--all', `--prefix=${output.replaceAll('\\', '/')}/`);
  for (const file of texts) assert.equal(readFileSync(path.join(output, file), 'utf8'), 'first\nsecond\n');
  assert.deepEqual(readFileSync(path.join(output, 'public/images/product.webp')), binary);
  // Retain the isolated fixture for diagnosis; never recursively delete broad paths.
});
