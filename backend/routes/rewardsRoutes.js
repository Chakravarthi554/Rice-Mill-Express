const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
    getUserRewards,
    redeemRewards,
    getReferralInfo,
    syncRewards
} = require('../controllers/rewardsController');

// ✅ Get user rewards and referral info
router.get('/', protect, getUserRewards);

// ✅ Redeem rewards for discount
router.post('/redeem', protect, redeemRewards);

// ✅ Get referral information
router.get('/referral', protect, getReferralInfo);

// ✅ Sync rewards data
router.get('/sync', protect, syncRewards);

module.exports = router;