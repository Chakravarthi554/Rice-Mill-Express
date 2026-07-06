const { body } = require('express-validator');

const registerValidator = [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').trim().isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
];

const loginValidator = [
    body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').trim().notEmpty().withMessage('Password is required')
];

const firebaseLoginValidator = [
    body('idToken').trim().notEmpty().withMessage('Firebase ID token is required')
];

const verify2FAValidator = [
    body('userId').trim().notEmpty().withMessage('User ID is required'),
    body('otp').trim().notEmpty().withMessage('OTP is required')
];

const verifyOtpValidator = [
    body('userId').trim().notEmpty().withMessage('User ID is required'),
    body('otp').trim().notEmpty().withMessage('OTP is required')
];

module.exports = {
    registerValidator,
    loginValidator,
    firebaseLoginValidator,
    verify2FAValidator,
    verifyOtpValidator
};
