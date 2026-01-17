const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const {
    startConversation,
    getAvailableUsers,
    toggleArchive
} = require('../controllers/adminChatController');

// Admin-only routes
router.post('/start', protect, admin, startConversation);
router.get('/available-users', protect, admin, getAvailableUsers);
router.put('/archive/:conversationId', protect, admin, toggleArchive);

module.exports = router;
