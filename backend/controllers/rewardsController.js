const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Reward = require('../models/Reward');
const Order = require('../models/Order');

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

    res.json({
        success: true,
        referralCode: user.referralCode,
        referralStats: user.referralStats || {
            referredUsers: 0,
            earnedCredits: 0,
            pendingCredits: 0,
            totalReferrals: 0
        },
        isReferralRewardClaimed: user.isReferralRewardClaimed || false,
        referredBy: user.referredBy || null
    });
});

// ✅ Process referral rewards (called when order is delivered)
const processReferralRewards = asyncHandler(async (orderId) => {
    const order = await Order.findById(orderId).populate('user');
    if (!order || order.orderStatus !== 'delivered') {
        return;
    }

    const user = order.user;
    if (!user || user.isReferralRewardClaimed) {
        return;
    }

    // Check if this is the user's first delivered order
    const deliveredOrdersCount = await Order.countDocuments({
        user: user._id,
        orderStatus: 'delivered'
    });

    if (deliveredOrdersCount === 1) {
        // Credit referrer
        if (user.referredBy) {
            const referrer = await User.findById(user.referredBy);
            if (referrer) {
                const referrerBonus = 500; // Configurable
                
                // Update referrer
                referrer.rewardsBalance = (referrer.rewardsBalance || 0) + referrerBonus;
                referrer.referralStats.earnedCredits = (referrer.referralStats.earnedCredits || 0) + referrerBonus;
                referrer.referralStats.referredUsers = (referrer.referralStats.referredUsers || 0) + 1;
                
                await referrer.save();

                // Create reward record
                await Reward.create({
                    user: referrer._id,
                    points: referrerBonus,
                    type: 'referral',
                    description: `Referral Bonus for inviting ${user.name}`,
                    status: 'credited'
                });
            }
        }

        // Credit referee
        const refereeBonus = 200;
        user.rewardsBalance = (user.rewardsBalance || 0) + refereeBonus;
        user.isReferralRewardClaimed = true;

        await user.save();

        // Create reward record
        await Reward.create({
            user: user._id,
            points: refereeBonus,
            type: 'referral',
            description: `Welcome Bonus for using referral code`,
            status: 'credited'
        });
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

module.exports = {
    getUserRewards,
    redeemRewards,
    getReferralInfo,
    processReferralRewards,
    syncRewards
};