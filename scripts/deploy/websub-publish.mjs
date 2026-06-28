const HUB_URL = process.env.WEBSUB_HUB_URL || 'https://pubsubhubbub.appspot.com/';
const FEED_URL = process.env.WEBSUB_FEED_URL || 'https://flowhome.dev/rss.xml';
const DRY_RUN = process.env.WEBSUB_DRY_RUN === 'true' || process.argv.includes('--dry-run');
const SOFT_FAIL = process.env.WEBSUB_SOFT_FAIL === 'true' || process.argv.includes('--soft-fail');

async function publishWebSub() {
  const body = new URLSearchParams({
    'hub.mode': 'publish',
    'hub.url': FEED_URL,
  });

  console.log(`WebSub hub: ${HUB_URL}`);
  console.log(`WebSub feed: ${FEED_URL}`);

  if (DRY_RUN) return;

  const response = await fetch(HUB_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  const responseText = await response.text();
  console.log(`WebSub response: ${response.status} ${response.statusText}`);
  if (responseText) console.log(responseText);

  if (![200, 202, 204].includes(response.status)) {
    const message = `WebSub publish failed with ${response.status}.`;
    if (SOFT_FAIL) {
      console.warn(`Warning: ${message}`);
      return;
    }
    throw new Error(message);
  }
}

publishWebSub().catch((error) => {
  console.error(error.message);
  process.exit(1);
});