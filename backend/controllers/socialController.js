const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');
const Recipe = require('../models/Recipe');
const ForumPost = require('../models/ForumPost');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Comment = require('../models/Comment');
const Like = require('../models/Like');
const Rating = require('../models/Rating');
const Share = require('../models/Share');
const Order = require('../models/Order');
const mongoose = require('mongoose');
const { anonymizeUser } = require('../utils/userVisibility');
const { getAsync, setAsync, client: redisClient } = require('../utils/redis');

// Helper to reconcile cached counters with actual document counts
const syncEngagementCounts = async (Model, targetId) => {
  const [likesCount, commentsCount, sharesCount] = await Promise.all([
    Like.countDocuments({ targetId }),
    Comment.countDocuments({ targetId, approved: true }), // Only approved comments
    Share.countDocuments({ targetId })
  ]);

  const updateData = { likesCount, commentsCount, sharesCount };

  // also handle average rating for Recipes if possible, but usually handled by rateItem
  const updatedItem = await Model.findByIdAndUpdate(targetId, { $set: updateData }, { new: true });

  // Invalidate Redis cache
  const cacheKey = `engagement:${targetId}`;
  await setAsync(cacheKey, JSON.stringify(updatedItem), 'EX', 3600);

  return updatedItem;
};

// Helper for atomic counter updates and Redis cache invalidation
const updateEngagementCount = async (Model, targetId, field, amount) => {
  // Use atomic increment but also safeguard against negatives
  const item = await Model.findById(targetId).select(field);
  let finalAmount = amount;

  if (item && item[field] + amount < 0) {
    finalAmount = -item[field]; // Set to 0
  }

  const update = { $inc: { [field]: finalAmount } };
  const updatedItem = await Model.findByIdAndUpdate(targetId, update, { new: true });

  // Trigger a full sync in the background for eventual consistency
  syncEngagementCounts(Model, targetId).catch(err => console.error('Sync error:', err));

  // Invalidate Redis cache
  const cacheKey = `engagement:${targetId}`;
  await setAsync(cacheKey, JSON.stringify(updatedItem), 'EX', 3600);

  return updatedItem;
};


// @desc    Like/Unlike an item
// @route   POST /api/:type/:id/like
// @access  Private
const likeItem = asyncHandler(async (req, res) => {
  const { type, id } = req.params;
  const userId = req.user._id;

  let Model;
  let targetType;
  switch (type) {
    case 'products': Model = Product; targetType = 'Product'; break;
    case 'recipes': Model = Recipe; targetType = 'Recipe'; break;
    case 'forum': Model = ForumPost; targetType = 'ForumPost'; break;
    default:
      res.status(400);
      throw new Error('Invalid type');
  }

  const existingLike = await Like.findOne({ targetId: id, userId });

  if (existingLike) {
    // Unlike
    await Like.findByIdAndDelete(existingLike._id);
    const updatedItem = await updateEngagementCount(Model, id, 'likesCount', -1);

    // 🔥 Real-time socket events
    if (req.io) {
      req.io.to(`${type.slice(0, -1)}_${id}`).emit('SOCIAL_UPDATE', {
        type: 'LIKE_UPDATED',
        itemType: targetType,
        itemId: id,
        likesCount: updatedItem.likesCount,
        userLiked: false,
        userId
      });
    }

    return res.json({ success: true, likesCount: updatedItem.likesCount, userLiked: false });
  } else {
    // Like
    await Like.create({ targetId: id, targetType, userId });
    const updatedItem = await updateEngagementCount(Model, id, 'likesCount', 1);

    // Create notification
    // --- Item Owner & Notification Fix ---
    const itemOwnerId = updatedItem.sellerId || updatedItem.seller || updatedItem.userId;

    if (itemOwnerId && itemOwnerId.toString() !== userId.toString()) {
      const owner = await User.findById(itemOwnerId).select('role');
      const senderName = anonymizeUser(req.user, owner)?.name || 'Someone';

      await Notification.create({
        user: itemOwnerId,
        type: 'SOCIAL_LIKE',
        message: `${senderName} liked your ${targetType.toLowerCase()}`,
        relatedEntity: id,
        entityModel: targetType
      });
    }

    // 🔥 Real-time socket events
    if (req.io) {
      // Room for the item itself
      const itemRoom = `${type.slice(0, -1)}_${id}`;
      req.io.to(itemRoom).emit('SOCIAL_UPDATE', {
        type: 'LIKE_UPDATED',
        itemType: targetType,
        itemId: id,
        likesCount: updatedItem.likesCount,
        userLiked: true,
        userId
      });

      // room for the seller/owner
      if (itemOwnerId) {
        req.io.to(`seller_${itemOwnerId}`).emit('ENGAGEMENT_UPDATE', {
          type: 'NEW_ENGAGEMENT',
          engagementType: 'like',
          itemType: targetType,
          itemId: id,
          userName: anonymizeUser(req.user, { role: 'seller' }).name, // Sellers see based on privacy settings
          userProfilePic: anonymizeUser(req.user, { role: 'seller' }).profilePic,
          createdAt: new Date(),
          counts: {
            likes: updatedItem.likesCount,
            comments: updatedItem.commentsCount,
            shares: updatedItem.sharesCount,
            rating: updatedItem.averageRating || updatedItem.rating
          }
        });
      }
    }

    return res.json({ success: true, likesCount: updatedItem.likesCount, userLiked: true });
  }
});

// @desc    Add comment to an item
// @route   POST /api/:type/:id/comment
// @access  Private
const addComment = asyncHandler(async (req, res) => {
  const { type, id } = req.params;
  const { text, parentCommentId } = req.body;
  const userId = req.user._id;

  if (!text || text.trim() === '') {
    res.status(400);
    throw new Error('Comment text is required');
  }

  let targetType;
  let Model;
  switch (type) {
    case 'products': Model = Product; targetType = 'Product'; break;
    case 'recipes': Model = Recipe; targetType = 'Recipe'; break;
    case 'forum': Model = ForumPost; targetType = 'ForumPost'; break;
    default:
      res.status(400);
      throw new Error('Invalid type');
  }

  const comment = await Comment.create({
    targetId: id,
    targetType,
    userId,
    content: text.trim(),
    parentCommentId: parentCommentId || null,
    approved: true
  });

  const updatedItem = await updateEngagementCount(Model, id, 'commentsCount', 1);

  const populatedComment = await Comment.findById(comment._id).populate('userId', 'name profilePic isProfilePublic privacySettings');

  // Notify owner
  const itemOwnerId = updatedItem.sellerId || updatedItem.seller || updatedItem.userId;
  if (itemOwnerId && itemOwnerId.toString() !== userId.toString()) {
    const owner = await User.findById(itemOwnerId).select('role');
    const senderName = anonymizeUser(req.user, owner)?.name || 'Someone';

    await Notification.create({
      user: itemOwnerId,
      type: 'SOCIAL_COMMENT',
      message: `${senderName} commented on your ${targetType.toLowerCase()}`,
      relatedEntity: id,
      entityModel: targetType
    });
  }

  // 🔥 Real-time socket events
  if (req.io) {
    const itemRoom = `${type.slice(0, -1)}_${id}`;

    // Create anonymized version for broadcast
    const anonymizedComment = populatedComment.toObject();
    anonymizedComment.userId = anonymizeUser(populatedComment.userId, null);

    req.io.to(itemRoom).emit('SOCIAL_UPDATE', {
      type: 'COMMENT_ADDED',
      itemType: targetType,
      itemId: id,
      comment: anonymizedComment,
      commentsCount: updatedItem.commentsCount
    });

    // Seller specific update
    if (itemOwnerId) {
      req.io.to(`seller_${itemOwnerId}`).emit('ENGAGEMENT_UPDATE', {
        type: 'NEW_ENGAGEMENT',
        engagementType: 'comment',
        itemType: targetType,
        itemId: id,
        userName: anonymizeUser(req.user, { role: 'seller' }).name,
        userProfilePic: anonymizeUser(req.user, { role: 'seller' }).profilePic,
        createdAt: new Date(),
        counts: {
          likes: updatedItem.likesCount,
          comments: updatedItem.commentsCount,
          shares: updatedItem.sharesCount,
          rating: updatedItem.averageRating || updatedItem.rating
        }
      });
    }
  }

  res.status(201).json({
    success: true,
    comment: populatedComment,
    commentsCount: updatedItem.commentsCount
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

  let targetType;
  switch (type) {
    case 'products': targetType = 'Product'; break;
    case 'recipes': targetType = 'Recipe'; break;
    case 'forum': targetType = 'ForumPost'; break;
    default:
      res.status(400);
      throw new Error('Invalid type');
  }

  const query = { targetId: id, targetType, parentCommentId: null };
  if (req.user?.role !== 'admin') {
    query.approved = true;
  }

  const comments = await Comment.find(query)
    .populate('userId', 'name profilePic isProfilePublic privacySettings')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const anonymizedComments = comments.map(comment => {
    const commentObj = comment.toObject();
    commentObj.userId = anonymizeUser(comment.userId, req.user);
    return commentObj;
  });

  const totalComments = await Comment.countDocuments(query);

  res.json({
    comments: anonymizedComments,
    page,
    pages: Math.ceil(totalComments / limit),
    total: totalComments
  });
});

// @desc    Approve comment (Admin only)
// @route   PUT /api/:type/:id/comments/:commentId/approve
// @access  Private/Admin
const approveComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  const comment = await Comment.findById(commentId);
  if (!comment) {
    res.status(404);
    throw new Error('Comment not found');
  }

  comment.approved = true;
  await comment.save();

  // Notify the comment author
  await Notification.create({
    user: comment.userId,
    type: 'COMMENT_APPROVED',
    message: `Your comment has been approved and is now visible to everyone`,
    relatedEntity: comment.targetId,
    entityModel: comment.targetType
  });

  // 🔥 Real-time socket events
  if (req.io) {
    req.io.to(`${comment.targetType.toLowerCase()}_${comment.targetId}`).emit('SOCIAL_UPDATE', {
      type: 'COMMENT_APPROVED',
      commentId: comment._id,
      itemId: comment.targetId
    });
  }

  res.json({ success: true, message: 'Comment approved successfully', comment });
});

// @desc    Delete comment
// @route   DELETE /api/:type/:id/comments/:commentId
// @access  Private (Admin or comment owner)
const deleteComment = asyncHandler(async (req, res) => {
  const { type, id, commentId } = req.params;
  const userId = req.user._id;

  const comment = await Comment.findById(commentId);
  if (!comment) {
    res.status(404);
    throw new Error('Comment not found');
  }

  // Author or admin check
  if (comment.userId.toString() !== userId.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to delete this comment');
  }

  await Comment.findByIdAndDelete(commentId);
  await Comment.deleteMany({ parentCommentId: commentId }); // Remove replies

  let Model;
  switch (type) {
    case 'products': Model = Product; break;
    case 'recipes': Model = Recipe; break;
    case 'forum': Model = ForumPost; break;
    default:
      res.status(400);
      throw new Error('Invalid type');
  }

  const updatedItem = await updateEngagementCount(Model, id, 'commentsCount', -1);

  // 🔥 Real-time socket events
  if (req.io) {
    const prefix = type.endsWith('s') ? type.slice(0, -1) : type;
    const room = `${prefix.toLowerCase()}_${id}`;

    req.io.to(room).emit('SOCIAL_UPDATE', {
      type: 'COMMENT_DELETED',
      itemId: id,
      commentId,
      commentsCount: updatedItem.commentsCount
    });

    // Global update
    req.io.emit('SOCIAL_UPDATE', {
      type: 'COMMENT_DELETED',
      itemId: id,
      itemType: type,
      commentId,
      commentsCount: updatedItem.commentsCount
    });
  }

  res.json({ success: true, message: 'Comment deleted successfully', commentsCount: updatedItem.commentsCount });
});

// @desc    Track share action
// @route   POST /api/:type/:id/share
// @access  Private
const trackShare = asyncHandler(async (req, res) => {
  const { type, id } = req.params;
  const { platform } = req.body || {}; // Fallback if body is missing
  const userId = req.user._id;

  let Model;
  let targetType;
  switch (type) {
    case 'products': Model = Product; targetType = 'Product'; break;
    case 'recipes': Model = Recipe; targetType = 'Recipe'; break;
    case 'forum': Model = ForumPost; targetType = 'ForumPost'; break;
    default:
      res.status(400);
      throw new Error('Invalid type');
  }

  await Share.create({
    targetId: id,
    targetType,
    userId,
    platform: platform || 'unknown'
  });

  const updatedItem = await updateEngagementCount(Model, id, 'sharesCount', 1);

  // 🔥 Real-time socket events
  if (req.io) {
    const prefix = type.endsWith('s') ? type.slice(0, -1) : type;
    const room = `${prefix.toLowerCase()}_${id}`;

    req.io.to(room).emit('SOCIAL_UPDATE', {
      type: 'SHARE_UPDATED',
      itemId: id,
      sharesCount: updatedItem.sharesCount
    });

    // Global update
    req.io.emit('SOCIAL_UPDATE', {
      type: 'SHARE_UPDATED',
      itemId: id,
      itemType: type,
      sharesCount: updatedItem.sharesCount
    });

    // Seller specific notification
    const itemOwnerId = updatedItem.sellerId || updatedItem.seller || updatedItem.userId;
    if (itemOwnerId) {
      req.io.to(`seller_${itemOwnerId}`).emit('ENGAGEMENT_UPDATE', {
        type: 'NEW_ENGAGEMENT',
        engagementType: 'share',
        itemType: targetType,
        itemId: id,
        platform: platform || 'unknown',
        userName: req.user.name,
        createdAt: new Date(),
        counts: {
          likes: updatedItem.likesCount,
          comments: updatedItem.commentsCount,
          shares: updatedItem.sharesCount,
          rating: updatedItem.averageRating || updatedItem.rating
        }
      });
    }
  }

  res.json({ success: true, sharesCount: updatedItem.sharesCount });
});

const rateItem = asyncHandler(async (req, res) => {
  const { type, id } = req.params;
  const { rating, comment } = req.body;
  const userId = req.user._id;

  if (!rating || rating < 1 || rating > 5) {
    res.status(400);
    throw new Error('Please provide a rating between 1 and 5');
  }

  let Model;
  let targetType;
  switch (type) {
    case 'products': Model = Product; targetType = 'Product'; break;
    case 'recipes': Model = Recipe; targetType = 'Recipe'; break;
    default:
      res.status(400);
      throw new Error('Invalid type for rating');
  }

  let existingRating = await Rating.findOne({ targetId: id, userId });
  if (existingRating) {
    existingRating.rating = Number(rating);
    existingRating.comment = comment;
    await existingRating.save();
  } else {
    await Rating.create({
      targetId: id,
      targetType,
      userId,
      rating: Number(rating),
      comment,
      approved: true
    });
  }

  try {
    // Recalculate average and distribution
    const stats = await Rating.aggregate([
      { $match: { targetId: new mongoose.Types.ObjectId(id), approved: true } },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      }
    ]);

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalCount = 0;
    let totalSum = 0;

    stats.forEach(stat => {
      distribution[stat._id] = stat.count;
      totalCount += stat.count;
      totalSum += stat._id * stat.count;
    });

    const averageRating = totalCount > 0 ? totalSum / totalCount : 0;

    const updateData = {
      numReviews: totalCount,
      ratingDistribution: distribution
    };

    if (targetType === 'Recipe') {
      updateData.averageRating = averageRating;
    } else {
      updateData.rating = averageRating;
    }

    const item = await Model.findByIdAndUpdate(id, updateData, { new: true });

    if (!item) {
      res.status(404);
      throw new Error('Item not found for rating update');
    }

    // Invalidate cache
    await setAsync(`engagement:${id}`, JSON.stringify(item), 'EX', 3600);

    // 🔥 Real-time socket events
    if (req.io) {
      req.io.to(`${type.slice(0, -1)}_${id}`).emit('SOCIAL_UPDATE', {
        type: 'RATING_UPDATED',
        itemId: id,
        rating: item.averageRating || item.rating,
        numReviews: item.numReviews,
        distribution: item.ratingDistribution
      });

      // Seller specific notification
      const itemOwnerId = item.sellerId || item.seller || item.userId;

      // Add persistent Notification
      if (itemOwnerId && itemOwnerId.toString() !== userId.toString()) {
        const owner = await User.findById(itemOwnerId).select('role');
        const senderName = anonymizeUser(req.user, owner)?.name || 'Someone';

        await Notification.create({
          user: itemOwnerId,
          type: 'SOCIAL_RATE',
          message: `${senderName} rated your ${targetType.toLowerCase()} ${rating} stars`,
          relatedEntity: id,
          entityModel: targetType
        });
      }

      if (itemOwnerId) {
        req.io.to(`seller_${itemOwnerId}`).emit('ENGAGEMENT_UPDATE', {
          type: 'NEW_ENGAGEMENT',
          engagementType: 'rating',
          itemType: targetType,
          itemId: id,
          rating: Number(rating),
          userName: anonymizeUser(req.user, { role: 'seller' }).name,
          userProfilePic: anonymizeUser(req.user, { role: 'seller' }).profilePic,
          createdAt: new Date(),
          counts: {
            likes: item.likesCount,
            comments: item.commentsCount,
            shares: item.sharesCount,
            rating: item.averageRating || item.rating
          }
        });
      }
    }

    res.json({
      success: true,
      rating: item.rating,
      numReviews: item.numReviews,
      distribution: item.ratingDistribution
    });
  } catch (error) {
    console.error('Error in rateItem:', error);
    res.status(500);
    throw new Error('Server error updating rating');
  }
});

// @desc    Get social analytics for admin
// @route   GET /api/admin/social-analytics
// @access  Private/Admin
const getSocialAnalytics = asyncHandler(async (req, res) => {
  const [productStats, recipeStats, forumStats] = await Promise.all([
    Product.aggregate([
      {
        $project: {
          likesCount: 1,
          commentsCount: 1,
          sharesCount: 1
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
          likesCount: 1,
          commentsCount: 1,
          sharesCount: 1
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
          likesCount: 1,
          commentsCount: 1,
          sharesCount: 1
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
    Comment.countDocuments({ targetType: 'Product', approved: false }),
    Comment.countDocuments({ targetType: 'Recipe', approved: false }),
    Comment.countDocuments({ targetType: 'ForumPost', approved: false })
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
  const { commentId } = req.params;
  const { reason } = req.body;
  const userId = req.user._id;

  if (!reason) {
    res.status(400);
    throw new Error('Reporting reason is required');
  }

  const comment = await Comment.findById(commentId);
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

  await comment.save();

  // Notify socket if flagged
  if (comment.isFlagged && req.io) {
    req.io.to('admin_room').emit('COMMENT_FLAGGED', {
      itemType: comment.targetType,
      itemId: comment.targetId,
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
  const flagged = await Comment.find({ isFlagged: true })
    .populate('userId', 'name profilePic')
    .sort({ createdAt: -1 });

  res.json({ success: true, count: flagged.length, comments: flagged });
});

// @desc    Moderate a comment (Approve/Reject/Delete)
// @route   PUT /api/:type/:id/comments/:commentId/moderate
// @access  Private/Admin
const moderateComment = asyncHandler(async (req, res) => {
  const { type, id, commentId } = req.params;
  const { action, notes } = req.body; // action: approve, reject, delete

  const comment = await Comment.findById(commentId);
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
    await Comment.findByIdAndDelete(commentId);
    await Comment.deleteMany({ parentCommentId: commentId }); // Remove replies

    let Model;
    switch (type) {
      case 'products': Model = Product; break;
      case 'recipes': Model = Recipe; break;
      case 'forum': Model = ForumPost; break;
      default:
        res.status(400);
        throw new Error('Invalid type');
    }

    const updatedItem = await updateEngagementCount(Model, id, 'commentsCount', -1);

    if (req.io) {
      req.io.to(`${type.slice(0, -1)}_${id}`).emit('SOCIAL_UPDATE', {
        type: 'COMMENT_DELETED',
        itemId: id,
        commentId,
        commentsCount: updatedItem?.commentsCount || 0
      });
    }

    return res.json({ success: true, message: 'Comment deleted successfully' });
  } else {
    res.status(400);
    throw new Error('Invalid action');
  }

  comment.moderationNotes = notes;
  comment.moderatedBy = req.user._id;
  comment.moderatedAt = new Date();

  await comment.save();

  // Socket notification
  if (req.io) {
    req.io.to(`${type.slice(0, -1)}_${id}`).emit('SOCIAL_UPDATE', {
      type: 'COMMENT_MODERATED',
      itemType: type.slice(0, -1),
      itemId: id,
      commentId,
      status: comment.approved ? 'approved' : 'pending',
      action
    });
  }

  res.json({ success: true, message: `Comment ${action}d successfully`, comment });
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

  // Fetch counts from standalone collections for accuracy
  const [likesCount, commentsCount, ratingsCount, sharesCount] = await Promise.all([
    Like.countDocuments({ targetId: id }),
    Comment.countDocuments({ targetId: id }),
    Rating.countDocuments({ targetId: id }),
    Share.countDocuments({ targetId: id })
  ]);

  // Use cached values if they exist, otherwise use live counts
  const stats = {
    likes: likesCount || item.likesCount || 0,
    comments: commentsCount || item.commentsCount || 0,
    ratings: ratingsCount || item.numReviews || 0,
    shares: sharesCount || item.sharesCount || 0,
    averageRating: item.rating || 0
  };

  // Simple engagement score
  const engagementScore = (stats.likes * 1) + (stats.comments * 2) + (stats.ratings * 1.5) + (stats.shares * 3);

  res.json({
    success: true,
    stats: {
      ...stats,
      engagementScore: engagementScore.toFixed(2)
    }
  });
});

// @desc    Edit comment
// @route   PUT /api/:type/:id/comments/:commentId
// @access  Private (Comment owner only)
const editComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { text } = req.body;
  const userId = req.user._id;

  if (!text || text.trim() === '') {
    res.status(400);
    throw new Error('Comment text is required');
  }

  const comment = await Comment.findById(commentId);
  if (!comment) {
    res.status(404);
    throw new Error('Comment not found');
  }

  if (comment.userId.toString() !== userId.toString()) {
    res.status(401);
    throw new Error('Not authorized to edit this comment');
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

  comment.content = text.trim();
  comment.mentions = mentions;
  comment.isEdited = true;
  comment.editedAt = Date.now();

  await comment.save();

  // 🔥 Real-time socket events
  if (req.io) {
    req.io.to(`${comment.targetType.toLowerCase()}_${comment.targetId}`).emit('SOCIAL_UPDATE', {
      type: 'COMMENT_EDITED',
      itemId: comment.targetId,
      commentId: comment._id,
      content: comment.content
    });
  }

  res.json({ success: true, comment });
});

// @desc    Like/Unlike a comment
// @route   POST /api/:type/:id/comments/:commentId/like
// @access  Private
const likeComment = asyncHandler(async (req, res) => {
  const { type, id, commentId } = req.params;
  const userId = req.user._id;

  const comment = await Comment.findById(commentId);
  if (!comment) {
    res.status(404);
    throw new Error('Comment not found');
  }

  const hasLiked = comment.likes.includes(userId);

  if (hasLiked) {
    comment.likes = comment.likes.filter(id => id.toString() !== userId.toString());
  } else {
    comment.likes.push(userId);

    // Notify comment owner
    if (comment.userId.toString() !== userId.toString()) {
      await Notification.create({
        user: comment.userId,
        type: 'COMMENT_LIKE',
        message: `${req.user.name} liked your comment`,
        relatedEntity: comment.targetId,
        entityModel: comment.targetType
      });
    }
  }

  await comment.save();

  // 🔥 Real-time socket events
  if (req.io) {
    req.io.to(`${comment.targetType.toLowerCase()}_${comment.targetId}`).emit('SOCIAL_UPDATE', {
      type: 'COMMENT_LIKE_UPDATED',
      itemId: comment.targetId,
      commentId: comment._id,
      likesCount: comment.likes.length,
      hasLiked: !hasLiked,
      userId
    });
  }

  res.json({ success: true, likes: comment.likes.length, hasLiked: !hasLiked });
});

// @desc    Reply to a comment (nested comment)
// @route   POST /api/:type/:id/comments/:commentId/reply
// @access  Private
const replyToComment = asyncHandler(async (req, res) => {
  // replyToComment is now a wrapper around addComment logic or vice versa.
  // We'll redirect to addComment with parentCommentId.
  req.body.parentCommentId = req.params.commentId;
  return addComment(req, res);
});

// @desc    Get rating distribution for a recipe
// @route   GET /api/recipes/:id/rating-distribution
// @access  Public
const getRatingDistribution = asyncHandler(async (req, res) => {
  const { id } = req.params;
  let targetType;
  switch (req.params.type) {
    case 'products': targetType = 'Product'; break;
    case 'recipes': targetType = 'Recipe'; break;
    default: targetType = 'Recipe';
  }

  // Aggregate ratings from the standalone collection
  const stats = await Rating.aggregate([
    { $match: { targetId: new mongoose.Types.ObjectId(id), targetType, approved: true } },
    {
      $group: {
        _id: '$rating',
        count: { $sum: 1 }
      }
    }
  ]);

  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let totalRatings = 0;
  let sumRatings = 0;

  stats.forEach(stat => {
    distribution[stat._id] = stat.count;
    totalRatings += stat.count;
    sumRatings += stat._id * stat.count;
  });

  const averageRating = totalRatings > 0 ? (sumRatings / totalRatings).toFixed(1) : 0;
  const percentages = {};
  for (let i = 1; i <= 5; i++) {
    percentages[i] = totalRatings > 0 ? Math.round((distribution[i] / totalRatings) * 100) : 0;
  }

  res.json({
    success: true,
    averageRating: parseFloat(averageRating),
    totalRatings,
    distribution,
    percentages
  });
});

// @desc    Get comments sorted by criteria
// @route   GET /api/:type/:id/comments/sorted
// @access  Public
const getSortedComments = asyncHandler(async (req, res) => {
  const { type, id } = req.params;
  const { sortBy = 'recent', page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * limit;

  let targetType;
  switch (type) {
    case 'products': targetType = 'Product'; break;
    case 'recipes': targetType = 'Recipe'; break;
    case 'forum': targetType = 'ForumPost'; break;
    default:
      return res.status(400).json({ success: false, message: 'Invalid type' });
  }

  const query = { targetId: id, targetType, parentCommentId: null };
  // Comments are auto-approved on creation (line 140), so no need to filter
  // if (req.user?.role !== 'admin') {
  //   query.approved = true;
  // }

  let sortCriteria = { createdAt: -1 };
  if (sortBy === 'top') {
    sortCriteria = { likesCount: -1, createdAt: -1 };
  } else if (sortBy === 'oldest') {
    sortCriteria = { createdAt: 1 };
  }

  const comments = await Comment.find(query)
    .populate('userId', 'name profilePic isProfilePublic privacySettings')
    .sort(sortCriteria)
    .skip(skip)
    .limit(limit);

  const total = await Comment.countDocuments(query);

  const anonymizedComments = comments.map(comment => {
    const commentObj = comment.toObject();
    commentObj.userId = anonymizeUser(comment.userId, req.user);
    return commentObj;
  });

  res.json({
    success: true,
    comments: anonymizedComments,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit))
  });
});

// @desc    Get replies for a comment
// @route   GET /api/:type/:id/comments/:commentId/replies
// @access  Public
const getCommentReplies = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  const query = { parentCommentId: commentId };
  // Comments are auto-approved on creation, no need to filter
  // if (req.user?.role !== 'admin') {
  //   query.approved = true;
  // }

  const replies = await Comment.find(query)
    .populate('userId', 'name profilePic isProfilePublic privacySettings')
    .sort({ createdAt: 1 }); // Oldest first for threads

  const anonymizedReplies = replies.map(reply => {
    const replyObj = reply.toObject();
    replyObj.userId = anonymizeUser(reply.userId, req.user);
    return replyObj;
  });

  res.json({
    success: true,
    replies: anonymizedReplies,
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
      likes: item.likesCount || 0,
      comments: item.commentsCount || 0,
      shares: item.sharesCount || 0,
      averageRating: item.rating || item.averageRating || 0,
      numReviews: item.numReviews || 0,
      distribution: item.ratingDistribution || {}
    }
  });
});

// @desc    Get reviews for a product
// @route   GET /api/products/:id/reviews
// @access  Public
const getProductReviews =
  asyncHandler(async (req, res) => {
  const { id } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const query = { targetId: id, targetType: 'Product' };
  if (req.user?.role !== 'admin') {
    query.approved = true;
  }

  const reviews = await Rating.find(query)
    .populate('userId', 'name profilePic isProfilePublic privacySettings')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Rating.countDocuments(query);

  const anonymizedReviews = reviews.map(review => {
    const reviewObj = review.toObject();
    reviewObj.userId = anonymizeUser(review.userId, req.user);
    return reviewObj;
  });

  res.json({
    success: true,
    reviews: anonymizedReviews,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit))
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
  replyToComment,
  rateItem,
  getProductReviews,
  syncEngagementCounts
};
