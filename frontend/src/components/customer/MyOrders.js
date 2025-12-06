import React from 'react';
import { Typography, Box, Paper, Grid, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Loader from '../common/Loader';
import OrderTracker from '../customer/OrderTracker';

const MyOrders = ({ setSelectedSeller, setChatOpen }) => {
  const navigate = useNavigate();
  const { loading: ordersLoading, error: ordersError, orders = [] } = useSelector((state) => state.orderListMy || {});

  return (
    <div>
      <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 'medium' }}>
        My Orders
      </Typography>
      {ordersLoading ? (
        <Loader />
      ) : ordersError ? (
        <div>{ordersError}</div>
      ) : orders.length > 0 ? (
        <Box sx={{ backgroundColor: '#FFFFFF', borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', p: 2 }}>
          {orders.map((order) => (
            <Paper key={order._id} sx={{ mb: 3, p: 3, backgroundColor: '#FAFAFA', borderLeft: `4px solid ${order.orderStatus === 'delivered' ? '#4CAF50' : order.orderStatus === 'cancelled' ? '#F44336' : '#2196F3'}` }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#212121' }}>
                  Order #{order._id?.substring(18, 24).toUpperCase() || 'N/A'}
                </Typography>
                <span
                  style={{
                    backgroundColor:
                      order.orderStatus === 'delivered' ? '#4CAF50' :
                      order.orderStatus === 'cancelled' ? '#F44336' :
                      '#2196F3',
                    color: '#FFFFFF',
                    fontWeight: 'bold',
                    padding: '2px 8px',
                    borderRadius: 12,
                  }}
                >
                  {order.orderStatus || 'placed'}
                </span>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Placed on: {new Date(order.createdAt).toLocaleString()}
              </Typography>
              <Typography variant="body1" sx={{ mb: 2, color: '#2E7D32' }}>
                Total: ₹{(order.totalPrice || 0).toFixed(2)}
              </Typography>
              <OrderTracker order={order} />
              <Typography variant="h6" sx={{ mt: 3, mb: 2, fontWeight: 'bold', color: '#212121' }}>
                Order Items
              </Typography>
              <Grid container spacing={2}>
                {order.orderItems.map((item) => (
                  <Grid item xs={12} sm={6} md={4} key={item.product._id}>
                    <div style={{ display: 'flex', p: 2, backgroundColor: '#FFFFFF', borderRadius: 2, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                      <img
                        src={item.product.images?.[0] || '/default-image.jpg'}
                        alt={item.product.name}
                        style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 2 }}
                      />
                      <div style={{ ml: 2, flexGrow: 1 }}>
                        <Typography variant="subtitle1" style={{ fontWeight: 'bold', color: '#212121' }}>
                          {item.product.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Price: ₹{item.price}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Quantity: {item.qty}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Order Date: {new Date(order.createdAt).toLocaleDateString()}
                        </Typography>
                      </div>
                    </div>
                  </Grid>
                ))}
              </Grid>
              <Button
                variant="contained"
                size="small"
                onClick={() => navigate(`/orders/${order._id}`)}
                sx={{ mt: 2, backgroundColor: '#4CAF50', '&:hover': { backgroundColor: '#45A049' } }}
              >
                View Full Details
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  setSelectedSeller(order.seller?._id || null);
                  setChatOpen(true);
                }}
                sx={{ mt: 2, ml: 2, color: '#4CAF50', borderColor: '#4CAF50', '&:hover': { borderColor: '#45A049', color: '#45A049' } }}
                disabled={!order.seller?._id}
              >
                Chat Seller
              </Button>
            </Paper>
          ))}
        </Box>
      ) : (
        <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
          No orders found
        </Typography>
      )}
    </div>
  );
};

export default MyOrders;