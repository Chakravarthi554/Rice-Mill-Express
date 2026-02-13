const mongoose = require('mongoose');

const rewardSchema = mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    campaign: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign' },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    points: { type: Number, required: true },
    amount: { type: Number }, // equivalent currency value if needed
    type: { type: String, enum: ['earned', 'redeemed', 'expired', 'referral'], required: true },
    description: { type: String },
    status: { type: String, enum: ['pending', 'credited', 'redeemed', 'expired'], default: 'pending' },
    expiryDate: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Reward', rewardSchema);
