import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Container, Typography, Button, Grid, Paper, Box, Alert, IconButton, Divider, CircularProgress, Checkbox, FormControlLabel
} from '@mui/material';
import { Remove, Add } from '@mui/icons-material';
import AddressManager from '../../components/customer/AddressManager';
import PaymentMethodSelector from '../../components/common/PaymentMethodSelector';
import Loader from '../../components/common/Loader';
import { createOrder } from '../../redux/actions/orderActions';
import { listMyCart, addToCart } from '../../redux/actions/cartActions';
import { createRazorpayOrder } from '../../redux/actions/paymentActions';
import { loadScript } from '../../utils/loadScript';
import { ORDER_CREATE_RESET } from '../../redux/constants/orderConstants';
import { RAZORPAY_ORDER_CREATE_RESET } from '../../redux/constants/paymentConstants';

const CheckoutPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const cart = useSelector(s => s.cart);
  const cartItems = cart?.cartItems || [];

  const userLogin = useSelector(s => s.userLogin);
  const { userInfo } = userLogin;

  const orderCreate = useSelector(s => s.orderCreate);
  const { loading: orderLoading, error: orderError, success: orderSuccess, order: createdOrder } = orderCreate;

  const razorpayOrderCreate = useSelector(s => s.razorpayOrderCreate);
  const { loading: rzpLoading, error: rzpError, success: rzpSuccess, razorpayOrder } = razorpayOrderCreate;

  const [selectedAddress, setSelectedAddress] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [rzpInitiating, setRzpInitiating] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]); // ✅ Track selected cart items
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [freeDelivery, setFreeDelivery] = useState(false);
  const razorpayRef = useRef(null);

  // -----------------------------------------------------------------
  // Load fresh cart on mount & reset order states
  // -----------------------------------------------------------------
  useEffect(() => {
    dispatch(listMyCart());               // <-- always get the latest cart from DB
    dispatch({ type: ORDER_CREATE_RESET });
    dispatch({ type: RAZORPAY_ORDER_CREATE_RESET });
  }, [dispatch]);

  // ✅ Select all items by default when cart loads
  useEffect(() => {
    if (cartItems.length > 0 && selectedItems.length === 0) {
      setSelectedItems(cartItems.map(item => item.product._id));
    }
  }, [cartItems]);

  // -----------------------------------------------------------------
  // Redirect when cart becomes empty
  // -----------------------------------------------------------------
  useEffect(() => {
    if (cartItems.length === 0) navigate('/cart');
  }, [cartItems, navigate]);

  // -----------------------------------------------------------------
  // Success → go to order-success page
  // -----------------------------------------------------------------
  useEffect(() => {
    if (orderSuccess && createdOrder) {
      const orderToShow = Array.isArray(createdOrder.orders) ? createdOrder.orders[0] : createdOrder;
      navigate('/orders/success', { state: { order: orderToShow } });
      dispatch({ type: ORDER_CREATE_RESET });
    }
  }, [orderSuccess, createdOrder, navigate, dispatch]);

  // -----------------------------------------------------------------
  // Total calculation - ✅ FIXED: Calculate for SELECTED items only
  // -----------------------------------------------------------------
  const totalAmount = cartItems
    .filter(i => selectedItems.includes(i.product?._id))
    .reduce((sum, i) => {
      const price = i.product?.price ?? 0;
      const qty = i.quantity ?? 1;
      return sum + price * qty;
    }, 0);

  // Calculate delivery charge
  useEffect(() => {
    if (totalAmount >= 1000) {
      setDeliveryCharge(0);
      setFreeDelivery(true);
    } else {
      // Base charge: ₹50
      // For demo, using fixed charge. In production, calculate based on distance
      const baseCharge = 50;
      setDeliveryCharge(baseCharge);
      setFreeDelivery(false);
    }
  }, [totalAmount]);

  const grandTotal = totalAmount + deliveryCharge;
  const isMinOrderMet = totalAmount >= 1500;

  // -----------------------------------------------------------------
  // Qty change → call API, then re-fetch cart (so UI stays in sync)
  // -----------------------------------------------------------------
  const handleQtyChange = async (idx, delta) => {
    const item = cartItems[idx];
    const newQty = Math.max(1, (item.quantity ?? 1) + delta);
    await dispatch(addToCart(item.product._id, newQty));
    dispatch(listMyCart());                // <-- refresh UI instantly
  };

  const handlePaymentChange = (method) => {
    setPaymentMethod(method);
    dispatch({ type: RAZORPAY_ORDER_CREATE_RESET });
  };

  // \u2705 Handle item selection toggle
  const handleItemToggle = (productId) => {
    setSelectedItems(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  // -----------------------------------------------------------------
  // COD order payload - ✅ UPDATED: Use only selected items
  // -----------------------------------------------------------------
  const placeCODOrder = async () => {
    const selectedCartItems = cartItems.filter(i => selectedItems.includes(i.product._id));
    const payload = {
      orderItems: selectedCartItems.map(i => ({
        product: i.product._id,
        qty: i.quantity
      })),
      shippingAddressId: selectedAddress._id,
      paymentMethod: 'cod',
    };
    await dispatch(createOrder(payload));
  };

  // -----------------------------------------------------------------
  // Razorpay flow
  // -----------------------------------------------------------------
  const initiateRazorpay = async () => {
    setRzpInitiating(true);
    const payload = {
      amount: totalAmount * 100,
      currency: 'INR',
      receipt: `rcpt_${userInfo._id}_${Date.now()}`.slice(0, 40)
    };
    const rzpOrder = await dispatch(createRazorpayOrder(payload));
    if (!rzpOrder?.id) throw new Error('Failed to create Razorpay order');

    const options = {
      key: process.env.REACT_APP_RAZORPAY_KEY_ID,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      name: 'RiceMill Express',
      description: 'Order Payment',
      order_id: rzpOrder.id,
      handler: async (response) => {
        const selectedCartItems = cartItems.filter(i => selectedItems.includes(i.product._id));
        const finalPayload = {
          orderItems: selectedCartItems.map(i => ({
            product: i.product._id,
            qty: i.quantity
          })),
          shippingAddressId: selectedAddress._id,
          paymentMethod: 'razorpay',
          razorpayPaymentId: response.razorpay_payment_id,
          razorpayOrderId: response.razorpay_order_id,
          razorpaySignature: response.razorpay_signature,
        };
        await dispatch(createOrder(finalPayload));
      },
      prefill: { name: userInfo.name, email: userInfo.email, contact: userInfo.phone },
      theme: { color: '#4CAF50' }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
    rzp.on('payment.failed', () => {
      alert('Payment failed. Try again.');
      setRzpInitiating(false);
    });
    razorpayRef.current = rzp;
  };

  const placeOrderHandler = async () => {
    if (!selectedAddress) return alert('Select a delivery address');
    if (selectedItems.length === 0) return alert('Please select at least one item to order'); // \u2705 Validate selection
    if (paymentMethod === 'cod' && !isMinOrderMet) return alert('Minimum ₹1500 for COD');

    if (paymentMethod === 'cod') await placeCODOrder();
    else await initiateRazorpay();
  };

  // -----------------------------------------------------------------
  // Load Razorpay script only when needed
  // -----------------------------------------------------------------
  useEffect(() => {
    if (paymentMethod === 'razorpay' && !window.Razorpay) {
      loadScript('https://checkout.razorpay.com/v1/checkout.js');
    }
    return () => {
      if (razorpayRef.current?.close) razorpayRef.current.close();
    };
  }, [paymentMethod]);

  const isLoading = orderLoading || rzpLoading || rzpInitiating;

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: 'green' }}>
        Checkout
      </Typography>

      {isLoading && <Loader />}
      {orderError && <Alert severity="error" sx={{ mb: 2 }}>{orderError}</Alert>}
      {rzpError && <Alert severity="error" sx={{ mb: 2 }}>{rzpError}</Alert>}

      <Grid container spacing={3}>
        {/* ---------- LEFT COLUMN ---------- */}
        <Grid item xs={12} md={8}>
          {/* Address */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Delivery Address</Typography>
            <AddressManager onSelectAddress={setSelectedAddress} />
            {!selectedAddress && <Alert severity="info" sx={{ mt: 2 }}>Please select an address</Alert>}
          </Paper>

          {/* Payment */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <PaymentMethodSelector value={paymentMethod} onChange={handlePaymentChange} />
            {paymentMethod === 'cod' && !isMinOrderMet && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                Minimum ₹1500 required for COD. Current: ₹{totalAmount.toFixed(2)}
              </Alert>
            )}
          </Paper>
        </Grid>

        {/* ---------- RIGHT COLUMN (SUMMARY) ---------- */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, position: 'sticky', top: 20 }}>
            <Typography variant="h6" gutterBottom>Order Summary</Typography>

            {cartItems.map((item, idx) => (
              <Box key={item.product._id} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                {/* \u2705 Checkbox for item selection */}
                <Checkbox
                  checked={selectedItems.includes(item.product._id)}
                  onChange={() => handleItemToggle(item.product._id)}
                  sx={{ mr: 1 }}
                />
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="body2">{item.product.name}</Typography>
                  <Typography variant="caption">
                    ₹{item.product.price} × {item.quantity}
                  </Typography>
                </Box>

                <IconButton
                  size="small"
                  onClick={() => handleQtyChange(idx, -1)}
                  disabled={item.quantity <= 1}
                >
                  <Remove />
                </IconButton>

                <Typography sx={{ mx: 1, minWidth: 30, textAlign: 'center' }}>
                  {item.quantity}
                </Typography>

                <IconButton
                  size="small"
                  onClick={() => handleQtyChange(idx, 1)}
                >
                  <Add />
                </IconButton>

                <Typography sx={{ ml: 2 }}>
                  ₹{(item.product.price * item.quantity).toFixed(2)}
                </Typography>
              </Box>
            ))}

            <Divider sx={{ my: 2 }} />

            {/* Delivery Charge */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography>Subtotal:</Typography>
              <Typography>₹{totalAmount.toFixed(2)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography>Delivery Charge:</Typography>
              {freeDelivery ? (
                <Typography color="success.main" fontWeight="bold">FREE</Typography>
              ) : (
                <Typography>₹{deliveryCharge.toFixed(2)}</Typography>
              )}
            </Box>
            {freeDelivery && (
              <Typography variant="caption" color="success.main" sx={{ mb: 1, display: 'block' }}>
                🎉 Free delivery on orders ≥ ₹1000
              </Typography>
            )}
            <Divider sx={{ my: 1 }} />
            <Typography variant="h6">Grand Total: ₹{grandTotal.toFixed(2)}</Typography>

            <Button
              fullWidth
              variant="contained"
              color="success"
              sx={{ mt: 3 }}
              onClick={placeOrderHandler}
              disabled={isLoading || !selectedAddress || (paymentMethod === 'cod' && !isMinOrderMet)}
            >
              {isLoading ? <CircularProgress size={24} /> :
                (paymentMethod === 'razorpay' ? 'Proceed to Pay' : 'Place Order (COD)')}
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default CheckoutPage;