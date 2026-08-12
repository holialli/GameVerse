const crypto = require('crypto');

const LEMONSQUEEZY_API_BASE = 'https://api.lemonsqueezy.com/v1';

const lsRequest = async (path, options = {}) => {
  const apiKey = process.env.LEMONSQUEEZY_API_KEY;
  if (!apiKey) throw new Error('Lemon Squeezy is not configured on this server.');

  const response = await fetch(`${LEMONSQUEEZY_API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/vnd.api+json',
      'Content-Type': 'application/vnd.api+json',
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.errors?.[0]?.detail || 'Lemon Squeezy request failed');
  }
  return data;
};

// customData is passed straight through to the webhook as meta.custom_data -
// how we tell "which user/API client does this subscription belong to"
// apart when the webhook fires later.
const createCheckout = async ({ email, customData, variantId }) => {
  const storeId = process.env.LEMONSQUEEZY_STORE_ID;
  const resolvedVariantId = variantId || process.env.LEMONSQUEEZY_VARIANT_ID;
  if (!storeId || !resolvedVariantId) {
    throw new Error('Lemon Squeezy store/variant is not configured.');
  }

  const body = {
    data: {
      type: 'checkouts',
      attributes: {
        checkout_data: { email, custom: customData || {} },
      },
      relationships: {
        store: { data: { type: 'stores', id: String(storeId) } },
        variant: { data: { type: 'variants', id: String(resolvedVariantId) } },
      },
    },
  };

  const result = await lsRequest('/checkouts', { method: 'POST', body: JSON.stringify(body) });
  return result?.data?.attributes?.url;
};

// Lemon Squeezy signs webhooks with an X-Signature header (HMAC-SHA256 of
// the raw request body). Needs the raw body, not the parsed object - see
// app.js's express.json({ verify }) capturing req.rawBody for this.
const verifyWebhookSignature = (rawBody, signature) => {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret || !signature || !rawBody) return false;

  const digest = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(digest, 'utf8'), Buffer.from(signature, 'utf8'));
  } catch (err) {
    return false;
  }
};

module.exports = { createCheckout, verifyWebhookSignature };
