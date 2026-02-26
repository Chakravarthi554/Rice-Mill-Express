const mongoose = require('mongoose');

const withdrawalRequestSchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        amount: {
            type: Number,
            required: true,
            min: 1,
        },
        status: {
            type: String,
            required: true,
            enum: ['pending', 'approved', 'rejected', 'processed'],
            default: 'pending',
        },
        bankDetails: {
            accountHolderName: { type: String, required: true },
            bankName: { type: String, required: true },
            accountNumber: { type: String, required: true },
            ifscCode: { type: String, required: true },
            upiId: { type: String },
        },
        adminNotes: {
            type: String,
        },
        transactionId: {
            type: String, // ID from the bank/payment gateway after processing
        },
        processedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

const WithdrawalRequest = mongoose.model('WithdrawalRequest', withdrawalRequestSchema);

module.exports = WithdrawalRequest;
