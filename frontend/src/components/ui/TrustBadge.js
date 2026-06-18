// TrustBadge — small reassurance chip (e.g. Secure Payment, FSSAI, Free Delivery).
import React from 'react';
import PropTypes from 'prop-types';
import { Box, Typography } from '@mui/material';
import {
  VerifiedUserOutlined,
  LocalShippingOutlined,
  ReplayOutlined,
  WorkspacePremiumOutlined,
} from '@mui/icons-material';
import { colors, tints, radius } from '../../theme/designTokens';

const ICONS = {
  secure: VerifiedUserOutlined,
  delivery: LocalShippingOutlined,
  returns: ReplayOutlined,
  quality: WorkspacePremiumOutlined,
};

const TrustBadge = ({ icon = 'secure', label, color = colors.primary.main, tint = tints.green }) => {
  const Icon = ICONS[icon] || VerifiedUserOutlined;
  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.75,
        bgcolor: tint,
        color,
        px: 1.25,
        py: 0.6,
        borderRadius: `${radius.pill}px`,
        border: `1px solid ${color}22`,
      }}
    >
      <Icon sx={{ fontSize: 16 }} />
      <Typography component="span" sx={{ fontSize: '0.72rem', fontWeight: 700 }}>
        {label}
      </Typography>
    </Box>
  );
};

TrustBadge.propTypes = {
  icon: PropTypes.oneOf(['secure', 'delivery', 'returns', 'quality']),
  label: PropTypes.string.isRequired,
  color: PropTypes.string,
  tint: PropTypes.string,
};

export default TrustBadge;
