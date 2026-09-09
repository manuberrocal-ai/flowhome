import config from '../../astro.config.mjs';
import { fileURLToPath } from 'node:url';

// Local preview of the fixed FH13H review artifact; not a build or deployment config.
export default {
  ...config,
  outDir: fileURLToPath(new URL('../../artifacts/editorial-review-20260908-fh13h/', import.meta.url)),
};
