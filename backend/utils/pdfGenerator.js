const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const invoiceDir = path.join(__dirname, '../uploads/invoices');
if (!fs.existsSync(invoiceDir)) {
  fs.mkdirSync(invoiceDir, { recursive: true });
}

const decodeEntities = (text) => {
    if (!text) return '';
    return text.replace(/&#x([0-9A-Fa-f]+);/g, (match, hex) => String.fromCharCode(parseInt(hex, 16)))
               .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec));
};

/**
 * Generates an invoice PDF for an order and saves it to disk.
 * @param {Object} order - Populated order document
 * @returns {Promise<string>} - Resolves with the saved file path
 */
const generateInvoicePDF = (order) => {
  return new Promise((resolve, reject) => {
    try {
      const filePath = path.join(invoiceDir, `invoice_${order._id}.pdf`);

      const doc = new PDFDocument({
          margin: 50,
          info: {
              Title: `Invoice - ${order._id}`,
              Author: 'Rice Mill Platform',
              Subject: 'Order Invoice',
              Keywords: 'invoice, rice mill, order'
          }
      });

      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

      // Register Unicode-compatible fonts
      const regularFontPath = path.join(__dirname, '../assets/fonts/DejaVuSans.ttf');
      const boldFontPath = path.join(__dirname, '../assets/fonts/DejaVuSans-Bold.ttf');

      if (!fs.existsSync(regularFontPath) || !fs.existsSync(boldFontPath)) {
          console.warn('⚠️ Unicode fonts missing, falling back to standard fonts');
          doc.font('Helvetica');
      } else {
          doc.registerFont('DejaVuSans', regularFontPath);
          doc.registerFont('DejaVuSans-Bold', boldFontPath);
          doc.font('DejaVuSans');
      }

      // Header
      doc.font('DejaVuSans-Bold').fontSize(24).fillColor('#2e7d32').text('RICE MILL', { align: 'center' });
      doc.font('DejaVuSans').fontSize(10).fillColor('#666').text('E-Commerce Platform', { align: 'center' });
      doc.moveDown(2);

      // Invoice Title
      doc.font('DejaVuSans-Bold').fontSize(20).fillColor('#000').text('INVOICE', { align: 'center' });
      doc.moveDown();

      // Details
      const rupee = '\u20B9';
      doc.font('DejaVuSans').fontSize(10).fillColor('#000');
      doc.text(`Invoice Number: INV-${order._id.toString().slice(-8).toUpperCase()}`, 50, 150);
      doc.text(`Order ID: ${order._id}`, 50, 165);
      doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}`, 50, 180);
      doc.text(`Payment: ${order.paymentMethod?.toUpperCase() || 'COD'}`, 50, 195);

      // Bill To / Sold By
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

      if (order.orderItems && order.orderItems.length > 0) {
        order.orderItems.forEach(item => {
            const itemTotal = (item.price || 0) * (item.qty || 0);
            const pName = decodeEntities(item.product?.name || item.name || 'Product');

            doc.text(pName, 50, y, { width: 280 });
            doc.text((item.qty || 0).toString(), 350, y);
            doc.text(`${rupee} ${(item.price || 0).toFixed(2)}`, 420, y);
            doc.text(`${rupee} ${itemTotal.toFixed(2)}`, 500, y);

            y += Math.max(doc.heightOfString(pName, { width: 280 }) + 10, 25);
        });
      }

      // Totals
      y += 10;
      doc.moveTo(350, y).lineTo(550, y).stroke();
      y += 10;
      doc.font('DejaVuSans-Bold');
      doc.text('Final Amount:', 350, y);
      doc.text(`${rupee} ${(order.totalPrice || 0).toFixed(2)}`, 500, y);

      // Footer
      doc.font('DejaVuSans').fontSize(9).fillColor('#888');
      doc.text('Computer generated invoice. No signature required.', 50, 700, { align: 'center' });
      doc.text('Visit us at ricemill-platform.com', 50, 715, { align: 'center' });

      doc.end();

      writeStream.on('finish', () => {
        console.log(`[PDF] Successfully generated invoice at ${filePath}`);
        resolve(filePath);
      });

      writeStream.on('error', (err) => {
        console.error(`[PDF] Stream error:`, err);
        reject(err);
      });

    } catch (error) {
      console.error(`[PDF] Generation failed:`, error.message);
      reject(error);
    }
  });
};

module.exports = { generateInvoicePDF, invoiceDir };
