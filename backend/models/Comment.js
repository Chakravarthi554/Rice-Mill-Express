const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  targetId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  targetType: {
    type: String,
    required: true,
    enum: ['Product', 'Recipe', 'ForumPost'],
    index: true
  },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  content: { type: String, required: true, maxlength: 2000 },
  parentCommentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null, index: true },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isFlagged: { type: Boolean, default: false },
  isEdited: { type: Boolean, default: false },
  editedAt: { type: Date },
  approved: { type: Boolean, default: false },
  mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isVerified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for replies
commentSchema.virtual('replies', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'parentCommentId'
});

module.exports = mongoose.model('Comment', commentSchema);