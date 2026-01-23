const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { protect, role } = require('../middleware/auth');
const deliveryConfirmationService = require('../services/deliveryConfirmationService');
const { db } = require('../config/firebase');
const Order = require('../models/Order');

/**
 * @route   POST /api/delivery/confirm
 * @desc    Confirm delivery with photo proof (Zepto-style, no OTP)
 * @access  Private (Delivery Partner only)
 * 
 * FLOW:
 * 1. Delivery Partner: Reaches customer location
 * 2. Partner: Captures photo of delivered item (uploads to Firebase Storage)
 * 3. Frontend: Sends photoUrl and orderId to this endpoint
 * 4. Backend: Verifies partner identity, marks order delivered
 */
router.post('/confirm', protect, role('deliveryPartner'), asyncHandler(async (req, res) => {
    const { orderId, photoProofUrl, codAmount, location, notes } = req.body;

    // Validate required fields
    // NEW: photoProofUrl is now MANDATORY as it replaces OTP verification
    if (!orderId || !photoProofUrl) {
        res.status(400);
        throw new Error('Order ID and photo proof URL are required for confirmation');
    }

    // 1. Get order from MongoDB
    const order = await Order.findById(orderId)
        .populate('user', 'name phone email')
        .populate('deliveryPartner', 'name phone');

    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }

    // 2. Verify delivery partner is assigned to this order
    // Populate deliveryPartner to get the user field
    const partner = await require('../models/deliveryPartner').findById(order.deliveryPartner);

    if (!partner || partner.user.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('You are not authorized to confirm this delivery. Identity mismatch.');
    }

    // 3. Update order status in MongoDB
    order.orderStatus = 'delivered';
    order.deliveredAt = new Date();
    order.deliveryConfirmation = {
        otpVerified: false,  // Photo-based confirmation (no OTP)
        verifiedAt: new Date(),
        verifiedBy: req.user._id,
        photoProofUrl: photoProofUrl,
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

    // 4. Save delivery confirmation in Firestore
    const deliveryConfirmation = {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        deliveryPartnerId: req.user._id.toString(),
        deliveryPartnerName: req.user.name,
        customerId: order.user._id.toString(),
        customerName: order.user.name,
        customerPhone: order.user.phone,
        deliveredAt: new Date(),
        otpVerified: false,
        verifiedAt: new Date(),
        photoProofUrl: photoProofUrl,
        codAmount: codAmount || 0,
        codCollected: order.paymentMethod === 'cod',
        location: location || null,
        notes: notes || null,
        createdAt: new Date()
    };

    await db.collection('delivery_confirmations').add(deliveryConfirmation);

    // 5. Send notifications (Socket.IO)
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
        message: 'Delivery confirmed with photo proof',
        order: {
            id: order._id,
            orderNumber: order.orderNumber,
            status: order.orderStatus,
            deliveredAt: order.deliveredAt,
            photoProofUrl: photoProofUrl
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
router.get('/my-deliveries', protect, role('deliveryPartner'), asyncHandler(async (req, res) => {
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
