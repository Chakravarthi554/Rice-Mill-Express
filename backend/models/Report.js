const mongoose = require('mongoose');

const reportSchema = mongoose.Schema({
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reportedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
    messageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' }, // Optional: report a specific message
    reason: { type: String, required: true },
    status: { type: String, enum: ['pending', 'reviewed', 'resolved'], default: 'pending' },
    details: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Report', reportSchema);
