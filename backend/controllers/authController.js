const User = require('../models/User');
const { generateToken, generateRefreshToken } = require('../utils/generateToken');
const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const firebaseUserSync = require('../services/firebaseUserSync');

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

  const { name, email, password, phone, role } = req.body;
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
    role: role || 'seller',
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

// 🔥 FIXED: Enhanced refresh token with better error handling
const refreshAccessToken = asyncHandler(async (req, res) => {
  checkJWTSecrets();

  const refreshToken = req.body.refreshToken || req.cookies.refreshToken || req.headers['x-refresh-token'];

  console.log('🔄 Refresh Token: Attempting to refresh token');
  console.log('📦 Refresh Token provided:', !!refreshToken);

  if (!refreshToken) {
    console.error('❌ Refresh Token: No refresh token provided');
    return res.status(401).json({ message: 'No refresh token provided' });
  }

  try {
    console.log('🔄 Refresh Token: Verifying token...');
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    console.log('✅ Refresh Token: Token verified for user:', decoded.id);

    const user = await User.findById(decoded.id);

    if (!user) {
      console.error('❌ Refresh Token: User not found');
      return res.status(401).json({ message: 'User not found' });
    }

    // 🔥 FIXED: Check if refreshToken field exists and matches
    if (!user.refreshToken || user.refreshToken !== refreshToken) {
      console.error('❌ Refresh Token: Invalid refresh token or token mismatch');
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    const accessToken = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '15m' });
    const newRefreshToken = jwt.sign({ id: user._id, role: user.role }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });

    // UPDATE ONLY refreshToken
    await User.updateOne(
      { _id: user._id },
      { $set: { refreshToken: newRefreshToken } }
    );

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    console.log('✅ Refresh Token: Tokens refreshed successfully');
    res.json({
      accessToken,
      refreshToken: newRefreshToken,
      message: 'Tokens refreshed successfully'
    });
  } catch (error) {
    console.error('❌ Refresh Token Error:', error.message);

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid refresh token signature' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Refresh token expired' });
    }

    res.status(401).json({ message: 'Refresh token failed' });
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
  refreshAccessToken,
  resendOtp,
  verifyOtp,
  logoutUser,
};