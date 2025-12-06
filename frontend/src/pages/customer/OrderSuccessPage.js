import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Typography, Container, Paper, Button } from '@mui/material';
import OrderTracker from '../../components/customer/OrderTracker';

const OrderSuccessPage = () => {
  const location = useLocation();
  const order = location.state?.order;

  useEffect(() => {
    if (!order) {
      console.error('No order data found');
    }
  }, [order]);

  return (
    <Container sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ color: '#2e7d32' }}>
          Order Placed Successfully!
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Your order has been placed. You can track its status below.
        </Typography>
        {order ? (
          <OrderTracker order={order} />
        ) : (
          <Typography color="error">No order data available. Please check your orders.</Typography>
        )}
        <Button variant="contained" color="primary" sx={{ mt: 2 }} onClick={() => window.location.href = '/customer/dashboard'}>
          Back to Dashboard
        </Button>
      </Paper>
    </Container>
  );
};

export default OrderSuccessPage;