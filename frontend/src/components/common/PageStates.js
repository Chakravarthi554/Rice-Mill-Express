import React from 'react';
import { Box, Button, Paper, Typography, CircularProgress } from '@mui/material';
import { ErrorOutline, InboxOutlined } from '@mui/icons-material';

export const LoadingState = ({ message = 'Loading...' }) => (
  <Box display="flex" justifyContent="center" alignItems="center" minHeight="280px">
    <Box textAlign="center">
      <CircularProgress />
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        {message}
      </Typography>
    </Box>
  </Box>
);

export const EmptyState = ({
  title = 'No data found',
  description = 'There is nothing to show here right now.',
  actionLabel,
  onAction,
}) => (
  <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 3, bgcolor: 'grey.50' }}>
    <InboxOutlined sx={{ fontSize: 56, color: 'text.disabled', mb: 1 }} />
    <Typography variant="h6">{title}</Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
      {description}
    </Typography>
    {actionLabel && onAction && (
      <Button variant="contained" onClick={onAction}>
        {actionLabel}
      </Button>
    )}
  </Paper>
);

export const ErrorState = ({
  title = 'Something went wrong',
  description = 'Please try again.',
  actionLabel = 'Retry',
  onAction,
}) => (
  <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 3, bgcolor: '#fff5f5' }}>
    <ErrorOutline color="error" sx={{ fontSize: 56, mb: 1 }} />
    <Typography variant="h6">{title}</Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
      {description}
    </Typography>
    {onAction && (
      <Button variant="outlined" color="error" onClick={onAction}>
        {actionLabel}
      </Button>
    )}
  </Paper>
);
