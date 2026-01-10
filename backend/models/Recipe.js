const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  createdAt: { type: Date, default: Date.now },
});

const commentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, maxlength: 1000 }, // New field
  comment: { type: String, maxlength: 1000 }, // Old field for backward compatibility
  parentComment: { type: mongoose.Schema.Types.ObjectId, default: null }, // For nested replies
  mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // @username mentions
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Likes on individual comments
  approved: { type: Boolean, default: false },
  isFlagged: { type: Boolean, default: false },
  isEdited: { type: Boolean, default: false },
  editedAt: { type: Date },
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
}, { timestamps: true });

const recipeSchema = new mongoose.Schema({
  title: { type: String, required: true, maxlength: 150 },
  ingredients: { type: [{ type: String, required: true }], default: [] },
  steps: { type: [{ type: String, required: true }], default: [] },
  riceType: { type: String, required: true, index: true },
  linkedProducts: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }], default: [] },
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  image: { type: String, default: null },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    index: true,
  },
  moderationNotes: { type: String },
  moderatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  moderatedAt: { type: Date },
  ratings: { type: [ratingSchema], default: [] },
  comments: { type: [commentSchema], default: [] },
  averageRating: { type: Number, default: 0 },
  numReviews: { type: Number, default: 0 },

  // Social features
  likes: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], default: [] },
  shares: { type: Number, default: 0 },
}, { timestamps: true });

// Index for searching approved recipes quickly
recipeSchema.index({ status: 1, createdAt: -1 });
recipeSchema.index({ riceType: 1, status: 1 });
recipeSchema.index({ sellerId: 1, status: 1 });

// Social feature indexes
recipeSchema.index({ 'comments.parentComment': 1 }); // For nested replies
recipeSchema.index({ 'comments.createdAt': -1 }); // For sorting
recipeSchema.index({ 'comments.approved': 1 });
recipeSchema.index({ 'comments.isFlagged': 1 });
recipeSchema.index({ 'comments.likes': 1 }); // For top comments
recipeSchema.index({ likes: 1 }); // For recipe likes
recipeSchema.index({ averageRating: -1 }); // For rating sorting
recipeSchema.index({ numReviews: -1 });
recipeSchema.index({ shares: -1 });

// Full text search index for titles and ingredients
recipeSchema.index({ title: 'text', ingredients: 'text' });


// Migrate old 'comment' field to new 'text' field
recipeSchema.pre('save', function (next) {
  // Migrate comments from old 'comment' field to new 'text' field
  if (this.comments && this.comments.length > 0) {
    this.comments.forEach(comment => {
      if (comment.comment && !comment.text) {
        comment.text = comment.comment;
      }
      // Ensure at least one field exists
      if (!comment.text && !comment.comment) {
        comment.text = '';
      }
    });
  }
  next();
});

// Calculate average rating before saving
recipeSchema.pre('save', function (next) {
  this.numReviews = this.ratings.length;
  if (this.ratings.length > 0) {
    const totalRating = this.ratings.reduce((acc, item) => item.rating + acc, 0);
    this.averageRating = totalRating / this.ratings.length;
  } else {
    this.averageRating = 0;
  }
  next();
});

module.exports = mongoose.model('Recipe', recipeSchema);