const express = require('express');
const router = express.Router();
const { protect, role } = require('../middleware/auth');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');

const {
    getPayments,
    getPayoutRequests,
    getPaymentStats,
    updatePayoutStatus,
    getCODSettlements,
    settleCOD
} = require('../controllers/adminPaymentController');

// @desc    Get all payments (Admin)
// @route   GET /api/admin/payments/transactions
// @access  Private/Admin
router.get('/transactions', protect, role('admin'), getPayments);
router.get('/', protect, role('admin'), getPayments); // Alias

// @desc    Get payout requests (Admin)
// @route   GET /api/admin/payments/payouts
// @access  Private/Admin
router.get('/payouts', protect, role('admin'), getPayoutRequests);

// @desc    Get payment statistics
// @route   GET /api/admin/payments/stats
// @access  Private/Admin
router.get('/stats', protect, role('admin'), getPaymentStats);

// @desc    Update payout status / Release payout
// @route   POST /api/admin/payments/payout/:id/release
// @access  Private/Admin
router.post('/payout/:id/release', protect, role('admin'), updatePayoutStatus);
router.put('/payouts/:id', protect, role('admin'), updatePayoutStatus); // Alias

// @desc    Process Refund
// @route   POST /api/admin/payments/refund/:paymentId
// @access  Private/Admin
router.post('/refund/:paymentId', protect, role('admin'), (req, res) => res.status(200).json({ success: true, message: 'Refund initiated. This is a placeholder since full PG integration for refunds is pending.' }));

// @desc    Get COD settlements (Admin)
// @route   GET /api/admin/payments/cod-settlements
// @access  Private/Admin
router.get('/cod-settlements', protect, role('admin'), getCODSettlements);

// @desc    Settle COD (Admin)
// @route   POST /api/admin/payments/settle-cod/:orderId
// @access  Private/Admin
router.post('/settle-cod/:orderId', protect, role('admin'), settleCOD);

module.exports = router;
