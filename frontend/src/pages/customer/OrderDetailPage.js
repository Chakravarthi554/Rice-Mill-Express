// [Phase 2 Premium Redesign — Order Detail Page]
// Premium order detail with StatusChip, modern cards, and design tokens.
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { getOrderDetails, cancelOrder, downloadInvoice } from '../../redux/actions/orderActions';
import {
  Button, Typography, Box, Grid, Divider, Alert, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, Stack, Paper
} from '@mui/material';
import {
  Cancel, Download as DownloadIcon, ArrowBack,
  LocalShipping, Payment as PaymentIcon, LocationOn, Phone
} from '@mui/icons-material';
import { motion } from 'framer-motion';

// UI Components
import StatusChip from '../../components/ui/StatusChip';

// Common Components
import Message from '../../components/common/Message';
import OrderTimeline from '../../components/common/OrderTimeline';
import { OrderTrackingSocket } from '../../utils/socket';
import { useAuth } from '../../context/AuthContext';
import DeliveryTrackingMap from '../../components/common/DeliveryTrackingMap';

// Theme
import { colors, radius, shadows, tints, spacing, typography } from '../../theme/designTokens';

const MotionBox = motion(Box);

const InfoRow = ({ label, value, color, bold }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75 }}>
    <Typography sx={{ color: colors.neutral[500], fontSize: '0.92rem' }}>{label}</Typography>
    <Typography sx={{ fontWeight: bold ? 700 : 600, color: color || colors.neutral[900], fontSize: '0.92rem' }}>{value}</Typography>
  </Box>
);

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

  const backPath = user?.role === 'seller' ? '/seller/dashboard?tab=1' : '/customer/dashboard?tab=1';

  useEffect(() => {
    if (id) dispatch(getOrderDetails(id));
    else navigate(backPath);
  }, [dispatch, id, navigate, backPath]);

  useEffect(() => {
    if (cancelSuccess) {
      dispatch(getOrderDetails(id));
      setCancelOpen(false);
    }
  }, [cancelSuccess, dispatch, id]);

  // Real-time Tracking
  useEffect(() => {
    let orderSocket = null;
    if (user?._id && id) {
      orderSocket = new OrderTrackingSocket(
        user._id, user.role, localStorage.getItem('token'),
        (data) => { if (data.type === 'ORDER_UPDATE' && data.data?.orderId === id) dispatch(getOrderDetails(id)); }
      );
      orderSocket.joinOrderRoom(id);
    }
    return () => { if (orderSocket) orderSocket.cleanup(); };
  }, [id, user?._id, user?.role, dispatch]);

  const handleCancel = async () => await dispatch(cancelOrder(id));
  const handleDownload = async () => {
    setDownloading(true);
    const result = await dispatch(downloadInvoice(id));
    setDownloading(false);
    if (!result.success) alert(result.error || 'Failed to download invoice');
  };

  const canCancel = () => ['pending', 'processing'].includes((order?.orderStatus || '').toLowerCase());

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <CircularProgress sx={{ color: colors.primary.main }} />
    </Box>
  );
  if (error) return (
    <Box sx={{ p: 4, maxWidth: 600, mx: 'auto', mt: 8 }}>
      <Message severity="error">{error}</Message>
      <Button onClick={() => navigate(backPath)} sx={{ mt: 2 }}>Back</Button>
    </Box>
  );
  if (!order) return (
    <Box sx={{ p: 4, maxWidth: 600, mx: 'auto', mt: 8 }}>
      <Message severity="error">Order not found</Message>
      <Button onClick={() => navigate(backPath)} sx={{ mt: 2 }}>Back</Button>
    </Box>
  );

  return (
    <Box sx={{ bgcolor: colors.surface.default, minHeight: '100vh', pb: 8 }}>
      <Box sx={{ bgcolor: colors.surface.paper, borderBottom: `1px solid ${colors.neutral[200]}`, py: 3, mb: 4 }}>
        <Box sx={{ maxWidth: 1200, mx: 'auto', px: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Button startIcon={<ArrowBack />} onClick={() => navigate(backPath)} sx={{ mb: 1, color: colors.neutral[500] }}>
              Back to Orders
            </Button>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography sx={{ ...typography.scale.h2 }}>
                Order #{(order._id || '').substring(18, 24).toUpperCase()}
              </Typography>
              <StatusChip status={order.orderStatus || 'Pending'} size="medium" />
            </Box>
            <Typography sx={{ color: colors.neutral[500], mt: 0.5, fontSize: '0.9rem' }}>
              Placed on {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A'}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1.5}>
            <Button
              variant="contained"
              startIcon={downloading ? <CircularProgress size={18} color="inherit" /> : <DownloadIcon />}
              onClick={handleDownload}
              disabled={downloading}
              sx={{ bgcolor: colors.primary.main, '&:hover': { bgcolor: colors.primary.dark }, borderRadius: `${radius.sm}px`, fontWeight: 700 }}
            >
              {downloading ? 'Downloading...' : 'Invoice'}
            </Button>
            {canCancel() && (
              <Button
                variant="outlined" color="error"
                startIcon={cancelLoading ? <CircularProgress size={18} /> : <Cancel />}
                onClick={() => setCancelOpen(true)}
                disabled={cancelLoading}
                sx={{ borderRadius: `${radius.sm}px`, fontWeight: 700 }}
              >
                Cancel Order
              </Button>
            )}
          </Stack>
        </Box>
      </Box>

      <Box sx={{ maxWidth: 1200, mx: 'auto', px: 3 }}>
        <Grid container spacing={4}>

          {/* ── Tracking ── */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3.5, borderRadius: `${radius.xl}px`, border: `1px solid ${colors.neutral[200]}`, boxShadow: shadows.xs }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <LocalShipping sx={{ color: colors.primary.main }} />
                <Typography sx={{ fontWeight: 700, fontSize: '1.1rem' }}>{t('tracking')}</Typography>
              </Box>
              <OrderTimeline history={order.statusHistory || []} currentStatus={order.orderStatus} />
            </Paper>
          </Grid>

          {/* ── Live Map ── */}
          {(order?.orderStatus === 'shipped' || order?.orderStatus === 'out_for_delivery') && (
            <Grid item xs={12}>
              <Paper sx={{ p: 3.5, borderRadius: `${radius.xl}px`, border: `1px solid ${colors.neutral[200]}`, boxShadow: shadows.xs }}>
                <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', mb: 2 }}>📍 Live Delivery Tracking</Typography>
                <DeliveryTrackingMap order={order} />
              </Paper>
            </Grid>
          )}

          {/* ── Order Items ── */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3.5, borderRadius: `${radius.xl}px`, border: `1px solid ${colors.neutral[200]}`, boxShadow: shadows.xs }}>
              <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', mb: 2.5 }}>{t('orderItems')}</Typography>

              <Stack spacing={2}>
                {(order.orderItems || []).map((it, i) => (
                  <MotionBox
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    sx={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      p: 2, bgcolor: colors.neutral[50], borderRadius: `${radius.md}px`,
                    }}
                  >
                    <Box>
                      <Typography sx={{ fontWeight: 600 }}>{it.name}</Typography>
                      {it.brand && <Typography sx={{ fontSize: '0.82rem', color: colors.neutral[500] }}>Brand: {it.brand}</Typography>}
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Typography sx={{ color: colors.neutral[500], fontSize: '0.88rem' }}>Qty: {it.qty}</Typography>
                      <Typography sx={{ color: colors.neutral[500], fontSize: '0.88rem' }}>₹{Number(it.price || 0).toFixed(2)}</Typography>
                      <Typography sx={{ fontWeight: 700, minWidth: 80, textAlign: 'right' }}>₹{(it.qty * it.price).toFixed(2)}</Typography>
                    </Box>
                  </MotionBox>
                ))}
              </Stack>

              {/* Price Summary */}
              <Box sx={{ mt: 3, p: 2.5, bgcolor: tints.green, borderRadius: `${radius.md}px` }}>
                <InfoRow label="Products Total" value={`₹${Number(order.productAmount || order.itemsPrice || 0).toFixed(2)}`} />
                <InfoRow label={t('delivery')} value={`₹${Number(order.deliveryFee || order.shippingPrice || 0).toFixed(2)}`} />
                {order.discountAmount > 0 && <InfoRow label="Discount" value={`-₹${Number(order.discountAmount).toFixed(2)}`} color={colors.error} />}
                {order.walletUsedAmount > 0 && <InfoRow label="Wallet Used" value={`-₹${Number(order.walletUsedAmount).toFixed(2)}`} color={colors.info} />}
                <Divider sx={{ my: 1.5 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography sx={{ fontWeight: 800, fontSize: '1.1rem' }}>Total Order Value</Typography>
                  <Typography sx={{ fontWeight: 800, fontSize: '1.2rem', color: colors.primary.dark }}>
                    ₹{Number(order.finalPaidAmount || order.totalPrice || 0).toFixed(2)}
                  </Typography>
                </Box>
                {order.paymentMethod === 'cod' && order.isAdvancePaid && (
                  <>
                    <Divider sx={{ my: 1.5 }} />
                    <InfoRow label="Advance Paid" value={`₹${Number(order.advanceAmountPaid || 0).toFixed(2)}`} />
                    <InfoRow label="Remaining (Pay at Delivery)" value={`₹${Number(order.remainingCodAmount || 0).toFixed(2)}`} color={colors.error} bold />
                  </>
                )}
              </Box>
            </Paper>
          </Grid>

          {/* ── Side Panel ── */}
          <Grid item xs={12} md={4}>
            <Stack spacing={3}>
              {/* Payment Info */}
              <Paper sx={{ p: 3, borderRadius: `${radius.xl}px`, border: `1px solid ${colors.neutral[200]}`, boxShadow: shadows.xs }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <PaymentIcon sx={{ color: colors.primary.main }} />
                  <Typography sx={{ fontWeight: 700 }}>Payment</Typography>
                </Box>
                <InfoRow label="Method" value={order.paymentMethod || 'N/A'} />
                <InfoRow label="Status" value={order.isPaid ? 'Paid ✅' : 'Pending ⏳'} color={order.isPaid ? colors.success : colors.accent.alt} />
                {order.isPaid && order.paidAt && <InfoRow label="Paid on" value={new Date(order.paidAt).toLocaleDateString()} />}
              </Paper>

              {/* Shipping */}
              <Paper sx={{ p: 3, borderRadius: `${radius.xl}px`, border: `1px solid ${colors.neutral[200]}`, boxShadow: shadows.xs }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <LocationOn sx={{ color: colors.primary.main }} />
                  <Typography sx={{ fontWeight: 700 }}>Shipping Address</Typography>
                </Box>
                {order.shippingAddress ? (
                  <Box>
                    <Typography sx={{ fontSize: '0.92rem', mb: 0.5 }}>{order.shippingAddress.street}</Typography>
                    <Typography sx={{ fontSize: '0.92rem', color: colors.neutral[500] }}>
                      {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pinCode}
                    </Typography>
                    {order.shippingAddress.phone && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1, color: colors.neutral[500] }}>
                        <Phone sx={{ fontSize: 16 }} />
                        <Typography sx={{ fontSize: '0.88rem' }}>{order.shippingAddress.phone}</Typography>
                      </Box>
                    )}
                  </Box>
                ) : (
                  <Typography sx={{ color: colors.neutral[500] }}>No address</Typography>
                )}
              </Paper>
            </Stack>
          </Grid>
        </Grid>
      </Box>

      {/* Cancel Dialog */}
      <Dialog open={cancelOpen} onClose={() => setCancelOpen(false)} PaperProps={{ sx: { borderRadius: `${radius.lg}px` } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Cancel Order</DialogTitle>
        <DialogContent>
          <Typography>Are you sure? This action cannot be undone.</Typography>
          {cancelError && <Alert severity="error" sx={{ mt: 2 }}>{cancelError}</Alert>}
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setCancelOpen(false)}>{t('cancel')}</Button>
          <Button onClick={handleCancel} color="error" variant="contained" disabled={cancelLoading}
            sx={{ borderRadius: `${radius.sm}px`, fontWeight: 700 }}>
            {cancelLoading ? <CircularProgress size={20} /> : t('confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OrderDetailPage;