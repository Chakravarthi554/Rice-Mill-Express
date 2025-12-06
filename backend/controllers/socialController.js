const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');
const Recipe = require('../models/Recipe');
const ForumPost = require('../models/ForumPost');
const User = require('../models/User'); // Added missing import
const Notification = require('../models/Notification');
const mongoose = require('mongoose');

// @desc    Like/Unlike an item
// @route   POST /api/:type/:id/like
// @access  Private
const likeItem = asyncHandler(async (req, res) => {
  const { type, id } = req.params;
  const userId = req.user._id;

  let Model;
  switch (type) {
    case 'products':
      Model = Product;
      break;
    case 'recipes':
      Model = Recipe;
      break;
    case 'forum':
      Model = ForumPost;
      break;
    default:
      res.status(400);
      throw new Error('Invalid type');
  }

  const item = await Model.findById(id);
  if (!item) {
    res.status(404);
    throw new Error(`${type.slice(0, -1)} not found`);
  }

  const hasLiked = item.likes.includes(userId);
  
  if (hasLiked) {
    // Unlike
    item.likes = item.likes.filter(like => like.toString() !== userId.toString());
  } else {
    // Like
    item.likes.push(userId);
  }

  await item.save();

  // Create notification for item owner (except when user likes their own item)
  if (item.userId && item.userId.toString() !== userId.toString() && !hasLiked) {
    await Notification.create({
      user: item.userId,
      type: 'SOCIAL_LIKE',
      message: `${req.user.name} liked your ${type.slice(0, -1)}`,
      relatedEntity: item._id,
      entityModel: type.slice(0, -1).charAt(0).toUpperCase() + type.slice(0, -1).slice(1)
    });
  }

  res.json({
    success: true,
    likes: item.likes.length,
    hasLiked: !hasLiked
  });
});

// @desc    Add comment to an item
// @route   POST /api/:type/:id/comment
// @access  Private
const addComment = asyncHandler(async (req, res) => {
  const { type, id } = req.params;
  const { text } = req.body;
  const userId = req.user._id;

  if (!text || text.trim() === '') {
    res.status(400);
    throw new Error('Comment text is required');
  }

  let Model;
  switch (type) {
    case 'products':
      Model = Product;
      break;
    case 'recipes':
      Model = Recipe;
      break;
    case 'forum':
      Model = ForumPost;
      break;
    default:
      res.status(400);
      throw new Error('Invalid type');
  }

  const item = await Model.findById(id);
  if (!item) {
    res.status(404);
    throw new Error(`${type.slice(0, -1)} not found`);
  }

  const comment = {
    user: userId,
    text: text.trim(),
    approved: req.user.role === 'admin' // Auto-approve admin comments
  };

  item.comments.push(comment);
  await item.save();

  const newComment = item.comments[item.comments.length - 1];

  // Create notification for item owner
  if (item.userId && item.userId.toString() !== userId.toString()) {
    await Notification.create({
      user: item.userId,
      type: 'SOCIAL_COMMENT',
      message: `${req.user.name} commented on your ${type.slice(0, -1)}`,
      relatedEntity: item._id,
      entityModel: type.slice(0, -1).charAt(0).toUpperCase() + type.slice(0, -1).slice(1)
    });
  }

  // Notify admin for approval if user is not admin
  if (req.user.role !== 'admin') {
    const adminUsers = await User.find({ role: 'admin' });
    for (const admin of adminUsers) {
      await Notification.create({
        user: admin._id,
        type: 'COMMENT_APPROVAL',
        message: `New comment from ${req.user.name} requires approval`,
        relatedEntity: item._id,
        entityModel: 'Comment'
      });
    }
  }

  res.status(201).json({
    success: true,
    comment: {
      _id: newComment._id,
      user: {
        _id: req.user._id,
        name: req.user.name,
        profilePic: req.user.profilePic
      },
      text: newComment.text,
      approved: newComment.approved,
      createdAt: newComment.createdAt
    }
  });
});

// @desc    Get comments for an item
// @route   GET /api/:type/:id/comments
// @access  Public
const getComments = asyncHandler(async (req, res) => {
  const { type, id } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  let Model;
  switch (type) {
    case 'products':
      Model = Product;
      break;
    case 'recipes':
      Model = Recipe;
      break;
    case 'forum':
      Model = ForumPost;
      break;
    default:
      res.status(400);
      throw new Error('Invalid type');
  }

  const item = await Model.findById(id)
    .select('comments')
    .populate('comments.user', 'name profilePic')
    .slice('comments', [skip, limit]);

  if (!item) {
    res.status(404);
    throw new Error(`${type.slice(0, -1)} not found`);
  }

  // Filter approved comments for non-admin users
  const comments = req.user?.role === 'admin' 
    ? item.comments 
    : item.comments.filter(comment => comment.approved);

  const total = await Model.findById(id).select('comments');
  const totalComments = total ? total.comments.length : 0;

  res.json({
    comments,
    page,
    pages: Math.ceil(totalComments / limit),
    total: totalComments
  });
});

// @desc    Approve comment (Admin only)
// @route   PUT /api/:type/:id/comments/:commentId/approve
// @access  Private/Admin
const approveComment = asyncHandler(async (req, res) => {
  const { type, id, commentId } = req.params;

  let Model;
  switch (type) {
    case 'products':
      Model = Product;
      break;
    case 'recipes':
      Model = Recipe;
      break;
    case 'forum':
      Model = ForumPost;
      break;
    default:
      res.status(400);
      throw new Error('Invalid type');
  }

  const item = await Model.findById(id);
  if (!item) {
    res.status(404);
    throw new Error(`${type.slice(0, -1)} not found`);
  }

  const comment = item.comments.id(commentId);
  if (!comment) {
    res.status(404);
    throw new Error('Comment not found');
  }

  comment.approved = true;
  await item.save();

  // Notify the comment author
  await Notification.create({
    user: comment.user,
    type: 'COMMENT_APPROVED',
    message: `Your comment has been approved and is now visible to everyone`,
    relatedEntity: item._id,
    entityModel: type.slice(0, -1).charAt(0).toUpperCase() + type.slice(0, -1).slice(1)
  });

  res.json({
    success: true,
    message: 'Comment approved successfully'
  });
});

// @desc    Delete comment
// @route   DELETE /api/:type/:id/comments/:commentId
// @access  Private (Admin or comment owner)
const deleteComment = asyncHandler(async (req, res) => {
  const { type, id, commentId } = req.params;
  const userId = req.user._id;

  let Model;
  switch (type) {
    case 'products':
      Model = Product;
      break;
    case 'recipes':
      Model = Recipe;
      break;
    case 'forum':
      Model = ForumPost;
      break;
    default:
      res.status(400);
      throw new Error('Invalid type');
  }

  const item = await Model.findById(id);
  if (!item) {
    res.status(404);
    throw new Error(`${type.slice(0, -1)} not found`);
  }

  const comment = item.comments.id(commentId);
  if (!comment) {
    res.status(404);
    throw new Error('Comment not found');
  }

  // Check if user is admin or comment owner
  if (req.user.role !== 'admin' && comment.user.toString() !== userId.toString()) {
    res.status(403);
    throw new Error('Not authorized to delete this comment');
  }

  comment.remove();
  await item.save();

  res.json({
    success: true,
    message: 'Comment deleted successfully'
  });
});

// @desc    Track share action
// @route   POST /api/:type/:id/share
// @access  Private
const trackShare = asyncHandler(async (req, res) => {
  const { type, id } = req.params;
  const { platform } = req.body;

  let Model;
  switch (type) {
    case 'products':
      Model = Product;
      break;
    case 'recipes':
      Model = Recipe;
      break;
    case 'forum':
      Model = ForumPost;
      break;
    default:
      res.status(400);
      throw new Error('Invalid type');
  }

  const item = await Model.findById(id);
  if (!item) {
    res.status(404);
    throw new Error(`${type.slice(0, -1)} not found`);
  }

  item.shares = (item.shares || 0) + 1;
  await item.save();

  // Create notification for item owner
  if (item.userId && item.userId.toString() !== req.user._id.toString()) {
    await Notification.create({
      user: item.userId,
      type: 'SOCIAL_SHARE',
      message: `${req.user.name} shared your ${type.slice(0, -1)} on ${platform}`,
      relatedEntity: item._id,
      entityModel: type.slice(0, -1).charAt(0).toUpperCase() + type.slice(0, -1).slice(1)
    });
  }

  res.json({
    success: true,
    shares: item.shares,
    message: `Shared on ${platform} successfully`
  });
});

// @desc    Get social analytics for admin
// @route   GET /api/admin/social-analytics
// @access  Private/Admin
const getSocialAnalytics = asyncHandler(async (req, res) => {
  const [productStats, recipeStats, forumStats] = await Promise.all([
    Product.aggregate([
      {
        $project: {
          likesCount: { $size: '$likes' },
          commentsCount: { $size: '$comments' },
          sharesCount: '$shares'
        }
      },
      {
        $group: {
          _id: null,
          totalLikes: { $sum: '$likesCount' },
          totalComments: { $sum: '$commentsCount' },
          totalShares: { $sum: '$sharesCount' },
          avgLikes: { $avg: '$likesCount' },
          avgComments: { $avg: '$commentsCount' },
          avgShares: { $avg: '$sharesCount' }
        }
      }
    ]),
    Recipe.aggregate([
      {
        $project: {
          likesCount: { $size: '$likes' },
          commentsCount: { $size: '$comments' },
          sharesCount: '$shares'
        }
      },
      {
        $group: {
          _id: null,
          totalLikes: { $sum: '$likesCount' },
          totalComments: { $sum: '$commentsCount' },
          totalShares: { $sum: '$sharesCount' },
          avgLikes: { $avg: '$likesCount' },
          avgComments: { $avg: '$commentsCount' },
          avgShares: { $avg: '$sharesCount' }
        }
      }
    ]),
    ForumPost.aggregate([
      {
        $project: {
          likesCount: { $size: '$likes' },
          commentsCount: { $size: '$comments' },
          sharesCount: '$shares'
        }
      },
      {
        $group: {
          _id: null,
          totalLikes: { $sum: '$likesCount' },
          totalComments: { $sum: '$commentsCount' },
          totalShares: { $sum: '$sharesCount' },
          avgLikes: { $avg: '$likesCount' },
          avgComments: { $avg: '$commentsCount' },
          avgShares: { $avg: '$sharesCount' }
        }
      }
    ])
  ]);

  const pendingComments = await Promise.all([
    Product.countDocuments({ 'comments.approved': false }),
    Recipe.countDocuments({ 'comments.approved': false }),
    ForumPost.countDocuments({ 'comments.approved': false })
  ]);

  const totalPendingComments = pendingComments.reduce((sum, count) => sum + count, 0);

  res.json({
    products: productStats[0] || { totalLikes: 0, totalComments: 0, totalShares: 0, avgLikes: 0, avgComments: 0, avgShares: 0 },
    recipes: recipeStats[0] || { totalLikes: 0, totalComments: 0, totalShares: 0, avgLikes: 0, avgComments: 0, avgShares: 0 },
    forum: forumStats[0] || { totalLikes: 0, totalComments: 0, totalShares: 0, avgLikes: 0, avgComments: 0, avgShares: 0 },
    pendingComments: totalPendingComments,
    pendingCommentsByType: {
      products: pendingComments[0],
      recipes: pendingComments[1],
      forum: pendingComments[2]
    }
  });
});

module.exports = {
  likeItem,
  addComment,
  getComments,
  approveComment,
  deleteComment,
  trackShare,
  getSocialAnalytics
};