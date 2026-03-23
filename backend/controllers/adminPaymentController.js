const asyncHandler = require('express-async-handler');
const Payment = require('../models/Payment');
const Payout = require('../models/payoutModel');
const Order = require('../models/Order');
const User = require('../models/User');

// @desc    Get all payments (Admin)
// @route   GET /api/admin/payments
// @access  Private/Admin
const getPayments = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const query = {};
  if (req.query.status && req.query.status !== 'all') query.status = req.query.status;
  if (req.query.method && req.query.method !== 'all') query.method = req.query.method;

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
    transactions: payments,
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
  if (req.query.status && req.query.status !== 'all') query.status = req.query.status;

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
  const startOfToday = new Date(new Date().setHours(0, 0, 0, 0));
  const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const paidFilter = { $or: [{ isPaid: true }, { orderStatus: 'delivered' }] };

  const todayStats = await Order.aggregate([
    { $match: { ...paidFilter, createdAt: { $gte: startOfToday } } },
    {
      $group: {
        _id: null,
        sales: { $sum: { $ifNull: ['$finalPaidAmount', '$totalPrice'] } },
        transactions: { $sum: 1 },
        commission: { $sum: { $ifNull: ['$commissionAmount', { $multiply: ['$totalPrice', 0.15] }] } }
      }
    }
  ]);

  const weeklyStats = await Order.aggregate([
    { $match: { ...paidFilter, createdAt: { $gte: startOfWeek } } },
    {
      $group: {
        _id: null,
        sales: { $sum: { $ifNull: ['$finalPaidAmount', '$totalPrice'] } },
        commission: { $sum: { $ifNull: ['$commissionAmount', { $multiply: ['$totalPrice', 0.15] }] } }
      }
    }
  ]);

  const payoutStats = await Payout.aggregate([
    { $group: { _id: '$status', amount: { $sum: '$amount' }, count: { $sum: 1 } } }
  ]);

  const flaggedCount = await Payment.countDocuments({ isFlagged: true });

  const codSettlementStats = await Order.aggregate([
    { $match: { paymentMethod: 'cod', codCollected: true, codSettled: { $ne: true }, orderStatus: 'delivered' } },
    { $group: { _id: null, totalAmount: { $sum: "$totalPrice" }, count: { $sum: 1 } } }
  ]);

  const refundStats = await Payment.aggregate([
    { $match: { status: 'refunded' } },
    { $group: { _id: null, total: { $sum: "$amount" } } }
  ]);

  const methodDist = await Payment.aggregate([
    { $match: { createdAt: { $gte: startOfToday } } },
    { $group: { _id: "$method", totalAmount: { $sum: "$amount" }, count: { $sum: 1 } } }
  ]);

  res.json({
    success: true,
    stats: {
      today: {
        sales: todayStats[0]?.sales || 0,
        transactions: todayStats[0]?.transactions || 0,
        commission: todayStats[0]?.commission || 0
      },
      weekly: {
        sales: weeklyStats[0]?.sales || 0,
        commission: weeklyStats[0]?.commission || 0
      },
      payouts: {
        pendingAmount: payoutStats.find(p => p._id === 'pending')?.amount || 0,
        pendingCount: payoutStats.find(p => p._id === 'pending')?.count || 0,
        totalPaid: payoutStats.find(p => p._id === 'completed')?.amount || 0
      },
      flaggedPayments: flaggedCount,
      codSettlements: codSettlementStats[0] || { totalAmount: 0, count: 0 },
      paymentMethods: methodDist,
      refunds: {
        totalRefunded: refundStats[0]?.total || 0
      }
    }
  });
});

// @desc    Update payout status
// @route   POST /api/admin/payments/payout/:id/release
// @access  Private/Admin
const updatePayoutStatus = asyncHandler(async (req, res) => {
  const { status, transactionId, processingNotes } = req.body;

  const payout = await Payout.findById(req.params.id);
  if (!payout) {
    res.status(404);
    throw new Error('Payout request not found');
  }

  payout.status = status || 'completed';
  if (transactionId) payout.transactionId = transactionId;
  if (processingNotes) payout.processingNotes = processingNotes;
  payout.processedAt = new Date();
  payout.processedBy = req.user._id;

  const updatedPayout = await payout.save();

  res.json({
    success: true,
    payout: updatedPayout
  });
});

// @desc    Get COD settlements (Admin)
// @route   GET /api/admin/payments/cod-settlements
// @access  Private/Admin
const getCODSettlements = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const query = {
    paymentMethod: 'cod',
    codCollected: true,
    codSettled: { $ne: true },
    orderStatus: 'delivered'
  };

  const settlements = await Order.find(query)
    .populate('user', 'name phone')
    .populate('deliveryPartner')
    .sort({ deliveredAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Order.countDocuments(query);

  res.json({
    success: true,
    settlements,
    page,
    pages: Math.ceil(total / limit),
    total
  });
});

// @desc    Settle COD (Admin)
// @route   POST /api/admin/payments/settle-cod/:orderId
// @access  Private/Admin
const settleCOD = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (order.paymentMethod !== 'cod' || !order.codCollected) {
    res.status(400);
    throw new Error('Order is not a collected COD order');
  }

  if (order.codSettled) {
    res.status(400);
    throw new Error('COD already settled for this order');
  }

  order.codSettled = true;
  order.codSettledAt = new Date();
  order.codSettledBy = req.user._id;

  await order.save();

  res.json({
    success: true,
    message: 'COD payment settled successfully',
    order
  });
});

module.exports = {
  getPayments,
  getPayoutRequests,
  getPaymentStats,
  updatePayoutStatus,
  getCODSettlements,
  settleCOD
};