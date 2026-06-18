// SellerBadge — seller name with optional verified checkmark.
import React from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, Tooltip } from '@mui/material';
import { Verified, StorefrontOutlined } from '@mui/icons-material';
import { colors } from '../../theme/designTokens';

const SellerBadge = ({ seller, verified = false, size = 'sm' }) => {
  if (!seller) return null;
  const fs = size === 'sm' ? '0.78rem' : '0.9rem';
  const icon = size === 'sm' ? 16 : 18;
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
      <StorefrontOutlined sx={{ fontSize: icon, color: 'text.secondary' }} />
      <Typography
        component="span"
        noWrap
        sx={{ fontSize: fs, color: 'text.secondary', fontWeight: 600, maxWidth: 160 }}
      >
        {seller}
      </Typography>
      {verified && (
        <Tooltip title="Verified Seller">
          <Verified sx={{ fontSize: icon, color: colors.info }} aria-label="Verified seller" />
        </Tooltip>
      )}
    </Box>
  );
};

SellerBadge.propTypes = {
  seller: PropTypes.string,
  verified: PropTypes.bool,
  size: PropTypes.oneOf(['sm', 'md']),
};

export default SellerBadge;
