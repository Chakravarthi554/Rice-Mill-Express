const asyncHandler = require('express-async-handler');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const Report = require('../models/Report');
const User = require('../models/User');

// --- HELPER ---
// Standard populates for consistency
const POPULATE_MESSAGE = [
    { path: 'sender', select: 'name profileImage role' },
    { path: 'receiver', select: 'name profileImage role' },
    { path: 'replyTo', select: 'content sender' }
];

// @desc    Send a message
// @route   POST /api/chat/send
// @access  Private
exports.sendMessage = asyncHandler(async (req, res) => {
    const { receiverId, content, attachments, type, replyTo } = req.body;
    const senderId = req.user._id;

    if (!receiverId || (!content && !attachments && type === 'text')) {
        res.status(400);
        throw new Error('Receiver and content required');
    }

    // Fetch receiver to check role
    const receiver = await User.findById(receiverId);
    if (!receiver) {
        res.status(404);
        throw new Error('Receiver not found');
    }

    // 1. Find/Create Conversation
    let conversation = await Conversation.findOne({
        participants: { $all: [senderId, receiverId] }
    });

    if (!conversation) {
        // ✅ FIX: Only admin can start conversations (unless receiver is admin)
        if (req.user.role !== 'admin' && receiver.role !== 'admin') {
            res.status(403);
            throw new Error('Only admins can start new conversations with users. If you need support, please contact an admin.');
        }

        conversation = await Conversation.create({
            participants: [senderId, receiverId],
            startedBy: senderId,
            unreadCounts: { [senderId]: 0, [receiverId]: 0 }
        });
    }

    // Check if disabled
    if (conversation.isDisabled && req.user.role !== 'admin') {
        res.status(403);
        throw new Error('You are unable to chat with our company');
    }

    // 2. Create Message
    const messageData = {
        conversationId: conversation._id,
        sender: senderId,
        receiver: receiverId,
        content: content || '',
        sentBy: senderId,
        status: 'sent'
    };

    // Handle attachments
    if (attachments && attachments.length > 0) {
        messageData.attachments = attachments;
        // Set type based on first attachment if no content
        if (!content && attachments[0].type) {
            messageData.type = attachments[0].type;
        }
        // Legacy support: set image field for backward compatibility
        if (attachments[0].type === 'image') {
            messageData.image = attachments[0].url;
        }
    } else {
        messageData.type = type || (content ? 'text' : 'document');
    }

    // Handle reply
    if (replyTo) {
        messageData.replyTo = replyTo;
    }

    const message = await Message.create(messageData);

    // 3. Update Conversation
    conversation.lastMessage = message._id;
    conversation.isActive = true;

    // Increment unread unless muted (logic for mute could be here, but usually we just increment and frontend ignores notification)
    const currentUnread = conversation.unreadCounts.get(receiverId.toString()) || 0;
    conversation.unreadCounts.set(receiverId.toString(), currentUnread + 1);

    await conversation.save();

    // 4. Populate & Emit
    const populatedMessage = await Message.findById(message._id).populate(POPULATE_MESSAGE);
    const populatedConversation = await Conversation.findById(conversation._id)
        .populate('participants', 'name profileImage role isOnline lastActive')
        .populate('lastMessage');

    const io = req.app.get('io');
    if (io) {
        // ✅ BROADCAST to participants
        [senderId, receiverId].forEach(uid => {
            io.to(`user_${uid}`).emit('chat:message', { message: populatedMessage, conversationId: conversation._id });
            io.to(`user_${uid}`).emit('chat:conversation_update', populatedConversation);
        });

        // ✅ BROADCAST to admin_room for real-time visibility
        io.to('admin_room').emit('chat:message', { message: populatedMessage, conversationId: conversation._id });
        io.to('admin_room').emit('chat:conversation_update', populatedConversation);
    }

    res.status(201).json(populatedMessage);
});

// @desc    Update/Edit a message
// @route   PUT /api/chat/message/:id
// @access  Private
exports.updateMessage = asyncHandler(async (req, res) => {
    const { content } = req.body;
    const message = await Message.findById(req.params.id);

    if (!message) {
        res.status(404);
        throw new Error('Message not found');
    }

    if (message.sender.toString() !== req.user._id.toString()) {
        res.status(401);
        throw new Error('Not authorized to edit this message');
    }

    // Only allow editing within a certain time limit (e.g., 15 minutes) or always
    const timeSinceCreation = (new Date() - new Date(message.createdAt)) / (1000 * 60);
    if (timeSinceCreation > 15) {
        // res.status(400);
        // throw new Error('Edit time limit expired');
    }

    message.content = content;
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();

    const populatedMessage = await Message.findById(message._id).populate(POPULATE_MESSAGE);

    // Broadcast update
    const io = req.app.get('io');
    if (io) {
        const conversation = await Conversation.findById(message.conversationId);
        if (conversation) {
            conversation.participants.forEach(uid => {
                io.to(`user_${uid}`).emit('chat:message_updated', populatedMessage);
            });
            // ✅ FIX: Also notify admin room
            io.to('admin_room').emit('chat:message_updated', populatedMessage);
        }
    }

    res.json(populatedMessage);
});

// @desc    Toggle Star on Message
// @route   PUT /api/chat/message/:id/star
// @access  Private
exports.toggleStar = asyncHandler(async (req, res) => {
    const message = await Message.findById(req.params.id);
    if (!message) { res.status(404); throw new Error('Message not found'); }

    const userId = req.user._id;
    if (message.isStarredBy.includes(userId)) {
        message.isStarredBy.pull(userId);
    } else {
        message.isStarredBy.push(userId);
    }

    await message.save();

    // ✅ FIX BUG #5: Broadcast star updates via Socket.IO
    const populatedMessage = await Message.findById(message._id).populate(POPULATE_MESSAGE);
    const io = req.app.get('io');
    if (io) {
        const conversation = await Conversation.findById(message.conversationId);
        if (conversation) {
            conversation.participants.forEach(uid => {
                io.to(`user_${uid}`).emit('chat:message_updated', populatedMessage);
            });
            io.to('admin_room').emit('chat:message_updated', populatedMessage);
        }
    }

    res.json(populatedMessage);
});

// @desc    Toggle Pin on Message
// @route   PUT /api/chat/message/:id/pin
// @access  Private
exports.toggleMessagePin = asyncHandler(async (req, res) => {
    const message = await Message.findById(req.params.id);
    if (!message) { res.status(404); throw new Error('Message not found'); }

    const userId = req.user._id;
    // Check if user is part of the conversation
    const conv = await Conversation.findById(message.conversationId);
    if (!conv.participants.includes(userId)) {
        res.status(403); throw new Error('Not authorized');
    }

    if (message.isPinnedBy.includes(userId)) {
        message.isPinnedBy.pull(userId);
    } else {
        message.isPinnedBy.push(userId);
    }

    await message.save();

    // ✅ FIX BUG #5: Broadcast pin updates via Socket.IO
    const populatedMessage = await Message.findById(message._id).populate(POPULATE_MESSAGE);
    const io = req.app.get('io');
    if (io) {
        conv.participants.forEach(uid => {
            io.to(`user_${uid}`).emit('chat:message_updated', populatedMessage);
        });
        io.to('admin_room').emit('chat:message_updated', populatedMessage);
    }

    res.json(populatedMessage);
});

// @desc    Get Conversations
// @route   GET /api/chat/conversations
// @access  Private
exports.getConversations = asyncHandler(async (req, res) => {
    // Fetch conversations where user is participant
    // Sort logic: Pinned first, then by updatedAt
    // MongoDB aggregation or JS sort. JS sort is easier for small sets.

    let conversations = await Conversation.find({
        participants: req.user._id,
        isActive: true
    })
        .populate('participants', 'name profileImage role isOnline lastActive')
        .populate('lastMessage')
        .sort({ updatedAt: -1 });

    // Custom sort: Pinned chats at top
    conversations.sort((a, b) => {
        const aPinned = a.pinnedBy.includes(req.user._id);
        const bPinned = b.pinnedBy.includes(req.user._id);
        if (aPinned && !bPinned) return -1;
        if (!aPinned && bPinned) return 1;
        return 0; // Keep existing date sort
    });

    res.json(conversations);
});

// @desc    Get Messages
// @route   GET /api/chat/messages/:conversationId
// @access  Private
exports.getMessages = asyncHandler(async (req, res) => {
    const { conversationId } = req.params;
    const { search } = req.query; // Add search capability
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation.participants.includes(req.user._id)) {
        res.status(403); throw new Error('Not authorized');
    }

    let query = {
        conversationId,
        // Exclude messages deleted by this user ("Delete for Me")
        deletedBy: { $ne: req.user._id },
        // Don't completely hide "deleted for everyone" - show placeholder instead
    };

    if (search) {
        query.content = { $regex: search, $options: 'i' };
    }

    const messages = await Message.find(query)
        .populate(POPULATE_MESSAGE)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    res.json({
        messages: messages.reverse(),
        total: await Message.countDocuments(query)
    });
});

// @desc    Delete Message (Me or Everyone)
// @route   DELETE /api/chat/message/:id
// @access  Private
exports.deleteMessage = asyncHandler(async (req, res) => {
    const { mode } = req.query; // 'me' or 'everyone'
    const message = await Message.findById(req.params.id);
    if (!message) { res.status(404); throw new Error('Message not found'); }

    const isSender = message.sender.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (mode === 'everyone') {
        // Only sender or admin can delete for everyone
        if (!isSender && !isAdmin) {
            res.status(401); throw new Error('Not authorized to delete for everyone');
        }

        // ✅ FIX: Mark as deleted for everyone instead of truly deleting
        message.isDeletedForEveryone = true;
        message.content = 'This message was deleted';
        message.attachments = [];
        await message.save();

        // Broadcast update (not delete, because we keep the message with a placeholder)
        const io = req.app.get('io');
        if (io) {
            const conv = await Conversation.findById(message.conversationId);
            if (conv) {
                conv.participants.forEach(pid => {
                    io.to(`user_${pid}`).emit('chat:message_updated', message);
                });
                io.to('admin_room').emit('chat:message_updated', message);
            }
        }
    } else {
        // Delete for ME (Soft delete)
        if (!message.deletedBy.includes(req.user._id)) {
            message.deletedBy.push(req.user._id);
            await message.save();
        }

        // Notify the user who deleted (to sync multiple devices)
        const io = req.app.get('io');
        if (io) {
            io.to(`user_${req.user._id}`).emit('chat:message_deleted', { messageId: message._id, mode: 'me' });
        }
    }

    res.json({ success: true, mode });
});

// @desc    Toggle Interaction (Pin, Mute, Disable)
// @route   PUT /api/chat/action/:conversationId
// @access  Private
exports.toggleAction = asyncHandler(async (req, res) => {
    const { action } = req.body; // 'pin', 'mute', 'disable', 'star_msg'?? No, star is msg level.
    // 'enable' for un-disable
    const { conversationId } = req.params;
    const userId = req.user._id;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) { res.status(404); throw new Error('Not found'); }

    switch (action) {
        case 'pin':
            if (conversation.pinnedBy.includes(userId)) {
                conversation.pinnedBy.pull(userId);
            } else {
                conversation.pinnedBy.push(userId);
            }
            break;
        case 'mute':
            if (conversation.mutedBy.includes(userId)) {
                conversation.mutedBy.pull(userId);
            } else {
                conversation.mutedBy.push(userId);
            }
            break;
        case 'disable':
            if (req.user.role !== 'admin') { res.status(403); throw new Error('Admin only'); }
            conversation.isDisabled = !conversation.isDisabled; // Toggle

            // ✅ FIX: Broadcast state change to all participants in real-time
            const io = req.app.get('io');
            if (io) {
                const eventName = conversation.isDisabled ? 'chat:conversation_disabled' : 'chat:conversation_enabled';
                conversation.participants.forEach(pid => {
                    io.to(`user_${pid}`).emit(eventName, {
                        conversationId: conversation._id,
                        isDisabled: conversation.isDisabled
                    });
                });
                io.to('admin_room').emit('chat:conversation_state_changed', {
                    conversationId: conversation._id,
                    isDisabled: conversation.isDisabled
                });
            }
            break;
        default:
            res.status(400); throw new Error('Invalid action');
    }

    await conversation.save();

    // ✅ FIX: Populate conversation before sending response for complete data
    const populatedConversation = await Conversation.findById(conversation._id)
        .populate('participants', 'name profileImage role isOnline lastActive')
        .populate('lastMessage');

    res.json(populatedConversation);
});

// @desc    Mark Read
// @route   PUT /api/chat/read/:conversationId
exports.markAsRead = asyncHandler(async (req, res) => {
    const { conversationId } = req.params;
    const conversation = await Conversation.findOne({ _id: conversationId, participants: req.user._id });

    if (conversation) {
        conversation.unreadCounts.set(req.user._id.toString(), 0);
        await conversation.save();

        await Message.updateMany(
            { conversationId, receiver: req.user._id, status: { $ne: 'read' } },
            { status: 'read' }
        );

        // Notify sender
        const otherId = conversation.participants.find(p => p.toString() !== req.user._id.toString());
        const io = req.app.get('io');
        if (io && otherId) {
            io.to(`user_${otherId}`).emit('chat:read_receipt', { conversationId });
        }

        // ✅ FIX BUG #6: Notify all conversation participants about read status change
        conversation.participants.forEach(pid => {
            io.to(`user_${pid}`).emit('chat:message_read', {
                conversationId,
                userId: req.user._id
            });
        });

        // Also emit to admin room for admin dashboard
        io.to('admin_room').emit('chat:message_read', {
            conversationId,
            userId: req.user._id
        });
    }
    res.json({ success: true });
});

exports.clearChat = asyncHandler(async (req, res) => {
    // Soft clear -> Mark all current messages as deletedBy User
    const { conversationId } = req.params;
    await Message.updateMany(
        { conversationId },
        { $addToSet: { deletedBy: req.user._id } }
    );

    const io = req.app.get('io');
    if (io) {
        const conversation = await Conversation.findById(conversationId);
        if (conversation) {
            // Emitting to ALL participants, but only the one who cleared will handle it 
            // by clearing their LOCAL state. Rest will ignore.
            conversation.participants.forEach(pid => {
                io.to(`user_${pid}`).emit('chat:chat_cleared', { conversationId, userId: req.user._id });
            });
            io.to('admin_room').emit('chat:chat_cleared', { conversationId, userId: req.user._id });
        }
    }

    res.json({ success: true });
});
// @desc    Report a conversation or message
// @route   POST /api/chat/report
// @access  Private
exports.reportChat = asyncHandler(async (req, res) => {
    const { conversationId, messageId, reason, details } = req.body;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
        res.status(404);
        throw new Error('Conversation not found');
    }

    const reportedUser = conversation.participants.find(p => p.toString() !== req.user._id.toString());

    await Report.create({
        reporter: req.user._id,
        reportedUser,
        conversationId,
        messageId,
        reason,
        details
    });

    res.status(201).json({ message: 'Report submitted successfully' });
});
