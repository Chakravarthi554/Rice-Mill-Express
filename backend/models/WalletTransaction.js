const mongoose = require('mongoose');

const walletTransactionSchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        amount: {
            type: Number,
            required: true,
        },
        type: {
            type: String,
            required: true,
            enum: ['referral_award', 'signup_award', 'referral_reward', 'referral_signup_bonus', 'marketing_expense', 'review_reward', 'withdrawal', 'refund', 'purchase', 'admin_adjustment', 'delivery_earning', 'commission_owed', 'seller_credit'],
        },
        status: {
            type: String,
            required: true,
            enum: ['pending', 'completed', 'failed', 'cancelled'],
            default: 'completed',
        },
        description: {
            type: String,
            required: true,
        },
        referenceId: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: 'referenceType',
        },
        referenceType: {
            type: String,
            enum: ['Order', 'WithdrawalRequest', 'Referral', 'User', 'Rating', 'Payment'],
        },
        balanceAfter: {
            type: Number,
            required: true,
        },
        metadata: {
            type: Map,
            of: String,
        },
    },
    {
        timestamps: true,
    }
);

const WalletTransaction = mongoose.model('WalletTransaction', walletTransactionSchema);

module.exports = WalletTransaction;
