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

const {likeItem,addComment, getComments, trackShare } = require('../controllers/socialController');


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
router.post('/:id/rate', protect, rateRecipe);
router.post('/:id/comment', protect, commentOnRecipe);

// Delete route (Admin or Owner Seller)
router.delete('/:id', protect, role('admin', 'seller'), deleteRecipe); // Role middleware allows admin OR seller

router.post('/:id/like', protect, (req, res, next) => {
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

router.post('/:id/share', protect, (req, res, next) => {
  req.params.type = 'recipes';
  next();
}, trackShare);

router.get('/:id/comments', asyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    
    const recipe = await Recipe.findById(req.params.id)
      .populate('comments.userId', 'name profilePic')
      .select('comments');
    
    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }
    
    let comments = recipe.comments;
    // Filter for non-admin users
    if (req.user?.role !== 'admin') {
      comments = comments.filter(comment => comment.approved && !comment.isFlagged);
    }
    
    // Sort by creation date (newest first)
    comments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Apply pagination
    const paginatedComments = comments.slice(skip, skip + Number(limit));
    
    res.json({
      comments: paginatedComments,
      total: comments.length,
      page: Number(page),
      pages: Math.ceil(comments.length / limit),
      limit: Number(limit)
    });
  } catch (error) {
    console.error('Get recipe comments error:', error);
    res.status(500).json({ message: 'Server error fetching comments', error: error.message });
  }
}));

module.exports = router;