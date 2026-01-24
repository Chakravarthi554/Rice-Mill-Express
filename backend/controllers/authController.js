const User = require('../models/User');
const { generateToken, generateRefreshToken } = require('../utils/generateToken');
const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const firebaseUserSync = require('../services/firebaseUserSync');
const admin = require('firebase-admin'); // Import firebase-admin

// 🔥 CRITICAL FIX: Check JWT secrets
const checkJWTSecrets = () => {
  if (!process.env.JWT_SECRET) {
    console.error('❌ JWT_SECRET is not defined in environment variables');
    throw new Error('JWT_SECRET is required');
  }
  if (!process.env.REFRESH_TOKEN_SECRET) {
    console.error('❌ REFRESH_TOKEN_SECRET is not defined in environment variables');
    throw new Error('REFRESH_TOKEN_SECRET is required');
  }
  console.log('✅ JWT secrets are properly configured');
};

// Register a new user
const registerUser = asyncHandler(async (req, res) => {
  checkJWTSecrets();

  const { name, email, password, phone, role, firebaseUid } = req.body;
  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  const user = await User.create({
    name,
    email,
    password,
    phone,
    role: role || 'customer',
    firebaseUid,
    kycStatus: role === 'seller' ? 'not_submitted' : 'not_required',
  });

  if (user) {
    console.log('User created:', user._id, 'with kycStatus:', user.kycStatus);

    // ✅ FIREBASE: Sync user to Firestore for Firebase rules
    await firebaseUserSync.syncUser(user).catch(err =>
      console.error('⚠️  Firestore sync failed (non-critical):', err.message)
    );

    const accessToken = generateToken(user._id, 'access');
    const refreshToken = generateRefreshToken(user._id);

    // UPDATE ONLY refreshToken — NO full validation
    await User.updateOne(
      { _id: user._id },
      { $set: { refreshToken } }
    );

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful! Welcome!',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        kycStatus: user.kycStatus,
        isVerified: user.isVerified,
      },
      accessToken,
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// LOGIN USER – FIXED: Use updateOne, NOT save()
const loginUser = asyncHandler(async (req, res) => {
  checkJWTSecrets();

  const { email, password, phone } = req.body;
  const user = await User.findOne({ email }).select('+password');
  if (user && (await user.matchPassword(password))) {
    if (phone && user.phone !== phone) {
      return res.status(400).json({ message: 'Phone number does not match' });
    }

    // ✅ FIREBASE: Sync user to Firestore for Firebase rules
    await firebaseUserSync.syncUser(user).catch(err =>
      console.error('⚠️  Firestore sync failed (non-critical):', err.message)
    );

    const accessToken = generateToken(user._id, 'access');
    const refreshToken = generateRefreshToken(user._id);
    await User.updateOne({ _id: user._id }, { $set: { refreshToken } });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const response = {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      accessToken,
    };

    // Only include kycStatus for sellers
    if (user.role === 'seller') {
      response.kycStatus = user.kycStatus;
    }

    res.json(response);
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

// @desc    Login with Phone (Firebase)
// @route   POST /api/auth/phone-login
// @access  Public
const loginWithPhone = asyncHandler(async (req, res) => {
  const { idToken, phone } = req.body;

  if (!idToken) {
    res.status(400);
    throw new Error('Firebase ID Token is required');
  }

  try {
    // 1. Verify Firebase ID Token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const firebasePhone = decodedToken.phone_number;

    // Optional: Cross-check with provided phone (though Firebase phone is authoritative)
    // if (phone && firebasePhone !== phone) { ... }

    // 2. Find or Create User
    // For now, we assume delivery partners are created by sellers with a phone number.
    // If we want auto-registration, we can do it here. 
    // But for delivery partners, they should already exist.
    let user = await User.findOne({ phone: firebasePhone });

    if (!user) {
      // If user doesn't exist, we might want to check if they should be created.
      // For this app's delivery partner flow, sellers create partners.
      // If we don't find them by phone, we reject or create a default user.
      // Let's create a default customer if not found, or reject if it's strictly for existing partners.
      // Given the context, let's look for any user with this phone.
      res.status(404);
      throw new Error('User not found with this phone number. Please contact your administrator.');
    }

    // 3. Sync and Tokens
    await firebaseUserSync.syncUser(user).catch(err =>
      console.error('⚠️ Firestore sync failed (non-critical):', err.message)
    );

    const accessToken = generateToken(user._id, 'access');
    const refreshToken = generateRefreshToken(user._id);
    await User.updateOne({ _id: user._id }, { $set: { refreshToken } });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const response = {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      accessToken,
    };

    if (user.role === 'seller') {
      response.kycStatus = user.kycStatus;
    }

    res.json(response);
  } catch (error) {
    console.error('Firebase Auth Error:', error.message);
    res.status(401);
    throw new Error('Invalid phone authentication');
  }
});

// 🔥 FIXED: Enhanced refresh token with better error handling
const refreshAccessToken = asyncHandler(async (req, res) => {
  const refreshToken = req.body.refreshToken || req.cookies.refreshToken || req.headers['x-refresh-token'];

  if (!refreshToken) {
    return res.status(401).json({ message: 'No refresh token provided' });
  }

  try {
    let decoded;
    let user;

    // Try legacy JWT first
    try {
      decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
      user = await User.findById(decoded.id);
    } catch (err) {
      // Try Firebase
      const { auth: firebaseAuth } = require('../config/firebase');
      decoded = await firebaseAuth.verifyIdToken(refreshToken);
      user = await User.findOne({ $or: [{ firebaseUid: decoded.uid }, { email: decoded.email }] });
    }

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Generate new legacy tokens (backward compatibility)
    const accessToken = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1m' });
    const newRefreshToken = jwt.sign({ id: user._id, role: user.role }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });

    await User.updateOne({ _id: user._id }, { $set: { refreshToken: newRefreshToken } });

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      accessToken,
      refreshToken: newRefreshToken,
      message: 'Tokens refreshed successfully'
    });
  } catch (error) {
    console.error('❌ Refresh Token Error:', error.message);
    res.status(401).json({ message: 'Refresh token failed: ' + error.message });
  }
});

// Resend OTP
const resendOtp = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  const user = await User.findById(userId).select('+otp +otpExpires');
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  user.otp = otp;
  user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);

  // Use updateOne to avoid validation
  await User.updateOne(
    { _id: user._id },
    { $set: { otp, otpExpires: user.otpExpires } }
  );

  console.log(`OTP ${otp} sent to ${user.email} for verification`);
  return res.json({ message: 'OTP resent successfully.' });
});

const verifyOtp = asyncHandler(async (req, res) => {
  const { userId, otp } = req.body;
  const user = await User.findById(userId).select('+otp +otpExpires');
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  if (user.otp !== otp || new Date() > user.otpExpires) {
    return res.status(400).json({ message: 'Invalid or expired OTP' });
  }

  // Update verification status safely
  await User.updateOne(
    { _id: user._id },
    { $set: { isVerified: true }, $unset: { otp: "", otpExpires: "" } }
  );

  res.json({ success: true, message: 'OTP verified successfully' });
});

const logoutUser = asyncHandler(async (req, res) => {
  res.clearCookie('refreshToken');
  res.json({ message: 'Logged out successfully' });
});

module.exports = {
  registerUser,
  loginUser,
  loginWithPhone,
  refreshAccessToken,
  resendOtp,
  verifyOtp,
  logoutUser,
};