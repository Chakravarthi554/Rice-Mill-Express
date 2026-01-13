const mongoose = require('mongoose');

const shareSchema = new mongoose.Schema({
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    targetType: {
        type: String,
        required: true,
        enum: ['Product', 'Recipe', 'ForumPost'],
        index: true
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    platform: { type: String, required: true }, // e.g., 'facebook', 'twitter', 'whatsapp', 'internal'
}, {
    timestamps: true
});

module.exports = mongoose.model('Share', shareSchema);
