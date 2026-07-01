// Load queues first to initialize Redis connections
require('../queues');

// Initialize workers
require('./emailWorker');
require('./pdfWorker');
require('./fcmWorker');

console.log('✅ Bull background workers initialized');
