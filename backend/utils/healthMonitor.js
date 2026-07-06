const mongoose = require('mongoose');
const os = require('os');
const { client: redisClient } = require('./redis');
const { emailQueue, pdfQueue, fcmQueue } = require('../jobs/queues');

module.exports = {
  getSystemHealth: async () => {
    let redisStatus = 'DOWN';
    try {
      if (redisClient && redisClient.isOpen) {
        await redisClient.ping();
        redisStatus = 'OK';
      }
    } catch (e) {
      redisStatus = 'ERROR';
    }

    let bullmqStatus = { email: 'DOWN', pdf: 'DOWN', fcm: 'DOWN' };
    try {
      const [emailCounts, pdfCounts, fcmCounts] = await Promise.all([
        emailQueue.getJobCounts(),
        pdfQueue.getJobCounts(),
        fcmQueue.getJobCounts()
      ]);
      bullmqStatus = { email: emailCounts, pdf: pdfCounts, fcm: fcmCounts };
    } catch (e) {
      bullmqStatus = 'ERROR';
    }

    return {
      database: mongoose.connection.readyState === 1 ? 'OK' : 'DOWN',
      redis: redisStatus,
      bullmq: bullmqStatus,
      memory: {
        free: `${Math.round(os.freemem() / 1024 / 1024)} MB`,
        total: `${Math.round(os.totalmem() / 1024 / 1024)} MB`
      },
      uptime: `${Math.floor(process.uptime() / 60)} minutes`,
      load: os.loadavg()
    };
  },

  trackRequest: (req) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  }
};