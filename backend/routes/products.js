// backend/routes/products.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const upload = require("../utils/uploadMiddleware");
const asyncHandler = require("../middleware/asyncHandler");
const { customerLimiter } = require("../middleware/rateLimit");

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
  createProductReview,
  filterProducts, // ← Make sure this is exported!
} = require("../controllers/productController");

const { likeItem, addComment, getComments, trackShare } = require('../controllers/socialController');

// ===== PUBLIC ROUTES =====
// GET /api/products/filter → MUST come BEFORE /:id !!!
router.get("/filter", filterProducts);

// Dynamic ID route → must be AFTER /filter
router.get("/:id", getProductById);
router.get("/recipe", getRecipeSuggestion);
router.route('/').get(getProducts);

// ===== SELLER ROUTES =====
router.get("/seller", auth.protect, auth.role("seller"), auth.kycVerified, getSellerProducts);
router.post("/", auth.protect, auth.role("seller"), auth.kycVerified, upload.any(), createProduct);
router.put("/:id", auth.protect, auth.role("seller"), auth.kycVerified, upload.any(), updateProduct);
router.delete("/:id", auth.protect, auth.role("seller"), auth.kycVerified, deleteProduct);
router.post("/bulk", auth.protect, auth.role("seller"), auth.kycVerified, bulkUploadProducts);

// ===== USER ROUTES =====
router.post("/:id/reviews", auth.protect, createProductReview);

// ===== SOCIAL =====
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

router.post('/:id/share', auth.protect, (req, res, next) => {
  req.params.type = 'products';
  next();
}, trackShare);

// ===== ADMIN =====
router.get("/analytics", auth.protect, auth.role("admin"), getProductAnalytics);

module.exports = router;