const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    targetType: {
        type: String,
        required: true,
        enum: ['Product', 'Recipe'],
        index: true
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, maxlength: 2000 }, // Optional review text
    isFlagged: { type: Boolean, default: false },
    approved: { type: Boolean, default: false },
}, {
    timestamps: true
});

// One rating per user per item
ratingSchema.index({ targetId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('Rating', ratingSchema);
