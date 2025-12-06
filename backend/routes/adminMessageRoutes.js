const express = require('express');
const router = express.Router();
const {
  getAdminConversations,
  getConversationWithUser,
  adminSendMessage,
  markConversationResolved,
  getMessageStats
} = require('../controllers/adminMessageController');
const { protect, admin } = require('../middleware/auth');

// All routes are protected and admin-only
router.use(protect, admin);

router.get('/conversations', getAdminConversations);
router.get('/conversations/:userId', getConversationWithUser);
router.post('/send', adminSendMessage);
router.put('/conversations/:userId/resolve', markConversationResolved);
router.get('/stats', getMessageStats);

module.exports = router;