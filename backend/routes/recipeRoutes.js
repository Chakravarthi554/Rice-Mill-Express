const express = require('express');
const router = express.Router();
const { protect, role } = require('../middleware/auth'); // Assuming middleware file is correct
const {
  submitRecipe,
  getRecipes,
  getMyRecipes,      // New controller function
  getPendingRecipes, // New controller function
  getRecipeById,
  approveRecipe,
  rateRecipe,
  commentOnRecipe,
  deleteRecipe       // New controller function
} = require('../controllers/recipeController');
const asyncHandler = require('../middleware/asyncHandler');
const { socialRateLimiter, strictSocialLimiter, customerLimiter } = require('../middleware/rateLimit');

const { likeItem, addComment, getComments, trackShare, rateItem } = require('../controllers/socialController');


const multer = require('multer');
const path = require('path');
const fs = require('fs');

// --- Multer Storage Configuration for Recipes ---
const recipeUploadDir = path.join(__dirname, '../uploads/recipes'); // Define specific directory
if (!fs.existsSync(recipeUploadDir)) {
  fs.mkdirSync(recipeUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, recipeUploadDir); // Save to uploads/recipes/
  },
  filename: (req, file, cb) => {
    // Create a unique filename: recipe-[timestamp]-[original_name]
    cb(null, `recipe-${Date.now()}${path.extname(file.originalname)}`);
  },
});

// File filter (optional: accept only images)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const mimetype = allowedTypes.test(file.mimetype);
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb('Error: Images Only!');
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size (e.g., 5MB)
  fileFilter: fileFilter,
});
// --- End Multer Configuration ---

// --- Routes ---
// Seller routes
router.post('/submit', protect, role('seller'), upload.single('image'), submitRecipe);
router.get('/myrecipes', protect, role('seller'), getMyRecipes); // Seller gets their recipes

// Admin routes
router.get('/pending', protect, role('admin'), getPendingRecipes); // Admin gets pending recipes
router.put('/:id/approve', protect, role('admin'), approveRecipe); // Admin approves/rejects

// Public/Customer/Authenticated User routes
router.get('/', getRecipes); // Get approved recipes (public or logged-in users)
router.get('/:id', getRecipeById); // Get single recipe details

// Authenticated user routes (rating/commenting)
router.post('/:id/rate', protect, socialRateLimiter, (req, res, next) => {
  req.params.type = 'recipes';
  next();
}, rateItem);

router.post('/:id/comment', protect, socialRateLimiter, (req, res, next) => {
  req.params.type = 'recipes';
  next();
}, addComment);

// Delete route (Admin or Owner Seller)
router.delete('/:id', protect, role('admin', 'seller'), deleteRecipe); // Role middleware allows admin OR seller

router.post('/:id/like', protect, socialRateLimiter, (req, res, next) => {
  req.params.type = 'recipes';
  next();
}, likeItem);

router.post('/:id/comment', protect, (req, res, next) => {
  req.params.type = 'recipes';
  next();
}, addComment);

router.get('/:id/comments', (req, res, next) => {
  req.params.type = 'recipes';
  next();
}, getComments);

router.post('/:id/share', protect, strictSocialLimiter, (req, res, next) => {
  req.params.type = 'recipes';
  next();
}, trackShare);

// Enhanced social features
const { editComment, likeComment, replyToComment, getSortedComments, getCommentReplies, getRatingDistribution } = require('../controllers/socialController');

// Edit comment
router.put('/:id/comments/:commentId', protect, (req, res, next) => {
  req.params.type = 'recipes';
  next();
}, editComment);

// Like comment
router.post('/:id/comments/:commentId/like', protect, (req, res, next) => {
  req.params.type = 'recipes';
  next();
}, likeComment);

// Reply to comment
router.post('/:id/comments/:commentId/reply', protect, (req, res, next) => {
  req.params.type = 'recipes';
  next();
}, replyToComment);

// Get sorted comments
router.get('/:id/comments/sorted', (req, res, next) => {
  req.params.type = 'recipes';
  next();
}, getSortedComments);

// Get comment replies
router.get('/:id/comments/:commentId/replies', (req, res, next) => {
  req.params.type = 'recipes';
  next();
}, getCommentReplies);

// Get rating distribution
router.get('/:id/rating-distribution', getRatingDistribution);

// Consolidated with socialController getComments

module.exports = router;