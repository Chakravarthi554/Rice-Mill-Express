const Queue = require('bull');

const redisOptions = {
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
  }
};

const emailQueue = new Queue('email-sending', redisOptions);
const pdfQueue = new Queue('pdf-generation', redisOptions);
const fcmQueue = new Queue('fcm-push', redisOptions);

// Error handling to prevent unhandled promise rejections on Redis connection issues
const handleQueueError = (queue, name) => {
  queue.on('error', (err) => {
    console.error(`[Bull Queue Error] ${name}:`, err.message);
  });
};

handleQueueError(emailQueue, 'Email Queue');
handleQueueError(pdfQueue, 'PDF Queue');
handleQueueError(fcmQueue, 'FCM Queue');

module.exports = {
  emailQueue,
  pdfQueue,
  fcmQueue
};
