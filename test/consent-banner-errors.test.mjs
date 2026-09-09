import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

const source = readFileSync(new URL('../src/components/ConsentBanner.astro', import.meta.url), 'utf8');
const script = source.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/import .* from '\.\.\/lib\/consent';/, '');
const code = ts.transpileModule(script, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;

for (const action of ['accepted', 'rejected', 'revoke']) {
  test(`banner explains failed ${action} without announcing a saved preference, then recovers`, () => {
    let saved = 'unset';
    let writable = false;
    let notifications = 0;
    const handlers = {};
    const error = { hidden: true, textContent: '' };
    const banner = { hidden: false, dataset: {}, querySelector: () => error };
    const html = { dataset: {} };
    const set = value => { if (!writable) return 'unset'; saved = value; return value; };
    runInNewContext(code, {
      document: { querySelector: () => banner, documentElement: html, addEventListener: (name, fn) => { handlers[name] = fn; } },
      window: { addEventListener() {}, dispatchEvent() { notifications++; } },
      CustomEvent: class { constructor(name) { this.type = name; } },
      CONSENT_STORAGE_KEY: 'flowhome-consent', getConsentPreference: () => saved,
      setConsentPreference: set, revokeConsent: () => set('rejected'),
    });
    const click = () => handlers.click({ target: { closest: selector => selector === '[data-consent-action]' ? { dataset: { consentAction: action } } : null } });
    click();
    assert.equal(error.hidden, false);
    assert.match(error.textContent, /could not be saved.*previous preference is unchanged/);
    assert.equal(banner.hidden, false);
    assert.equal(saved, 'unset');
    assert.equal(html.dataset.flowhomeConsent, 'unset');
    assert.equal(notifications, 0);
    writable = true;
    click();
    assert.equal(saved, action === 'accepted' ? 'accepted' : 'rejected');
    assert.equal(notifications, 1);
    assert.equal(error.hidden, true);
    assert.equal(error.textContent, '');
    if (action !== 'revoke') {
      assert.equal(banner.hidden, true);
    }
  });
}

test('save error is an initially hidden accessible message inside the banner', () => {
  assert.match(source, /data-consent-error role="alert" hidden/);
});
