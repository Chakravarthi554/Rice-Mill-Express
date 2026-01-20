const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { protect, role } = require('../middleware/auth');
const deliveryConfirmationService = require('../services/deliveryConfirmationService');
const { db } = require('../config/firebase');
const Order = require('../models/Order');

/**
 * @route   POST /api/delivery/confirm
 * @desc    Confirm delivery with Firebase-verified token
 * @access  Private (Delivery Partner only)
 * 
 * FLOW:
 * 1. Frontend: Firebase sends OTP to customer
 * 2. Customer: Tells OTP to delivery partner
 * 3. Partner: Enters OTP in app
 * 4. Firebase: Verifies OTP, returns ID token
 * 5. Frontend: Sends ID token to this endpoint
 * 6. Backend: Verifies token, marks order delivered
 */
router.post('/confirm', protect, role('delivery_partner'), asyncHandler(async (req, res) => {
    const { orderId, idToken, photoProofUrl, codAmount, location, notes } = req.body;

    // Validate required fields
    if (!orderId || !idToken) {
        res.status(400);
        throw new Error('Order ID and authentication token are required');
    }

    // 1. Verify the Firebase ID token (NOT OTP - Firebase already verified that!)
    const tokenVerification = await deliveryConfirmationService.verifyToken(idToken);

    if (!tokenVerification.verified) {
        res.status(401);
        throw new Error('Authentication verification failed');
    }

    // 2. Get order from MongoDB
    const order = await Order.findById(orderId)
        .populate('user', 'name phone email')
        .populate('deliveryPartner', 'name phone');

    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }

    // 3. Verify delivery partner is assigned to this order
    if (order.deliveryPartner._id.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('You are not assigned to this order');
    }

    // 4. Verify customer phone matches token phone
    const customerPhone = order.user.phone;
    if (tokenVerification.phoneNumber !== customerPhone) {
        res.status(400);
        throw new Error('Customer phone number does not match');
    }

    // 5. Update order status in MongoDB
    order.orderStatus = 'delivered';
    order.deliveredAt = new Date();
    order.deliveryConfirmation = {
        otpVerified: true,  // Firebase verified the OTP
        verifiedAt: new Date(),
        verifiedBy: req.user._id,
        photoProofUrl: photoProofUrl || null,
        location: location || null,
        notes: notes || null
    };

    // If COD, mark payment collected
    if (order.paymentMethod === 'cod' && codAmount) {
        order.paymentStatus = 'completed';
        order.codCollected = {
            amount: codAmount,
            collectedAt: new Date(),
            collectedBy: req.user._id
        };
    }

    await order.save();

    // 6. Save delivery confirmation in Firestore
    const deliveryConfirmation = {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        deliveryPartnerId: req.user._id.toString(),
        deliveryPartnerName: req.user.name,
        customerId: order.user._id.toString(),
        customerName: order.user.name,
        customerPhone: tokenVerification.phoneNumber,
        deliveredAt: new Date(),
        otpVerified: true,  // Firebase verified
        verifiedAt: new Date(),
        photoProofUrl: photoProofUrl || null,
        codAmount: codAmount || 0,
        codCollected: order.paymentMethod === 'cod',
        location: location || null,
        notes: notes || null,
        createdAt: new Date()
    };

    await db.collection('delivery_confirmations').add(deliveryConfirmation);

    // 7. Send notifications (Socket.IO)
    const io = req.app.get('io');
    if (io) {
        // Notify customer
        io.to(`user_${order.user._id}`).emit('order:delivered', {
            orderId: order._id,
            orderNumber: order.orderNumber,
            deliveredAt: order.deliveredAt
        });

        // Notify seller
        io.to(`user_${order.seller}`).emit('order:delivered', {
            orderId: order._id,
            orderNumber: order.orderNumber,
            codAmount: codAmount || 0,
            deliveredAt: order.deliveredAt
        });

        // Notify admin
        io.to('admin_room').emit('order:delivered', {
            orderId: order._id,
            orderNumber: order.orderNumber,
            deliveryPartner: req.user.name,
            deliveredAt: order.deliveredAt
        });
    }

    res.json({
        success: true,
        message: 'Delivery confirmed successfully',
        order: {
            id: order._id,
            orderNumber: order.orderNumber,
            status: order.orderStatus,
            deliveredAt: order.deliveredAt,
            otpVerified: true
        }
    });
}));

/**
 * @route   GET /api/delivery/confirmations/:orderId
 * @desc    Get delivery confirmation from Firestore
 * @access  Private
 */
router.get('/confirmations/:orderId', protect, asyncHandler(async (req, res) => {
    const { orderId } = req.params;

    const snapshot = await db.collection('delivery_confirmations')
        .where('orderId', '==', orderId)
        .limit(1)
        .get();

    if (snapshot.empty) {
        res.status(404);
        throw new Error('Delivery confirmation not found');
    }

    const confirmation = snapshot.docs[0].data();

    res.json({
        success: true,
        confirmation: {
            ...confirmation,
            id: snapshot.docs[0].id
        }
    });
}));

/**
 * @route   GET /api/delivery/my-deliveries
 * @desc    Get delivery partner's delivery history from Firestore
 * @access  Private (Delivery Partner only)
 */
router.get('/my-deliveries', protect, role('delivery_partner'), asyncHandler(async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const snapshot = await db.collection('delivery_confirmations')
        .where('deliveryPartnerId', '==', req.user._id.toString())
        .orderBy('deliveredAt', 'desc')
        .limit(parseInt(limit))
        .offset(skip)
        .get();

    const deliveries = [];
    snapshot.forEach(doc => {
        deliveries.push({
            id: doc.id,
            ...doc.data()
        });
    });

    res.json({
        success: true,
        deliveries,
        page: parseInt(page),
        limit: parseInt(limit),
        total: deliveries.length
    });
}));

module.exports = router;
