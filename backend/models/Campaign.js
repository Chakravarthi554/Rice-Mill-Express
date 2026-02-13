const mongoose = require('mongoose');

const campaignSchema = mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    type: { type: String, enum: ['points', 'cashback', 'diwali_special', 'referral_bonus'], required: true },
    value: { type: Number, required: true }, // e.g., 2x multiplier or fixed amount
    valueType: { type: String, enum: ['multiplier', 'fixed'], default: 'fixed' },
    minOrderValue: { type: Number, default: 0 },
    applicableCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
    isActive: { type: Boolean, default: true },
    img: { type: String }, // For banner
}, { timestamps: true });

module.exports = mongoose.model('Campaign', campaignSchema);
