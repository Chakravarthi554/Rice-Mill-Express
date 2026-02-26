const asyncHandler = require('express-async-handler');
const BulkOrder = require('../models/BulkOrder');
const Product = require('../models/Product');
const User = require('../models/User');
const Order = require('../models/Order');
const Notification = require('../models/Notification');

/**
 * @desc    Create a new bulk order
 * @route   POST /api/bulk-orders
 * @access  Private/Customer
 */
exports.createBulkOrder = asyncHandler(async (req, res) => {
  try {
    const {
      items,
      shippingAddress,
      paymentMethod = 'advance',
      creditDays = 0,
      advanceAmount = 0,
      notes = '',
      expectedDeliveryDate
    } = req.body;

    console.log('🔄 Creating bulk order with data:', {
      itemsCount: items?.length,
      paymentMethod,
      buyer: req.user.id
    });

    // Validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one item is required for bulk order'
      });
    }

    if (!shippingAddress || !shippingAddress.houseNumber || !shippingAddress.street || !shippingAddress.city) {
      return res.status(400).json({
        success: false,
        message: 'Complete shipping address (including House No) is required'
      });
    }

    // Validate all products and check seller consistency
    const productIds = items.map(item => item.product);
    const products = await Product.find({ _id: { $in: productIds } })
      .populate('seller', 'name businessName');

    if (products.length !== items.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more products not found'
      });
    }

    // Check if all products are from the same seller
    const sellerIds = [...new Set(products.map(p => p.seller?._id?.toString()).filter(Boolean))];
    if (sellerIds.length !== 1) {
      return res.status(400).json({
        success: false,
        message: 'All products must be from the same seller for bulk orders'
      });
    }

    const sellerId = sellerIds[0];

    // Validate stock and minimum quantities
    for (const item of items) {
      const product = products.find(p => p._id.toString() === item.product);
      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Product ${item.product} not found`
        });
      }

      // Check minimum bulk quantity
      const minBulkQty = product.minBulkQuantity || 50;
      if (item.quantity < minBulkQty) {
        return res.status(400).json({
          success: false,
          message: `Minimum order quantity for ${product.name} is ${minBulkQty} ${product.unit || 'kg'}`
        });
      }

      // Check stock availability
      if (product.countInStock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${product.countInStock}, Requested: ${item.quantity}`
        });
      }
    }

    // Reserve stock
    for (const item of items) {
      const product = products.find(p => p._id.toString() === item.product);
      if (product) {
        product.countInStock -= item.quantity;
        await product.save();
        console.log(`📦 Reserved ${item.quantity} units of ${product.name}, Remaining: ${product.countInStock}`);
      }
    }

    // Prepare bulk order data
    const bulkOrderData = {
      buyer: req.user.id,
      seller: sellerId,
      items: items.map(item => {
        const product = products.find(p => p._id.toString() === item.product);
        return {
          product: item.product,
          name: product.name,
          image: product.images?.[0] || '/images/default-image.jpg',
          quantity: item.quantity,
          requestedPrice: product.price,
          unit: product.unit || 'kg',
          conversionRate: product.conversionRate || 1
        };
      }),
      shippingAddress,
      paymentDetails: {
        paymentMethod,
        creditDays: paymentMethod === 'credit' ? creditDays : 0,
        advanceAmount: paymentMethod === 'advance' ? advanceAmount : 0
      },
      notes,
      expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : undefined,
      status: 'requested'
    };

    // Create bulk order
    const bulkOrder = new BulkOrder(bulkOrderData);
    await bulkOrder.save();

    // Create regular orders for synchronization
    const regularOrders = [];
    for (const item of items) {
      const product = products.find(p => p._id.toString() === item.product);
      if (product) {
        const regularOrder = new Order({
          user: req.user.id,
          seller: sellerId,
          orderItems: [{
            product: product._id,
            name: product.name,
            qty: item.quantity,
            price: product.price,
            image: product.images?.[0] || '/images/default.jpg',
            seller: sellerId
          }],
          shippingAddress,
          paymentMethod: 'bulk_order',
          itemsPrice: product.price * item.quantity,
          taxPrice: 0,
          shippingPrice: 0,
          totalPrice: product.price * item.quantity,
          orderStatus: 'placed',
          isPaid: false,
          paidAt: null,
          isDelivered: false,
          deliveredAt: null,
          isBulkOrder: true,
          bulkOrderRef: bulkOrder._id,
          paymentTerms: paymentMethod,
          notes: `Bulk order item - ${bulkOrder.orderNumber}`
        });

        await regularOrder.save();
        regularOrders.push(regularOrder);
      }
    }

    // Update bulk order with regular order references
    bulkOrder.regularOrderRefs = regularOrders.map(order => order._id);
    await bulkOrder.save();

    // Populate the response
    const populatedOrder = await BulkOrder.findById(bulkOrder._id)
      .populate('buyer', 'name email phone')
      .populate('seller', 'name businessName phone rating');

    // Create notifications
    await Notification.create({
      user: sellerId,
      type: 'BULK_ORDER_REQUEST',
      title: 'New Bulk Order Request',
      message: `You have a new bulk order request from ${req.user.name}`,
      priority: 'high',
      relatedEntity: bulkOrder._id,
      entityModel: 'BulkOrder',
      metadata: {
        orderNumber: bulkOrder.orderNumber,
        totalItems: items.length,
        totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
        buyerName: req.user.name
      }
    });

    // Notify buyer
    await Notification.create({
      user: req.user.id,
      type: 'BULK_ORDER_PLACED',
      title: 'Bulk Order Placed',
      message: `Your bulk order #${bulkOrder.orderNumber} has been placed successfully`,
      priority: 'medium',
      relatedEntity: bulkOrder._id,
      entityModel: 'BulkOrder'
    });

    console.log(`✅ Bulk order created successfully: ${bulkOrder.orderNumber}`);

    res.status(201).json({
      success: true,
      message: 'Bulk order created successfully',
      order: populatedOrder,
      regularOrders: regularOrders.map(order => ({
        _id: order._id,
        orderStatus: order.orderStatus,
        totalPrice: order.totalPrice
      }))
    });

  } catch (error) {
    console.error('❌ Create bulk order error:', error);

    // Restore stock if order creation failed
    if (req.body.items) {
      try {
        for (const item of req.body.items) {
          const product = await Product.findById(item.product);
          if (product) {
            product.countInStock += item.quantity;
            await product.save();
          }
        }
      } catch (restoreError) {
        console.error('❌ Error restoring stock:', restoreError);
      }
    }

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Server error creating bulk order'
    });
  }
});

/**
 * @desc    Get bulk orders for authenticated user
 * @route   GET /api/bulk-orders
 * @access  Private
 */
exports.getBulkOrders = asyncHandler(async (req, res) => {
  try {
    const {
      status,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    let query = { isActive: true };

    // Role-based filtering
    if (req.user.role === 'customer') {
      query.buyer = req.user.id;
    } else if (req.user.role === 'seller') {
      query.seller = req.user.id;
    }
    // Admin can see all orders

    if (status && status !== 'all') {
      query.status = status;
    }

    const bulkOrders = await BulkOrder.find(query)
      .populate('buyer', 'name email phone')
      .populate('seller', 'name businessName phone rating')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    const total = await BulkOrder.countDocuments(query);

    res.json({
      success: true,
      count: bulkOrders.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      bulkOrders
    });

  } catch (error) {
    console.error('❌ Get bulk orders error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching bulk orders'
    });
  }
});

/**
 * @desc    Get single bulk order by ID
 * @route   GET /api/bulk-orders/:id
 * @access  Private
 */
exports.getBulkOrderById = asyncHandler(async (req, res) => {
  try {
    const bulkOrder = await BulkOrder.findOne({
      _id: req.params.id,
      isActive: true
    })
      .populate('buyer', 'name email phone address')
      .populate('seller', 'name businessName phone address rating')
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name');

    if (!bulkOrder) {
      return res.status(404).json({
        success: false,
        message: 'Bulk order not found'
      });
    }

    // Authorization check
    const isBuyer = bulkOrder.buyer._id.toString() === req.user.id;
    const isSeller = bulkOrder.seller._id.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isBuyer && !isSeller && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this order'
      });
    }

    // Get related regular orders
    const regularOrders = await Order.find({
      bulkOrderRef: req.params.id
    })
      .populate('user', 'name email')
      .populate('seller', 'name businessName')
      .populate('orderItems.product', 'name price images');

    res.json({
      success: true,
      bulkOrder: {
        ...bulkOrder.toObject(),
        regularOrders
      }
    });

  } catch (error) {
    console.error('❌ Get bulk order error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching bulk order'
    });
  }
});

/**
 * @desc    Update bulk order (seller actions - quote, negotiate, status updates)
 * @route   PUT /api/bulk-orders/:id
 * @access  Private/Seller
 */
exports.updateBulkOrder = asyncHandler(async (req, res) => {
  try {
    const {
      action,
      discount,
      negotiatedPrices,
      notes,
      shippingDate,
      trackingNumber,
      carrier
    } = req.body;

    const bulkOrder = await BulkOrder.findOne({
      _id: req.params.id,
      isActive: true
    });

    if (!bulkOrder) {
      return res.status(404).json({
        success: false,
        message: 'Bulk order not found'
      });
    }

    // Authorization - only seller or admin can update
    if (bulkOrder.seller.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this order'
      });
    }

    let updateMessage = '';

    switch (action) {
      case 'send_quote':
        // Validate negotiated prices
        if (!negotiatedPrices || !Array.isArray(negotiatedPrices)) {
          return res.status(400).json({
            success: false,
            message: 'Negotiated prices are required for sending quote'
          });
        }

        // Update items with negotiated prices
        for (const np of negotiatedPrices) {
          const item = bulkOrder.items.id(np.productId);
          if (item) {
            item.negotiatedPrice = np.price;
          }
        }

        bulkOrder.discount = discount || 0;
        bulkOrder.status = 'quote_sent';
        bulkOrder.sellerNotes = notes || '';
        bulkOrder.updatedBy = req.user.id;

        updateMessage = 'Quote sent successfully';
        break;

      case 'confirm_order':
        if (bulkOrder.status !== 'quote_sent' && bulkOrder.status !== 'negotiating') {
          return res.status(400).json({
            success: false,
            message: 'Order can only be confirmed from quote_sent or negotiating status'
          });
        }

        bulkOrder.status = 'confirmed';
        bulkOrder.updatedBy = req.user.id;
        updateMessage = 'Order confirmed successfully';
        break;

      case 'start_processing':
        bulkOrder.status = 'processing';
        bulkOrder.shippingDate = shippingDate || new Date();
        bulkOrder.updatedBy = req.user.id;
        updateMessage = 'Order processing started';
        break;

      case 'mark_shipped':
        if (!trackingNumber) {
          return res.status(400).json({
            success: false,
            message: 'Tracking number is required for shipping'
          });
        }

        bulkOrder.status = 'shipped';
        bulkOrder.trackingNumber = trackingNumber;
        bulkOrder.carrier = carrier;
        bulkOrder.shippingDate = shippingDate || new Date();
        bulkOrder.updatedBy = req.user.id;
        updateMessage = 'Order marked as shipped';
        break;

      case 'mark_delivered':
        bulkOrder.status = 'delivered';
        bulkOrder.deliveryDate = new Date();
        bulkOrder.updatedBy = req.user.id;
        updateMessage = 'Order marked as delivered';
        break;

      case 'update_notes':
        bulkOrder.sellerNotes = notes || '';
        bulkOrder.updatedBy = req.user.id;
        updateMessage = 'Notes updated successfully';
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid action'
        });
    }

    await bulkOrder.save();

    // Sync regular orders status
    if (['confirmed', 'processing', 'shipped', 'delivered'].includes(bulkOrder.status)) {
      await Order.updateMany(
        { bulkOrderRef: bulkOrder._id },
        {
          orderStatus: bulkOrder.status,
          ...(bulkOrder.status === 'shipped' && {
            shippedAt: bulkOrder.shippingDate,
            trackingNumber: bulkOrder.trackingNumber
          }),
          ...(bulkOrder.status === 'delivered' && {
            isDelivered: true,
            deliveredAt: bulkOrder.deliveryDate
          })
        }
      );
    }

    // Create notification for buyer
    await Notification.create({
      user: bulkOrder.buyer,
      type: 'BULK_ORDER_UPDATE',
      title: `Bulk Order ${action.replace('_', ' ')}`,
      message: `Your bulk order #${bulkOrder.orderNumber} has been updated: ${updateMessage}`,
      priority: 'medium',
      relatedEntity: bulkOrder._id,
      entityModel: 'BulkOrder',
      metadata: {
        newStatus: bulkOrder.status,
        action: action
      }
    });

    // Populate updated order for response
    const updatedOrder = await BulkOrder.findById(bulkOrder._id)
      .populate('buyer', 'name email phone')
      .populate('seller', 'name businessName phone');

    res.json({
      success: true,
      message: updateMessage,
      bulkOrder: updatedOrder
    });

  } catch (error) {
    console.error('❌ Update bulk order error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error updating bulk order'
    });
  }
});

/**
 * @desc    Cancel bulk order
 * @route   PUT /api/bulk-orders/:id/cancel
 * @access  Private/Customer or Seller
 */
exports.cancelBulkOrder = asyncHandler(async (req, res) => {
  try {
    const { cancellationReason } = req.body;

    if (!cancellationReason) {
      return res.status(400).json({
        success: false,
        message: 'Cancellation reason is required'
      });
    }

    const bulkOrder = await BulkOrder.findOne({
      _id: req.params.id,
      isActive: true
    });

    if (!bulkOrder) {
      return res.status(404).json({
        success: false,
        message: 'Bulk order not found'
      });
    }

    // Authorization check
    const isBuyer = bulkOrder.buyer.toString() === req.user.id;
    const isSeller = bulkOrder.seller.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isBuyer && !isSeller && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this order'
      });
    }

    // Check if order can be cancelled
    if (!bulkOrder.isCancellable) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled in current status: ${bulkOrder.status}`
      });
    }

    // Update order status
    bulkOrder.status = 'cancelled';
    bulkOrder.cancellationReason = cancellationReason;
    bulkOrder.cancelledBy = req.user.id;
    bulkOrder.updatedBy = req.user.id;

    await bulkOrder.save();

    // Restore product stock
    for (const item of bulkOrder.items) {
      const product = await Product.findById(item.product);
      if (product) {
        product.countInStock += item.quantity;
        await product.save();
        console.log(`🔄 Restored ${item.quantity} units of ${product.name}`);
      }
    }

    // Sync regular orders
    await Order.updateMany(
      { bulkOrderRef: bulkOrder._id },
      {
        orderStatus: 'cancelled',
        isCancelled: true,
        cancelledAt: new Date()
      }
    );

    // Create notifications
    const notifiedUser = isBuyer ? bulkOrder.seller : bulkOrder.buyer;
    await Notification.create({
      user: notifiedUser,
      type: 'BULK_ORDER_CANCELLED',
      title: 'Bulk Order Cancelled',
      message: `Bulk order #${bulkOrder.orderNumber} has been cancelled by ${isBuyer ? 'buyer' : 'seller'}`,
      priority: 'high',
      relatedEntity: bulkOrder._id,
      entityModel: 'BulkOrder',
      metadata: {
        cancelledBy: req.user.id,
        reason: cancellationReason
      }
    });

    res.json({
      success: true,
      message: 'Bulk order cancelled successfully',
      bulkOrder
    });

  } catch (error) {
    console.error('❌ Cancel bulk order error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error cancelling bulk order'
    });
  }
});

/**
 * @desc    Get bulk order statistics
 * @route   GET /api/bulk-orders/stats/overview
 * @access  Private/Admin
 */
exports.getBulkOrderStats = asyncHandler(async (req, res) => {
  try {
    let matchStage = { isActive: true };

    // If seller, only show their stats
    if (req.user.role === 'seller') {
      matchStage.seller = req.user.id;
    }

    const stats = await BulkOrder.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$finalAmount' },
          totalCommission: { $sum: '$commissionAmount' },
          totalSellerEarnings: { $sum: '$sellerEarnings' }
        }
      }
    ]);

    const totalOrders = await BulkOrder.countDocuments(matchStage);
    const totalRevenue = stats.reduce((sum, stat) => sum + (stat.totalRevenue || 0), 0);
    const totalCommission = stats.reduce((sum, stat) => sum + (stat.totalCommission || 0), 0);

    // Recent orders for dashboard
    const recentOrders = await BulkOrder.find(matchStage)
      .populate('buyer', 'name')
      .populate('seller', 'businessName')
      .sort('-createdAt')
      .limit(5);

    res.json({
      success: true,
      stats: {
        totalOrders,
        totalRevenue,
        totalCommission,
        byStatus: stats,
        recentOrders
      }
    });

  } catch (error) {
    console.error('❌ Get bulk order stats error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching statistics'
    });
  }
});

/**
 * @desc    Get seller's bulk orders
 * @route   GET /api/bulk-orders/seller
 * @access  Private/Seller
 */
exports.getSellerBulkOrders = asyncHandler(async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    let query = {
      seller: req.user.id,
      isActive: true
    };

    if (status && status !== 'all') {
      query.status = status;
    }

    const bulkOrders = await BulkOrder.find(query)
      .populate('buyer', 'name email phone')
      .populate('items.product', 'name brand images category price')
      .sort('-createdAt')
      .skip(skip)
      .limit(Number(limit));

    const total = await BulkOrder.countDocuments(query);

    // Get summary stats for seller
    const stats = await BulkOrder.aggregate([
      { $match: { seller: req.user.id, isActive: true } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalValue: { $sum: '$finalAmount' }
        }
      }
    ]);

    res.json({
      success: true,
      count: bulkOrders.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      bulkOrders,
      stats
    });

  } catch (error) {
    console.error('❌ Get seller bulk orders error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching seller bulk orders'
    });
  }
});

/**
 * @desc    Add review/rating to delivered bulk order
 * @route   PUT /api/bulk-orders/:id/review
 * @access  Private/Customer
 */
exports.addBulkOrderReview = asyncHandler(async (req, res) => {
  try {
    const { qualityRating, deliveryRating, review } = req.body;

    const bulkOrder = await BulkOrder.findOne({
      _id: req.params.id,
      buyer: req.user.id,
      status: 'delivered',
      isActive: true
    });

    if (!bulkOrder) {
      return res.status(404).json({
        success: false,
        message: 'Delivered bulk order not found'
      });
    }

    bulkOrder.qualityRating = qualityRating;
    bulkOrder.deliveryRating = deliveryRating;
    bulkOrder.buyerReview = review;
    bulkOrder.updatedBy = req.user.id;

    await bulkOrder.save();

    // Update seller rating (average of all orders)
    const sellerStats = await BulkOrder.aggregate([
      {
        $match: {
          seller: bulkOrder.seller,
          qualityRating: { $exists: true },
          deliveryRating: { $exists: true }
        }
      },
      {
        $group: {
          _id: '$seller',
          avgQualityRating: { $avg: '$qualityRating' },
          avgDeliveryRating: { $avg: '$deliveryRating' },
          totalReviews: { $sum: 1 }
        }
      }
    ]);

    if (sellerStats.length > 0) {
      const stats = sellerStats[0];
      await User.findByIdAndUpdate(bulkOrder.seller, {
        rating: (stats.avgQualityRating + stats.avgDeliveryRating) / 2,
        totalReviews: stats.totalReviews
      });
    }

    res.json({
      success: true,
      message: 'Review added successfully',
      bulkOrder
    });

  } catch (error) {
    console.error('❌ Add bulk order review error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error adding review'
    });
  }
});

module.exports = exports;