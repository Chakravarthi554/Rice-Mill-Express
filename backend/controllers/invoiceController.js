const PDFDocument = require('pdfkit');
const Order = require('../models/Order');
const asyncHandler = require('express-async-handler');
const path = require('path');

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

        // --- PDF GENERATION ---
        const doc = new PDFDocument({
            margin: 50,
            info: {
                Title: `Invoice - ${order._id}`,
                Author: 'Rice Mill Platform',
                Subject: 'Order Invoice',
                Keywords: 'invoice, rice mill, order'
            }
        });

        // Register Unicode-compatible fonts
        const fs = require('fs');
        const regularFontPath = path.join(__dirname, '../assets/fonts/DejaVuSans.ttf');
        const boldFontPath = path.join(__dirname, '../assets/fonts/DejaVuSans-Bold.ttf');

        if (!fs.existsSync(regularFontPath) || !fs.existsSync(boldFontPath)) {
            console.error('⚠️ Unicode fonts missing, falling back to standard fonts');
            doc.font('Helvetica');
        } else {
            doc.registerFont('DejaVuSans', regularFontPath);
            doc.registerFont('DejaVuSans-Bold', boldFontPath);
            doc.font('DejaVuSans');
        }

        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=invoice_${order._id}.pdf`);

        doc.pipe(res);

        // Header
        doc.font('DejaVuSans-Bold').fontSize(24).fillColor('#2e7d32').text('RICE MILL', { align: 'center' });
        doc.font('DejaVuSans').fontSize(10).fillColor('#666').text('E-Commerce Platform', { align: 'center' });
        doc.moveDown(2);

        // Invoice Title
        doc.font('DejaVuSans-Bold').fontSize(20).fillColor('#000').text('INVOICE', { align: 'center' });
        doc.moveDown();

        // Details
        const rupee = '\u20B9'; // Unicode for Rupee symbol
        doc.font('DejaVuSans').fontSize(10).fillColor('#000');
        doc.text(`Invoice Number: INV-${order._id.toString().slice(-8).toUpperCase()}`, 50, 150);
        doc.text(`Order ID: ${order._id}`, 50, 165);
        doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}`, 50, 180);
        doc.text(`Payment: ${order.paymentMethod?.toUpperCase() || 'COD'}`, 50, 195);

        // BillTo / SoldBy
        doc.font('DejaVuSans-Bold').fontSize(12).text('Bill To:', 50, 240);
        doc.font('DejaVuSans').fontSize(10);
        doc.text(decodeEntities(order.user?.name || 'Customer'), 50, 260);
        doc.text(order.user?.email || '', 50, 275);

        if (order.shippingAddress) {
            const addr = order.shippingAddress;
            doc.text(`${decodeEntities(addr.street)}, ${decodeEntities(addr.city)}`, 50, 290);
            doc.text(`${decodeEntities(addr.state)} - ${addr.pinCode}`, 50, 305);
        }

        if (order.seller) {
            doc.font('DejaVuSans-Bold').fontSize(12).text('Sold By:', 350, 240);
            doc.font('DejaVuSans').fontSize(10);
            const sName = decodeEntities(order.seller?.businessDetails?.businessName || order.seller?.name || 'Seller');
            doc.text(sName, 350, 260);
        }

        // Items Table
        doc.moveTo(50, 330).lineTo(550, 330).stroke();
        doc.font('DejaVuSans-Bold').fontSize(11).fillColor('#2e7d32');
        doc.text('Item Description', 50, 340);
        doc.text('Qty', 350, 340);
        doc.text('Rate', 420, 340);
        doc.text('Total', 500, 340);
        doc.moveTo(50, 355).lineTo(550, 355).stroke();

        let y = 370;
        doc.font('DejaVuSans').fontSize(10).fillColor('#000');

        order.orderItems.forEach(item => {
            const itemTotal = (item.price || 0) * (item.qty || 0);
            const pName = decodeEntities(item.product?.name || item.name || 'Product');

            doc.text(pName, 50, y, { width: 280 });
            doc.text((item.qty || 0).toString(), 350, y);
            doc.text(`${rupee} ${(item.price || 0).toFixed(2)}`, 420, y);
            doc.text(`${rupee} ${itemTotal.toFixed(2)}`, 500, y);

            y += Math.max(doc.heightOfString(pName, { width: 280 }) + 10, 25);
        });

        // Totals
        y += 10;
        doc.moveTo(350, y).lineTo(550, y).stroke();
        y += 10;
        doc.font('DejaVuSans-Bold');
        doc.text('Final Amount:', 350, y);
        doc.text(`${rupee} ${order.totalPrice.toFixed(2)}`, 500, y);

        // Footer
        doc.font('DejaVuSans').fontSize(9).fillColor('#888');
        doc.text('Computer generated invoice. No signature required.', 50, 700, { align: 'center' });
        doc.text('Visit us at ricemill-platform.com', 50, 715, { align: 'center' });

        doc.end();
        console.log('✅ Invoice generation complete');

    } catch (error) {
        console.error('❌ Invoice Error:', error);
        if (!res.headersSent) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
});
