const asyncHandler = require('express-async-handler');
const Recipe = require('../models/Recipe');
const ForumPost = require('../models/ForumPost');
const Product = require('../models/Product');
const User = require('../models/User');
const { sendPushNotification } = require('../utils/socketNotifications');

// @desc    Get all content needing moderation
// @route   GET /api/admin/moderation/pending
// @access  Private/Admin
const getPendingContent = asyncHandler(async (req, res) => {
  try {
    const { type = 'all', page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    let pendingContent = [];
    let total = 0;

    // Build queries based on type
    if (type === 'all' || type === 'recipes') {
      const [recipes, recipesCount] = await Promise.all([
        Recipe.find({ status: 'pending' })
          .populate('sellerId', 'name email profileImage')
          .sort({ createdAt: -1 })
          .skip(type === 'all' ? 0 : skip)
          .limit(type === 'all' ? 5 : parseInt(limit))
          .lean(),
        Recipe.countDocuments({ status: 'pending' })
      ]);

      recipes.forEach(recipe => {
        pendingContent.push({
          _id: recipe._id,
          type: 'recipe',
          title: recipe.title,
          content: recipe.description || `${recipe.ingredients?.length || 0} ingredients`,
          user: recipe.sellerId,
          createdAt: recipe.createdAt,
          status: recipe.status,
          reports: 0,
          isFlagged: false
        });
      });
      total += recipesCount;
    }

    if (type === 'all' || type === 'forum') {
      const [forumPosts, forumCount] = await Promise.all([
        ForumPost.find({ status: 'pending' })
          .populate('userId', 'name email profileImage')
          .sort({ createdAt: -1 })
          .skip(type === 'all' ? 0 : skip)
          .limit(type === 'all' ? 5 : parseInt(limit))
          .lean(),
        ForumPost.countDocuments({ status: 'pending' })
      ]);

      forumPosts.forEach(post => {
        pendingContent.push({
          _id: post._id,
          type: 'forum_post',
          title: post.title,
          content: post.content,
          user: post.userId,
          createdAt: post.createdAt,
          status: post.status,
          reports: post.reports?.length || 0,
          isFlagged: post.isFlagged
        });
      });
      total += forumCount;
    }

    if (type === 'all' || type === 'comments') {
      // Use regular queries instead of aggregation for comments
      try {
        // Get pending recipe comments using regular queries
        const recipesWithPendingComments = await Recipe.find({
          'comments': { $exists: true, $not: { $size: 0 } },
          'comments.approved': false
        })
          .populate('sellerId', 'name email profileImage')
          .populate('comments.userId', 'name email profileImage')
          .lean();

        recipesWithPendingComments.forEach(recipe => {
          if (recipe.comments && Array.isArray(recipe.comments)) {
            recipe.comments.forEach(comment => {
              if (comment && !comment.approved) {
                pendingContent.push({
                  _id: comment._id,
                  type: 'recipe_comment',
                  title: recipe.title,
                  content: comment.comment,
                  user: comment.userId,
                  createdAt: comment.createdAt,
                  status: 'pending',
                  reports: comment.reports?.length || 0,
                  isFlagged: comment.isFlagged || false,
                  parentId: recipe._id
                });
              }
            });
          }
        });

        // Get pending forum comments using regular queries
        const forumPostsWithPendingComments = await ForumPost.find({
          'comments': { $exists: true, $not: { $size: 0 } },
          'comments.approved': false
        })
          .populate('userId', 'name email profileImage')
          .populate('comments.userId', 'name email profileImage')
          .lean();

        forumPostsWithPendingComments.forEach(post => {
          if (post.comments && Array.isArray(post.comments)) {
            post.comments.forEach(comment => {
              if (comment && !comment.approved) {
                pendingContent.push({
                  _id: comment._id,
                  type: 'forum_comment',
                  title: post.title,
                  content: comment.text,
                  user: comment.userId,
                  createdAt: comment.createdAt,
                  status: 'pending',
                  reports: comment.reports?.length || 0,
                  isFlagged: comment.isFlagged || false,
                  parentId: post._id
                });
              }
            });
          }
        });

        // Get pending product reviews using regular queries
        const productsWithPendingReviews = await Product.find({
          'reviews': { $exists: true, $not: { $size: 0 } },
          'reviews.approved': false
        })
          .populate('seller', 'name email profileImage')
          .populate('reviews.user', 'name email profileImage')
          .lean();

        productsWithPendingReviews.forEach(product => {
          if (product.reviews && Array.isArray(product.reviews)) {
            product.reviews.forEach(review => {
              if (review && !review.approved) {
                pendingContent.push({
                  _id: review._id,
                  type: 'product_review',
                  title: product.name,
                  content: review.comment,
                  user: review.user,
                  createdAt: review.createdAt,
                  status: 'pending',
                  reports: review.reports?.length || 0,
                  isFlagged: review.isFlagged || false,
                  parentId: product._id
                });
              }
            });
          }
        });

        // Count totals using regular count queries
        const recipeCommentsCount = await Recipe.countDocuments({
          'comments': { $exists: true, $not: { $size: 0 } },
          'comments.approved': false
        });

        const forumCommentsCount = await ForumPost.countDocuments({
          'comments': { $exists: true, $not: { $size: 0 } },
          'comments.approved': false
        });

        const productReviewsCount = await Product.countDocuments({
          'reviews': { $exists: true, $not: { $size: 0 } },
          'reviews.approved': false
        });

        total += recipeCommentsCount + forumCommentsCount + productReviewsCount;

      } catch (aggregationError) {
        console.error('Error in comments aggregation:', aggregationError);
        // Continue without comments if aggregation fails
      }
    }

    // Sort all content by creation date
    pendingContent.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Apply pagination
    const paginatedContent = type === 'all'
      ? pendingContent.slice(0, 15) // Limit for 'all' type
      : pendingContent.slice(skip, skip + parseInt(limit));

    res.json({
      content: paginatedContent,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Error fetching pending content:', error);
    res.status(500).json({
      message: 'Error fetching pending content',
      error: error.message
    });
  }
});

// @desc    Get flagged/reported content
// @route   GET /api/admin/moderation/flagged
// @access  Private/Admin
const getFlaggedContent = asyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    let flaggedContent = [];
    let total = 0;

    // Use regular queries instead of aggregation for flagged content
    try {
      // Get flagged recipe comments
      const recipesWithFlaggedComments = await Recipe.find({
        'comments': { $exists: true, $not: { $size: 0 } },
        'comments.isFlagged': true
      })
        .populate('sellerId', 'name email profileImage')
        .populate('comments.userId', 'name email profileImage')
        .lean();

      recipesWithFlaggedComments.forEach(recipe => {
        if (recipe.comments && Array.isArray(recipe.comments)) {
          recipe.comments.forEach(comment => {
            if (comment && comment.isFlagged) {
              flaggedContent.push({
                _id: comment._id,
                type: 'recipe_comment',
                title: recipe.title,
                content: comment.comment,
                user: comment.userId,
                createdAt: comment.createdAt,
                reports: comment.reports?.length || 0,
                isFlagged: true,
                parentId: recipe._id
              });
            }
          });
        }
      });

      // Get flagged forum content
      const [flaggedForumPosts, forumPostsCount] = await Promise.all([
        ForumPost.find({ isFlagged: true })
          .populate('userId', 'name email profileImage')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        ForumPost.countDocuments({ isFlagged: true })
      ]);

      flaggedForumPosts.forEach(post => {
        flaggedContent.push({
          _id: post._id,
          type: 'forum_post',
          title: post.title,
          content: post.content,
          user: post.userId,
          createdAt: post.createdAt,
          reports: post.reports?.length || 0,
          isFlagged: true
        });
      });
      total += forumPostsCount;

      // Get flagged forum comments
      const forumPostsWithFlaggedComments = await ForumPost.find({
        'comments': { $exists: true, $not: { $size: 0 } },
        'comments.isFlagged': true
      })
        .populate('userId', 'name email profileImage')
        .populate('comments.userId', 'name email profileImage')
        .lean();

      forumPostsWithFlaggedComments.forEach(post => {
        if (post.comments && Array.isArray(post.comments)) {
          post.comments.forEach(comment => {
            if (comment && comment.isFlagged) {
              flaggedContent.push({
                _id: comment._id,
                type: 'forum_comment',
                title: post.title,
                content: comment.text,
                user: comment.userId,
                createdAt: comment.createdAt,
                reports: comment.reports?.length || 0,
                isFlagged: true,
                parentId: post._id
              });
            }
          });
        }
      });

      // Get flagged product reviews
      const productsWithFlaggedReviews = await Product.find({
        'reviews': { $exists: true, $not: { $size: 0 } },
        'reviews.isFlagged': true
      })
        .populate('seller', 'name email profileImage')
        .populate('reviews.user', 'name email profileImage')
        .lean();

      productsWithFlaggedReviews.forEach(product => {
        if (product.reviews && Array.isArray(product.reviews)) {
          product.reviews.forEach(review => {
            if (review && review.isFlagged) {
              flaggedContent.push({
                _id: review._id,
                type: 'product_review',
                title: product.name,
                content: review.comment,
                user: review.user,
                createdAt: review.createdAt,
                reports: review.reports?.length || 0,
                isFlagged: true,
                parentId: product._id
              });
            }
          });
        }
      });

      // Count totals
      const recipeFlaggedCount = await Recipe.countDocuments({
        'comments': { $exists: true, $not: { $size: 0 } },
        'comments.isFlagged': true
      });

      const forumFlaggedCount = await ForumPost.countDocuments({
        'comments': { $exists: true, $not: { $size: 0 } },
        'comments.isFlagged': true
      });

      const productFlaggedCount = await Product.countDocuments({
        'reviews': { $exists: true, $not: { $size: 0 } },
        'reviews.isFlagged': true
      });

      total += recipeFlaggedCount + forumFlaggedCount + productFlaggedCount;

    } catch (aggregationError) {
      console.error('Error in flagged content aggregation:', aggregationError);
      // Continue without flagged content if aggregation fails
    }

    // Sort by creation date
    flaggedContent.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      content: flaggedContent,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Error fetching flagged content:', error);
    res.status(500).json({
      message: 'Error fetching flagged content',
      error: error.message
    });
  }
});

// @desc    Approve content
// @route   PUT /api/admin/moderation/approve/:type/:id
// @access  Private/Admin
const approveContent = asyncHandler(async (req, res) => {
  try {
    const { type, id } = req.params;
    const { moderationNotes } = req.body;

    let result;

    switch (type) {
      case 'recipe':
        result = await Recipe.findByIdAndUpdate(
          id,
          {
            status: 'approved',
            moderationNotes,
            moderatedBy: req.user._id,
            moderatedAt: new Date()
          },
          { new: true }
        );
        break;

      case 'forum_post':
        result = await ForumPost.findByIdAndUpdate(
          id,
          {
            status: 'approved',
            moderationNotes,
            moderatedBy: req.user._id,
            moderatedAt: new Date()
          },
          { new: true }
        );
        break;

      case 'recipe_comment':
        result = await Recipe.findOneAndUpdate(
          { 'comments._id': id },
          {
            $set: {
              'comments.$.approved': true,
              'comments.$.moderationNotes': moderationNotes,
              'comments.$.moderatedBy': req.user._id,
              'comments.$.moderatedAt': new Date()
            }
          },
          { new: true }
        );
        break;

      case 'forum_comment':
        result = await ForumPost.findOneAndUpdate(
          { 'comments._id': id },
          {
            $set: {
              'comments.$.approved': true,
              'comments.$.moderationNotes': moderationNotes,
              'comments.$.moderatedBy': req.user._id,
              'comments.$.moderatedAt': new Date()
            }
          },
          { new: true }
        );
        break;

      case 'product_review':
        result = await Product.findOneAndUpdate(
          { 'reviews._id': id },
          {
            $set: {
              'reviews.$.approved': true,
              'reviews.$.moderationNotes': moderationNotes,
              'reviews.$.moderatedBy': req.user._id,
              'reviews.$.moderatedAt': new Date()
            }
          },
          { new: true }
        );
        break;

      default:
        return res.status(400).json({ message: 'Invalid content type' });
    }

    if (!result) {
      return res.status(404).json({ message: 'Content not found' });
    }

    // Send real-time notification
    const io = req.app.get('io');
    io.emit('CONTENT_APPROVED', { type, id, approvedBy: req.user._id });

    res.json({
      message: 'Content approved successfully',
      content: result
    });
  } catch (error) {
    console.error('Error approving content:', error);
    res.status(500).json({
      message: 'Error approving content',
      error: error.message
    });
  }
});

// @desc    Reject content
// @route   PUT /api/admin/moderation/reject/:type/:id
// @access  Private/Admin
const rejectContent = asyncHandler(async (req, res) => {
  try {
    const { type, id } = req.params;
    const { moderationNotes } = req.body;

    if (!moderationNotes) {
      return res.status(400).json({ message: 'Moderation notes are required for rejection' });
    }

    let result;

    switch (type) {
      case 'recipe':
        result = await Recipe.findByIdAndUpdate(
          id,
          {
            status: 'rejected',
            moderationNotes,
            moderatedBy: req.user._id,
            moderatedAt: new Date()
          },
          { new: true }
        );
        break;

      case 'forum_post':
        result = await ForumPost.findByIdAndUpdate(
          id,
          {
            status: 'rejected',
            moderationNotes,
            moderatedBy: req.user._id,
            moderatedAt: new Date()
          },
          { new: true }
        );
        break;

      case 'recipe_comment':
        result = await Recipe.findOneAndUpdate(
          { 'comments._id': id },
          {
            $set: {
              'comments.$.approved': false,
              'comments.$.moderationNotes': moderationNotes,
              'comments.$.moderatedBy': req.user._id,
              'comments.$.moderatedAt': new Date()
            }
          },
          { new: true }
        );
        break;

      case 'forum_comment':
        result = await ForumPost.findOneAndUpdate(
          { 'comments._id': id },
          {
            $set: {
              'comments.$.approved': false,
              'comments.$.moderationNotes': moderationNotes,
              'comments.$.moderatedBy': req.user._id,
              'comments.$.moderatedAt': new Date()
            }
          },
          { new: true }
        );
        break;

      case 'product_review':
        result = await Product.findOneAndUpdate(
          { 'reviews._id': id },
          {
            $set: {
              'reviews.$.approved': false,
              'reviews.$.moderationNotes': moderationNotes,
              'reviews.$.moderatedBy': req.user._id,
              'reviews.$.moderatedAt': new Date()
            }
          },
          { new: true }
        );
        break;

      default:
        return res.status(400).json({ message: 'Invalid content type' });
    }

    if (!result) {
      return res.status(404).json({ message: 'Content not found' });
    }

    // Send real-time notification
    const io = req.app.get('io');
    io.emit('CONTENT_REJECTED', { type, id, rejectedBy: req.user._id });

    res.json({
      message: 'Content rejected successfully',
      content: result
    });
  } catch (error) {
    console.error('Error rejecting content:', error);
    res.status(500).json({
      message: 'Error rejecting content',
      error: error.message
    });
  }
});

// @desc    Delete content
// @route   DELETE /api/admin/moderation/delete/:type/:id
// @access  Private/Admin
const deleteContent = asyncHandler(async (req, res) => {
  try {
    const { type, id } = req.params;
    const { moderationNotes } = req.body;

    let result;

    switch (type) {
      case 'recipe':
        result = await Recipe.findByIdAndDelete(id);
        break;

      case 'forum_post':
        result = await ForumPost.findByIdAndDelete(id);
        break;

      case 'recipe_comment':
        result = await Recipe.findOneAndUpdate(
          { 'comments._id': id },
          { $pull: { comments: { _id: id } } },
          { new: true }
        );
        break;

      case 'forum_comment':
        result = await ForumPost.findOneAndUpdate(
          { 'comments._id': id },
          { $pull: { comments: { _id: id } } },
          { new: true }
        );
        break;

      case 'product_review':
        result = await Product.findOneAndUpdate(
          { 'reviews._id': id },
          { $pull: { reviews: { _id: id } } },
          { new: true }
        );
        break;

      default:
        return res.status(400).json({ message: 'Invalid content type' });
    }

    if (!result) {
      return res.status(404).json({ message: 'Content not found' });
    }

    // Send real-time notification
    const io = req.app.get('io');
    io.emit('CONTENT_DELETED', { type, id, deletedBy: req.user._id });

    res.json({
      message: 'Content deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting content:', error);
    res.status(500).json({
      message: 'Error deleting content',
      error: error.message
    });
  }
});

// @desc    Pin forum post
// @route   PUT /api/admin/moderation/pin/forum/:id
// @access  Private/Admin
const pinForumPost = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    // Unpin any currently pinned post
    await ForumPost.updateMany(
      { pinned: true },
      { pinned: false }
    );

    // Pin the new post
    const pinnedPost = await ForumPost.findByIdAndUpdate(
      id,
      { pinned: true },
      { new: true }
    ).populate('userId', 'name email profileImage');

    if (!pinnedPost) {
      return res.status(404).json({ message: 'Forum post not found' });
    }

    // Send real-time notification
    const io = req.app.get('io');
    io.emit('FORUM_POST_PINNED', { postId: id, pinnedBy: req.user._id });

    res.json({
      message: 'Forum post pinned successfully',
      post: pinnedPost
    });
  } catch (error) {
    console.error('Error pinning forum post:', error);
    res.status(500).json({
      message: 'Error pinning forum post',
      error: error.message
    });
  }
});

// @desc    Get moderation statistics
// @route   GET /api/admin/moderation/stats
// @access  Private/Admin
const getModerationStats = asyncHandler(async (req, res) => {
  try {
    const today = new Date();
    const startOfToday = new Date(today.setHours(0, 0, 0, 0));
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));

    // Use regular count queries instead of aggregation
    const [
      pendingRecipes,
      pendingForumPosts,
      todayModeratedRecipes,
      todayModeratedForum,
      weeklyModeratedRecipes,
      weeklyModeratedForum
    ] = await Promise.all([
      Recipe.countDocuments({ status: 'pending' }),
      ForumPost.countDocuments({ status: 'pending' }),
      // Today's moderated content
      Recipe.countDocuments({
        moderatedAt: { $gte: startOfToday },
        $or: [{ status: 'approved' }, { status: 'rejected' }]
      }),
      ForumPost.countDocuments({
        moderatedAt: { $gte: startOfToday },
        $or: [{ status: 'approved' }, { status: 'rejected' }]
      }),
      // Weekly moderated content
      Recipe.countDocuments({
        moderatedAt: { $gte: startOfWeek },
        $or: [{ status: 'approved' }, { status: 'rejected' }]
      }),
      ForumPost.countDocuments({
        moderatedAt: { $gte: startOfWeek },
        $or: [{ status: 'approved' }, { status: 'rejected' }]
      })
    ]);

    const todayModerated = todayModeratedRecipes + todayModeratedForum;
    const weeklyModerated = weeklyModeratedRecipes + weeklyModeratedForum;

    // Count comments and reviews using regular queries
    let pendingRecipeComments = 0;
    let pendingForumComments = 0;
    let pendingProductReviews = 0;
    let flaggedRecipeComments = 0;
    let flaggedForumComments = 0;
    let flaggedProductReviews = 0;

    try {
      // Count pending recipe comments
      const recipesWithPendingComments = await Recipe.find({
        'comments': { $exists: true, $not: { $size: 0 } },
        'comments.approved': false
      });
      recipesWithPendingComments.forEach(recipe => {
        if (recipe.comments && Array.isArray(recipe.comments)) {
          pendingRecipeComments += recipe.comments.filter(comment => !comment.approved).length;
        }
      });

      // Count pending forum comments
      const forumPostsWithPendingComments = await ForumPost.find({
        'comments': { $exists: true, $not: { $size: 0 } },
        'comments.approved': false
      });
      forumPostsWithPendingComments.forEach(post => {
        if (post.comments && Array.isArray(post.comments)) {
          pendingForumComments += post.comments.filter(comment => !comment.approved).length;
        }
      });

      // Count pending product reviews
      const productsWithPendingReviews = await Product.find({
        'reviews': { $exists: true, $not: { $size: 0 } },
        'reviews.approved': false
      });
      productsWithPendingReviews.forEach(product => {
        if (product.reviews && Array.isArray(product.reviews)) {
          pendingProductReviews += product.reviews.filter(review => !review.approved).length;
        }
      });

      // Count flagged recipe comments
      const recipesWithFlaggedComments = await Recipe.find({
        'comments': { $exists: true, $not: { $size: 0 } },
        'comments.isFlagged': true
      });
      recipesWithFlaggedComments.forEach(recipe => {
        if (recipe.comments && Array.isArray(recipe.comments)) {
          flaggedRecipeComments += recipe.comments.filter(comment => comment.isFlagged).length;
        }
      });

      // Count flagged forum comments
      const forumPostsWithFlaggedComments = await ForumPost.find({
        'comments': { $exists: true, $not: { $size: 0 } },
        'comments.isFlagged': true
      });
      forumPostsWithFlaggedComments.forEach(post => {
        if (post.comments && Array.isArray(post.comments)) {
          flaggedForumComments += post.comments.filter(comment => comment.isFlagged).length;
        }
      });

      // Count flagged product reviews
      const productsWithFlaggedReviews = await Product.find({
        'reviews': { $exists: true, $not: { $size: 0 } },
        'reviews.isFlagged': true
      });
      productsWithFlaggedReviews.forEach(product => {
        if (product.reviews && Array.isArray(product.reviews)) {
          flaggedProductReviews += product.reviews.filter(review => review.isFlagged).length;
        }
      });

    } catch (countError) {
      console.error('Error counting comments and reviews:', countError);
      // Continue with zero counts if counting fails
    }

    const totalPending =
      pendingRecipes +
      pendingForumPosts +
      pendingRecipeComments +
      pendingForumComments +
      pendingProductReviews;

    const totalFlagged =
      flaggedRecipeComments +
      flaggedForumComments +
      flaggedProductReviews;

    res.json({
      pending: {
        recipes: pendingRecipes,
        forumPosts: pendingForumPosts,
        recipeComments: pendingRecipeComments,
        forumComments: pendingForumComments,
        productReviews: pendingProductReviews,
        total: totalPending
      },
      flagged: {
        total: totalFlagged,
        recipeComments: flaggedRecipeComments,
        forumPosts: 0, // Forum posts themselves don't have isFlagged field
        forumComments: flaggedForumComments,
        productReviews: flaggedProductReviews
      },
      moderationActivity: {
        today: todayModerated,
        thisWeek: weeklyModerated
      }
    });
  } catch (error) {
    console.error('Error fetching moderation stats:', error);
    res.status(500).json({
      message: 'Error fetching moderation statistics',
      error: error.message
    });
  }
});

module.exports = {
  getPendingContent,
  getFlaggedContent,
  approveContent,
  rejectContent,
  deleteContent,
  pinForumPost,
  getModerationStats
};