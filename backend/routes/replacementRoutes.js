const express = require('express');
const {
    customerRequestReplacement,
    getReplacements,
    getReplacementById,
    reviewReplacement,
    assignReplacementDelivery,
    getMyReplacements,
} = require('../controllers/replacementController.js');
const router = express.Router();
const { protect, role } = require('../middleware/auth.js');
const upload = require('../utils/uploadMiddleware.js');

// Customer routes
router.post('/customer/:orderId', protect, role('customer'), upload.single('replacementPhoto'), customerRequestReplacement);
router.get('/my-requests', protect, role('customer'), getMyReplacements);

// Admin/Seller routes
router.get('/', protect, role('admin', 'seller'), getReplacements);
router.get('/:id', protect, getReplacementById);
router.put('/:id/review', protect, role('admin', 'seller'), reviewReplacement);
router.put('/:id/assign-delivery', protect, role('admin', 'seller'), assignReplacementDelivery);

module.exports = router;
