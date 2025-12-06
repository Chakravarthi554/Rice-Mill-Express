// src/pages/customer/OrderDetailPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getOrderDetails, cancelOrder } from '../../redux/actions/orderActions';
import {
  Button,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Chip,
  Divider,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Cancel,
  Chat as ChatIcon,
  Support as SupportIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import Message from '../../components/common/Message';
import ChatWindow from '../../components/common/ChatWindow';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/* -------------------------------------------------------------
   Tiny pure-JS QR generator (no external lib)
   ------------------------------------------------------------- */
const generateQR = (text) => {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, size, size);

  // Very small QR – just encode the order ID + total
  const data = `Order:${text}`;
  const cell = 4;
  const margin = cell * 3;
  const qrSize = size - margin * 2;
  const cells = Math.floor(qrSize / cell);

  // Simple hash → binary matrix
  let hash = 0;
  for (let i = 0; i < data.length; i++) hash = ((hash << 5) - hash + data.charCodeAt(i)) | 0;
  const matrix = Array.from({ length: cells }, () => Array(cells).fill(0));

  for (let y = 0; y < cells; y++) {
    for (let x = 0; x < cells; x++) {
      const v = (hash >>> (y * cells + x)) & 1;
      if (v) {
        ctx.fillStyle = '#000';
        ctx.fillRect(margin + x * cell, margin + y * cell, cell, cell);
      }
    }
  }
  return canvas.toDataURL('image/png');
};

/* -------------------------------------------------------------
   PDF generation (no external fonts, no extra deps)
   ------------------------------------------------------------- */
const OrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { order, loading, error } = useSelector(s => s.orderDetails || {});
  const { loading: cancelLoading, error: cancelError, success: cancelSuccess } = useSelector(s => s.orderCancel || {});

  const [chatSeller, setChatSeller] = useState(false);
  const [chatAdmin, setChatAdmin] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  /* ------------------------------------------------------------------ */
  useEffect(() => {
    if (id) dispatch(getOrderDetails(id));
    else navigate('/customer/dashboard?tab=1');
  }, [dispatch, id, navigate]);

  useEffect(() => {
    if (cancelSuccess) {
      dispatch(getOrderDetails(id));
      setCancelOpen(false);
    }
  }, [cancelSuccess, dispatch, id]);

  const handleCancel = async () => await dispatch(cancelOrder(id));
  const openCancel = () => setCancelOpen(true);
  const closeCancel = () => setCancelOpen(false);

  /* ------------------------------------------------------------------ */
  const generatePDF = useCallback(() => {
    if (!order) return;

    // ---- debounce (prevents socket hiccup) ----
    let running = false;
    if (running) return;
    running = true;
    setTimeout(() => (running = false), 800);

    const doc = new jsPDF();

    // ---- Use built-in Unicode font (supports ₹) ----
    doc.setFont('DejaVuSans', 'normal');   // jsPDF ships with it
    doc.setFontSize(18);
    doc.text(`Invoice #${(order._id || '').substring(18, 24).toUpperCase()}`, 14, 22);

    doc.setFontSize(11);
    doc.setTextColor(100);

    // ---- Customer info ----
    doc.text(`Customer: ${order.user?.name || 'N/A'}`, 14, 32);
    doc.text(`Email: ${order.user?.email || 'N/A'}`, 14, 38);
    doc.text(`Phone: ${order.shippingAddress?.phone || 'N/A'}`, 14, 44);
    doc.text(`Date: ${order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}`, 14, 50);

    // ---- Shipping address ----
    doc.text('Shipping Address:', 14, 60);
    const a = order.shippingAddress;
    if (a) {
      doc.text(`${a.street || ''}`, 14, 66);
      doc.text(`${a.city || ''}, ${a.state || ''} - ${a.pinCode || ''}`, 14, 72);
    }

    // ---- Table ----
    const cols = ['Product', 'Qty', 'Price', 'Total'];
    const rows = (order.orderItems || []).map(i => [
      i.name,
      String(i.qty),
      `₹${Number(i.price || 0).toFixed(2)}`,
      `₹${(Number(i.qty || 0) * Number(i.price || 0)).toFixed(2)}`
    ]);

    autoTable(doc, {
      head: [cols],
      body: rows,
      startY: 80,
      theme: 'grid',
      headStyles: { fillColor: [46, 125, 50] },
      styles: { font: 'DejaVuSans', fontSize: 10 }
    });

    const y = doc.lastAutoTable.finalY || 100;

    // ---- Summary ----
    doc.setFontSize(12);
    doc.text(`Items: ₹${Number(order.itemsPrice || 0).toFixed(2)}`, 145, y + 10, { align: 'right' });
    doc.text(`Tax: ₹${Number(order.taxPrice || 0).toFixed(2)}`, 145, y + 16, { align: 'right' });
    doc.text(`Shipping: ₹${Number(order.shippingPrice || 0).toFixed(2)}`, 145, y + 22, { align: 'right' });
    doc.setFontSize(14);
    doc.setFont('DejaVuSans', 'bold');
    doc.text(`Total: ₹${Number(order.totalPrice || 0).toFixed(2)}`, 145, y + 30, { align: 'right' });

    // ---- Payment info ----
    doc.setFont('DejaVuSans', 'normal');
    doc.setFontSize(10);
    doc.text(`Method: ${order.paymentMethod || 'N/A'}`, 14, y + 40);
    doc.text(`Status: ${order.isPaid ? `Paid ${order.paidAt ? new Date(order.paidAt).toLocaleDateString() : ''}` : 'Not Paid'}`, 14, y + 46);
    doc.text(`Order: ${order.orderStatus || 'N/A'}`, 14, y + 52);

    // ---- QR code (tiny SVG) ----
    try {
      const qr = generateQR(`${order._id}\n₹${Number(order.totalPrice || 0).toFixed(2)}`);
      doc.addImage(qr, 'PNG', 160, y + 40, 30, 30);
      doc.setFontSize(9);
      doc.text('Scan to view', 175, y + 75, { align: 'center' });
    } catch (e) { /* ignore */ }

    doc.save(`invoice_${(order._id || '').substring(18, 24).toUpperCase()}.pdf`);
  }, [order]);

  /* ------------------------------------------------------------------ */
  const steps = ['Order Placed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered'];
  const statusIdx = { pending: 0, processing: 1, shipped: 2, 'out for delivery': 3, delivered: 4, cancelled: -1 };
  const activeStep = statusIdx[(order?.orderStatus || '').toLowerCase()] ?? 0;

  const canCancel = () => ['pending', 'processing'].includes((order?.orderStatus || '').toLowerCase());
  const statusColor = s => {
    switch ((s || '').toLowerCase()) {
      case 'delivered': return 'success';
      case 'cancelled': return 'error';
      case 'shipped': return 'info';
      case 'out for delivery': return 'warning';
      default: return 'primary';
    }
  };

  /* ------------------------------------------------------------------ */
  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px"><CircularProgress /></Box>;
  if (error) return <Box p={3}><Message severity="error">{error}</Message><Button onClick={() => navigate('/customer/dashboard?tab=1')} sx={{ mt: 2 }}>Back</Button></Box>;
  if (!order) return <Box p={3}><Message severity="error">Order not found</Message><Button onClick={() => navigate('/customer/dashboard?tab=1')} sx={{ mt: 2 }}>Back</Button></Box>;

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>Order #{(order._id || '').substring(18, 24).toUpperCase()}</Typography>
          <Typography color="text.secondary">
            Placed on {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}
          </Typography>
        </Box>
        <Chip label={(order.orderStatus || '').toUpperCase()} color={statusColor(order.orderStatus)} size="large" />
      </Box>

      {/* Support */}
      <Card sx={{ mb: 3, bgcolor: 'primary.light', color: 'white' }}>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="h6" gutterBottom>Need Help?</Typography>
              <Typography variant="body2">Message seller or admin.</Typography>
            </Box>
            <Box display="flex" gap={2}>
              <Button variant="contained" sx={{ bgcolor: 'white', color: 'primary.main' }} onClick={() => setChatSeller(true)} disabled={!order.seller} startIcon={<ChatIcon />}>Seller</Button>
              <Button variant="outlined" sx={{ borderColor: 'white', color: 'white' }} onClick={() => setChatAdmin(true)} startIcon={<SupportIcon />}>Admin</Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Progress */}
        <Grid item xs={12}>
          <Card><CardContent>
            <Typography variant="h6" gutterBottom>Progress</Typography>
            <Stepper activeStep={activeStep} alternativeLabel sx={{ mt: 2 }}>
              {steps.map(l => <Step key={l}><StepLabel>{l}</StepLabel></Step>)}
            </Stepper>
          </CardContent></Card>
        </Grid>

        {/* Items */}
        <Grid item xs={12} md={8}>
          <Card><CardContent>
            <Typography variant="h6" gutterBottom>Items</Typography>
            <TableContainer><Table>
              <TableHead><TableRow>
                <TableCell>Product</TableCell>
                <TableCell align="right">Qty</TableCell>
                <TableCell align="right">Price</TableCell>
                <TableCell align="right">Total</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {(order.orderItems || []).map((it, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Typography variant="body1">{it.name}</Typography>
                      {it.brand && <Typography variant="body2" color="text.secondary">Brand: {it.brand}</Typography>}
                    </TableCell>
                    <TableCell align="right">{it.qty}</TableCell>
                    <TableCell align="right">₹{Number(it.price || 0).toFixed(2)}</TableCell>
                    <TableCell align="right">₹{(it.qty * it.price).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table></TableContainer>

            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Box display="flex" justifyContent="space-between" mb={1}><Typography>Items:</Typography><Typography>₹{Number(order.itemsPrice || 0).toFixed(2)}</Typography></Box>
              <Box display="flex" justifyContent="space-between" mb={1}><Typography>Shipping:</Typography><Typography>₹{Number(order.shippingPrice || 0).toFixed(2)}</Typography></Box>
              <Box display="flex" justifyContent="space-between" mb={1}><Typography>Tax:</Typography><Typography>₹{Number(order.taxPrice || 0).toFixed(2)}</Typography></Box>
              <Divider sx={{ my: 1 }} />
              <Box display="flex" justifyContent="space-between"><Typography variant="h6">Total:</Typography><Typography variant="h6">₹{Number(order.totalPrice || 0).toFixed(2)}</Typography></Box>
            </Box>
          </CardContent></Card>
        </Grid>

        {/* Actions */}
        <Grid item xs={12} md={4}>
          <Card><CardContent>
            <Typography variant="h6" gutterBottom>Actions</Typography>
            <Box display="flex" flexDirection="column" gap={2}>
              <Button variant="contained" startIcon={<DownloadIcon />} onClick={generatePDF} fullWidth>Download Invoice</Button>
              {canCancel() && (
                <Button variant="outlined" color="error" startIcon={<Cancel />} onClick={openCancel} fullWidth disabled={cancelLoading}>
                  {cancelLoading ? <CircularProgress size={24} /> : 'Cancel Order'}
                </Button>
              )}
              <Button variant="outlined" startIcon={<ChatIcon />} onClick={() => setChatSeller(true)} disabled={!order.seller} fullWidth>Message Seller</Button>
              <Button variant="outlined" startIcon={<SupportIcon />} onClick={() => setChatAdmin(true)} fullWidth>Message Admin</Button>
            </Box>

            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>Payment</Typography>
            <Typography variant="body2">Method: {order.paymentMethod || 'N/A'}</Typography>
            <Typography variant="body2">Status: {order.isPaid ? 'Paid' : 'Pending'}</Typography>
            {order.isPaid && order.paidAt && <Typography variant="body2">Paid on: {new Date(order.paidAt).toLocaleDateString()}</Typography>}

            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>Shipping</Typography>
            {order.shippingAddress ? (
              <Box>
                <Typography variant="body2">{order.shippingAddress.street}</Typography>
                <Typography variant="body2">{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pinCode}</Typography>
                {order.shippingAddress.phone && <Typography variant="body2">Phone: {order.shippingAddress.phone}</Typography>}
              </Box>
            ) : <Typography variant="body2">No address</Typography>}
          </CardContent></Card>
        </Grid>
      </Grid>

      {/* Cancel dialog */}
      <Dialog open={cancelOpen} onClose={closeCancel}>
        <DialogTitle>Cancel Order</DialogTitle>
        <DialogContent>
          <Typography>Are you sure? This cannot be undone.</Typography>
          {cancelError && <Alert severity="error" sx={{ mt: 2 }}>{cancelError}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeCancel}>Keep</Button>
          <Button onClick={handleCancel} color="error" variant="contained" disabled={cancelLoading}>
            {cancelLoading ? <CircularProgress size={24} /> : 'Cancel'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Chat windows */}
      {chatSeller && order.seller && (
        <ChatWindow receiverId={order.seller._id} receiverName={order.seller.name || 'Seller'} orderId={id} onClose={() => setChatSeller(false)} />
      )}
      {chatAdmin && (
        <ChatWindow receiverId={process.env.REACT_APP_ADMIN_USER_ID || 'admin'} receiverName="Admin" orderId={id} onClose={() => setChatAdmin(false)} />
      )}
    </Box>
  );
};

export default OrderDetailPage;