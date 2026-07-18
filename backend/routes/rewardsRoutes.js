const express = require('express');
const router = express.Router();
const {
    getUserRewards,
    redeemRewards,
    getReferralInfo,
    syncRewards,
    getWalletData,
    requestWithdrawal,
    getWithdrawalHistory,
    adminGetWithdrawals,
    adminUpdateWithdrawal,
    rechargeWallet
} = require('../controllers/rewardsController');

const { protect, admin, requireVerifiedEmail } = require('../middleware/auth');

router.get('/', protect, getUserRewards);
router.post('/redeem', protect, requireVerifiedEmail, redeemRewards);
router.get('/referral', protect, getReferralInfo);
router.get('/sync', protect, syncRewards);

// Wallet & Withdrawal Routes
router.get('/wallet', protect, getWalletData);
router.post('/withdraw', protect, requireVerifiedEmail, requestWithdrawal);
router.post('/recharge', protect, rechargeWallet);
router.get('/withdrawals', protect, getWithdrawalHistory);

// Admin Routes
router.get('/admin/withdrawals', protect, admin, adminGetWithdrawals);
router.put('/admin/withdrawals/:id', protect, admin, adminUpdateWithdrawal);

module.exports = router;