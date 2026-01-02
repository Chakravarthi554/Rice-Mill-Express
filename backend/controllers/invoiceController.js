const PDFDocument = require('pdfkit');
const Order = require('../models/Order');
const asyncHandler = require('express-async-handler');

// @desc    Generate invoice PDF for an order
// @route   GET /api/orders/:orderId/invoice
// @access  Private (Customer who owns the order)
exports.generateInvoice = asyncHandler(async (req, res) => {
    try {
        console.log('Generating invoice for order:', req.params.id);
        console.log('User ID from token:', req.user._id);

        // CORRECTION: Route uses /:id, so we must use req.params.id
        const order = await Order.findById(req.params.id)
            .populate('user', 'name email phone')
            .populate('seller', 'name businessDetails.businessName')
            .populate('orderItems.product', 'name price images');

        if (!order) {
            console.log('Order not found in DB');
            res.status(404);
            throw new Error('Order not found');
        }

        console.log('Order found. Owner:', order.user._id);

        // Verify user owns this order or is admin
        if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            res.status(403);
            throw new Error('Not authorized to access this invoice');
        }

        // Create PDF document
        const doc = new PDFDocument({ margin: 50 });

        // Set response headers for PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=invoice_${order._id}.pdf`);

        // Pipe PDF to response
        doc.pipe(res);

        // Header
        doc.fontSize(24).fillColor('#2e7d32').text('RICE MILL', { align: 'center' });
        doc.fontSize(10).fillColor('#666').text('E-Commerce Platform', { align: 'center' });
        doc.moveDown(2);

        // Invoice Title
        doc.fontSize(20).fillColor('#000').text('INVOICE', { align: 'center' });
        doc.moveDown();

        // Invoice Details
        doc.fontSize(10);
        doc.text(`Invoice Number: INV-${order._id.toString().slice(-8).toUpperCase()}`, 50, 150);
        doc.text(`Order ID: ${order._id}`, 50, 165);
        doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}`, 50, 180);
        doc.text(`Payment Method: ${order.paymentMethod || 'COD'}`, 50, 195);
        doc.text(`Order Status: ${order.orderStatus}`, 50, 210);

        // Customer Details
        doc.fontSize(12).text('Bill To:', 50, 240);
        doc.fontSize(10);
        doc.text(order.user?.name || 'Customer', 50, 260);
        doc.text(order.user?.email || '', 50, 275);
        doc.text(order.user?.phone || 'N/A', 50, 290);

        if (order.shippingAddress) {
            doc.text(`${order.shippingAddress.street || ''}, ${order.shippingAddress.city || ''}`, 50, 305);
            doc.text(`${order.shippingAddress.state || ''} - ${order.shippingAddress.pinCode || ''}`, 50, 320);
        }

        // Seller Details (if available)
        if (order.seller) {
            doc.fontSize(12).text('Sold By:', 350, 240);
            doc.fontSize(10);
            const sellerName = order.seller.businessDetails?.businessName || order.seller.name || 'Seller';
            doc.text(sellerName, 350, 260);
        }

        // Line separator
        doc.moveTo(50, 350).lineTo(550, 350).stroke();

        // Items Table Header
        doc.fontSize(12).fillColor('#2e7d32');
        doc.text('Item', 50, 370);
        doc.text('Qty', 350, 370);
        doc.text('Price', 420, 370);
        doc.text('Total', 490, 370);

        doc.moveTo(50, 385).lineTo(550, 385).stroke();

        // Items
        let yPosition = 400;
        doc.fontSize(10).fillColor('#000');

        if (order.orderItems && order.orderItems.length > 0) {
            order.orderItems.forEach((item, index) => {
                const itemTotal = (item.price || 0) * (item.qty || 0);

                doc.text(item.product?.name || item.name || 'Product', 50, yPosition, { width: 280 });
                doc.text((item.qty || 0).toString(), 350, yPosition);
                doc.text(`Rs. ${(item.price || 0).toFixed(2)}`, 420, yPosition); // fallback symbol
                doc.text(`Rs. ${itemTotal.toFixed(2)}`, 490, yPosition);

                yPosition += 25;
            });
        }

        // Line separator before totals
        yPosition += 10;
        doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();
        yPosition += 20;

        // Totals
        doc.fontSize(10);
        doc.text('Subtotal:', 380, yPosition);
        doc.text(`Rs. ${(order.itemsPrice || order.totalPrice).toFixed(2)}`, 490, yPosition);
        yPosition += 20;

        if (order.taxPrice && order.taxPrice > 0) {
            doc.text('Tax:', 380, yPosition);
            doc.text(`Rs. ${order.taxPrice.toFixed(2)}`, 490, yPosition);
            yPosition += 20;
        }

        if (order.shippingPrice && order.shippingPrice > 0) {
            doc.text('Shipping:', 380, yPosition);
            doc.text(`Rs. ${order.shippingPrice.toFixed(2)}`, 490, yPosition);
            yPosition += 20;
        }

        // Grand Total
        yPosition += 5;
        doc.fontSize(14).fillColor('#2e7d32');
        doc.text('Total Amount:', 380, yPosition);
        doc.text(`Rs. ${order.totalPrice.toFixed(2)}`, 490, yPosition);

        // Footer
        doc.fontSize(8).fillColor('#666');
        doc.text('Thank you for your business!', 50, 700, { align: 'center' });
        doc.text('For support, contact: support@ricemill.com', 50, 715, { align: 'center' });

        // Finalize PDF
        doc.end();

    } catch (error) {
        console.error('Invoice generation error:', error);

        // If headers already sent, can't send JSON error
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to generate invoice'
            });
        }
    }
});
