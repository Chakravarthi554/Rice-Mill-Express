const User = require('../models/User');
const Address = require('../models/Address');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
// [AI: Added forum bookmarking endpoints: bookmarkPost, unbookmarkPost, getBookmarks]
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');
const { getSocket } = require('../utils/socketServer');
const Order = require('../models/Order');

const generateTokens = (id, role) => {
  const accessToken = jwt.sign({ id, aud: role }, process.env.JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ id, aud: role }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
};

const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({
      message: 'Refresh token required',
      code: 'REFRESH_TOKEN_REQUIRED'
    });
  }

  try {
    let decoded;
    let user;

    // Try verifying as legacy JWT first for this specific controller function
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      user = await User.findById(decoded.id).select('-password +refreshToken');
    } catch (err) {
      const { auth: firebaseAuth } = require('../config/firebase');
      decoded = await firebaseAuth.verifyIdToken(refreshToken);
      user = await User.findOne({ $or: [{ firebaseUid: decoded.uid }, { email: decoded.email }] }).select('-password +refreshToken');
    }

    if (!user) {
      return res.status(401).json({
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // ✅ Verify that the refresh token matches the one in DB (for session invalidation)
    if (user.refreshToken !== refreshToken) {
      console.warn(`⛔ Token Invalidation: Provided refresh token does not match DB for user ${user._id}`);
      return res.status(401).json({
        message: 'Session invalidated. Please login again.',
        code: 'SESSION_INVALIDATED'
      });
    }

    const newAccessToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const newRefreshToken = jwt.sign(
      { id: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
});

// @desc    Get all admins
// @route   GET /api/users/admins
// @access  Private
const getAdmins = asyncHandler(async (req, res) => {
  const admins = await User.find({ role: 'admin' }).select('name profileImage role isOnline lastActive');
  res.json(admins);
});

const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+password +refreshToken');
  if (user && (await user.matchPassword(password))) {
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id, user.role);
    await User.updateOne({ _id: user._id }, { $set: { refreshToken: newRefreshToken } });
    res.cookie('refreshToken', newRefreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.json({ success: true, _id: user._id, accessToken, refreshToken: newRefreshToken });
  } else {
    res.status(401).json({ message: 'Invalid email or password' });
  }
});

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone, firebaseUid, referralCode, deviceId } = req.body;

  const userExists = await User.findOne({
    $or: [
      { email: email?.toLowerCase() },
      { phone: phone }
    ]
  });

  if (userExists) return res.status(400).json({ message: 'User with this email or phone already exists' });

  let referredBy = null;
  if (referralCode) {
    const referrer = await User.findOne({ referralCode });
    if (referrer) {
      // ✅ Anti-abuse: Check if this deviceId has already been used for a referral signup
      if (deviceId) {
        const duplicateDevice = await User.findOne({ registrationDevice: deviceId, referredBy: { $exists: true } });
        if (duplicateDevice) {
          console.warn(`⛔ Anti-Abuse: Duplicate Device ID ${deviceId} attempted referral signup.`);
          // We allow registration but don't link referral to prevent abuse rewards
          // OR: block referral entirely
        } else {
          referredBy = referrer._id;
        }
      } else {
        referredBy = referrer._id;
      }
    }
  }

  const user = await User.create({
    name,
    email,
    password,
    role: role || 'customer',
    phone,
    firebaseUid,
    referredBy,
    registrationDevice: deviceId
  });

  const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id, user.role);
  await User.updateOne({ _id: user._id }, { $set: { refreshToken: newRefreshToken } });

  res.cookie('refreshToken', newRefreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000 });
  res.status(201).json({
    success: true,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      referralCode: user.referralCode
    },
    accessToken,
    refreshToken: newRefreshToken
  });
});

const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('addresses wishlist').select('-password -refreshToken');
  if (!user) return res.status(404).json({ message: 'User not found' });

  // ✅ CHECK: If bootstrap is allowed (Only if NO admins exist)
  const adminCount = await User.countDocuments({ role: 'admin' });

  const profile = user.toObject();
  profile.canBootstrap = (adminCount === 0);

  if (user.role !== 'seller') {
    delete profile.kycStatus;
  }
  res.json(profile);
});

// ✅ FIXED: Add missing updateUserProfile function (alias for updateProfile)
const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  const updates = {};
  ['name', 'email', 'phone', 'gender', 'dob'].forEach(f => {
    if (req.body[f] && req.body[f] !== 'undefined') updates[f] = req.body[f];
  });

  // ✅ FIXED: Robust boolean handling for isProfilePublic (avoids falsy ignore)
  if (req.body.isProfilePublic !== undefined) {
    const isPublic = req.body.isProfilePublic === 'true' || req.body.isProfilePublic === true;
    updates.isProfilePublic = isPublic;
    updates['privacySettings.profileVisible'] = isPublic; // Manual sync for updateOne
  }

  if (req.body.preferences) {
    const p = typeof req.body.preferences === 'string' ? JSON.parse(req.body.preferences) : req.body.preferences;
    updates['preferences.language'] = p.language || user.preferences.language;
    updates['preferences.theme'] = p.theme || user.preferences.theme;
    updates['preferences.recommendationsEnabled'] = p.recommendationsEnabled === true;
  }



  if (req.body.notificationPreferences) {
    const np = typeof req.body.notificationPreferences === 'string' ? JSON.parse(req.body.notificationPreferences) : req.body.notificationPreferences;
    updates.notificationPreferences = {
      email: np.email === true,
      sms: np.sms === true,
      push: np.push === true,
      categories: {
        orders: np.categories?.orders === true,
        marketing: np.categories?.marketing === true,
        social: np.categories?.social === true,
      }
    };
  }

  if (req.file) updates.profileImage = `/uploads/${req.file.filename}`;

  if (user.role === 'seller' && req.body.businessDetails) {
    const bd = typeof req.body.businessDetails === 'string' ? JSON.parse(req.body.businessDetails) : req.body.businessDetails;
    updates.businessDetails = { ...user.businessDetails, ...bd };
  }

  await User.updateOne({ _id: user._id }, { $set: updates });
  const updatedUser = await User.findById(user._id).populate('addresses wishlist').select('-password -refreshToken');
  res.json({ success: true, message: 'Profile updated', user: updatedUser });
});

// ✅ FIXED: Add verifyEmail function
const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ message: 'Verification token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Email already verified' });
    }

    user.isVerified = true;
    await user.save();

    res.json({ success: true, message: 'Email verified successfully' });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(400).json({ message: 'Invalid or expired verification token' });
  }
});

// ✅ FIXED: Add changePassword function (alias for changeUserPassword)


const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    res.status(400);
    throw new Error('Please provide both current and new passwords');
  }
  if (newPassword.length < 8) {
    res.status(400);
    throw new Error('New password must be at least 8 characters');
  }

  const user = await User.findById(req.user._id).select('+password');
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  let isMatch = false;
  if (user.password) {
    // 1. Standard approach: User has a local password hash in MongoDB
    isMatch = await user.matchPassword(currentPassword);
  } else if (user.firebaseUid) {
    // 2. Firebase Fallback: User was auto-provisioned and lacks local hash.
    // We verify via Firebase Auth REST API.
    console.log(`ℹ️ No local hash for user ${user._id} (${user.email}). Attempting Firebase verification...`);

    try {
      const axios = require('axios');
      const apiKey = process.env.REACT_APP_FIREBASE_API_KEY;

      const firebaseVerifyUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;

      await axios.post(firebaseVerifyUrl, {
        email: user.email,
        password: currentPassword,
        returnSecureToken: true
      });

      console.log('✅ Firebase password verification successful');
      isMatch = true;
    } catch (error) {
      console.error('❌ Firebase password verification failed:', error.response?.data?.error?.message || error.message);
      isMatch = false;
    }
  }

  if (!isMatch) {
    res.status(401);
    throw new Error('Invalid current password');
  }

  // 🔐 SYNC PASSWORD TO FIREBASE IF UID EXISTS
  if (user.firebaseUid) {
    try {
      const { auth: firebaseAdminAuth } = require('../config/firebase');
      await firebaseAdminAuth.updateUser(user.firebaseUid, {
        password: newPassword
      });
      console.log('✅ Password synced to Firebase Admin');
    } catch (fbError) {
      console.error('⚠️ Firebase Admin password update failed (non-critical):', fbError.message);
      // We continue since we still update MongoDB
    }
  }

  // 🔐 UPDATE LOCAL PASSWORD (pre-save hook will hash it)
  user.password = newPassword;

  // ✅ Invalidate refresh token to force re-authentication
  user.refreshToken = undefined;

  // ✅ Clear any cached Firebase tokens (will be regenerated on next login)
  user.firebaseUid = user.firebaseUid; // Keep existing UID

  await user.save();

  // ✅ Send success response with instruction to re-login
  res.status(200).json({
    message: 'Password changed successfully. Please login again with your new password.',
    requiresReauth: true
  });
});

// ✅ FIXED: Add updatePreferences function
const updatePreferences = asyncHandler(async (req, res) => {
  const { language, theme, recommendationsEnabled, region, currency } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  const updates = {};
  if (language) updates['preferences.language'] = language;
  if (theme) updates['preferences.theme'] = theme;
  if (recommendationsEnabled !== undefined) updates['preferences.recommendationsEnabled'] = recommendationsEnabled;
  if (region) updates['preferences.region'] = region;
  if (currency) updates['preferences.currency'] = currency;

  // ✅ Manual Sync: Handle profile visibility if it's passed here (mobile sometimes does this)
  if (req.body.profileVisible !== undefined) {
    updates.isProfilePublic = req.body.profileVisible;
    updates['privacySettings.profileVisible'] = req.body.profileVisible;
  }

  // ✅ Update preferences atomically and return updated user
  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updates },
    { new: true, projection: { password: 0, refreshToken: 0 } }
  );

  // ✅ Emit real-time update to all connected devices
  if (req.io) {
    req.io.to(`user_${req.user._id}`).emit('PREFERENCES_UPDATED', {
      userId: req.user._id,
      preferences: updatedUser.preferences
    });

    // Broadcast to all user's sessions
    req.io.emit('GLOBAL_PREFERENCES_UPDATE', {
      userId: req.user._id,
      preferences: updatedUser.preferences
    });
  }

  res.json({
    success: true,
    message: 'Preferences updated successfully',
    preferences: updatedUser.preferences
  });
});

// ✅ FIXED: Add updateNotificationPreferences function
const updateNotificationPreferences = asyncHandler(async (req, res) => {
  const { email, sms, push, categories } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  const updates = {
    notificationPreferences: {
      email: email === true,
      sms: sms === true,
      push: push === true,
      categories: {
        orders: categories?.orders === true,
        marketing: categories?.marketing === true,
        social: categories?.social === true,
      }
    }
  };

  await User.updateOne({ _id: user._id }, { $set: updates });

  res.json({ success: true, message: 'Notification preferences updated' });
});

// @desc    Toggle Two-Factor Authentication
// @route   PUT /api/users/two-factor
// @access  Private
const toggleTwoFactor = asyncHandler(async (req, res) => {
  const { enabled } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  user.twoFactorEnabled = enabled === true;
  await user.save();

  res.json({
    success: true,
    message: `Two-factor authentication ${user.twoFactorEnabled ? 'enabled' : 'disabled'}`,
    twoFactorEnabled: user.twoFactorEnabled
  });
});

// @desc    Get Login History
// @route   GET /api/users/login-history
// @access  Private
const getLoginHistory = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('loginHistory');
  if (!user) return res.status(404).json({ message: 'User not found' });

  res.json(user.loginHistory || []);
});

// ✅ FIXED: Address management functions
const getAddresses = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('addresses');
  res.json(user?.addresses || []);
});

const addAddress = asyncHandler(async (req, res) => {
  const { name, phone, street, city, state, pinCode, houseNumber, colony, landmark, alternativePhone, location, type } = req.body;

  if (!name || !phone || !street || !city || !state || !pinCode) {
    return res.status(400).json({ message: 'Required address fields missing' });
  }

  const address = new Address({
    user: req.user._id,
    name,
    phone,
    street,
    city,
    state,
    pinCode,
    houseNumber,
    colony,
    landmark,
    alternativePhone,
    location: location || { type: 'Point', coordinates: [0, 0] },
    type: type || 'home'
  });

  await address.save();

  // Add to user's addresses array
  await User.findByIdAndUpdate(req.user._id, {
    $addToSet: { addresses: address._id }
  });

  res.status(201).json({ success: true, address });
});

const updateAddress = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const address = await Address.findOne({ _id: id, user: req.user._id });
  if (!address) {
    return res.status(404).json({ message: 'Address not found' });
  }

  const allowedFields = [
    'name', 'phone', 'street', 'city', 'state', 'pinCode',
    'houseNumber', 'colony', 'landmark', 'alternativePhone',
    'location', 'type', 'isDefault'
  ];

  allowedFields.forEach(key => {
    if (updates[key] !== undefined) {
      address[key] = updates[key];
    }
  });

  await address.save();
  res.json({ success: true, address });
});

const deleteAddress = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const address = await Address.findOneAndDelete({ _id: id, user: req.user._id });
  if (!address) {
    return res.status(404).json({ message: 'Address not found' });
  }

  // Remove from user's addresses array
  await User.findByIdAndUpdate(req.user._id, {
    $pull: { addresses: id }
  });

  res.json({ success: true, message: 'Address deleted' });
});

const setDefaultAddress = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // First, set all addresses to non-default
  await Address.updateMany(
    { user: req.user._id },
    { $set: { isDefault: false } }
  );

  // Then set the selected address as default
  const address = await Address.findOneAndUpdate(
    { _id: id, user: req.user._id },
    { $set: { isDefault: true } },
    { new: true }
  );

  if (!address) {
    return res.status(404).json({ message: 'Address not found' });
  }

  res.json({ success: true, address });
});

// ✅ FIXED: Add getDashboardStats function
const getDashboardStats = asyncHandler(async (req, res) => {
  const user = req.user;
  let stats = {};

  if (user.role === 'customer') {
    const totalOrders = await Order.countDocuments({ user: user._id });
    const pendingOrders = await Order.countDocuments({ user: user._id, orderStatus: { $in: ['placed', 'processing', 'packed', 'shipped'] } });
    const deliveredOrders = await Order.countDocuments({ user: user._id, orderStatus: 'delivered' });

    stats = {
      totalOrders,
      pendingOrders,
      deliveredOrders,
      wishlistCount: user.wishlist?.length || 0,
      addressesCount: user.addresses?.length || 0
    };
  } else if (user.role === 'seller') {
    const totalOrders = await Order.countDocuments({ seller: user._id });
    const pendingOrders = await Order.countDocuments({ seller: user._id, orderStatus: { $in: ['placed', 'processing', 'packed', 'shipped'] } });
    const deliveredOrders = await Order.countDocuments({ seller: user._id, orderStatus: 'delivered' });

    stats = {
      totalOrders,
      pendingOrders,
      deliveredOrders,
      totalEarnings: 0, // You can calculate from payments
      pendingPayments: 0
    };
  } else if (user.role === 'admin') {
    const totalUsers = await User.countDocuments();
    const totalSellers = await User.countDocuments({ role: 'seller' });
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const totalOrders = await Order.countDocuments();

    stats = {
      totalUsers,
      totalSellers,
      totalCustomers,
      totalOrders,
      pendingKYC: await User.countDocuments({ role: 'seller', kycStatus: 'pending' })
    };
  }

  res.json({ success: true, stats });
});

// ✅ FIXED: Add getUserById function
const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid user ID' });
  }

  const user = await User.findById(id).select('-password -refreshToken');
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Only admin can view any user, users can only view themselves
  if (req.user.role !== 'admin' && req.user._id.toString() !== id) {
    return res.status(403).json({ message: 'Not authorized' });
  }

  res.json(user);
});

// ✅ FIXED: Add updateUser function
const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid user ID' });
  }

  const user = await User.findById(id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Only admin can update other users
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized' });
  }

  const updates = req.body;
  await User.findByIdAndUpdate(id, { $set: updates }, { new: true });

  const updatedUser = await User.findById(id).select('-password -refreshToken');
  res.json({ success: true, message: 'User updated', user: updatedUser });
});

// ✅ FIXED: Add deleteUser function
const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid user ID' });
  }

  // Only admin can delete users
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized' });
  }

  // Don't allow self-deletion via this endpoint
  if (req.user._id.toString() === id) {
    return res.status(400).json({ message: 'Use /api/users/me to delete your own account' });
  }

  const user = await User.findByIdAndDelete(id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  res.json({ success: true, message: 'User deleted' });
});

// WISHLIST FUNCTIONS
const getWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('wishlist').select('wishlist');
  res.json(user?.wishlist || []);
});

const addToWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
    res.status(400);
    throw new Error('Valid Product ID is required');
  }
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $addToSet: { wishlist: productId } },
    { new: true }
  ).select('wishlist');
  if (!user) throw new Error('User not found');
  res.json(user.wishlist);
});

const removeFromWishlist = asyncHandler(async (req, res) => {
  const { id: productId } = req.params;
  if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
    res.status(400);
    throw new Error('Valid Product ID is required');
  }
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $pull: { wishlist: productId } },
    { new: true }
  ).populate('wishlist').select('wishlist'); // ✅ FIXED: Populate wishlist to return full product details
  if (!user) throw new Error('User not found');
  res.json(user.wishlist); // Returns populated products
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    res.status(400);
    throw new Error('Email is required');
  }

  const user = await User.findOne({ email });
  if (!user) {
    console.warn(`Forgot password request for non-existent email: ${email}`);
    return res.status(200).json({ message: 'If an account with that email exists, a password reset link has been sent.' });
  }

  const resetToken = user.getPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/resetpassword/${resetToken}`;
  const message = `<h1>Password Reset Request</h1><p>Click below to reset your password (link expires in 10 minutes):</p><a href="${resetUrl}" clicktracking=off>${resetUrl}</a>`;

  try {
    await sendEmail({ email: user.email, subject: 'Password Reset Request', message });
    res.status(200).json({ message: 'Password reset link sent successfully' });
  } catch (err) {
    console.error("FORGOT PASSWORD EMAIL ERROR:", err);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    res.status(500).json({ message: 'Email could not be sent. Please try again later.' });
  }
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password || password.length < 8) {
    res.status(400);
    throw new Error('Password must be at least 8 characters long');
  }

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  if (!user) {
    res.status(400);
    throw new Error('Invalid or expired password reset token');
  }

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  res.status(200).json({ message: 'Password reset successful' });
});

const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}).select('-password -refreshToken');
  res.json(users || []);
});

const uploadProfileImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('No file uploaded');
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  user.profileImage = `/uploads/${req.file.filename}`;
  await user.save();

  res.json({ success: true, profileImage: user.profileImage });
});

const sendTestNotification = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  const { type } = req.body; // 'email', 'sms', 'push'

  if (type === 'email' && user.notificationPreferences.email) {
    await sendEmail({
      email: user.email,
      subject: 'Test Notification',
      message: `<p>This is a test email from Rice Mill App.</p>`
    });
  }

  if (type === 'push' && user.notificationPreferences.push) {
    const socket = getSocket();
    if (socket) {
      socket.to(`user_${user._id}`).emit('NOTIFICATION', {
        title: 'Test Push',
        message: 'This is a test push notification!',
        type: 'test'
      });
    }
  }

  res.json({ success: true, message: `Test ${type} sent!` });
});

const deleteAccount = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const user = await User.findById(req.user._id).select('+password +firebaseUid');
  if (!user) return res.status(404).json({ message: 'User not found' });

  // Only check password if user HAS a password hash (not just social login)
  if (user.password) {
    if (!password) {
      return res.status(400).json({ message: 'Password is required to delete account' });
    }
    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Incorrect password' });
  }

  // FIREBASE: Also delete from Firebase if it's a social user
  if (user.firebaseUid) {
    const { auth: fbAuth } = require('../config/firebase');
    try {
      await fbAuth.deleteUser(user.firebaseUid);
      console.log(`✅ Firebase user ${user.firebaseUid} deleted`);
    } catch (err) {
      console.error('⚠️ Firebase user deletion failed:', err.message);
      // Continue with MongoDB deletion anyway
    }
  }

  await User.deleteOne({ _id: user._id });

  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });

  res.json({ success: true, message: 'Account deleted permanently' });
});

const resetPreferences = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  const defaultPrefs = {
    language: 'english',
    theme: 'system',
    recommendationsEnabled: true
  };

  const defaultNotif = {
    email: true,
    sms: false,
    push: true,
    categories: { orders: true, marketing: true, social: true }
  };



  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        preferences: defaultPrefs,
        notificationPreferences: defaultNotif,

      }
    }
  );

  const updatedUser = await User.findById(user._id)
    .populate('addresses wishlist')
    .select('-password -refreshToken');

  res.json({ success: true, user: updatedUser });
});

const linkAccount = asyncHandler(async (req, res) => {
  const { provider } = req.body;

  if (!['google', 'facebook', 'twitter'].includes(provider)) {
    return res.status(400).json({ message: 'Invalid provider' });
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (!user.linkedAccounts) {
    user.linkedAccounts = [];
  }

  if (!user.linkedAccounts.includes(provider)) {
    user.linkedAccounts.push(provider);
    await user.save();
  }

  res.json({ success: true, message: `${provider} account linked successfully`, linkedAccounts: user.linkedAccounts });
});

const unlinkAccount = asyncHandler(async (req, res) => {
  const { provider } = req.body;

  if (!provider) {
    return res.status(400).json({ message: "Provider is required" });
  }

  const user = await User.findById(req.user._id);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  user.linkedAccounts = user.linkedAccounts?.filter((p) => p !== provider) || [];

  await user.save();

  res.json({ success: true, message: `${provider} account unlinked successfully` });
});

const addPaymentMethod = asyncHandler(async (req, res) => {
  const { cardNumber, expiry, cvv, last4 } = req.body;

  if (!cardNumber || !expiry || !cvv) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  // Detect card type based on first digit
  let cardType = 'Credit Card';
  const firstDigit = cardNumber.charAt(0);
  if (firstDigit === '4') cardType = 'Visa';
  else if (firstDigit === '5') cardType = 'Mastercard';
  else if (firstDigit === '3') cardType = 'American Express';
  else if (firstDigit === '6') cardType = 'Discover';

  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Store last 4 digits
  const lastFour = last4 || cardNumber.slice(-4);

  user.paymentMethods.push({
    cardNumber: `****${lastFour}`,
    cardType,
    last4: lastFour,
    expiry,
    isDefault: user.paymentMethods.length === 0
  });

  await user.save();
  res.json({ success: true, message: 'Payment method added successfully', user });
});

const deletePaymentMethod = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  user.paymentMethods = user.paymentMethods.filter(
    (method) => method._id.toString() !== id
  );
  await user.save();
  res.json({ success: true, message: "Payment method deleted successfully" });
});

const getPaymentMethods = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('paymentMethods');
  res.json(user.paymentMethods || []);
});



const reportProblem = asyncHandler(async (req, res) => {
  const { description } = req.body;
  if (!description || description.trim() === "") {
    return res.status(400).json({ message: "Description is required" });
  }
  await sendEmail({
    email: "support@ricemill.com",
    subject: "Problem Report",
    message: description
  });
  res.json({ success: true, message: "Problem reported successfully" });
});



const getReferralCode = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('referralCode');

  if (!user.referralCode) {
    const crypto = require('crypto');
    user.referralCode = crypto.randomBytes(4).toString('hex').toUpperCase();
    await user.save();
  }

  res.json({ code: user.referralCode });
});

const getReferrals = asyncHandler(async (req, res) => {
  let user = await User.findById(req.user._id).select('referralCode referralStats');

  // Generate referral code if missing
  if (!user.referralCode) {
    const crypto = require('crypto');
    user.referralCode = crypto.randomBytes(4).toString('hex').toUpperCase();
    await user.save();
  }

  res.json({
    referralCode: user.referralCode,
    stats: user.referralStats || { referredUsers: 0, earnedCredits: 0 }
  });
});

const getReviews = asyncHandler(async (req, res) => {
  const Rating = require('../models/Rating');

  // Find all ratings/reviews where this user is the author
  const ratings = await Rating.find({ userId: req.user._id })
    .populate('targetId', 'name title images image price')
    .sort({ createdAt: -1 });

  const userReviews = ratings.map(rating => {
    const item = rating.targetId;
    const isPopulated = item && typeof item === 'object';

    let name = 'Unknown Item';
    let image = null;

    if (isPopulated) {
      name = item.name || item.title || 'Untitled Item';
      if (item.images && item.images.length > 0) {
        image = item.images[0];
      } else if (item.image) {
        image = item.image;
      }
    }

    return {
      _id: rating._id,
      targetId: rating.targetId?._id || rating.targetId,
      targetType: rating.targetType,
      productId: rating.targetId?._id || rating.targetId, // Legacy support for frontend
      productName: name, // Legacy support for frontend
      productImage: image,
      rating: rating.rating,
      comment: rating.comment,
      createdAt: rating.createdAt
    };
  });

  res.json(userReviews);
});

const getPrivacySettings = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('privacySettings');
  res.json(user.privacySettings || { profileVisible: true, showActivity: true, marketingEmails: false });
});

const updatePrivacySettings = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  user.privacySettings = { ...user.privacySettings, ...req.body };
  if (req.body.profileVisible !== undefined) {
    user.isProfilePublic = req.body.profileVisible;
  }
  if (req.body.isProfilePublic !== undefined) {
    user.isProfilePublic = req.body.isProfilePublic;
  }

  await user.save();
  res.json({ success: true, privacySettings: user.privacySettings });
});

// @desc    Export User Data
// @route   POST /api/users/export-data
// @access  Private
const exportUserData = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('addresses wishlist');
  if (!user) return res.status(404).json({ message: 'User not found' });

  // Gather all data associated with user
  const orders = await Order.find({ user: user._id });

  // In a real application, we would generate a JSON or CSV file and attach it to an email
  // For now, we simulate the process and notify the user.
  const dataSummary = {
    profile: {
      name: user.name,
      email: user.email,
      phone: user.phone,
      joinedAt: user.createdAt
    },
    ordersCount: orders.length,
    addressesCount: user.addresses?.length || 0,
    wishlistCount: user.wishlist?.length || 0
  };

  const message = `
    <h1>Data Export Request</h1>
    <p>Hello ${user.name},</p>
    <p>We received a request to export your personal data from Rice Mill App.</p>
    <p>Here is a summary of the data we have on file for you:</p>
    <ul>
      <li>Name: ${user.name}</li>
      <li>Email: ${user.email}</li>
      <li>Phone: ${user.phone || 'N/A'}</li>
      <li>Total Orders: ${orders.length}</li>
    </ul>
    <p>Your full data report is being processed and will be available for download shortly.</p>
  `;

  if (!user.email) {
    return res.status(400).json({ message: 'User email is required for data export' });
  }

  try {
    const emailResult = await sendEmail({
      email: user.email,
      subject: 'Your Data Export Request',
      message
    });

    res.json({
      success: true,
      message: emailResult.simulated
        ? 'Data export initialized (Simulated: Check server logs)'
        : 'Data export initialized. Please check your email.'
    });
  } catch (error) {
    console.error('❌ Data export email failed:', error.message);
    res.status(500).json({ message: 'Failed to send data export email. Please contact support.' });
  }
});

const getLinkedAccounts = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('linkedAccounts');
  res.json(user.linkedAccounts || []);
});

// ✅ RESTORED: Missing Functions

const getSubscription = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
    res.json({
      subscription: user.subscription || { plan: 'free', active: false },
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

const subscribe = asyncHandler(async (req, res) => {
  const { plan, duration, paymentMethodId } = req.body;
  const user = await User.findById(req.user._id);
  if (user) {
    user.subscription = {
      plan: plan || 'premium',
      active: true,
      startDate: new Date(),
      endDate: new Date(Date.now() + (duration || 30) * 24 * 60 * 60 * 1000),
      paymentMethodId
    };
    await user.save();
    res.json({ message: 'Subscription updated', subscription: user.subscription });
  } else {
    res.status(404); throw new Error('User not found');
  }
});

const unsubscribe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
    if (user.subscription) { user.subscription.active = false; user.subscription.autoRenew = false; }
    await user.save();
    res.json({ message: 'Unsubscribed successfully' });
  } else {
    res.status(404); throw new Error('User not found');
  }
});



const getRewards = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json({ balance: user.rewardsBalance || 0, history: user.rewardsHistory || [] });
});

// ✅ NEW: Forum bookmark functions
const bookmarkPost = asyncHandler(async (req, res) => {
  const { postId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(postId)) {
    return res.status(400).json({ message: 'Invalid post ID' });
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Check if already bookmarked
  const existingBookmark = user.bookmarks.find(b => b.postId.toString() === postId);
  if (existingBookmark) {
    return res.status(400).json({ message: 'Post already bookmarked' });
  }

  user.bookmarks.push({ postId, bookmarkedAt: new Date() });
  await user.save();

  // Sync with ForumPost
  const ForumPost = require('../models/ForumPost');
  await ForumPost.findByIdAndUpdate(postId, {
    $addToSet: { bookmarkedBy: user._id }
  });

  res.json({ success: true, message: 'Post bookmarked successfully' });
});

const unbookmarkPost = asyncHandler(async (req, res) => {
  const { postId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(postId)) {
    return res.status(400).json({ message: 'Invalid post ID' });
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  user.bookmarks = user.bookmarks.filter(b => b.postId.toString() !== postId);
  await user.save();

  // Sync with ForumPost
  const ForumPost = require('../models/ForumPost');
  await ForumPost.findByIdAndUpdate(postId, {
    $pull: { bookmarkedBy: user._id }
  });

  res.json({ success: true, message: 'Post unbookmarked successfully' });
});

const getBookmarks = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate({
      path: 'bookmarks.postId',
      populate: { path: 'userId', select: 'name profilePic' }
    })
    .select('bookmarks');

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Filter out null postIds (deleted posts)
  const validBookmarks = user.bookmarks.filter(b => b.postId);

  res.json({ bookmarks: validBookmarks });
});

// Alias functions for backward compatibility
const updateProfile = updateUserProfile;

const validateReferralCode = asyncHandler(async (req, res) => {
  const { code } = req.body;
  if (!code) {
    res.status(400);
    throw new Error('Referral code is required');
  }

  const referrer = await User.findOne({ referralCode: code });
  if (!referrer) {
    res.status(404);
    throw new Error('Invalid referral code');
  }

  if (referrer._id.toString() === req.user?._id?.toString()) {
    res.status(400);
    throw new Error('Cannot use your own referral code');
  }

  res.json({ valid: true, referrerName: referrer.name });
});

module.exports = {
  authUser,
  registerUser,
  getUserProfile,
  updateProfile,
  updateUserProfile, // Export both names
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  getReviews,
  getSubscription,
  subscribe,
  unsubscribe,
  changeUserPassword: changePassword,
  changePassword, // Export both names
  forgotPassword,
  resetPassword,
  getUsers,
  uploadProfileImage,
  sendTestNotification,
  deleteAccount,
  resetPreferences,
  linkAccount,
  unlinkAccount,
  addPaymentMethod,
  deletePaymentMethod,
  getPaymentMethods,
  getRewards,
  reportProblem,


  // ✅ NEW: Add all the missing functions
  refreshToken,
  verifyEmail,
  updatePreferences,
  updateNotificationPreferences,
  getAddresses,
  getReferrals,
  getReferralCode,
  getPrivacySettings,
  updatePrivacySettings,
  getLinkedAccounts,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  getDashboardStats,
  getUserById,
  updateUser,
  deleteUser,
  bookmarkPost,
  unbookmarkPost,
  getBookmarks,
  getAdmins,
  validateReferralCode,
  toggleTwoFactor,
  getLoginHistory,
  exportUserData
};