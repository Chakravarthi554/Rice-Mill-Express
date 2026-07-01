const { emailQueue } = require('../queues');
const sendEmail = require('../../utils/sendEmail');

console.log('👷 Email Worker initialized');

emailQueue.process(async (job) => {
  try {
    console.log(`[Email Worker] Processing job ${job.id} - sending email to ${job.data.email}`);
    await sendEmail(job.data);
    console.log(`[Email Worker] Job ${job.id} completed successfully`);
    return { success: true };
  } catch (error) {
    console.error(`[Email Worker] Job ${job.id} failed:`, error.message);
    throw error;
  }
});
