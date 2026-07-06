const Queue = require('bull');

const redisOptions = {
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
  }
};

const isRedisDisabled = process.env.DISABLE_REDIS === 'true';

const createMockQueue = (name) => ({
  add: async (data) => console.log(`[Mock Queue] Job added to ${name} (Redis disabled)`),
  process: () => console.log(`[Mock Queue] Processor registered for ${name}`),
  on: () => {},
});

const emailQueue = isRedisDisabled ? createMockQueue('email-sending') : new Queue('email-sending', redisOptions);
const pdfQueue = isRedisDisabled ? createMockQueue('pdf-generation') : new Queue('pdf-generation', redisOptions);
const fcmQueue = isRedisDisabled ? createMockQueue('fcm-push') : new Queue('fcm-push', redisOptions);

// Error handling to prevent unhandled promise rejections on Redis connection issues
const handleQueueError = (queue, name) => {
  queue.on('error', (err) => {
    console.error(`[Bull Queue Error] ${name}:`, err.message);
  });
};

if (!isRedisDisabled) {
  handleQueueError(emailQueue, 'Email Queue');
  handleQueueError(pdfQueue, 'PDF Queue');
  handleQueueError(fcmQueue, 'FCM Queue');
}

module.exports = {
  emailQueue,
  pdfQueue,
  fcmQueue
};
