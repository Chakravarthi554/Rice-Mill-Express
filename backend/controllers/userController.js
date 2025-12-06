const User = require('../models/User');
const Address = require('../models/Address');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
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

// ✅ FIXED: Add refreshToken function
const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ 
      message: 'Refresh token required',
      code: 'REFRESH_TOKEN_REQUIRED'
    });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({
        message: 'User not found',
        code: 'USER_NOT_FOUND'
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
  const { name, email, password, role, phone } = req.body;
  const userExists = await User.findOne({ email });
  if (userExists) return res.status(400).json({ message: 'User already exists' });

  const user = await User.create({ name, email, password, role, phone });
  const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id, user.role);
  await User.updateOne({ _id: user._id }, { $set: { refreshToken: newRefreshToken } });

  res.cookie('refreshToken', newRefreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000 });
  res.status(201).json({ success: true, user: { _id: user._id, name, email, role }, accessToken, refreshToken: newRefreshToken });
});

const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('addresses wishlist').select('-password -refreshToken');
  if (!user) return res.status(404).json({ message: 'User not found' });

  const profile = user.toObject();
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

  if (req.body.preferences) {
    const p = typeof req.body.preferences === 'string' ? JSON.parse(req.body.preferences) : req.body.preferences;
    updates['preferences.language'] = p.language || user.preferences.language;
    updates['preferences.theme'] = p.theme || user.preferences.theme;
    updates['preferences.recommendationsEnabled'] = p.recommendationsEnabled === true;
  }

  if (req.body.personalization) {
    const p = typeof req.body.personalization === 'string' ? JSON.parse(req.body.personalization) : req.body.personalization;
    updates['personalization.bio'] = p.bio || user.personalization.bio;
    updates['personalization.tagline'] = p.tagline || user.personalization.tagline;
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

  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    res.status(401);
    throw new Error('Invalid current password');
  }

  user.password = newPassword;
  await user.save();
  res.status(200).json({ message: 'Password changed successfully' });
});

// ✅ FIXED: Add updatePreferences function
const updatePreferences = asyncHandler(async (req, res) => {
  const { language, theme, recommendationsEnabled } = req.body;
  
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  const updates = {};
  if (language) updates['preferences.language'] = language;
  if (theme) updates['preferences.theme'] = theme;
  if (recommendationsEnabled !== undefined) updates['preferences.recommendationsEnabled'] = recommendationsEnabled;

  await User.updateOne({ _id: user._id }, { $set: updates });
  const updatedUser = await User.findById(user._id).select('-password -refreshToken');
  
  res.json({ success: true, message: 'Preferences updated', user: updatedUser });
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

// ✅ FIXED: Address management functions
const getAddresses = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('addresses');
  res.json(user?.addresses || []);
});

const addAddress = asyncHandler(async (req, res) => {
  const { name, phone, street, city, state, pinCode, landmark, addressType } = req.body;
  
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
    landmark,
    addressType: addressType || 'home'
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

  Object.keys(updates).forEach(key => {
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
  ).select('wishlist');
  if (!user) throw new Error('User not found');
  res.json(user.wishlist);
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
  const user = await User.findById(req.user._id).select('+password');
  if (!user) return res.status(404).json({ message: 'User not found' });

  const isMatch = await user.matchPassword(password);
  if (!isMatch) return res.status(401).json({ message: 'Incorrect password' });

  await User.deleteOne({ _id: user._id });

  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });

  res.json({ message: 'Account deleted permanently' });
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

  const defaultPersonalization = {
    bio: '',
    tagline: ''
  };

  await User.updateOne(
    { _id: user._id },
    {
      $set: {
        preferences: defaultPrefs,
        notificationPreferences: defaultNotif,
        personalization: defaultPersonalization
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
  const user = await User.findById(req.user._id);
  if (!user.linkedAccounts.includes(provider)) {
    user.linkedAccounts.push(provider);
    await user.save();
  }
  res.json({ success: true });
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
  const { cardNumber, expiry, cvv } = req.body;
  const user = await User.findById(req.user._id);
  user.paymentMethods.push({ cardNumber: `****${cardNumber.slice(-4)}`, expiry, cvv: '***' });
  await user.save();
  res.json({ success: true });
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

const getRewards = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json({ balance: user.rewardsBalance || 0, history: user.rewardsHistory || [] });
});

const subscribe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  user.subscription = { active: true, type: 'premium', startDate: new Date() };
  await user.save();
  res.json({ success: true });
});

const unsubscribe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  user.subscription = { active: false };
  await user.save();
  res.json({ success: true, message: "Unsubscribed successfully" });
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

const exportUserData = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('orders addresses');
  res.json(user);
});

// Alias functions for backward compatibility
const updateProfile = updateUserProfile;

module.exports = {
  authUser,
  registerUser,
  getUserProfile,
  updateProfile,
  updateUserProfile, // Export both names
  getWishlist,
  addToWishlist,
  removeFromWishlist,
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
  getRewards,
  subscribe,
  unsubscribe,
  reportProblem,
  exportUserData,
  // ✅ NEW: Add all the missing functions
  refreshToken,
  verifyEmail,
  updatePreferences,
  updateNotificationPreferences,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  getDashboardStats,
  getUserById,
  updateUser,
  deleteUser
};