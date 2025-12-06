const mongoose = require('mongoose');

const payoutSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User'
    },
    amount: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
      default: 'pending'
    },
    currency: { 
      type: String, 
      default: 'INR' 
    },
    bankDetailsSnapshot: {
        accountHolderName: String,
        accountNumber: String,
        ifsc: String,
        bankName: String,
        branch: String,
    },
    processedAt: {
      type: Date
    },
    transactionId: { 
      type: String 
    },
    // Admin processing fields
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    processingNotes: {
      type: String
    },
    failureReason: {
      type: String
    },
    // Payout type and schedule
    payoutType: {
      type: String,
      enum: ['manual', 'weekly', 'monthly', 'threshold'],
      default: 'manual'
    },
    scheduledFor: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Indexes for admin queries
payoutSchema.index({ status: 1, createdAt: -1 });
payoutSchema.index({ seller: 1, createdAt: -1 });
payoutSchema.index({ scheduledFor: 1 });
payoutSchema.index({ payoutType: 1 });

const Payout = mongoose.model('Payout', payoutSchema);

module.exports = Payout;