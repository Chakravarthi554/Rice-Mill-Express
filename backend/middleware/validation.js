const { body, validationResult } = require('express-validator');
const validateBulkOrder = [
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.product').isMongoId().withMessage('Invalid product ID'),
  body('items.*.quantity').isInt({ min: 50 }).withMessage('Minimum quantity is 50'),
  body('shippingAddress.street').notEmpty().withMessage('Street address is required'),
  body('shippingAddress.city').notEmpty().withMessage('City is required'),
  body('shippingAddress.state').notEmpty().withMessage('State is required'),
  body('shippingAddress.pinCode').isPostalCode('IN').withMessage('Invalid PIN code'),
  body('paymentTerms').isIn(['advance', 'credit', 'cod']).withMessage('Invalid payment terms'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];
module.exports = { validateBulkOrder };