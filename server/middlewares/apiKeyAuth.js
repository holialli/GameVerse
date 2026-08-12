const crypto = require('crypto');
const ApiClient = require('../models/ApiClient');
const ApiUsage = require('../models/ApiUsage');

const hashKey = (key) => crypto.createHash('sha256').update(key).digest('hex');

// Metered via Mongo (not Redis, which is optional/best-effort elsewhere in
// this codebase) - a silently-failing paid-quota counter is a real money
// bug, unlike a silently-failing session cache.
const apiKeyAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const bearerKey = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
    const rawKey = bearerKey || req.headers['x-api-key'];

    if (!rawKey) {
      return res.status(401).json({ error: 'API key required (Authorization: Bearer <key> or X-API-Key header)' });
    }

    const apiClient = await ApiClient.findOne({ keyHash: hashKey(rawKey), active: true });
    if (!apiClient) {
      return res.status(401).json({ error: 'Invalid or inactive API key' });
    }

    const yearMonth = new Date().toISOString().slice(0, 7);
    const usage = await ApiUsage.findOneAndUpdate(
      { apiClientId: apiClient._id, yearMonth },
      { $inc: { count: 1 } },
      { upsert: true, new: true }
    );

    // Increment-then-check: the request that tips the counter over the
    // limit still consumes a slot and gets rejected - simpler than a
    // pre-check-then-increment race under concurrent requests.
    if (usage.count > apiClient.monthlyLimit) {
      return res.status(429).json({ error: 'Monthly quota exceeded', limit: apiClient.monthlyLimit, plan: apiClient.plan });
    }

    req.apiClient = apiClient;
    next();
  } catch (error) {
    res.status(500).json({ error: 'API authentication failed' });
  }
};

module.exports = apiKeyAuth;
