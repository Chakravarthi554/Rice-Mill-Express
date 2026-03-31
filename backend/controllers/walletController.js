const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const WalletTransaction = require('../models/WalletTransaction');
const WithdrawalRequest = require('../models/WithdrawalRequest');

// @desc    Get user wallet balance and transaction history
// @route   GET /api/rewards/wallet
// @access  Private
const getWalletData = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select('walletBalance referralStats savedBanks');

    const transactions = await WalletTransaction.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .limit(50);

    res.json({
        balance: user.walletBalance || 0,
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

    const user = await User.findById(req.user._id);

    if (user.walletBalance < amount) {
        res.status(400);
        throw new Error('Insufficient wallet balance');
    }

    const Payout = require('../models/payoutModel');

    // Create withdrawal request using Payout model for Admin dashboard visibility
    const withdrawal = await Payout.create({
        seller: req.user._id,
        amount,
        bankDetailsSnapshot: {
            accountHolderName: bankDetails.accountHolderName,
            accountNumber: bankDetails.accountNumber,
            ifsc: bankDetails.ifscCode,
            bankName: bankDetails.bankName,
            branch: bankDetails.branchName,
        },
        status: 'pending'
    });

    // Deduct from wallet balance immediately (locked)
    user.walletBalance -= amount;
    await user.save();

    // Create transaction record
    await WalletTransaction.create({
        user: req.user._id,
        amount: -amount,
        type: 'withdrawal',
        status: 'pending',
        description: 'Withdrawal request initiated',
        referenceId: withdrawal._id,
        referenceType: 'WithdrawalRequest',
        balanceAfter: user.walletBalance
    });

    res.status(201).json({
        success: true,
        message: 'Withdrawal request submitted successfully',
        withdrawal
    });
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
