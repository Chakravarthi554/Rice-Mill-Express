const { fcmQueue } = require('../queues');
const admin = require('firebase-admin');

console.log('👷 FCM Worker initialized');

fcmQueue.process(async (job) => {
  try {
    console.log(`[FCM Worker] Processing job ${job.id} for tokens:`, job.data.tokens);
    
    if (!job.data.tokens || job.data.tokens.length === 0) {
      console.log(`[FCM Worker] No tokens provided for job ${job.id}, skipping.`);
      return { success: true, skipped: true };
    }

    const message = {
      notification: {
        title: job.data.title || 'Notification',
        body: job.data.body || '',
      },
      data: job.data.data || {},
      tokens: job.data.tokens,
    };

    // Make sure firebase admin is initialized elsewhere before this runs
    if (admin.apps.length > 0) {
      const response = await admin.messaging().sendMulticast(message);
      console.log(`[FCM Worker] Job ${job.id} completed. Success count: ${response.successCount}, Failure count: ${response.failureCount}`);
      return { success: true, response };
    } else {
      console.warn(`[FCM Worker] Firebase Admin not initialized. Skipping FCM send for job ${job.id}.`);
      return { success: false, reason: 'Firebase not initialized' };
    }
  } catch (error) {
    console.error(`[FCM Worker] Job ${job.id} failed:`, error.message);
    throw error;
  }
});
