import React, { useRef } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Typography,
  Paper,
  Divider,
  Icon,
  useTheme,
  List,
  ListItem,
  ListItemText,
  Button,
  IconButton,
} from '@mui/material';
import {
  Assignment,
  Inventory,
  LocalShipping,
  Home as HomeIcon,
  CheckCircle,
  Cancel as CancelIcon,
  Phone,
  HourglassEmpty,
  AddShoppingCart,
} from '@mui/icons-material';
import { addToCart } from '../../redux/actions/cartActions';

const statusSteps = [
  { label: 'Placed', value: 'placed', icon: <Assignment /> },
  { label: 'Processing', value: 'processing', icon: <HourglassEmpty /> },
  { label: 'Packed', value: 'packed', icon: <Inventory /> },
  { label: 'Shipped', value: 'shipped', icon: <LocalShipping /> },
  { label: 'Out for Delivery', value: 'out_for_delivery', icon: <HomeIcon /> },
  { label: 'Delivered', value: 'delivered', icon: <CheckCircle /> },
  { label: 'Completed', value: 'completed', icon: <CheckCircle /> },
  { label: 'Cancelled', value: 'cancelled', icon: <CancelIcon /> },
];

const FALLBACK_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

const OrderTracker = ({ order }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const errorCountRef = useRef(0);

  if (!order) return <Typography>No order data available</Typography>;

  const normalize = (status) => status?.trim().toLowerCase().replace(/\s+/g, '_') || 'unknown';
  const normalizedStatus = normalize(order.orderStatus);
  const activeStep = statusSteps.findIndex((step) => step.value === normalizedStatus);
  const currentStep = activeStep >= 0 ? activeStep : -1;
  const isCancelled = normalizedStatus === 'cancelled';
  const isUnknown = currentStep === -1;

  const getStepColor = (index) =>
    index <= currentStep ? '#4CAF50' : theme.palette.grey[400];

  const productImage = order.orderItems?.[0]?.product?.images?.[0] || FALLBACK_IMAGE;

  const handleImageError = (e) => {
    if (errorCountRef.current < 1) {
      errorCountRef.current++;
      e.target.src = FALLBACK_IMAGE;
    } else {
      e.target.style.display = 'none';
    }
  };

  const handleAddToCart = () => {
    order.orderItems.forEach((item) => {
      if (item.product?._id) {
        dispatch(addToCart(item.product._id, item.qty));
      }
    });
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3, borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>Order Status</Typography>
      <Divider sx={{ mb: 3 }} />

      {isCancelled ? (
        <Box sx={{ display: 'flex', alignItems: 'center', color: '#F44336' }}>
          <CancelIcon sx={{ mr: 1 }} />
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>Order Cancelled</Typography>
        </Box>
      ) : isUnknown ? (
        <Typography color="warning.main">Unknown Status: {order.orderStatus}</Typography>
      ) : (
        <Stepper activeStep={currentStep} alternativeLabel>
          {statusSteps.map((step, index) => (
            <Step key={step.value}>
              <StepLabel icon={<Icon sx={{ color: getStepColor(index) }}>{step.icon}</Icon>}>
                <Typography sx={{ color: getStepColor(index), fontWeight: index === currentStep ? 'bold' : 'normal' }}>
                  {step.label}
                </Typography>
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      )}

      <Box sx={{ mt: 2, fontSize: '0.875rem', color: 'text.secondary' }}>
        <div>Last updated: {new Date(order.updatedAt || order.createdAt).toLocaleString()}</div>
        <div>Expected: {new Date(order.expectedDelivery || Date.now()).toLocaleDateString()}</div>
      </Box>

      {order.orderStatus === 'out_for_delivery' && order.deliveryPartner && (
        <Box sx={{ mt: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
          <Typography variant="subtitle1" fontWeight="bold">Delivery Partner</Typography>
          <List dense>
            <ListItem><ListItemText primary="Name" secondary={order.deliveryPartner.name} /></ListItem>
            <ListItem>
              <ListItemText primary="Phone" secondary={order.deliveryPartner.phone} />
              <IconButton href={`tel:${order.deliveryPartner.phone}`}><Phone /></IconButton>
            </ListItem>
          </List>
          <Button
            variant="contained"
            size="small"
            onClick={() => window.open(`https://track.shiprocket.in/${order.trackingId}`, '_blank')}
          >
            Track
          </Button>
        </Box>
      )}

      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <img src={productImage} alt="Product" style={{ maxWidth: 180, borderRadius: 8 }} onError={handleImageError} />
      </Box>

      {!isCancelled && order.orderItems?.length > 0 && (
        <Button variant="contained" startIcon={<AddShoppingCart />} onClick={handleAddToCart} sx={{ mt: 2, mr: 1 }}>
          Add to Cart
        </Button>
      )}
      <Button variant="outlined" size="small" onClick={() => navigate(`/orders/${order._id}`)} sx={{ mt: 2 }}>
        Details
      </Button>
    </Paper>
  );
};

export default OrderTracker;