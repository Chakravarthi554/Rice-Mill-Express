const asyncHandler = require('express-async-handler');
const Message = require('../models/Message');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const { emailQueue } = require('../jobs/queues');
const path = require('path');
const fs = require('fs');

const multer = require('multer');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `chat-${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only images and PDFs are allowed'), false);
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
}).single('image');

// Transporter removed in favor of background jobs

const sendMessage = asyncHandler(async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      console.error('Multer error:', err.message);
      return res.status(400).json({ message: err.message });
    }

    const { receiverId, content, orderId, productId } = req.body;
    const senderId = req.user._id;
    const image = req.file ? `${process.env.BACKEND_URL}/uploads/${req.file.filename}` : null;

    if (!receiverId) return res.status(400).json({ message: 'Receiver ID is required' });
    if (!content && !image) return res.status(400).json({ message: 'Either content or image is required' });

    try {
      // 1. Find or create conversation
      let conversation = await Conversation.findOne({
        participants: { $all: [senderId, receiverId] }
      });

      if (!conversation) {
        conversation = await Conversation.create({
          participants: [senderId, receiverId],
          startedBy: senderId,
          unreadCounts: { [senderId]: 0, [receiverId]: 0 }
        });
      }

      // 2. Create message with conversationId
      const message = await Message.create({
        sender: senderId,
        receiver: receiverId,
        conversationId: conversation._id,
        content: content || '',
        orderId,
        productId,
        image,
        sentBy: senderId,
        status: 'sent'
      });

      // 3. Update conversation last message
      conversation.lastMessage = message._id;
      conversation.isActive = true;
      const currentUnread = conversation.unreadCounts.get(receiverId.toString()) || 0;
      conversation.unreadCounts.set(receiverId.toString(), currentUnread + 1);
      await conversation.save();

      const populatedMessage = await Message.findById(message._id)
        .populate('sender', 'name email _id')
        .populate('receiver', 'name email _id');

      if (!populatedMessage.sender || !populatedMessage.receiver) {
        throw new Error('Failed to populate sender or receiver');
      }

      const io = req.app.get('io');
      // UNIFY SOCKET EVENTS
      io.to(`user_${receiverId}`).emit('chat:message', { message: populatedMessage, conversationId: conversation._id });
      io.to(`user_${senderId}`).emit('chat:message', { message: populatedMessage, conversationId: conversation._id });
      io.to('admin').emit('NEW_MESSAGE_ADMIN', populatedMessage);
      io.to('admin_room').emit('chat:message', { message: populatedMessage, conversationId: conversation._id });

      const receiver = await User.findById(receiverId);
      if (receiver && !receiver.isOnline) {
        try {
          await emailQueue.add({
            email: receiver.email,
            subject: 'New Message in Rice Mill App',
            message: `You have a new message from ${req.user.name}: ${content || 'Image/PDF message'}<br><br>Reply at: <a href="${process.env.FRONTEND_URL}">${process.env.FRONTEND_URL}</a>`,
          });
        } catch (mailErr) {
          console.error('Email enqueueing failed:', mailErr.message);
        }
      }

      res.status(201).json(populatedMessage);
    } catch (error) {
      console.error('Message creation error:', error.message);
      res.status(400).json({ message: error.message });
    }
  });
});

const getChatHistory = asyncHandler(async (req, res) => {
  const { receiverId } = req.params;
  const senderId = req.user._id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const messages = await Message.find({
    $or: [
      { sender: senderId, receiver: receiverId },
      { sender: receiverId, receiver: senderId },
    ],
  })
    .populate('sender', 'name email _id')
    .populate('receiver', 'name email _id')
    .sort({ createdAt: 1 })
    .skip(skip)
    .limit(limit);

  const totalMessages = await Message.countDocuments({
    $or: [
      { sender: senderId, receiver: receiverId },
      { sender: receiverId, receiver: senderId },
    ],
  });

  res.json({ messages, totalPages: Math.ceil(totalMessages / limit), currentPage: page });
});

const getAllChatsForAdmin = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const messages = await Message.find({})
    .populate('sender', 'name email _id')
    .populate('receiver', 'name email _id')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const totalMessages = await Message.countDocuments();

  if (messages.some(msg => !msg.sender || !msg.receiver)) {
    console.warn('Some messages have missing sender or receiver data');
  }

  res.json({ messages, totalPages: Math.ceil(totalMessages / limit), currentPage: page });
});

const flagMessage = asyncHandler(async (req, res) => {
  const message = await Message.findByIdAndUpdate(
    req.params.messageId,
    { isFlagged: true },
    { new: true }
  )
    .populate('sender', 'name email _id')
    .populate('receiver', 'name email _id');
  if (!message) throw new Error('Message not found');
  res.json(message);
});

const deleteMessage = asyncHandler(async (req, res) => {
  const message = await Message.findByIdAndDelete(req.params.messageId);
  if (!message) throw new Error('Message not found');
  res.json({ message: 'Message deleted', success: true });
});

const blockUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const user = await User.findByIdAndUpdate(
    userId,
    { active: false },
    { new: true }
  );
  if (!user) throw new Error('User not found');

  const io = req.app.get('io');
  io.to(`user_${userId}`).emit('USER_BLOCKED', { userId });
  io.to('admin').emit('USER_BLOCKED', { userId });

  res.json({ message: 'User blocked successfully', success: true });
});

module.exports = { sendMessage, getChatHistory, getAllChatsForAdmin, flagMessage, deleteMessage, blockUser };