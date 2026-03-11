// src/pages/customer/OrderDetailPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { getOrderDetails, cancelOrder, downloadInvoice } from '../../redux/actions/orderActions';
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
  LocalShipping, CheckCircle, Cancel, Inventory, Person, Map,
  Phone, LocationOn, Star, Download as DownloadIcon, Visibility
} from '@mui/icons-material';
import Message from '../../components/common/Message';
import OrderTimeline from '../../components/common/OrderTimeline';
import { OrderTrackingSocket } from '../../utils/socket';
import { useAuth } from '../../context/AuthContext';
import DeliveryTrackingMap from '../../components/common/DeliveryTrackingMap';

const OrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { order, loading, error } = useSelector(s => s.orderDetails || {});
  const { loading: cancelLoading, error: cancelError, success: cancelSuccess } = useSelector(s => s.orderCancel || {});

  const [cancelOpen, setCancelOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  /* ------------------------------------------------------------------ */
  useEffect(() => {
    const backPath = user?.role === 'seller' ? '/seller/dashboard?tab=1' : '/customer/dashboard?tab=1';
    if (id) dispatch(getOrderDetails(id));
    else navigate(backPath);
  }, [dispatch, id, navigate, user?.role]);

  useEffect(() => {
    if (cancelSuccess) {
      dispatch(getOrderDetails(id));
      setCancelOpen(false);
    }
  }, [cancelSuccess, dispatch, id]);

  // 🔥 Real-time Tracking
  useEffect(() => {
    let orderSocket = null;

    if (user?._id && id) {
      orderSocket = new OrderTrackingSocket(
        user._id,
        user.role,
        localStorage.getItem('token'),
        (data) => {
          if (data.type === 'ORDER_UPDATE' && data.data?.orderId === id) {
            dispatch(getOrderDetails(id));
          }
        }
      );
      orderSocket.joinOrderRoom(id);
    }

    return () => {
      if (orderSocket) orderSocket.cleanup();
    };
  }, [id, user?._id, user?.role, dispatch]);

  const handleCancel = async () => await dispatch(cancelOrder(id));
  const openCancel = () => setCancelOpen(true);
  const closeCancel = () => setCancelOpen(false);

  /* ------------------------------------------------------------------ */
  const handleDownload = async () => {
    setDownloading(true);
    const result = await dispatch(downloadInvoice(id));
    setDownloading(false);
    if (!result.success) {
      alert(result.error || 'Failed to download invoice');
    }
  };

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
  if (error) {
    const backPath = user?.role === 'seller' ? '/seller/dashboard?tab=1' : '/customer/dashboard?tab=1';
    return <Box p={3}><Message severity="error">{error}</Message><Button onClick={() => navigate(backPath)} sx={{ mt: 2 }}>Back</Button></Box>;
  }
  if (!order) {
    const backPath = user?.role === 'seller' ? '/seller/dashboard?tab=1' : '/customer/dashboard?tab=1';
    return <Box p={3}><Message severity="error">Order not found</Message><Button onClick={() => navigate(backPath)} sx={{ mt: 2 }}>Back</Button></Box>;
  }

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



      <Grid container spacing={3}>
        {/* Progress */}
        <Grid item xs={12} md={order?.orderStatus === 'shipped' || order?.orderStatus === 'out_for_delivery' ? 12 : 12}>
          <Card><CardContent>
            <Typography variant="h6" gutterBottom>{t('tracking')}</Typography>
            <OrderTimeline
              history={order.statusHistory || []}
              currentStatus={order.orderStatus}
            />
          </CardContent></Card>
        </Grid>

        {/* Live Map */}
        {(order?.orderStatus === 'shipped' || order?.orderStatus === 'out_for_delivery') && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Live Delivery Tracking</Typography>
                <DeliveryTrackingMap order={order} />
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Items */}
        <Grid item xs={12} md={8}>
          <Card><CardContent>
            <Typography variant="h6" gutterBottom>{t('orderItems')}</Typography>
            <TableContainer><Table>
              <TableHead><TableRow>
                <TableCell>Product</TableCell>
                <TableCell align="right">{t('quantity')}</TableCell>
                <TableCell align="right">{t('price')}</TableCell>
                <TableCell align="right">{t('total')}</TableCell>
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
              <Box display="flex" justifyContent="space-between" mb={1}><Typography>{t('orderItems')}:</Typography><Typography>₹{Number(order.itemsPrice || 0).toFixed(2)}</Typography></Box>
              <Box display="flex" justifyContent="space-between" mb={1}><Typography>{t('delivery')}:</Typography><Typography>₹{Number(order.shippingPrice || 0).toFixed(2)}</Typography></Box>
              <Box display="flex" justifyContent="space-between" mb={1}><Typography>{t('tax') || 'Tax'}:</Typography><Typography>₹{Number(order.taxPrice || 0).toFixed(2)}</Typography></Box>
              <Divider sx={{ my: 1 }} />
              <Box display="flex" justifyContent="space-between"><Typography variant="h6">{t('total')}:</Typography><Typography variant="h6">₹{Number(order.totalPrice || 0).toFixed(2)}</Typography></Box>
            </Box>
          </CardContent></Card>
        </Grid>

        {/* Actions */}
        <Grid item xs={12} md={4}>
          <Card><CardContent>
            <Typography variant="h6" gutterBottom>{t('actions')}</Typography>
            <Box display="flex" flexDirection="column" gap={2}>
              <Button
                variant="contained"
                startIcon={downloading ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
                onClick={handleDownload}
                fullWidth
                disabled={downloading}
              >
                {downloading ? 'Downloading...' : 'Download Invoice'}
              </Button>
              {canCancel() && (
                <Button variant="outlined" color="error" startIcon={<Cancel />} onClick={openCancel} fullWidth disabled={cancelLoading}>
                  {cancelLoading ? <CircularProgress size={24} /> : 'Cancel Order'}
                </Button>
              )}

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
          <Button onClick={closeCancel}>{t('cancel')}</Button>
          <Button onClick={handleCancel} color="error" variant="contained" disabled={cancelLoading}>
            {cancelLoading ? <CircularProgress size={24} /> : t('confirm')}
          </Button>
        </DialogActions>
      </Dialog>


    </Box>
  );
};

export default OrderDetailPage;