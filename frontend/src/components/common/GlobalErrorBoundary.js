import React from 'react';
import * as Sentry from '@sentry/react';
import { Box, Typography, Button } from '@mui/material';

const FallbackUI = ({ error }) => (
  <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100vh" p={3} textAlign="center">
    <Typography variant="h4" color="error" gutterBottom>
      Oops! Something went wrong.
    </Typography>
    <Typography variant="body1" color="textSecondary" paragraph>
      We've been notified of the crash and are looking into it.
    </Typography>
    {process.env.NODE_ENV === 'development' && (
      <Box bgcolor="#f5f5f5" p={2} borderRadius={2} mt={2} mb={4} maxWidth="100%" overflow="auto">
        <Typography variant="caption" component="pre" align="left" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {error?.toString()}
        </Typography>
      </Box>
    )}
    <Button variant="contained" color="primary" onClick={() => window.location.reload()}>
      Reload Page
    </Button>
  </Box>
);

const GlobalErrorBoundary = ({ children }) => {
  return (
    <Sentry.ErrorBoundary fallback={({ error }) => <FallbackUI error={error} />}>
      {children}
    </Sentry.ErrorBoundary>
  );
};

export default GlobalErrorBoundary;
