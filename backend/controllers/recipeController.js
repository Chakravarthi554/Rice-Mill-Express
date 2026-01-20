const asyncHandler = require('express-async-handler');
const Recipe = require('../models/Recipe');
const Product = require('../models/Product');
const Notification = require('../models/Notification');
const mongoose = require('mongoose');

let badWordsFilter;
(async () => {
  try {
    const { Filter } = await import('bad-words');
    badWordsFilter = new Filter();
  } catch (error) {
    console.error('Failed to initialize bad-words filter:', error);
    badWordsFilter = { isProfane: () => false };
  }
})();

// @desc    Submit a new recipe (Seller)
// @route   POST /api/recipes/submit
// @access  Private/Seller
const submitRecipe = asyncHandler(async (req, res) => {
  console.log('📥 Recipe Submission Request Received');
  if (req.file) console.log('📁 File received:', req.file.filename);
  else console.log('⚠️ No file received');

  const { title, ingredients, steps, riceType, linkedProducts } = req.body;
  const imagePath = req.file ? `/uploads/recipes/${req.file.filename}` : null;

  // Basic validation
  if (!title || !ingredients || !steps || !riceType || !linkedProducts) {
    res.status(400);
    throw new Error('Please provide all required fields: title, ingredients, steps, riceType, linkedProducts');
  }

  let parsedIngredients;
  let parsedSteps;
  let parsedLinkedProducts;

  try {
    parsedIngredients = JSON.parse(ingredients);
    parsedSteps = JSON.parse(steps);
    parsedLinkedProducts = JSON.parse(linkedProducts);

    if (!Array.isArray(parsedIngredients) || !Array.isArray(parsedSteps) || !Array.isArray(parsedLinkedProducts)) {
      throw new Error('Ingredients, steps, and linkedProducts must be arrays.');
    }
    if (parsedLinkedProducts.some(id => !mongoose.Types.ObjectId.isValid(id))) {
      throw new Error('Invalid product ID found in linkedProducts.');
    }

  } catch (error) {
    res.status(400);
    throw new Error(`Invalid format for ingredients, steps, or linkedProducts: ${error.message}`);
  }

  // Verify linked products belong to the seller
  const sellerProducts = await Product.find({ _id: { $in: parsedLinkedProducts }, seller: req.user._id });
  if (sellerProducts.length !== parsedLinkedProducts.length) {
    res.status(400);
    throw new Error('One or more linked products do not belong to you or do not exist.');
  }

  const recipe = await Recipe.create({
    title,
    ingredients: parsedIngredients,
    steps: parsedSteps,
    riceType,
    linkedProducts: parsedLinkedProducts,
    sellerId: req.user._id,
    image: imagePath,
    status: 'pending',
  });

  // 🔥 FIX: Get admin users to notify them
  const adminUsers = await mongoose.model('User').find({ role: 'admin' }).select('_id');

  if (adminUsers.length > 0) {
    const notificationPromises = adminUsers.map(admin =>
      Notification.create({
        user: admin._id,
        type: 'RECIPE_SUBMITTED',
        title: 'New Recipe Submitted',
        message: `New recipe "${title}" submitted by ${req.user.name}`,
        priority: 'medium',
        relatedEntity: recipe._id,
        entityModel: 'Recipe',
        actionUrl: `/admin/dashboard?tab=recipes&recipe=${recipe._id}`,
        actionLabel: 'Review Now'
      })
    );

    await Promise.all(notificationPromises);
  }

  // Enhanced socket event
  if (req.io) {
    req.io.emit('RECIPE_SUBMITTED', {
      recipe,
      status: recipe.status,
      sellerName: req.user.name
    });

    // Emit to admin room specifically
    req.io.to('admin').emit('NEW_RECIPE_FOR_APPROVAL', {
      recipeId: recipe._id,
      title: recipe.title,
      sellerName: req.user.name,
      timestamp: new Date()
    });
  }
  res.status(201).json({
    ...recipe.toObject(),
    message: 'Recipe submitted successfully! Awaiting admin approval.'
  });
});

// @desc    Get all approved recipes (Customer/Public) with pagination
// @route   GET /api/recipes
// @access  Public
const getRecipes = asyncHandler(async (req, res) => {
  const pageSize = 12;
  const page = Number(req.query.pageNumber) || 1;
  const { riceType, search } = req.query;

  const query = { status: 'approved' };
  if (riceType) query.riceType = riceType;
  if (search) {
    query.$text = { $search: search };
  }

  const count = await Recipe.countDocuments(query);
  const recipes = await Recipe.find(query)
    .populate('linkedProducts', 'name price images')
    .populate('sellerId', 'name')
    .limit(pageSize)
    .skip(pageSize * (page - 1))
    .sort({ createdAt: -1 });

  res.json({ recipes, page, pages: Math.ceil(count / pageSize), total: count });
});

// @desc    Get recipes submitted by the logged-in seller
// @route   GET /api/recipes/myrecipes
// @access  Private/Seller
const getMyRecipes = asyncHandler(async (req, res) => {
  const pageSize = 10;
  const page = Number(req.query.pageNumber) || 1;

  const query = { sellerId: req.user._id };

  const count = await Recipe.countDocuments(query);
  const recipes = await Recipe.find(query)
    .populate('linkedProducts', 'name')
    .limit(pageSize)
    .skip(pageSize * (page - 1))
    .sort({ createdAt: -1 });

  res.json({ recipes, page, pages: Math.ceil(count / pageSize), total: count });
});

// @desc    Get pending recipes (Admin) with pagination
// @route   GET /api/recipes/pending
// @access  Private/Admin
const getPendingRecipes = asyncHandler(async (req, res) => {
  const pageSize = 10;
  const page = Number(req.query.pageNumber) || 1;

  const query = { status: 'pending' };

  const count = await Recipe.countDocuments(query);
  const recipes = await Recipe.find(query)
    .populate('sellerId', 'name email')
    .populate('linkedProducts', 'name')
    .limit(pageSize)
    .skip(pageSize * (page - 1))
    .sort({ createdAt: -1 });

  res.json({ recipes, page, pages: Math.ceil(count / pageSize), total: count });
});

// @desc    Get single recipe by ID
// @route   GET /api/recipes/:id
// @access  Public (or Private if login needed to view)
const getRecipeById = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400);
    throw new Error('Invalid recipe ID');
  }

  const recipe = await Recipe.findById(req.params.id)
    .populate('linkedProducts', 'name price images seller')
    .populate('sellerId', 'name email');

  if (recipe) {
    res.json(recipe);
  } else {
    res.status(404);
    throw new Error('Recipe not found');
  }
});

// @desc    Approve or reject a recipe (Admin)
// @route   PUT /api/recipes/:id/approve
// @access  Private/Admin
const approveRecipe = asyncHandler(async (req, res) => {
  const { status, rejectionReason } = req.body;

  if (!['approved', 'rejected'].includes(status)) {
    res.status(400);
    throw new Error('Invalid status. Must be "approved" or "rejected".');
  }

  const recipe = await Recipe.findById(req.params.id);

  if (recipe) {
    recipe.status = status;
    const updatedRecipe = await recipe.save();

    // Create appropriate message
    let message = `Your recipe "${recipe.title}" has been ${status}.`;
    if (status === 'rejected' && rejectionReason) {
      message += ` Reason: ${rejectionReason}`;
    }

    // Notify seller
    await Notification.create({
      user: recipe.sellerId,
      message: message,
      type: 'RECIPE_STATUS',
      relatedEntity: recipe._id,
      entityModel: 'Recipe'
    });

    // Emit socket event
    if (req.io) {
      req.io.emit('RECIPE_STATUS_CHANGED', {
        recipeId: recipe._id,
        status: status,
        recipe: updatedRecipe,
        sellerId: recipe.sellerId
      });
    }

    res.json(updatedRecipe);
  } else {
    res.status(404);
    throw new Error('Recipe not found');
  }
});

// @desc    Rate a recipe
// @route   POST /api/recipes/:id/rate
// @access  Private
// rateRecipe removed - consolidated into socialController.rateItem

// @desc    Delete a recipe (Admin or Seller who owns it)
// @route   DELETE /api/recipes/:id
// @access  Private/Admin or Private/Seller
const deleteRecipe = asyncHandler(async (req, res) => {
  const recipe = await Recipe.findById(req.params.id);

  if (recipe) {
    if (req.user.role === 'admin' || recipe.sellerId.toString() === req.user._id.toString()) {
      await Recipe.deleteOne({ _id: req.params.id });

      // Emit socket event
      if (req.io) {
        req.io.emit('RECIPE_DELETED', { recipeId: req.params.id });
      }

      res.json({ message: 'Recipe removed' });
    } else {
      res.status(403);
      throw new Error('User not authorized to delete this recipe');
    }
  } else {
    res.status(404);
    throw new Error('Recipe not found');
  }
});

// moderateRecipeComment, reportRecipeComment, getFlaggedRecipeComments, commentOnRecipe removed - consolidated into socialController

module.exports = {
  submitRecipe,
  getRecipes,
  getMyRecipes,
  getPendingRecipes,
  getRecipeById,
  approveRecipe,
  deleteRecipe
};