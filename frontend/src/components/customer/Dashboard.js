// src/components/customer/Dashboard.js
import React, { useState, useEffect } from 'react';
import { listProducts } from '../../redux/actions/productActions';
import { Grid, Typography, Button, Box, Card, CardContent, CardMedia, Chip, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Loader from '../common/Loader';
import { useSelector, useDispatch } from 'react-redux';
import OrderTracker from '../customer/OrderTracker';
import { addToCart, listMyCart } from '../../redux/actions/cartActions';
import { addToWishlist } from '../../redux/actions/userActions';
import Message from '../common/Message';
import Price from '../common/Price';

const Dashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();


  const [loadingBuy, setLoadingBuy] = useState(false);
  const [buyingProductId, setBuyingProductId] = useState(null);

  const { loading: productLoading, error: productError, products = [] } = useSelector((state) => state.productList || {});
  const { cartItems = [] } = useSelector((state) => state.cart || {});
  const { userInfo } = useSelector((state) => state.userLogin || {});

  useEffect(() => {
    if (!products || products.length === 0) {
      dispatch(listProducts()); // Fetch initial products
    }
    // We also need to fetch orders for the recent orders logic? 
    // Ah, I removed recent orders logic! So no need.
  }, [dispatch]); //'products' dependency removed to avoid loops if we want to keep current search


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

  const handleImageLoad = () => { };
  const handleImageError = () => { };



  return (
    <Box sx={{ p: 2 }}>
      {/* Welcome Section */}
      <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 'bold', color: 'primary.main' }}>
        Welcome back, {userInfo?.name || 'Customer'}
      </Typography>

      {/* Quick Action Buttons */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Button fullWidth variant="contained" color="secondary" onClick={() => navigate('/bulk-order')} sx={{ py: 2, borderRadius: 2, fontWeight: 'bold' }}>
            Bulk Order
          </Button>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Button fullWidth variant="outlined" color="primary" onClick={() => navigate('/cart')} sx={{ py: 2, borderRadius: 2, fontWeight: 'bold' }}>
            View Cart ({cartItems.length})
          </Button>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
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
                    height="200"
                    image={product.images?.[0] || '/default-image.jpg'}
                    alt={product.name}
                    onLoad={() => handleImageLoad(product._id)}
                    onError={() => handleImageError(product._id)}
                    sx={{
                      objectFit: 'contain',  // ✅ Changed from 'cover' to 'contain' for Flipkart-style centering
                      backgroundColor: '#f5f5f5',  // Light background to show image better
                      p: 2  // Padding around image
                    }}
                  />

                  <CardContent>
                    <Typography variant="h6" noWrap sx={{ mb: 1, fontWeight: 'medium' }}>
                      {product.name}
                    </Typography>

                    {/* Price */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                        <Price amount={displayPrice || 0} />
                      </Typography>
                      {hasOffer && (
                        <Typography variant="body2" sx={{ textDecoration: 'line-through', color: 'text.secondary' }}>
                          <Price amount={product.price || 0} />
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
                          sx={{ flex: 1 }}
                        >
                          {loadingBuy && buyingProductId === product._id ? <CircularProgress size={20} color="inherit" /> : 'Buy Now'}
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
      )
      }


    </Box >
  );
};

export default Dashboard;