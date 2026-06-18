// CategoryCard — tappable category tile (circle icon + label), Blinkit-style.
import React from 'react';
import PropTypes from 'prop-types';
import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { tap } from '../../theme/animations';
import { radius } from '../../theme/designTokens';

const MotionBox = motion(Box);

const CategoryCard = ({ name, emoji, image, tint = '#F0FDF4', color = '#16A34A', active = false, onClick }) => (
  <MotionBox
    whileHover={{ y: -4 }}
    whileTap={tap}
    onClick={onClick}
    role="button"
    tabIndex={0}
    aria-pressed={active}
    aria-label={name}
    onKeyDown={(e) => {
      if ((e.key === 'Enter' || e.key === ' ') && onClick) {
        e.preventDefault();
        onClick(e);
      }
    }}
    sx={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.75,
      cursor: 'pointer', minWidth: 80, outline: 'none',
      '&:focus-visible > div': { boxShadow: `0 0 0 3px ${color}55` },
    }}
  >
    <Box
      sx={{
        width: { xs: 60, sm: 72 }, height: { xs: 60, sm: 72 }, borderRadius: `${radius.circle}`,
        bgcolor: active ? tint : '#F9FAFB', border: `2px solid ${active ? color : 'transparent'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 28, overflow: 'hidden', transition: 'all 0.2s ease',
        boxShadow: active ? `0 6px 16px ${color}33` : 'none',
      }}
    >
      {image ? (
        <Box component="img" src={image} alt={name} loading="lazy" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <span aria-hidden="true">{emoji}</span>
      )}
    </Box>
    <Typography
      sx={{ fontSize: '0.75rem', fontWeight: active ? 700 : 600, color: active ? color : 'text.primary', textAlign: 'center' }}
      noWrap
    >
      {name}
    </Typography>
  </MotionBox>
);

CategoryCard.propTypes = {
  name: PropTypes.string.isRequired,
  emoji: PropTypes.string,
  image: PropTypes.string,
  tint: PropTypes.string,
  color: PropTypes.string,
  active: PropTypes.bool,
  onClick: PropTypes.func,
};

export default CategoryCard;
