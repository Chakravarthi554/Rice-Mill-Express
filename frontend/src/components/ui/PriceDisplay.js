// PriceDisplay — premium price block with MRP strike-through + discount.
// Composes the existing currency-aware Price primitive (no duplication).
import React from 'react';
import PropTypes from 'prop-types';
import { Box, Typography } from '@mui/material';
import Price from '../common/Price';
import { colors } from '../../theme/designTokens';

const sizeMap = {
  sm: { price: '1rem', mrp: '0.8rem' },
  md: { price: '1.25rem', mrp: '0.85rem' },
  lg: { price: '1.6rem', mrp: '0.95rem' },
};

const PriceDisplay = ({ price, mrp, size = 'md', inline = false, showSavings = false }) => {
  const s = sizeMap[size] || sizeMap.md;
  const hasMrp = mrp != null && Number(mrp) > Number(price);
  const pct = hasMrp ? Math.round(((mrp - price) / mrp) * 100) : 0;
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'baseline',
        flexWrap: 'wrap',
        gap: 1,
        flexDirection: inline ? 'row' : 'row',
      }}
    >
      <Typography component="span" sx={{ fontSize: s.price, fontWeight: 800, color: 'text.primary', lineHeight: 1 }}>
        <Price amount={Number(price)} />
      </Typography>
      {hasMrp && (
        <Typography
          component="span"
          sx={{ fontSize: s.mrp, color: 'text.secondary', textDecoration: 'line-through' }}
        >
          <Price amount={Number(mrp)} />
        </Typography>
      )}
      {hasMrp && (
        <Typography component="span" sx={{ fontSize: s.mrp, fontWeight: 700, color: colors.success }}>
          {pct}% off
        </Typography>
      )}
      {showSavings && hasMrp && (
        <Typography component="span" sx={{ fontSize: '0.78rem', color: colors.success, width: '100%' }}>
          You save <Price amount={Number(mrp) - Number(price)} />
        </Typography>
      )}
    </Box>
  );
};

PriceDisplay.propTypes = {
  price: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  mrp: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  inline: PropTypes.bool,
  showSavings: PropTypes.bool,
};

export default PriceDisplay;
