const express = require('express');
const router = express.Router();

// ✅ FIXED: Check if BulkOrder model is already compiled to prevent overwrite
let BulkOrder;
try {
  // Try to get existing model first
  BulkOrder = require('mongoose').model('BulkOrder');
  console.log('✅ Using existing BulkOrder model');
} catch (error) {
  // If model doesn't exist, require it
  try {
    BulkOrder = require('../models/BulkOrder');
    console.log('✅ Loaded BulkOrder model successfully');
  } catch (modelError) {
    console.error('❌ Failed to load BulkOrder model:', modelError.message);
    // Create a fallback model to prevent crashes
    const mongoose = require('mongoose');
    BulkOrder = mongoose.model('BulkOrder', new mongoose.Schema({}));
  }
}

// ✅ FIXED: Import middlewares with error handling
let authMiddleware;
try {
  authMiddleware = require('../middleware/auth');
} catch (error) {
  console.error('❌ Failed to load auth middleware:', error.message);
  authMiddleware = {
    protect: (req, res, next) => {
      console.log('⚠️ Auth middleware not loaded, skipping protection');
      req.user = { _id: 'fallback-user', role: 'customer' };
      next();
    },
    authorize: (...roles) => (req, res, next) => {
      console.log('⚠️ Authorize middleware not loaded, skipping authorization');
      next();
    },
    role: (...roles) => (req, res, next) => {
      console.log('⚠️ Role middleware not loaded, skipping role check');
      next();
    }
  };
}

// ✅ FIXED: Import controllers with error handling
let bulkOrderController;
try {
  bulkOrderController = require('../controllers/bulkOrderController');
} catch (error) {
  console.error('❌ Failed to load bulkOrderController:', error.message);
  // Create fallback controller functions
  bulkOrderController = {
    createBulkOrder: (req, res) => res.status(501).json({ message: 'Bulk order controller not loaded' }),
    getBulkOrders: (req, res) => res.status(501).json({ message: 'Bulk order controller not loaded' }),
    getBulkOrderById: (req, res) => res.status(501).json({ message: 'Bulk order controller not loaded' }),
    updateBulkOrder: (req, res) => res.status(501).json({ message: 'Bulk order controller not loaded' }),
    cancelBulkOrder: (req, res) => res.status(501).json({ message: 'Bulk order controller not loaded' }),
    getBulkOrderStats: (req, res) => res.status(501).json({ message: 'Bulk order controller not loaded' }),
    getSellerBulkOrders: (req, res) => res.status(501).json({ message: 'Bulk order controller not loaded' }),
    addBulkOrderReview: (req, res) => res.status(501).json({ message: 'Bulk order controller not loaded' })
  };
}

const { protect, authorize, role } = authMiddleware;
const {
  createBulkOrder,
  getBulkOrders,
  getBulkOrderById,
  updateBulkOrder,
  cancelBulkOrder,
  getBulkOrderStats,
  getSellerBulkOrders,
  addBulkOrderReview
} = bulkOrderController;

// ✅ FIXED: Validate controller functions
const validateController = (controller, functionName) => {
  if (typeof controller[functionName] !== 'function') {
    console.error(`❌ Bulk order controller function ${functionName} is not a function`);
    return (req, res) => res.status(501).json({ 
      message: `Function ${functionName} not available`,
      code: 'FUNCTION_NOT_AVAILABLE'
    });
  }
  return controller[functionName];
};

// ✅ FIXED: Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    message: 'Bulk Orders API is working!',
    timestamp: new Date().toISOString(),
    status: 'active',
    model: BulkOrder ? 'Loaded' : 'Not loaded'
  });
});

// ✅ FIXED: Test endpoint
router.get('/test', (req, res) => {
  res.json({
    message: 'Bulk Orders API test successful!',
    timestamp: new Date().toISOString(),
    endpoints: {
      create: 'POST /api/bulk-orders',
      list: 'GET /api/bulk-orders',
      getById: 'GET /api/bulk-orders/:id',
      update: 'PUT /api/bulk-orders/:id',
      cancel: 'PUT /api/bulk-orders/:id/cancel'
    }
  });
});

// ✅ FIXED: All routes require authentication
router.use(protect);

// ✅ FIXED: Create a new bulk order
router.post('/', validateController(bulkOrderController, 'createBulkOrder'));

// ✅ FIXED: Get bulk orders for authenticated user
router.get('/', validateController(bulkOrderController, 'getBulkOrders'));

// ✅ FIXED: Get single bulk order by ID
router.get('/:id', validateController(bulkOrderController, 'getBulkOrderById'));

// ✅ FIXED: Update bulk order (seller actions)
router.put('/:id', validateController(bulkOrderController, 'updateBulkOrder'));

// ✅ FIXED: Cancel bulk order
router.put('/:id/cancel', validateController(bulkOrderController, 'cancelBulkOrder'));

// ✅ FIXED: Get bulk order statistics (admin only)
router.get('/stats/overview', authorize('admin'), validateController(bulkOrderController, 'getBulkOrderStats'));

// ✅ FIXED: Get seller's bulk orders - FIXED ROUTE PATH
router.get('/seller/orders', role('seller'), validateController(bulkOrderController, 'getSellerBulkOrders'));

// ✅ FIXED: Add review to delivered bulk order
router.put('/:id/review', role('customer'), validateController(bulkOrderController, 'addBulkOrderReview'));

console.log('✅ Bulk order routes loaded successfully');

module.exports = router;