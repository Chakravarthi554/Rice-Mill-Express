// src/components/customer/Dashboard.js
import React, { useState } from 'react';
import { Grid, Typography, Button, Box, Card, CardContent, CardMedia, Chip, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Loader from '../common/Loader';
import { useSelector, useDispatch } from 'react-redux';
import OrderTracker from '../customer/OrderTracker';
import { addToCart } from '../../redux/actions/cartActions';
import { addToWishlist } from '../../redux/actions/userActions';

const Dashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
 

  const [loadingBuy, setLoadingBuy] = useState(false);
  const [buyingProductId, setBuyingProductId] = useState(null);

  const { loading: productLoading, error: productError, products = [] } = useSelector((state) => state.productList || {});
  const { cartItems = [] } = useSelector((state) => state.cart || {});
  const { orders = [] } = useSelector((state) => state.orderListMy || {});
  const { userInfo } = useSelector((state) => state.userLogin || {});

  const totalCartAmount = cartItems.reduce((acc, item) => acc + (item.product?.price || 0) * (item.qty || 0), 0);
  const isMinOrderMet = totalCartAmount >= 1500;



  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered': return '#4CAF50';
      case 'cancelled': return '#F44336';
      case 'shipped': return '#2196F3';
      case 'processing': return '#FF9800';
      default: return '#757575';
    }
  };

  // --- HANDLERS ---
  const handleAddToCart = async (productId) => {
    try {
      await dispatch(addToCart(productId, 1));
    } catch (err) {
      alert(err.message || "Failed to add to cart");
    }
  };

  const handleBuyNow = async (productId) => {
    if (!userInfo) {
      navigate('/login');
      return;
    }

    setLoadingBuy(true);
    setBuyingProductId(productId);
    try {
      await dispatch(addToCart(productId, 1));
      navigate('/checkout');
    } catch (err) {
      alert(err.message || "Failed to proceed to checkout");
    } finally {
      setLoadingBuy(false);
      setBuyingProductId(null);
    }
  };

  const handleAddToWishlist = async (productId) => {
    if (!userInfo) {
      navigate('/login');
      return;
    }

    try {
      await dispatch(addToWishlist(productId));
    } catch (err) {
      alert(err.message || "Failed to add to wishlist");
    }
  };

  const handleImageLoad = () => {};
  const handleImageError = () => {};

    const [chatOpen, setChatOpen] = useState(false);
const [selectedSeller, setSelectedSeller] = useState(null);

  return (
    <Box sx={{ p: 2 }}>
      {/* Welcome Section */}
      <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 'bold', color: 'primary.main' }}>
        Welcome back, {userInfo?.name || 'Customer'}
      </Typography>

      {/* Quick Action Buttons */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Button fullWidth variant="contained" color="primary" onClick={() => navigate('/products')} sx={{ py: 2, borderRadius: 2, fontWeight: 'bold' }}>
            Browse Products
          </Button>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Button fullWidth variant="contained" color="secondary" onClick={() => navigate('/bulk-order')} sx={{ py: 2, borderRadius: 2, fontWeight: 'bold' }}>
            Bulk Order
          </Button>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Button fullWidth variant="outlined" color="primary" onClick={() => navigate('/cart')} sx={{ py: 2, borderRadius: 2, fontWeight: 'bold' }}>
            View Cart ({cartItems.length})
          </Button>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Button fullWidth variant="outlined" color="secondary" onClick={() => navigate('/wishlist')} sx={{ py: 2, borderRadius: 2, fontWeight: 'bold' }}>
            My Wishlist
          </Button>
        </Grid>
      </Grid>

      {/* Products Section */}
      <Typography variant="h6" gutterBottom sx={{ mt: 4, mb: 2, fontWeight: 'bold', color: 'text.primary' }}>
        Featured Products
      </Typography>

      {productLoading ? (
        <Loader />
      ) : productError ? (
        <Box sx={{ p: 2, textAlign: 'center', color: 'error.main' }}>
          {productError}
        </Box>
      ) : products.length > 0 ? (
        <Grid container spacing={3}>
          {products.map((product) => {
            const hasOffer = typeof product.offerPrice === 'number' && product.offerPrice > 0 && product.offerPrice < product.price;
            const displayPrice = hasOffer ? product.offerPrice : product.price;

            return (
              <Grid item key={product._id} xs={12} sm={6} md={4} lg={3}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    transition: 'transform 0.3s, box-shadow 0.3s',
                    '&:hover': { transform: 'translateY(-5px)', boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }
                  }}
                  onClick={() => navigate(`/products/${product._id}`)}
                >
                  <CardMedia
                    component="img"
                    height="160"
                    image={product.images?.[0] || '/default-image.jpg'}
                    alt={product.name}
                    onLoad={() => handleImageLoad(product._id)}
                    onError={() => handleImageError(product._id)}
                    sx={{ objectFit: 'cover' }}
                  />

                  <CardContent>
                    <Typography variant="h6" noWrap sx={{ mb: 1, fontWeight: 'medium' }}>
                      {product.name}
                    </Typography>

                    {/* Price */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                        ₹{(displayPrice || 0).toFixed(2)}
                      </Typography>
                      {hasOffer && (
                        <Typography variant="body2" sx={{ textDecoration: 'line-through', color: 'text.secondary' }}>
                          ₹{(product.price || 0).toFixed(2)}
                        </Typography>
                      )}
                      {hasOffer && (
                        <Chip label="OFFER" size="small" color="error" sx={{ height: 20, fontSize: '0.7rem' }} />
                      )}
                    </Box>

                    {/* Rating */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', color: 'warning.main' }}>
                        <span role="img" aria-label="star">★</span>
                        <Typography variant="body2" sx={{ ml: 0.5, fontWeight: 'medium' }}>
                          {product.rating || 0} ({product.numReviews || 0})
                        </Typography>
                      </Box>
                    </Box>

                    {/* Action Buttons */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="contained"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(product._id);
                          }}
                          sx={{ flex: 1, backgroundColor: 'success.main', '&:hover': { backgroundColor: 'success.dark' } }}
                        >
                          Add to Cart
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToWishlist(product._id);
                          }}
                          sx={{ flex: 1, color: 'primary.main', borderColor: 'primary.main', '&:hover': { borderColor: 'primary.dark', color: 'primary.dark' } }}
                        >
                          Wishlist
                        </Button>
                      </Box>

                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="contained"
                          color="secondary"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBuyNow(product._id);
                          }}
                          disabled={loadingBuy && buyingProductId === product._id}
                          sx={{ flex: 2 }}
                        >
                          {loadingBuy && buyingProductId === product._id ? <CircularProgress size={20} color="inherit" /> : 'Buy Now'}
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSeller(product.seller?._id || null);
                            setChatOpen(true);
                          }}
                          disabled={!product.seller?._id}
                          sx={{ flex: 1, color: 'info.main', borderColor: 'info.main', '&:hover': { borderColor: 'info.dark', color: 'info.dark' } }}
                        >
                          Chat
                        </Button>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      ) : (
        <Box sx={{ textAlign: 'center', p: 4 }}>
          <Typography variant="body1" color="text.secondary">
            No products available at the moment.
          </Typography>
        </Box>
      )}

      {/* Recent Orders */}
      <Typography variant="h6" gutterBottom sx={{ mt: 6, mb: 2, fontWeight: 'bold', color: 'text.primary' }}>
        Recent Orders
      </Typography>

      <Box sx={{ mb: 4 }}>
        {orders.length > 0 ? (
          orders.slice(0, 3).map((order) => (
            <Card key={order._id} sx={{ mb: 3, p: 2, borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                  Order #{order._id?.substring(18, 24).toUpperCase() || 'N/A'}
                </Typography>
                <Chip
                  label={order.orderStatus?.toUpperCase() || 'PLACED'}
                  sx={{ backgroundColor: getStatusColor(order.orderStatus), color: 'white', fontWeight: 'bold' }}
                />
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Placed on: {new Date(order.createdAt).toLocaleString()}
              </Typography>

              <Typography variant="h6" sx={{ mb: 2, color: 'success.main', fontWeight: 'bold' }}>
                Total: ₹{(order.totalPrice || 0).toFixed(2)}
              </Typography>

              <OrderTracker orderId={order._id} />

              <Typography variant="h6" sx={{ mt: 3, mb: 2, fontWeight: 'bold' }}>
                Order Items
              </Typography>

              <Grid container spacing={2}>
                {order.orderItems?.map((item) => (
                  <Grid item xs={12} sm={6} md={4} key={item.product._id}>
                    <Card variant="outlined" sx={{ p: 1, display: 'flex', alignItems: 'center' }}>
                      <CardMedia
                        component="img"
                        image={item.product.images?.[0] || '/default-image.jpg'}
                        alt={item.product.name}
                        sx={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 1 }}
                      />
                      <Box sx={{ ml: 2, flexGrow: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                          {item.product.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Price: ₹{item.price}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Qty: {item.qty}
                        </Typography>
                      </Box>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button variant="contained" onClick={() => navigate(`/orders/${order._id}`)} sx={{ backgroundColor: 'primary.main', '&:hover': { backgroundColor: 'primary.dark' } }}>
                  View Order Details
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setSelectedSeller(order.seller?._id || null);
                    setChatOpen(true);
                  }}
                  disabled={!order.seller?._id}
                  sx={{ color: 'info.main', borderColor: 'info.main', '&:hover': { borderColor: 'info.dark', color: 'info.dark' } }}
                >
                  Contact Seller
                </Button>
              </Box>
            </Card>
          ))
        ) : (
          <Card sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              No recent orders found.
            </Typography>
            <Button variant="contained" sx={{ mt: 2 }} onClick={() => navigate('/products')}>
              Start Shopping
            </Button>
          </Card>
        )}
      </Box>
    </Box>
  );
};

export default Dashboard;