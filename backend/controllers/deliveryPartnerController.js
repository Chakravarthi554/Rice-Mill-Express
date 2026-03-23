const DeliveryPartner = require('../models/deliveryPartner.js');
const Order = require('../models/Order.js');
const asyncHandler = require('../middleware/asyncHandler.js');
const { uploadDeliveryPhoto, uploadReplacementPhoto } = require('../utils/cloudinaryService.js');
const SettlementService = require('../services/SettlementService');

// @desc    Get delivery partner dashboard stats
// @route   GET /api/delivery-partners/dashboard
// @access  Private/DeliveryPartner
const getDashboard = asyncHandler(async (req, res) => {
    // 1. Get ALL delivery partner profiles linked to this user (could be multiple sellers)
    const partnerProfiles = await DeliveryPartner.find({ user: req.user._id });
    const profileIds = partnerProfiles.map(p => p._id);

    if (profileIds.length === 0) {
        return res.json({
            success: true,
            stats: {
                todayOrders: 0,
                activeDeliveries: 0,
                totalDeliveries: 0,
                todayCompleted: 0,
                totalEarnings: 0,
                todayEarnings: 0,
                statusCounts: {},
                rating: 5,
                onTimeRate: 100
            }
        });
    }

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get today's assigned orders
    const todayOrders = await Order.countDocuments({
        deliveryPartner: { $in: profileIds },
        createdAt: { $gte: today, $lt: tomorrow }
    });

    // Get active deliveries (not delivered)
    const activeDeliveries = await Order.countDocuments({
        deliveryPartner: { $in: profileIds },
        deliveryPartnerStatus: { $in: ['assigned', 'picked_up', 'in_transit'] }
    });

    // Get status counts across all profiles
    const statusCounts = await Order.aggregate([
        {
            $match: {
                deliveryPartner: { $in: profileIds },
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

    // Get total deliveries completed across all profiles
    const totalDeliveries = partnerProfiles.reduce((sum, p) => sum + (p.totalDeliveries || 0), 0);

    // Get earnings (Total and Today) across all profiles
    const earnings = await Order.aggregate([
        {
            $match: {
                deliveryPartner: { $in: profileIds },
                isDelivered: true
            }
        },
        {
            $group: {
                _id: null,
                totalEarnings: { $sum: '$deliveryPartnerAmount' },
                todayEarnings: {
                    $sum: {
                        $cond: [
                            { $and: [{ $gte: ['$deliveredAt', today] }, { $lt: ['$deliveredAt', tomorrow] }] },
                            '$deliveryPartnerAmount',
                            0
                        ]
                    }
                }
            }
        }
    ]);

    const totalEarnings = earnings.length > 0 ? earnings[0].totalEarnings : 0;
    const todayEarnings = earnings.length > 0 ? earnings[0].todayEarnings : 0;

    // Get today's completed deliveries across all profiles
    const todayCompleted = await Order.countDocuments({
        deliveryPartner: { $in: profileIds },
        deliveryPartnerStatus: 'delivered',
        deliveredAt: { $gte: today, $lt: tomorrow }
    });

    res.json({
        success: true,
        stats: {
            todayOrders,
            activeDeliveries,
            totalDeliveries,
            todayCompleted,
            totalEarnings,
            todayEarnings,
            statusCounts: statusCounts.reduce((acc, item) => {
                acc[item._id] = item.count;
                return acc;
            }, {}),
            rating: partnerProfiles.length > 0 ? (partnerProfiles.reduce((sum, p) => sum + (p.rating || 5), 0) / partnerProfiles.length) : 5,
            onTimeRate: partnerProfiles.length > 0 ? (partnerProfiles.reduce((sum, p) => sum + (p.onTimeDeliveryRate || 100), 0) / partnerProfiles.length) : 100
        }
    });
});

// @desc    Get delivery partner's assigned orders (ONLY assigned to them)
// @route   GET /api/delivery-partners/my-orders
// @access  Private/DeliveryPartner
const getMyOrders = asyncHandler(async (req, res) => {
    const { status, limit = 50 } = req.query;

    const partnerProfiles = await DeliveryPartner.find({ user: req.user._id });
    const profileIds = partnerProfiles.map(p => p._id);

    if (profileIds.length === 0) {
        return res.json({ success: true, orders: [] });
    }

    // Build query - ALL orders assigned to any of this user's profiles
    const query = { deliveryPartner: { $in: profileIds } };

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

    const partnerProfiles = await DeliveryPartner.find({ user: req.user._id });
    const profileIds = partnerProfiles.map(p => p._id.toString());

    if (profileIds.length === 0) {
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

    // CRITICAL: Verify this order is assigned to any of this user's profiles
    if (!order.deliveryPartner || !profileIds.includes(order.deliveryPartner._id.toString())) {
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

    const partnerProfiles = await DeliveryPartner.find({ user: req.user._id }).populate('user', 'name');
    const profileIds = partnerProfiles.map(p => p._id.toString());

    if (profileIds.length === 0) {
        res.status(404);
        throw new Error('Delivery partner profile not found');
    }

    const order = await Order.findById(orderId);

    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }

    // Verify assignment against any of the user's profiles
    if (!order.deliveryPartner || !profileIds.includes(order.deliveryPartner.toString())) {
        res.status(403);
        throw new Error('Access denied: This order is not assigned to you');
    }

    const partnerProfile = partnerProfiles.find(p => p._id.toString() === order.deliveryPartner.toString());

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

    const partnerProfiles = await DeliveryPartner.find({ user: req.user._id });
    const profileIds = partnerProfiles.map(p => p._id.toString());

    if (profileIds.length === 0) {
        res.status(404);
        throw new Error('Delivery partner profile not found');
    }

    const order = await Order.findById(orderId);

    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }

    // Verify assignment against any profile
    if (!order.deliveryPartner || !profileIds.includes(order.deliveryPartner.toString())) {
        res.status(403);
        throw new Error('Access denied: This order is not assigned to you');
    }

    const partnerProfile = partnerProfiles.find(p => p._id.toString() === order.deliveryPartner.toString());

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

    const partnerProfiles = await DeliveryPartner.find({ user: req.user._id });
    const profileIds = partnerProfiles.map(p => p._id.toString());

    if (profileIds.length === 0) {
        res.status(404);
        throw new Error('Delivery partner profile not found');
    }

    const order = await Order.findById(orderId);

    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }

    // Verify assignment against any profile
    if (!order.deliveryPartner || !profileIds.includes(order.deliveryPartner.toString())) {
        res.status(403);
        throw new Error('Access denied: This order is not assigned to you');
    }

    const partnerProfile = partnerProfiles.find(p => p._id.toString() === order.deliveryPartner.toString());

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

    const partnerProfiles = await DeliveryPartner.find({ user: req.user._id })
        .populate('user', 'name');
    const profileIds = partnerProfiles.map(p => p._id.toString());

    if (profileIds.length === 0) {
        res.status(404);
        throw new Error('Delivery partner profile not found');
    }

    const order = await Order.findById(orderId);

    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }

    // Verify assignment against any profile
    if (!order.deliveryPartner || !profileIds.includes(order.deliveryPartner.toString())) {
        res.status(403);
        throw new Error('Access denied: This order is not assigned to you');
    }

    const partnerProfile = partnerProfiles.find(p => p._id.toString() === order.deliveryPartner.toString());

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

    // ✅ FIX: For COD orders, mark as paid on delivery and update Payment record
    if (order.paymentMethod === 'cod' && !order.isPaid) {
        order.isPaid = true;
        order.paidAt = new Date();
        order.paymentStatus = 'completed';
        order.codCollected = true;
        order.codCollectedAt = new Date();
        order.codAmount = order.totalPrice;
        await order.save();

        // Update the associated Payment record
        const Payment = require('../models/Payment');
        await Payment.findOneAndUpdate(
            { order: order._id },
            {
                status: 'completed',
                paidAt: new Date(),
                commissionAmount: order.commissionAmount || Math.round(order.totalPrice * (order.commissionRate || 0.15)),
                sellerPayoutAmount: order.sellerAmount || Math.round(order.totalPrice * 0.85),
            }
        );
    }

    // ✅ Automated Settlement Handling
    try {
        await SettlementService.processDeliverySettlement(order._id);
        console.log(`✅ Automated settlement processed for order ${order._id}`);
    } catch (settleErr) {
        console.error('⚠️ Failed to process automated settlement:', settleErr.message);
    }

    // ✅ Trigger referral rewards on first delivered+paid order
    try {
        const { processReferralRewards } = require('./rewardsController');
        if (typeof processReferralRewards === 'function') {
            await processReferralRewards(order.user, order._id);
        }
    } catch (refErr) {
        console.error('Referral reward processing error (non-fatal):', refErr.message);
    }

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

    const partnerProfiles = await DeliveryPartner.find({ user: req.user._id });
    const profileIds = partnerProfiles.map(p => p._id.toString());

    if (profileIds.length === 0) {
        res.status(404);
        throw new Error('Delivery partner profile not found');
    }

    const order = await Order.findById(orderId);

    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }

    // Verify assignment against any profile
    if (!order.deliveryPartner || !profileIds.includes(order.deliveryPartner.toString())) {
        res.status(403);
        throw new Error('Access denied: This order is not assigned to you');
    }

    const partnerProfile = partnerProfiles.find(p => p._id.toString() === order.deliveryPartner.toString());

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
