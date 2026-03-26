const Redis = require('ioredis');

const redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_URL;

// Redis is optional in local development. If no URL is configured, disable it gracefully.
if (!redisUrl) {
  module.exports = null;
} else {
  const redis = new Redis(redisUrl, {
    maxRetriesPerRequest: 1,
    retryStrategy: () => null,
  });

  redis.on('error', (err) => {
    console.error('Redis connection error:', err);
  });

  module.exports = redis;
}
