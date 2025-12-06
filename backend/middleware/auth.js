const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

// ✅ FIXED: Corrected authorize function name
const authorize = (...roles) => {
  return (req, res, next) => {
    console.log('🔐 Authorize Middleware: Checking authorization for role:', req.user?.role);
    console.log('🔐 Authorize Middleware: Allowed roles:', roles);
    
    if (!req.user) {
      console.log('❌ Authorize Middleware: No user found in request');
      return res.status(401).json({ 
        message: 'Not authorized, no user',
        code: 'AUTH_REQUIRED'
      });
    }

    // Allow admin to access any route
    if (req.user.role === 'admin') {
      console.log(`✅ Authorize Middleware: Admin ${req.user._id} granted access to ${roles.join(', ')} routes`);
      return next();
    }

    if (!roles.includes(req.user.role)) {
      console.log(`❌ Authorize Middleware: User role not authorized. User role: ${req.user.role}, Allowed roles: ${roles}`);
      return res.status(403).json({
        message: `User role '${req.user.role}' is not authorized. Required roles: ${roles.join(', ')}`,
        userRole: req.user.role,
        requiredRoles: roles,
        code: 'ROLE_ACCESS_DENIED'
      });
    }

    console.log(`✅ Authorize Middleware: User ${req.user._id} with role ${req.user.role} granted access`);
    next();
  };
};

const protect = asyncHandler(async (req, res, next) => {
  let token;

  console.log('🔄 Auth Middleware: Checking for token...');

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];
      console.log('🔄 Auth Middleware: Token found in Authorization header');

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('✅ Auth Middleware: Token verified for user:', decoded.id);

      // Get user from the token
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
        console.log('❌ Auth Middleware: User not found');
        res.status(401);
        throw new Error('Not authorized, user not found');
      }

      console.log('✅ Auth Middleware: User authenticated - ID:', req.user._id, ', Role:', req.user.role);
      next();
    } catch (error) {
      console.log('❌ Auth Middleware: Token verification failed:', error.message);
      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  }

  if (!token) {
    console.log('❌ Auth Middleware: No token found');
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});

// ✅ ADD THIS: Token refresh function
const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({
      message: 'Refresh token required',
      code: 'REFRESH_TOKEN_REQUIRED'
    });
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    
    // Find user
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Generate new tokens
    const accessToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '30d' }
    );

    const newRefreshToken = jwt.sign(
      { id: user._id },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
    );

    console.log(`✅ Token refresh successful for user: ${user._id}`);

    res.json({
      success: true,
      accessToken,
      refreshToken: newRefreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('❌ Token refresh failed:', error.message);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        message: 'Refresh token expired',
        code: 'REFRESH_TOKEN_EXPIRED'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        message: 'Invalid refresh token',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }
    
    return res.status(401).json({
      message: 'Token refresh failed',
      code: 'REFRESH_FAILED'
    });
  }
});

const admin = (req, res, next) => {
  if (!req.user) {
    console.log('❌ Admin Middleware: req.user is missing!');
    return res.status(401).json({ 
      message: 'Not authenticated',
      code: 'AUTH_REQUIRED'
    });
  }
  
  if (!['admin', 'super_admin'].includes(req.user.role)) {
    console.log(`❌ Admin Middleware: Access denied - User ${req.user._id} with role ${req.user.role} tried to access admin route`);
    return res.status(403).json({ 
      message: 'Admin access required',
      userRole: req.user.role,
      requiredRoles: ['admin', 'super_admin'],
      code: 'ADMIN_ACCESS_REQUIRED'
    });
  }
  
  console.log(`✅ Admin Middleware: Access granted for admin ${req.user._id}`);
  next();
};

// Keep role function for backward compatibility
const role = (...roles) => {
  return authorize(...roles);
};

const kycVerified = asyncHandler(async (req, res, next) => {
  if (req.user.role === 'seller' && req.user.kycStatus !== 'approved') {
    return res.status(403).json({
      message: 'KYC verification required for sellers.',
      kycStatus: req.user.kycStatus,
      code: 'KYC_REQUIRED'
    });
  }
  next();
});

const isVerified = asyncHandler(async (req, res, next) => {
  if (!req.user.isVerified) {
    return res.status(403).json({
      message: 'Account verification required.',
      requiresOtpVerification: true,
      userId: req.user._id,
      code: 'VERIFICATION_REQUIRED'
    });
  }
  next();
});

const sellerOrOrderOwner = asyncHandler(async (req, res, next) => {
  const orderId = req.params.id;
  const Order = require('../models/Order');
  const order = await Order.findById(orderId).populate('seller', 'name businessDetails.businessName phone businessDetails.address');
  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }
  if (req.user.role === 'admin') {
    req.order = order;
    return next();
  }
  const isSeller = order.seller?._id.toString() === req.user._id.toString();
  const isBuyer = order.user?._id.toString() === req.user._id.toString();
  if (!isSeller && !isBuyer) {
    return res.status(403).json({ message: 'Not authorized to access this order' });
  }
  req.order = order;
  next();
});

// Enhanced authentication check for socket and API consistency
const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (user) {
        req.user = user;
        console.log(`✅ Optional Auth: User found - ID: ${user._id}, Role: ${user.role}`);
      }
    } catch (error) {
      // Silent fail for optional auth
      console.log('🔵 Optional Auth: Token verification failed, continuing without user...');
    }
  }
  
  next();
});

// ✅ FIXED: Export the authorize function with correct name
module.exports = { 
  protect, 
  authorize, // ✅ CORRECTED: This was the main issue
  admin, 
  role, 
  kycVerified, 
  isVerified, 
  sellerOrOrderOwner,
  optionalAuth,
  refreshToken
};