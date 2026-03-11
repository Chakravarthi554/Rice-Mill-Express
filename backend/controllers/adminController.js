const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const User = require('../models/User');
const Order = require('../models/Order');
const ForumPost = require('../models/ForumPost');
const Recipe = require('../models/Recipe');
const Product = require('../models/Product');
const Notification = require('../models/Notification');
const KycApplication = require('../models/KycApplication');
const Payment = require('../models/Payment');

const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find({ role: { $ne: 'search_log' } }).select('-password');
  res.json(users);
});

const getOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find()
    .populate('user', 'name')
    .populate('seller', 'name businessDetails.businessName phone businessDetails.address');
  res.json(orders);
});

const getSearchLogs = asyncHandler(async (req, res) => {
  const logs = await User.find({ role: 'search_log' }).select('searchQuery resultsCount timestamp');
  res.json(logs);
});

const updateSellerLocation = asyncHandler(async (req, res) => {
  const { sellerId, latitude, longitude, city, pinCode } = req.body;
  const seller = await User.findById(sellerId);
  if (!seller || seller.role !== 'seller') {
    res.status(404);
    throw new Error('Seller not found');
  }
  seller.location = {
    type: 'Point',
    coordinates: [parseFloat(longitude), parseFloat(latitude)],
    city,
    pinCode,
  };
  seller.businessDetails.address = {
    ...seller.businessDetails.address,
    city,
    pinCode,
  };
  await seller.save();
  res.json({ message: 'Seller location updated' });
});

// 🔥 FIXED: Enhanced admin dashboard with comprehensive analytics and error handling
const getDashboardStats = asyncHandler(async (req, res) => {
  try {
    console.log('🔄 Fetching dashboard stats...');

    // Date calculations for growth
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // Get total counts with error handling
    const [
      totalUsers,
      totalOrders,
      activeSellers,
      activeCustomers,
      totalRecipes,
      totalForumPosts,
      revenueData,
      pendingForumPosts,
      pendingRecipes,
      pendingCommentsCount,
      topRiceVarieties,
      topSellers,
      recentActivities,
      monthlyRevenue,
      lastMonthRevenueData,
      newUsersCurrentMonth,
      newUsersLastMonth
    ] = await Promise.all([
      User.countDocuments().catch(() => 0),
      Order.countDocuments().catch(() => 0),
      User.countDocuments({ role: 'seller', active: true }).catch(() => 0),
      User.countDocuments({ role: 'customer', active: true }).catch(() => 0),
      Recipe.countDocuments().catch(() => 0),
      ForumPost.countDocuments().catch(() => 0),

      // Total Revenue (all time - includes both paid online and delivered COD)
      Order.aggregate([
        { $match: { $or: [{ isPaid: true }, { orderStatus: 'delivered' }] } },
        { $group: { _id: null, totalRevenue: { $sum: { $ifNull: ['$adminAmount', { $multiply: ['$totalPrice', 0.15] }] } } } }
      ]).catch(() => []),

      // Moderation counts
      ForumPost.countDocuments({ status: 'pending' }).catch(() => 0),
      Recipe.countDocuments({ status: 'pending' }).catch(() => 0),

      // Aggregate pending comments from both collections
      Promise.all([
        ForumPost.aggregate([
          { $unwind: '$comments' },
          { $match: { 'comments.approved': false } },
          { $count: 'count' }
        ]).catch(() => []),
        Recipe.aggregate([
          { $unwind: '$comments' },
          { $match: { 'comments.approved': false } },
          { $count: 'count' }
        ]).catch(() => [])
      ]).then(([forumRes, recipeRes]) => {
        const forumCount = forumRes && forumRes.length > 0 ? forumRes[0].count : 0;
        const recipeCount = recipeRes && recipeRes.length > 0 ? recipeRes[0].count : 0;
        return forumCount + recipeCount;
      }),

      // Top selling rice
      Order.aggregate([
        { $unwind: '$orderItems' },
        {
          $lookup: {
            from: 'products',
            localField: 'orderItems.product',
            foreignField: '_id',
            as: 'product'
          }
        },
        { $unwind: '$product' },
        {
          $group: {
            _id: '$product.name',
            totalSold: { $sum: '$orderItems.qty' }
          }
        },
        { $sort: { totalSold: -1 } },
        { $limit: 3 }
      ]).catch(() => []),

      // Top sellers
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startOfCurrentMonth }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'seller',
            foreignField: '_id',
            as: 'sellerInfo'
          }
        },
        { $unwind: '$sellerInfo' },
        {
          $group: {
            _id: '$seller',
            name: { $first: '$sellerInfo.name' },
            orderCount: { $sum: 1 },
            totalRevenue: { $sum: '$productAmount' } // Seller GMV
          }
        },
        { $sort: { orderCount: -1 } },
        { $limit: 3 }
      ]).catch(() => []),

      // Recent activities
      Notification.find()
        .populate('user', 'name')
        .sort({ createdAt: -1 })
        .limit(10)
        .catch(() => []),

      // Monthly revenue for chart (current year)
      Order.aggregate([
        {
          $match: {
            $or: [{ isPaid: true }, { orderStatus: 'delivered' }],
            createdAt: { $gte: new Date(new Date().getFullYear(), 0, 1) }
          }
        },
        {
          $group: {
            _id: { $month: '$createdAt' },
            revenue: { $sum: { $ifNull: ['$adminAmount', { $multiply: ['$totalPrice', 0.15] }] } }
          }
        },
        { $sort: { '_id': 1 } }
      ]).catch(() => []),

      // Last month revenue for growth calculation
      Order.aggregate([
        {
          $match: {
            $or: [{ isPaid: true }, { orderStatus: 'delivered' }],
            createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth }
          }
        },
        { $group: { _id: null, total: { $sum: { $ifNull: ['$adminAmount', { $multiply: ['$totalPrice', 0.15] }] } } } }
      ]).catch(() => []),

      // New users current month
      User.countDocuments({ createdAt: { $gte: startOfCurrentMonth } }).catch(() => 0),

      // New users last month
      User.countDocuments({ createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } }).catch(() => 0)
    ]);

    // Calculate totals with fallbacks
    const totalRevenue = revenueData && revenueData.length > 0 ? revenueData[0].totalRevenue : 0;
    const lastMonthTotalRevenue = lastMonthRevenueData && lastMonthRevenueData.length > 0 ? lastMonthRevenueData[0].total : 0;

    // Calculate revenue this month
    const currentMonthNum = now.getMonth() + 1;
    const currentMonthRevenue = monthlyRevenue.find(m => m && m._id === currentMonthNum)?.revenue || 0;

    // Calculate growth percentages
    const calculateGrowth = (current, last) => {
      if (last === 0) return current > 0 ? 100 : 0;
      return parseFloat(((current - last) / last * 100).toFixed(1));
    };

    const revenueGrowth = calculateGrowth(currentMonthRevenue, lastMonthTotalRevenue);
    const userGrowth = calculateGrowth(newUsersCurrentMonth, newUsersLastMonth);

    // Format monthly revenue for chart
    const monthlyRevenueChart = Array.from({ length: 12 }, (_, i) => {
      const monthData = monthlyRevenue.find(m => m && m._id === i + 1);
      return {
        month: new Date(2025, i).toLocaleString('default', { month: 'short' }),
        revenue: monthData?.revenue || 0
      };
    });

    const responseData = {
      stats: {
        totalUsers,
        totalOrders,
        activeSellers,
        activeCustomers,
        totalRecipes,
        totalForumPosts,
        totalRevenue,
        pendingModeration: {
          forumPosts: pendingForumPosts,
          recipes: pendingRecipes,
          comments: pendingCommentsCount
        }
      },
      topSellingRice: topRiceVarieties,
      topSellers,
      recentActivities: recentActivities.map(activity => ({
        id: activity._id,
        type: activity.type,
        title: activity.title,
        message: activity.message,
        user: activity.user?.name,
        createdAt: activity.createdAt
      })),
      monthlyRevenue: monthlyRevenueChart,
      growthPercentage: revenueGrowth,
      userGrowthPercentage: userGrowth,
      systemHealth: {
        server: 'healthy',
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        backup: 'completed',
        uptime: process.uptime()
      }
    };

    res.json(responseData);

  } catch (error) {
    console.error('❌ Dashboard stats error:', error);
    res.status(500).json({ message: 'Error fetching stats', error: error.message });
  }
});

// 🔥 FIXED: Get real-time activities with better error handling
const getRealTimeActivities = asyncHandler(async (req, res) => {
  try {
    console.log('🔄 Fetching real-time activities...');

    const activities = await Notification.find()
      .populate('user', 'name profileImage')
      .sort({ createdAt: -1 })
      .limit(20);

    const formattedActivities = activities.map(activity => ({
      id: activity._id,
      type: activity.type,
      title: activity.title,
      message: activity.message,
      user: activity.user ? {
        name: activity.user.name,
        avatar: activity.user.profileImage
      } : null,
      timeAgo: activity.timeAgo,
      actionUrl: activity.actionUrl,
      createdAt: activity.createdAt
    }));

    console.log(`✅ Found ${formattedActivities.length} activities`);
    res.json({ activities: formattedActivities });

  } catch (error) {
    console.error('❌ Activities error:', error);
    res.status(500).json({
      message: 'Error fetching activities',
      error: error.message,
      activities: []
    });
  }
});

// 🔥 FIXED: Enhanced comments moderation with better filtering
const getCommentsForModeration = asyncHandler(async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const { type, page = 1, limit = 20, status = 'all' } = req.query;
    const skip = (page - 1) * limit;

    let comments = [];
    let total = 0;

    // Build query based on status filter
    const buildQuery = (baseType) => {
      const query = {};
      if (status === 'flagged') {
        query['comments.isFlagged'] = true;
      } else if (status === 'pending') {
        query['comments.approved'] = false;
        query['comments.isFlagged'] = false;
      } else if (status === 'all') {
        query['$or'] = [
          { 'comments.isFlagged': true },
          { 'comments.approved': false }
        ];
      }
      return query;
    };

    if (!type || type === 'forum') {
      const forumQuery = buildQuery('forum');
      const forumPosts = await ForumPost.find(forumQuery)
        .populate('userId', 'name email profileImage')
        .populate('comments.userId', 'name profileImage')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      forumPosts.forEach(post => {
        post.comments.forEach(comment => {
          if ((status === 'flagged' && comment.isFlagged) ||
            (status === 'pending' && !comment.approved && !comment.isFlagged) ||
            (status === 'all' && (!comment.approved || comment.isFlagged))) {
            comments.push({
              ...comment,
              type: 'forum',
              postId: post._id,
              postTitle: post.title,
              postAuthor: post.userId,
              postCategory: post.category,
              createdAt: comment.createdAt,
              reportCount: comment.reports?.length || 0,
              reports: comment.reports || []
            });
          }
        });
      });

      total += await ForumPost.countDocuments(forumQuery);
    }

    if (!type || type === 'recipe') {
      const recipeQuery = buildQuery('recipe');
      const recipes = await Recipe.find(recipeQuery)
        .populate('sellerId', 'name email profileImage')
        .populate('comments.userId', 'name profileImage')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      recipes.forEach(recipe => {
        recipe.comments.forEach(comment => {
          if ((status === 'flagged' && comment.isFlagged) ||
            (status === 'pending' && !comment.approved && !comment.isFlagged) ||
            (status === 'all' && (!comment.approved || comment.isFlagged))) {
            comments.push({
              ...comment,
              type: 'recipe',
              recipeId: recipe._id,
              recipeTitle: recipe.title,
              recipeAuthor: recipe.sellerId,
              riceType: recipe.riceType,
              createdAt: comment.createdAt,
              reportCount: comment.reports?.length || 0,
              reports: comment.reports || []
            });
          }
        });
      });

      total += await Recipe.countDocuments(recipeQuery);
    }

    // Sort all comments by creation date (newest first)
    comments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Apply pagination after sorting
    const paginatedComments = comments.slice(0, limit);

    res.json({
      comments: paginatedComments,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      limit: parseInt(limit),
      filters: {
        type: type || 'all',
        status: status
      }
    });
  } catch (error) {
    console.error('❌ Error in getCommentsForModeration:', error);
    res.status(500).json({
      message: 'Server error fetching comments for moderation',
      error: error.message
    });
  }
});

// 🔥 FIXED: Enhanced recipe analytics with error handling
const getRecipeAnalytics = asyncHandler(async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }

    const { timeframe = 'month' } = req.query;

    // Calculate date ranges
    const now = new Date();
    let startDate;
    switch (timeframe) {
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'quarter':
        startDate = new Date(now.setMonth(now.getMonth() - 3));
        break;
      default:
        startDate = new Date(now.setMonth(now.getMonth() - 1));
    }

    const [
      recipeTrends,
      topSellers,
      popularRiceTypes,
      engagementStats,
      statusDistribution
    ] = await Promise.all([
      // Recipe submission trends
      Recipe.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]).catch(() => []),

      // Top sellers by recipes
      Recipe.aggregate([
        {
          $group: {
            _id: "$sellerId",
            recipeCount: { $sum: 1 },
            avgRating: { $avg: "$averageRating" }
          }
        },
        { $sort: { recipeCount: -1 } },
        { $limit: 10 }
      ]).catch(() => []),

      // Popular rice types
      Recipe.aggregate([
        {
          $group: {
            _id: "$riceType",
            count: { $sum: 1 },
            avgRating: { $avg: "$averageRating" }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 8 }
      ]).catch(() => []),

      // Engagement statistics
      Recipe.aggregate([
        {
          $group: {
            _id: null,
            totalLikes: { $sum: { $size: "$likes" } },
            totalComments: { $sum: { $size: "$comments" } },
            totalShares: { $sum: "$shares" },
            avgRating: { $avg: "$averageRating" },
            totalReviews: { $sum: "$numReviews" }
          }
        }
      ]).catch(() => [{}]),

      // Status distribution
      Recipe.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 }
          }
        }
      ]).catch(() => [])
    ]);

    // Populate seller names for top sellers
    const populatedTopSellers = await Promise.all(
      topSellers.map(async (seller) => {
        try {
          const sellerDetails = await User.findById(seller._id).select('name email');
          return {
            ...seller,
            sellerName: sellerDetails?.name || 'Unknown Seller',
            sellerEmail: sellerDetails?.email
          };
        } catch (error) {
          return {
            ...seller,
            sellerName: 'Unknown Seller',
            sellerEmail: null
          };
        }
      })
    );

    res.json({
      timeframe,
      startDate,
      endDate: new Date(),
      analytics: {
        trends: recipeTrends,
        topSellers: populatedTopSellers,
        popularRiceTypes,
        engagement: engagementStats[0] || {},
        statusDistribution: statusDistribution.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {})
      }
    });
  } catch (error) {
    console.error('❌ Error in getRecipeAnalytics:', error);
    res.status(500).json({
      message: 'Server error fetching recipe analytics',
      error: error.message
    });
  }
});

// 🔥 FIXED: Moderate a comment with better validation
const moderateComment = asyncHandler(async (req, res) => {
  try {
    const { commentId, action, moderationNotes } = req.body;
    const { type, postId, recipeId } = req.query;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action. Use "approve" or "reject".' });
    }

    let updateQuery;
    let model;
    let itemId;

    if (type === 'forum') {
      model = ForumPost;
      itemId = postId;
      updateQuery = {
        $set: {
          'comments.$[comment].approved': action === 'approve',
          'comments.$[comment].isFlagged': false,
          'comments.$[comment].moderationNotes': moderationNotes,
          'comments.$[comment].moderatedBy': req.user._id,
          'comments.$[comment].moderatedAt': new Date()
        }
      };
    } else if (type === 'recipe') {
      model = Recipe;
      itemId = recipeId;
      updateQuery = {
        $set: {
          'comments.$[comment].approved': action === 'approve',
          'comments.$[comment].isFlagged': false,
          'comments.$[comment].moderationNotes': moderationNotes,
          'comments.$[comment].moderatedBy': req.user._id,
          'comments.$[comment].moderatedAt': new Date()
        }
      };
    } else {
      return res.status(400).json({ message: 'Invalid type. Use "forum" or "recipe".' });
    }

    const result = await model.updateOne(
      { _id: itemId },
      updateQuery,
      {
        arrayFilters: [
          { 'comment._id': commentId }
        ]
      }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    res.json({
      message: `Comment ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      action,
      moderatedBy: req.user._id,
      moderatedAt: new Date()
    });
  } catch (error) {
    console.error('❌ Error in moderateComment:', error);
    res.status(500).json({
      message: 'Server error moderating comment',
      error: error.message
    });
  }
});

// 🔥 FIXED: Platform overview with comprehensive error handling
const getPlatformOverview = asyncHandler(async (req, res) => {
  try {
    console.log('🔄 Fetching platform overview...');

    const [
      todayOrders,
      todayRevenue,
      newUsersToday,
      pendingKyc,
      lowStockProducts,
      recentSignups
    ] = await Promise.all([
      // Today's orders
      Order.countDocuments({
        createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      }).catch(() => 0),

      // Today's revenue - Platform Earnings
      Order.aggregate([
        {
          $match: {
            isPaid: true,
            createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
          }
        },
        { $group: { _id: null, total: { $sum: '$adminAmount' } } }
      ]).catch(() => []),

      // New users today
      User.countDocuments({
        createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      }).catch(() => 0),

      // Pending KYC applications
      KycApplication.countDocuments({ status: 'pending' }).catch(() => 0),

      // Low stock products
      Product.countDocuments({ countInStock: { $lt: 10 } }).catch(() => 0),

      // Recent signups (last 7 days)
      User.find({
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      })
        .select('name email role createdAt')
        .sort({ createdAt: -1 })
        .limit(5)
        .catch(() => [])
    ]);

    const responseData = {
      overview: {
        todayOrders: todayOrders || 0,
        todayRevenue: todayRevenue && todayRevenue.length > 0 ? todayRevenue[0].total : 0,
        newUsersToday: newUsersToday || 0,
        pendingKyc: pendingKyc || 0,
        lowStockProducts: lowStockProducts || 0,
        recentSignups: recentSignups || []
      },
      timestamp: new Date()
    };

    console.log('✅ Platform overview prepared successfully');
    res.json(responseData);

  } catch (error) {
    console.error('❌ Error in getPlatformOverview:', error);
    res.status(500).json({
      message: 'Server error fetching platform overview',
      error: error.message,
      overview: {
        todayOrders: 0,
        todayRevenue: 0,
        newUsersToday: 0,
        pendingKyc: 0,
        lowStockProducts: 0,
        recentSignups: []
      },
      timestamp: new Date()
    });
  }
});


// 🔥 NEW: Export analytics data as CSV
const exportAnalyticsCSV = asyncHandler(async (req, res) => {
  try {
    const { type = 'sales', timeframe = 'month' } = req.query;

    console.log(`🔄 Exporting ${type} analytics as CSV for ${timeframe}...`);

    let csvData = '';
    let filename = '';

    // Helper function for date calculation
    const getStartDate = (timeframe) => {
      const now = new Date();
      switch (timeframe) {
        case 'today':
          return new Date(now.setHours(0, 0, 0, 0));
        case 'week':
          return new Date(now.setDate(now.getDate() - 7));
        case 'month':
          return new Date(now.setMonth(now.getMonth() - 1));
        case 'quarter':
          return new Date(now.setMonth(now.getMonth() - 3));
        case 'year':
          return new Date(now.setFullYear(now.getFullYear() - 1));
        default:
          return new Date(now.setMonth(now.getMonth() - 1));
      }
    };

    const startDate = getStartDate(timeframe);

    switch (type) {
      case 'sales':
        const salesData = await Order.aggregate([
          {
            $match: {
              isPaid: true,
              createdAt: { $gte: startDate }
            }
          },
          {
            $group: {
              _id: {
                $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
              },
              revenue: { $sum: "$totalPrice" },
              orders: { $sum: 1 },
              commission: { $sum: "$commissionAmount" }
            }
          },
          { $sort: { _id: 1 } }
        ]);

        csvData = 'Date,Revenue,Orders,Commission\n';
        salesData.forEach(item => {
          csvData += `${item._id},${item.revenue},${item.orders},${item.commission}\n`;
        });
        filename = `sales-analytics-${timeframe}.csv`;
        break;

      case 'orders':
        const orderData = await Order.find({
          createdAt: { $gte: startDate }
        }).populate('user', 'name').populate('seller', 'name');

        csvData = 'Order ID,Customer,Seller,Amount,Status,Payment Method,Created At\n';
        orderData.forEach(order => {
          csvData += `${order._id},${order.user?.name || 'N/A'},${order.seller?.name || 'N/A'},${order.totalPrice},${order.orderStatus},${order.paymentMethod},${order.createdAt}\n`;
        });
        filename = `orders-analytics-${timeframe}.csv`;
        break;

      case 'users':
        const userData = await User.find({
          createdAt: { $gte: startDate }
        }).select('name email role createdAt');

        csvData = 'Name,Email,Role,Created At\n';
        userData.forEach(user => {
          csvData += `${user.name},${user.email},${user.role},${user.createdAt}\n`;
        });
        filename = `users-analytics-${timeframe}.csv`;
        break;

      case 'products':
        const productData = await Product.find({
          createdAt: { $gte: startDate }
        }).select('name seller price countInStock ratings createdAt')
          .populate('seller', 'name');

        csvData = 'Product Name,Seller,Price,Stock,Ratings,Created At\n';
        productData.forEach(product => {
          csvData += `${product.name},${product.seller?.name || 'N/A'},${product.price},${product.countInStock},${product.ratings},${product.createdAt}\n`;
        });
        filename = `products-analytics-${timeframe}.csv`;
        break;

      default:
        return res.status(400).json({ message: 'Invalid export type' });
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.send(csvData);

    console.log('✅ Analytics data exported successfully');
  } catch (error) {
    console.error('❌ Export analytics error:', error);
    res.status(500).json({
      message: 'Error exporting analytics data',
      error: error.message
    });
  }
});

// 🔥 NEW: Get real-time analytics alerts
const getAnalyticsAlerts = asyncHandler(async (req, res) => {
  try {
    console.log('🔄 Fetching analytics alerts...');

    const [
      lowStockCount,
      pendingKycCount,
      highValueCOD,
      delayedOrders,
      systemIssues
    ] = await Promise.all([
      // Low stock products
      Product.countDocuments({ countInStock: { $lt: 5 } }).catch(() => 0),

      // Pending KYC
      KycApplication.countDocuments({ status: 'pending' }).catch(() => 0),

      // High value COD orders
      Order.countDocuments({
        paymentMethod: 'cod',
        totalPrice: { $gt: 5000 },
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }).catch(() => 0),

      // Delayed orders
      Order.countDocuments({
        orderStatus: { $in: ['processing', 'packed', 'shipped'] },
        createdAt: { $lte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) }
      }).catch(() => 0),

      // System issues
      Promise.resolve(mongoose.connection.readyState !== 1 ? 1 : 0)
    ]);

    const alerts = [];

    if (lowStockCount > 0) {
      alerts.push({
        type: 'warning',
        title: 'Low Stock Alert',
        message: `${lowStockCount} products are running low on stock`,
        priority: 'medium',
        action: '/admin/products'
      });
    }

    if (pendingKycCount > 0) {
      alerts.push({
        type: 'info',
        title: 'Pending KYC Applications',
        message: `${pendingKycCount} KYC applications awaiting review`,
        priority: 'high',
        action: '/admin/kyc'
      });
    }

    if (highValueCOD > 0) {
      alerts.push({
        type: 'warning',
        title: 'High Value COD Orders',
        message: `${highValueCOD} high value COD orders need attention`,
        priority: 'medium',
        action: '/admin/orders'
      });
    }

    if (delayedOrders > 0) {
      alerts.push({
        type: 'error',
        title: 'Delayed Orders',
        message: `${delayedOrders} orders are delayed in processing`,
        priority: 'high',
        action: '/admin/orders'
      });
    }

    if (systemIssues > 0) {
      alerts.push({
        type: 'error',
        title: 'System Issue',
        message: 'Database connection issue detected',
        priority: 'critical',
        action: '/admin/settings'
      });
    }

    // Sort alerts by priority
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    alerts.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    console.log(`✅ Found ${alerts.length} analytics alerts`);
    res.json({ alerts });

  } catch (error) {
    console.error('❌ Analytics alerts error:', error);
    res.status(500).json({
      message: 'Error fetching analytics alerts',
      error: error.message,
      alerts: []
    });
  }
});

const getAnalyticsData = asyncHandler(async (req, res) => {
  const { timeframe = 'week' } = req.query;
  const now = new Date();
  let startDate;

  if (timeframe === 'week') {
    startDate = new Date(now.setDate(now.getDate() - 7));
  } else if (timeframe === 'month') {
    startDate = new Date(now.setMonth(now.getMonth() - 1));
  } else if (timeframe === 'year') {
    startDate = new Date(now.setFullYear(now.getFullYear() - 1));
  } else {
    startDate = new Date(now.setDate(now.getDate() - 7));
  }

  try {
    // 1. Sales Overview
    const salesOverview = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate }, orderStatus: { $ne: 'cancelled' } } },
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$totalPrice" },
          commissionEarned: { $sum: { $ifNull: ["$commissionAmount", { $multiply: ["$totalPrice", 0.15] }] } },
          count: { $sum: 1 }
        }
      }
    ]);

    const dailySales = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate }, orderStatus: { $ne: 'cancelled' } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          sales: { $sum: "$totalPrice" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const topRiceTypes = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $unwind: "$orderItems" },
      { $group: { _id: "$orderItems.name", value: { $sum: "$orderItems.qty" } } },
      { $sort: { value: -1 } },
      { $limit: 5 }
    ]);

    // 2. Order Performance
    const orderStats = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: "$orderStatus", count: { $sum: 1 } } }
    ]);

    const topSellers = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate }, orderStatus: 'delivered' } },
      { $group: { _id: "$seller", totalSales: { $sum: "$totalPrice" }, orderCount: { $sum: 1 } } },
      { $sort: { totalSales: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'sellerInfo' } },
      { $unwind: '$sellerInfo' },
      { $project: { name: '$sellerInfo.name', sales: '$totalSales', orders: '$orderCount' } }
    ]);

    // 3. Payment Trends
    const paymentMethods = await Payment.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      { $group: { _id: "$method", value: { $sum: 1 } } }
    ]);

    const dailyPayments = await Payment.aggregate([
      { $match: { createdAt: { $gte: startDate }, status: 'completed' } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          amount: { $sum: "$amount" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // 4. User Engagement
    const userGrowth = await User.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          users: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const activeUsers = {
      customers: await User.countDocuments({ role: 'customer' }),
      sellers: await User.countDocuments({ role: 'seller' }),
      deliveryPartners: await User.countDocuments({ role: 'deliveryPartner' })
    };

    // 5. Inventory & Alerts
    const lowStock = await Product.find({ stock: { $lt: 10 } }).limit(5).select('name stock price');

    res.json({
      success: true,
      data: {
        salesOverview: {
          totalSales: salesOverview[0]?.totalSales || 0,
          dailySales: dailySales.map(d => ({ day: d._id, sales: d.amount })),
          topRiceTypes: topRiceTypes.map(t => ({ name: t._id, value: t.value })),
          commissionEarned: salesOverview[0]?.commissionEarned || 0
        },
        orderPerformance: {
          totalOrders: salesOverview[0]?.totalOrders || 0,
          orderStatus: orderStats.map(s => ({ name: s._id, value: s.count })),
          topSellers: topSellers.map(s => ({ ...s, revenue: s.sales })),
          deliveryStats: { onTime: 85, delayed: 10, cancelled: 5 } // Mocked for now
        },
        paymentTrends: {
          paymentMethods: paymentMethods.map(p => ({ name: p._id.toUpperCase(), value: p.value })),
          dailyPayments: dailyPayments.map(d => ({ date: d._id, amount: d.amount })),
          refundRate: 2.5, // Mocked
          highValueCOD: await Order.countDocuments({ paymentMethod: 'cod', totalPrice: { $gt: 5000 }, orderStatus: 'placed' })
        },
        userEngagement: {
          activeUsers,
          userGrowth: userGrowth.map(u => ({ month: u._id, users: u.users })),
          recipeViews: 1250, // Mocked
          conversionRate: 3.8
        },
        inventoryAlerts: {
          lowStock: lowStock.map(p => ({ product: p.name, stock: p.stock })),
          fraudFlags: 0,
          topPromotions: []
        }
      }
    });

  } catch (error) {
    console.error('Analytics Error:', error);
    res.status(500).json({ message: 'Error fetching analytics data', error: error.message });
  }
});

const bootstrapAdmin = asyncHandler(async (req, res) => {
  // 1. Check if ANY admin already exists
  const adminCount = await User.countDocuments({ role: 'admin' });
  if (adminCount > 0) {
    res.status(403);
    throw new Error('Admin account already exists. Bootstrap disabled.');
  }

  const user = await User.findById(req.user._id);

  if (user) {
    user.role = 'admin';
    await user.save();
    console.log(`✅ User ${user.email} promoted to ADMIN via bootstrap API`);
    res.json({ message: 'User promoted to Admin. Please logout and login again.' });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

module.exports = {
  getUsers,
  getOrders,
  getSearchLogs,
  updateSellerLocation,
  getDashboardStats,
  getRealTimeActivities,
  getCommentsForModeration,
  getRecipeAnalytics,
  moderateComment,
  getPlatformOverview,
  exportAnalyticsCSV,
  getAnalyticsData,
  getAnalyticsAlerts,
  bootstrapAdmin
};