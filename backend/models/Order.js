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
    default: 0.15,
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
  orderStatus: {
    type: String,
    enum: [
      'placed',
      'processing',
      'packed',
      'shipped',
      'out_for_delivery',
      'delivered',
      'cancelled',
      'returned',
      'refunded'
    ],
    default: 'placed'
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

// Virtual for formatted order number
orderSchema.virtual('orderNumber').get(function () {
  return `ORD-${this._id.toString().substring(18, 24).toUpperCase()}`;
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

  // Calculate commission and earnings if not set
  if (this.isModified('totalPrice') || this.isNew) {
    this.commissionAmount = this.totalPrice * this.commissionRate;
    this.sellerEarnings = this.totalPrice - this.commissionAmount;
  }

  // Add to status history if status changed
  if (this.isModified('orderStatus') && !this.isNew) {
    this.statusHistory.push({
      status: this.orderStatus,
      timestamp: new Date()
    });
  }

  next();
});

// Ensure virtual fields are serialized
orderSchema.set('toJSON', { virtuals: true });
orderSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Order', orderSchema);