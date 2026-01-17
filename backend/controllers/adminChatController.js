const asyncHandler = require('express-async-handler');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const User = require('../models/User');

// @desc    Admin starts a conversation with a user (seller/customer)
// @route   POST /api/admin/chat/start
// @access  Private/Admin
const startConversation = asyncHandler(async (req, res) => {
    const { userId, initialMessage } = req.body;

    if (!userId) {
        res.status(400);
        throw new Error('User ID is required');
    }

    // Verify target user exists
    const targetUser = await User.findById(userId);
    if (!targetUser) {
        res.status(404);
        throw new Error('User not found');
    }

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
        participants: { $all: [req.user._id, userId] }
    }).populate('participants', 'name profileImage role isOnline lastActive');

    if (!conversation) {
        // Create new conversation
        conversation = await Conversation.create({
            participants: [req.user._id, userId],
            startedBy: req.user._id,
            unreadCounts: { [req.user._id]: 0, [userId]: 0 }
        });

        conversation = await Conversation.findById(conversation._id)
            .populate('participants', 'name profileImage role isOnline lastActive');
    }

    // Send initial message if provided
    let message = null;
    if (initialMessage && initialMessage.trim()) {
        message = await Message.create({
            conversationId: conversation._id,
            sender: req.user._id,
            receiver: userId,
            content: initialMessage,
            sentBy: req.user._id,
            status: 'sent'
        });

        message = await Message.findById(message._id)
            .populate('sender', 'name profileImage role')
            .populate('receiver', 'name profileImage role');

        // Update conversation
        conversation.lastMessage = message._id;
        conversation.unreadCounts.set(userId.toString(), 1);
        await conversation.save();

        // Emit socket events
        const io = req.app.get('io');
        if (io) {
            io.to(`user_${userId}`).emit('chat:message', { message, conversationId: conversation._id });
            io.to(`user_${userId}`).emit('chat:conversation_update', conversation);
            io.to(`user_${req.user._id}`).emit('chat:conversation_update', conversation);
        }
    }

    res.status(201).json({
        conversation,
        message,
        success: true
    });
});

// @desc    Get all users available for chat (sellers, customers)
// @route   GET /api/admin/chat/available-users
// @access  Private/Admin
const getAvailableUsers = asyncHandler(async (req, res) => {
    const { search, role, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    let query = {
        _id: { $ne: req.user._id },
        role: { $in: ['seller', 'customer'] }
    };

    if (role) {
        query.role = role;
    }

    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { 'businessDetails.businessName': { $regex: search, $options: 'i' } }
        ];
    }

    const users = await User.find(query)
        .select('name email role profileImage businessDetails isOnline lastActive kycStatus')
        .sort({ lastActive: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
        users,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
    });
});

// @desc    Archive/Unarchive conversation
// @route   PUT /api/admin/chat/archive/:conversationId
// @access  Private/Admin
const toggleArchive = asyncHandler(async (req, res) => {
    const conversation = await Conversation.findById(req.params.conversationId);
    
    if (!conversation) {
        res.status(404);
        throw new Error('Conversation not found');
    }

    if (!conversation.participants.includes(req.user._id)) {
        res.status(403);
        throw new Error('Not authorized');
    }

    conversation.archived = !conversation.archived;
    await conversation.save();

    res.json({ success: true, archived: conversation.archived });
});

module.exports = {
    startConversation,
    getAvailableUsers,
    toggleArchive
};
