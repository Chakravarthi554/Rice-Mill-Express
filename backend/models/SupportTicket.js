const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
        required: true
    },
    subject: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        enum: ['general', 'technical', 'billing', 'feedback', 'legal'],
        default: 'general'
    },
    status: {
        type: String,
        enum: ['open', 'in-progress', 'resolved', 'closed'],
        default: 'open'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    lastMessageBy: {
        type: String,
        enum: ['customer', 'admin'],
        required: true
    },
    unreadByAdmin: {
        type: Boolean,
        default: true
    },
    unreadByCustomer: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

// Indexes for efficient querying
supportTicketSchema.index({ user: 1 });
supportTicketSchema.index({ status: 1 });
supportTicketSchema.index({ category: 1 });
supportTicketSchema.index({ updatedAt: -1 });

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
