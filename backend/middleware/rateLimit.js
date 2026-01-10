const rateLimit = require('express-rate-limit');

/**
 * Rate limiter for social actions (comments, likes, ratings, shares)
 * Limits a user to 10 social actions per minute
 */
const socialRateLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // Limit each IP or User ID to 10 requests per windowMs
    keyGenerator: (req) => {
        // If user is authenticated, use their ID as the key, otherwise use IP
        return req.user ? req.user._id.toString() : req.ip;
    },
    message: {
        success: false,
        message: 'Too many social actions. Please wait a minute before trying again.'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    validate: { defaultKeys: false } // Fix for IPv6 key generator error
});

/**
 * More strict limiter for sharing and reporting
 * Limits to 5 actions per 5 minutes
 */
const strictSocialLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 5,
    keyGenerator: (req) => {
        return req.user ? req.user._id.toString() : req.ip;
    },
    message: {
        success: false,
        message: 'Action limit reached. Please wait a few minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    validate: { defaultKeys: false } // Fix for IPv6 key generator error
});

/**
 * General customer API rate limiter
 * Limits to 100 requests per 15 minutes
 */
const customerLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again after 15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    validate: { defaultKeys: false } // Fix for IPv6 key generator error
});

module.exports = {
    socialRateLimiter,
    strictSocialLimiter,
    customerLimiter
};
