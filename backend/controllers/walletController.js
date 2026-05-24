const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const User = require('../models/User');
const WalletTransaction = require('../models/WalletTransaction');
const WithdrawalRequest = require('../models/WithdrawalRequest');

// @desc    Get user wallet balance and transaction history
// @route   GET /api/rewards/wallet
// @access  Private
const getWalletData = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }
    const sumResult = await WalletTransaction.aggregate([
        { $match: { user: req.user._id } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const ledgerBalance = sumResult[0]?.total || 0;
    
    if (user.walletBalance !== ledgerBalance) {
        console.log(`[Wallet Sync] Correcting balance drift for User ${user._id}: stored ₹${user.walletBalance} -> ledger ₹${ledgerBalance}`);
        user.walletBalance = ledgerBalance;
        await user.save();
    }

    const transactions = await WalletTransaction.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .limit(50);

    res.json({
        balance: ledgerBalance,
        stats: user.referralStats,
        savedBanks: user.savedBanks || [],
        transactions
    });
});

// @desc    Request a withdrawal
// @route   POST /api/rewards/withdraw
// @access  Private
const requestWithdrawal = asyncHandler(async (req, res) => {
    const { amount, bankDetails } = req.body;

    if (!amount || amount <= 0) {
        res.status(400);
        throw new Error('Invalid withdrawal amount');
    }

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const user = await User.findById(req.user._id).session(session);
        if (!user) {
            throw new Error('User not found');
        }

        // Ledger truth balance check inside session
        const sumResult = await WalletTransaction.aggregate([
            { $match: { user: user._id } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]).session(session);
        const ledgerBalance = sumResult[0]?.total || 0;

        if (ledgerBalance < amount) {
            throw new Error('Insufficient wallet balance');
        }

        const Payout = require('../models/payoutModel');

        // Create withdrawal request using Payout model for Admin dashboard visibility
        const withdrawal = await Payout.create([{
            seller: user._id,
            amount,
            bankDetailsSnapshot: {
                accountHolderName: bankDetails.accountHolderName,
                accountNumber: bankDetails.accountNumber,
                ifsc: bankDetails.ifscCode,
                bankName: bankDetails.bankName,
                branch: bankDetails.branchName,
            },
            status: 'pending'
        }], { session });

        const createdWithdrawal = withdrawal[0];

        // Deduct from wallet balance atomically
        user.walletBalance = ledgerBalance - amount;
        await user.save({ session });

        // Create transaction record
        await WalletTransaction.create([{
            user: user._id,
            amount: -amount,
            type: 'withdrawal',
            status: 'pending',
            description: 'Withdrawal request initiated',
            referenceId: createdWithdrawal._id,
            referenceType: 'WithdrawalRequest',
            balanceAfter: user.walletBalance
        }], { session });

        await session.commitTransaction();

        res.status(201).json({
            success: true,
            message: 'Withdrawal request submitted successfully',
            withdrawal: createdWithdrawal
        });
    } catch (error) {
        await session.abortTransaction();
        console.error("Delivery Partner Withdrawal request error:", error);
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to submit withdrawal request'
        });
    } finally {
        session.endSession();
    }
});

// @desc    Get withdrawal history
// @route   GET /api/rewards/withdrawals
// @access  Private
const getWithdrawalHistory = asyncHandler(async (req, res) => {
    const Payout = require('../models/payoutModel');
    const withdrawals = await Payout.find({ seller: req.user._id })
        .sort({ createdAt: -1 });

    res.json(withdrawals);
});

// @desc    Save a new bank account
// @route   POST /api/dp/saved-banks
// @access  Private
const saveBankAccount = asyncHandler(async (req, res) => {
    const { bankName, branchName, accountNumber, ifscCode, accountHolderName, isDefault } = req.body;

    if (!bankName || !accountNumber || !ifscCode || !accountHolderName) {
        res.status(400);
        throw new Error('Please provide all required bank details');
    }

    const user = await User.findById(req.user._id);

    // If making default, unset others
    if (isDefault && user.savedBanks && user.savedBanks.length > 0) {
        user.savedBanks.forEach(bank => bank.isDefault = false);
    }

    // If first bank, make it default
    const setAsDefault = isDefault || !user.savedBanks || user.savedBanks.length === 0;

    user.savedBanks.push({
        bankName,
        branchName: branchName || '',
        accountNumber,
        ifscCode,
        accountHolderName,
        isDefault: setAsDefault
    });

    await user.save();

    res.status(201).json({
        success: true,
        message: 'Bank account saved successfully',
        savedBanks: user.savedBanks
    });
});

module.exports = {
    getWalletData,
    requestWithdrawal,
    getWithdrawalHistory,
    saveBankAccount
};
