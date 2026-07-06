// [Phase 2 Premium Redesign — Checkout Page]
// Premium multi-step checkout with design tokens and existing business logic preserved.
import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Container, Typography, Button, Grid, Paper, Box, Alert, IconButton,
  Divider, CircularProgress, Checkbox, FormControlLabel, Stack, Chip
} from '@mui/material';
import {
  Remove, Add, LocationOn, Payment, ShoppingBag,
  CheckCircleOutline, LockOutlined, LocalShipping
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

// Existing components
import AddressManager from '../../components/customer/AddressManager';
import PaymentMethodSelector from '../../components/common/PaymentMethodSelector';
import Loader from '../../components/common/Loader';
import { EmptyState } from '../../components/common/PageStates';

// Redux
import { createOrder } from '../../redux/actions/orderActions';
import { listMyCart, addToCart, clearCart } from '../../redux/actions/cartActions';
import { getRewards } from '../../redux/actions/rewardsActions';
import { createRazorpayOrder } from '../../redux/actions/paymentActions';
import { loadScript } from '../../utils/loadScript';
import { ORDER_CREATE_RESET } from '../../redux/constants/orderConstants';
import { RAZORPAY_ORDER_CREATE_RESET } from '../../redux/constants/paymentConstants';
import api from '../../utils/api';

// Theme
import { colors, spacing, radius, shadows, tints, typography } from '../../theme/designTokens';

const MotionBox = motion(Box);

const BACKEND_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5001').replace('/api', '');
const getImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return BACKEND_URL + url;
};

// ── Step Indicator ──
const StepIndicator = ({ steps, activeStep }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 5, gap: 0 }}>
    {steps.map((step, idx) => (
      <React.Fragment key={idx}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 80 }}>
          <Box sx={{
            width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            bgcolor: idx <= activeStep ? colors.primary.main : colors.neutral[200],
            color: idx <= activeStep ? '#fff' : colors.neutral[500],
            fontWeight: 700, fontSize: '1rem',
            boxShadow: idx <= activeStep ? shadows.greenGlow : 'none',
            transition: 'all 0.3s ease',
          }}>
            {idx < activeStep ? <CheckCircleOutline sx={{ fontSize: 22 }} /> : step.icon}
          </Box>
          <Typography sx={{
            mt: 1, fontSize: '0.75rem', fontWeight: idx === activeStep ? 700 : 500,
            color: idx <= activeStep ? colors.primary.main : colors.neutral[500],
          }}>
            {step.label}
          </Typography>
        </Box>
        {idx < steps.length - 1 && (
          <Box sx={{
            height: 2, flex: 1, mx: 1,
            bgcolor: idx < activeStep ? colors.primary.main : colors.neutral[200],
            transition: 'all 0.3s ease', borderRadius: 1, minWidth: 40,
          }} />
        )}
      </React.Fragment>
    ))}
  </Box>
);

const CHECKOUT_STEPS = [
  { label: 'Address', icon: <LocationOn sx={{ fontSize: 20 }} /> },
  { label: 'Payment', icon: <Payment sx={{ fontSize: 20 }} /> },
  { label: 'Review', icon: <ShoppingBag sx={{ fontSize: 20 }} /> },
];

const CheckoutPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const cart = useSelector(s => s.cart);
  const cartItems = cart?.cartItems || [];
  const userLogin = useSelector(s => s.userLogin);
  const { userInfo } = userLogin;
  const orderCreate = useSelector(s => s.orderCreate);
  const { loading: orderLoading, error: orderError, success: orderSuccess, order: createdOrder } = orderCreate;
  const razorpayOrderCreate = useSelector(s => s.razorpayOrderCreate);
  const { loading: rzpLoading, error: rzpError } = razorpayOrderCreate;

  const [selectedAddress, setSelectedAddress] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [rzpInitiating, setRzpInitiating] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [freeDelivery] = useState(false);
  const razorpayRef = useRef(null);

  // Determine active checkout step
  const activeStep = !selectedAddress ? 0 : paymentMethod ? 2 : 1;

  useEffect(() => {
    dispatch(listMyCart());
    dispatch(getRewards());
    dispatch({ type: ORDER_CREATE_RESET });
    dispatch({ type: RAZORPAY_ORDER_CREATE_RESET });
  }, [dispatch]);

  const rewardsState = useSelector(s => s.rewards);
  const { rewards } = rewardsState;
  const [useRewards, setUseRewards] = useState(false);

  useEffect(() => {
    if (cartItems.length > 0 && selectedItems.length === 0) {
      setSelectedItems(cartItems.map(item => item.product._id));
    }
  }, [cartItems]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (cartItems.length === 0) {
      dispatch(listMyCart());
    }
  }, [cartItems, dispatch]);

  useEffect(() => {
    const handleOrderSuccess = async () => {
      if (orderSuccess && createdOrder) {
        const orderToShow = Array.isArray(createdOrder.orders) ? createdOrder.orders[0] : createdOrder;
        await dispatch(clearCart());
        navigate('/orders/success', { state: { order: orderToShow } });
        dispatch({ type: ORDER_CREATE_RESET });
      }
    };
    handleOrderSuccess();
  }, [orderSuccess, createdOrder, navigate, dispatch]);

  // Total calculation - selected items only
  const totalAmount = cartItems
    .filter(i => selectedItems.includes(i.product?._id))
    .reduce((sum, i) => {
      const price = (i.product?.offerPrice > 0 && i.product?.offerPrice < i.product?.price)
        ? i.product.offerPrice : (i.product?.price ?? 0);
      const qty = i.quantity ?? 1;
      return sum + price * qty;
    }, 0);

  useEffect(() => {
    const fetchDeliveryCharge = async () => {
      if (!selectedAddress) { setDeliveryCharge(0); return; }
      try {
        const { data } = await api.post('/api/v1/orders/delivery-fee-preview', {
          shippingAddressId: selectedAddress._id, orderTotal: totalAmount
        });
        setDeliveryCharge(data.deliveryFee || 0);
      } catch (err) {
        setDeliveryCharge(totalAmount > 500 ? 0 : 50);
      }
    };
    fetchDeliveryCharge();
  }, [totalAmount, selectedAddress, selectedItems, cartItems]);

  let discount = 0;
  if (useRewards && rewards?.points) {
    discount = Math.min(rewards.points, totalAmount);
  }
  const finalTotal = totalAmount + deliveryCharge - discount;
  const isMinOrderMet = finalTotal >= 1500;

  const handleQtyChange = async (idx, delta) => {
    const item = cartItems[idx];
    const newQty = Math.max(1, (item.quantity ?? 1) + delta);
    await dispatch(addToCart(item.product._id, newQty));
    dispatch(listMyCart());
  };

  const handlePaymentChange = (method) => {
    setPaymentMethod(method);
    dispatch({ type: RAZORPAY_ORDER_CREATE_RESET });
  };

  const handleItemToggle = (productId) => {
    setSelectedItems(prev =>
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  };

  const placeCODOrder = async () => {
    const selectedCartItems = cartItems.filter(i => selectedItems.includes(i.product._id));
    await dispatch(createOrder({
      orderItems: selectedCartItems.map(i => ({ product: i.product._id, qty: i.quantity })),
      shippingAddressId: selectedAddress._id, paymentMethod: 'cod', useRewards
    }));
  };

  const initiateRazorpay = async () => {
    try {
      setRzpInitiating(true);
      if (!window.Razorpay) {
        await loadScript('https://checkout.razorpay.com/v1/checkout.js');
      }
      const rzpOrder = await dispatch(createRazorpayOrder({
        amount: Math.round(finalTotal * 100), currency: 'INR',
        receipt: `rcpt_${userInfo._id}_${Date.now()}`.slice(0, 40)
      }));
      if (!rzpOrder?.id) throw new Error('Failed to create Razorpay order');
      const options = {
        key: rzpOrder.key || process.env.REACT_APP_RAZORPAY_KEY_ID,
        amount: rzpOrder.amount, currency: rzpOrder.currency,
        name: 'RiceMill Express', description: 'Order Payment', order_id: rzpOrder.id,
        handler: async (response) => {
          const selectedCartItems = cartItems.filter(i => selectedItems.includes(i.product._id));
          await dispatch(createOrder({
            orderItems: selectedCartItems.map(i => ({ product: i.product._id, qty: i.quantity })),
            shippingAddressId: selectedAddress._id, paymentMethod: 'razorpay', useRewards,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpayOrderId: response.razorpay_order_id,
            razorpaySignature: response.razorpay_signature,
          }));
        },
        prefill: { name: userInfo.name, email: userInfo.email, contact: userInfo.phone },
        theme: { color: colors.primary.main }
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
      rzp.on('payment.failed', () => { alert('Payment failed. Try again.'); setRzpInitiating(false); });
      razorpayRef.current = rzp;
    } catch (error) {
      console.error(error);
      alert('Payment initialization failed. Please try again.');
      setRzpInitiating(false);
    }
  };

  const initiateRazorpayForAdvance = async (advanceAmount) => {
    try {
      setRzpInitiating(true);
      if (!window.Razorpay) {
        await loadScript('https://checkout.razorpay.com/v1/checkout.js');
      }
      const rzpOrder = await dispatch(createRazorpayOrder({
        amount: Math.round(advanceAmount * 100), currency: 'INR',
        receipt: `adv_${userInfo._id}_${Date.now()}`.slice(0, 40)
      }));
      if (!rzpOrder?.id) throw new Error('Failed to create Razorpay advance order');
      const options = {
        key: rzpOrder.key || process.env.REACT_APP_RAZORPAY_KEY_ID,
        amount: rzpOrder.amount, currency: rzpOrder.currency,
        name: 'RiceMill Express', description: 'COD Advance Payment (20%)', order_id: rzpOrder.id,
        handler: async (response) => {
          const selectedCartItems = cartItems.filter(i => selectedItems.includes(i.product._id));
          await dispatch(createOrder({
            orderItems: selectedCartItems.map(i => ({ product: i.product._id, qty: i.quantity })),
            shippingAddressId: selectedAddress._id, paymentMethod: 'cod', useRewards,
            isAdvancePaid: true, advanceAmountPaid: advanceAmount,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpayOrderId: response.razorpay_order_id,
            razorpaySignature: response.razorpay_signature,
          }));
        },
        prefill: { name: userInfo.name, email: userInfo.email, contact: userInfo.phone },
        theme: { color: colors.primary.main }
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
      rzp.on('payment.failed', () => { alert('Advance Payment failed. Try again.'); setRzpInitiating(false); });
      razorpayRef.current = rzp;
    } catch (error) {
      console.error(error);
      alert('Advance Payment initialization failed. Please try again.');
      setRzpInitiating(false);
    }
  };

  const placeOrderHandler = async () => {
    try {
      if (!selectedAddress) return alert('Select a delivery address');
      if (selectedItems.length === 0) return alert('Please select at least one item to order');
      if (paymentMethod === 'cod' && !isMinOrderMet) return alert('Minimum ₹1500 for COD');
      if (paymentMethod === 'cod') { await placeCODOrder(); }
      else { await initiateRazorpay(); }
    } catch (error) {
      console.error('Order placement failed:', error);
      alert('Order placement failed. Please try again.');
    }
  };

  useEffect(() => {
    if (paymentMethod === 'razorpay' && !window.Razorpay) {
      loadScript('https://checkout.razorpay.com/v1/checkout.js');
    }
    return () => { if (razorpayRef.current?.close) razorpayRef.current.close(); };
  }, [paymentMethod, finalTotal]);

  const isLoading = orderLoading || rzpLoading || rzpInitiating;

  return (
    <Box sx={{ bgcolor: colors.surface.default, minHeight: '100vh', pb: 8 }}>
      <Container maxWidth={false} sx={{ pt: 4, px: { xs: 2, md: 6 } }}>

        {/* ── Title ── */}
        <Typography sx={{ ...typography.scale.h1, color: colors.primary.dark, mb: 2 }}>
          {t('checkout')}
        </Typography>

        {/* ── Step Indicator ── */}
        <StepIndicator steps={CHECKOUT_STEPS} activeStep={activeStep} />

        {isLoading && <Loader />}
        {orderError && <Alert severity="error" sx={{ mb: 2, borderRadius: `${radius.sm}px` }}>{orderError}</Alert>}
        {rzpError && <Alert severity="error" sx={{ mb: 2, borderRadius: `${radius.sm}px` }}>{rzpError}</Alert>}

        {cartItems.length === 0 ? (
          <EmptyState
            title="Your cart is empty"
            description="Add products to continue checkout."
            actionLabel="Go to Cart"
            onAction={() => navigate('/cart')}
          />
        ) : (
          <Grid container spacing={4}>
            {/* ── Left Column ── */}
            <Grid item xs={12} md={8}>
              {/* Address */}
              <Paper sx={{ 
                p: 2.5, mb: 2.5, borderRadius: 4, 
                border: 'none', 
                boxShadow: '0 10px 30px -10px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.05)',
                background: 'linear-gradient(to bottom, #ffffff, #fdfdfd)' 
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <LocationOn sx={{ color: '#16A34A', fontSize: 20 }} />
                  </Box>
                  <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: '#1F2937' }}>{t('addresses')}</Typography>
                </Box>
                <AddressManager onSelectAddress={setSelectedAddress} />
                {!selectedAddress && (
                  <Alert severity="info" sx={{ mt: 2, borderRadius: `${radius.sm}px` }}>
                    Please select a delivery address to continue
                  </Alert>
                )}
              </Paper>

              {/* Payment */}
              <Paper sx={{ 
                p: 2.5, mb: 2.5, borderRadius: 4, 
                border: 'none', 
                boxShadow: '0 10px 30px -10px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.05)',
                background: 'linear-gradient(to bottom, #ffffff, #fdfdfd)' 
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Payment sx={{ color: '#4F46E5', fontSize: 20 }} />
                  </Box>
                  <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: '#1F2937' }}>Payment Method</Typography>
                </Box>
                <PaymentMethodSelector value={paymentMethod} onChange={handlePaymentChange} />
                {paymentMethod === 'cod' && !isMinOrderMet && (
                  <Alert severity="warning" sx={{ mt: 2, borderRadius: `${radius.sm}px` }}>
                    Minimum ₹1500 required for COD. Current: ₹{totalAmount.toFixed(2)}
                  </Alert>
                )}
              </Paper>
            </Grid>

            {/* ── Right Column (Order Summary) ── */}
            <Grid item xs={12} md={4}>
              <Paper sx={{
                p: 2.5, borderRadius: 4, position: 'sticky', top: 20,
                border: 'none',
                boxShadow: '0 20px 40px -15px rgba(0,0,0,0.15), 0 0 10px rgba(0,0,0,0.02)',
                background: 'linear-gradient(to bottom, #ffffff, #fcfcfc)'
              }}>
                <Typography sx={{ fontWeight: 800, fontSize: '1.15rem', mb: 2, color: '#1F2937' }}>
                  {t('orderSummary') || 'Order Summary'}
                </Typography>

                {/* Items */}
                <Stack spacing={2} sx={{ maxHeight: 300, overflowY: 'auto', pr: 0.5 }}>
                  {cartItems.map((item, idx) => {
                    const itemPrice = (item.product.offerPrice > 0 && item.product.offerPrice < item.product.price)
                      ? item.product.offerPrice : item.product.price;
                    return (
                      <Box key={item.product._id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Checkbox
                          checked={selectedItems.includes(item.product._id)}
                          onChange={() => handleItemToggle(item.product._id)}
                          sx={{ '&.Mui-checked': { color: colors.primary.main } }}
                          size="small"
                        />
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography sx={{ fontSize: '0.88rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.product.name}
                          </Typography>
                          <Typography sx={{ fontSize: '0.78rem', color: colors.neutral[500] }}>
                            ₹{itemPrice} × {item.quantity}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <IconButton size="small" onClick={() => handleQtyChange(idx, -1)} disabled={item.quantity <= 1}><Remove sx={{ fontSize: 16 }} /></IconButton>
                          <Typography sx={{ minWidth: 24, textAlign: 'center', fontWeight: 700, fontSize: '0.88rem' }}>{item.quantity}</Typography>
                          <IconButton size="small" onClick={() => handleQtyChange(idx, 1)}><Add sx={{ fontSize: 16 }} /></IconButton>
                        </Box>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.92rem', minWidth: 60, textAlign: 'right' }}>
                          ₹{(itemPrice * item.quantity).toFixed(0)}
                        </Typography>
                      </Box>
                    );
                  })}
                </Stack>

                <Divider sx={{ my: 2.5 }} />

                {/* Price Breakdown */}
                <Stack spacing={1.5}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ color: colors.neutral[500] }}>{t('subtotal')}:</Typography>
                    <Typography sx={{ fontWeight: 600 }}>₹{totalAmount.toFixed(2)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ color: colors.neutral[500] }}>{t('delivery')}:</Typography>
                    {freeDelivery ? (
                      <Typography sx={{ color: colors.success, fontWeight: 700 }}>FREE</Typography>
                    ) : (
                      <Typography sx={{ fontWeight: 600 }}>₹{deliveryCharge.toFixed(2)}</Typography>
                    )}
                  </Box>
                </Stack>

                {/* Rewards */}
                {rewards && rewards.points > 0 && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: tints.green, borderRadius: `${radius.sm}px`, border: `1px solid ${colors.primary.lighter}33` }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={useRewards}
                          onChange={(e) => setUseRewards(e.target.checked)}
                          sx={{ '&.Mui-checked': { color: colors.primary.main } }}
                          size="small"
                        />
                      }
                      label={<Typography sx={{ fontSize: '0.88rem', fontWeight: 600 }}>Use Rewards ({rewards.points} pts)</Typography>}
                    />
                    {useRewards && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                        <Typography sx={{ fontSize: '0.85rem', color: colors.success }}>Discount Applied:</Typography>
                        <Typography sx={{ fontSize: '0.85rem', color: colors.success, fontWeight: 700 }}>-₹{discount.toFixed(2)}</Typography>
                      </Box>
                    )}
                  </Box>
                )}

                {freeDelivery && (
                  <Typography sx={{ fontSize: '0.78rem', color: colors.success, mt: 1 }}>
                    🎉 Free delivery on orders ≥ ₹1000
                  </Typography>
                )}

                <Divider sx={{ my: 2.5 }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: '1.15rem' }}>{t('grandTotal')}:</Typography>
                  <Typography sx={{ fontWeight: 800, fontSize: '1.3rem', color: colors.primary.dark }}>₹{finalTotal.toFixed(2)}</Typography>
                </Box>

                <Button
                  component={motion.button}
                  whileTap={{ scale: 0.97 }}
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={placeOrderHandler}
                  disabled={isLoading || !selectedAddress || (paymentMethod === 'cod' && !isMinOrderMet)}
                  startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <LockOutlined />}
                  sx={{
                    bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1B5E20' },
                    borderRadius: '24px', py: 1.2, fontWeight: 800, fontSize: '1.05rem', textTransform: 'none',
                    boxShadow: '0 8px 24px rgba(46, 125, 50, 0.35)',
                    '&.Mui-disabled': { bgcolor: '#E5E7EB', boxShadow: 'none' },
                  }}
                >
                  {isLoading ? 'Processing...' : (paymentMethod === 'razorpay' ? 'Proceed to Pay' : 'Place Order (COD)')}
                </Button>

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mt: 2 }}>
                  <LockOutlined sx={{ fontSize: 14, color: colors.neutral[500] }} />
                  <Typography sx={{ fontSize: '0.75rem', color: colors.neutral[500] }}>
                    Secure & encrypted checkout
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        )}
      </Container>
    </Box>
  );
};

export default CheckoutPage;