import React from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, IconButton, Button, Tooltip } from '@mui/material';
import {
  FavoriteBorder,
  Favorite,
  VisibilityOutlined,
  Star,
  CheckCircleOutline
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import PriceDisplay from './PriceDisplay';
import DiscountBadge from './DiscountBadge';

const MotionBox = motion(Box);

const ProductCard = ({
  product,
  wishlisted = false,
  onAddToCart,
  onToggleWishlist,
  onQuickView,
  onClick,
  layout = 'vertical' // 'vertical' or 'horizontal'
}) => {
  const {
    name, image, price, mrp, rating = 0, countInStock = 0, discount, brand = 'Fresh Grain',
  } = product || {};

  const outOfStock = Number(countInStock) <= 0;
  const stop = (fn) => (e) => { e.stopPropagation(); fn && fn(product); };

  const displayRating = rating > 0 ? rating : (4.0 + (name?.length % 10) / 10).toFixed(1);

  // ── HORIZONTAL LAYOUT (Flash Sale, Buy Again) ──
  if (layout === 'horizontal') {
    return (
      <MotionBox
        whileHover={{ y: -2, boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}
        onClick={() => onClick && onClick(product)}
        sx={{
          display: 'flex',
          bgcolor: '#fff',
          borderRadius: '12px',
          border: '1px solid #F3F4F6',
          p: 1.5,
          gap: 1.5,
          cursor: onClick ? 'pointer' : 'default',
          alignItems: 'center',
          height: 130,
          width: '100%'
        }}
      >
        {/* Left Product Image */}
        <Box sx={{ width: 80, height: 80, borderRadius: '8px', overflow: 'hidden', bgcolor: '#F9FAFB', flexShrink: 0, position: 'relative' }}>
          {image ? (
            <img src={image} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#F0FDF4', fontSize: 28 }}>
              🌾
            </Box>
          )}
          {outOfStock && (
            <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography sx={{ fontSize: '0.6rem', fontWeight: 800, bgcolor: '#1F2937', color: '#fff', px: 0.5, py: 0.2, borderRadius: 1 }}>OUT</Typography>
            </Box>
          )}
        </Box>

        {/* Right Product Details */}
        <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
          <Box>
            <Typography sx={{ 
              fontSize: '0.85rem', fontWeight: 700, color: '#1F2937', lineHeight: 1.2,
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
            }}>
              {name}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 800, color: '#1F2937' }}>₹{price}</Typography>
              {mrp && <Typography sx={{ fontSize: '0.72rem', color: '#9CA3AF', textDecoration: 'line-through' }}>₹{mrp}</Typography>}
              {discount > 0 && <Typography sx={{ fontSize: '0.72rem', color: '#E65100', fontWeight: 700 }}>{discount}% OFF</Typography>}
            </Box>
          </Box>
          
          <Button 
            variant="contained" 
            size="small" 
            onClick={stop(onAddToCart)}
            disabled={outOfStock}
            sx={{ 
              bgcolor: '#2E7D32', color: '#fff', '&:hover': { bgcolor: '#1B5E20' },
              borderRadius: '6px', fontWeight: 800, textTransform: 'none', height: 28, fontSize: '0.75rem', px: 2, alignSelf: 'flex-start'
            }}
          >
            + Add
          </Button>
        </Box>
      </MotionBox>
    );
  }

  // ── VERTICAL LAYOUT (Recommended For You) ──
  return (
    <MotionBox
      whileHover={{ y: -4, boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}
      transition={{ duration: 0.2 }}
      onClick={() => onClick && onClick(product)}
      sx={{
        position: 'relative',
        bgcolor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #F3F4F6',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        display: 'flex',
        flexDirection: 'column',
        height: 290,
        width: '100%'
      }}
    >
      {/* Product Image */}
      <Box sx={{ position: 'relative', height: 140, bgcolor: '#F9FAFB', overflow: 'hidden' }}>
        {image ? (
          <Box
            component="img" src={image} alt={name} loading="lazy"
            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#F0FDF4', fontSize: 32 }}>
            🌾
          </Box>
        )}

        {/* Rating Badge (Top-left Green Badge) */}
        <Box sx={{ 
          position: 'absolute', top: 8, left: 8, 
          bgcolor: '#2E7D32', 
          borderRadius: '4px', px: 0.75, py: 0.25, 
          display: 'flex', alignItems: 'center', gap: 0.25,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <Star sx={{ fontSize: 11, color: '#fff' }} />
          <Typography sx={{ fontSize: '0.68rem', fontWeight: 800, color: '#fff' }}>
            {displayRating}
          </Typography>
        </Box>

        {/* Wishlist Button */}
        <IconButton
          size="small"
          onClick={stop(onToggleWishlist)}
          sx={{ 
            position: 'absolute', top: 6, right: 6, 
            width: 28, height: 28,
            bgcolor: 'rgba(255,255,255,0.92)', 
            boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
            '&:hover': { bgcolor: '#fff' } 
          }}
        >
          {wishlisted ? <Favorite sx={{ fontSize: 14, color: '#DC2626' }} /> : <FavoriteBorder sx={{ fontSize: 14, color: '#6B7280' }} />}
        </IconButton>

        {outOfStock && (
          <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Box sx={{ bgcolor: '#1F2937', color: '#fff', px: 1.5, py: 0.5, borderRadius: '50px', fontSize: '0.7rem', fontWeight: 700 }}>
              Out of Stock
            </Box>
          </Box>
        )}
      </Box>

      {/* Product Content (Image 1 style) */}
      <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 0.5, flex: 1 }}>
        {/* Name */}
        <Typography sx={{ 
          fontSize: '0.85rem', fontWeight: 700, color: '#1F2937', lineHeight: 1.25,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', 
          overflow: 'hidden', minHeight: '2.5em'
        }}>
          {name}
        </Typography>

        {/* Price Display */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
          <Typography sx={{ fontSize: '0.9rem', fontWeight: 800, color: '#1F2937' }}>₹{price}</Typography>
          {mrp && <Typography sx={{ fontSize: '0.72rem', color: '#9CA3AF', textDecoration: 'line-through' }}>₹{mrp}</Typography>}
        </Box>

        {/* Cash on Delivery Badge */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5, bgcolor: '#F0FDF4', px: 1, py: 0.25, borderRadius: '4px', alignSelf: 'flex-start' }}>
          <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: '#16A34A' }} />
          <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: '#16A34A' }}>✓ Cash on Delivery</Typography>
        </Box>

        {/* Action Button */}
        <Button
          fullWidth
          variant="contained"
          disabled={outOfStock}
          onClick={stop(onAddToCart)}
          sx={{ 
            mt: 'auto', py: 0.6, bgcolor: '#2E7D32', color: '#fff',
            '&:hover': { bgcolor: '#1B5E20' }, borderRadius: '6px', fontWeight: 800, fontSize: '0.8rem', textTransform: 'none'
          }}
        >
          + Add
        </Button>
      </Box>
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
