const mongoose = require('mongoose');

// Prevent Overwrite Model Error in development (Hot Reload)
if (mongoose.models.BulkOrder) {
  module.exports = mongoose.models.BulkOrder;
} else {

  /**
   * BULK ORDER ITEM SUB-SCHEMA
   */
  const bulkOrderItemSchema = new mongoose.Schema({
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product is required']
    },
    name: {
      type: String,
      required: [true, 'Product name snapshot is required']
    },
    image: {
      type: String,
      default: '/images/default-image.jpg'
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [50, 'Minimum bulk quantity is 50 units/kg']
    },
    requestedPrice: {
      type: Number,
      required: true,
      min: [0, 'Requested price cannot be negative']
    },
    negotiatedPrice: {
      type: Number,
      min: [0, 'Negotiated price cannot be negative'],
      default: 0
    },
    totalPrice: {
      type: Number,
      default: 0
    },
    unit: {
      type: String,
      enum: ['kg', 'bags', 'tons'],
      default: 'kg'
    },
    conversionRate: {
      type: Number,
      default: 1, // e.g., 50kg per bag → conversionRate = 50
      min: [0.01, 'Conversion rate must be positive']
    },
    isPrePackaged: {
      type: Boolean,
      default: false // false = loose/unbranded rice (0% GST), true = pre-packaged & labelled (5% GST)
    }
  }, { _id: false });

  /**
   * SHIPPING ADDRESS SUB-SCHEMA
   */
  const shippingAddressSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    houseNumber: { type: String, trim: true },
    colony: { type: String, trim: true },
    street: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pinCode: { type: String, required: true, trim: true },
    landmark: { type: String, trim: true },
    alternativePhone: { type: String, trim: true },
    country: { type: String, default: 'India' },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] }
    },
    addressType: { type: String, enum: ['home', 'work', 'other'], default: 'other' }
  }, { _id: false });

  /**
   * STATUS HISTORY SUB-SCHEMA
   */
  const statusHistorySchema = new mongoose.Schema({
    status: {
      type: String,
      required: true,
      enum: ['requested', 'quote_sent', 'negotiating', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'disputed', 'rejected']
    },
    timestamp: { type: Date, default: Date.now },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: { type: String, trim: true }
  }, { _id: false });

  /**
   * PAYMENT DETAILS SUB-SCHEMA
   */
  const paymentDetailsSchema = new mongoose.Schema({
    paymentMethod: {
      type: String,
      enum: ['advance', 'credit', 'cod', 'online'],
      default: 'advance'
    },
    advanceAmount: { type: Number, default: 0, min: 0 },
    creditDays: { type: Number, min: 0, max: 90, default: 0 },
    paymentStatus: {
      type: String,
      enum: ['pending', 'partially_paid', 'paid', 'failed', 'refunded'],
      default: 'pending'
    },
    paidAt: Date,
    transactionId: String,
    razorpayOrderId: String,
    razorpayPaymentId: String
  }, { _id: false });

  /**
   * MAIN BULK ORDER SCHEMA
   */
  const bulkOrderSchema = new mongoose.Schema({
    orderNumber: {
      type: String,
      unique: true,
      sparse: true,
      default: function () {
        return `BULK-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      }
    },
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    items: {
      type: [bulkOrderItemSchema],
      required: true,
      validate: [array => array.length > 0, 'Bulk order must have at least one item']
    },
    shippingAddress: {
      type: shippingAddressSchema,
      required: true
    },
    paymentDetails: {
      type: paymentDetailsSchema,
      default: () => ({})
    },
    status: {
      type: String,
      enum: ['requested', 'quote_sent', 'negotiating', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'disputed', 'rejected'],
      default: 'requested'
    },
    statusHistory: {
      type: [statusHistorySchema],
      default: []
    },
    discount: {
      type: Number,
      min: 0,
      max: 50,
      default: 0
    },
    notes: String,
    sellerNotes: String,
    buyerNotes: String,
    cancellationReason: String,
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // Delivery & Logistics
    trackingNumber: String,
    carrier: String,
    shippingDate: Date,
    deliveryDate: Date,
    expectedDeliveryDate: Date,

    // Financial Fields
    subtotal: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    shippingCharges: { type: Number, default: 0 },
    finalAmount: { type: Number, default: 0 },
    commissionRate: { type: Number, default: 0, min: 0, max: 1 }, // 0% for free pilot — change to 0.15 when monetizing
    commissionAmount: { type: Number, default: 0 },
    sellerEarnings: { type: Number, default: 0 },

    // References
    regularOrderRefs: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    }],

    // Audit
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // Flags
    isActive: { type: Boolean, default: true },

    // Reviews & Ratings
    qualityRating: { type: Number, min: 1, max: 5 },
    deliveryRating: { type: Number, min: 1, max: 5 },
    buyerReview: String,
    sellerReview: String
  }, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  });

  // Indexes for performance
  bulkOrderSchema.index({ buyer: 1, createdAt: -1 });
  bulkOrderSchema.index({ seller: 1, status: 1 });
  bulkOrderSchema.index({ status: 1, createdAt: -1 });
  // bulkOrderSchema.index({ orderNumber: 1 }); // Removed to prevent duplicate index warning
  bulkOrderSchema.index({ 'items.product': 1 });
  bulkOrderSchema.index({ createdAt: -1 });
  bulkOrderSchema.index({ isActive: 1 });

  // Virtuals
  bulkOrderSchema.virtual('totalQuantity').get(function () {
    return this.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  });

  bulkOrderSchema.virtual('totalWeight').get(function () {
    return this.items.reduce((sum, item) => sum + (item.quantity * item.conversionRate), 0);
  });

  bulkOrderSchema.virtual('itemsCount').get(function () {
    return this.items.length;
  });

  bulkOrderSchema.virtual('isCancellable').get(function () {
    return ['requested', 'quote_sent', 'negotiating', 'confirmed'].includes(this.status);
  });

  bulkOrderSchema.virtual('isEditable').get(function () {
    return ['requested', 'quote_sent', 'negotiating'].includes(this.status);
  });

  // Pre-save middleware
  bulkOrderSchema.pre('save', async function (next) {
    try {
      // Generate order number if new
      if (this.isNew && !this.orderNumber) {
        const count = await this.constructor.countDocuments({});
        const date = new Date().toISOString().slice(2, 10).replace(/-/g, '');
        const seq = String(count + 1).padStart(5, '0');
        this.orderNumber = `BULK${date}${seq}`;
      }

      // Set createdBy
      if (this.isNew && !this.createdBy) {
        this.createdBy = this.buyer;
      }

      // Always update updatedBy
      this.updatedBy = this.buyer || this.updatedBy;

      // Add status to history if changed
      if (this.isModified('status')) {
        this.statusHistory.push({
          status: this.status,
          updatedBy: this.updatedBy,
          notes: this.cancellationReason || `Status updated to ${this.status}`
        });
      }

      // Recalculate financials
      await this.calculateFinancials();

      next();
    } catch (err) {
      next(err);
    }
  });

  // Method to calculate all financial values
  bulkOrderSchema.methods.calculateFinancials = async function () {
    let subtotal = 0;

    this.items.forEach(item => {
      const price = item.negotiatedPrice > 0 ? item.negotiatedPrice : item.requestedPrice;
      const weight = item.quantity * item.conversionRate;
      const itemTotal = price * weight;
      item.totalPrice = itemTotal;
      subtotal += itemTotal;
    });

    this.subtotal = subtotal;
    const afterDiscount = subtotal * (1 - this.discount / 100);

    // ✅ FIXED: Correct rice GST rates (HSN 1006)
    // Loose/unbranded rice = 0% GST
    // Pre-packaged & labelled rice = 5% GST (CGST 2.5% + SGST 2.5% or IGST 5%)
    const hasPrePackagedItems = this.items.some(item => item.isPrePackaged === true);
    const riceGstRate = hasPrePackagedItems ? 0.05 : 0; // 5% or 0%
    this.taxAmount = afterDiscount * riceGstRate;
    this.shippingCharges = Math.ceil(this.totalWeight / 100) * 50; // ₹50 per 100kg

    this.finalAmount = afterDiscount + this.taxAmount + this.shippingCharges;
    this.commissionAmount = this.finalAmount * this.commissionRate;
    this.sellerEarnings = this.finalAmount - this.commissionAmount;
  };

  // Instance Methods
  bulkOrderSchema.methods.updateStatus = async function (newStatus, userId, notes = '') {
    const allowed = {
      requested: ['quote_sent', 'negotiating', 'cancelled', 'rejected'],
      quote_sent: ['negotiating', 'confirmed', 'cancelled'],
      negotiating: ['quote_sent', 'confirmed', 'cancelled'],
      confirmed: ['processing', 'cancelled'],
      processing: ['shipped'],
      shipped: ['delivered', 'disputed'],
      delivered: [],
      cancelled: [],
      disputed: ['delivered', 'cancelled'],
      rejected: []
    };

    if (!allowed[this.status]?.includes(newStatus)) {
      throw new Error(`Cannot change status from ${this.status} to ${newStatus}`);
    }

    this.status = newStatus;
    this.updatedBy = userId;

    if (newStatus === 'shipped') this.shippingDate = new Date();
    if (newStatus === 'delivered') this.deliveryDate = new Date();
    if (newStatus === 'cancelled' || newStatus === 'rejected') this.cancelledBy = userId;

    return this.save();
  };

  bulkOrderSchema.methods.cancelOrder = async function (reason, userId) {
    if (!this.isCancellable) throw new Error('This order cannot be cancelled');
    this.status = 'cancelled';
    this.cancellationReason = reason;
    this.cancelledBy = userId;
    this.updatedBy = userId;
    return this.save();
  };

  // Export model
  const BulkOrder = mongoose.model('BulkOrder', bulkOrderSchema);
  console.log('BulkOrder model compiled successfully');
  module.exports = BulkOrder;
}