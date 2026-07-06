const { body, param } = require('express-validator');

const createRazorpayOrderValidator = [
    body('amount').isNumeric().withMessage('Amount must be a number').custom(value => value > 0).withMessage('Amount must be greater than 0'),
    body('receipt').trim().notEmpty().withMessage('Receipt ID is required')
];

const verifyRazorpayPaymentValidator = [
    body('razorpay_order_id').trim().notEmpty().withMessage('Razorpay order ID is required'),
    body('razorpay_payment_id').trim().notEmpty().withMessage('Razorpay payment ID is required'),
    body('razorpay_signature').trim().notEmpty().withMessage('Razorpay signature is required')
];

const recordCodPaymentValidator = [
    param('orderId').isMongoId().withMessage('Invalid order ID'),
    body('amountReceived').isNumeric().withMessage('Amount received is required'),
    body('proof').optional().isString()
];

const requestPayoutValidator = [
    body('amount').isNumeric().withMessage('Amount must be a number').custom(value => value > 0).withMessage('Amount must be greater than 0')
];

module.exports = {
    createRazorpayOrderValidator,
    verifyRazorpayPaymentValidator,
    recordCodPaymentValidator,
    requestPayoutValidator
};
