const mongoose = require('mongoose');

// Embedded social data is deprecated in favor of standalone collections for scalability
// Aggregate data will be cached in the main document for performance


const productSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    images: { type: [String], default: [] },
    brand: { type: String, required: true },
    category: { type: String, required: true },
    description: { type: String, required: true },

    // Engagement Aggregates (Cached for performance)
    rating: { type: Number, required: true, default: 0 },
    numReviews: { type: Number, required: true, default: 0 },
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
    ratings: { type: Number, default: 0 }, // Searchable rating field
    discounts: { type: String },
    stockAvailability: { type: String, enum: ['In-stock', 'Pre-order'], default: 'In-stock' },
    // Admin Approval Flow
    approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    approvalRejectionReason: { type: String },
  },
  {
    timestamps: true,
  }
);

// ✅ ADDED: Virtual to sync stock with countInStock
productSchema.virtual('availableStock').get(function () {
  return this.countInStock || this.stock || 0;
});

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

productSchema.index({ category: 1, type: 1, quality: 1, price: 1, weight: 1 });
productSchema.index({ likesCount: -1 });
productSchema.index({ commentsCount: -1 });
productSchema.index({ rating: -1 });

// Average rating and aggregates will now be managed by specialized controllers
// using standalone Rating, Comment, and Like models.
// The pre('save') hook here will focus on stock synchronization.
productSchema.pre('save', function (next) {

  // ✅ ADDED: Sync stock with countInStock
  if (this.stock === undefined || this.stock === null) {
    this.stock = this.countInStock;
  }

  next();
});

module.exports = mongoose.model('Product', productSchema);