const redis = require('redis');

const client = redis.createClient({
  socket: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
    reconnectStrategy: (retries) => {
      if (retries > 5) {
        console.log('🛑 Redis: Max retries reached. Cache will be disabled for this session.');
        return false; // stop reconnecting
      }
      return Math.min(retries * 100, 3000);
    }
  }
});

let isRedisAvailable = false;

client.on('error', (err) => {
  if (isRedisAvailable || err.code === 'ECONNREFUSED') {
    // Only log once if it's a refuse error to avoid flooding
    if (!client.errorLogged) {
      console.error('⚠️ Redis Cache unavailable (ECONNREFUSED). Running without cache.');
      client.errorLogged = true;
    }
  } else {
    console.log('Redis Client Error', err);
  }
});

client.on('connect', () => {
  isRedisAvailable = true;
  console.log('🔄 Redis Connecting...');
});

const connectRedis = async () => {
  try {
    await client.connect();
    isRedisAvailable = true;
    console.log('✅ Redis Connected');
  } catch (err) {
    // Error already handled by 'error' listener
    isRedisAvailable = false;
  }
};

// Redis v4 Native Promise Wrappers
const getAsync = async (key) => {
  try {
    if (!isRedisAvailable || !client.isOpen) return null;
    return await client.get(key);
  } catch (error) {
    return null; // Quietly fail
  }
};

const setAsync = async (key, value, mode, duration) => {
  try {
    if (!isRedisAvailable || !client.isOpen) return;

    const options = {};
    if (mode === 'EX' && duration) {
      options.EX = duration;
    }

    await client.set(key, value, options);
  } catch (error) {
    // Quietly fail
  }
};

module.exports = { client, connectRedis, getAsync, setAsync };