import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Card, CardContent, CardMedia, Button, IconButton, Grid, Chip } from '@mui/material';
import { Delete as DeleteIcon, ShoppingCart, Favorite, ArrowForward } from '@mui/icons-material';
import { getWishlistAction, removeFromWishlist } from '../../redux/actions/userActions';
import { addToCart } from '../../redux/actions/cartActions';
import { listProducts } from '../../redux/actions/productActions';
import Message from '../../components/common/Message';
import ProductCard from '../../components/ui/ProductCard';
import EmptyState from '../../components/ui/EmptyState';

const BACKEND_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5001').replace('/api', '');
const getImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return BACKEND_URL + url;
};

const WishlistPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { products = [] } = useSelector((state) => state.productList || {});
  const { wishlistItems, loading, error } = useSelector((state) => state.userWishlist || { wishlistItems: [], loading: false, error: null });

  useEffect(() => {
    dispatch(getWishlistAction());
    dispatch(listProducts());
  }, [dispatch]);

  const handleRemoveFromWishlist = (id) => {
    dispatch(removeFromWishlist(id));
  };

  const handleAddToCart = (productId) => {
    dispatch(addToCart(productId, 1));
  };

  const wishlistIds = wishlistItems?.map(item => item._id) || [];
  const recommendedProducts = products.filter(p => !wishlistIds.includes(p._id));

  if (wishlistItems?.length === 0 && !loading) {
    return (
      <Box sx={{ bgcolor: '#FFF5F5', minHeight: '100vh' }}>
        <Container maxWidth="md" sx={{ py: 8 }}>
          <EmptyState
            icon="❤️"
            title="Your wishlist is empty"
            description="Save your favorite products and check back later."
            action={{ label: 'Browse Products', onClick: () => navigate('/products') }}
          />
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: '#FFF5F5', minHeight: '100vh', pb: 8 }}>
      <Container maxWidth="xl" sx={{ pt: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Favorite sx={{ color: '#EF4444', fontSize: 28 }} />
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#111827' }}>
            My Wishlist
          </Typography>
          <Chip
            label={`${wishlistItems?.length || 0} items`}
            sx={{ bgcolor: '#FEE2E2', color: '#EF4444', fontWeight: 700, fontSize: '0.85rem' }}
          />
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <Typography color="text.secondary">Loading wishlist...</Typography>
          </Box>
        ) : error ? (
          <Message severity="error">{error}</Message>
        ) : (
          <Grid container spacing={3}>
            {wishlistItems?.map((product) => {
              const imageUrl = getImageUrl(product.images?.[0] || product.image);
              const price = product.offerPrice || product.price || 0;
              const hasOffer = product.offerPrice && product.offerPrice < product.price;
              const discount = hasOffer ? Math.round((1 - product.offerPrice / product.price) * 100) : 0;

              return (
                <Grid item xs={12} sm={6} md={4} lg={3} key={product._id}>
                  <Card sx={{
                    borderRadius: 4, overflow: 'hidden',
                    border: '1px solid #F3F4F6',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                    transition: 'all 0.25s ease',
                    '&:hover': { boxShadow: '0 12px 28px rgba(0,0,0,0.08)', transform: 'translateY(-3px)' },
                    position: 'relative',
                  }}>
                    {discount > 0 && (
                      <Chip
                        label={`${discount}% OFF`}
                        size="small"
                        sx={{ position: 'absolute', top: 12, left: 12, zIndex: 2, bgcolor: '#FEF3C7', color: '#92400E', fontWeight: 800, fontSize: 11 }}
                      />
                    )}
                    <Box sx={{ cursor: 'pointer', position: 'relative' }} onClick={() => navigate(`/products/${product._id}`)}>
                      <CardMedia
                        component="img"
                        height="220"
                        image={imageUrl || '/uploads/default-image.jpg'}
                        alt={product.name}
                        sx={{ objectFit: 'cover', bgcolor: '#F9FAFB' }}
                      />
                      <IconButton
                        onClick={(e) => { e.stopPropagation(); handleRemoveFromWishlist(product._id); }}
                        sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'rgba(255,255,255,0.9)', '&:hover': { bgcolor: '#FEE2E2' } }}
                        size="small"
                      >
                        <DeleteIcon sx={{ fontSize: 18, color: '#EF4444' }} />
                      </IconButton>
                    </Box>
                    <CardContent sx={{ p: 2.5 }}>
                      <Typography
                        sx={{ fontWeight: 700, fontSize: 15, mb: 0.5, cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        onClick={() => navigate(`/products/${product._id}`)}
                      >
                        {product.name}
                      </Typography>
                      {product.weight && (
                        <Typography sx={{ fontSize: 13, color: '#9CA3AF', mb: 1 }}>
                          {product.weight} {product.unit || 'kg'}
                        </Typography>
                      )}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <Typography sx={{ fontWeight: 800, fontSize: 18, color: '#16A34A' }}>
                          ₹{price.toFixed(0)}
                        </Typography>
                        {hasOffer && (
                          <Typography sx={{ fontSize: 13, color: '#9CA3AF', textDecoration: 'line-through' }}>
                            ₹{product.price.toFixed(0)}
                          </Typography>
                        )}
                      </Box>
                      <Button
                        fullWidth
                        variant="contained"
                        color="success"
                        startIcon={<ShoppingCart />}
                        onClick={(e) => { e.stopPropagation(); handleAddToCart(product._id); }}
                        sx={{ borderRadius: 3, fontWeight: 700, fontSize: 13, py: 1 }}
                      >
                        {t('addToCart')}
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}

        {recommendedProducts.length > 0 && wishlistItems?.length > 0 && (
          <Box sx={{ mt: 5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#111827' }}>
                {t('recommendedForYou') || 'You may also like'}
              </Typography>
              <Button
                variant="text"
                color="success"
                endIcon={<ArrowForward />}
                onClick={() => navigate('/products')}
                sx={{ fontWeight: 700 }}
              >
                View All
              </Button>
            </Box>
            <Grid container spacing={3}>
              {recommendedProducts.slice(0, 4).map(product => (
                <Grid item xs={12} sm={6} md={3} key={product._id}>
                  <ProductCard
                    product={{
                      name: product.name,
                      image: getImageUrl(product.images?.[0] || product.image),
                      price: product.offerPrice || product.price,
                      mrp: product.offerPrice && product.offerPrice < product.price ? product.price : undefined,
                      discount: product.offerPrice && product.offerPrice < product.price ? Math.round((1 - product.offerPrice / product.price) * 100) : 0,
                      rating: product.rating || 0,
                      numReviews: product.numReviews || 0,
                      countInStock: product.countInStock,
                    }}
                    onAddToCart={() => dispatch(addToCart(product._id, 1))}
                    onClick={() => navigate(`/products/${product._id}`)}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default WishlistPage;
