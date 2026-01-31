const Replacement = require('../models/Replacement.js');
const Order = require('../models/Order.js');
const asyncHandler = require('../middleware/asyncHandler.js');

// @desc    Customer requests replacement for delivered order
// @route   POST /api/replacements/customer/:orderId
// @access  Private/Customer
const customerRequestReplacement = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const { reason, description } = req.body;

    // 1. Validate required fields
    if (!reason || !description) {
        res.status(400);
        throw new Error('Reason and description are required');
    }

    // 2. Fetch order
    const order = await Order.findById(orderId);

    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }

    // 3. Verify this is the customer's order
    if (order.user.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('You are not authorized to request replacement for this order');
    }

    // 4. Verify order is delivered
    if (order.orderStatus !== 'delivered') {
        res.status(400);
        throw new Error('Replacement can only be requested for delivered orders');
    }

    // 5. Check if replacement already requested
    const existingReplacement = await Replacement.findOne({
        order: orderId,
        status: { $in: ['pending', 'approved'] }
    });

    if (existingReplacement) {
        res.status(400);
        throw new Error('A replacement request already exists for this order');
    }

    // 6. Create replacement request (photo is optional for customers)
    const replacementData = {
        order: orderId,
        requestedBy: req.user._id,
        requesterRole: 'customer',
        reason,
        description,
        status: 'pending'
    };

    // Add photo if provided
    if (req.file) {
        replacementData.photoProof = `/uploads/${req.file.filename}`;
    }

    const replacement = await Replacement.create(replacementData);

    // 7. Update order
    order.hasReplacementRequest = true;
    order.replacementStatus = 'requested';
    await order.save();

    res.status(201).json({
        success: true,
        message: 'Replacement request submitted successfully',
        replacement
    });
});

// @desc    Get all replacement requests (Admin/Seller)
// @route   GET /api/replacements
// @access  Private/Admin/Seller
const getReplacements = asyncHandler(async (req, res) => {
    const { status } = req.query;

    // Build query based on user role
    let query = {};

    if (status) {
        query.status = status;
    }

    // If seller, only show replacements for their orders
    if (req.user.role === 'seller') {
        const sellerOrders = await Order.find({ seller: req.user._id }).select('_id');
        const orderIds = sellerOrders.map(order => order._id);
        query.order = { $in: orderIds };
    }

    const replacements = await Replacement.find(query)
        .populate({
            path: 'order',
            populate: [
                { path: 'user', select: 'name email phone' },
                { path: 'seller', select: 'name email phone businessDetails' },
                { path: 'deliveryPartner' }
            ]
        })
        .populate('requestedBy', 'name email phone role')
        .populate('reviewedBy', 'name email role')
        .populate('replacementDeliveryPartner')
        .sort('-createdAt');

    res.json({
        success: true,
        replacements
    });
});

// @desc    Get single replacement details
// @route   GET /api/replacements/:id
// @access  Private
const getReplacementById = asyncHandler(async (req, res) => {
    const replacement = await Replacement.findById(req.params.id)
        .populate({
            path: 'order',
            populate: [
                { path: 'user', select: 'name email phone' },
                { path: 'seller', select: 'name email phone businessDetails' },
                { path: 'deliveryPartner' }
            ]
        })
        .populate('requestedBy', 'name email phone role')
        .populate('reviewedBy', 'name email role')
        .populate('replacementDeliveryPartner');

    if (!replacement) {
        res.status(404);
        throw new Error('Replacement request not found');
    }

    // Authorization check
    const order = replacement.order;
    const isCustomer = req.user._id.toString() === order.user._id.toString();
    const isSeller = req.user._id.toString() === order.seller._id.toString();
    const isAdmin = req.user.role === 'admin';
    const isRequester = req.user._id.toString() === replacement.requestedBy._id.toString();

    if (!isCustomer && !isSeller && !isAdmin && !isRequester) {
        res.status(403);
        throw new Error('You are not authorized to view this replacement request');
    }

    res.json({
        success: true,
        replacement
    });
});

// @desc    Approve or reject replacement request (Admin/Seller)
// @route   PUT /api/replacements/:id/review
// @access  Private/Admin/Seller
const reviewReplacement = asyncHandler(async (req, res) => {
    const { status, reviewNotes } = req.body;

    // 1. Validate status
    if (!['approved', 'rejected'].includes(status)) {
        res.status(400);
        throw new Error('Status must be either approved or rejected');
    }

    // 2. Fetch replacement
    const replacement = await Replacement.findById(req.params.id).populate('order');

    if (!replacement) {
        res.status(404);
        throw new Error('Replacement request not found');
    }

    // 3. Verify replacement is pending
    if (replacement.status !== 'pending') {
        res.status(400);
        throw new Error(`Cannot review replacement with status: ${replacement.status}`);
    }

    // 4. Authorization check - only seller of the order or admin can review
    const order = replacement.order;
    const isSeller = req.user._id.toString() === order.seller.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isSeller && !isAdmin) {
        res.status(403);
        throw new Error('You are not authorized to review this replacement request');
    }

    // 5. Update replacement
    replacement.status = status;
    replacement.reviewedBy = req.user._id;
    replacement.reviewNotes = reviewNotes || '';
    replacement.reviewedAt = new Date();

    await replacement.save();

    // 6. Update order
    const orderDoc = await Order.findById(order._id);
    orderDoc.replacementStatus = status;
    await orderDoc.save();

    res.json({
        success: true,
        message: `Replacement request ${status} successfully`,
        replacement
    });
});

// @desc    Assign delivery partner for approved replacement
// @route   PUT /api/replacements/:id/assign-delivery
// @access  Private/Admin/Seller
const assignReplacementDelivery = asyncHandler(async (req, res) => {
    const { deliveryPartnerId } = req.body;

    // 1. Validate delivery partner ID
    if (!deliveryPartnerId) {
        res.status(400);
        throw new Error('Delivery partner ID is required');
    }

    // 2. Fetch replacement
    const replacement = await Replacement.findById(req.params.id).populate('order');

    if (!replacement) {
        res.status(404);
        throw new Error('Replacement request not found');
    }

    // 3. Verify replacement is approved
    if (replacement.status !== 'approved') {
        res.status(400);
        throw new Error('Can only assign delivery for approved replacements');
    }

    // 4. Authorization check
    const order = replacement.order;
    const isSeller = req.user._id.toString() === order.seller.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isSeller && !isAdmin) {
        res.status(403);
        throw new Error('You are not authorized to assign delivery for this replacement');
    }

    // 5. Verify delivery partner exists and is approved
    const DeliveryPartner = require('../models/deliveryPartner.js');
    const deliveryPartner = await DeliveryPartner.findById(deliveryPartnerId);

    if (!deliveryPartner) {
        res.status(404);
        throw new Error('Delivery partner not found');
    }

    if (deliveryPartner.kycStatus !== 'approved') {
        res.status(400);
        throw new Error('Delivery partner is not approved');
    }

    // 6. Update replacement
    replacement.replacementDeliveryPartner = deliveryPartnerId;
    replacement.replacementDeliveryStatus = 'assigned';
    await replacement.save();

    res.json({
        success: true,
        message: 'Delivery partner assigned successfully',
        replacement
    });
});

// @desc    Get customer's replacement requests
// @route   GET /api/replacements/my-requests
// @access  Private/Customer
const getMyReplacements = asyncHandler(async (req, res) => {
    const replacements = await Replacement.find({ requestedBy: req.user._id })
        .populate({
            path: 'order',
            populate: [
                { path: 'seller', select: 'name email phone businessDetails' },
                { path: 'deliveryPartner' }
            ]
        })
        .populate('reviewedBy', 'name email role')
        .populate('replacementDeliveryPartner')
        .sort('-createdAt');

    res.json({
        success: true,
        replacements
    });
});

module.exports = {
    customerRequestReplacement,
    getReplacements,
    getReplacementById,
    reviewReplacement,
    assignReplacementDelivery,
    getMyReplacements,
};
