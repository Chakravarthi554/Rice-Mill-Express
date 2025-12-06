const mongoose = require('mongoose');

const forumCommentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true, maxlength: 1000 },
  approved: { type: Boolean, default: false },
  parentComment: { type: mongoose.Schema.Types.ObjectId, ref: 'ForumComment', default: null },
  likes: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], default: [] },
  isFlagged: { type: Boolean, default: false },
  reports: { 
    type: [{ 
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      reason: String,
      createdAt: { type: Date, default: Date.now }
    }], 
    default: [] 
  },
  moderationNotes: { type: String },
  moderatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  moderatedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

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
  
  // Updated social features - Instagram style
  likes: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], default: [] },
  comments: { type: [forumCommentSchema], default: [] },
  shares: { type: Number, default: 0 },
  
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
forumPostSchema.index({ 'comments.approved': 1 });
forumPostSchema.index({ 'comments.isFlagged': 1 });

// Update the updatedAt field for comments when modified
forumPostSchema.pre('save', function(next) {
  if (this.isModified('comments')) {
    this.comments.forEach(comment => {
      if (comment.isModified()) {
        comment.updatedAt = new Date();
      }
    });
  }
  next();
});

module.exports = mongoose.model('ForumPost', forumPostSchema);