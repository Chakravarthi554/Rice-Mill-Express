import React, { useEffect } from 'react';
import { Grid, Typography, Button, Card, CardMedia, CardContent, Box, IconButton } from '@mui/material';
import { Delete as DeleteIcon, ShoppingCart } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Loader from '../common/Loader';
import Price from '../common/Price';

const Wishlist = ({ loadingBuy, handleAddToCart, handleRemoveFromWishlist, handleBuyNow }) => {
  const navigate = useNavigate();
  const { wishlistItems = [], loading, error } = useSelector((state) => state.userWishlist || {});

  useEffect(() => {
    console.log('🔍 Wishlist Component - State:', { wishlistItems, loading, error });
    console.log('🔍 Wishlist Items:', wishlistItems);
  }, [wishlistItems, loading, error]);

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Loader />
        <Typography variant="body1" sx={{ mt: 2 }}>Loading wishlist...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <div>
      <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
        My Wishlist
      </Typography>

      {wishlistItems.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Your wishlist is empty
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Add products to your wishlist by clicking the heart icon
          </Typography>
          <Button variant="contained" onClick={() => navigate('/')}>
            Start Shopping
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {wishlistItems.map((item) => {
            console.log('📦 Rendering wishlist item:', item);
            const hasOffer =
              typeof item.offerPrice === 'number' &&
              item.offerPrice > 0 &&
              item.offerPrice < item.price;
            const displayPrice = hasOffer ? item.offerPrice : item.price;

            return (
              <Grid item xs={12} sm={6} md={4} lg={3} key={item._id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    '&:hover': { boxShadow: 4 },
                    position: 'relative'
                  }}
                >
                  <Box
                    sx={{
                      position: 'relative',
                      paddingTop: '100%',
                      backgroundColor: '#f5f5f5',
                      cursor: 'pointer'
                    }}
                    onClick={() => navigate(`/product/${item._id}`)}
                  >
                    <CardMedia
                      component="img"
                      image={item.images?.[0] || item.image || '/uploads/default-image.jpg'}
                      alt={item.name || 'Product'}
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        p: 2
                      }}
                    />
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFromWishlist(item._id);
                      }}
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        backgroundColor: 'white',
                        '&:hover': { backgroundColor: '#f5f5f5' }
                      }}
                    >
                      <DeleteIcon color="error" />
                    </IconButton>
                  </Box>

                  <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontWeight: 'medium',
                        mb: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        minHeight: '3em'
                      }}
                    >
                      {item.name}
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                        <Price amount={displayPrice || 0} />
                      </Typography>
                      {hasOffer && (
                        <Typography variant="body2" sx={{ textDecoration: 'line-through', color: 'text.secondary' }}>
                          <Price amount={item.price || 0} />
                        </Typography>
                      )}
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        ★ {item.rating || 0} ({item.numReviews || 0} reviews)
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1, mt: 'auto' }}>
                      <Button
                        fullWidth
                        variant="contained"
                        size="small"
                        startIcon={<ShoppingCart />}
                        onClick={() => handleAddToCart(item._id)}
                        sx={{ backgroundColor: '#4CAF50', '&:hover': { backgroundColor: '#45A049' } }}
                      >
                        Add to Cart
                      </Button>
                      <Button
                        fullWidth
                        variant="contained"
                        color="secondary"
                        size="small"
                        onClick={() => handleBuyNow(item._id)}
                        disabled={loadingBuy}
                      >
                        {loadingBuy ? <Loader size={20} /> : 'Buy Now'}
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </div>
  );
};

export default Wishlist;