// StatusChip — semantic status pill for orders, stock, payments, etc.
import React from 'react';
import PropTypes from 'prop-types';
import { Chip } from '@mui/material';
import { colors, tints } from '../../theme/designTokens';

// Maps a status keyword to a color/tint pair.
const VARIANTS = {
  success: { color: colors.success, tint: tints.green },
  pending: { color: colors.accent.alt, tint: tints.amber },
  processing: { color: colors.info, tint: tints.blue },
  error: { color: colors.error, tint: tints.red },
  neutral: { color: colors.neutral[700], tint: tints.green },
};

// Convenience map of common order/payment statuses.
const STATUS_TO_VARIANT = {
  delivered: 'success', paid: 'success', active: 'success', completed: 'success', 'in stock': 'success',
  pending: 'pending', placed: 'pending', 'low stock': 'pending',
  shipped: 'processing', processing: 'processing', 'out for delivery': 'processing', confirmed: 'processing',
  cancelled: 'error', failed: 'error', refunded: 'error', 'out of stock': 'error',
};

const StatusChip = ({ status, variant, size = 'small' }) => {
  const key = (status || '').toString().toLowerCase();
  const resolved = variant || STATUS_TO_VARIANT[key] || 'neutral';
  const v = VARIANTS[resolved] || VARIANTS.neutral;
  return (
    <Chip
      label={status}
      size={size}
      sx={{
        bgcolor: v.tint,
        color: v.color,
        fontWeight: 700,
        fontSize: '0.72rem',
        textTransform: 'capitalize',
        border: `1px solid ${v.color}22`,
      }}
    />
  );
};

StatusChip.propTypes = {
  status: PropTypes.string.isRequired,
  variant: PropTypes.oneOf(['success', 'pending', 'processing', 'error', 'neutral']),
  size: PropTypes.oneOf(['small', 'medium']),
};

export default StatusChip;
