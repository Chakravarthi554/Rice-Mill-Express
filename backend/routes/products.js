// backend/routes/products.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const upload = require("../utils/uploadMiddleware");
const asyncHandler = require("../middleware/asyncHandler");
const { customerLimiter } = require("../middleware/rateLimit");
const rateLimit = require("express-rate-limit");
const cache = require("../middleware/cacheMiddleware");

const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // Limit each IP to 100 search requests per windowMs
  message: { message: 'Too many search requests, please try again after a minute' },
  standardHeaders: true,
  legacyHeaders: false,
});
const {
  getProducts,
  getProductById,
  getSellerProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  bulkUploadProducts,
  getProductAnalytics,
  getRecipeSuggestion,
  filterProducts,
  getPendingProducts,
  approveProduct,
  rejectProduct,
} = require("../controllers/productController");

const { likeItem, addComment, getComments, trackShare, rateItem, getProductReviews } = require('../controllers/socialController');

// ===== PUBLIC ROUTES =====
// Static routes MUST come BEFORE dynamic /:id routes
router.get("/filter", searchLimiter, cache(300), filterProducts);
router.get("/recipe", getRecipeSuggestion);

// ===== SELLER ROUTES (Static) =====
router.get("/seller", auth.protect, auth.role("seller"), auth.kycVerified, getSellerProducts);
router.post("/bulk", auth.protect, auth.requireVerifiedEmail, auth.role("seller"), auth.kycVerified, bulkUploadProducts);

// ===== ADMIN ROUTES (Static) =====
router.get("/analytics", auth.protect, auth.role("admin"), getProductAnalytics);
router.get("/admin/pending", auth.protect, auth.role("admin"), getPendingProducts);
router.put("/:id/approve", auth.protect, auth.role("admin"), approveProduct);
router.put("/:id/reject", auth.protect, auth.role("admin"), rejectProduct);

// ===== USER SOCIAL ROUTES =====
router.post("/:id/reviews", auth.protect, (req, res, next) => {
  req.params.type = 'products';
  next();
}, rateItem);

router.post('/:id/like', auth.protect, (req, res, next) => {
  req.params.type = 'products';
  next();
}, likeItem);

router.post('/:id/comment', auth.protect, (req, res, next) => {
  req.params.type = 'products';
  next();
}, addComment);

router.get('/:id/comments', (req, res, next) => {
  req.params.type = 'products';
  next();
}, getComments);

router.get('/:id/reviews', (req, res, next) => {
  req.params.type = 'products';
  next();
}, getProductReviews);

router.post('/:id/share', auth.protect, (req, res, next) => {
  req.params.type = 'products';
  next();
}, trackShare);

// ===== CUSTOMER READ ROUTES =====
router.get("/:id", cache(300), getProductById);
router.route('/').get(cache(300), getProducts);

// ===== SELLER WRITE ROUTES =====
router.post("/", auth.protect, auth.requireVerifiedEmail, auth.role("seller"), auth.kycVerified, upload.any(), createProduct);
router.put("/:id", auth.protect, auth.requireVerifiedEmail, auth.role("seller"), auth.kycVerified, upload.any(), updateProduct);
router.delete("/:id", auth.protect, auth.requireVerifiedEmail, auth.role("seller"), auth.kycVerified, deleteProduct);

module.exports = router;