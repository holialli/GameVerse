const Redis = require('ioredis');

const redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_URL;

// Redis is optional in local development. If no URL is configured, disable it gracefully.
if (!redisUrl) {
  module.exports = null;
} else {
  const redis = new Redis(redisUrl, {
    // Keep reconnect attempts bounded but active so brief network blips don't break auth.
    maxRetriesPerRequest: null,
    retryStrategy: (times) => {
      if (times > 20) {
        return null;
      }
      return Math.min(times * 200, 2000);
    },
  });

  redis.on('connect', () => {
    console.log('Redis connected');
  });

  redis.on('reconnecting', () => {
    console.warn('Redis reconnecting...');
  });

  redis.on('close', () => {
    console.warn('Redis connection closed');
  });

  redis.on('error', (err) => {
    console.error('Redis connection error:', err);
  });

  module.exports = redis;
}
