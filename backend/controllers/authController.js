const User = require('../models/User');
const { generateToken, generateRefreshToken } = require('../utils/generateToken');
const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const firebaseUserSync = require('../services/firebaseUserSync');
const admin = require('firebase-admin'); // Import firebase-admin

// Record login activity helper
const recordLoginHistory = async (user, req, status = 'success') => {
  try {
    const loginEntry = {
      ip: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      device: req.headers['user-agent']?.slice(0, 100) || 'Unknown',
      status,
      timestamp: new Date()
    };

    // Keep only last 10 entries
    await User.updateOne(
      { _id: user._id },
      {
        $push: {
          loginHistory: {
            $each: [loginEntry],
            $position: 0,
            $slice: 10
          }
        }
      }
    );
  } catch (err) {
    console.error('⚠️ Failed to record login history:', err.message);
  }
};

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

  const { name, email, password, phone, role, firebaseUid, referralCode } = req.body;

  // ✅ FIX: Sanitise phone to exactly 10 digits for MongoDB validation
  let sanitisedPhone = phone || '';
  if (sanitisedPhone) {
    sanitisedPhone = sanitisedPhone.replace(/\D/g, '').slice(-10);
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  // Handle Referral
  let referrerId = null;
  if (referralCode) {
    const referrer = await User.findOne({ referralCode: referralCode.toUpperCase() });
    if (referrer) {
      referrerId = referrer._id;
    }
  }

  const user = await User.create({
    name,
    email,
    password,
    phone: sanitisedPhone || undefined,
    role: role || 'customer',
    firebaseUid,
    referredBy: referrerId,
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

    // ✅ 2FA CHECK
    if (user.twoFactorEnabled) {
      // Generate OTP
      const otp = Math.floor(1000 + Math.random() * 9000).toString();
      const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

      await User.updateOne(
        { _id: user._id },
        { $set: { otp, otpExpires } }
      );

      console.log(`🔐 2FA OTP ${otp} generated for user ${user._id}`);
      // In a real app, send via Email/SMS here.

      return res.json({
        requires2FA: true,
        userId: user._id,
        message: 'Two-factor authentication required. Please enter the OTP sent to your registered contact.'
      });
    }

    // Record Success
    await recordLoginHistory(user, req, 'success');

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

// @desc    Unified Firebase Login (Email/Google/Phone)
// @route   POST /api/auth/firebase-login
// @access  Public
const firebaseLogin = asyncHandler(async (req, res) => {
  const { idToken, referralCode } = req.body;

  if (!idToken) {
    res.status(400);
    throw new Error('Firebase ID Token is required');
  }

  try {
    // 1. Verify Firebase ID Token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid, email, phone_number, name, picture, email_verified } = decodedToken;

    console.log('🔐 Firebase Login: UID:', uid, 'Email:', email, 'Phone:', phone_number);

    // 2. Find user in MongoDB by Firebase UID, Email, OR Phone
    // Normalize phone for lookup
    let sanitisedPhone = '';
    if (phone_number) {
      sanitisedPhone = phone_number.replace(/\D/g, '').slice(-10);
    }

    const lookupCriteria = [{ firebaseUid: uid }];
    if (email) lookupCriteria.push({ email });
    if (sanitisedPhone && sanitisedPhone.length === 10) {
      lookupCriteria.push({ phone: sanitisedPhone });
    }

    let user = await User.findOne({ $or: lookupCriteria });

    // Handle Referral for new user if code provided
    let referrerId = null;
    if (!user && referralCode) {
      const referrer = await User.findOne({ referralCode: referralCode.toUpperCase() });
      if (referrer) {
        referrerId = referrer._id;
      }
    }

    if (!user) {
      // 🔥 BUG FIX: Auto-create user only if NOT found by email/phone either
      console.log('🆕 Firebase Login: Creating new user for UID:', uid);

      user = await User.create({
        name: name || email?.split('@')[0] || phone_number || 'User',
        email: email || null,
        phone: sanitisedPhone || undefined,
        firebaseUid: uid,
        role: 'customer', // Default role - ALWAYS from MongoDB
        isVerified: email_verified || false,
        profileImage: picture || '/uploads/default_avatar.jpg',
        referredBy: referrerId
      });

      console.log('✅ User created in MongoDB:', user._id, 'Role:', user.role);
    } else {
      // Link Firebase UID if existing user found by Email/Phone but missing UID
      if (!user.firebaseUid || user.firebaseUid !== uid) {
        console.log(`🔗 Firebase Login: Linking UID ${uid} to existing user ${user.email || user.phone}`);
        user.firebaseUid = uid;
        // Optimization: Handle update in the update section below
      }
    }

    // 3. Update user info if needed (for Google/Phone logins or Linking)
    let needsUpdate = false;
    const updateData = {};

    if (user.firebaseUid === uid && !user.dbFirebaseUidLinked) {
      // Logic mark if UID was just set above
      updateData.firebaseUid = uid;
      needsUpdate = true;
    }

    // Ensure email is set if Firebase provides it
    if (email && user.email !== email) {
      user.email = email;
      updateData.email = email;
      needsUpdate = true;
    }

    // Ensure phone is set (sanitised) if Firebase provides it
    if (sanitisedPhone && user.phone !== sanitisedPhone) {
      user.phone = sanitisedPhone;
      updateData.phone = sanitisedPhone;
      needsUpdate = true;
    }

    // Profile Image
    if (picture && user.profileImage !== picture) {
      user.profileImage = picture;
      updateData.profileImage = picture;
      needsUpdate = true;
    }

    if (needsUpdate) {
      console.log('📝 Firebase Login: Updating user record with Firebase info...');
      await User.updateOne({ _id: user._id }, { $set: updateData });
    }

    // 4. Sync to Firestore (non-blocking - fire and forget)
    firebaseUserSync.syncUser(user).catch(err =>
      console.error('⚠️ Firestore sync failed (non-critical):', err.message)
    );

    // ✅ 2FA CHECK
    if (user.twoFactorEnabled) {
      const otp = Math.floor(1000 + Math.random() * 9000).toString();
      const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

      await User.updateOne(
        { _id: user._id },
        { $set: { otp, otpExpires } }
      );

      console.log(`🔐 2FA OTP ${otp} generated for Firebase user ${user._id}`);

      return res.json({
        requires2FA: true,
        userId: user._id,
        message: 'Two-factor authentication required.'
      });
    }

    // Record Success
    await recordLoginHistory(user, req, 'success');

    // 5. Generate backend tokens for legacy compatibility
    const accessToken = generateToken(user._id, 'access');
    const refreshToken = generateRefreshToken(user._id);
    await User.updateOne({ _id: user._id }, { $set: { refreshToken } });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // 6. Return Profile
    const response = {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      emailVerified: email_verified || false,
      accessToken,
    };

    if (user.role === 'seller') {
      response.kycStatus = user.kycStatus;
    }

    console.log('✅ Firebase Login successful for:', email || phone_number, 'Role:', user.role);
    res.json(response);

  } catch (error) {
    console.error('❌ Firebase Login Error:', error);

    // Provide specific error messages
    let statusCode = 401;
    let errorMessage = 'Firebase authentication failed';

    if (error.code === 'auth/id-token-expired') {
      errorMessage = 'Session expired. Please login again.';
    } else if (error.code === 'auth/invalid-id-token') {
      errorMessage = 'Invalid authentication token. Please login again.';
    } else if (error.code === 'auth/user-disabled') {
      errorMessage = 'This account has been disabled.';
    } else if (error.message) {
      errorMessage = error.message;
    }

    res.status(statusCode);
    throw new Error(errorMessage);
  }
});

// @desc    Login/Sync with Google (Firebase)
// @route   POST /api/auth/google-login
// @access  Public
const loginWithGoogle = asyncHandler(async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    res.status(400);
    throw new Error('Firebase ID Token is required');
  }

  try {
    // 1. Verify Token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid, email, name, picture } = decodedToken;

    // 2. Find or Create User
    let user = await User.findOne({
      $or: [{ firebaseUid: uid }, { email: email }]
    });

    if (!user) {
      console.log('🆕 Google Login: Provisioning new user:', email);
      user = await User.create({
        name: name || email.split('@')[0],
        email: email,
        firebaseUid: uid,
        role: 'customer', // Default role
        isVerified: true,  // Google is verified
        profileImage: picture
      });
    } else if (!user.firebaseUid) {
      // Link existing email user to Google UID
      user.firebaseUid = uid;
      if (picture && !user.profileImage) user.profileImage = picture;
      await user.save();
    }

    // 3. Sync to Firestore
    await firebaseUserSync.syncUser(user).catch(err =>
      console.error('⚠️ Firestore sync failed:', err.message)
    );

    // 4. Generate Tokens
    const accessToken = generateToken(user._id, 'access');
    const refreshToken = generateRefreshToken(user._id);
    await User.updateOne({ _id: user._id }, { $set: { refreshToken } });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // 5. Return Profile
    const response = {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      accessToken,
    };

    if (user.role === 'seller') {
      response.kycStatus = user.kycStatus;
    }

    res.json(response);

  } catch (error) {
    console.error('Google Auth Error:', error);
    res.status(401);
    throw new Error('Invalid Google authentication');
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

// @desc    Verify 2FA OTP and complete login
// @route   POST /api/auth/verify-2fa
// @access  Public
const verify2FA = asyncHandler(async (req, res) => {
  const { userId, otp } = req.body;

  const user = await User.findById(userId).select('+otp +otpExpires');
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (user.otp !== otp || new Date() > user.otpExpires) {
    res.status(400);
    throw new Error('Invalid or expired OTP');
  }

  // Record SUCCESS and record login history
  await recordLoginHistory(user, req, 'success');

  // Clear OTP
  await User.updateOne(
    { _id: user._id },
    { $unset: { otp: "", otpExpires: "" } }
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

  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    accessToken,
  });
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
  loginWithGoogle,
  firebaseLogin,
  verify2FA
};