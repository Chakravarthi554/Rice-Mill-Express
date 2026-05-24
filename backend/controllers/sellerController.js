const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const mongoose = require('mongoose');
const axios = require('axios');
const { getAsync, setAsync } = require('../utils/redis');

const getSellerDashboard = asyncHandler(async (req, res) => {
  const sellerId = req.user.id;
  console.log('Fetching dashboard for seller:', sellerId);

  const [orders, products, earnings] = await Promise.all([
    Order.countDocuments({ seller: sellerId, orderStatus: { $nin: ['cancelled', 'pending_payment'] } }),
    Product.countDocuments({ seller: sellerId }),
    Order.aggregate([
      {
        $match: {
          seller: new mongoose.Types.ObjectId(sellerId),
          // ✅ FIX: Use $and to properly combine: (paid OR delivered) AND not cancelled/pending_payment
          $and: [
            { $or: [{ isPaid: true }, { orderStatus: 'delivered' }] },
            { orderStatus: { $nin: ['cancelled', 'pending_payment'] } }
          ]
        }
      },
      { $group: { _id: null, total: { $sum: { $ifNull: ['$sellerAmount', { $multiply: ['$totalPrice', 0.85] }] } } } }
    ])
  ]);

  res.json({
    orderCount: orders,
    productCount: products,
    totalEarnings: earnings[0]?.total || 0,
    pendingOrders: await Order.countDocuments({
      seller: sellerId,
      orderStatus: { $in: ['placed', 'processing', 'packed'] }
    })
  });
});

const getSellerProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ seller: req.user.id });
  res.json(products);
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const order = await Order.findOne({
    _id: req.params.id,
    seller: req.user.id
  });

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  order.orderStatus = status;
  order.statusHistory.push({ status, timestamp: new Date() });
  await order.save();

  const io = req.app.get('io');
  if (io && (status === 'delivered' || status === 'completed')) {
    io.to(`seller_${req.user.id.toString()}`).emit('REFRESH_ANALYTICS', { sellerId: req.user.id.toString() });
  }

  res.json(order);
});

const searchSellers = asyncHandler(async (req, res) => {
  const { query } = req.query;
  if (!query) {
    res.status(400);
    throw new Error('Query (city or pincode) is required');
  }

  try {
    const cacheKey = `geocode:${query.toLowerCase()}`;
    let location = await getAsync(cacheKey);
    let nearbySellers = [];

    if (!location) {
      try {
        const response = await axios.get('https://nominatim.openstreetmap.org/search', {
          params: { q: query, format: 'json', limit: 1 },
          headers: { 'User-Agent': 'RiceMillApp/1.0' },
        });

        if (response.data.length === 0) {
          throw new Error('Invalid city or pincode');
        }
        location = {
          latitude: parseFloat(response.data[0].lat),
          longitude: parseFloat(response.data[0].lon),
        };
        await setAsync(cacheKey, JSON.stringify(location), 'EX', 3600);
      } catch (geoError) {
        console.error('Geocoding error:', geoError.message);
        location = null;
      }
    } else {
      location = JSON.parse(location);
    }

    if (location) {
      nearbySellers = await User.aggregate([
        {
          $match: {
            role: 'seller',
            kycStatus: 'approved',
            'location.coordinates': { $ne: [0, 0] },
          },
        },
        {
          $geoNear: {
            near: { type: 'Point', coordinates: [location.longitude, location.latitude] },
            distanceField: 'distance',
            maxDistance: 50000,
            spherical: true,
          },
        },
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: 'seller',
            as: 'products',
          },
        },
        {
          $project: {
            _id: 1,
            shopName: '$businessDetails.businessName',
            riceVarieties: '$products.name',
            location: 1,
            phone: 1,
            email: 1,
            distance: { $divide: ['$distance', 1000] },
          },
        },
      ]);
    }

    await User.create({
      role: 'search_log',
      searchQuery: query,
      resultsCount: nearbySellers.length,
      timestamp: new Date(),
    });

    if (nearbySellers.length > 0) {
      return res.json({
        sellers: nearbySellers,
        message: 'Nearby sellers found',
      });
    }

    const allSellers = await User.aggregate([
      {
        $match: {
          role: 'seller',
          kycStatus: 'approved',
        },
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: 'seller',
          as: 'products',
        },
      },
      {
        $project: {
          _id: 1,
          shopName: '$businessDetails.businessName',
          riceVarieties: '$products.name',
          location: 1,
          phone: 1,
          email: 1,
          distance: null,
        },
      },
    ]);

    return res.json({
      sellers: allSellers,
      message: nearbySellers.length === 0 ? 'No nearby sellers found, showing all approved sellers' : 'Sellers found',
    });
  } catch (error) {
    console.error('Search sellers error:', error.message);
    res.status(400).json({ message: error.message });
  }
});

const getSellerAnalytics = asyncHandler(async (req, res) => {
  const sellerId = req.user.id;
  const timeframe = req.query.timeframe || '30d';
  console.log('Fetching analytics for seller:', sellerId, 'timeframe:', timeframe);

  let startDate;
  switch (timeframe) {
    case '7d':
      startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
    default:
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  }

  const orders = await Order.find({
    seller: new mongoose.Types.ObjectId(sellerId),
    orderStatus: { $in: ['placed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'completed'] },
    createdAt: { $gte: startDate },
  })
    .populate('orderItems.product', 'name')
    .lean();

  console.log('Fetched orders:', orders.length, 'for seller:', sellerId);

  if (!orders || orders.length === 0) {
    return res.json({
      totalSales: 0,
      totalOrders: 0,
      sales: [],
      popularProducts: [],
    });
  }

  // ✅ FIX: Use sellerAmount (actual seller earnings after commission deduction) instead of productAmount (GMV)
  const totalSales = orders.reduce((sum, order) => sum + (order.sellerAmount || order.sellerEarnings || (order.totalPrice * 0.85) || 0), 0);
  const totalOrders = orders.length;

  const salesByDate = orders.reduce((acc, order) => {
    const date = new Date(order.createdAt).toISOString().split('T')[0];
    acc[date] = (acc[date] || 0) + (order.sellerAmount || order.sellerEarnings || (order.totalPrice * 0.85) || 0);
    return acc;
  }, {});

  const salesData = Object.entries(salesByDate).map(([date, amount]) => ({
    date,
    amount,
  }));

  const productSales = {};
  orders.forEach((order) => {
    order.orderItems.forEach((item) => {
      const productName = item.product?.name || 'Unknown';
      productSales[productName] = (productSales[productName] || 0) + (item.qty || 0);
    });
  });

  const popularProducts = Object.entries(productSales)
    .map(([name, salesCount]) => ({ name, salesCount }))
    .sort((a, b) => b.salesCount - a.salesCount)
    .slice(0, 5);

  res.json({
    totalSales,
    totalOrders,
    sales: salesData,
    popularProducts,
  });
});

module.exports = {
  getSellerDashboard,
  getSellerProducts,
  updateOrderStatus,
  searchSellers,
  getSellerAnalytics
};