// DiscountBadge — amber commerce badge for percentage / flat discounts.
import React from 'react';
import PropTypes from 'prop-types';
import { Box } from '@mui/material';
import { colors, radius } from '../../theme/designTokens';

const DiscountBadge = ({ percent, label, color = colors.accent.dark }) => {
  const text = label || (percent != null ? `${percent}% OFF` : null);
  if (!text) return null;
  return (
    <Box
      component="span"
      aria-label={`Discount ${text}`}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        bgcolor: color,
        color: '#fff',
        fontSize: '0.7rem',
        fontWeight: 800,
        letterSpacing: '0.02em',
        px: 1,
        py: 0.4,
        borderRadius: `${radius.xs}px`,
        lineHeight: 1.2,
        boxShadow: '0 4px 10px rgba(255,143,0,0.3)',
      }}
    >
      {text}
    </Box>
  );
};

DiscountBadge.propTypes = {
  percent: PropTypes.number,
  label: PropTypes.string,
  color: PropTypes.string,
};

export default DiscountBadge;
