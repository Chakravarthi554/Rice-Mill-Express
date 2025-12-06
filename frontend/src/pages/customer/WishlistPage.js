import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Card, CardContent, CardMedia, Button, IconButton } from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { getWishlistAction, removeFromWishlist } from '../../redux/actions/userActions'; // FIXED: Use renamed action
import { addToCart } from '../../redux/actions/cartActions';
import Message from '../../components/common/Message';
const WishlistPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { wishlistItems, loading, error } = useSelector((state) => state.userWishlist || { wishlistItems: [], loading: false, error: null });
  useEffect(() => {
    dispatch(getWishlistAction()); // FIXED: Use updated action
  }, [dispatch]);
  const handleRemoveFromWishlist = (id) => {
    dispatch(removeFromWishlist(id));
  };
  const handleAddToCart = (productId) => {
    dispatch(addToCart(productId, 1));
    navigate('/cart');
  };
  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Wishlist
      </Typography>
      {loading ? (
        <Message severity="info">Loading...</Message>
      ) : error ? (
        <Message severity="error">{error}</Message>
      ) : !Array.isArray(wishlistItems) || wishlistItems.length === 0 ? (
        <Message severity="info">Your wishlist is empty.</Message>
      ) : (
        wishlistItems.map((item) => (
          <Card key={item._id} sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
            <CardMedia
              component="img"
              // FIXED: Use images[0] for populated product
              image={item.images?.[0] || '/uploads/default-image.jpg'}
              alt={item.name}
              sx={{ width: 100, height: 100, objectFit: 'cover', m: 2 }}
            />
            <CardContent sx={{ flexGrow: 1 }}>
              <Typography variant="h6">{item.name || 'Unnamed Product'}</Typography>
              <Typography variant="body2" color="text.secondary">
                ₹{item.price || 0}
              </Typography>
            </CardContent>
            <IconButton onClick={() => handleRemoveFromWishlist(item._id)} sx={{ m: 2 }}>
              <DeleteIcon />
            </IconButton>
            <Button
              variant="contained"
              onClick={() => handleAddToCart(item._id)}
              sx={{ m: 2 }}
            >
              Add to Cart
            </Button>
          </Card>
        ))
      )}
    </Container>
  );
};
export default WishlistPage;