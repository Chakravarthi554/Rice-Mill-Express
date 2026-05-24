const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Order = require('../models/Order');
const Campaign = require('../models/Campaign');
const WalletTransaction = require('../models/WalletTransaction');
const WithdrawalRequest = require('../models/WithdrawalRequest');
const Reward = require('../models/Reward');

// ✅ Get user rewards balance and history
const getUserRewards = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id)
        .select('rewardsBalance rewardsHistory referralStats')
        .populate({
            path: 'rewardsHistory.referenceId',
            select: 'orderNumber totalPrice createdAt status'
        });

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    res.json({
        success: true,
        rewardsBalance: user.rewardsBalance || 0,
        rewardsHistory: user.rewardsHistory || [],
        referralStats: user.referralStats || {
            referredUsers: 0,
            earnedCredits: 0,
            pendingCredits: 0,
            totalReferrals: 0
        }
    });
});

// ✅ Redeem rewards for discount
const redeemRewards = asyncHandler(async (req, res) => {
    const { points } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    if (!points || points <= 0) {
        res.status(400);
        throw new Error('Invalid points amount');
    }

    if (points > (user.rewardsBalance || 0)) {
        res.status(400);
        throw new Error('Insufficient reward points');
    }

    // Calculate discount value (1 point = ₹1 typically)
    const discountValue = points;

    // Update user balance
    user.rewardsBalance = (user.rewardsBalance || 0) - points;

    // Add to rewards history
    user.rewardsHistory.push({
        amount: -points,
        type: 'redeemed',
        description: `Redeemed ${points} points for ₹${discountValue} discount`,
        status: 'completed'
    });

    await user.save();

    // Create reward record
    await Reward.create({
        user: user._id,
        points: -points,
        amount: discountValue,
        type: 'redeemed',
        description: `Redeemed for order discount`,
        status: 'redeemed'
    });

    // ✅ Emit real-time update
    if (req.io) {
        req.io.to(`user_${user._id}`).emit('REWARDS_UPDATED', {
            userId: user._id,
            rewardsBalance: user.rewardsBalance,
            action: 'redeemed',
            points: -points
        });
    }

    res.json({
        success: true,
        message: `Successfully redeemed ${points} points for ₹${discountValue} discount`,
        rewardsBalance: user.rewardsBalance,
        discountValue
    });
});

// ✅ Get referral information
const getReferralInfo = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id)
        .select('referralCode referralStats referredBy isReferralRewardClaimed');

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    // Generate referral code if not exists
    if (!user.referralCode) {
        const generateReferralCode = () => {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            let code = '';
            for (let i = 0; i < 7; i++) {
                code += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return code;
        };

        let code, exists = true;
        while (exists) {
            code = generateReferralCode();
            exists = await User.findOne({ referralCode: code });
        }
        user.referralCode = code;
        await user.save();
    }

    const stats = user.referralStats || {
        referredUsers: 0,
        earnedCredits: 0,
        pendingCredits: 0,
        totalReferrals: 0
    };

    res.json({
        success: true,
        referralCode: user.referralCode,
        code: user.referralCode, // Direct code for simplicity
        referralStats: stats,
        stats: stats, // Compatibility alias
        isReferralRewardClaimed: user.isReferralRewardClaimed || false,
        referredBy: user.referredBy || null
    });
});

// ✅ Process referral rewards (called when order is delivered)
// ✅ Process referral rewards (called when order is delivered)
const processReferralRewards = asyncHandler(async (orderId) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const order = await Order.findById(orderId).populate('user').session(session);
        if (!order) {
            await session.abortTransaction();
            return;
        }

        // Hard checks for eligible order: must be delivered, fully paid, and not cancelled/refunded
        if (order.orderStatus !== 'delivered' || !order.isPaid || order.paymentStatus !== 'completed') {
            console.log(`[Referral] Order ${orderId} is not delivered, not paid, or not completed. Skipping rewards.`);
            await session.abortTransaction();
            return;
        }

        if (order.paymentStatus === 'refunded' || order.orderStatus === 'cancelled' || order.orderStatus === 'returned') {
            console.log(`[Referral] Order ${orderId} is cancelled, refunded, or returned. Skipping rewards.`);
            await session.abortTransaction();
            return;
        }

        const user = order.user;
        if (!user || user.role !== 'customer' || user.isReferralRewardClaimed) {
            console.log(`[Referral] User is either not customer or already claimed referral reward.`);
            await session.abortTransaction();
            return;
        }

        // Anti-Abuse: Prevent self-referral
        if (user.referredBy && user.referredBy.toString() === user._id.toString()) {
            console.warn(`[Referral Anti-Abuse] Self-referral detected for user ${user._id}. Blocking rewards.`);
            await session.abortTransaction();
            return;
        }

        // Check if this is the user's first successful completed order
        const deliveredOrdersCount = await Order.countDocuments({
            user: user._id,
            orderStatus: 'delivered',
            isPaid: true
        }).session(session);

        if (deliveredOrdersCount === 1) {
            const AdminSettings = require('../models/AdminSettings');
            const settings = await AdminSettings.getSettings();
            if (!settings.referralCampaignEnabled) {
                await session.abortTransaction();
                return;
            }

            // Strictly ₹50 as required by user request
            const rewardAmount = 50;
            const admin = await User.findOne({ role: 'admin' }).session(session);
            
            // 1. Credit Referrer
            if (user.referredBy) {
                const referrer = await User.findById(user.referredBy).session(session);

                // Anti-Abuse: Only Customers can refer, and check that email/phone are different to block multi-account farming
                if (referrer && referrer.role === 'customer' && referrer._id.toString() !== user._id.toString()) {
                    // Anti-Abuse: Basic fingerprint checks (different phone/email prefixes)
                    const isFarming = referrer.email.split('@')[0] === user.email.split('@')[0] || referrer.phone === user.phone;
                    if (isFarming) {
                        console.warn(`[Referral Anti-Abuse] Potential fake/duplicate farming detected between user ${user._id} and referrer ${referrer._id}. Blocking rewards.`);
                        await session.abortTransaction();
                        return;
                    }

                    referrer.walletBalance = Math.round((referrer.walletBalance || 0) + rewardAmount);
                    if (!referrer.referralStats) referrer.referralStats = { referredUsers: 0, earnedCredits: 0, totalEarnings: 0 };
                    referrer.referralStats.earnedCredits = (referrer.referralStats.earnedCredits || 0) + rewardAmount;
                    referrer.referralStats.totalEarnings = (referrer.referralStats.totalEarnings || 0) + rewardAmount;
                    referrer.referralStats.referredUsers = (referrer.referralStats.referredUsers || 0) + 1;
                    await referrer.save({ session });

                    // Debit Admin for Referrer Reward
                    if (admin) {
                        admin.walletBalance = (admin.walletBalance || 0) - rewardAmount;
                        await admin.save({ session });
                    }

                    await WalletTransaction.create([{
                        user: referrer._id,
                        amount: rewardAmount,
                        type: 'referral_reward',
                        status: 'completed',
                        description: `Referral Reward for inviting ${user.name} (Order #${order._id.toString().slice(-6)})`,
                        referenceId: user._id,
                        referenceType: 'User',
                        balanceAfter: referrer.walletBalance
                    }], { session });

                    if (admin) {
                        await WalletTransaction.create([{
                            user: admin._id,
                            amount: -rewardAmount,
                            type: 'marketing_expense',
                            status: 'completed',
                            description: `Referral Reward Payout to ${referrer.name} for inviting ${user.name}`,
                            referenceId: order._id,
                            referenceType: 'Order',
                            balanceAfter: admin.walletBalance
                        }], { session });
                    }
                }
            }

            // 2. Credit Referee (New Customer)
            user.walletBalance = (user.walletBalance || 0) + rewardAmount;
            user.isReferralRewardClaimed = true;
            if (!user.referralStats) user.referralStats = { referredUsers: 0, earnedCredits: 0, pendingCredits: 0, totalReferrals: 0 };
            user.referralStats.earnedCredits = (user.referralStats.earnedCredits || 0) + rewardAmount;
            await user.save({ session });

            // Debit Admin for Referee Reward
            if (admin) {
                admin.walletBalance = (admin.walletBalance || 0) - rewardAmount;
                await admin.save({ session });
            }

            await WalletTransaction.create([{
                user: user._id,
                amount: rewardAmount,
                type: 'referral_signup_bonus',
                status: 'completed',
                description: `Welcome Reward for first successful order (Referral Code)`,
                referenceId: user._id,
                referenceType: 'User',
                balanceAfter: user.walletBalance
            }], { session });

            if (admin) {
                await WalletTransaction.create([{
                    user: admin._id,
                    amount: -rewardAmount,
                    type: 'marketing_expense',
                    status: 'completed',
                    description: `Signup Bonus Payout to ${user.name}`,
                    referenceId: order._id,
                    referenceType: 'Order',
                    balanceAfter: admin.walletBalance
                }], { session });
            }

            await session.commitTransaction();
            console.log(`✅ Referral rewards processed for Order ${orderId}`);
        } else {
            await session.abortTransaction();
        }
    } catch (error) {
        if (session.inTransaction()) await session.abortTransaction();
        console.error(`❌ Referral processing failed for Order ${orderId}:`, error.message);
    } finally {
        session.endSession();
    }
});

// ✅ Sync rewards across devices
const syncRewards = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id)
        .select('rewardsBalance rewardsHistory referralStats');

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    res.json({
        success: true,
        rewardsBalance: user.rewardsBalance || 0,
        rewardsHistory: user.rewardsHistory || [],
        referralStats: user.referralStats || {
            referredUsers: 0,
            earnedCredits: 0,
            pendingCredits: 0,
            totalReferrals: 0
        }
    });
});

// ✅ Get wallet data (balance and recent transactions)
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
        .limit(20);

    res.json({
        success: true,
        balance: ledgerBalance,
        transactions
    });
});

// ✅ Request withdrawal
const requestWithdrawal = asyncHandler(async (req, res) => {
    const { amount, bankDetails } = req.body;
    
    if (!amount || amount <= 0) {
        res.status(400);
        throw new Error('Invalid withdrawal amount');
    }

    const AdminSettings = require('../models/AdminSettings');
    const settings = await AdminSettings.getSettings();
    const minWithdrawal = settings.minWithdrawalAmount || 300;

    if (amount < minWithdrawal) {
        res.status(400);
        throw new Error(`Minimum withdrawal amount is ₹${minWithdrawal}`);
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

        // Create withdrawal request
        const withdrawal = await WithdrawalRequest.create([{
            user: user._id,
            amount,
            bankDetails,
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
            description: `Withdrawal request for ₹${amount}`,
            referenceId: createdWithdrawal._id,
            referenceType: 'WithdrawalRequest',
            balanceAfter: user.walletBalance
        }], { session });

        await session.commitTransaction();

        // Notify Admins
        if (req.io) {
            req.io.emit('ADMIN_ALERT', {
                title: 'New Withdrawal Request',
                message: `${user.name} has requested a withdrawal of ₹${amount}`,
                type: 'withdrawal',
                withdrawalId: createdWithdrawal._id
            });
        }

        res.status(201).json({
            success: true,
            message: 'Withdrawal request submitted',
            withdrawal: createdWithdrawal
        });
    } catch (error) {
        await session.abortTransaction();
        console.error("Withdrawal request error:", error);
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to submit withdrawal request'
        });
    } finally {
        session.endSession();
    }
});

// ✅ Get user withdrawal history
const getWithdrawalHistory = asyncHandler(async (req, res) => {
    const history = await WithdrawalRequest.find({ user: req.user._id })
        .sort({ createdAt: -1 });

    res.json({
        success: true,
        withdrawals: history
    });
});

// ✅ Admin: Get all withdrawal requests
const adminGetWithdrawals = asyncHandler(async (req, res) => {
    const withdrawals = await WithdrawalRequest.find({})
        .populate('user', 'name email phone')
        .sort({ createdAt: -1 });

    res.json({
        success: true,
        withdrawals
    });
});

// ✅ Admin: Update withdrawal status (Approve/Reject)
const adminUpdateWithdrawal = asyncHandler(async (req, res) => {
    const { status, adminNotes, transactionId } = req.body;
    const withdrawal = await WithdrawalRequest.findById(req.params.id);

    if (!withdrawal) {
        res.status(404);
        throw new Error('Withdrawal request not found');
    }

    if (withdrawal.status !== 'pending') {
        res.status(400);
        throw new Error('Request already processed');
    }

    withdrawal.adminNotes = adminNotes;
    if (transactionId) withdrawal.transactionId = transactionId;

    // BUG-6 FIX: Validate status against WithdrawalRequest model enum before saving.
    // Without this, an invalid status string causes a Mongoose validation error (500)
    // instead of a clean user-facing 400 error.
    const VALID_WITHDRAWAL_STATUSES = ['approved', 'rejected', 'processed'];
    if (!VALID_WITHDRAWAL_STATUSES.includes(status)) {
        res.status(400);
        throw new Error(`Invalid status. Must be one of: ${VALID_WITHDRAWAL_STATUSES.join(', ')}`);
    }
    withdrawal.status = status;

    if (status === 'approved' || status === 'processed') {
        withdrawal.processedAt = Date.now();
    }

    await withdrawal.save();

    const user = await User.findById(withdrawal.user);

    if (status === 'rejected') {
        // Refund the amount to wallet
        user.walletBalance += withdrawal.amount;
        await user.save();

        // Update transaction status
        await WalletTransaction.findOneAndUpdate(
            { referenceId: withdrawal._id, type: 'withdrawal' },
            { status: 'failed', description: `Withdrawal rejected: ${adminNotes}`, balanceAfter: user.walletBalance }
        );
    } else if (status === 'approved' || status === 'processed') {
        // Mark transaction as completed
        await WalletTransaction.findOneAndUpdate(
            { referenceId: withdrawal._id, type: 'withdrawal' },
            { 
                status: 'completed', 
                description: `Withdrawal of ₹${withdrawal.amount} completed. Ref: ${transactionId || 'Manual Transfer'}`,
                metadata: { transactionId: transactionId || '' }
            }
        );
    }

    res.json({
        success: true,
        message: `Withdrawal ${status}`,
        withdrawal
    });
});

module.exports = {
    getUserRewards,
    redeemRewards,
    getReferralInfo,
    processReferralRewards,
    syncRewards,
    getWalletData,
    requestWithdrawal,
    getWithdrawalHistory,
    adminGetWithdrawals,
    adminUpdateWithdrawal
};