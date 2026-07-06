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
const { validateResult } = require('../middleware/validators/validate');
const authValidator = require('../middleware/validators/authValidator');

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

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error
 */
// Registration route
router.post('/register', authLimiter, authValidator.registerValidator, validateResult, asyncHandler(registerUser));

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                 user:
 *                   type: object
 *       401:
 *         description: Invalid credentials
 */
// Login route
router.post('/login', loginLimiter, authValidator.loginValidator, validateResult, asyncHandler(loginUser));

/**
 * @swagger
 * /api/auth/firebase-login:
 *   post:
 *     summary: Login via Firebase (Email/Google/Phone)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idToken
 *             properties:
 *               idToken:
 *                 type: string
 *                 description: Firebase ID token
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid Firebase token
 */
// Unified Firebase login route (Email/Google/Phone)
router.post('/firebase-login', loginLimiter, authValidator.firebaseLoginValidator, validateResult, asyncHandler(firebaseLogin));

// 2FA Verification route
router.post('/verify-2fa', loginLimiter, authValidator.verify2FAValidator, validateResult, asyncHandler(verify2FA));

// Phone login route (Firebase)
router.post('/phone-login', loginLimiter, loginWithPhone);

// Google login route
router.post('/google-login', loginLimiter, asyncHandler(loginWithGoogle));

/**
 * @swagger
 * /api/auth/refresh-token:
 *   post:
 *     summary: Refresh the JWT access token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: New access token issued
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *       401:
 *         description: Invalid or expired refresh token
 */
// Refresh token route (single registration — the second one was overriding with a 410 response)
router.post('/refresh-token', authLimiter, asyncHandler(refreshAccessToken));

// OTP verification route
router.post('/verify-otp', auth.protect, otpLimiter, authValidator.verifyOtpValidator, validateResult, asyncHandler(verifyOtp));

// Resend OTP route
router.post('/resend-otp', auth.protect, otpLimiter, asyncHandler(resendOtp));

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout the current user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 *       401:
 *         description: Not authenticated
 */
router.post('/logout', auth.protect, asyncHandler(logoutUser));

module.exports = router;