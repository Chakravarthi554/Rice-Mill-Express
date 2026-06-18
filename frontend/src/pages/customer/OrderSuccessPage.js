// [Phase 2 Premium Redesign — Order Success Page]
// Celebration screen with confetti animation and order summary.
import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Paper, Stack, Divider } from '@mui/material';
import { CheckCircle, Home, Visibility } from '@mui/icons-material';
import { motion } from 'framer-motion';

// UI Components
import StatusChip from '../../components/ui/StatusChip';

// Existing Components
import OrderTracker from '../../components/customer/OrderTracker';

// Theme
import { colors, radius, shadows, tints, typography } from '../../theme/designTokens';

const MotionBox = motion(Box);

// Confetti particle component
const Particle = ({ delay, x, color }) => (
  <MotionBox
    initial={{ y: -20, x: x, opacity: 1, scale: 1 }}
    animate={{ y: 400, opacity: 0, scale: 0.5, rotate: 360 }}
    transition={{ duration: 2.5, delay, ease: 'easeOut' }}
    sx={{
      position: 'absolute', top: 0,
      width: 10, height: 10, borderRadius: '2px',
      bgcolor: color, zIndex: 0,
    }}
  />
);

const CONFETTI_COLORS = [colors.primary.main, colors.accent.main, colors.info, colors.success, '#F97316', '#EC4899', '#8B5CF6'];

const OrderSuccessPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const order = location.state?.order;

  useEffect(() => {
    if (!order) {
      console.error('No order data found');
    }
  }, [order]);

  return (
    <Box sx={{ bgcolor: colors.surface.default, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 6, position: 'relative', overflow: 'hidden' }}>

      {/* Confetti */}
      <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: '100%', pointerEvents: 'none', overflow: 'hidden' }}>
        {[...Array(30)].map((_, i) => (
          <Particle
            key={i}
            delay={Math.random() * 1.5}
            x={`${Math.random() * 100}%`}
            color={CONFETTI_COLORS[i % CONFETTI_COLORS.length]}
          />
        ))}
      </Box>

      {/* Main Content */}
      <MotionBox
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        sx={{ maxWidth: 600, width: '100%', px: 3, position: 'relative', zIndex: 1 }}
      >
        <Paper sx={{
          p: { xs: 4, md: 6 }, borderRadius: `${radius.xl}px`,
          border: `1px solid ${colors.neutral[200]}`,
          boxShadow: shadows.lg, textAlign: 'center',
        }}>

          {/* Success Icon */}
          <MotionBox
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 12, delay: 0.3 }}
          >
            <Box sx={{
              width: 100, height: 100, borderRadius: '50%',
              bgcolor: tints.green, display: 'flex', alignItems: 'center', justifyContent: 'center',
              mx: 'auto', mb: 3, boxShadow: shadows.greenGlow,
            }}>
              <CheckCircle sx={{ fontSize: 56, color: colors.success }} />
            </Box>
          </MotionBox>

          <Typography sx={{ ...typography.scale.h1, color: colors.primary.dark, mb: 1 }}>
            Order Placed! 🎉
          </Typography>
          <Typography sx={{ color: colors.neutral[500], fontSize: '1.05rem', mb: 4, maxWidth: 400, mx: 'auto' }}>
            Your order has been placed successfully. You can track its status below.
          </Typography>

          {order && (
            <Box sx={{ textAlign: 'left', mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography sx={{ fontSize: '0.85rem', color: colors.neutral[500] }}>
                  Order #{(order._id || '').substring(18, 24).toUpperCase()}
                </Typography>
                <StatusChip status={order.orderStatus || 'Pending'} />
              </Box>

              <Divider sx={{ mb: 3 }} />

              <OrderTracker order={order} />

              {order.totalPrice && (
                <Box sx={{ mt: 3, p: 2, bgcolor: tints.green, borderRadius: `${radius.md}px`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography sx={{ fontWeight: 600 }}>Total Paid</Typography>
                  <Typography sx={{ fontWeight: 800, fontSize: '1.2rem', color: colors.primary.dark }}>
                    ₹{Number(order.totalPrice).toFixed(2)}
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {!order && (
            <Box sx={{ p: 3, bgcolor: tints.red, borderRadius: `${radius.md}px`, mb: 4 }}>
              <Typography sx={{ color: colors.error, fontWeight: 600 }}>
                No order data available. Please check your orders.
              </Typography>
            </Box>
          )}

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            <Button
              component={motion.button}
              whileTap={{ scale: 0.97 }}
              variant="contained"
              size="large"
              startIcon={<Home />}
              onClick={() => navigate('/customer/dashboard')}
              sx={{
                bgcolor: colors.primary.main, '&:hover': { bgcolor: colors.primary.dark },
                borderRadius: `${radius.md}px`, py: 1.5, px: 4, fontWeight: 700,
                boxShadow: shadows.greenGlow,
              }}
            >
              Back to Home
            </Button>
            {order && (
              <Button
                component={motion.button}
                whileTap={{ scale: 0.97 }}
                variant="outlined"
                size="large"
                startIcon={<Visibility />}
                onClick={() => navigate(`/orders/${order._id}`)}
                sx={{
                  borderColor: colors.primary.main, color: colors.primary.main,
                  '&:hover': { bgcolor: tints.green, borderColor: colors.primary.dark },
                  borderRadius: `${radius.md}px`, py: 1.5, px: 4, fontWeight: 700,
                }}
              >
                View Order Details
              </Button>
            )}
          </Stack>
        </Paper>
      </MotionBox>
    </Box>
  );
};

export default OrderSuccessPage;