const mongoose = require('mongoose');

const incentiveSchema = new mongoose.Schema(
  {
    title: { type: String, required: true }, // e.g., "Daily Goal", "Weekly Streak"
    target: { type: Number, required: true }, // e.g., 15 (deliveries)
    bonusAmount: { type: Number, required: true }, // e.g., 200 (rupees)
    period: { 
      type: String, 
      enum: ['daily', 'weekly', 'monthly'], 
      required: true 
    },
    color: { type: String, default: '#16A34A' }, // For UI styling
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

const deliveryPartnerIncentiveProgressSchema = new mongoose.Schema(
  {
    deliveryPartner: { type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryPartner', required: true },
    incentive: { type: mongoose.Schema.Types.ObjectId, ref: 'Incentive', required: true },
    currentCount: { type: Number, default: 0 },
    isAchieved: { type: Boolean, default: false },
    achievedAt: { type: Date },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
  },
  { timestamps: true }
);

// Indexes to quickly find active progress for a given partner in a specific period
deliveryPartnerIncentiveProgressSchema.index({ deliveryPartner: 1, incentive: 1, periodStart: 1 }, { unique: true });

const Incentive = mongoose.model('Incentive', incentiveSchema);
const DPIncentiveProgress = mongoose.model('DPIncentiveProgress', deliveryPartnerIncentiveProgressSchema);

module.exports = { Incentive, DPIncentiveProgress };
