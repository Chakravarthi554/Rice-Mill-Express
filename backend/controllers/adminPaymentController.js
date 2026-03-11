const asyncHandler = require('express-async-handler');
const Payment = require('../models/Payment');
const Payout = require('../models/payoutModel');
const Order = require('../models/Order');

// @desc    Get all payments (Admin)
// @route   GET /api/admin/payments
// @access  Private/Admin
const getPayments = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const query = {};
  if (req.query.status) query.status = req.query.status;
  if (req.query.method) query.method = req.query.method;

  const payments = await Payment.find(query)
    .populate('user', 'name email')
    .populate('seller', 'name businessDetails')
    .populate('order', 'orderStatus')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Payment.countDocuments(query);

  res.json({
    success: true,
    payments,
    page,
    pages: Math.ceil(total / limit),
    total
  });
});

// @desc    Get payout requests (Admin)
// @route   GET /api/admin/payments/payouts
// @access  Private/Admin
const getPayoutRequests = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const query = {};
  if (req.query.status) query.status = req.query.status;

  const payouts = await Payout.find(query)
    .populate('seller', 'name email businessDetails')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Payout.countDocuments(query);

  res.json({
    success: true,
    payouts,
    page,
    pages: Math.ceil(total / limit),
    total
  });
});

// @desc    Get payment statistics
// @route   GET /api/admin/payments/stats
// @access  Private/Admin
const getPaymentStats = asyncHandler(async (req, res) => {
  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [stats] = await Payment.aggregate([
    {
      $facet: {
        revenue: [
          { $match: { status: 'completed' } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ],
        pendingPayouts: [
          { $match: { payoutStatus: 'pending', status: 'completed' } },
          { $group: { _id: null, total: { $sum: '$sellerPayoutAmount' } } }
        ],
        recentCount: [
          { $match: { createdAt: { $gte: last24h } } },
          { $count: 'count' }
        ]
      }
    }
  ]);

  const totalRevenue = stats.revenue[0]?.total || 0;
  const pendingSettlements = stats.pendingPayouts[0]?.total || 0;
  const recentTransactions = stats.recentCount[0]?.count || 0;

  res.json({
    success: true,
    data: {
      totalRevenue,
      pendingSettlements,
      recentTransactions
    }
  });
});

// @desc    Update payout status
// @route   PUT /api/admin/payments/payouts/:id
// @access  Private/Admin
const updatePayoutStatus = asyncHandler(async (req, res) => {
  const { status, transactionId, processingNotes } = req.body;

  const payout = await Payout.findById(req.params.id);
  if (!payout) {
    res.status(404);
    throw new Error('Payout request not found');
  }

  payout.status = status || payout.status;
  payout.transactionId = transactionId || payout.transactionId;
  payout.processingNotes = processingNotes || payout.processingNotes;
  payout.processedAt = new Date();
  payout.processedBy = req.user._id;

  const updatedPayout = await payout.save();

  // If payout is completed, update the associated payments if needed
  // (This part depends on whether we track individual payment settlements)

  res.json({
    success: true,
    payout: updatedPayout
  });
});

module.exports = {
  getPayments,
  getPayoutRequests,
  getPaymentStats,
  updatePayoutStatus
};