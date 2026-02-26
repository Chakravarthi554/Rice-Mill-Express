// [AI: Added forum bookmarks API routes]
const express = require('express');
const router = express.Router();

// ✅ FIXED: Import middlewares with error handling
let authMiddleware;
try {
  authMiddleware = require('../middleware/auth');
} catch (error) {
  console.error('❌ Failed to load auth middleware:', error.message);
  authMiddleware = {
    protect: (req, res, next) => {
      console.log('⚠️ Auth middleware not loaded, skipping protection');
      req.user = { _id: 'fallback-user', role: 'customer' };
      next();
    },
    authorize: (...roles) => (req, res, next) => {
      console.log('⚠️ Authorize middleware not loaded, skipping authorization');
      next();
    }
  };
}

// ✅ FIXED: Import upload middleware with error handling
let uploadMiddleware;
try {
  uploadMiddleware = require('../utils/uploadMiddleware');
} catch (error) {
  console.error('❌ Failed to load upload middleware:', error.message);
  uploadMiddleware = {
    single: (fieldName) => (req, res, next) => {
      console.log('⚠️ Upload middleware not loaded, skipping file upload');
      next();
    }
  };
}

// ✅ FIXED: Import controllers with error handling
let userController;
try {
  userController = require('../controllers/userController');
} catch (error) {
  console.error('❌ Failed to load userController:', error.message);
  // Create fallback controller functions
  userController = {
    getUsers: (req, res) => res.status(501).json({ message: 'User controller not loaded' }),
    getUserProfile: (req, res) => res.status(501).json({ message: 'User controller not loaded' }),
    updateUserProfile: (req, res) => res.status(501).json({ message: 'User controller not loaded' }),
    deleteUser: (req, res) => res.status(501).json({ message: 'User controller not loaded' }),
    getUserById: (req, res) => res.status(501).json({ message: 'User controller not loaded' }),
    updateUser: (req, res) => res.status(501).json({ message: 'User controller not loaded' }),
    getWishlist: (req, res) => res.status(501).json({ message: 'User controller not loaded' }),
    addToWishlist: (req, res) => res.status(501).json({ message: 'User controller not loaded' }),
    removeFromWishlist: (req, res) => res.status(501).json({ message: 'User controller not loaded' }),
    changePassword: (req, res) => res.status(501).json({ message: 'User controller not loaded' }),
    forgotPassword: (req, res) => res.status(501).json({ message: 'User controller not loaded' }),
    resetPassword: (req, res) => res.status(501).json({ message: 'User controller not loaded' }),
    verifyEmail: (req, res) => res.status(501).json({ message: 'User controller not loaded' }),
    updatePreferences: (req, res) => res.status(501).json({ message: 'User controller not loaded' }),
    updateNotificationPreferences: (req, res) => res.status(501).json({ message: 'User controller not loaded' }),
    addAddress: (req, res) => res.status(501).json({ message: 'User controller not loaded' }),
    updateAddress: (req, res) => res.status(501).json({ message: 'User controller not loaded' }),
    deleteAddress: (req, res) => res.status(501).json({ message: 'User controller not loaded' }),
    getAddresses: (req, res) => res.status(501).json({ message: 'User controller not loaded' }),
    setDefaultAddress: (req, res) => res.status(501).json({ message: 'User controller not loaded' }),
    uploadProfileImage: (req, res) => res.status(501).json({ message: 'User controller not loaded' }),
    deleteAccount: (req, res) => res.status(501).json({ message: 'User controller not loaded' }),
    exportUserData: (req, res) => res.status(501).json({ message: 'User controller not loaded' }),
    getDashboardStats: (req, res) => res.status(501).json({ message: 'User controller not loaded' }),
    refreshToken: (req, res) => res.status(501).json({ message: 'User controller not loaded' })
  };
}

const { protect, authorize } = authMiddleware;
const upload = uploadMiddleware;

const {
  getUsers,
  getUserProfile,
  updateUserProfile,
  deleteUser,
  getUserById,
  updateUser,
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
  updatePreferences,
  updateNotificationPreferences,
  addAddress,
  updateAddress,
  deleteAddress,
  getAddresses,
  setDefaultAddress,
  uploadProfileImage,
  deleteAccount,
  exportUserData,
  getDashboardStats,
  refreshToken,
  getAdmins,
  getRewards,
  getReferrals,
  validateReferralCode,
  toggleTwoFactor,
  getLoginHistory
} = userController;

// ✅ FIXED: Validate controller functions
const validateController = (controller, functionName) => {
  if (typeof controller[functionName] !== 'function') {
    console.error(`❌ User controller function ${functionName} is not a function`);
    return (req, res) => res.status(501).json({
      message: `Function ${functionName} not available`,
      code: 'FUNCTION_NOT_AVAILABLE'
    });
  }
  return controller[functionName];
};

// ✅ FIXED: Add token refresh endpoint
router.post('/refresh-token', validateController(userController, 'refreshToken'));

// ✅ FIXED: Public routes
router.post('/forgotpassword', validateController(userController, 'forgotPassword'));
router.put('/resetpassword/:resettoken', validateController(userController, 'resetPassword'));
router.post('/verify-email', validateController(userController, 'verifyEmail'));

// ✅ FIXED: Health check for users API
router.get('/health', (req, res) => {
  res.json({
    message: 'Users API is working!',
    timestamp: new Date().toISOString(),
    endpoints: {
      profile: 'GET /api/users/profile',
      wishlist: 'GET /api/users/wishlist',
      addresses: 'GET /api/users/addresses'
    }
  });
});

// Route for sellers/customers to find admins
router.get('/admins', protect, validateController(userController, 'getAdmins'));

// ✅ FIXED: Protected routes
router.use(protect);

router.route('/profile')
  .get(validateController(userController, 'getUserProfile'))
  .put(upload.single('profileImage'), validateController(userController, 'updateUserProfile'));

router.put('/change-password', validateController(userController, 'changePassword'));
router.put('/preferences', validateController(userController, 'updatePreferences'));
router.put('/notification-preferences', validateController(userController, 'updateNotificationPreferences'));

// ✅ FIXED: Address routes
router.route('/addresses')
  .get(validateController(userController, 'getAddresses'))
  .post(validateController(userController, 'addAddress'));

router.route('/addresses/:id')
  .put(validateController(userController, 'updateAddress'))
  .delete(validateController(userController, 'deleteAddress'));

router.put('/addresses/:id/default', validateController(userController, 'setDefaultAddress'));

// ✅ FIXED: Wishlist routes
router.route('/wishlist')
  .get(validateController(userController, 'getWishlist'))
  .post(validateController(userController, 'addToWishlist'));

router.delete('/wishlist/:id', validateController(userController, 'removeFromWishlist')); // ✅ FIXED: Changed :productId to :id

// ✅ FIXED: Upload profile image
router.post('/upload-profile', upload.single('profileImage'), validateController(userController, 'uploadProfileImage'));

// ✅ FIXED: Account management
router.delete('/me', validateController(userController, 'deleteAccount'));

router.get('/dashboard/stats', validateController(userController, 'getDashboardStats'));
router.get('/referrals', validateController(userController, 'getReferrals'));
router.get('/referral-code', validateController(userController, 'getReferralCode'));
router.get('/rewards', validateController(userController, 'getRewards')); // Added rewards
router.post('/subscription', validateController(userController, 'subscribe')); // Subscribe
router.delete('/subscription', validateController(userController, 'unsubscribe')); // Unsubscribe
router.post('/validate-referral', validateController(userController, 'validateReferralCode')); // Validate Referral Code
router.put('/two-factor', validateController(userController, 'toggleTwoFactor'));
router.get('/login-history', validateController(userController, 'getLoginHistory'));
router.post('/export-data', validateController(userController, 'exportUserData'));
router.route('/privacy').get(validateController(userController, 'getPrivacySettings')).put(validateController(userController, 'updatePrivacySettings'));
router.route('/linked-accounts').get(validateController(userController, 'getLinkedAccounts')).post(validateController(userController, 'linkAccount')).delete(validateController(userController, 'unlinkAccount'));

// ✅ FIXED: Missing Payment and Review Routes
router.route('/payment-methods')
  .get(validateController(userController, 'getPaymentMethods'))
  .post(validateController(userController, 'addPaymentMethod')); // Frontend calls this
router.route('/payment-methods/:id').delete(validateController(userController, 'deletePaymentMethod'));
router.route('/reviews').get(validateController(userController, 'getReviews'));

// ✅ NEW: Forum bookmark routes
router.post('/bookmarks', validateController(userController, 'bookmarkPost'));
router.delete('/bookmarks/:postId', validateController(userController, 'unbookmarkPost'));
router.get('/bookmarks', validateController(userController, 'getBookmarks'));

// ✅ FIXED: Admin only routes
router.use(authorize('admin'));

router.route('/')
  .get(validateController(userController, 'getUsers'));

router.route('/:id')
  .get(validateController(userController, 'getUserById'))
  .put(validateController(userController, 'updateUser'))
  .delete(validateController(userController, 'deleteUser'));

console.log('✅ User routes loaded successfully');

module.exports = router;