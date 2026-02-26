const asyncHandler = require('express-async-handler');
const Payment = require('../models/Payment');
const Order = require('../models/Order');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Payout = require('../models/payoutModel');
const WithdrawalRequest = require('../models/WithdrawalRequest');
const WalletTransaction = require('../models/WalletTransaction');

/**
 * ========================================
 * ADMIN PAYMENT & PAYOUT CONTROLLER - FULLY UPDATED
 * ========================================
 */

/**
 * @desc Get enhanced admin dashboard payment statistics
 * @route GET /api/admin/payments/stats-dashboard
 * @access Private/Admin
 */
exports.getAdminPaymentStats = asyncHandler(async (req, res) => {
  try {
    console.log('Fetching admin payment statistics...');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    const lastMonth = new Date(today);
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const todayStats = await Payment.aggregate([
      { $match: { createdAt: { $gte: today }, status: 'completed' } },
      {
        $group: {
          _id: null,
          sales: { $sum: '$amount' },
          commission: { $sum: '$commissionAmount' },
          transactions: { $sum: 1 }
        }
      }
    ]);

    const pendingPayouts = await Payout.aggregate([
      { $match: { status: 'pending' } },
      {
        $group: {
          _id: null,
          pendingAmount: { $sum: '$amount' },
          pendingCount: { $sum: 1 }
        }
      }
    ]);

    const weeklyStats = await Payment.aggregate([
      { $match: { createdAt: { $gte: lastWeek }, status: 'completed' } },
      {
        $group: {
          _id: null,
          sales: { $sum: '$amount' },
          commission: { $sum: '$commissionAmount' }
        }
      }
    ]);

    const paymentMethods = await Payment.aggregate([
      { $match: { createdAt: { $gte: lastMonth }, status: 'completed' } },
      {
        $group: {
          _id: '$method',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    const refundStats = await Payment.aggregate([
      {
        $match: {
          status: { $in: ['refunded', 'partially_refunded'] },
          createdAt: { $gte: lastMonth }
        }
      },
      {
        $group: {
          _id: null,
          totalRefunded: { $sum: '$refundAmount' },
          refundCount: { $sum: 1 }
        }
      }
    ]);

    const flaggedPayments = await Payment.countDocuments({ isFlagged: true });

    res.json({
      success: true,
      stats: {
        today: {
          sales: todayStats[0]?.sales || 0,
          commission: todayStats[0]?.commission || 0,
          transactions: todayStats[0]?.transactions || 0
        },
        weekly: {
          sales: weeklyStats[0]?.sales || 0,
          commission: weeklyStats[0]?.commission || 0
        },
        payouts: {
          pendingAmount: pendingPayouts[0]?.pendingAmount || 0,
          pendingCount: pendingPayouts[0]?.pendingCount || 0
        },
        refunds: {
          totalRefunded: refundStats[0]?.totalRefunded || 0,
          refundCount: refundStats[0]?.refundCount || 0
        },
        paymentMethods,
        flaggedPayments
      }
    });
  } catch (error) {
    console.error('Get admin payment stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment statistics'
    });
  }
});

/**
 * @desc Get all transactions for admin
 * @route GET /api/admin/payments/transactions
 * @access Private/Admin
 */
exports.getAdminTransactions = asyncHandler(async (req, res) => {
  try {
    const {
      status,
      method,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const query = {};
    if (status && status !== 'all') query.status = status;
    if (method && method !== 'all') query.method = method;

    const payments = await Payment.find(query)
      .populate('user', 'name email phone')
      .populate('seller', 'name email businessName')
      .populate('order', 'orderNumber')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    const total = await Payment.countDocuments(query);

    res.json({
      success: true,
      payments,
      total,
      totalPages: Math.ceil(total / limit),
      page: Number(page),
      limit: Number(limit)
    });
  } catch (error) {
    console.error('Get admin transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions'
    });
  }
});

/**
 * @desc Get all payouts for admin
 * @route GET /api/admin/payouts
 * @access Private/Admin
 */
exports.getPayoutsList = asyncHandler(async (req, res) => {
  try {
    const {
      status,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
    const query = {};
    if (status && status !== 'all') query.status = status;

    const payouts = await Payout.find(query)
      .populate('seller', 'name email businessName phone')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    const total = await Payout.countDocuments(query);

    const summary = await Payout.aggregate([
      {
        $group: {
          _id: '$status',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      payouts,
      total,
      totalPages: Math.ceil(total / limit),
      page: Number(page),
      limit: Number(limit),
      summary
    });
  } catch (error) {
    console.error('Get payouts list error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payouts'
    });
  }
});

/**
 * @desc Process refund (full or partial)
 * @route POST /api/admin/payments/:paymentId/refund
 * @access Private/Admin
 */
exports.processRefund = asyncHandler(async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { amount, reason, notes } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid refund amount is required'
      });
    }

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (amount > payment.amount) {
      return res.status(400).json({
        success: false,
        message: `Refund amount cannot exceed original payment amount of ₹${payment.amount}`
      });
    }

    payment.status = amount === payment.amount ? 'refunded' : 'partially_refunded';
    payment.refundAmount = amount;
    payment.refundReason = reason || 'Admin initiated refund';
    payment.refundNotes = notes;
    payment.refundDate = new Date();
    payment.updatedAt = new Date();
    await payment.save();

    if (payment.order) {
      await Order.findByIdAndUpdate(payment.order, {
        paymentStatus: payment.status,
        refundAmount: amount,
        refundReason: reason
      });
    }

    if (payment.user) {
      await Notification.create({
        user: payment.user,
        type: 'PAYMENT_REFUNDED',
        title: 'Payment Refunded',
        message: `Your payment of ₹${amount} has been refunded. Reason: ${reason || 'Admin initiated'}`,
        relatedEntity: payment._id,
        entityModel: 'Payment'
      });
    }

    res.json({
      success: true,
      message: `Refund of ₹${amount} processed successfully`,
      payment
    });
  } catch (error) {
    console.error('Process refund error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process refund'
    });
  }
});

/**
 * @desc Release pending payout
 * @route POST /api/admin/payouts/:payoutId/release
 * @access Private/Admin
 */
exports.releasePayout = asyncHandler(async (req, res) => {
  try {
    const { payoutId } = req.params;
    const { notes } = req.body;

    const payout = await Payout.findById(payoutId);
    if (!payout) {
      return res.status(404).json({
        success: false,
        message: 'Payout not found'
      });
    }

    if (payout.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Payout cannot be released from current status: ${payout.status}`
      });
    }

    payout.status = 'completed';
    payout.completedAt = new Date();
    payout.notes = notes || 'Payout released by admin';
    payout.updatedAt = new Date();
    await payout.save();

    await Notification.create({
      user: payout.seller,
      type: 'PAYOUT_COMPLETED',
      title: 'Payout Released',
      message: `Payout of ₹${payout.amount} has been released to your bank account`,
      relatedEntity: payout._id,
      entityModel: 'Payout'
    });

    res.json({
      success: true,
      message: 'Payout released successfully',
      payout
    });
  } catch (error) {
    console.error('Release payout error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to release payout'
    });
  }
});

/**
 * @desc Flag or unflag payment
 * @route PUT /api/admin/payments/:paymentId/flag
 * @access Private/Admin
 */
exports.flagPayment = asyncHandler(async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { isFlagged, flagReason, adminNotes } = req.body;

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    payment.isFlagged = isFlagged !== undefined ? isFlagged : !payment.isFlagged;
    if (flagReason) payment.flagReason = flagReason;
    if (adminNotes) payment.adminNotes = adminNotes;
    payment.updatedAt = new Date();
    await payment.save();

    res.json({
      success: true,
      message: `Payment ${payment.isFlagged ? 'flagged' : 'unflagged'} successfully`,
      payment
    });
  } catch (error) {
    console.error('Flag payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update payment flag status'
    });
  }
});

/**
 * @desc Export payments or payouts as CSV
 * @route GET /api/admin/payments/export?type=payments&payouts&startDate=&endDate=
 * @access Private/Admin
 */
exports.exportPaymentReport = asyncHandler(async (req, res) => {
  try {
    const { type = 'payments', startDate, endDate } = req.query;
    let csvData = '';
    let filename = '';

    const query = {};
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    if (type === 'payments') {
      const payments = await Payment.find(query)
        .populate('user', 'name email')
        .populate('seller', 'name businessName')
        .populate('order', 'orderNumber')
        .sort('createdAt');

      csvData = 'Payment ID,Order Number,User,Seller,Amount,Commission,Method,Status,Created At\n';
      payments.forEach(p => {
        csvData += `${p._id},${p.order?.orderNumber || 'N/A'},${p.user?.name || 'N/A'},${p.seller?.businessName || p.seller?.name || 'N/A'},${p.amount},${p.commissionAmount || 0},${p.method},${p.status},${p.createdAt}\n`;
      });
      filename = `payments-report-${new Date().toISOString().split('T')[0]}.csv`;
    } else if (type === 'payouts') {
      const payouts = await Payout.find(query)
        .populate('seller', 'name businessName')
        .sort('createdAt');

      csvData = 'Payout ID,Seller,Amount,Status,Bank Account,IFSC,Requested At\n';
      payouts.forEach(p => {
        csvData += `${p._id},${p.seller?.businessName || p.seller?.name || 'N/A'},${p.amount},${p.status},${p.bankDetailsSnapshot?.accountNumber || 'N/A'},${p.bankDetailsSnapshot?.ifsc || 'N/A'},${p.createdAt}\n`;
      });
      filename = `payouts-report-${new Date().toISOString().split('T')[0]}.csv`;
    } else {
      return res.status(400).json({ success: false, message: 'Invalid report type' });
    }

    res.header('Content-Type', 'text/csv');
    res.attachment(filename);
    res.send(csvData);
  } catch (error) {
    console.error('Export payment report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export payment report'
    });
  }
});

/**
 * @desc Get seller payment & payout history
 * @route GET /api/admin/sellers/:sellerId/payments
 * @access Private/Admin
 */
exports.getSellerPaymentHistory = asyncHandler(async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const seller = await User.findById(sellerId);
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }

    const payments = await Payment.find({ seller: sellerId })
      .populate('user', 'name email')
      .populate('order', 'orderNumber')
      .sort('-createdAt')
      .skip(skip)
      .limit(Number(limit));

    const total = await Payment.countDocuments({ seller: sellerId });

    const payouts = await Payout.find({ seller: sellerId })
      .sort('-createdAt')
      .limit(5);

    const summary = await Payment.aggregate([
      { $match: { seller: sellerId, status: 'completed' } },
      {
        $group: {
          _id: null,
          totalSales: { $sum: '$amount' },
          totalCommission: { $sum: '$commissionAmount' },
          totalSellerEarnings: { $sum: '$sellerPayoutAmount' },
          transactionCount: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      seller: {
        _id: seller._id,
        name: seller.name,
        businessName: seller.businessDetails?.businessName,
        email: seller.email,
        phone: seller.phone
      },
      payments,
      payouts,
      summary: summary[0] || {
        totalSales: 0,
        totalCommission: 0,
        totalSellerEarnings: 0,
        transactionCount: 0
      },
      total,
      totalPages: Math.ceil(total / limit),
      page: Number(page),
      limit: Number(limit)
    });
  } catch (error) {
    console.error('Get seller payment history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch seller payment history'
    });
  }
});

/**
 * ========================================
 * LEGACY / EXISTING FUNCTIONS (FULLY INCLUDED)
 * ========================================
 */

/**
 * @desc Get payment statistics for admin dashboard
 * @route GET /api/admin/payments/stats
 * @access Private/Admin
 */
exports.getPaymentStats = asyncHandler(async (req, res) => {
  try {
    const totalStats = await Payment.aggregate([
      {
        $group: {
          _id: null,
          totalPayments: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          totalCommission: { $sum: '$commissionAmount' },
          totalSellerPayout: { $sum: '$sellerPayoutAmount' }
        }
      }
    ]);

    const statusStats = await Payment.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          amount: { $sum: '$amount' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const methodStats = await Payment.aggregate([
      {
        $group: {
          _id: '$method',
          count: { $sum: 1 },
          amount: { $sum: '$amount' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const recentPayments = await Payment.find()
      .populate('user', 'name email')
      .populate('seller', 'name email businessName')
      .populate('order', 'orderNumber')
      .sort('-createdAt')
      .limit(10);

    const pendingPayouts = await Payment.countDocuments({
      payoutStatus: 'pending',
      sellerPayoutAmount: { $gt: 0 }
    });

    res.json({
      success: true,
      stats: {
        ...totalStats[0],
        byStatus: statusStats,
        byMethod: methodStats,
        pendingPayouts,
        recentPayments
      }
    });
  } catch (error) {
    console.error('Get payment stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment statistics'
    });
  }
});

/**
 * @desc Get all payments with filters
 * @route GET /api/admin/payments
 * @access Private/Admin
 */
exports.getPayments = asyncHandler(async (req, res) => {
  try {
    const {
      status,
      method,
      payoutStatus,
      startDate,
      endDate,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const query = {};
    if (status && status !== 'all') query.status = status;
    if (method && method !== 'all') query.method = method;
    if (payoutStatus && payoutStatus !== 'all') query.payoutStatus = payoutStatus;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const payments = await Payment.find(query)
      .populate('user', 'name email phone')
      .populate('seller', 'name email phone businessName')
      .populate('order', 'orderNumber orderStatus')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    const total = await Payment.countDocuments(query);

    const summary = await Payment.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          totalCommission: { $sum: '$commissionAmount' },
          totalSellerPayout: { $sum: '$sellerPayoutAmount' }
        }
      }
    ]);

    res.json({
      success: true,
      payments,
      summary: summary[0] || {
        totalAmount: 0,
        totalCommission: 0,
        totalSellerPayout: 0
      },
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payments'
    });
  }
});

/**
 * @desc Get single payment by ID
 * @route GET /api/admin/payments/:id
 * @access Private/Admin
 */
exports.getPaymentById = asyncHandler(async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('user', 'name email phone address')
      .populate('seller', 'name email phone businessName address bankDetails')
      .populate('order', 'orderNumber orderItems shippingAddress');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    let orderDetails = null;
    if (payment.order) {
      orderDetails = await Order.findById(payment.order)
        .populate('user', 'name email')
        .populate('seller', 'name businessName')
        .populate('orderItems.product', 'name price');
    }

    res.json({
      success: true,
      payment,
      order: orderDetails
    });
  } catch (error) {
    console.error('Get payment by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment details'
    });
  }
});

/**
 * @desc Update payment status
 * @route PUT /api/admin/payments/:id/status
 * @access Private/Admin
 */
exports.updatePaymentStatus = asyncHandler(async (req, res) => {
  try {
    const { status, notes } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const validStatuses = ['pending', 'completed', 'failed', 'refunded', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Valid statuses: ${validStatuses.join(', ')}`
      });
    }

    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    payment.status = status;
    payment.notes = notes || `Status updated to ${status} by admin`;
    payment.updatedAt = new Date();
    await payment.save();

    if (payment.order) {
      await Order.findByIdAndUpdate(payment.order, {
        paymentStatus: status,
        ...(status === 'completed' ? { isPaid: true, paidAt: new Date() } : {})
      });
    }

    if (payment.seller) {
      await Notification.create({
        user: payment.seller,
        type: 'PAYMENT_STATUS_UPDATE',
        title: 'Payment Status Updated',
        message: `Payment #${payment._id.toString().slice(-6)} status changed to ${status}`,
        relatedEntity: payment._id,
        entityModel: 'Payment'
      });
    }

    if (payment.user && payment.user.toString() !== payment.seller?.toString()) {
      await Notification.create({
        user: payment.user,
        type: 'PAYMENT_STATUS_UPDATE',
        title: 'Payment Status Updated',
        message: `Your payment of ₹${payment.amount} status changed to ${status}`,
        relatedEntity: payment._id,
        entityModel: 'Payment'
      });
    }

    res.json({
      success: true,
      message: 'Payment status updated successfully',
      payment
    });
  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update payment status'
    });
  }
});

/**
 * @desc Process payout to seller
 * @route POST /api/admin/payments/:id/process-payout
 * @access Private/Admin
 */
exports.processPayout = asyncHandler(async (req, res) => {
  try {
    const { payoutMethod, transactionId, notes } = req.body;

    if (!payoutMethod) {
      return res.status(400).json({
        success: false,
        message: 'Payout method is required'
      });
    }

    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (payment.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Payment must be completed before processing payout'
      });
    }

    if (payment.payoutStatus === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Payout already completed'
      });
    }

    if (!payment.sellerPayoutAmount || payment.sellerPayoutAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid seller payout amount'
      });
    }

    payment.payoutStatus = 'completed';
    payment.payoutMethod = payoutMethod;
    payment.payoutTransactionId = transactionId;
    payment.payoutDate = new Date();
    payment.payoutNotes = notes;
    payment.updatedAt = new Date();
    await payment.save();

    await Notification.create({
      user: payment.seller,
      type: 'PAYOUT_COMPLETED',
      title: 'Payout Processed',
      message: `Payout of ₹${payment.sellerPayoutAmount} has been processed`,
      relatedEntity: payment._id,
      entityModel: 'Payment'
    });

    const seller = await User.findById(payment.seller);
    if (seller && seller.balance !== undefined) {
      seller.balance = (seller.balance || 0) + payment.sellerPayoutAmount;
      seller.payoutHistory = seller.payoutHistory || [];
      seller.payoutHistory.push({
        amount: payment.sellerPayoutAmount,
        date: new Date(),
        paymentId: payment._id,
        method: payoutMethod
      });
      await seller.save();
    }

    res.json({
      success: true,
      message: 'Payout processed successfully',
      payment
    });
  } catch (error) {
    console.error('Process payout error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process payout'
    });
  }
});

/**
 * @desc Get pending payouts
 * @route GET /api/admin/payments/pending-payouts
 * @access Private/Admin
 */
exports.getPendingPayouts = asyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const query = {
      payoutStatus: 'pending',
      sellerPayoutAmount: { $gt: 0 },
      status: 'completed'
    };

    const pendingPayouts = await Payment.find(query)
      .populate('seller', 'name email businessName bankDetails')
      .populate('order', 'orderNumber')
      .sort('createdAt')
      .skip(skip)
      .limit(Number(limit));

    const total = await Payment.countDocuments(query);

    const totalPending = await Payment.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$sellerPayoutAmount' },
          count: { $sum: 1 }
        }
      }
    ]);

    const bySeller = await Payment.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$seller',
          totalAmount: { $sum: '$sellerPayoutAmount' },
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'sellerInfo'
        }
      },
      { $unwind: '$sellerInfo' },
      {
        $project: {
          seller: '$sellerInfo',
          totalAmount: 1,
          count: 1
        }
      }
    ]);

    res.json({
      success: true,
      pendingPayouts,
      summary: {
        total,
        totalAmount: totalPending[0]?.totalAmount || 0,
        totalCount: totalPending[0]?.count || 0
      },
      bySeller,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get pending payouts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending payouts'
    });
  }
});

/**
 * @desc Process batch payouts
 * @route POST /api/admin/payments/process-batch-payouts
 * @access Private/Admin
 */
exports.processBatchPayouts = asyncHandler(async (req, res) => {
  try {
    const { sellerIds, payoutMethod, batchNotes } = req.body;

    if (!sellerIds || !Array.isArray(sellerIds) || sellerIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Seller IDs array is required'
      });
    }

    if (!payoutMethod) {
      return res.status(400).json({
        success: false,
        message: 'Payout method is required'
      });
    }

    const results = {
      processed: 0,
      failed: 0,
      totalAmount: 0,
      details: []
    };

    for (const sellerId of sellerIds) {
      try {
        const pendingPayments = await Payment.find({
          seller: sellerId,
          payoutStatus: 'pending',
          sellerPayoutAmount: { $gt: 0 },
          status: 'completed'
        });

        if (pendingPayments.length === 0) {
          results.details.push({
            sellerId,
            status: 'skipped',
            reason: 'No pending payments'
          });
          continue;
        }

        const totalAmount = pendingPayments.reduce((sum, p) => sum + p.sellerPayoutAmount, 0);
        const batchId = `BATCH-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        await Payment.updateMany(
          {
            seller: sellerId,
            payoutStatus: 'pending',
            sellerPayoutAmount: { $gt: 0 },
            status: 'completed'
          },
          {
            payoutStatus: 'completed',
            payoutMethod,
            payoutBatchId: batchId,
            payoutDate: new Date(),
            payoutNotes: batchNotes || 'Batch payout processed',
            updatedAt: new Date()
          }
        );

        const seller = await User.findById(sellerId);
        if (seller) {
          await Notification.create({
            user: sellerId,
            type: 'BATCH_PAYOUT_COMPLETED',
            title: 'Batch Payout Processed',
            message: `Batch payout of ₹${totalAmount} processed for ${pendingPayments.length} payments`,
            relatedEntity: sellerId,
            entityModel: 'User'
          });

          if (seller.balance !== undefined) {
            seller.balance = (seller.balance || 0) + totalAmount;
            seller.payoutHistory = seller.payoutHistory || [];
            seller.payoutHistory.push({
              amount: totalAmount,
              date: new Date(),
              batchId,
              method: payoutMethod,
              paymentCount: pendingPayments.length
            });
            await seller.save();
          }
        }

        results.processed++;
        results.totalAmount += totalAmount;
        results.details.push({
          sellerId,
          sellerName: seller?.name || 'Unknown',
          status: 'completed',
          amount: totalAmount,
          paymentCount: pendingPayments.length,
          batchId
        });
      } catch (sellerError) {
        results.failed++;
        results.details.push({
          sellerId,
          status: 'failed',
          error: sellerError.message
        });
      }
    }

    res.json({
      success: true,
      message: `Batch payout completed: ${results.processed} success, ${results.failed} failed`,
      results
    });
  } catch (error) {
    console.error('Process batch payouts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process batch payouts'
    });
  }
});

/**
 * @desc Generate payment report (JSON/CSV)
 * @route GET /api/admin/payments/report
 * @access Private/Admin
 */
exports.generatePaymentReport = asyncHandler(async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      sellerId,
      format = 'json'
    } = req.query;

    const query = {};
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    if (sellerId) query.seller = sellerId;

    const payments = await Payment.find(query)
      .populate('user', 'name email phone')
      .populate('seller', 'name email businessName')
      .populate('order', 'orderNumber')
      .sort('createdAt');

    const summary = {
      totalPayments: payments.length,
      totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
      totalCommission: payments.reduce((sum, p) => sum + (p.commissionAmount || 0), 0),
      totalSellerPayout: payments.reduce((sum, p) => sum + (p.sellerPayoutAmount || 0), 0),
      byStatus: {},
      byMethod: {},
      byPayoutStatus: {}
    };

    payments.forEach(p => {
      summary.byStatus[p.status] = (summary.byStatus[p.status] || 0) + 1;
      summary.byMethod[p.method] = (summary.byMethod[p.method] || 0) + 1;
      summary.byPayoutStatus[p.payoutStatus] = (summary.byPayoutStatus[p.payoutStatus] || 0) + 1;
    });

    if (format === 'csv') {
      const { Parser } = require('json2csv');
      const fields = ['Payment ID', 'Order Number', 'User', 'Seller', 'Amount', 'Commission', 'Seller Payout', 'Method', 'Status', 'Payout Status', 'Created At'];
      const data = payments.map(p => ({
        'Payment ID': p._id,
        'Order Number': p.order?.orderNumber || 'N/A',
        'User': p.user?.name || 'N/A',
        'Seller': p.seller?.businessName || p.seller?.name || 'N/A',
        'Amount': p.amount,
        'Commission': p.commissionAmount || 0,
        'Seller Payout': p.sellerPayoutAmount || 0,
        'Method': p.method,
        'Status': p.status,
        'Payout Status': p.payoutStatus,
        'Created At': p.createdAt.toISOString()
      }));
      const parser = new Parser({ fields });
      const csv = parser.parse(data);
      res.header('Content-Type', 'text/csv');
      res.attachment(`payments-report-${new Date().toISOString().split('T')[0]}.csv`);
      return res.send(csv);
    }

    res.json({
      success: true,
      report: {
        summary,
        payments,
        generatedAt: new Date(),
        filters: { startDate, endDate, sellerId }
      }
    });
  } catch (error) {
    console.error('Generate payment report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate payment report'
    });
  }
});

/**
 * @desc Refund a payment (legacy)
 * @route POST /api/admin/payments/:id/refund
 * @access Private/Admin
 */
exports.refundPayment = asyncHandler(async (req, res) => {
  try {
    const { refundAmount, reason, notes } = req.body;

    if (!refundAmount || refundAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid refund amount is required'
      });
    }

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Refund reason is required'
      });
    }

    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (refundAmount > payment.amount) {
      return res.status(400).json({
        success: false,
        message: `Refund amount cannot exceed original payment amount of ₹${payment.amount}`
      });
    }

    payment.status = 'refunded';
    payment.refundAmount = refundAmount;
    payment.refundReason = reason;
    payment.refundNotes = notes;
    payment.refundDate = new Date();
    payment.updatedAt = new Date();
    await payment.save();

    if (payment.order) {
      await Order.findByIdAndUpdate(payment.order, {
        paymentStatus: 'refunded',
        refundAmount,
        refundReason: reason
      });
    }

    await Notification.create({
      user: payment.user,
      type: 'PAYMENT_REFUNDED',
      title: 'Payment Refunded',
      message: `Your payment of ₹${refundAmount} has been refunded. Reason: ${reason}`,
      relatedEntity: payment._id,
      entityModel: 'Payment'
    });

    if (payment.seller && payment.seller.toString() !== payment.user.toString()) {
      await Notification.create({
        user: payment.seller,
        type: 'PAYMENT_REFUNDED',
        title: 'Payment Refunded',
        message: `Payment of ₹${refundAmount} has been refunded to customer. Reason: ${reason}`,
        relatedEntity: payment._id,
        entityModel: 'Payment'
      });
    }

    res.json({
      success: true,
      message: `Payment refund of ₹${refundAmount} processed successfully`,
      payment
    });
  } catch (error) {
    console.error('Refund payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process refund'
    });
  }
});

/**
 * @desc Get customer withdrawal requests for admin
 * @route GET /api/admin/payments/withdrawals
 * @access Private/Admin
 */
exports.getCustomerWithdrawals = asyncHandler(async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    const query = {};
    if (status && status !== 'all') query.status = status;

    const withdrawals = await WithdrawalRequest.find(query)
      .populate('user', 'name email phone')
      .sort('-createdAt')
      .skip(skip)
      .limit(Number(limit));

    const total = await WithdrawalRequest.countDocuments(query);

    res.json({
      success: true,
      withdrawals,
      total,
      totalPages: Math.ceil(total / limit),
      page: Number(page)
    });
  } catch (error) {
    console.error('Get customer withdrawals error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch withdrawals' });
  }
});

/**
 * @desc Moderate customer withdrawal request
 * @route PUT /api/admin/payments/withdrawals/:id
 * @access Private/Admin
 */
exports.moderateCustomerWithdrawal = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const withdrawal = await WithdrawalRequest.findById(id);
    if (!withdrawal) {
      return res.status(404).json({ success: false, message: 'Withdrawal request not found' });
    }

    if (withdrawal.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Withdrawal already ${withdrawal.status}` });
    }

    const user = await User.findById(withdrawal.user);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    withdrawal.status = status;
    withdrawal.adminNotes = adminNotes;
    withdrawal.processedAt = new Date();
    withdrawal.processedBy = req.user._id;
    await withdrawal.save();

    if (status === 'rejected') {
      // Refund the wallet balance
      user.walletBalance += withdrawal.amount;
      await user.save();

      // Create refund transaction
      await WalletTransaction.create({
        user: user._id,
        amount: withdrawal.amount,
        type: 'referral_award',
        status: 'completed',
        description: `Withdrawal rejected: ${adminNotes || 'No reason provided'}. Balance refunded.`,
        referenceId: withdrawal._id,
        referenceType: 'WithdrawalRequest',
        balanceAfter: user.walletBalance
      });
    } else {
      // If approved, update the original transaction status
      await WalletTransaction.updateOne(
        { referenceId: withdrawal._id, type: 'withdrawal' },
        { $set: { status: 'completed', description: 'Withdrawal approved and processed' } }
      );
    }

    await Notification.create({
      user: withdrawal.user,
      type: status === 'approved' ? 'WITHDRAWAL_APPROVED' : 'WITHDRAWAL_REJECTED',
      title: `Withdrawal ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      message: status === 'approved'
        ? `Your withdrawal request for ₹${withdrawal.amount} has been approved.`
        : `Your withdrawal request for ₹${withdrawal.amount} was rejected. ${adminNotes || ''}`,
      relatedEntity: withdrawal._id,
      entityModel: 'WithdrawalRequest'
    });

    res.json({ success: true, message: `Withdrawal ${status} successfully`, withdrawal });
  } catch (error) {
    console.error('Moderate withdrawal error:', error);
    res.status(500).json({ success: false, message: 'Failed to moderate withdrawal' });
  }
});

// Export all functions
module.exports = exports;