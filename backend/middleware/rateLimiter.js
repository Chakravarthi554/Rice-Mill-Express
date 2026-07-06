const rateLimit = require('express-rate-limit');

// Auth routes: Strict limits to prevent brute-force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // 15 attempts per window
  message: {
    success: false,
    message: 'Too many attempts. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use X-Forwarded-For for proxied requests, fallback to socket address
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress;
  },
});

// Login-specific: Even stricter
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Only 5 login attempts per 15 minutes
  message: {
    success: false,
    message: 'Too many login attempts. Your account is temporarily locked. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Rate limit by IP + email combo to prevent distributed attacks
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress;
    const email = req.body?.email || 'unknown';
    return `${ip}:${email}`;
  },
});

// Registration: Prevent spam account creation
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registrations per hour per IP
  message: {
    success: false,
    message: 'Too many accounts created from this IP. Please try again after an hour.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Payment routes: Moderate limits
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 payment attempts per 15 minutes
  message: {
    success: false,
    message: 'Too many payment requests. Please try again shortly.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// General API: Generous but protective
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 requests per 15 minutes
  message: {
    success: false,
    message: 'Too many requests. Please slow down.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Password reset: Prevent enumeration
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 reset requests per hour
  message: {
    success: false,
    message: 'Too many password reset requests. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  authLimiter,
  loginLimiter,
  registerLimiter,
  paymentLimiter,
  apiLimiter,
  passwordResetLimiter,
};
