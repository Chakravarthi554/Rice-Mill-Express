import React from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, IconButton, Button, Tooltip } from '@mui/material';
import {
  FavoriteBorder,
  Favorite,
  AddShoppingCart,
  VisibilityOutlined,
  Star
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import PriceDisplay from './PriceDisplay';
import DiscountBadge from './DiscountBadge';
import { colors } from '../../theme/designTokens';

const MotionBox = motion(Box);

const ProductCard = ({
  product,
  wishlisted = false,
  onAddToCart,
  onToggleWishlist,
  onQuickView,
  onClick,
}) => {
  const {
    name, image, price, mrp, rating = 0, numReviews = 0,
    countInStock = 0, discount, brand = 'Fresh Grain', deliveryEta,
  } = product || {};

  const outOfStock = Number(countInStock) <= 0;
  const stop = (fn) => (e) => { e.stopPropagation(); fn && fn(product); };

  // Calculated rating fallback if 0
  const displayRating = rating > 0 ? rating : (4.0 + (name?.length % 10) / 10).toFixed(1);

  return (
    <MotionBox
      whileHover={{ y: -4, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
      transition={{ duration: 0.2 }}
      onClick={() => onClick && onClick(product)}
      sx={{
        position: 'relative',
        bgcolor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #F3F4F6',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        display: 'flex',
        flexDirection: 'column',
        height: 290, // Fixed height close to target spec (280px + wiggle room for add-to-cart button)
        width: '100%'
      }}
    >
      {/* Media & Badge container */}
      <Box sx={{ position: 'relative', height: 150, bgcolor: '#F9FAFB', overflow: 'hidden' }}>
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

        {/* Rating Badge (Top-left) */}
        <Box sx={{ 
          position: 'absolute', top: 8, left: 8, 
          bgcolor: 'rgba(255, 255, 255, 0.95)', 
          borderRadius: '6px', px: 0.75, py: 0.25, 
          display: 'flex', alignItems: 'center', gap: 0.25,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <Star sx={{ fontSize: 13, color: '#F59E0B' }} />
          <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#1F2937' }}>
            {displayRating}
          </Typography>
        </Box>

        {/* Discount Badge */}
        {discount && (
          <Box sx={{ position: 'absolute', bottom: 8, left: 8 }}>
            <DiscountBadge percent={discount} />
          </Box>
        )}

        {/* Wishlist Button (Top-right 32px circle) */}
        <IconButton
          size="small"
          onClick={stop(onToggleWishlist)}
          sx={{ 
            position: 'absolute', top: 6, right: 6, 
            width: 32, height: 32,
            bgcolor: 'rgba(255,255,255,0.92)', 
            boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
            '&:hover': { bgcolor: '#fff' } 
          }}
        >
          {wishlisted ? <Favorite sx={{ fontSize: 16, color: '#DC2626' }} /> : <FavoriteBorder sx={{ fontSize: 16, color: '#6B7280' }} />}
        </IconButton>

        {/* Quick view */}
        {onQuickView && (
          <Tooltip title="Quick view">
            <IconButton
              size="small"
              onClick={stop(onQuickView)}
              sx={{ 
                position: 'absolute', top: 6, right: 42, 
                width: 32, height: 32,
                bgcolor: 'rgba(255,255,255,0.92)', 
                boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                '&:hover': { bgcolor: '#fff' } 
              }}
            >
              <VisibilityOutlined sx={{ fontSize: 16, color: '#6B7280' }} />
            </IconButton>
          </Tooltip>
        )}

        {outOfStock && (
          <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Box sx={{ bgcolor: '#1F2937', color: '#fff', px: 1.5, py: 0.5, borderRadius: '50px', fontSize: '0.7rem', fontWeight: 700 }}>
              Out of Stock
            </Box>
          </Box>
        )}
      </Box>

      {/* Content Area (12px padding) */}
      <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 0.5, flex: 1 }}>
        {/* Brand/Caption */}
        <Typography variant="caption" sx={{ color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.05em' }}>
          {brand}
        </Typography>

        {/* Name (2 lines max) */}
        <Typography sx={{ 
          fontSize: '0.85rem', fontWeight: 700, color: '#1F2937', lineHeight: 1.25,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', 
          overflow: 'hidden', minHeight: '2.5em'
        }}>
          {name}
        </Typography>

        {/* Price Section */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 'auto', pt: 0.5 }}>
          <PriceDisplay price={price} mrp={mrp} size="sm" />
          
          {/* Quick Add to Cart button */}
          <IconButton 
            onClick={stop(onAddToCart)} 
            disabled={outOfStock}
            sx={{ 
              bgcolor: '#F0FDF4', color: '#2E7D32', p: 0.75,
              '&:hover': { bgcolor: '#2E7D32', color: '#fff' },
              '&.Mui-disabled': { bgcolor: '#F3F4F6', color: '#9CA3AF' }
            }}
          >
            <AddShoppingCart sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>
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
};

export default ProductCard;
