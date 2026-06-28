const required = ['CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_ACCOUNT_ID'];
const missing = required.filter((name) => !process.env[name]);
if (missing.length) {
  console.log(`Cloudflare deploy not executed. Missing secrets: ${missing.join(', ')}`);
  process.exit(0);
}
console.log('Cloudflare secrets detected. GitHub Actions can deploy using wrangler/pages integration.');
