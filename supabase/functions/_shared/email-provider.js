export function getEmailProvider(environment = Deno.env.get('EMAIL_PROVIDER') || 'mock') {
  if (environment !== 'mock') throw new Error('Email provider activation is blocked.');
  return {
    name: 'mock',
    async send({ idempotencyKey }) {
      // Deliberately no network request, no recipient retention, and no recipient logging.
      return { state: 'mock', confirmed: true, providerMessageId: `mock-${String(idempotencyKey).slice(0, 48)}` };
    },
  };
}
