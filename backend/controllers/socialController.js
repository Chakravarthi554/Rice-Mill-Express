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

  // 🔥 ENHANCED: Real-time socket events
  if (req.io) {
    req.io.emit('SOCIAL_UPDATE', {
      type: 'LIKE',
      itemType: type.slice(0, -1),
      itemId: id,
      userId: userId,
      likes: item.likes.length,
      hasLiked: !hasLiked,
      timestamp: new Date()
    });

    // Specifically for recipes if needed
    if (type === 'recipes') {
      req.io.emit('RECIPE_LIKED', {
        recipeId: id,
        likes: item.likes.length,
        userId: userId,
        action: hasLiked ? 'unliked' : 'liked'
      });
    }
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

  // 🔥 ENHANCED: Real-time socket events
  if (req.io) {
    // Notify all users in the item room
    req.io.to(`${type.slice(0, -1)}_${id}`).emit('SOCIAL_COMMENTED', {
      itemType: type.slice(0, -1),
      itemId: id,
      comment: {
        _id: newComment._id,
        user: { _id: req.user._id, name: req.user.name, profilePic: req.user.profilePic },
        text: newComment.text,
        approved: newComment.approved,
        createdAt: newComment.createdAt
      }
    });

    // Emit social update for real-time sync
    req.io.emit('SOCIAL_UPDATE', {
      type: 'COMMENT',
      itemType: type.slice(0, -1),
      itemId: id,
      userId: userId,
      comment: newComment,
      needsApproval: !newComment.approved,
      timestamp: new Date()
    });
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
    user: comment.user || comment.userId,
    type: 'COMMENT_APPROVED',
    message: `Your comment has been approved and is now visible to everyone`,
    relatedEntity: item._id,
    entityModel: type.slice(0, -1).charAt(0).toUpperCase() + type.slice(0, -1).slice(1)
  });

  // 🔥 ENHANCED: Real-time socket events for comment approval
  if (req.io) {
    // Broadcast to all users viewing this item
    req.io.emit('COMMENT_APPROVED', {
      itemType: type,
      itemId: id,
      commentId: commentId,
      comment: comment,
      timestamp: new Date()
    });

    // Notify the comment author specifically
    const commentOwnerId = comment.user || comment.userId;
    if (commentOwnerId) {
      req.io.to(`user_${commentOwnerId}`).emit('YOUR_COMMENT_APPROVED', {
        itemType: type,
        itemId: id,
        commentId: commentId,
        message: 'Your comment has been approved and is now visible to everyone'
      });
    }

    // Emit social update for real-time sync
    req.io.emit('SOCIAL_UPDATE', {
      type: 'COMMENT_APPROVED',
      itemType: type.slice(0, -1),
      itemId: id,
      commentId: commentId,
      comment: comment,
      timestamp: new Date()
    });

    console.log(`✅ Comment approved and broadcasted via socket: ${commentId} for ${type} ${id}`);
  }

  res.json({
    success: true,
    message: 'Comment approved successfully',
    comment: comment
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

// @desc    Report a comment
// @route   POST /api/:type/:id/comments/:commentId/report
// @access  Private
const reportComment = asyncHandler(async (req, res) => {
  const { type, id, commentId } = req.params;
  const { reason } = req.body;
  const userId = req.user._id;

  if (!reason) {
    res.status(400);
    throw new Error('Reporting reason is required');
  }

  let Model;
  switch (type) {
    case 'products': Model = Product; break;
    case 'recipes': Model = Recipe; break;
    case 'forum': Model = ForumPost; break;
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

  // Check if user already reported
  const alreadyReported = comment.reports?.some(r => r.userId.toString() === userId.toString());
  if (alreadyReported) {
    res.status(400);
    throw new Error('You have already reported this comment');
  }

  if (!comment.reports) comment.reports = [];
  comment.reports.push({ userId, reason });

  // Auto-flag if reaches threshold (e.g., 3 reports)
  if (comment.reports.length >= 3) {
    comment.isFlagged = true;
  }

  await item.save();

  // Notify socket if flagged
  if (comment.isFlagged && req.io) {
    req.io.to('admin_room').emit('COMMENT_FLAGGED', {
      itemType: type,
      itemId: id,
      commentId,
      reportsCount: comment.reports.length
    });
  }

  res.json({ success: true, message: 'Comment reported successfully' });
});

// @desc    Get all flagged comments
// @route   GET /api/social/flagged
// @access  Private/Admin
const getFlaggedComments = asyncHandler(async (req, res) => {
  const products = await Product.find({ 'comments.isFlagged': true }).select('name comments');
  const recipes = await Recipe.find({ 'comments.isFlagged': true }).select('title comments');
  const forum = await ForumPost.find({ 'comments.isFlagged': true }).select('title comments');

  const flagged = [];

  const extractFlagged = (items, type) => {
    items.forEach(item => {
      item.comments.forEach(c => {
        if (c.isFlagged) {
          flagged.push({
            itemId: item._id,
            itemName: item.name || item.title,
            itemType: type,
            comment: c
          });
        }
      });
    });
  };

  extractFlagged(products, 'product');
  extractFlagged(recipes, 'recipe');
  extractFlagged(forum, 'forum');

  res.json({ success: true, count: flagged.length, comments: flagged });
});

// @desc    Moderate a comment (Approve/Reject/Delete)
// @route   PUT /api/:type/:id/comments/:commentId/moderate
// @access  Private/Admin
const moderateComment = asyncHandler(async (req, res) => {
  const { type, id, commentId } = req.params;
  const { action, notes } = req.body; // action: approve, reject, delete

  let Model;
  switch (type) {
    case 'products': Model = Product; break;
    case 'recipes': Model = Recipe; break;
    case 'forum': Model = ForumPost; break;
    default:
      res.status(400);
      throw new Error('Invalid type');
  }

  const item = await Model.findById(id);
  if (!item) {
    res.status(404);
    throw new Error('Item not found');
  }

  const comment = item.comments.id(commentId);
  if (!comment) {
    res.status(404);
    throw new Error('Comment not found');
  }

  if (action === 'approve') {
    comment.approved = true;
    comment.isFlagged = false;
  } else if (action === 'reject') {
    comment.approved = false;
    comment.isFlagged = false;
  } else if (action === 'delete') {
    item.comments.pull(commentId);
  } else {
    res.status(400);
    throw new Error('Invalid action');
  }

  comment.moderationNotes = notes;
  comment.moderatedBy = req.user._id;
  comment.moderatedAt = new Date();

  await item.save();

  // Socket notification
  if (req.io) {
    req.io.emit('SOCIAL_UPDATE', {
      type: action === 'delete' ? 'COMMENT_DELETED' : 'COMMENT_MODERATED',
      itemType: type.slice(0, -1),
      itemId: id,
      commentId,
      status: comment.approved ? 'approved' : 'pending',
      action
    });
  }

  res.json({ success: true, message: `Comment ${action}d successfully` });
});

// @desc    Get engagement analytics for a specific item
// @route   GET /api/:type/:id/engagement
// @access  Private
const getEngagementAnalytics = asyncHandler(async (req, res) => {
  const { type, id } = req.params;

  let Model;
  switch (type) {
    case 'products': Model = Product; break;
    case 'recipes': Model = Recipe; break;
    case 'forum': Model = ForumPost; break;
    default:
      res.status(400);
      throw new Error('Invalid type');
  }

  const item = await Model.findById(id);
  if (!item) {
    res.status(404);
    throw new Error('Item not found');
  }

  const ratingsCount = item.ratings?.length || 0;
  const commentsCount = item.comments?.length || 0;
  const likesCount = item.likes?.length || 0;
  const sharesCount = item.shares || 0;

  // Simple engagement score
  const engagementScore = (likesCount * 1) + (commentsCount * 2) + (ratingsCount * 1.5) + (sharesCount * 3);

  res.json({
    success: true,
    stats: {
      likes: likesCount,
      comments: commentsCount,
      ratings: ratingsCount,
      shares: sharesCount,
      engagementScore: engagementScore.toFixed(2),
      averageRating: item.averageRating || 0
    }
  });
});

// @desc    Edit comment
// @route   PUT /api/:type/:id/comments/:commentId
// @access  Private (Comment owner only)
const editComment = asyncHandler(async (req, res) => {
  const { type, id, commentId } = req.params;
  const { text } = req.body;
  const userId = req.user._id;

  if (!text || text.trim() === '') {
    res.status(400);
    throw new Error('Comment text is required');
  }

  if (text.length > 1000) {
    res.status(400);
    throw new Error('Comment must be 1000 characters or less');
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

  const comment = item.comments.id(commentId);
  if (!comment) {
    res.status(404);
    throw new Error('Comment not found');
  }

  // Check if user owns the comment
  if (comment.user?.toString() !== userId.toString() && comment.userId?.toString() !== userId.toString()) {
    res.status(403);
    throw new Error('Not authorized to edit this comment');
  }

  // Detect mentions (@username)
  const mentionRegex = /@(\w+)/g;
  const mentions = [];
  let match;
  while ((match = mentionRegex.exec(text)) !== null) {
    const username = match[1];
    const mentionedUser = await User.findOne({ name: new RegExp(`^${username}$`, 'i') });
    if (mentionedUser) {
      mentions.push(mentionedUser._id);
    }
  }

  comment.text = text.trim();
  comment.isEdited = true;
  comment.editedAt = new Date();
  comment.mentions = mentions;
  await item.save();

  // Notify mentioned users
  for (const mentionedUserId of mentions) {
    if (mentionedUserId.toString() !== userId.toString()) {
      await Notification.create({
        user: mentionedUserId,
        type: 'MENTION',
        message: `${req.user.name} mentioned you in a comment`,
        relatedEntity: item._id,
        entityModel: type.slice(0, -1).charAt(0).toUpperCase() + type.slice(0, -1).slice(1)
      });
    }
  }

  res.json({
    success: true,
    comment: {
      _id: comment._id,
      text: comment.text,
      isEdited: comment.isEdited,
      editedAt: comment.editedAt,
      mentions: comment.mentions
    },
    message: 'Comment updated successfully'
  });
});

// @desc    Like/Unlike a comment
// @route   POST /api/:type/:id/comments/:commentId/like
// @access  Private
const likeComment = asyncHandler(async (req, res) => {
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

  const hasLiked = comment.likes?.includes(userId) || false;

  if (hasLiked) {
    // Unlike
    comment.likes = comment.likes.filter(like => like.toString() !== userId.toString());
  } else {
    // Like
    if (!comment.likes) comment.likes = [];
    comment.likes.push(userId);
  }

  await item.save();

  // Notify comment owner (except when user likes their own comment)
  const commentOwnerId = comment.user || comment.userId;
  if (commentOwnerId && commentOwnerId.toString() !== userId.toString() && !hasLiked) {
    await Notification.create({
      user: commentOwnerId,
      type: 'COMMENT_LIKE',
      message: `${req.user.name} liked your comment`,
      relatedEntity: item._id,
      entityModel: type.slice(0, -1).charAt(0).toUpperCase() + type.slice(0, -1).slice(1)
    });
  }

  // 🔥 ENHANCED: Real-time socket events
  if (req.io) {
    req.io.emit('SOCIAL_UPDATE', {
      type: 'COMMENT_LIKE',
      itemType: type.slice(0, -1),
      itemId: id,
      commentId: commentId,
      userId: userId,
      likes: comment.likes?.length || 0,
      hasLiked: !hasLiked,
      timestamp: new Date()
    });
  }

  res.json({
    success: true,
    likes: comment.likes?.length || 0,
    hasLiked: !hasLiked
  });
});

// @desc    Reply to a comment (nested comment)
// @route   POST /api/:type/:id/comments/:commentId/reply
// @access  Private
const replyToComment = asyncHandler(async (req, res) => {
  const { type, id, commentId } = req.params;
  const { text } = req.body;
  const userId = req.user._id;

  if (!text || text.trim() === '') {
    res.status(400);
    throw new Error('Reply text is required');
  }

  if (text.length > 1000) {
    res.status(400);
    throw new Error('Reply must be 1000 characters or less');
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

  const parentComment = item.comments.id(commentId);
  if (!parentComment) {
    res.status(404);
    throw new Error('Parent comment not found');
  }

  // Detect mentions
  const mentionRegex = /@(\w+)/g;
  const mentions = [];
  let match;
  while ((match = mentionRegex.exec(text)) !== null) {
    const username = match[1];
    const mentionedUser = await User.findOne({ name: new RegExp(`^${username}$`, 'i') });
    if (mentionedUser) {
      mentions.push(mentionedUser._id);
    }
  }

  const reply = {
    user: userId,
    userId: userId,
    text: text.trim(),
    parentComment: commentId,
    mentions: mentions,
    approved: req.user.role === 'admin' // Auto-approve admin replies
  };

  item.comments.push(reply);
  await item.save();

  const newReply = item.comments[item.comments.length - 1];

  // Notify parent comment owner
  const parentCommentOwnerId = parentComment.user || parentComment.userId;
  if (parentCommentOwnerId && parentCommentOwnerId.toString() !== userId.toString()) {
    await Notification.create({
      user: parentCommentOwnerId,
      type: 'COMMENT_REPLY',
      message: `${req.user.name} replied to your comment`,
      relatedEntity: item._id,
      entityModel: type.slice(0, -1).charAt(0).toUpperCase() + type.slice(0, -1).slice(1)
    });
  }

  // Notify mentioned users
  for (const mentionedUserId of mentions) {
    if (mentionedUserId.toString() !== userId.toString()) {
      await Notification.create({
        user: mentionedUserId,
        type: 'MENTION',
        message: `${req.user.name} mentioned you in a reply`,
        relatedEntity: item._id,
        entityModel: type.slice(0, -1).charAt(0).toUpperCase() + type.slice(0, -1).slice(1)
      });
    }
  }

  res.status(201).json({
    success: true,
    reply: {
      _id: newReply._id,
      user: {
        _id: req.user._id,
        name: req.user.name,
        profilePic: req.user.profilePic
      },
      text: newReply.text,
      parentComment: newReply.parentComment,
      mentions: newReply.mentions,
      approved: newReply.approved,
      createdAt: newReply.createdAt
    }
  });
});

// @desc    Get rating distribution for a recipe
// @route   GET /api/recipes/:id/rating-distribution
// @access  Public
const getRatingDistribution = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const recipe = await Recipe.findById(id).select('ratings averageRating numReviews');

  if (!recipe) {
    res.status(404);
    throw new Error('Recipe not found');
  }

  // Calculate distribution
  const distribution = {
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0
  };

  recipe.ratings.forEach(rating => {
    distribution[rating.rating] = (distribution[rating.rating] || 0) + 1;
  });

  const total = recipe.ratings.length;
  const percentages = {};

  for (let i = 1; i <= 5; i++) {
    percentages[i] = total > 0 ? Math.round((distribution[i] / total) * 100) : 0;
  }

  res.json({
    success: true,
    averageRating: recipe.averageRating || 0,
    totalRatings: total,
    distribution: distribution,
    percentages: percentages
  });
});

// @desc    Get comments sorted by criteria
// @route   GET /api/:type/:id/comments/sorted
// @access  Public
const getSortedComments = asyncHandler(async (req, res) => {
  try {
    const { type, id } = req.params;
    const { sortBy = 'recent', page = 1, limit = 20 } = req.query;
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
        return res.status(400).json({
          success: false,
          message: 'Invalid type. Must be products, recipes, or forum'
        });
    }

    const item = await Model.findById(id)
      .select('comments')
      .populate('comments.userId', 'name profilePic');

    if (!item) {
      return res.status(404).json({
        success: false,
        message: `${type.slice(0, -1)} not found`
      });
    }

    // Convert to plain object to avoid Mongoose issues
    const itemObj = item.toObject ? item.toObject() : item;

    // Safe access to comments array
    const allComments = itemObj.comments || [];

    // Handle case where comments don't exist or are empty
    if (!Array.isArray(allComments) || allComments.length === 0) {
      return res.status(200).json({
        success: true,
        comments: [],
        total: 0,
        page: Number(page),
        pages: 0,
        limit: Number(limit)
      });
    }

    // Filter approved comments for non-admin users
    // IMPORTANT: Schema uses 'approved', not 'isApproved'
    let comments = req.user?.role === 'admin'
      ? allComments
      : allComments.filter(comment => comment && comment.approved === true && !comment.isFlagged);

    // Filter out replies (only show top-level comments)
    comments = comments.filter(comment => comment && !comment.parentComment);

    // Handle empty comments after filtering
    if (!comments || comments.length === 0) {
      return res.status(200).json({
        success: true,
        comments: [],
        total: 0,
        page: Number(page),
        pages: 0,
        limit: Number(limit)
      });
    }

    // Sort comments safely
    try {
      switch (sortBy) {
        case 'top':
          comments.sort((a, b) => {
            const aLikes = (a && a.likes && Array.isArray(a.likes)) ? a.likes.length : 0;
            const bLikes = (b && b.likes && Array.isArray(b.likes)) ? b.likes.length : 0;
            return bLikes - aLikes;
          });
          break;
        case 'oldest':
          comments.sort((a, b) => {
            const aDate = a && a.createdAt ? new Date(a.createdAt) : new Date(0);
            const bDate = b && b.createdAt ? new Date(b.createdAt) : new Date(0);
            return aDate - bDate;
          });
          break;
        case 'recent':
        default:
          comments.sort((a, b) => {
            const aDate = a && a.createdAt ? new Date(a.createdAt) : new Date(0);
            const bDate = b && b.createdAt ? new Date(b.createdAt) : new Date(0);
            return bDate - aDate;
          });
          break;
      }
    } catch (sortError) {
      console.error('Error sorting comments:', sortError);
      // Continue with unsorted comments rather than crashing
    }

    // Apply pagination safely
    const paginatedComments = comments.slice(skip, Math.min(skip + Number(limit), comments.length));

    return res.status(200).json({
      success: true,
      comments: paginatedComments,
      total: comments.length,
      page: Number(page),
      pages: Math.ceil(comments.length / Number(limit)),
      limit: Number(limit)
    });
  } catch (error) {
    console.error('❌ getSortedComments error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching sorted comments',
      error: error.message
    });
  }
});

// @desc    Get replies for a comment
// @route   GET /api/:type/:id/comments/:commentId/replies
// @access  Public
const getCommentReplies = asyncHandler(async (req, res) => {
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

  const item = await Model.findById(id)
    .select('comments')
    .populate('comments.user comments.userId', 'name profilePic');

  if (!item) {
    res.status(404);
    throw new Error(`${type.slice(0, -1)} not found`);
  }

  // Get all replies to this comment
  let replies = item.comments.filter(comment =>
    comment.parentComment?.toString() === commentId
  );

  // Filter approved replies for non-admin users
  if (req.user?.role !== 'admin') {
    replies = replies.filter(reply => reply.approved && !reply.isFlagged);
  }

  // Sort by creation date (oldest first for replies)
  replies.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  res.json({
    success: true,
    replies: replies,
    total: replies.length
  });
});

// @desc    Get social stats for an item (likes, comments, etc)
// @route   GET /api/:type/:id/stats
// @access  Public
const getSocialStats = asyncHandler(async (req, res) => {
  const { type, id } = req.params;

  let Model;
  switch (type) {
    case 'products': Model = Product; break;
    case 'recipes': Model = Recipe; break;
    case 'forum': Model = ForumPost; break;
    default:
      res.status(400);
      throw new Error('Invalid type');
  }

  const item = await Model.findById(id);
  if (!item) {
    res.status(404);
    throw new Error(`${type.slice(0, -1)} not found`);
  }

  res.json({
    success: true,
    stats: {
      likes: item.likes?.length || 0,
      comments: item.comments?.length || 0,
      shares: item.shares || 0,
      averageRating: item.averageRating || 0,
      numReviews: item.numReviews || 0
    }
  });
});

module.exports = {
  likeItem,
  addComment,
  getComments,
  approveComment,
  deleteComment,
  getSocialStats,
  getCommentReplies,
  getSortedComments,
  getRatingDistribution,
  reportComment,
  getFlaggedComments,
  moderateComment,
  getEngagementAnalytics,
  editComment,
  likeComment,
  trackShare,
  getSocialAnalytics,
  replyToComment
};