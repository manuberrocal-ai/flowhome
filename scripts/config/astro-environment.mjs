import { loadEnv } from 'vite';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { environmentEvidence, environmentHeaders, resolveEnvironment } from './environment.mjs';

export function flowhomeEnvironment() {
  let current;
  return {
    name: 'flowhome-environment',
    hooks: {
      'astro:config:setup': ({ updateConfig }) => {
        updateConfig({ vite: { plugins: [{
          name: 'flowhome-validated-public-environment',
          enforce: 'pre',
          config: (config, { mode }) => {
            current = resolveEnvironment(loadEnv(mode, config.envDir || config.root || process.cwd(), ''));
            // Static artifacts cannot enforce commercial or claim expiry after publication.
            // This is a delivery invariant, never an environment opt-in switch.
            return { define: { __FLOWHOME_PUBLIC_CONFIG__: JSON.stringify(current), __FLOWHOME_STATIC_COMMERCE__: true, __FLOWHOME_STATIC_COMPATIBILITY__: true } };
          },
        }] } });
      },
      'astro:build:done': ({ dir }) => {
        if (!current) throw new Error('FlowHome configuration: build environment was not validated');
        const headersPath = fileURLToPath(new URL('_headers', dir));
        writeFileSync(headersPath, environmentHeaders(readFileSync(headersPath, 'utf8'), current));
        writeFileSync(new URL('release-environment.json', dir), `${JSON.stringify(environmentEvidence(current), null, 2)}\n`);
      },
    },
  };
}
