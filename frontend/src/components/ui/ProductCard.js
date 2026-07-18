import React from 'react';
import PropTypes from 'prop-types';
import { Box, Button, Chip, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import { Favorite, FavoriteBorder, LocalShipping, Star, VisibilityOutlined } from '@mui/icons-material';
import { motion } from 'framer-motion';

const MotionBox = motion(Box);

const ProductCard = ({
  product,
  wishlisted = false,
  onAddToCart,
  onToggleWishlist,
  onQuickView,
  onClick,
  layout = 'vertical',
}) => {
  const {
    name,
    image,
    price,
    mrp,
    rating = 0,
    numReviews = 0,
    countInStock = 0,
    discount,
    brand = 'Rice Mill Express',
    deliveryEta = '18 mins',
  } = product || {};

  const outOfStock = Number(countInStock) <= 0;
  const displayRating = Number(rating) > 0 ? Number(rating).toFixed(1) : null;
  const stop = (fn) => (event) => {
    event.stopPropagation();
    fn && fn(product);
  };

  const imageNode = (
    <Box sx={{ position: 'relative', width: '100%', height: '100%', display: 'grid', placeItems: 'center', bgcolor: '#F8FBF4', overflow: 'hidden' }}>
      {image ? (
        <Box component="img" src={image} alt={name} loading="lazy" sx={{ width: '88%', height: '88%', objectFit: 'contain', transition: 'transform 0.35s ease' }} />
      ) : (
        <Typography sx={{ fontSize: 46 }}>🌾</Typography>
      )}
      {outOfStock && (
        <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(255,255,255,0.72)', display: 'grid', placeItems: 'center' }}>
          <Chip label="Out of stock" sx={{ bgcolor: '#111827', color: '#fff', fontWeight: 900 }} />
        </Box>
      )}
    </Box>
  );

  if (layout === 'horizontal') {
    return (
      <MotionBox
        whileHover={{ y: -5 }}
        transition={{ duration: 0.18 }}
        onClick={() => onClick && onClick(product)}
        sx={{
          display: 'grid', gridTemplateColumns: '126px 1fr', gap: 2, height: 178, p: 1.35,
          bgcolor: '#fff', borderRadius: 5, border: '1px solid #E8EFE2', cursor: onClick ? 'pointer' : 'default',
          boxShadow: '0 12px 30px rgba(15, 23, 42, 0.06)', overflow: 'hidden',
          '&:hover img': { transform: 'scale(1.07)' },
        }}
      >
        <Box sx={{ borderRadius: 4, overflow: 'hidden' }}>{imageNode}</Box>
        <Stack sx={{ minWidth: 0, py: 0.5 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
            <Typography sx={{ color: '#6B7280', fontSize: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }} noWrap>{brand}</Typography>
            {!!discount && <Chip label={`${discount}% OFF`} size="small" sx={{ bgcolor: '#FFF7ED', color: '#C2410C', fontWeight: 950, height: 24 }} />}
          </Stack>
          <Typography sx={{ mt: 0.75, color: '#111827', fontSize: 15, fontWeight: 950, lineHeight: 1.22, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{name}</Typography>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ my: 1 }}>
            {displayRating && (
              <Chip icon={<Star sx={{ fontSize: '14px !important' }} />} label={displayRating} size="small" sx={{ bgcolor: '#E8F5E9', color: '#1B5E20', fontWeight: 950, height: 24 }} />
            )}
            {numReviews > 0 && (
              <Typography sx={{ color: '#6B7280', fontSize: 12, fontWeight: 800 }}>{numReviews.toLocaleString()} reviews</Typography>
            )}
            <Typography sx={{ color: '#6B7280', fontSize: 12, fontWeight: 800 }}>{deliveryEta}</Typography>
          </Stack>
          <Stack direction="row" alignItems="flex-end" spacing={1} sx={{ mt: 'auto' }}>
            <Typography sx={{ color: '#111827', fontSize: 20, fontWeight: 950 }}>₹{price}</Typography>
            {mrp && <Typography sx={{ color: '#9CA3AF', textDecoration: 'line-through', fontWeight: 800, mb: 0.25 }}>₹{mrp}</Typography>}
            <Button size="small" variant="contained" disabled={outOfStock} onClick={stop(onAddToCart)} sx={{ ml: 'auto !important', bgcolor: '#2E7D32', borderRadius: 999, px: 2.5, fontWeight: 950, textTransform: 'none', '&:hover': { bgcolor: '#1B5E20' } }}>Add</Button>
          </Stack>
        </Stack>
      </MotionBox>
    );
  }

  return (
    <MotionBox
      whileHover={{ y: -6 }}
      transition={{ duration: 0.15 }}
      onClick={() => onClick && onClick(product)}
      sx={{
        position: 'relative', height: 380, bgcolor: '#fff', borderRadius: '12px', border: '1px solid #E5E7EB',
        overflow: 'hidden', cursor: onClick ? 'pointer' : 'default',
        display: 'flex', flexDirection: 'column', '&:hover img': { transform: 'scale(1.05)' },
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)'
      }}
    >
      {/* Image Container */}
      <Box sx={{ height: 160, position: 'relative', bgcolor: '#F9FAFB', p: 1 }}>
        {imageNode}
        
        {/* Wishlist Button */}
        <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
          <Tooltip title={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}>
            <IconButton size="small" onClick={stop(onToggleWishlist)} sx={{ bgcolor: 'rgba(255,255,255,0.9)', boxShadow: '0 4px 8px rgba(0,0,0,0.08)', '&:hover': { bgcolor: '#fff' } }}>
              {wishlisted ? <Favorite sx={{ color: '#FF3F6C', fontSize: 16 }} /> : <FavoriteBorder sx={{ color: '#4B5563', fontSize: 16 }} />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Details Container */}
      <Stack sx={{ p: 2, flex: 1, justifyContent: 'space-between' }}>
        <Box>
          {/* Brand & Weight */}
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography sx={{ color: '#6B7280', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase' }} noWrap>
              {brand}
            </Typography>
            <Typography sx={{ color: '#6B7280', fontSize: '0.72rem', fontWeight: 800 }}>
              {product.weight ? `${product.weight} ${product.unit || 'kg'}` : '1 pack'}
            </Typography>
          </Stack>

          {/* Product Name */}
          <Typography sx={{ mt: 0.75, color: '#1F2937', fontSize: '0.92rem', fontWeight: 800, lineHeight: 1.25, height: 38, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {name}
          </Typography>

          {/* Rating */}
          <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 1 }}>
            <Star sx={{ fontSize: 15, color: '#FFB300' }} />
            <Typography sx={{ fontSize: '0.78rem', fontWeight: 800, color: '#1F2937' }}>
              {displayRating || '4.5'}
            </Typography>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 650, color: '#9CA3AF' }}>
              ({numReviews > 0 ? `${(numReviews / 1000).toFixed(1)}k` : '1.2k'})
            </Typography>
          </Stack>
        </Box>

        {/* Pricing & Add Button Footer */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 2 }}>
          <Box>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography sx={{ color: '#111827', fontSize: '1.2rem', fontWeight: 900 }}>
                ₹{price}
              </Typography>
              {mrp && (
                <Typography sx={{ color: '#9CA3AF', textDecoration: 'line-through', fontWeight: 700, fontSize: '0.85rem' }}>
                  ₹{mrp}
                </Typography>
              )}
            </Stack>
            {!!discount && (
              <Typography sx={{ color: '#16A34A', fontSize: '0.72rem', fontWeight: 900, mt: 0.25 }}>
                {discount}% OFF
              </Typography>
            )}
          </Box>

          <Button
            variant="outlined"
            disabled={outOfStock}
            onClick={stop(onAddToCart)}
            sx={{
              borderColor: '#FF3F6C',
              color: '#FF3F6C',
              bgcolor: '#fff',
              borderRadius: '8px',
              px: 2.25,
              py: 0.5,
              fontWeight: 900,
              textTransform: 'uppercase',
              fontSize: '0.8rem',
              '&:hover': {
                borderColor: '#E11D48',
                bgcolor: '#FFF5F5'
              },
              '&.Mui-disabled': {
                borderColor: '#E5E7EB',
                color: '#9CA3AF'
              }
            }}
          >
            {outOfStock ? 'OOS' : 'ADD'}
          </Button>
        </Stack>
      </Stack>
    </MotionBox>
  );
};

ProductCard.propTypes = {
  product: PropTypes.object.isRequired,
  wishlisted: PropTypes.bool,
  onAddToCart: PropTypes.func,
  onToggleWishlist: PropTypes.func,
  onQuickView: PropTypes.func,
  onClick: PropTypes.func,
  layout: PropTypes.string,
};

export default ProductCard;
