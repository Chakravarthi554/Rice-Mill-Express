// LoadingSkeleton — shimmer placeholders for cards/lists/text.
// Built on MUI Skeleton with a subtle framer-motion pulse for premium feel.
import React from 'react';
import PropTypes from 'prop-types';
import { Box, Skeleton, Grid } from '@mui/material';
import { motion } from 'framer-motion';
import { radius } from '../../theme/designTokens';

const MotionBox = motion(Box);

const pulse = {
  animate: { opacity: [0.7, 1, 0.7] },
  transition: { duration: 1.4, repeat: Infinity, ease: 'easeInOut' },
};

export const ProductCardSkeleton = () => (
  <MotionBox {...pulse} sx={{ borderRadius: `${radius.lg}px`, overflow: 'hidden', border: '1px solid', borderColor: 'divider', p: 1.5 }}>
    <Skeleton variant="rounded" height={160} sx={{ borderRadius: `${radius.md}px`, mb: 1 }} />
    <Skeleton variant="text" width="80%" height={22} />
    <Skeleton variant="text" width="50%" height={18} />
    <Skeleton variant="text" width="40%" height={26} sx={{ mt: 1 }} />
  </MotionBox>
);

export const ListItemSkeleton = () => (
  <MotionBox {...pulse} sx={{ display: 'flex', gap: 2, alignItems: 'center', py: 1.5 }}>
    <Skeleton variant="rounded" width={64} height={64} sx={{ borderRadius: `${radius.sm}px` }} />
    <Box sx={{ flex: 1 }}>
      <Skeleton variant="text" width="60%" height={20} />
      <Skeleton variant="text" width="40%" height={16} />
    </Box>
  </MotionBox>
);

export const TextBlockSkeleton = ({ lines = 3 }) => (
  <MotionBox {...pulse}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton key={i} variant="text" width={`${90 - i * 12}%`} height={18} />
    ))}
  </MotionBox>
);

// Grid of product card skeletons — default loading state for product grids.
const LoadingSkeleton = ({ variant = 'productGrid', count = 8, lines = 3 }) => {
  if (variant === 'list') {
    return (
      <Box>
        {Array.from({ length: count }).map((_, i) => (
          <ListItemSkeleton key={i} />
        ))}
      </Box>
    );
  }
  if (variant === 'text') {
    return <TextBlockSkeleton lines={lines} />;
  }
  if (variant === 'card') {
    return <ProductCardSkeleton />;
  }
  return (
    <Grid container spacing={2}>
      {Array.from({ length: count }).map((_, i) => (
        <Grid item xs={6} sm={4} md={3} key={i}>
          <ProductCardSkeleton />
        </Grid>
      ))}
    </Grid>
  );
};

LoadingSkeleton.propTypes = {
  variant: PropTypes.oneOf(['productGrid', 'list', 'text', 'card']),
  count: PropTypes.number,
  lines: PropTypes.number,
};
TextBlockSkeleton.propTypes = { lines: PropTypes.number };

export default LoadingSkeleton;
