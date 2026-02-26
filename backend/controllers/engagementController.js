const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Recipe = require('../models/Recipe');
const Comment = require('../models/Comment');
const Like = require('../models/Like');
const Rating = require('../models/Rating');
const Share = require('../models/Share');
const User = require('../models/User');
const { anonymizeUser } = require('../utils/userVisibility');

/**
 * @desc    Simple sentiment analysis helper
 * @param   {string} text
 * @returns {string} positive, neutral, negative
 */
const analyzeSentiment = (text) => {
    if (!text) return 'neutral';
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'perfect', 'delicious', 'tasty', 'love', 'liked', 'best', 'awesome', 'nice', 'smooth', 'easy'];
    const negativeWords = ['bad', 'worst', 'awful', 'terrible', 'disgusting', 'hard', 'difficult', 'unclear', 'missing', 'expensive', 'late', 'poor', 'wrong', 'fail'];

    const words = text.toLowerCase().split(/\W+/);
    let score = 0;
    words.forEach(word => {
        if (positiveWords.includes(word)) score++;
        if (negativeWords.includes(word)) score--;
    });

    if (score > 0) return 'positive';
    if (score < 0) return 'negative';
    return 'neutral';
};

// @desc    Get aggregate engagement for all seller's recipes
// @route   GET /api/seller/engagement/overview
// @access  Private/Seller
exports.getSellerEngagementOverview = asyncHandler(async (req, res) => {
    const sellerId = req.user._id;

    // Get all recipe IDs for this seller
    const recipes = await Recipe.find({ sellerId }).select('_id title');
    const recipeIds = recipes.map(r => r._id);

    // Aggregate counts
    const [likes, comments, ratings, shares] = await Promise.all([
        Like.countDocuments({ targetId: { $in: recipeIds }, targetType: 'Recipe' }),
        Comment.countDocuments({ targetId: { $in: recipeIds }, targetType: 'Recipe' }),
        Rating.countDocuments({ targetId: { $in: recipeIds }, targetType: 'Recipe' }),
        Share.countDocuments({ targetId: { $in: recipeIds }, targetType: 'Recipe' })
    ]);

    // Calculate overall average rating
    const avgRatingData = await Rating.aggregate([
        { $match: { targetId: { $in: recipeIds }, targetType: 'Recipe', approved: true } },
        { $group: { _id: null, avg: { $avg: '$rating' } } }
    ]);

    res.json({
        totalRecipes: recipes.length,
        metrics: {
            likes,
            comments,
            ratings,
            shares,
            averageRating: Number(avgRatingData[0]?.avg?.toFixed(1)) || 0
        }
    });
});

// @desc    Get engagement trends for charts
// @route   GET /api/seller/engagement/trends
// @access  Private/Seller
exports.getEngagementTrends = asyncHandler(async (req, res) => {
    const sellerId = req.user._id;
    const { period = '7days' } = req.query;

    const recipes = await Recipe.find({ sellerId }).select('_id');
    const recipeIds = recipes.map(r => r._id);

    let startDate = new Date();
    if (period === '30days') startDate.setDate(startDate.getDate() - 30);
    else if (period === '90days') startDate.setDate(startDate.getDate() - 90);
    else startDate.setDate(startDate.getDate() - 7);

    const getDailyAggregation = async (Model) => {
        return Model.aggregate([
            {
                $match: {
                    targetId: { $in: recipeIds },
                    targetType: 'Recipe',
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);
    };

    const [dailyLikes, dailyComments, dailyShares] = await Promise.all([
        getDailyAggregation(Like),
        getDailyAggregation(Comment),
        getDailyAggregation(Share)
    ]);

    res.json({
        likes: dailyLikes,
        comments: dailyComments,
        shares: dailyShares
    });
});

// @desc    Get recent engagement activity feed
// @route   GET /api/seller/engagement/activity
// @access  Private/Seller
exports.getRecentActivityFeed = asyncHandler(async (req, res) => {
    const sellerId = req.user._id;
    const recipes = await Recipe.find({ sellerId }).select('_id title');
    const recipeIds = recipes.map(r => r._id);

    // Fetch latest comments and ratings
    const [latestComments, latestRatings, latestLikes] = await Promise.all([
        Comment.find({ targetId: { $in: recipeIds }, targetType: 'Recipe', parentCommentId: null })
            .populate('userId', 'name profilePic isProfilePublic privacySettings')
            .sort({ createdAt: -1 })
            .limit(10),
        Rating.find({ targetId: { $in: recipeIds }, targetType: 'Recipe' })
            .populate('userId', 'name profilePic isProfilePublic privacySettings')
            .sort({ createdAt: -1 })
            .limit(10),
        Like.find({ targetId: { $in: recipeIds }, targetType: 'Recipe' })
            .populate('userId', 'name profilePic isProfilePublic privacySettings')
            .sort({ createdAt: -1 })
            .limit(10)
    ]);

    // Combine and label activities
    let activities = [
        ...latestComments.map(c => ({
            type: 'comment',
            id: c._id,
            content: c.content,
            user: anonymizeUser(c.userId, req.user),
            targetId: c.targetId,
            recipeTitle: recipes.find(recipe => recipe._id.toString() === c.targetId?.toString())?.title || 'Unknown Recipe',
            createdAt: c.createdAt,
            sentiment: analyzeSentiment(c.content)
        })),
        ...latestRatings.map(rat => ({
            type: 'rating',
            id: rat._id,
            rating: rat.rating,
            content: rat.comment,
            user: anonymizeUser(rat.userId, req.user),
            targetId: rat.targetId,
            recipeTitle: recipes.find(recipe => recipe._id.toString() === rat.targetId?.toString())?.title || 'Unknown Recipe',
            createdAt: rat.createdAt,
            sentiment: rat.comment ? analyzeSentiment(rat.comment) : 'neutral'
        })),
        ...latestLikes.map(lk => ({
            type: 'like',
            id: lk._id,
            user: anonymizeUser(lk.userId, req.user),
            targetId: lk.targetId,
            recipeTitle: recipes.find(recipe => recipe._id.toString() === lk.targetId?.toString())?.title || 'Unknown Recipe',
            createdAt: lk.createdAt
        }))
    ];

    activities.sort((a, b) => b.createdAt - a.createdAt);

    res.json(activities.slice(0, 20));
});

// @desc    Get detailed engagement metrics for a specific recipe
// @route   GET /api/seller/engagement/recipe/:id
// @access  Private/Seller
exports.getRecipeEngagementDetails = asyncHandler(async (req, res) => {
    const recipeId = req.params.id;
    const sellerId = req.user._id;

    // Verify ownership
    const recipe = await Recipe.findOne({ _id: recipeId, sellerId });
    if (!recipe) {
        res.status(404);
        throw new Error('Recipe not found or not owned by you');
    }

    const [comments, ratings, shares] = await Promise.all([
        Comment.find({ targetId: recipeId, targetType: 'Recipe', parentCommentId: null })
            .populate('userId', 'name profilePic isProfilePublic privacySettings')
            .populate({
                path: 'replies',
                populate: { path: 'userId', select: 'name profilePic isProfilePublic privacySettings' }
            })
            .sort({ createdAt: -1 }),
        Rating.find({ targetId: recipeId, targetType: 'Recipe' })
            .populate('userId', 'name profilePic isProfilePublic privacySettings')
            .sort({ createdAt: -1 }),
        Share.aggregate([
            { $match: { targetId: new mongoose.Types.ObjectId(recipeId) } },
            { $group: { _id: '$platform', count: { $sum: 1 } } }
        ])
    ]);

    // Sentiment breakdown for comments
    const sentimentStats = { positive: 0, neutral: 0, negative: 0 };
    comments.forEach(c => {
        sentimentStats[analyzeSentiment(c.content)]++;
    });

    res.json({
        recipe: {
            id: recipe._id,
            title: recipe.title,
            image: recipe.image,
            stats: {
                avgRating: recipe.averageRating,
                numReviews: recipe.numReviews,
                likes: recipe.likesCount,
                comments: recipe.commentsCount,
                shares: recipe.sharesCount,
                distribution: recipe.ratingDistribution
            }
        },
        comments: comments.map(c => {
            const co = c.toObject();
            co.userId = anonymizeUser(c.userId, req.user);
            if (co.replies) {
                co.replies = co.replies.map(r => {
                    r.userId = anonymizeUser(r.userId, req.user);
                    return r;
                });
            }
            return co;
        }),
        ratings: ratings.map(r => {
            const ro = r.toObject();
            ro.userId = anonymizeUser(r.userId, req.user);
            return ro;
        }),
        sharesBreakdown: shares,
        sentiment: sentimentStats
    });
});

// @desc    Send a reply to a customer comment
// @route   POST /api/seller/engagement/comments/:id/reply
// @access  Private/Seller
exports.replyToComment = asyncHandler(async (req, res) => {
    const { content } = req.body;
    const commentId = req.params.id;
    const sellerId = req.user._id;

    const originalComment = await Comment.findById(commentId);
    if (!originalComment) {
        res.status(404);
        throw new Error('Comment not found');
    }

    // Check if the comment belongs to one of the seller's recipes
    const recipe = await Recipe.findOne({ _id: originalComment.targetId, sellerId });
    if (!recipe) {
        res.status(403);
        throw new Error('Not authorized to reply to this comment');
    }

    const reply = await Comment.create({
        targetId: originalComment.targetId,
        targetType: originalComment.targetType,
        userId: sellerId,
        content,
        parentCommentId: originalComment._id,
        approved: true
    });

    const populatedReply = await Comment.findById(reply._id).populate('userId', 'name profilePic');

    // Socket emission to update the customer's view and other dashboard instances
    if (req.io) {
        const room = `recipe_${originalComment.targetId}`;
        req.io.to(room).emit('SOCIAL_UPDATE', {
            type: 'COMMENT_ADDED',
            itemId: originalComment.targetId,
            comment: populatedReply
        });
    }

    res.status(201).json(populatedReply);
});

// @desc    Get all recipes with engagement metrics (Admin)
// @route   GET /api/admin/engagement/recipes
// @access  Private/Admin
exports.getAdminRecipesEngagement = asyncHandler(async (req, res) => {
    const pageSize = 20;
    const page = Number(req.query.pageNumber) || 1;
    const search = req.query.search || '';

    const query = {};
    if (search) {
        query.title = { $regex: search, $options: 'i' };
    }

    const count = await Recipe.countDocuments(query);
    const recipes = await Recipe.find(query)
        .populate('sellerId', 'name businessDetails.businessName')
        .sort({ createdAt: -1 })
        .limit(pageSize)
        .skip(pageSize * (page - 1));

    res.json({
        recipes: recipes.map(r => ({
            _id: r._id,
            title: r.title,
            seller: r.sellerId?.name || 'Unknown',
            business: r.sellerId?.businessDetails?.businessName || '',
            riceType: r.riceType,
            status: r.status,
            createdAt: r.createdAt,
            metrics: {
                likes: r.likesCount || 0,
                comments: r.commentsCount || 0,
                shares: r.sharesCount || 0,
                averageRating: r.averageRating || 0,
                numReviews: r.numReviews || 0
            }
        })),
        page,
        pages: Math.ceil(count / pageSize),
        total: count
    });
});

module.exports = {
    getSellerEngagementOverview: exports.getSellerEngagementOverview,
    getEngagementTrends: exports.getEngagementTrends,
    getRecentActivityFeed: exports.getRecentActivityFeed,
    getRecipeEngagementDetails: exports.getRecipeEngagementDetails,
    replyToComment: exports.replyToComment,
    getAdminRecipesEngagement: exports.getAdminRecipesEngagement
};
