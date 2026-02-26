const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const WalletTransaction = require('../models/WalletTransaction');
const WithdrawalRequest = require('../models/WithdrawalRequest');

// @desc    Get user wallet balance and transaction history
// @route   GET /api/rewards/wallet
// @access  Private
const getWalletData = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select('walletBalance referralStats');

    const transactions = await WalletTransaction.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .limit(50);

    res.json({
        balance: user.walletBalance || 0,
        stats: user.referralStats,
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

    // Create withdrawal request
    const withdrawal = await WithdrawalRequest.create({
        user: req.user._id,
        amount,
        bankDetails,
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
    const withdrawals = await WithdrawalRequest.find({ user: req.user._id })
        .sort({ createdAt: -1 });

    res.json(withdrawals);
});

module.exports = {
    getWalletData,
    requestWithdrawal,
    getWithdrawalHistory
};
