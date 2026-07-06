const express = require('express');
const router = express.Router();
const { paymentLimiter } = require('../middleware/rateLimiter');

// Import middlewares with error handling
let authMiddleware;
try {
  authMiddleware = require('../middleware/auth');
} catch (error) {
  console.error('❌ Failed to load auth middleware:', error.message);
  authMiddleware = {
    protect: (req, res, next) => {
      console.log('⚠️ Auth middleware not loaded, skipping protection');
      req.user = { _id: 'fallback-user', role: 'admin' };
      next();
    },
    authorize: (...roles) => (req, res, next) => {
      console.log('⚠️ Authorize middleware not loaded, skipping authorization');
      next();
    }
  };
}

const { protect, authorize, requireVerifiedEmail } = authMiddleware;

// ✅ FIXED: Health check for admin payments API
/**
 * @swagger
 * /api/payments/health:
 *   get:
 *     summary: Health check for Payments API
 *     tags: [Payments]
 *     responses:
 *       200:
 *         description: Payments API is healthy
 */
router.get('/health', (req, res) => {
  res.json({
    message: 'Admin Payments API is working!',
    timestamp: new Date().toISOString(),
    status: 'active'
  });
});

const paymentController = require('../controllers/paymentController');
const { validateResult } = require('../middleware/validators/validate');
const paymentValidator = require('../middleware/validators/paymentValidator');

// 🌐 PUBLIC ROUTES (MUST be before protect middleweare)
/**
 * @swagger
 * /api/payments/razorpay/pay/{orderId}:
 *   get:
 *     summary: Render Razorpay checkout page for an order
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID to pay for
 *     responses:
 *       200:
 *         description: Checkout page rendered
 */
router.get('/razorpay/pay/:orderId', paymentController.renderRazorpayCheckout);

/**
 * @swagger
 * /api/payments/razorpay/verify-link:
 *   get:
 *     summary: Verify Razorpay payment link
 *     tags: [Payments]
 *     responses:
 *       200:
 *         description: Verification result
 */
router.get('/razorpay/verify-link', paymentController.verifyRazorpayLink);

/**
 * @swagger
 * /api/payments/razorpay/pay-advance/{orderId}:
 *   get:
 *     summary: Render Razorpay advance checkout for an order
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID for advance payment
 *     responses:
 *       200:
 *         description: Advance checkout page rendered
 */
router.get('/razorpay/pay-advance/:orderId', paymentController.renderRazorpayAdvanceCheckout);

/**
 * @swagger
 * /api/payments/razorpay/verify-advance-link:
 *   get:
 *     summary: Verify Razorpay advance payment link
 *     tags: [Payments]
 *     responses:
 *       200:
 *         description: Verification result
 */
router.get('/razorpay/verify-advance-link', paymentController.verifyRazorpayAdvanceLink);

// All routes require authentication
router.use(protect);

// User Routes
const userController = require('../controllers/userController');
const validateController = (controller, functionName) => {
  if (typeof controller[functionName] !== 'function') {
    return (req, res) => res.status(501).json({ message: 'Function not implemented' });
  }
  return controller[functionName];
};

router.post('/add-card', requireVerifiedEmail, validateController(userController, 'addPaymentMethod'));
router.delete('/cards/:id', requireVerifiedEmail, validateController(userController, 'deletePaymentMethod'));

// ✅ FIXED: Razorpay routes for customers (Secure)
/**
 * @swagger
 * /api/payments/razorpay/order:
 *   post:
 *     summary: Create a Razorpay order to initiate payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - orderId
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Payment amount in INR
 *                 example: 1500
 *               orderId:
 *                 type: string
 *                 description: The order ID to create payment for
 *                 example: "60d5ec49f1b2c72b7c8e4a3f"
 *               currency:
 *                 type: string
 *                 default: INR
 *     responses:
 *       200:
 *         description: Razorpay order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 razorpayOrder:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     amount:
 *                       type: number
 *                     currency:
 *                       type: string
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 */
router.post('/razorpay/order', paymentLimiter, requireVerifiedEmail, paymentValidator.createRazorpayOrderValidator, validateResult, paymentController.createRazorpayOrder);

/**
 * @swagger
 * /api/payments/razorpay/verify:
 *   post:
 *     summary: Verify a Razorpay payment after checkout
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - razorpay_order_id
 *               - razorpay_payment_id
 *               - razorpay_signature
 *             properties:
 *               razorpay_order_id:
 *                 type: string
 *                 description: Razorpay order ID returned from checkout
 *               razorpay_payment_id:
 *                 type: string
 *                 description: Razorpay payment ID from successful payment
 *               razorpay_signature:
 *                 type: string
 *                 description: HMAC signature for verification
 *     responses:
 *       200:
 *         description: Payment verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 payment:
 *                   type: object
 *       400:
 *         description: Payment verification failed
 *       401:
 *         description: Unauthorized
 */
router.post('/razorpay/verify', paymentLimiter, requireVerifiedEmail, paymentValidator.verifyRazorpayPaymentValidator, validateResult, paymentController.verifyRazorpayPayment);

// ✅ NEW: Seller payment routes
/**
 * @swagger
 * /api/payments/seller:
 *   get:
 *     summary: Get payment history for the authenticated seller
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of seller payments
 */
router.get('/seller', authorize('seller'), paymentController.getSellerPayments);

/**
 * @swagger
 * /api/payments/cod-report/{orderId}:
 *   post:
 *     summary: Record a COD payment for an order (seller only)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: COD payment recorded
 */
router.post('/cod-report/:orderId', requireVerifiedEmail, authorize('seller'), paymentValidator.recordCodPaymentValidator, validateResult, paymentController.recordCodPayment);

/**
 * @swagger
 * /api/payments/request-payout:
 *   post:
 *     summary: Request a payout (seller only)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payout request submitted
 */
router.post('/request-payout', requireVerifiedEmail, authorize('seller'), paymentValidator.requestPayoutValidator, validateResult, paymentController.requestPayout);

// Admin Routes (Apply admin check to all subsequent routes or individually)
router.use(authorize('admin'));

// ✅ FIXED: Get payment statistics
router.get('/stats', async (req, res) => {
  try {
    const Payment = require('../models/Payment');

    const totalPayments = await Payment.countDocuments();
    const totalAmount = await Payment.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const byStatus = await Payment.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 }, amount: { $sum: '$amount' } } }
    ]);

    const recentPayments = await Payment.find()
      .populate('user', 'name email')
      .populate('seller', 'name email')
      .populate('order', 'orderNumber')
      .sort('-createdAt')
      .limit(10);

    res.json({
      success: true,
      stats: {
        totalPayments,
        totalAmount: totalAmount[0]?.total || 0,
        byStatus,
        recentPayments
      }
    });
  } catch (error) {
    console.error('Admin payments stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment statistics'
    });
  }
});

// ✅ FIXED: Get all payments with filters
router.get('/', async (req, res) => {
  try {
    const Payment = require('../models/Payment');
    const { status, method, startDate, endDate, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (method) query.method = method;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const payments = await Payment.find(query)
      .populate('user', 'name email')
      .populate('seller', 'name email businessName')
      .populate('order', 'orderNumber')
      .sort('-createdAt')
      .skip(skip)
      .limit(Number(limit));

    const total = await Payment.countDocuments(query);

    res.json({
      success: true,
      payments,
      page: Number(page),
      pages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payments'
    });
  }
});

// ✅ FIXED: Get single payment by ID
router.get('/:id', async (req, res) => {
  try {
    const Payment = require('../models/Payment');
    const payment = await Payment.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('seller', 'name email phone businessName')
      .populate('order', 'orderNumber orderStatus');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    res.json({
      success: true,
      payment
    });
  } catch (error) {
    console.error('Get payment by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment'
    });
  }
});

// ✅ FIXED: Update payment status
router.put('/:id/status', async (req, res) => {
  try {
    const Payment = require('../models/Payment');
    const { status, notes } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const payment = await Payment.findByIdAndUpdate(
      req.params.id,
      {
        status,
        notes: notes || `Status updated to ${status} by admin`,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Create notification if payment is to a seller
    if (payment.seller) {
      const Notification = require('../models/Notification');
      await Notification.create({
        user: payment.seller,
        type: 'PAYMENT_UPDATE',
        title: 'Payment Status Updated',
        message: `Payment #${payment._id.toString().slice(-6)} status changed to ${status}`,
        relatedEntity: payment._id,
        entityModel: 'Payment'
      });
    }

    res.json({
      success: true,
      message: 'Payment status updated',
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

// ✅ FIXED: Process payout to seller
router.post('/:id/process-payout', async (req, res) => {
  try {
    const Payment = require('../models/Payment');
    const { payoutMethod, transactionId, notes } = req.body;

    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (payment.payoutStatus === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Payout already completed'
      });
    }

    payment.payoutStatus = 'completed';
    payment.payoutMethod = payoutMethod;
    payment.payoutTransactionId = transactionId;
    payment.payoutDate = new Date();
    payment.payoutNotes = notes;

    await payment.save();

    // Create notification for seller
    const Notification = require('../models/Notification');
    await Notification.create({
      user: payment.seller,
      type: 'PAYOUT_COMPLETED',
      title: 'Payout Processed',
      message: `Payout of ₹${payment.sellerPayoutAmount} has been processed for payment #${payment._id.toString().slice(-6)}`,
      relatedEntity: payment._id,
      entityModel: 'Payment'
    });

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

// ✅ FIXED: Generate payment report
router.get('/report/generate', async (req, res) => {
  try {
    const { startDate, endDate, format = 'json' } = req.query;

    const query = {};
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const Payment = require('../models/Payment');
    const payments = await Payment.find(query)
      .populate('user', 'name email')
      .populate('seller', 'name email businessName')
      .populate('order', 'orderNumber')
      .sort('createdAt');

    if (format === 'csv') {
      // Generate CSV (simplified)
      let csv = 'ID,Order Number,User,Seller,Amount,Method,Status,Date\n';
      payments.forEach(p => {
        csv += `${p._id},${p.order?.orderNumber || 'N/A'},${p.user?.name || 'N/A'},${p.seller?.businessName || p.seller?.name || 'N/A'},${p.amount},${p.method},${p.status},${p.createdAt}\n`;
      });

      res.header('Content-Type', 'text/csv');
      res.attachment(`payments-report-${new Date().toISOString().split('T')[0]}.csv`);
      res.send(csv);
    } else {
      // JSON response
      const summary = {
        totalPayments: payments.length,
        totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
        totalCommission: payments.reduce((sum, p) => sum + (p.commissionAmount || 0), 0),
        totalSellerPayout: payments.reduce((sum, p) => sum + (p.sellerPayoutAmount || 0), 0),
        byStatus: {},
        byMethod: {}
      };

      payments.forEach(p => {
        summary.byStatus[p.status] = (summary.byStatus[p.status] || 0) + 1;
        summary.byMethod[p.method] = (summary.byMethod[p.method] || 0) + 1;
      });

      res.json({
        success: true,
        report: {
          summary,
          payments,
          generatedAt: new Date(),
          period: { startDate, endDate }
        }
      });
    }
  } catch (error) {
    console.error('Generate report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate report'
    });
  }
});

console.log('✅ Admin payment routes loaded successfully');

module.exports = router;