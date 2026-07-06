const { pdfQueue } = require('../jobs/queues');
const { generateInvoicePDF } = require('../utils/pdfGenerator');
const Order = require('../models/Order');
const asyncHandler = require('express-async-handler');
const path = require('path');
const fs = require('fs');

const isRedisDisabled = process.env.DISABLE_REDIS === 'true';


// Helper to decode common HTML entities and normalize UTF-8 strings
const decodeEntities = (text) => {
    if (!text) return '';
    let str = String(text);
    // Remove invisible control characters that can cause PDF rendering issues
    str = str.replace(/[\u200B-\u200D\uFEFF]/g, '');

    const entities = {
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&apos;': "'",
        '&nbsp;': ' ',
        '&#39;': "'",
        '&#x27;': "'",
        '&#x2F;': '/',
        '&#x60;': '`',
        '&#8217;': "'",
        '&#8220;': '"',
        '&#8221;': '"',
        '&#8211;': '-',
        '&#8212;': '--',
        '&trade;': '™',
        '&reg;': '®',
        '&copy;': '©',
        '&euro;': '€',
        '&#8377;': '₹'
    };

    let decoded = str.replace(/&[#a-zA-Z0-9]+;/g, (match) => entities[match] || match);
    decoded = decoded.replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec));
    decoded = decoded.replace(/&#x([a-fA-F0-9]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));

    try {
        decoded = decoded.normalize('NFC');
    } catch (e) {
        // Fallback
    }

    return decoded.trim();
};


// @desc    Generate invoice PDF for an order
// @route   GET /api/orders/:id/invoice
// @access  Private (Owner, Seller, or Admin)
exports.generateInvoice = asyncHandler(async (req, res) => {
    try {
        console.log('🔄 Generating invoice for order ID:', req.params.id);

        const order = await Order.findById(req.params.id)
            .populate('user', 'name email phone')
            .populate('seller', 'name businessDetails.businessName')
            .populate('orderItems.product', 'name price');

        if (!order) {
            res.status(404);
            throw new Error('Order not found');
        }

        // --- AUTHORIZATION CHECK ---
        const currentUserId = req.user?._id?.toString();
        const orderUserId = order.user?._id?.toString() || order.user?.toString();
        const sellerId = order.seller?._id?.toString() || order.seller?.toString();
        const userRole = req.user?.role;

        // Allow if user is: the customer, the seller, or an admin
        const isAuthorized = (
            currentUserId === orderUserId ||
            currentUserId === sellerId ||
            userRole === 'admin' ||
            userRole === 'super_admin'
        );

        if (!isAuthorized) {
            console.warn(`❌ Unauthorized invoice access attempt by user ${currentUserId}`);
            res.status(403);
            throw new Error('Not authorized to access this invoice');
        }

        // --- BACKGROUND PDF GENERATION ---
        if (isRedisDisabled) {
            // Redis unavailable — generate synchronously so it's ready immediately
            console.log(`[InvoiceController] Redis disabled — generating PDF synchronously for order ${order._id}`);
            await generateInvoicePDF(order);
            return res.status(200).json({
                success: true,
                status: 'completed',
                message: 'Invoice generated successfully'
            });
        }

        // Redis available — enqueue and return 202 Accepted
        console.log(`[InvoiceController] Enqueuing PDF generation job for order ${order._id}`);
        await pdfQueue.add({ order });
        res.status(202).json({ 
             success: true, 
             status: 'processing', 
             message: 'Invoice generation started' 
        });

    } catch (error) {
        console.error('❌ Invoice Error:', error);
        if (!res.headersSent) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
});


// @desc    Check status of invoice generation
// @route   GET /api/orders/:id/invoice/status
// @access  Private (Owner or Admin/Seller)
exports.checkInvoiceStatus = asyncHandler(async (req, res) => {
    const orderId = req.params.id;
    const currentUserId = req.user._id.toString();
    const currentUserRole = req.user.role;

    const order = await Order.findById(orderId);
    if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const isAuthorized = (
        currentUserRole === 'admin' ||
        order.user.toString() === currentUserId ||
        (order.seller && order.seller.toString() === currentUserId)
    );

    if (!isAuthorized) {
        return res.status(403).json({ success: false, message: 'Not authorized to access this invoice' });
    }

    const invoicePath = path.join(__dirname, '../uploads/invoices', `invoice_${orderId}.pdf`);

    if (fs.existsSync(invoicePath)) {
        return res.status(200).json({ success: true, status: 'completed' });
    } else {
        return res.status(200).json({ success: true, status: 'processing' });
    }
});

// @desc    Download generated invoice
// @route   GET /api/orders/:id/invoice/download
// @access  Private (Owner or Admin/Seller)
exports.downloadInvoiceFile = asyncHandler(async (req, res) => {
    const orderId = req.params.id;
    const currentUserId = req.user._id.toString();
    const currentUserRole = req.user.role;

    const order = await Order.findById(orderId);
    if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const isAuthorized = (
        currentUserRole === 'admin' ||
        order.user.toString() === currentUserId ||
        (order.seller && order.seller.toString() === currentUserId)
    );

    if (!isAuthorized) {
        return res.status(403).json({ success: false, message: 'Not authorized to access this invoice' });
    }

    const invoicePath = path.join(__dirname, '../uploads/invoices', `invoice_${orderId}.pdf`);

    if (!fs.existsSync(invoicePath)) {
        return res.status(404).json({ success: false, message: 'Invoice not found or still processing' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice_${order._id}.pdf`);
    
    const fileStream = fs.createReadStream(invoicePath);
    fileStream.pipe(res);
});
