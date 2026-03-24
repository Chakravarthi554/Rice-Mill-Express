// src/components/customer/Dashboard.js
import React, { useState, useEffect } from 'react';
import { listProducts } from '../../redux/actions/productActions';
import { Grid, Typography, Button, Box, Card, CardContent, CardMedia, Chip, CircularProgress, IconButton } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Loader from '../common/Loader';
import { useSelector, useDispatch } from 'react-redux';
import { addToCart } from '../../redux/actions/cartActions';
import { addToWishlist } from '../../redux/actions/userActions';
import Price from '../common/Price';
import { useTranslation } from 'react-i18next';
import { Star, FavoriteBorder, Favorite, AddCircleOutline } from '@mui/icons-material';

const Dashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const [loadingBuy, setLoadingBuy] = useState(false);
  const [buyingProductId, setBuyingProductId] = useState(null);

  const { loading: productLoading, error: productError, products = [] } = useSelector((state) => state.productList || {});
  const { cartItems = [] } = useSelector((state) => state.cart || {});
  const { userInfo } = useSelector((state) => state.userLogin || {});
  const { wishlistItems = [] } = useSelector(state => state.wishlist || {});

  useEffect(() => {
    if (!products || products.length === 0) {
      dispatch(listProducts());
    }
  }, [dispatch, products]);

  const handleAddToCart = async (productId) => {
    try {
      await dispatch(addToCart(productId, 1));
    } catch (err) {
      alert(err.message || "Failed to add to cart");
    }
  };

  const handleBuyNow = async (productId) => {
    if (!userInfo) { navigate('/login'); return; }
    setLoadingBuy(true);
    setBuyingProductId(productId);
    try {
      await dispatch(addToCart(productId, 1));
      navigate('/checkout');
    } catch (err) { alert(err.message || "Failed to proceed to checkout"); } 
    finally { setLoadingBuy(false); setBuyingProductId(null); }
  };

  const handleAddToWishlist = async (productId) => {
    if (!userInfo) { navigate('/login'); return; }
    try { await dispatch(addToWishlist(productId)); } 
    catch (err) { alert(err.message || "Failed to add to wishlist"); }
  };

  const isWishlisted = (id) => wishlistItems.some(x => (x._id || x) === id);

  return (
    <Box sx={{ p: 2 }}>
      {/* Welcome & Quick Actions removed from here as they are in CustomerDashboard.js container now */}
      
      <Typography variant="h5" sx={{ mt: 2, mb: 3, fontWeight: 800, color: '#111827', letterSpacing: '-0.5px' }}>
        {t('featuredProducts') || 'Recommended For You'}
      </Typography>

      {productLoading ? (
        <Loader />
      ) : productError ? (
        <Box sx={{ p: 2, textAlign: 'center', color: 'error.main' }}>{productError}</Box>
      ) : products.length > 0 ? (
        <Grid container spacing={3}>
          {products.map((product) => {
            const hasOffer = typeof product.offerPrice === 'number' && product.offerPrice > 0 && product.offerPrice < product.price;
            const displayPrice = hasOffer ? product.offerPrice : product.price;
            const discount = hasOffer ? Math.round((1 - product.offerPrice / product.price) * 100) : 0;
            const rating = product.rating || (Math.random() * (5.0 - 4.0) + 4.0).toFixed(1);

            return (
              <Grid item key={product._id} xs={12} sm={6} md={4} lg={3}>
                <Card
                  elevation={0}
                  onClick={() => navigate(`/products/${product._id}`)}
                  sx={{
                    cursor: 'pointer',
                    borderRadius: 5, // Squircles geometry
                    border: '1px solid #F3F4F6',
                    position: 'relative',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': { transform: 'translateY(-6px)', boxShadow: '0 12px 24px rgba(0,0,0,0.06)', borderColor: '#E5E7EB' }
                  }}
                >
                  <Box sx={{ position: 'relative', height: 220, bgcolor: '#F0FDF4', borderRadius: '20px 20px 0 0', overflow: 'hidden' }}>
                    <CardMedia
                      component="img"
                      sx={{ height: '100%', width: '100%', objectFit: 'cover' }}
                      image={product.images?.[0] || 'https://via.placeholder.com/300x300.png?text=Rice'}
                      alt={product.name}
                    />

                    {/* Floating Badges */}
                    {discount > 0 && (
                      <Box sx={{ position: 'absolute', top: 12, left: 12, bgcolor: '#F97316', color: '#fff', px: 1.5, py: 0.5, borderRadius: 2, fontSize: '0.75rem', fontWeight: 800 }}>
                        {discount}% OFF
                      </Box>
                    )}
                    
                    <IconButton 
                      onClick={(e) => { e.stopPropagation(); handleAddToWishlist(product._id); }}
                      sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(4px)', '&:hover': { bgcolor: '#fff' } }}
                      size="small"
                    >
                      {isWishlisted(product._id) ? <Favorite color="error" fontSize="small" /> : <FavoriteBorder fontSize="small" sx={{color: '#6B7280'}}/>}
                    </IconButton>

                    {/* Floating Rating Pill (Phase 3 Spec) */}
                    <Box sx={{ position: 'absolute', bottom: 12, left: 12, bgcolor: 'rgba(255,255,255,0.95)', p: '4px 8px', borderRadius: 3, display: 'flex', alignItems: 'center', gap: 0.5, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                      <Typography variant="caption" fontWeight="800" color="#111827">{rating}</Typography>
                      <Star sx={{ color: '#F59E0B', fontSize: 14 }} />
                    </Box>
                  </Box>

                  <CardContent sx={{ p: 2.5 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#111827', mb: 0.5, lineHeight: 1.2 }}>
                      {product.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#6B7280', mb: 2, fontWeight: 600 }}>
                      {product.weight || '1'} {product.unit || 'kg'} • Standard Delivery
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', mt: 'auto' }}>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: '#111827', lineHeight: 1 }}>
                          <Price amount={displayPrice || 0} />
                        </Typography>
                        {hasOffer && (
                          <Typography variant="caption" sx={{ textDecoration: 'line-through', color: '#9CA3AF', fontWeight: 600 }}>
                            <Price amount={product.price || 0} />
                          </Typography>
                        )}
                      </Box>

                      {/* Pill Shaped Add Button */}
                      <Button
                        variant="contained"
                        onClick={(e) => { e.stopPropagation(); handleAddToCart(product._id); }}
                        sx={{ 
                          bgcolor: '#16A34A', borderRadius: 50, minWidth: 0, px: 2, py: 1, 
                          boxShadow: '0 4px 12px rgba(22, 163, 74, 0.2)',
                          '&:hover': { bgcolor: '#15803D', boxShadow: '0 6px 16px rgba(22, 163, 74, 0.3)' }
                        }}
                      >
                       <Typography variant="button" fontWeight="800" mr={0.5}>Add</Typography> 
                       <AddCircleOutline fontSize="small" />
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      ) : (
        <Box sx={{ textAlign: 'center', p: 8, bgcolor: '#fff', borderRadius: 4, border: '1px dashed #E5E7EB' }}>
          <Typography variant="h6" color="#6B7280" fontWeight={700}>
            No products found matching your criteria.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default Dashboard;