const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { protect, role, kycVerified } = require('../middleware/auth');
const { getSellerDashboard, getSellerProducts, updateOrderStatus, searchSellers, getSellerAnalytics } = require('../controllers/sellerController');
const User = require('../models/User');

const { updateUserProfile } = require('../controllers/userController');
const upload = require('../utils/uploadMiddleware');

router.put(
  '/profile',
  protect,
  role('seller'),
  upload.single('profileImage'),
  updateUserProfile
);

router.get('/dashboard', protect, role('seller'), kycVerified, getSellerDashboard);
router.get('/products', protect, role('seller'), kycVerified, getSellerProducts);
router.put('/orders/:id/status', protect, role('seller', 'admin'), kycVerified, updateOrderStatus);
router.get('/sellers/search', protect, role('seller', 'customer', 'admin'), searchSellers);
router.get('/analytics', protect, role('seller'), kycVerified, asyncHandler(async (req, res, next) => {
  console.log('Fetching analytics for seller:', req.user._id, 'timeframe:', req.query.timeframe);
  try {
    await getSellerAnalytics(req, res, next);
  } catch (error) {
    console.error('Analytics error:', error.message);
    res.status(500).json({ message: 'Failed to fetch analytics', error: error.message });
  }
}));


// --- Recipe Engagement Synchronization System ---
const {
  getSellerEngagementOverview,
  getEngagementTrends,
  getRecentActivityFeed,
  getRecipeEngagementDetails,
  replyToComment
} = require('../controllers/engagementController');

router.get('/engagement/overview', protect, role('seller'), kycVerified, getSellerEngagementOverview);
router.get('/engagement/trends', protect, role('seller'), kycVerified, getEngagementTrends);
router.get('/engagement/activity', protect, role('seller'), kycVerified, getRecentActivityFeed);
router.get('/engagement/recipe/:id', protect, role('seller'), kycVerified, getRecipeEngagementDetails);
router.post('/engagement/comments/:id/reply', protect, role('seller'), kycVerified, replyToComment);

module.exports = router;