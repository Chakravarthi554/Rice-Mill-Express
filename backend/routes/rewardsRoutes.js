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
    adminUpdateWithdrawal
} = require('../controllers/rewardsController');

const { protect, admin } = require('../middleware/auth');

router.get('/', protect, getUserRewards);
router.post('/redeem', protect, redeemRewards);
router.get('/referral', protect, getReferralInfo);
router.get('/sync', protect, syncRewards);

// Wallet & Withdrawal Routes
router.get('/wallet', protect, getWalletData);
router.post('/withdraw', protect, requestWithdrawal);
router.get('/withdrawals', protect, getWithdrawalHistory);

// Admin Routes
router.get('/admin/withdrawals', protect, admin, adminGetWithdrawals);
router.put('/admin/withdrawals/:id', protect, admin, adminUpdateWithdrawal);

module.exports = router;