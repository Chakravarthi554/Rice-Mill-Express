const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    },
    unreadCounts: {
        type: Map,
        of: Number,
        default: {}
    },
    isActive: {
        type: Boolean,
        default: true
    },
    // Advanced Features
    isDisabled: { type: Boolean, default: false }, // Admin can disable
    disabledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    pinnedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Users who pinned this chat
    mutedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Users who muted this chat
    theme: {
        type: String,
        default: 'default'
    }
}, { timestamps: true });

// Index for efficient retrieval
conversationSchema.index({ participants: 1 });
conversationSchema.index({ updatedAt: -1 });

module.exports = mongoose.model('Conversation', conversationSchema);
