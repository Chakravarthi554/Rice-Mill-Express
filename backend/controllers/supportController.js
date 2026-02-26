const asyncHandler = require('express-async-handler');
const SupportTicket = require('../models/SupportTicket');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { sendPushNotification } = require('../utils/pushNotifications');

// @desc    Create a new support ticket
// @route   POST /api/support/tickets
// @access  Private
const createTicket = asyncHandler(async (req, res) => {
    const { subject, message, category, priority } = req.body;
    const userId = req.user._id;

    if (!subject || !message) {
        res.status(400);
        throw new Error('Subject and message are required');
    }

    // 1. Get/Find an Admin to be the participant
    // In a real system, you might assign to a specific support agent,
    // but here we'll use a generic "Support Admin" or just the first admin found.
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
        res.status(500);
        throw new Error('No support admin available currently');
    }

    // 2. Find/Create Conversation between User and Admin
    // We'll tag this conversation as a support conversation? 
    // Actually, let's just reuse the existing conversation logic.
    let conversation = await Conversation.findOne({
        participants: { $all: [userId, admin._id] }
    });

    if (!conversation) {
        conversation = await Conversation.create({
            participants: [userId, admin._id],
            startedBy: userId,
            unreadCounts: { [userId]: 0, [admin._id]: 0 }
        });
    }

    // 3. Create initial Message
    const initialMessage = await Message.create({
        conversationId: conversation._id,
        sender: userId,
        receiver: admin._id,
        content: `[SUPPORT TICKET: ${category.toUpperCase()}]\nSubject: ${subject}\n\n${message}`,
        sentBy: userId,
        status: 'sent'
    });

    // 4. Create Support Ticket
    const ticket = await SupportTicket.create({
        user: userId,
        conversationId: conversation._id,
        subject,
        message, // The initial message content stored in ticket too for quick reference
        category: category || 'general',
        priority: priority || 'medium',
        lastMessageBy: 'customer',
        unreadByAdmin: true
    });

    // 5. Update Conversation
    conversation.lastMessage = initialMessage._id;
    const currentUnread = conversation.unreadCounts.get(admin._id.toString()) || 0;
    conversation.unreadCounts.set(admin._id.toString(), currentUnread + 1);
    await conversation.save();

    // 6. Notify Admins via Socket
    const io = req.app.get('io');
    if (io) {
        // Emit new ticket event
        io.to('admin_room').emit('NEW_SUPPORT_TICKET', {
            ticketId: ticket._id,
            userName: req.user.name,
            subject,
            category
        });

        // Also emit the message to both
        const populatedMessage = await Message.findById(initialMessage._id)
            .populate('sender', 'name profileImage role')
            .populate('receiver', 'name profileImage role');

        io.to(`user_${userId}`).emit('chat:message', { message: populatedMessage, conversationId: conversation._id });
        io.to('admin_room').emit('chat:message', { message: populatedMessage, conversationId: conversation._id });
    }

    // 7. Create Admin Notification in DB
    await Notification.createAdminNotification({
        type: 'SYSTEM', // Or add 'SUPPORT_TICKET' to enum if possible
        title: 'New Support Ticket',
        message: `${req.user.name} raised a ticket: ${subject}`,
        priority: priority || 'medium',
        relatedEntity: ticket._id,
        entityModel: 'SupportTicket', // Need to add this to enum too
        actionUrl: `/admin/support/${ticket._id}`,
        actionLabel: 'View Ticket'
    });

    res.status(201).json({
        success: true,
        data: ticket,
        message: 'Support ticket created successfully'
    });
});

// @desc    Get all support tickets (Admin Only)
// @route   GET /api/support/admin/tickets
// @access  Private/Admin
const getAdminTickets = asyncHandler(async (req, res) => {
    const { status, category, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (status) query.status = status;
    if (category) query.category = category;

    const tickets = await SupportTicket.find(query)
        .populate('user', 'name email role profileImage')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    const total = await SupportTicket.countDocuments(query);

    res.json({
        success: true,
        data: tickets,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
    });
});

// @desc    Get user's own tickets
// @route   GET /api/support/tickets
// @access  Private
const getUserTickets = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const tickets = await SupportTicket.find({ user: userId })
        .sort({ updatedAt: -1 });

    res.json({
        success: true,
        data: tickets
    });
});

// @desc    Update ticket status (Admin Only)
// @route   PUT /api/support/admin/tickets/:id
// @access  Private/Admin
const updateTicketStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;
    const ticket = await SupportTicket.findById(req.params.id);

    if (!ticket) {
        res.status(404);
        throw new Error('Ticket not found');
    }

    ticket.status = status;
    await ticket.save();

    if (status === 'resolved') {
        const io = req.app.get('io');
        if (io) {
            io.to(`user_${ticket.user._id}`).emit('SUPPORT_TICKET_RESOLVED', {
                ticketId: ticket._id,
                subject: ticket.subject
            });
        }

        // Create Database Notification for the user
        const notificationData = {
            title: 'Support Ticket Resolved',
            message: `Your support ticket regarding "${ticket.subject}" has been marked as resolved.`,
            type: 'SUPPORT_TICKET',
            data: {
                ticketId: ticket._id,
                subject: ticket.subject
            },
            priority: 'medium'
        };

        await Notification.create({
            user: ticket.user._id,
            ...notificationData,
            relatedEntity: ticket._id,
            entityModel: 'SupportTicket'
        });

        // Send Push/Socket Notification
        await sendPushNotification(ticket.user._id, notificationData, io);
    }

    res.json({
        success: true,
        data: ticket,
        message: `Ticket marked as ${status}`
    });
});

// @desc    Get ticket details
// @route   GET /api/support/tickets/:id
// @access  Private
const getTicketDetails = asyncHandler(async (req, res) => {
    const ticket = await SupportTicket.findById(req.params.id)
        .populate('user', 'name email role profileImage');

    if (!ticket) {
        res.status(404);
        throw new Error('Ticket not found');
    }

    // Check authorization: Admin or Ticket owner
    if (req.user.role !== 'admin' && ticket.user._id.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to view this ticket');
    }

    res.json({
        success: true,
        data: ticket
    });
});

module.exports = {
    createTicket,
    getAdminTickets,
    getUserTickets,
    updateTicketStatus,
    getTicketDetails
};
