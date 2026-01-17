const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
    sendMessage,
    getConversations,
    getMessages,
    markAsRead,
    deleteMessage,
    clearChat,
    toggleAction,
    updateMessage,
    toggleStar,
    toggleMessagePin,
    reportChat
} = require('../controllers/chatController');

router.post('/send', protect, sendMessage);
router.get('/conversations', protect, getConversations);
router.get('/messages/:conversationId', protect, getMessages);
router.put('/read/:conversationId', protect, markAsRead);
router.delete('/message/:id', protect, deleteMessage);
router.put('/message/:id', protect, updateMessage); // New: Edit message
router.put('/message/:id/star', protect, toggleStar); // New: Star message
router.put('/message/:id/pin', protect, toggleMessagePin); // New: Pin message
router.post('/report', protect, reportChat);
router.put('/clear/:conversationId', protect, clearChat);
router.put('/action/:conversationId', protect, toggleAction); // Pin, Mute, Disable Conversation

module.exports = router;
