import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import { readFileSync } from 'node:fs';

test('type checking excludes generated candidates without excluding source', () => {
  const config = JSON.parse(readFileSync(new URL('../tsconfig.json', import.meta.url), 'utf8').replace(/^\uFEFF/, ''));
  assert.deepEqual(config.exclude, ['node_modules', 'dist', 'artifacts']);
  assert.equal(config.extends, 'astro/tsconfigs/strict');
  assert.equal(config.compilerOptions.allowJs, true);
});

test('the installed compiler retains the transpilation API used by browser QA', () => {
  assert.equal(typeof ts.transpileModule, 'function', 'Browser QA requires the JavaScript compiler API; review native compiler migrations separately');
  const result = ts.transpileModule('export const value: number = 42;', {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
    reportDiagnostics: true,
  });
  assert.equal(result.diagnostics.length, 0);
  assert.match(result.outputText, /export const value = 42/);
});

test('the installed TypeScript ESLint entry point loads with the project compiler', async () => {
  const { default: tooling } = await import('typescript-eslint');
  assert.equal(typeof tooling.parser.parseForESLint, 'function');
  const result = tooling.parser.parseForESLint('const value: number = 42;', {
    filePath: 'toolchain-probe.ts',
    ecmaVersion: 'latest',
    sourceType: 'module',
  });
  assert.equal(result.ast.type, 'Program');
  assert.equal(result.ast.body[0].type, 'VariableDeclaration');
});
