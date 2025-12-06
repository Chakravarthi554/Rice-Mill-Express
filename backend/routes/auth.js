const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const asyncHandler = require('express-async-handler');
const {
  registerUser,
  loginUser,
  refreshAccessToken,
  verifyOtp,
  resendOtp,
  logoutUser,
} = require('../controllers/authController');

// Registration route
router.post('/register', asyncHandler(registerUser));

// Login route
router.post('/login', asyncHandler(loginUser));

// Refresh token route
router.post('/refresh-token', asyncHandler(refreshAccessToken));
router.post('/refresh-token', auth.refreshToken);

// OTP verification route
router.post('/verify-otp', auth.protect, asyncHandler(verifyOtp));

// Resend OTP route
router.post('/resend-otp', auth.protect, asyncHandler(resendOtp));

router.post('/logout', auth.protect, asyncHandler(logoutUser));

module.exports = router;