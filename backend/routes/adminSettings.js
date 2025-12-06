const express = require('express');
const router = express.Router();
const {
  getAdminSettings,
  updateAdminSettings,
  sendBulkPushNotification,
  getAvailableRecipes,
  resetSettingsToDefault
} = require('../controllers/adminSettingsController');
const { protect, admin } = require('../middleware/auth');

// All routes are protected and admin-only
router.use(protect, admin);

router.get('/', getAdminSettings);
router.put('/', updateAdminSettings);
router.post('/push-notification', sendBulkPushNotification);
router.get('/recipes', getAvailableRecipes);
router.post('/reset', resetSettingsToDefault);

module.exports = router;