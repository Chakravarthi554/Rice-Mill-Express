const express = require('express');
const router = express.Router();
const { protect, role } = require('../middleware/auth');
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');

const {
    getPayments,
    getPayoutRequests,
    getPaymentStats,
    updatePayoutStatus
} = require('../controllers/adminPaymentController');

// @desc    Get all payments (Admin)
// @route   GET /api/admin/payments
// @access  Private/Admin
router.get('/', protect, role('admin'), getPayments);

// @desc    Get payout requests (Admin)
// @route   GET /api/admin/payments/payouts
// @access  Private/Admin
router.get('/payouts', protect, role('admin'), getPayoutRequests);

// @desc    Get payment statistics
// @route   GET /api/admin/payments/stats
// @access  Private/Admin
router.get('/stats', protect, role('admin'), getPaymentStats);

// @desc    Update payout status
// @route   PUT /api/admin/payments/payouts/:id
// @access  Private/Admin
router.put('/payouts/:id', protect, role('admin'), updatePayoutStatus);

module.exports = router;
