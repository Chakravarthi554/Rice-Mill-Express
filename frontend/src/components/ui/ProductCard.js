// ProductCard — premium ecommerce product card (Zepto/BigBasket-grade).
// Composes PriceDisplay, DiscountBadge, SellerBadge. Pure presentation:
// all actions are passed in via props so business logic stays in the parent.
import React from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, IconButton, Button, Rating as MuiRating, Tooltip } from '@mui/material';
import {
  FavoriteBorder,
  Favorite,
  AddShoppingCart,
  VisibilityOutlined,
  LocalShippingOutlined,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import PriceDisplay from './PriceDisplay';
import DiscountBadge from './DiscountBadge';
import SellerBadge from './SellerBadge';
import { radius, shadows, colors } from '../../theme/designTokens';
import { tap } from '../../theme/animations';

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
    countInStock = 0, discount, deliveryEta, seller, sellerVerified, bestSeller,
  } = product || {};

  const outOfStock = Number(countInStock) <= 0;
  const lowStock = !outOfStock && Number(countInStock) <= 5;
  const stop = (fn) => (e) => { e.stopPropagation(); fn && fn(product); };

  return (
    <MotionBox
      whileHover={{ y: -6, boxShadow: shadows.xl }}
      transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      onClick={() => onClick && onClick(product)}
      role="group"
      aria-label={name}
      sx={{
        position: 'relative', bgcolor: 'background.paper', borderRadius: `${radius.lg}px`,
        border: '1px solid', borderColor: 'divider', overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default', display: 'flex', flexDirection: 'column', height: '100%',
      }}
    >
      {/* Media */}
      <Box sx={{ position: 'relative', pt: '92%', bgcolor: '#F9FAFB', overflow: 'hidden' }}>
        {image ? (
          <Box
            component="img" src={image} alt={name} loading="lazy"
            sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44 }}>█🍚</Box>
        )}

        {/* Top-left badges */}
        <Box sx={{ position: 'absolute', top: 8, left: 8, display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'flex-start' }}>
          {discount ? <DiscountBadge percent={discount} /> : null}
          {bestSeller && (
            <Box component="span" sx={{ bgcolor: colors.primary.main, color: '#fff', fontSize: '0.62rem', fontWeight: 800, px: 0.8, py: 0.3, borderRadius: `${radius.xs}px` }}>
              BESTSELLER
            </Box>
          )}
        </Box>

        {/* Wishlist */}
        <IconButton
          size="small"
          onClick={stop(onToggleWishlist)}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          sx={{ position: 'absolute', top: 6, right: 6, bgcolor: 'rgba(255,255,255,0.92)', '&:hover': { bgcolor: '#fff' } }}
        >
          {wishlisted ? <Favorite sx={{ fontSize: 18, color: colors.error }} /> : <FavoriteBorder sx={{ fontSize: 18 }} />}
        </IconButton>

        {/* Quick view */}
        {onQuickView && (
          <Tooltip title="Quick view">
            <IconButton
              size="small"
              onClick={stop(onQuickView)}
              aria-label="Quick view"
              sx={{ position: 'absolute', bottom: 6, right: 6, bgcolor: 'rgba(255,255,255,0.92)', '&:hover': { bgcolor: '#fff' } }}
            >
              <VisibilityOutlined sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        )}

        {outOfStock && (
          <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Box component="span" sx={{ bgcolor: '#1F2937', color: '#fff', px: 1.5, py: 0.5, borderRadius: `${radius.pill}px`, fontSize: '0.72rem', fontWeight: 700 }}>
              Out of Stock
            </Box>
          </Box>
        )}
      </Box>

      {/* Body */}
      <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 0.75, flex: 1 }}>
        {seller && <SellerBadge seller={seller} verified={sellerVerified} />}
        <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '2.3em' }}>
          {name}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <MuiRating value={Number(rating)} precision={0.5} size="small" readOnly />
          <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary' }}>({numReviews})</Typography>
        </Box>

        {deliveryEta && !outOfStock && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: colors.success }}>
            <LocalShippingOutlined sx={{ fontSize: 14 }} />
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 600 }}>{deliveryEta}</Typography>
          </Box>
        )}

        {lowStock && (
          <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: colors.accent.dark }}>
            Only {countInStock} left
          </Typography>
        )}

        <Box sx={{ mt: 'auto', pt: 0.5 }}>
          <PriceDisplay price={price} mrp={mrp} size="sm" />
        </Box>

        <Button
          component={motion.button}
          whileTap={tap}
          fullWidth
          variant="contained"
          color="primary"
          startIcon={<AddShoppingCart sx={{ fontSize: 18 }} />}
          disabled={outOfStock}
          onClick={stop(onAddToCart)}
          sx={{ mt: 0.5, py: 0.75, fontSize: '0.8rem' }}
        >
          {outOfStock ? 'Unavailable' : 'Add to Cart'}
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
};

export default ProductCard;
