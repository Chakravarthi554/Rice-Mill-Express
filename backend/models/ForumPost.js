const mongoose = require('mongoose');

// Embedded social data is deprecated in favor of standalone collections for scalability
// Aggregate data will be cached in the main document for performance


const forumPostSchema = new mongoose.Schema({
  title: { type: String, required: true, maxlength: 100 },
  content: { type: String, required: true, maxlength: 1000 },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: String, default: 'General' },
  tags: { type: [{ type: String }], default: [] },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  moderationNotes: { type: String },
  moderatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  moderatedAt: { type: Date },
  linkedRecipe: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' },
  linkedProduct: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },

  // Engagement Aggregates (Cached for performance)
  likesCount: { type: Number, default: 0 },
  commentsCount: { type: Number, default: 0 },
  sharesCount: { type: Number, default: 0 },

  // Bookmark tracking
  bookmarkedBy: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], default: [] },

  // Analytics
  viewCount: { type: Number, default: 0 },
  viewedBy: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], default: [] },
  reportCount: { type: Number, default: 0 },

  reports: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], default: [] },
  isFlagged: { type: Boolean, default: false },
  pinned: { type: Boolean, default: false },
}, { timestamps: true });

forumPostSchema.index({ status: 1 });
forumPostSchema.index({ category: 1 });
forumPostSchema.index({ title: 'text' });
forumPostSchema.index({ createdAt: -1 });
forumPostSchema.index({ userId: 1 });
forumPostSchema.index({ status: 1, createdAt: -1 });
forumPostSchema.index({ likesCount: -1 });
forumPostSchema.index({ commentsCount: -1 });
forumPostSchema.index({ sharesCount: -1 });
forumPostSchema.index({ viewCount: -1 });
forumPostSchema.index({ bookmarkedBy: 1 });

// Engagement aggregates are now managed by standalone controllers


module.exports = mongoose.model('ForumPost', forumPostSchema);