import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Card, CardContent, CardMedia, Button, IconButton, Grid } from '@mui/material';
import { Delete as DeleteIcon, ShoppingCart } from '@mui/icons-material';
import { getWishlistAction, removeFromWishlist } from '../../redux/actions/userActions';
import { addToCart } from '../../redux/actions/cartActions';
import { listProducts } from '../../redux/actions/productActions';
import Message from '../../components/common/Message';
import Wishlist from '../../components/customer/Wishlist';
import Price from '../../components/common/Price';
import { AddShoppingCart } from '@mui/icons-material';

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

  const handleBuyNow = (productId) => {
    dispatch(addToCart(productId, 1));
    navigate('/checkout');
  };

  // Recommendations: Products not in wishlist
  const wishlistIds = wishlistItems?.map(item => item._id) || [];
  const recommendedProducts = products.filter(p => !wishlistIds.includes(p._id));

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
        {t('wishlist')}
      </Typography>

      <Wishlist
        wishlistItems={wishlistItems}
        loading={loading}
        error={error}
        handleAddToCart={handleAddToCart}
        handleRemoveFromWishlist={handleRemoveFromWishlist}
        handleBuyNow={handleBuyNow}
      />

      {/* Recommendations Section */}
      {recommendedProducts.length > 0 && (
        <Box sx={{ mt: 8 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
            {t('recommendedForYou')}
          </Typography>
          <Grid container spacing={3}>
            {recommendedProducts.slice(0, 8).map(product => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={product._id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    '&:hover': { boxShadow: 4 }
                  }}
                  onClick={() => navigate(`/products/${product._id}`)}
                >
                  <CardMedia
                    component="img"
                    image={product.images?.[0] || product.image || '/uploads/default-image.jpg'}
                    alt={product.name}
                    sx={{ height: 200, objectFit: 'contain', backgroundColor: '#f5f5f5', p: 2 }}
                  />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle1" noWrap sx={{ fontWeight: 'medium' }}>
                      {product.name}
                    </Typography>
                    <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold', my: 1 }}>
                      <Price amount={product.price} />
                    </Typography>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<AddShoppingCart />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(product._id);
                      }}
                    >
                      {t('addToCart')}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Container>
  );
};

export default WishlistPage;