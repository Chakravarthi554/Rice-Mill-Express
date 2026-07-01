const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const asyncHandler = require('express-async-handler');
const rateLimit = require('express-rate-limit');
const {
  registerUser,
  loginUser,
  loginWithPhone,
  refreshAccessToken,
  verifyOtp,
  resendOtp,
  logoutUser,
  loginWithGoogle,
  firebaseLogin,
  verify2FA
} = require('../controllers/authController');

// Rate limiting for general auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 auth requests per window
  message: { message: 'Too many authentication attempts from this IP, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

const loginLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: { message: 'Too many login attempts, please try again after a minute' },
  standardHeaders: true,
  legacyHeaders: false,
});

const otpLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3,
  message: { message: 'Too many OTP requests, please try again after a minute' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Registration route
router.post('/register', authLimiter, asyncHandler(registerUser));

// Login route
router.post('/login', loginLimiter, asyncHandler(loginUser));

// Unified Firebase login route (Email/Google/Phone)
router.post('/firebase-login', loginLimiter, asyncHandler(firebaseLogin));

// 2FA Verification route
router.post('/verify-2fa', loginLimiter, asyncHandler(verify2FA));

// Phone login route (Firebase)
router.post('/phone-login', loginLimiter, loginWithPhone);

// Google login route
router.post('/google-login', loginLimiter, asyncHandler(loginWithGoogle));

// Refresh token route (single registration — the second one was overriding with a 410 response)
router.post('/refresh-token', authLimiter, asyncHandler(refreshAccessToken));

// OTP verification route
router.post('/verify-otp', auth.protect, otpLimiter, asyncHandler(verifyOtp));

// Resend OTP route
router.post('/resend-otp', auth.protect, otpLimiter, asyncHandler(resendOtp));

router.post('/logout', auth.protect, asyncHandler(logoutUser));

module.exports = router;