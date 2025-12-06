const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { protect, role, kycVerified } = require('../middleware/auth');
const { getSellerDashboard, getSellerProducts, updateOrderStatus, searchSellers, getSellerAnalytics } = require('../controllers/sellerController');
const User = require('../models/User');

router.put(
  '/profile',
  protect,
  role('seller'),
  kycVerified,
  asyncHandler(async (req, res) => {
    console.log('Updating seller profile for user:', req.user._id);
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.businessDetails.businessName = req.body.businessName || user.businessDetails.businessName;
      user.businessDetails.gstNumber = req.body.gstNumber || user.businessDetails.gstNumber;
      user.businessDetails.panNumber = req.body.panNumber || user.businessDetails.panNumber;
      user.businessDetails.address = req.body.address || user.businessDetails.address;
      user.businessDetails.address.city = req.body.city || user.businessDetails.address.city;
      user.businessDetails.address.state = req.body.state || user.businessDetails.address.state;
      user.businessDetails.address.pinCode = req.body.pinCode || user.businessDetails.address.pinCode;
      user.phone = req.body.phone || user.phone;
      user.profileImage = req.body.profileImage || user.profileImage;
      user.productAvailability = req.body.productAvailability !== undefined 
        ? req.body.productAvailability 
        : user.productAvailability;
      user.notificationEnabled = req.body.notificationEnabled !== undefined 
        ? req.body.notificationEnabled 
        : user.notificationEnabled;
      user.businessDetails.bankAccount = req.body.bankAccount || user.businessDetails.bankAccount;
      const updatedUser = await user.save();
 
      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        businessDetails: {
          businessName: updatedUser.businessDetails.businessName,
          gstNumber: updatedUser.businessDetails.gstNumber,
          panNumber: updatedUser.businessDetails.panNumber,
          address: updatedUser.businessDetails.address,
          bankAccount: updatedUser.businessDetails.bankAccount,
        },
        phone: updatedUser.phone,
        profileImage: updatedUser.profileImage,
        productAvailability: updatedUser.productAvailability,
        notificationEnabled: updatedUser.notificationEnabled,
      });
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  })
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

module.exports = router;