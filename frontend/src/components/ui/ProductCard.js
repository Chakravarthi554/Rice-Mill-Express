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
    countInStock = 0,
    discount,
    brand = 'Rice Mill Express',
    deliveryEta = '18 mins',
  } = product || {};

  const outOfStock = Number(countInStock) <= 0;
  const displayRating = Number(rating) > 0 ? Number(rating).toFixed(1) : '4.5';
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
            <Chip icon={<Star sx={{ fontSize: '14px !important' }} />} label={displayRating} size="small" sx={{ bgcolor: '#E8F5E9', color: '#1B5E20', fontWeight: 950, height: 24 }} />
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
      whileHover={{ y: -8 }}
      transition={{ duration: 0.2 }}
      onClick={() => onClick && onClick(product)}
      sx={{
        position: 'relative', height: 374, bgcolor: '#fff', borderRadius: 5, border: '1px solid #E8EFE2',
        boxShadow: '0 12px 32px rgba(15, 23, 42, 0.06)', overflow: 'hidden', cursor: onClick ? 'pointer' : 'default',
        display: 'flex', flexDirection: 'column', '&:hover img': { transform: 'scale(1.07)' },
      }}
    >
      <Box sx={{ height: 184, position: 'relative' }}>
        {imageNode}
        <Stack direction="row" spacing={0.75} sx={{ position: 'absolute', top: 12, left: 12 }}>
          <Chip icon={<Star sx={{ fontSize: '14px !important' }} />} label={displayRating} size="small" sx={{ bgcolor: '#2E7D32', color: '#fff', fontWeight: 950, height: 26 }} />
          {!!discount && <Chip label={`${discount}% OFF`} size="small" sx={{ bgcolor: '#FFB300', color: '#111827', fontWeight: 950, height: 26 }} />}
        </Stack>
        <Stack spacing={0.75} sx={{ position: 'absolute', top: 10, right: 10 }}>
          <Tooltip title={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}>
            <IconButton size="small" onClick={stop(onToggleWishlist)} sx={{ bgcolor: 'rgba(255,255,255,0.94)', boxShadow: '0 6px 16px rgba(15,23,42,0.10)', '&:hover': { bgcolor: '#fff' } }}>
              {wishlisted ? <Favorite sx={{ color: '#DC2626', fontSize: 18 }} /> : <FavoriteBorder sx={{ color: '#4B5563', fontSize: 18 }} />}
            </IconButton>
          </Tooltip>
          {onQuickView && (
            <Tooltip title="Quick view">
              <IconButton size="small" onClick={stop(onQuickView)} sx={{ bgcolor: 'rgba(255,255,255,0.94)', boxShadow: '0 6px 16px rgba(15,23,42,0.10)' }}><VisibilityOutlined sx={{ fontSize: 18 }} /></IconButton>
            </Tooltip>
          )}
        </Stack>
      </Box>

      <Stack sx={{ p: 2, flex: 1 }}>
        <Typography sx={{ color: '#6B7280', fontSize: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }} noWrap>{brand}</Typography>
        <Typography sx={{ mt: 0.75, color: '#111827', fontSize: 16, fontWeight: 950, lineHeight: 1.25, minHeight: 42, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{name}</Typography>
        <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mt: 1.25 }}>
          <LocalShipping sx={{ fontSize: 17, color: '#2E7D32' }} />
          <Typography sx={{ color: '#2E7D32', fontSize: 12.5, fontWeight: 900 }}>Delivery in {deliveryEta}</Typography>
        </Stack>
        <Stack direction="row" alignItems="flex-end" spacing={1} sx={{ mt: 'auto', mb: 1.5 }}>
          <Typography sx={{ color: '#111827', fontSize: 23, fontWeight: 950, letterSpacing: '-0.03em' }}>₹{price}</Typography>
          {mrp && <Typography sx={{ color: '#9CA3AF', textDecoration: 'line-through', fontWeight: 800, mb: 0.35 }}>₹{mrp}</Typography>}
        </Stack>
        <Button fullWidth variant="contained" disabled={outOfStock} onClick={stop(onAddToCart)} sx={{ py: 1.05, bgcolor: '#2E7D32', borderRadius: 999, fontWeight: 950, textTransform: 'none', boxShadow: '0 10px 20px rgba(46,125,50,0.18)', '&:hover': { bgcolor: '#1B5E20' } }}>
          {outOfStock ? 'Notify me' : '+ Add to cart'}
        </Button>
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
