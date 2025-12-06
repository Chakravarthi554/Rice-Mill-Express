const express = require('express');
const router = express.Router();
const healthMonitor = require('../utils/healthMonitor');
router.get('/', (req, res) => {
  const health = healthMonitor.getSystemHealth();
  res.json({
    status: health.database === 'OK' ? 'healthy' : 'degraded',
    ...health
  });
});
module.exports = router;