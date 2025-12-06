const express = require('express');
const router = express.Router();
const auth = require("../middleware/auth");
const { sendMessage, getChatHistory, getAllChatsForAdmin, flagMessage, deleteMessage, blockUser } = require('../controllers/messageController');

router.post('/send', auth.protect, sendMessage);
router.get('/history/:receiverId', auth.protect, getChatHistory);
router.get('/admin/chats', auth.protect, auth.role('admin'), getAllChatsForAdmin);
router.put('/flag/:messageId', auth.protect, auth.role('admin'), flagMessage);
router.delete('/delete/:messageId', auth.protect, auth.role('admin'), deleteMessage);
router.put('/block/:userId', auth.protect, auth.role('admin'), blockUser);

module.exports = router;