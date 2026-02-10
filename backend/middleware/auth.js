const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const { auth: firebaseAuth } = require('../config/firebase');

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
    if (req.user.role === 'admin' || req.user.role === 'super_admin') {
      console.log(`✅ Authorize Middleware: Admin granted access`);
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

    console.log(`✅ Authorize Middleware: User granted access`);
    next();
  };
};

const protect = asyncHandler(async (req, res, next) => {
  let token;

  console.log('🔄 Auth Middleware: Checking for token...');

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
    } catch (error) {
      console.error('Auth header parse error', error);
    }
  } else if (req.query && req.query.token) {
    // Allow token via query param for downloads
    token = req.query.token;
    console.log('🔄 Auth Middleware: Token found in query params');
  }

  if (token) {
    try {
      // Validate token
      console.log('🔄 Auth Middleware: Token found (source: ' + (req.query.token ? 'query' : 'header') + ')');

      let decoded;
      let user;

      // 1. Try Firebase verification FIRST
      try {
        decoded = await firebaseAuth.verifyIdToken(token);
        console.log('✅ Auth Middleware: Firebase Token verified for UID:', decoded.uid);

        // Prepare lookup criteria
        const lookupCriteria = [{ firebaseUid: decoded.uid }];
        if (decoded.email) lookupCriteria.push({ email: decoded.email });

        // Add sanitised phone lookup if available
        let sanitisedPhone = '';
        if (decoded.phone_number) {
          sanitisedPhone = decoded.phone_number.replace(/\D/g, '').slice(-10);
          if (sanitisedPhone.length === 10) {
            lookupCriteria.push({ phone: sanitisedPhone });
          }
        }

        // Find user by Firebase UID, Email, OR Phone
        user = await User.findOne({ $or: lookupCriteria }).select('-password');

        // Link new Firebase UID to existing user if needed (e.g. first time Phone login for Email user)
        if (user && !user.firebaseUid) {
          user.firebaseUid = decoded.uid;
          await user.save();
        } else if (user && user.firebaseUid !== decoded.uid) {
          // Edge case: User has one UID (e.g. Email) but logged in with another (Phone). 
          // We generally trust the logged-in session, but we shouldn't overwrite the main UID lightly 
          // unless we support multiple UIDs (linkedAccounts). 
          // For now, logging this event is sufficient, or we rely on the fact we FOUND the user.
          console.log(`ℹ️ Auth Middleware: Secondary login method used (UID: ${decoded.uid}) for user ${user._id}`);
        }

        // ✅ AUTO-PROVISION: If user not found in MongoDB but valid in Firebase
        if (!user) {
          console.log('🆕 Auth Middleware: Provisioning new MongoDB user for Firebase UID:', decoded.uid);

          // Sanitise phone number for MongoDB (expecting 10 digits)
          let sanitisedPhone = decoded.phone_number || '';
          if (sanitisedPhone) {
            sanitisedPhone = sanitisedPhone.replace(/\D/g, '').slice(-10);
          }

          user = await User.create({
            name: decoded.name || decoded.email?.split('@')[0] || 'User',
            email: decoded.email,
            phone: sanitisedPhone || undefined,
            firebaseUid: decoded.uid,
            role: 'customer',
            isVerified: true
          });
        }

        // ⚠️ TEMPORARILY DISABLED: Email verification check (to allow testing)
        // if (['seller', 'customer'].includes(user.role) && decoded.email && !decoded.email_verified) {
        //   console.log(`❌ Auth Middleware: ${user.role} email not verified in Firebase:`, user.email);
        //   res.status(403).json({
        //     message: `Email verification is mandatory for ${user.role}s. Please verify your email via the link sent to your Gmail.`,
        //     code: 'EMAIL_NOT_VERIFIED',
        //     email: user.email
        //   });
        //   return; // Stop execution
        // }

      } catch (err) {
        // Distinguish between Firebase verification errors and DB errors
        const isFirebaseError = err.code && err.code.startsWith('auth/');

        if (isFirebaseError) {
          console.log('🔵 Auth Middleware: Firebase verification failed, trying legacy JWT...');
          try {
            // 2. Fallback to legacy JWT verification ONLY if Firebase check triggered a real auth error
            decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('✅ Auth Middleware: Legacy Token verified for user:', decoded.id);
            user = await User.findById(decoded.id).select('-password');
          } catch (jwtErr) {
            // If legacy also fails, re-throw the original Firebase error for clarity
            throw new Error(`Auth failed: ${err.message}`);
          }
        } else {
          // If it's a DB error (like validation), re-throw it
          throw err;
        }
      }

      if (!user) {
        console.log('❌ Auth Middleware: User not found in database and auto-provisioning failed');
        res.status(401);
        throw new Error('Not authorized, user profile missing');
      }

      req.user = user;
      console.log('✅ Auth Middleware: Authenticated User:', user.email || user.phone, 'Role:', user.role);
      next();
    } catch (error) {
      console.log('❌ Auth Middleware: Token verification failed:', error.message);
      res.status(401);
      throw new Error('Not authorized, token failed: ' + error.message);
    }
  }

  if (!token) {
    console.log('❌ Auth Middleware: No token found');
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});

// Optional auth for public routes that might need user context
const optionalAuth = asyncHandler(async (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      let decoded;
      let user;

      try {
        decoded = await firebaseAuth.verifyIdToken(token);

        const lookupCriteria = [{ firebaseUid: decoded.uid }];
        if (decoded.email) lookupCriteria.push({ email: decoded.email });
        if (decoded.phone_number) {
          const p = decoded.phone_number.replace(/\D/g, '').slice(-10);
          if (p.length === 10) lookupCriteria.push({ phone: p });
        }

        user = await User.findOne({ $or: lookupCriteria });

        if (!user) {
          let sanitisedPhone = decoded.phone_number || '';
          if (sanitisedPhone) {
            sanitisedPhone = sanitisedPhone.replace(/\D/g, '').slice(-10);
          }
          user = await User.create({
            name: decoded.name || decoded.email?.split('@')[0] || 'User',
            email: decoded.email,
            phone: sanitisedPhone || undefined,
            firebaseUid: decoded.uid,
            role: 'customer',
            isVerified: true
          });
        }
      } catch (err) {
        if (err.code && err.code.startsWith('auth/')) {
          try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
            user = await User.findById(decoded.id);
          } catch (jwtErr) { }
        }
      }

      if (user) req.user = user;
    } catch (error) {
      // Silent fail
    }
  }
  next();
});

const admin = (req, res, next) => {
  if (!req.user || !['admin', 'super_admin'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

const refreshToken = asyncHandler(async (req, res) => {
  res.status(410).json({ message: 'Legacy token refresh is deprecated. Use Firebase autoscale tokens.' });
});

const kycVerified = (req, res, next) => {
  if (req.user.role === 'seller' && req.user.kycStatus !== 'approved') {
    return res.status(403).json({ message: 'KYC approval required' });
  }
  next();
};

const isVerified = (req, res, next) => {
  if (!req.user.isVerified) {
    return res.status(403).json({ message: 'Account verification required' });
  }
  next();
};

const sellerOrOrderOwner = asyncHandler(async (req, res, next) => {
  const Order = require('../models/Order');
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });

  if (req.user.role === 'admin' ||
    order.seller.toString() === req.user._id.toString() ||
    order.user.toString() === req.user._id.toString()) {
    req.order = order;
    return next();
  }
  return res.status(403).json({ message: 'Not authorized' });
});

module.exports = {
  protect,
  authorize,
  admin,
  role: authorize,
  kycVerified,
  isVerified,
  sellerOrOrderOwner,
  optionalAuth,
  refreshToken
};