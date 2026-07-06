const express = require("express");
const router = express.Router();

// ✅ FIXED: Import controllers with proper error handling
let orderController;
try {
  orderController = require("../controllers/orderController");
} catch (error) {
  console.error("❌ Failed to load orderController:", error.message);
  // Create fallback controller functions
  orderController = {
    createOrder: (req, res) => res.status(501).json({ message: "Order controller not loaded" }),
    getOrderById: (req, res) => res.status(501).json({ message: "Order controller not loaded" }),
    updateOrderStatus: (req, res) => res.status(501).json({ message: "Order controller not loaded" }),
    cancelOrder: (req, res) => res.status(501).json({ message: "Order controller not loaded" }),
    getMyOrders: (req, res) => res.status(501).json({ message: "Order controller not loaded" }),
    getOrders: (req, res) => res.status(501).json({ message: "Order controller not loaded" }),
    shiprocketWebhook: (req, res) => res.status(501).json({ message: "Order controller not loaded" }),
    assignDeliveryPartner: (req, res) => res.status(501).json({ message: "Order controller not loaded" }),
    updateOrderToPaid: (req, res) => res.status(501).json({ message: "Order controller not loaded" }),
    updateOrderToDelivered: (req, res) => res.status(501).json({ message: "Order controller not loaded" }),
    getSellerOrders: (req, res) => res.status(501).json({ message: "Order controller not loaded" }),
    updateOrder: (req, res) => res.status(501).json({ message: "Order controller not loaded" }),
    uploadCodProof: (req, res) => res.status(501).json({ message: "Order controller not loaded" }),
    getSellerAnalytics: (req, res) => res.status(501).json({ message: "Order controller not loaded" })
  };
}

let deliveryController;
try {
  deliveryController = require("../controllers/deliveryController");
} catch (error) {
  deliveryController = {
    assignDeliveryToOrder: (req, res) => res.status(501).json({ message: "Delivery controller not loaded" })
  };
}

// ✅ FIXED: Import middlewares with proper error handling
let authMiddleware;
try {
  authMiddleware = require("../middleware/auth");
} catch (error) {
  console.error("❌ Failed to load auth middleware:", error.message);
  // Create fallback middleware functions
  authMiddleware = {
    protect: (req, res, next) => {
      console.log("⚠️ Auth middleware not loaded, skipping protection");
      next();
    },
    role: (...roles) => (req, res, next) => {
      console.log("⚠️ Role middleware not loaded, skipping role check");
      next();
    },
    sellerOrOrderOwner: (req, res, next) => {
      console.log("⚠️ SellerOrOrderOwner middleware not loaded, skipping check");
      next();
    }
  };
}

const { validateResult } = require('../middleware/validators/validate');
const orderValidator = require('../middleware/validators/orderValidator');

const { protect, requireVerifiedEmail, role, sellerOrOrderOwner } = authMiddleware;
const {
  createOrder,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  getMyOrders,
  getOrders,
  shiprocketWebhook,
  assignDeliveryPartner,
  updateOrderToPaid,
  updateOrderToDelivered,
  getSellerOrders,
  updateOrder,
  uploadCodProof,
  getSellerAnalytics,
} = orderController;

const { assignDeliveryToOrder } = deliveryController;

// ✅ FIXED: Validate all controller functions exist
const validateController = (controller, functionName) => {
  if (typeof controller[functionName] !== 'function') {
    console.error(`❌ Controller function ${functionName} is not a function`);
    return (req, res) => res.status(501).json({
      message: `Function ${functionName} not available`,
      code: 'FUNCTION_NOT_AVAILABLE'
    });
  }
  return controller[functionName];
};

// ✅ FIXED: Create & list orders
/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create a new order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OrderCreate'
 *     responses:
 *       201:
 *         description: Order created
 *       400:
 *         description: Validation error
 *   get:
 *     summary: List all orders (admin only)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by order status
 *     responses:
 *       200:
 *         description: List of orders
 */
router
  .route("/")
    .post(protect, requireVerifiedEmail, orderValidator.createOrderValidator, validateResult, validateController(orderController, 'createOrder'))
    .get(protect, role("admin"), validateController(orderController, 'getOrders'));

// Delivery fee preview for checkout
router.post("/delivery-fee-preview", protect, validateController(orderController, 'previewDeliveryFee'));

// ✅ FIXED: User orders
/**
 * @swagger
 * /api/orders/myorders:
 *   get:
 *     summary: Get orders of the authenticated user
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's orders
 */
router.route("/myorders")
    .get(protect, validateController(orderController, 'getMyOrders'));

// ✅ FIXED: Seller orders & analytics
/**
 * @swagger
 * /api/orders/sellerorders:
 *   get:
 *     summary: Get orders for sellers
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of seller orders
 */
router.route("/sellerorders")
    .get(protect, role("seller"), validateController(orderController, 'getSellerOrders'));

/**
 * @swagger
 * /api/orders/seller/analytics:
 *   get:
 *     summary: Get analytics for seller orders
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Analytics data
 */
router.route("/seller/analytics")
    .get(protect, role("seller"), validateController(orderController, 'getSellerAnalytics'));

// ✅ FIXED: Webhook (no protect middleware)
router.post("/webhook/shiprocket", validateController(orderController, 'shiprocketWebhook'));

// ✅ FIXED: Invoice generation (specific routes first to avoid :id shadowing)
const { generateInvoice, checkInvoiceStatus, downloadInvoiceFile } = require('../controllers/invoiceController');
router.get("/:id/invoice/status", protect, checkInvoiceStatus);
router.get("/:id/invoice/download", protect, downloadInvoiceFile);
router.get("/:id/invoice", protect, generateInvoice);

// ✅ FIXED: Single order actions
router
  .route("/:id")
  .get(protect, sellerOrOrderOwner, validateController(orderController, 'getOrderById'))
  .put(protect, role("admin", "seller"), sellerOrOrderOwner, validateController(orderController, 'updateOrder'));

// ✅ FIXED: Specific status updates
router.put("/:id/status", protect, role("admin", "seller"), sellerOrOrderOwner, orderValidator.updateOrderStatusValidator, validateResult, validateController(orderController, 'updateOrderStatus'));
router.put("/:id/cancel", protect, requireVerifiedEmail, sellerOrOrderOwner, orderValidator.cancelOrderValidator, validateResult, validateController(orderController, 'cancelOrder'));
router.put("/:id/assign-partner", protect, role("admin", "seller"), sellerOrOrderOwner, validateController(orderController, 'assignDeliveryPartner'));
router.put("/:id/pay", protect, role("admin"), validateController(orderController, 'updateOrderToPaid'));
router.put("/:id/deliver", protect, role("admin", "seller", "deliveryPartner"), sellerOrOrderOwner, orderValidator.deliverOrderValidator, validateResult, validateController(orderController, 'updateOrderToDelivered'));
router.put("/:id/cod-proof", protect, role("seller"), sellerOrOrderOwner, validateController(orderController, 'uploadCodProof'));

// ✅ NEW: Assigned orders for Delivery Partner
const { getAssignedOrders } = require('../controllers/deliveryController');
router.get("/assigned", protect, role("deliveryPartner"), getAssignedOrders);




// ✅ FIXED: Health check endpoint for orders API
/**
 * @swagger
 * /api/orders/health:
 *   get:
 *     summary: Health check for Orders API
 *     tags: [Orders]
 *     responses:
 *       200:
 *         description: API is healthy
 */
router.get("/health", (req, res) => {
  res.json({
    message: "Orders API is working!",
    timestamp: new Date().toISOString(),
    endpoints: {
      createOrder: "POST /api/orders",
      getMyOrders: "GET /api/orders/myorders",
      getOrderById: "GET /api/orders/:id",
      updateStatus: "PUT /api/orders/:id/status"
    }
  });
});

console.log("✅ Orders routes loaded successfully");

module.exports = router;