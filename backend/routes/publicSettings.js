const express = require('express');
const router = express.Router();
const {
    getPublicSettings
} = require('../controllers/adminSettingsController');
const { protect } = require('../middleware/auth');

// Public settings endpoint - accessible to all authenticated users
router.get('/public', protect, getPublicSettings);

module.exports = router;
