const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  text: { 
    type: String, 
    required: true,
    maxlength: 500 
  },
  approved: { 
    type: Boolean, 
    default: false 
  },
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
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
}, { _id: true });

const reviewSchema = new mongoose.Schema({
  name: { type: String, required: true },
  rating: { type: Number, required: true },
  comment: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
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

const productSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    images: { type: [String], default: [] },
    brand: { type: String, required: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    reviews: { type: [reviewSchema], default: [] },
    rating: { type: Number, required: true, default: 0 },
    numReviews: { type: Number, required: true, default: 0 },
    price: { type: Number, required: true, default: 0 },
    offerPrice: { type: Number, default: 0 },
    countInStock: { type: Number, required: true, default: 0 },
    
    // ✅ ADDED: Bulk order specific fields
    stock: { type: Number, default: 0 }, // Alias for countInStock for compatibility
    minBulkQuantity: { type: Number, default: 50 }, // Minimum quantity for bulk orders
    
    weight: { type: Number, required: true },
    unit: { type: String, enum: ['kg', 'g', 'packet'], required: true },
    nutritionalInfo: { type: Object },
    certifications: { type: [String], default: [] },
    
    // New filter fields
    type: { type: String },
    quality: { type: String },
    dietPreference: { type: [String], default: [] },
    cookingPurpose: { type: [String], default: [] },
    ratings: { type: Number, default: 0 },
    discounts: { type: String },
    stockAvailability: { type: String, enum: ['In-stock', 'Pre-order'], default: 'In-stock' },
    
    // Social features
    likes: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], default: [] },
    comments: { type: [commentSchema], default: [] },
    shares: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

// ✅ ADDED: Virtual to sync stock with countInStock
productSchema.virtual('availableStock').get(function() {
  return this.countInStock || this.stock || 0;
});

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

productSchema.index({ category: 1, type: 1, quality: 1, price: 1, weight: 1 });
productSchema.index({ 'comments.approved': 1 });
productSchema.index({ 'comments.isFlagged': 1 });
productSchema.index({ 'reviews.approved': 1 });
productSchema.index({ 'reviews.isFlagged': 1 });

// Calculate average rating before saving
productSchema.pre('save', function (next) {
  const approvedReviews = this.reviews.filter(review => review.approved);
  this.numReviews = approvedReviews.length;
  
  if (approvedReviews.length > 0) {
    const totalRating = approvedReviews.reduce((acc, review) => acc + review.rating, 0);
    this.rating = totalRating / approvedReviews.length;
  } else {
    this.rating = 0;
  }
  
  // ✅ ADDED: Sync stock with countInStock
  if (this.stock === undefined || this.stock === null) {
    this.stock = this.countInStock;
  }
  
  next();
});

module.exports = mongoose.model('Product', productSchema);