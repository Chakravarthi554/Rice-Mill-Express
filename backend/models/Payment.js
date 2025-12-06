const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    order: { // Link to the specific Order document
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },
    user: { // User who made the payment (customer)
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    seller: { // Seller associated with the order/payment
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    amount: { // Total amount of the payment transaction
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      required: true,
      default: 'INR',
    },
    method: { // How the payment was made
      type: String,
      required: true,
      enum: ['cod', 'razorpay', 'stripe', 'other'], // Add other methods if needed
    },
    status: { // Current status of this payment record
      type: String,
      required: true,
      enum: ['pending', 'completed', 'failed', 'refunded', 'partially_refunded'],
      default: 'pending',
      index: true,
    },
    razorpayOrderId: { // Razorpay's internal order_id
      type: String,
      sparse: true, // Allow null values without causing unique index errors if not unique
      index: true,
    },
    razorpayPaymentId: { // Razorpay's payment_id after successful payment
      type: String,
      sparse: true,
      index: true,
    },
    razorpaySignature: { // Razorpay's signature for verification
      type: String,
    },
    commissionAmount: { // Amount deducted as platform commission
      type: Number,
      required: true,
      default: 0,
    },
    sellerPayoutAmount: { // Amount due to the seller after commission
      type: Number,
      required: true,
      default: 0,
    },
    payoutStatus: { // Tracks if the seller's portion has been paid out
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    notes: { // Any additional notes, e.g., COD received confirmation
        type: String,
        trim: true,
    },
    // Admin fields for payment management
    isFlagged: { // Mark suspicious payments for review
      type: Boolean,
      default: false,
    },
    flagReason: { // Reason for flagging
      type: String,
      enum: ['high_value_cod', 'multiple_orders', 'suspicious_pattern', 'other'],
    },
    adminNotes: { // Admin internal notes
      type: String,
    },
    refundProcessedBy: { // Admin who processed refund
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    refundProcessedAt: { // When refund was processed
      type: Date,
    }
  },
  { timestamps: true } // Adds createdAt and updatedAt
);

// Index for admin queries
paymentSchema.index({ createdAt: -1 });
paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ seller: 1, status: 1 });
paymentSchema.index({ isFlagged: 1, createdAt: -1 });

module.exports = mongoose.model('Payment', paymentSchema);