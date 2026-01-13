const mongoose = require('mongoose');

// Embedded social data is deprecated in favor of standalone collections for scalability
// Aggregate data will be cached in the main document for performance


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
  // Engagement Aggregates (Cached for performance)
  averageRating: { type: Number, default: 0 },
  numReviews: { type: Number, default: 0 },
  likesCount: { type: Number, default: 0 },
  commentsCount: { type: Number, default: 0 },
  sharesCount: { type: Number, default: 0 },
  ratingDistribution: {
    1: { type: Number, default: 0 },
    2: { type: Number, default: 0 },
    3: { type: Number, default: 0 },
    4: { type: Number, default: 0 },
    5: { type: Number, default: 0 }
  },
}, { timestamps: true });

// Index for searching approved recipes quickly
recipeSchema.index({ status: 1, createdAt: -1 });
recipeSchema.index({ riceType: 1, status: 1 });
recipeSchema.index({ sellerId: 1, status: 1 });

// Social feature indexes
recipeSchema.index({ likesCount: -1 });
recipeSchema.index({ commentsCount: -1 });
recipeSchema.index({ averageRating: -1 });
recipeSchema.index({ numReviews: -1 });
recipeSchema.index({ sharesCount: -1 });

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

// Aggregates like averageRating and numReviews are now managed by standalone controllers
// and Rating/Comment models.


module.exports = mongoose.model('Recipe', recipeSchema);