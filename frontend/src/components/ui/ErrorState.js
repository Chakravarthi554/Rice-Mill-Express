// ErrorState — premium error placeholder with retry.
import React from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, Button } from '@mui/material';
import { ErrorOutline, RefreshOutlined } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { scaleIn } from '../../theme/animations';
import { tints, colors } from '../../theme/designTokens';

const MotionBox = motion(Box);

const ErrorState = ({
  title = 'Something went wrong',
  description = 'We could not load this content. Please try again.',
  actionLabel = 'Retry',
  onAction,
}) => (
  <MotionBox
    variants={scaleIn}
    initial="hidden"
    animate="visible"
    role="alert"
    sx={{ textAlign: 'center', py: 6, px: 3, maxWidth: 420, mx: 'auto' }}
  >
    <Box
      sx={{
        width: 96, height: 96, borderRadius: '50%', bgcolor: tints.red,
        display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2,
      }}
    >
      <ErrorOutline sx={{ fontSize: 44, color: colors.error }} />
    </Box>
    <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>{title}</Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>{description}</Typography>
    {onAction && (
      <Button variant="contained" color="error" startIcon={<RefreshOutlined />} onClick={onAction}>
        {actionLabel}
      </Button>
    )}
  </MotionBox>
);

ErrorState.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  actionLabel: PropTypes.string,
  onAction: PropTypes.func,
};

export default ErrorState;
