const asyncHandler = require('express-async-handler');
const Message = require('../models/Message');
const User = require('../models/User');
const Order = require('../models/Order');
const KycApplication = require('../models/KycApplication');
const { sendPushNotification } = require('../utils/socketNotifications');

// @desc    Get all conversations for admin (grouped by user)
// @route   GET /api/admin/messages/conversations
// @access  Private/Admin
const getAdminConversations = asyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 20, status = 'all', search = '' } = req.query;
    const skip = (page - 1) * limit;

    // Build base query for messages involving admin
    const baseQuery = {
      $or: [
        { receiver: req.user._id }, // Messages to admin
        { sender: req.user._id }    // Messages from admin
      ]
    };

    // Get all messages involving admin
    const allMessages = await Message.find(baseQuery)
      .populate('sender', 'name email role profileImage')
      .populate('receiver', 'name email role profileImage')
      .populate('orderId', 'orderStatus totalPrice')
      .sort({ createdAt: -1 });

    // Group messages by the other user (not admin)
    const conversationsMap = new Map();

    allMessages.forEach(message => {
      const otherUserId = message.sender._id.toString() === req.user._id.toString()
        ? message.receiver._id.toString()
        : message.sender._id.toString();

      const otherUser = message.sender._id.toString() === req.user._id.toString()
        ? message.receiver
        : message.sender;

      if (!conversationsMap.has(otherUserId)) {
        conversationsMap.set(otherUserId, {
          userId: otherUserId,
          user: otherUser,
          lastMessage: message,
          unreadCount: 0,
          messageCount: 0,
          orders: [],
          createdAt: message.createdAt,
          updatedAt: message.updatedAt
        });
      }

      const conversation = conversationsMap.get(otherUserId);
      conversation.messageCount++;

      // Update last message if this one is newer
      if (message.createdAt > conversation.lastMessage.createdAt) {
        conversation.lastMessage = message;
        conversation.updatedAt = message.updatedAt;
      }

      // Count unread messages for admin
      if (message.receiver._id.toString() === req.user._id.toString() && message.status === 'sent') {
        conversation.unreadCount++;
      }

      // Collect order IDs
      if (message.orderId && !conversation.orders.includes(message.orderId._id.toString())) {
        conversation.orders.push(message.orderId._id.toString());
      }
    });

    // Convert map to array and apply filters
    let conversations = Array.from(conversationsMap.values());

    // Apply search filter
    if (search) {
      conversations = conversations.filter(conv =>
        conv.user.name.toLowerCase().includes(search.toLowerCase()) ||
        conv.user.email.toLowerCase().includes(search.toLowerCase()) ||
        (conv.lastMessage.content && conv.lastMessage.content.toLowerCase().includes(search.toLowerCase()))
      );
    }

    // Apply status filter
    if (status === 'unread') {
      conversations = conversations.filter(conv => conv.unreadCount > 0);
    } else if (status === 'with_orders') {
      conversations = conversations.filter(conv => conv.orders.length > 0);
    }

    // Sort by last message date
    conversations.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    // Apply pagination
    const total = conversations.length;
    const paginatedConversations = conversations.slice(skip, skip + parseInt(limit));

    // Populate order details for each conversation
    const populatedConversations = await Promise.all(
      paginatedConversations.map(async (conv) => {
        if (conv.orders.length > 0) {
          const orders = await Order.find({ _id: { $in: conv.orders } })
            .select('orderStatus totalPrice createdAt');
          conv.orderDetails = orders;
        }
        return conv;
      })
    );

    res.json({
      conversations: populatedConversations,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Error fetching admin conversations:', error);
    res.status(500).json({
      message: 'Error fetching conversations',
      error: error.message
    });
  }
});

// @desc    Get conversation history between admin and a specific user
// @route   GET /api/admin/messages/conversations/:userId
// @access  Private/Admin
const getConversationWithUser = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    // Verify the user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get messages between admin and user
    const messages = await Message.find({
      $or: [
        { sender: req.user._id, receiver: userId },
        { sender: userId, receiver: req.user._id }
      ]
    })
      .populate('sender', 'name email role profileImage')
      .populate('receiver', 'name email role profileImage')
      .populate('orderId', 'orderStatus totalPrice')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalMessages = await Message.countDocuments({
      $or: [
        { sender: req.user._id, receiver: userId },
        { sender: userId, receiver: req.user._id }
      ]
    });

    // Mark messages as read when admin views them
    await Message.updateMany(
      {
        sender: userId,
        receiver: req.user._id,
        status: 'sent'
      },
      { status: 'read' }
    );

    // Get user details and related orders
    // ✅ FIX: Include businessDetails for seller profile display in admin chat
    const userDetails = await User.findById(userId)
      .select('name email role profileImage kycStatus lastActive isOnline businessDetails');

    const recentOrders = await Order.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('orderStatus totalPrice createdAt');

    const kycApplication = await KycApplication.findOne({ userId })
      .sort({ createdAt: -1 });

    res.json({
      messages: messages.reverse(), // Reverse to show oldest first
      user: userDetails,
      recentOrders,
      kycApplication,
      totalMessages,
      page: parseInt(page),
      pages: Math.ceil(totalMessages / limit),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({
      message: 'Error fetching conversation',
      error: error.message
    });
  }
});

// @desc    Admin sends message to user
// @route   POST /api/admin/messages/send
// @access  Private/Admin
const adminSendMessage = asyncHandler(async (req, res) => {
  try {
    const { userId, content, orderId, image } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    if (!content && !image) {
      return res.status(400).json({ message: 'Either content or image is required' });
    }

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const message = await Message.create({
      sender: req.user._id,
      receiver: userId,
      content: content || '',
      orderId,
      image,
      sentBy: req.user._id,
      status: 'sent'
    });

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name email role profileImage')
      .populate('receiver', 'name email role profileImage')
      .populate('orderId', 'orderStatus totalPrice');

    // Send real-time notification
    const io = req.app.get('io');
    io.to(`user_${userId}`).emit('NEW_MESSAGE', populatedMessage);
    io.to('admin').emit('ADMIN_MESSAGE_SENT', populatedMessage);

    // Send push notification to user
    await sendPushNotification([userId], {
      title: 'Admin Message',
      message: content || 'You have a new message from admin',
      type: 'admin_message',
      data: {
        messageId: message._id,
        adminId: req.user._id
      }
    });

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error('Error sending admin message:', error);
    res.status(500).json({
      message: 'Error sending message',
      error: error.message
    });
  }
});

// @desc    Mark conversation as resolved
// @route   PUT /api/admin/messages/conversations/:userId/resolve
// @access  Private/Admin
const markConversationResolved = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;
    const { resolutionNotes } = req.body;

    // Update all messages in this conversation
    await Message.updateMany(
      {
        $or: [
          { sender: req.user._id, receiver: userId },
          { sender: userId, receiver: req.user._id }
        ]
      },
      {
        status: 'read',
        $set: {
          'metadata.resolved': true,
          'metadata.resolvedAt': new Date(),
          'metadata.resolvedBy': req.user._id,
          'metadata.resolutionNotes': resolutionNotes
        }
      }
    );

    // Notify user
    const io = req.app.get('io');
    io.to(`user_${userId}`).emit('CONVERSATION_RESOLVED', {
      userId,
      adminId: req.user._id,
      resolvedAt: new Date(),
      resolutionNotes
    });

    res.json({
      message: 'Conversation marked as resolved',
      resolvedAt: new Date()
    });
  } catch (error) {
    console.error('Error resolving conversation:', error);
    res.status(500).json({
      message: 'Error resolving conversation',
      error: error.message
    });
  }
});

// @desc    Get message statistics for admin dashboard
// @route   GET /api/admin/messages/stats
// @access  Private/Admin
const getMessageStats = asyncHandler(async (req, res) => {
  try {
    const today = new Date();
    const startOfToday = new Date(today.setHours(0, 0, 0, 0));
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));

    const [
      totalMessages,
      todayMessages,
      unreadMessages,
      activeConversations,
      messagesByRole
    ] = await Promise.all([
      // Total messages
      Message.countDocuments(),

      // Today's messages
      Message.countDocuments({
        createdAt: { $gte: startOfToday }
      }),

      // Unread messages for admin
      Message.countDocuments({
        receiver: req.user._id,
        status: 'sent'
      }),

      // Active conversations (messages in last 7 days)
      Message.distinct('sender', {
        createdAt: { $gte: startOfWeek },
        receiver: req.user._id
      }),

      // Messages by user role
      Message.aggregate([
        {
          $lookup: {
            from: 'users',
            localField: 'sender',
            foreignField: '_id',
            as: 'senderInfo'
          }
        },
        {
          $unwind: '$senderInfo'
        },
        {
          $group: {
            _id: '$senderInfo.role',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    res.json({
      totalMessages,
      todayMessages,
      unreadMessages,
      activeConversations: activeConversations.length,
      messagesByRole: messagesByRole.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {})
    });
  } catch (error) {
    console.error('Error fetching message stats:', error);
    res.status(500).json({
      message: 'Error fetching message statistics',
      error: error.message
    });
  }
});

module.exports = {
  getAdminConversations,
  getConversationWithUser,
  adminSendMessage,
  markConversationResolved,
  getMessageStats
};