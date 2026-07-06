const express = require('express');
const router = express.Router();
const healthMonitor = require('../utils/healthMonitor');
router.get('/', async (req, res) => {
  const health = await healthMonitor.getSystemHealth();
  res.json({
    status: health.database === 'OK' && health.redis === 'OK' ? 'healthy' : 'degraded',
    ...health
  });
});
module.exports = router;