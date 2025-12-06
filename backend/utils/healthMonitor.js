const mongoose = require('mongoose');
const os = require('os');
module.exports = {
  getSystemHealth: () => ({
    database: mongoose.connection.readyState === 1 ? 'OK' : 'DOWN',
    memory: {
      free: `${Math.round(os.freemem() / 1024 / 1024)} MB`,
      total: `${Math.round(os.totalmem() / 1024 / 1024)} MB`
    },
    uptime: `${Math.floor(process.uptime() / 60)} minutes`,
    load: os.loadavg()
  }),

  trackRequest: (req) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  }
};