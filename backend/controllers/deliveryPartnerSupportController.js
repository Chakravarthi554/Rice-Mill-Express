const DeliveryPartner = require('../models/deliveryPartner.js');
const Order = require('../models/Order.js');
const asyncHandler = require('../middleware/asyncHandler.js');

// @desc    Get delivery history (Last 7-30 days)
// @route   GET /api/delivery-partners/history
// @access  Private/DeliveryPartner
const getHistory = asyncHandler(async (req, res) => {
    const { days = 7, status } = req.query;

    const partnerProfiles = await DeliveryPartner.find({ user: req.user._id });
    const profileIds = partnerProfiles.map(p => p._id);

    if (profileIds.length === 0) {
        res.status(404);
        throw new Error('Delivery partner profile not found');
    }

    // Calculate date range
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days));

    // Build query
    const query = {
        deliveryPartner: { $in: profileIds },
        createdAt: { $gte: daysAgo }
    };

    if (status) {
        query.deliveryPartnerStatus = status;
    } else {
        // Default: show delivered orders
        query.deliveryPartnerStatus = 'delivered';
    }

    const orders = await Order.find(query)
        .populate('user', 'name phone')
        .populate('seller', 'name businessDetails')
        .select('_id orderStatus deliveryPartnerStatus totalPrice deliveredAt shippingAddress paymentMethod')
        .sort({ deliveredAt: -1 })
        .limit(100); // Performance limit

    res.json({
        success: true,
        orders,
        count: orders.length
    });
});

// @desc    Get delivery partner profile
// @route   GET /api/delivery-partners/profile
// @access  Private/DeliveryPartner
const getProfile = asyncHandler(async (req, res) => {
    const partnerProfile = await DeliveryPartner.findOne({ user: req.user._id })
        .populate('user', 'name email phone')
        .populate('seller', 'name phone businessDetails');

    if (!partnerProfile) {
        res.status(404);
        throw new Error('Delivery partner profile not found');
    }

    res.json({
        success: true,
        profile: partnerProfile
    });
});

// @desc    Update delivery partner profile
// @route   PUT /api/delivery-partners/profile
// @access  Private/DeliveryPartner
const updateProfile = asyncHandler(async (req, res) => {
    const { language, notificationsEnabled, darkMode, emergencyContacts } = req.body;

    const partnerProfile = await DeliveryPartner.findOne({ user: req.user._id });

    if (!partnerProfile) {
        res.status(404);
        throw new Error('Delivery partner profile not found');
    }

    // Update allowed fields only
    if (language) partnerProfile.language = language;
    if (typeof notificationsEnabled === 'boolean') partnerProfile.notificationsEnabled = notificationsEnabled;
    if (typeof darkMode === 'boolean') partnerProfile.darkMode = darkMode;
    if (emergencyContacts) partnerProfile.emergencyContacts = emergencyContacts;

    await partnerProfile.save();

    res.json({
        success: true,
        message: 'Profile updated successfully',
        profile: partnerProfile
    });
});

// @desc    Get logged-in devices
// @route   GET /api/delivery-partners/devices
// @access  Private/DeliveryPartner
const getDevices = asyncHandler(async (req, res) => {
    const partnerProfile = await DeliveryPartner.findOne({ user: req.user._id });

    if (!partnerProfile) {
        res.status(404);
        throw new Error('Delivery partner profile not found');
    }

    res.json({
        success: true,
        devices: partnerProfile.loggedInDevices || []
    });
});

// @desc    Logout from all devices
// @route   POST /api/delivery-partners/logout-all
// @access  Private/DeliveryPartner
const logoutAllDevices = asyncHandler(async (req, res) => {
    const partnerProfile = await DeliveryPartner.findOne({ user: req.user._id });

    if (!partnerProfile) {
        res.status(404);
        throw new Error('Delivery partner profile not found');
    }

    // Clear all devices
    partnerProfile.loggedInDevices = [];
    await partnerProfile.save();

    res.json({
        success: true,
        message: 'Logged out from all devices successfully'
    });
});

// @desc    Send emergency alert with location
// @route   POST /api/delivery-partners/emergency-alert
// @access  Private/DeliveryPartner
const sendEmergencyAlert = asyncHandler(async (req, res) => {
    const { latitude, longitude, orderId, message } = req.body;

    const partnerProfile = await DeliveryPartner.findOne({ user: req.user._id })
        .populate('user', 'name phone')
        .populate('seller', 'name phone');

    if (!partnerProfile) {
        res.status(404);
        throw new Error('Delivery partner profile not found');
    }

    // Create emergency alert
    const alert = {
        timestamp: new Date(),
        location: {
            latitude: latitude || 0,
            longitude: longitude || 0
        },
        orderId: orderId || null,
        resolved: false,
        notes: message || 'Emergency alert triggered by delivery partner'
    };

    partnerProfile.emergencyAlerts.push(alert);
    await partnerProfile.save();

    // Emit Socket.io event to alert seller and admin
    if (req.broadcastEmergencyAlert) {
        req.broadcastEmergencyAlert({
            deliveryPartnerId: partnerProfile._id,
            deliveryPartnerName: partnerProfile.user.name,
            deliveryPartnerPhone: partnerProfile.user.phone,
            sellerId: partnerProfile.seller?._id,
            location: alert.location,
            orderId: orderId,
            message: alert.notes
        });
    }

    // TODO: Send SMS/Push notification to seller and admin
    console.log('🚨 EMERGENCY ALERT:', {
        partner: partnerProfile.user.name,
        seller: partnerProfile.seller.name,
        location: alert.location,
        orderId
    });

    res.json({
        success: true,
        message: 'Emergency alert sent successfully. Seller and admin have been notified.',
        alert
    });
});

// @desc    Raise delivery issue
// @route   POST /api/delivery-partners/raise-issue/:orderId
// @access  Private/DeliveryPartner
const raiseIssue = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const { issueType, description } = req.body;

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

    // Add issue to order notes
    const issueNote = `[ISSUE - ${new Date().toLocaleString()}] ${issueType}: ${description}`;
    order.notes = order.notes ? `${order.notes}\n${issueNote}` : issueNote;
    await order.save();

    // Emit Socket.io event
    if (req.io) {
        req.io.emit('delivery:issue-raised', {
            orderId: order._id,
            issueType,
            description,
            raisedBy: partnerProfile.user.name,
            timestamp: new Date()
        });
    }

    res.json({
        success: true,
        message: 'Issue raised successfully. Seller has been notified.',
        order
    });
});

// @desc    Update last active timestamp (for auto-logout tracking)
// @route   POST /api/delivery-partners/update-activity
// @access  Private/DeliveryPartner
const updateActivity = asyncHandler(async (req, res) => {
    const partnerProfile = await DeliveryPartner.findOne({ user: req.user._id });

    if (!partnerProfile) {
        res.status(404);
        throw new Error('Delivery partner profile not found');
    }

    partnerProfile.lastActiveAt = new Date();
    await partnerProfile.save();

    res.json({
        success: true,
        lastActiveAt: partnerProfile.lastActiveAt
    });
});

// @desc    Register FCM token for push notifications
// @route   POST /api/delivery-partners/register-fcm
// @access  Private/DeliveryPartner
const registerFCMToken = asyncHandler(async (req, res) => {
    const { token, deviceId } = req.body;

    if (!token) {
        res.status(400);
        throw new Error('FCM token is required');
    }

    const partnerProfile = await DeliveryPartner.findOne({ user: req.user._id });

    if (!partnerProfile) {
        res.status(404);
        throw new Error('Delivery partner profile not found');
    }

    // Check if token already exists
    const existingToken = partnerProfile.fcmTokens.find(t => t.token === token);

    if (!existingToken) {
        partnerProfile.fcmTokens.push({
            token,
            deviceId: deviceId || 'unknown',
            addedAt: new Date()
        });
        await partnerProfile.save();
    }

    res.json({
        success: true,
        message: 'FCM token registered successfully'
    });
});

module.exports = {
    getHistory,
    getProfile,
    updateProfile,
    getDevices,
    logoutAllDevices,
    sendEmergencyAlert,
    raiseIssue,
    updateActivity,
    registerFCMToken,
};
