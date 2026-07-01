const { getAsync, setAsync } = require('../utils/redis');

const cacheMiddleware = (duration = 300) => {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }
    const key = `cache:${req.originalUrl}`;
    
    try {
      const cachedResponse = await getAsync(key);
      if (cachedResponse) {
        console.log(`⚡ Serving from Redis cache: ${key}`);
        return res.json(JSON.parse(cachedResponse));
      }
      
      // Monkey patch res.json to cache the response before sending
      const originalJson = res.json;
      res.json = function(body) {
        setAsync(key, JSON.stringify(body), 'EX', duration);
        originalJson.call(this, body);
      };
      
      next();
    } catch (error) {
      console.warn('⚠️ Cache Middleware Error:', error.message);
      next();
    }
  };
};

module.exports = cacheMiddleware;
