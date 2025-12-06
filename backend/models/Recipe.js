const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  createdAt: { type: Date, default: Date.now },
});

const commentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  comment: { type: String, required: true, maxlength: 500 },
  approved: { type: Boolean, default: false },
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
});

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
recipeSchema.index({ title: 'text', riceType: 'text' });
recipeSchema.index({ 'comments.approved': 1 });
recipeSchema.index({ 'comments.isFlagged': 1 });

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