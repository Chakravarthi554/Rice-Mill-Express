const express = require('express');
const router = express.Router();
const {
  getUserNotifications,
  getAdminNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  getNotificationStats
} = require('../controllers/notificationController');
const { protect, admin } = require('../middleware/auth');

// User notification routes
router.get('/', protect, getUserNotifications);
router.get('/stats', protect, getNotificationStats);
router.put('/read-all', protect, markAllAsRead);
router.put('/:id/read', protect, markAsRead);
router.delete('/:id', protect, deleteNotification);
router.delete('/', protect, clearAllNotifications);

// Admin notification routes
router.get('/admin', protect, admin, getAdminNotifications);

module.exports = router;

