const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const asyncHandler = require('express-async-handler');
const {
  registerUser,
  loginUser,
  loginWithPhone,
  refreshAccessToken,
  verifyOtp,
  resendOtp,
  logoutUser,
  loginWithGoogle
} = require('../controllers/authController');

// Registration route
router.post('/register', asyncHandler(registerUser));

// Login route
router.post('/login', asyncHandler(loginUser));

// Phone login route (Firebase)
router.post('/phone-login', loginWithPhone);

// Google login route
router.post('/google-login', asyncHandler(loginWithGoogle));

// Refresh token route
router.post('/refresh-token', asyncHandler(refreshAccessToken));
router.post('/refresh-token', auth.refreshToken);

// OTP verification route
router.post('/verify-otp', auth.protect, asyncHandler(verifyOtp));

// Resend OTP route
router.post('/resend-otp', auth.protect, asyncHandler(resendOtp));

router.post('/logout', auth.protect, asyncHandler(logoutUser));

module.exports = router;