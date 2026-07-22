const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  qty: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  subtotal: {
    type: Number,
    required: true,
    default: function () { return this.qty * this.price; }
  },
  image: {
    type: String,
    default: '/images/default-image.jpg'
  },
  // ✅ FIXED: Make seller optional or provide default
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    // Remove required: true since it's causing validation errors
  }
}, { _id: true });

const shippingAddressSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  houseNumber: String,
  colony: String,
  landmark: String,
  street: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  state: {
    type: String,
    required: true
  },
  pinCode: {
    type: String,
    required: true
  },
  country: {
    type: String,
    default: 'India'
  },
  alternativePhone: String,
  location: {
    type: { type: String, default: 'Point' },
    coordinates: [Number]
  },
  addressType: {
    type: String,
    enum: ['home', 'work', 'other'],
    default: 'home'
  }
}, { _id: false });

const statusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  reason: String
}, { _id: false });

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderItems: [orderItemSchema],
  shippingAddress: shippingAddressSchema,
  paymentMethod: {
    type: String,
    // ✅ FIXED: Add 'bulk_order' to enum values
    enum: ['cod', 'razorpay', 'card', 'upi', 'wallet', 'bulk_order'],
    required: true
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  commissionRate: {
    type: Number,
    default: 0, // 0% for free pilot — change to 0.15 when monetizing
    min: 0,
    max: 1
  },
  commissionAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  sellerEarnings: {
    type: Number,
    default: 0,
    min: 0
  },
  // ✅ NEW: Discount Fields
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  netPrice: {
    type: Number,
    // required: true, // Make optional for backward compatibility or set default
    default: function () { return this.totalPrice; }
  },
  appliedReward: {
    pointsRedeemed: Number,
    discountAmount: Number,
    campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign' }
  },
  orderStatus: {
    type: String,
    enum: [
      'created',
      'pending_payment',
      'confirmed',
      'processing',
      'packed',
      'shipped',
      'out_for_delivery',
      'delivered',
      'cancelled',
      'returned',
      'refunded'
    ],
    default: 'created'
  },
  statusHistory: [statusHistorySchema],
  isPaid: {
    type: Boolean,
    default: false
  },
  paidAt: {
    type: Date
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  isDelivered: {
    type: Boolean,
    default: false
  },
  deliveredAt: {
    type: Date
  },
  deliveryPartner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DeliveryPartner'
  },
  trackingId: {
    type: String
  },
  estimatedDeliveryDate: {
    type: Date
  },
  actualDeliveryDate: {
    type: Date
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // --- Marketplace Financial Breakdown ---
  productAmount: {
    type: Number,
    required: true,
    default: 0
  },
  deliveryFee: {
    type: Number,
    required: true,
    default: 0
  },
  discountAmount: {
    type: Number,
    default: 0
  },
  walletUsedAmount: {
    type: Number,
    default: 0
  },
  commissionAmount: {
    type: Number,
    required: true,
    default: 0
  },
  sellerAmount: {
    type: Number,
    required: true,
    default: 0
  },
  adminAmount: {
    type: Number,
    required: true,
    default: 0
  },
  deliveryPartnerAmount: {
    type: Number,
    default: 0
  },
  finalPaidAmount: {
    type: Number,
    required: true,
    default: 0
  },
  // --- End Marketplace Fields ---
  // Delivery Charge Fields
  deliveryCharge: {
    type: Number,
    default: 0,
    min: 0
  },
  totalWeight: {
    type: Number,
    default: 0,
    min: 0
  },
  freeDeliveryApplied: {
    type: Boolean,
    default: false
  },
  deliveryDistance: {
    type: Number,
    default: 0
  },
  // COD Fields
  codAmount: {
    type: Number,
    default: 0
  },
  isAdvancePaid: {
    type: Boolean,
    default: false
  },
  advanceAmountPaid: {
    type: Number,
    default: 0
  },
  remainingCodAmount: {
    type: Number,
    default: 0
  },
  codCollected: {
    type: Boolean,
    default: false
  },
  codCollectedAt: {
    type: Date
  },
  codReportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  codProofPhoto: {
    type: String
  },
  cancelReason: {
    type: String
  },
  returnReason: {
    type: String
  },
  refundReason: {
    type: String
  },
  razorpayOrderId: {
    type: String
  },
  paymentResult: {
    id: String,
    status: String,
    update_time: Date,
    email_address: String
  },
  // ✅ NEW: Bulk order integration fields
  isBulkOrder: {
    type: Boolean,
    default: false
  },
  bulkOrderRef: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BulkOrder'
  },
  // ✅ NEW: Payment terms for bulk orders
  paymentTerms: {
    type: String,
    enum: ['advance', 'credit', 'cod'],
    default: 'advance'
  },
  creditDays: {
    type: Number,
    default: 0,
    min: 0
  },
  deliveryConfirmation: {
    otpVerified: { type: Boolean, default: false },
    verifiedAt: { type: Date },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    photoProofUrl: { type: String },
    location: {
      latitude: Number,
      longitude: Number,
      accuracy: Number,
      timestamp: String
    },
    notes: { type: String }
  },
  // Delivery Partner Status Tracking
  deliveryPartnerStatus: {
    type: String,
    enum: ['not_started', 'assigned', 'accepted', 'picked_up', 'in_transit', 'delivered'],
    default: 'not_started'
  },
  deliveryStartedAt: {
    type: Date
  },
  deliveryStartLocation: {
    latitude: Number,
    longitude: Number,
    timestamp: Date
  },

  // Pickup Confirmation
  deliveryPartnerPickedAt: {
    type: Date
  },
  pickupConfirmedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Navigation Tracking
  navigationStartedAt: {
    type: Date
  },
  estimatedArrivalTime: {
    type: Date
  },

  // Photo-Based Delivery Proof (Cloudinary)
  deliveryPhotoUrl: {
    type: String
  },
  deliveryPhotoTimestamp: {
    type: Date
  },
  deliveryPhotoOrderId: {
    type: String
  },
  deliveryPhotoCloudinaryId: {
    type: String
  },

  // OTP Verification for Delivery
  deliveryOtp: {
    type: String
  },
  deliveryOtpVerified: {
    type: Boolean,
    default: false
  },

  // COD Collection Tracking
  codCollectedConfirmedAt: {
    type: Date
  },
  codCollectionPhotoUrl: {
    type: String
  },
  codSettled: {
    type: Boolean,
    default: false
  },
  codSettledAt: {
    type: Date
  },
  codSettledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Replacement Request Tracking
  hasReplacementRequest: {
    type: Boolean,
    default: false
  },
  replacementStatus: {
    type: String,
    enum: ['none', 'requested', 'approved', 'rejected', 'delivered', 'refund_approved'],
    default: 'none'
  },
  replacementReason: {
    type: String,
    enum: ['damaged_product', 'wrong_product', 'quality_issue', 'incomplete_order', 'other']
  },
  replacementDescription: {
    type: String
  },
  replacementPhotoUrl: {
    type: String
  },
  replacementPhotoCloudinaryId: {
    type: String
  },
  replacementRequestedAt: {
    type: Date
  },
  replacementRequestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  replacementReviewedAt: {
    type: Date
  },
  replacementReviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  replacementReviewNotes: {
    type: String
  },
  // Decision tracking
  replacementDecisionBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  replacementDecisionAt: {
    type: Date
  },
  replacementDecisionNotes: {
    type: String
  },
  // Replacement Delivery Confirmation
  replacementDeliveryConfirmation: {
    photoProofUrl: { type: String },
    deliveredAt: { type: Date },
    location: {
      latitude: Number,
      longitude: Number,
      timestamp: Date
    },
    deliveredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },

  // Auto-Status Update History
  autoStatusUpdates: [{
    from: String,
    to: String,
    triggeredBy: String,
    timestamp: { type: Date, default: Date.now },
    reason: String
  }],

  notes: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes for better performance
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ seller: 1, orderStatus: 1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ isBulkOrder: 1 });
orderSchema.index({ bulkOrderRef: 1 });
orderSchema.index({ user: 1, orderStatus: 1 });
orderSchema.index({ seller: 1, createdAt: -1 });

// Virtual for formatted order number
orderSchema.virtual('orderNumber').get(function () {
  return `ORD-${this._id.toString().substring(18, 24).toUpperCase()}`;
});

// Virtual for total amount (used by mobile app)
orderSchema.virtual('totalAmount').get(function () {
  return this.totalPrice;
});

// Pre-save middleware to set seller for order items if missing
orderSchema.pre('save', function (next) {
  // ✅ FIXED: Set seller for order items if missing
  if (this.orderItems && this.orderItems.length > 0) {
    this.orderItems.forEach(item => {
      if (!item.seller) {
        item.seller = this.seller;
      }
    });
  }

  // Calculate commission and earnings if not set (Legacy logic - maintained for compatibility)
  if (this.isModified('totalPrice') || this.isNew) {
    if (!this.productAmount) this.productAmount = this.totalPrice;
    if (!this.commissionAmount) this.commissionAmount = this.totalPrice * (this.commissionRate || 0); // 0% for free pilot
    if (!this.sellerAmount) this.sellerAmount = this.totalPrice - this.commissionAmount;

    // ✅ Ensure deliveryPartnerAmount is calculated if missing
    if (!this.deliveryPartnerAmount) {
      this.deliveryPartnerAmount = this.deliveryCharge || this.deliveryFee || 0;
    }

    // Backwards compatibility for fields used in other controllers
    this.sellerEarnings = this.sellerAmount;
  }



  next();
});

// Ensure virtual fields are serialized
orderSchema.set('toJSON', { virtuals: true });
orderSchema.set('toObject', { virtuals: true });

// Compound Indexes for query performance
orderSchema.index({ user: 1, orderStatus: 1 });
orderSchema.index({ seller: 1, orderStatus: 1 });

module.exports = mongoose.model('Order', orderSchema);