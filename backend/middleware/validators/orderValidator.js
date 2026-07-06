const { body, param } = require('express-validator');

const createOrderValidator = [
    body('orderItems').isArray({ min: 1 }).withMessage('No order items'),
    body('shippingAddressId').trim().notEmpty().withMessage('Shipping address is required').isMongoId().withMessage('Invalid shipping address ID'),
    body('paymentMethod').trim().notEmpty().withMessage('Payment method is required').isIn(['cod', 'razorpay', 'online']).withMessage('Invalid payment method')
];

const updateOrderStatusValidator = [
    param('id').isMongoId().withMessage('Invalid order ID'),
    body('status').trim().notEmpty().withMessage('Status is required')
];

const cancelOrderValidator = [
    param('id').isMongoId().withMessage('Invalid order ID'),
    body('cancellationReason').trim().notEmpty().withMessage('Cancellation reason is required')
];

const deliverOrderValidator = [
    param('id').isMongoId().withMessage('Invalid order ID')
];

module.exports = {
    createOrderValidator,
    updateOrderStatusValidator,
    cancelOrderValidator,
    deliverOrderValidator
};
