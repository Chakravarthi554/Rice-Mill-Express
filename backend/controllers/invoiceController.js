const PDFDocument = require('pdfkit');
const Order = require('../models/Order');
const asyncHandler = require('express-async-handler');
const path = require('path');

// Helper to decode common HTML entities that might be in the DB
const decodeEntities = (text) => {
    if (!text) return '';
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
        '&#8212;': '--'
    };
    // First pass for common named entities
    let decoded = text.replace(/&[#a-zA-Z0-9]+;/g, (match) => entities[match] || match);
    // Second pass for generic character codes if any remain
    try {
        decoded = decoded.replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec));
    } catch (e) {
        console.warn('Failed to decode some character codes', e);
    }
    return decoded;
};

// @desc    Generate invoice PDF for an order
// @route   GET /api/orders/:orderId/invoice
// @access  Private (Customer who owns the order)
exports.generateInvoice = asyncHandler(async (req, res) => {
    try {
        console.log('Generating invoice for order:', req.params.id);

        const order = await Order.findById(req.params.id)
            .populate('user', 'name email phone')
            .populate('seller', 'name businessDetails.businessName')
            .populate('orderItems.product', 'name price images');

        if (!order) {
            res.status(404);
            throw new Error('Order not found');
        }

        // Verify user owns this order or is admin
        const orderUserId = order.user?._id ? order.user._id.toString() : order.user?.toString();
        const currentUserId = req.user?._id ? req.user._id.toString() : req.user?.toString();

        if (orderUserId !== currentUserId && req.user?.role !== 'admin' && req.user?.role !== 'super_admin') {
            res.status(403);
            throw new Error('Not authorized to access this invoice');
        }

        // Create PDF document
        const doc = new PDFDocument({ margin: 50 });

        // Register Unicode-compatible fonts
        const fs = require('fs');
        const regularFontPath = path.join(__dirname, '../assets/fonts/DejaVuSans.ttf');
        const boldFontPath = path.join(__dirname, '../assets/fonts/DejaVuSans-Bold.ttf');

        console.log('Checking font paths:', { regularFontPath, boldFontPath });
        if (!fs.existsSync(regularFontPath)) {
            console.error('Regular font not found at:', regularFontPath);
            throw new Error(`Regular font file missing: ${regularFontPath}`);
        }
        if (!fs.existsSync(boldFontPath)) {
            console.error('Bold font not found at:', boldFontPath);
            throw new Error(`Bold font file missing: ${boldFontPath}`);
        }

        try {
            doc.registerFont('DejaVuSans', regularFontPath);
            doc.registerFont('DejaVuSans-Bold', boldFontPath);
        } catch (fontErr) {
            console.error('Error registering fonts:', fontErr);
            throw fontErr;
        }

        // Default to Regular
        doc.font('DejaVuSans');

        // Set response headers for PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=invoice_${order._id}.pdf`);

        // Pipe PDF to response
        doc.pipe(res);

        // Header
        doc.font('DejaVuSans-Bold').fontSize(24).fillColor('#2e7d32').text('RICE MILL', { align: 'center' });
        doc.font('DejaVuSans').fontSize(10).fillColor('#666').text('E-Commerce Platform', { align: 'center' });
        doc.moveDown(2);

        // Invoice Title
        doc.font('DejaVuSans-Bold').fontSize(20).fillColor('#000').text('INVOICE', { align: 'center' });
        doc.moveDown();

        // Invoice Details
        doc.font('DejaVuSans').fontSize(10);
        doc.text(`Invoice Number: INV-${order._id.toString().slice(-8).toUpperCase()}`, 50, 150);
        doc.text(`Order ID: ${order._id}`, 50, 165);
        doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}`, 50, 180);
        doc.text(`Payment Method: ${order.paymentMethod || 'COD'}`, 50, 195);
        doc.text(`Order Status: ${order.orderStatus}`, 50, 210);

        // Customer Details
        doc.font('DejaVuSans-Bold').fontSize(12).text('Bill To:', 50, 240);
        doc.font('DejaVuSans').fontSize(10);
        doc.text(decodeEntities(order.user?.name || 'Customer'), 50, 260);
        doc.text(order.user?.email || '', 50, 275);
        doc.text(order.user?.phone || 'N/A', 50, 290);

        if (order.shippingAddress) {
            const street = decodeEntities(order.shippingAddress.street || '');
            const city = decodeEntities(order.shippingAddress.city || '');
            const state = decodeEntities(order.shippingAddress.state || '');
            doc.text(`${street}, ${city}`, 50, 305);
            doc.text(`${state} - ${order.shippingAddress.pinCode || ''}`, 50, 320);
        }

        // Seller Details
        if (order.seller) {
            doc.font('DejaVuSans-Bold').fontSize(12).text('Sold By:', 350, 240);
            doc.font('DejaVuSans').fontSize(10);
            const sellerName = decodeEntities(order.seller?.businessDetails?.businessName || order.seller?.name || 'Seller');
            doc.text(sellerName, 350, 260);
        }

        // Line separator
        doc.moveTo(50, 350).lineTo(550, 350).stroke();

        // Items Table Header
        doc.font('DejaVuSans-Bold').fontSize(12).fillColor('#2e7d32');
        doc.text('Item', 50, 370);
        doc.text('Qty', 350, 370);
        doc.text('Price', 420, 370);
        doc.text('Total', 490, 370);

        doc.moveTo(50, 385).lineTo(550, 385).stroke();

        // Items
        let yPosition = 400;
        doc.font('DejaVuSans').fontSize(10).fillColor('#000');

        if (order.orderItems && order.orderItems.length > 0) {
            order.orderItems.forEach((item) => {
                const itemTotal = (item.price || 0) * (item.qty || 0);
                const productName = decodeEntities(item.product?.name || item.name || 'Product');

                doc.text(productName, 50, yPosition, { width: 280 });
                doc.text((item.qty || 0).toString(), 350, yPosition);
                doc.text(`₹ ${(item.price || 0).toFixed(2)}`, 420, yPosition);
                doc.text(`₹ ${itemTotal.toFixed(2)}`, 490, yPosition);

                // Adjust yPosition based on text height if it wraps
                const textHeight = doc.heightOfString(productName, { width: 280 });
                yPosition += Math.max(textHeight + 10, 25);
            });
        }

        // Line separator before totals
        yPosition += 10;
        doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();
        yPosition += 20;

        // Totals
        doc.font('DejaVuSans');
        doc.text('Subtotal:', 380, yPosition);
        doc.text(`₹ ${(order.itemsPrice || order.totalPrice).toFixed(2)}`, 490, yPosition);
        yPosition += 20;

        if (order.taxPrice && order.taxPrice > 0) {
            doc.text('Tax:', 380, yPosition);
            doc.text(`₹ ${order.taxPrice.toFixed(2)}`, 490, yPosition);
            yPosition += 20;
        }

        if (order.shippingPrice && order.shippingPrice > 0) {
            doc.text('Shipping:', 380, yPosition);
            doc.text(`₹ ${order.shippingPrice.toFixed(2)}`, 490, yPosition);
            yPosition += 20;
        }

        // Grand Total
        yPosition += 5;
        doc.font('DejaVuSans-Bold').fontSize(14).fillColor('#2e7d32');
        doc.text('Total Amount:', 380, yPosition);
        doc.text(`₹ ${order.totalPrice.toFixed(2)}`, 490, yPosition);

        // Footer
        doc.font('DejaVuSans').fontSize(8).fillColor('#666');
        doc.text('Thank you for your business!', 50, 700, { align: 'center' });
        doc.text('For support, contact: support@ricemill.com', 50, 715, { align: 'center' });

        // Finalize PDF
        doc.end();

    } catch (error) {
        console.error('Invoice generation error:', error);
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to generate invoice'
            });
        }
    }
});
