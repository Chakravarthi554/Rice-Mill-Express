const mongoose = require('mongoose');

const likeSchema = new mongoose.Schema({
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    targetType: {
        type: String,
        required: true,
        enum: ['Product', 'Recipe', 'ForumPost', 'Comment'],
        index: true
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
}, {
    timestamps: true
});

// Avoid duplicate likes
likeSchema.index({ targetId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('Like', likeSchema);
