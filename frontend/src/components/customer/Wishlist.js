import React from 'react';
import { Grid, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Loader from '../common/Loader';
const Wishlist = ({ loadingBuy, handleAddToCart, handleRemoveFromWishlist, handleBuyNow, handleImageLoad, handleImageError, setSelectedSeller, setChatOpen }) => {
  const navigate = useNavigate();
  const { wishlistItems = [] } = useSelector((state) => state.userWishlist || {});
  return (
    <div>
      <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
        My Wishlist
      </Typography>
      <Grid container spacing={3}>
        {wishlistItems.length === 0 ? (
          <Typography variant="body1" sx={{ px: 2 }}>
            Your wishlist is empty.
          </Typography>
        ) : (
          wishlistItems.map((item) => {
            const hasOffer =
              typeof item.offerPrice === 'number' &&
              item.offerPrice > 0 &&
              item.offerPrice < item.price;
            const displayPrice = hasOffer ? item.offerPrice : item.price;
            const isImageLoading = true; // Placeholder for image loading state
            return (
              <Grid item key={item._id} sx={{ width: { xs: '100%', sm: '50%', md: '33.33%', lg: '25%' } }}>
                <div style={{ p: 1 }}>
                  {isImageLoading ? (
                    <div style={{ height: 180, backgroundColor: '#f0f0f0' }} />
                  ) : (
                    // FIXED: Use images[0] for populated product
                    <img
                      src={item.images?.[0] || '/uploads/default-image.jpg'}
                      alt={item.name}
                      style={{ height: 180, width: '100%', objectFit: 'cover', borderRadius: 2 }}
                      onLoad={() => handleImageLoad(item._id)}
                      onError={() => handleImageError(item._id)}
                    />
                  )}
                  <div>
                    <Typography variant="h6" noWrap>{item.name}</Typography>
                    <div style={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        ₹{(displayPrice || 0).toFixed(2)}
                      </Typography>
                      {hasOffer && (
                        <Typography variant="body2" style={{ textDecoration: 'line-through', color: '#757575' }}>
                          ₹{(item.price || 0).toFixed(2)}
                        </Typography>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <span role="img" aria-label="star">★</span>
                      <Typography variant="body2" style={{ ml: 0.5 }}>
                        {item.rating || 0} ({item.numReviews || 0})
                      </Typography>
                    </div>
                    <div style={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => handleAddToCart(item._id)}
                        style={{ mr: 1, backgroundColor: '#4CAF50', '&:hover': { backgroundColor: '#45A049' } }}
                      >
                        Add to Cart
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={() => handleRemoveFromWishlist(item._id)}
                        style={{ color: '#F44336', borderColor: '#F44336', '&:hover': { borderColor: '#D32F2F', color: '#D32F2F' } }}
                      >
                        Remove
                      </Button>
                      <Button
                        variant="contained"
                        color="secondary"
                        size="small"
                        onClick={() => handleBuyNow(item._id)}
                        disabled={loadingBuy}
                        style={{ backgroundColor: '#8BC34A', '&:hover': { backgroundColor: '#7CB342' } }}
                      >
                        {loadingBuy ? <Loader size={20} /> : 'Buy Now'}
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => {
                          setSelectedSeller(item.seller?._id || null);
                          setChatOpen(true);
                        }}
                        style={{ mt: 1, color: '#4CAF50', borderColor: '#4CAF50', '&:hover': { borderColor: '#45A049', color: '#45A049' } }}
                        disabled={!item.seller?._id}
                      >
                        Chat Seller
                      </Button>
                    </div>
                  </div>
                </div>
              </Grid>
            );
          })
        )}
      </Grid>
    </div>
  );
};
export default Wishlist;