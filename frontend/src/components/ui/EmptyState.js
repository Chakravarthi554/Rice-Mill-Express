// EmptyState — premium empty placeholder with optional illustration + CTA.
// Note: a basic EmptyState also exists in components/common/PageStates.js.
// This ui/* version is the richer, animated design-system variant; both can
// coexist. Prefer this one for new redesigned screens.
import React from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, Button } from '@mui/material';
import { Inbox } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { scaleIn } from '../../theme/animations';
import { tints, colors } from '../../theme/designTokens';

const MotionBox = motion(Box);

const EmptyState = ({
  title = 'Nothing here yet',
  description = 'There is nothing to show right now.',
  icon,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
}) => (
  <MotionBox
    variants={scaleIn}
    initial="hidden"
    animate="visible"
    role="status"
    sx={{ textAlign: 'center', py: 6, px: 3, maxWidth: 420, mx: 'auto' }}
  >
    <Box
      sx={{
        width: 96, height: 96, borderRadius: '50%', bgcolor: tints.green,
        display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2,
      }}
    >
      {icon || <Inbox sx={{ fontSize: 44, color: colors.primary.main }} />}
    </Box>
    <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>{title}</Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>{description}</Typography>
    <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center', flexWrap: 'wrap' }}>
      {actionLabel && onAction && (
        <Button variant="contained" color="primary" onClick={onAction}>{actionLabel}</Button>
      )}
      {secondaryActionLabel && onSecondaryAction && (
        <Button variant="outlined" color="primary" onClick={onSecondaryAction}>{secondaryActionLabel}</Button>
      )}
    </Box>
  </MotionBox>
);

EmptyState.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  icon: PropTypes.node,
  actionLabel: PropTypes.string,
  onAction: PropTypes.func,
  secondaryActionLabel: PropTypes.string,
  onSecondaryAction: PropTypes.func,
};

export default EmptyState;
