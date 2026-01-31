const DeliveryPartner = require('../models/deliveryPartner.js');
const Order = require('../models/Order.js');
const asyncHandler = require('../middleware/asyncHandler.js');
const { uploadDeliveryPhoto, uploadReplacementPhoto } = require('../utils/cloudinaryService.js');

// @desc    Get delivery partner dashboard stats
// @route   GET /api/delivery-partners/dashboard
// @access  Private/DeliveryPartner
const getDashboard = asyncHandler(async (req, res) => {
    const partnerProfile = await DeliveryPartner.findOne({ user: req.user._id });

    if (!partnerProfile) {
        res.status(404);
        throw new Error('Delivery partner profile not found');
    }

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get today's assigned orders
    const todayOrders = await Order.find({
        deliveryPartner: partnerProfile._id,
        createdAt: { $gte: today, $lt: tomorrow }
    }).countDocuments();

    // Get active deliveries (not delivered)
    const activeDeliveries = await Order.find({
        deliveryPartner: partnerProfile._id,
        deliveryPartnerStatus: { $in: ['assigned', 'picked_up', 'in_transit'] }
    }).countDocuments();

    // Get status counts
    const statusCounts = await Order.aggregate([
        {
            $match: {
                deliveryPartner: partnerProfile._id,
                deliveryPartnerStatus: { $ne: 'delivered' }
            }
        },
        {
            $group: {
                _id: '$deliveryPartnerStatus',
                count: { $sum: 1 }
            }
        }
    ]);

    // Get total deliveries completed
    const totalDeliveries = partnerProfile.totalDeliveries || 0;

    // Get today's completed deliveries
    const todayCompleted = await Order.find({
        deliveryPartner: partnerProfile._id,
        deliveryPartnerStatus: 'delivered',
        deliveredAt: { $gte: today, $lt: tomorrow }
    }).countDocuments();

    res.json({
        success: true,
        stats: {
            todayOrders,
            activeDeliveries,
            totalDeliveries,
            todayCompleted,
            statusCounts: statusCounts.reduce((acc, item) => {
                acc[item._id] = item.count;
                return acc;
            }, {}),
            rating: partnerProfile.rating || 5,
            onTimeRate: partnerProfile.onTimeDeliveryRate || 100
        }
    });
});

// @desc    Get delivery partner's assigned orders (ONLY assigned to them)
// @route   GET /api/delivery-partners/my-orders
// @access  Private/DeliveryPartner
const getMyOrders = asyncHandler(async (req, res) => {
    const { status, limit = 50 } = req.query;

    const partnerProfile = await DeliveryPartner.findOne({ user: req.user._id });

    if (!partnerProfile) {
        res.status(404);
        throw new Error('Delivery partner profile not found');
    }

    // Build query - ONLY orders assigned to this delivery partner
    const query = { deliveryPartner: partnerProfile._id };

    if (status) {
        query.deliveryPartnerStatus = status;
    } else {
        // Default: show non-delivered orders
        query.deliveryPartnerStatus = { $in: ['assigned', 'picked_up', 'in_transit'] };
    }

    const orders = await Order.find(query)
        .populate('user', 'name phone email')
        .populate('seller', 'name phone businessDetails')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit));

    res.json({
        success: true,
        orders
    });
});

// @desc    Get single order details (ONLY if assigned to this delivery partner)
// @route   GET /api/delivery-partners/order/:orderId
// @access  Private/DeliveryPartner
const getOrderDetails = asyncHandler(async (req, res) => {
    const { orderId } = req.params;

    const partnerProfile = await DeliveryPartner.findOne({ user: req.user._id });

    if (!partnerProfile) {
        res.status(404);
        throw new Error('Delivery partner profile not found');
    }

    const order = await Order.findById(orderId)
        .populate('user', 'name phone email')
        .populate('seller', 'name phone email businessDetails')
        .populate('deliveryPartner');

    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }

    // CRITICAL: Verify this order is assigned to this delivery partner
    if (!order.deliveryPartner || order.deliveryPartner._id.toString() !== partnerProfile._id.toString()) {
        res.status(403);
        throw new Error('Access denied: This order is not assigned to you');
    }

    res.json({
        success: true,
        order
    });
});

// @desc    Confirm pickup (Auto-updates to "Out for Delivery")
// @route   POST /api/delivery-partners/confirm-pickup/:orderId
// @access  Private/DeliveryPartner
const confirmPickup = asyncHandler(async (req, res) => {
    const { orderId } = req.params;

    const partnerProfile = await DeliveryPartner.findOne({ user: req.user._id });

    if (!partnerProfile) {
        res.status(404);
        throw new Error('Delivery partner profile not found');
    }

    const order = await Order.findById(orderId);

    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }

    // Verify assignment
    if (!order.deliveryPartner || order.deliveryPartner.toString() !== partnerProfile._id.toString()) {
        res.status(403);
        throw new Error('Access denied: This order is not assigned to you');
    }

    // Verify order status
    if (order.deliveryPartnerStatus !== 'assigned') {
        res.status(400);
        throw new Error(`Cannot confirm pickup for order with status: ${order.deliveryPartnerStatus}`);
    }

    // Update order - AUTO-STATUS TRANSITION
    const previousStatus = order.deliveryPartnerStatus;
    order.deliveryPartnerStatus = 'picked_up';
    order.orderStatus = 'out_for_delivery';
    order.deliveryPartnerPickedAt = new Date();
    order.pickupConfirmedBy = req.user._id;

    // Add to status history
    order.statusHistory.push({
        status: 'out_for_delivery',
        timestamp: new Date(),
        reason: 'Pickup confirmed by delivery partner'
    });

    // Add to auto-status updates
    order.autoStatusUpdates.push({
        from: previousStatus,
        to: 'picked_up',
        triggeredBy: 'pickup_confirmation',
        timestamp: new Date(),
        reason: 'Delivery partner confirmed pickup'
    });

    await order.save();

    // Emit Socket.io event for real-time update
    if (req.broadcastDeliveryPickup) {
        req.broadcastDeliveryPickup(orderId, partnerProfile._id, {
            orderStatus: order.orderStatus,
            deliveryPartnerStatus: order.deliveryPartnerStatus,
            pickedUpAt: order.deliveryPartnerPickedAt,
        });
    }

    // Also broadcast general order update
    if (req.broadcastOrderUpdate) {
        req.broadcastOrderUpdate(orderId, {
            action: 'pickup_confirmed',
            deliveryPartnerName: partnerProfile.user?.name,
        });
    }

    res.json({
        success: true,
        message: 'Pickup confirmed successfully. Order status updated to "Out for Delivery"',
        order
    });
});

// @desc    Start navigation (Auto-updates status)
// @route   POST /api/delivery-partners/start-navigation/:orderId
// @access  Private/DeliveryPartner
const startNavigation = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const { estimatedArrival } = req.body;

    const partnerProfile = await DeliveryPartner.findOne({ user: req.user._id });

    if (!partnerProfile) {
        res.status(404);
        throw new Error('Delivery partner profile not found');
    }

    const order = await Order.findById(orderId);

    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }

    // Verify assignment
    if (!order.deliveryPartner || order.deliveryPartner.toString() !== partnerProfile._id.toString()) {
        res.status(403);
        throw new Error('Access denied: This order is not assigned to you');
    }

    // Update navigation tracking
    const previousStatus = order.deliveryPartnerStatus;
    order.navigationStartedAt = new Date();
    order.deliveryPartnerStatus = 'in_transit';
    order.orderStatus = 'out_for_delivery';

    if (estimatedArrival) {
        order.estimatedArrivalTime = new Date(estimatedArrival);
    }

    // Add to auto-status updates
    order.autoStatusUpdates.push({
        from: previousStatus,
        to: 'in_transit',
        triggeredBy: 'navigation_started',
        timestamp: new Date(),
        reason: 'Delivery partner started navigation'
    });

    await order.save();

    // Emit Socket.io event
    if (req.broadcastNavigationStarted) {
        req.broadcastNavigationStarted(orderId, partnerProfile._id, {
            estimatedArrival: order.estimatedArrivalTime,
            deliveryPartnerStatus: order.deliveryPartnerStatus,
        });
    }

    if (req.broadcastOrderUpdate) {
        req.broadcastOrderUpdate(orderId, {
            action: 'navigation_started',
        });
    }

    res.json({
        success: true,
        message: 'Navigation started successfully',
        order
    });
});

// @desc    Confirm COD collection
// @route   POST /api/delivery-partners/confirm-cod/:orderId
// @access  Private/DeliveryPartner
const confirmCOD = asyncHandler(async (req, res) => {
    const { orderId } = req.params;

    const partnerProfile = await DeliveryPartner.findOne({ user: req.user._id });

    if (!partnerProfile) {
        res.status(404);
        throw new Error('Delivery partner profile not found');
    }

    const order = await Order.findById(orderId);

    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }

    // Verify assignment
    if (!order.deliveryPartner || order.deliveryPartner.toString() !== partnerProfile._id.toString()) {
        res.status(403);
        throw new Error('Access denied: This order is not assigned to you');
    }

    // Verify payment method is COD
    if (order.paymentMethod !== 'cod') {
        res.status(400);
        throw new Error('This order is not a COD order');
    }

    // Update COD collection
    order.codCollectedConfirmedAt = new Date();
    order.codCollected = true;

    await order.save();

    res.json({
        success: true,
        message: 'COD amount collection confirmed successfully',
        order
    });
});

// @desc    Upload delivery photo and complete delivery (Photo-based, NO OTP)
// @route   POST /api/delivery-partners/upload-delivery-photo/:orderId
// @access  Private/DeliveryPartner
const uploadDeliveryPhotoAndComplete = asyncHandler(async (req, res) => {
    const { orderId } = req.params;

    if (!req.file) {
        res.status(400);
        throw new Error('Delivery photo is required');
    }

    const partnerProfile = await DeliveryPartner.findOne({ user: req.user._id })
        .populate('user', 'name');

    if (!partnerProfile) {
        res.status(404);
        throw new Error('Delivery partner profile not found');
    }

    const order = await Order.findById(orderId);

    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }

    // Verify assignment
    if (!order.deliveryPartner || order.deliveryPartner.toString() !== partnerProfile._id.toString()) {
        res.status(403);
        throw new Error('Access denied: This order is not assigned to you');
    }

    // Verify order is not already delivered
    if (order.deliveryPartnerStatus === 'delivered') {
        res.status(400);
        throw new Error('Order is already marked as delivered');
    }

    // Upload photo to Cloudinary with overlays
    const photoResult = await uploadDeliveryPhoto(
        req.file.buffer,
        orderId,
        partnerProfile.user.name
    );

    // Update order - AUTO-STATUS TRANSITION to DELIVERED
    const previousStatus = order.deliveryPartnerStatus;
    order.deliveryPartnerStatus = 'delivered';
    order.orderStatus = 'delivered';
    order.isDelivered = true;
    order.deliveredAt = new Date();
    order.actualDeliveryDate = new Date();

    // Save photo proof details
    order.deliveryPhotoUrl = photoResult.url;
    order.deliveryPhotoTimestamp = new Date();
    order.deliveryPhotoOrderId = photoResult.orderId;
    order.deliveryPhotoCloudinaryId = photoResult.publicId;

    // Update delivery confirmation
    order.deliveryConfirmation = {
        otpVerified: false, // NO OTP USED
        verifiedAt: new Date(),
        verifiedBy: req.user._id,
        photoProofUrl: photoResult.url,
        notes: 'Delivery confirmed with photo proof (no OTP required)'
    };

    // Add to status history
    order.statusHistory.push({
        status: 'delivered',
        timestamp: new Date(),
        reason: 'Delivery confirmed with photo proof by delivery partner'
    });

    // Add to auto-status updates
    order.autoStatusUpdates.push({
        from: previousStatus,
        to: 'delivered',
        triggeredBy: 'photo_upload',
        timestamp: new Date(),
        reason: 'Delivery photo uploaded - auto-completed delivery'
    });

    await order.save();

    // Update delivery partner stats
    partnerProfile.totalDeliveries = (partnerProfile.totalDeliveries || 0) + 1;
    await partnerProfile.save();

    // Emit Socket.io event for real-time update across ALL dashboards
    if (req.broadcastDeliveryCompleted) {
        req.broadcastDeliveryCompleted(orderId, partnerProfile._id, {
            deliveryPhotoUrl: photoResult.url,
            deliveredAt: order.deliveredAt,
            orderStatus: order.orderStatus,
            deliveryPartnerStatus: order.deliveryPartnerStatus,
        });
    }

    if (req.broadcastOrderUpdate) {
        req.broadcastOrderUpdate(orderId, {
            action: 'delivery_completed',
            photoUrl: photoResult.url,
        });
    }

    res.json({
        success: true,
        message: 'Delivery completed successfully with photo proof',
        order,
        photoUrl: photoResult.url
    });
});

// @desc    Request replacement with photo proof
// @route   POST /api/delivery-partners/request-replacement/:orderId
// @access  Private/DeliveryPartner
const requestReplacement = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const { reason, description } = req.body;

    if (!req.file) {
        res.status(400);
        throw new Error('Photo proof is required for replacement request');
    }

    if (!reason) {
        res.status(400);
        throw new Error('Replacement reason is required');
    }

    const partnerProfile = await DeliveryPartner.findOne({ user: req.user._id });

    if (!partnerProfile) {
        res.status(404);
        throw new Error('Delivery partner profile not found');
    }

    const order = await Order.findById(orderId);

    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }

    // Verify assignment
    if (!order.deliveryPartner || order.deliveryPartner.toString() !== partnerProfile._id.toString()) {
        res.status(403);
        throw new Error('Access denied: This order is not assigned to you');
    }

    // Check if replacement already requested
    if (order.hasReplacementRequest) {
        res.status(400);
        throw new Error('Replacement request already exists for this order');
    }

    // Upload replacement photo to Cloudinary
    const photoResult = await uploadReplacementPhoto(
        req.file.buffer,
        orderId,
        reason
    );

    // Update order with replacement request
    order.hasReplacementRequest = true;
    order.replacementStatus = 'requested';
    order.replacementReason = reason;
    order.replacementDescription = description || '';
    order.replacementPhotoUrl = photoResult.url;
    order.replacementPhotoCloudinaryId = photoResult.publicId;
    order.replacementRequestedAt = new Date();
    order.replacementRequestedBy = req.user._id;

    await order.save();

    // Emit Socket.io event to notify seller/admin
    if (req.broadcastReplacementRequest) {
        req.broadcastReplacementRequest(orderId, {
            reason,
            description,
            photoUrl: photoResult.url,
            requestedAt: order.replacementRequestedAt,
            requestedBy: partnerProfile._id,
            deliveryPartnerName: partnerProfile.user?.name,
        });
    }

    res.json({
        success: true,
        message: 'Replacement request submitted successfully. Seller/Admin will review it.',
        order,
        photoUrl: photoResult.url
    });
});

module.exports = {
    getDashboard,
    getMyOrders,
    getOrderDetails,
    confirmPickup,
    startNavigation,
    confirmCOD,
    uploadDeliveryPhotoAndComplete,
    requestReplacement,
};
