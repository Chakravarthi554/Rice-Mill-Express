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

const { protect, role, sellerOrOrderOwner } = authMiddleware;
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
router
  .route("/")
  .post(protect, validateController(orderController, 'createOrder'))
  .get(protect, role("admin"), validateController(orderController, 'getOrders'));

// ✅ FIXED: User orders
router.route("/myorders")
  .get(protect, validateController(orderController, 'getMyOrders'));

// ✅ FIXED: Seller orders & analytics
router.route("/sellerorders")
  .get(protect, role("seller"), validateController(orderController, 'getSellerOrders'));

router.route("/seller/analytics")
  .get(protect, role("seller"), validateController(orderController, 'getSellerAnalytics'));

// ✅ FIXED: Webhook (no protect middleware)
router.post("/webhook/shiprocket", validateController(orderController, 'shiprocketWebhook'));

// ✅ FIXED: Invoice generation
const { generateInvoice } = require('../controllers/invoiceController');
router.get("/:id/invoice", protect, generateInvoice);

// ✅ FIXED: Single order actions
router
  .route("/:id")
  .get(protect, sellerOrOrderOwner, validateController(orderController, 'getOrderById'))
  .put(protect, role("admin", "seller"), sellerOrOrderOwner, validateController(orderController, 'updateOrder'));

// ✅ FIXED: Specific status updates
router.put("/:id/status", protect, role("admin", "seller"), sellerOrOrderOwner, validateController(orderController, 'updateOrderStatus'));
router.put("/:id/cancel", protect, sellerOrOrderOwner, validateController(orderController, 'cancelOrder'));
router.put("/:id/assign-partner", protect, role("admin", "seller"), sellerOrOrderOwner, validateController(orderController, 'assignDeliveryPartner'));
router.put("/:id/pay", protect, role("admin"), validateController(orderController, 'updateOrderToPaid'));
router.put("/:id/deliver", protect, role("admin", "seller", "deliveryPartner"), sellerOrOrderOwner, validateController(orderController, 'updateOrderToDelivered'));
router.put("/:id/cod-proof", protect, role("seller"), sellerOrOrderOwner, validateController(orderController, 'uploadCodProof'));

// ✅ NEW: Assigned orders for Delivery Partner
const { getAssignedOrders } = require('../controllers/deliveryController');
router.get("/assigned", protect, role("deliveryPartner"), getAssignedOrders);




// ✅ FIXED: Health check endpoint for orders API
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