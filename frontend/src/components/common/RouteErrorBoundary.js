import React from 'react';
import * as Sentry from '@sentry/react';
import { Box, Typography, Button } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

/**
 * A lighter-weight error boundary for wrapping individual route sections.
 * Unlike GlobalErrorBoundary (which catches app-level crashes), this one
 * shows an inline fallback so the rest of the app (nav, sidebar, etc.)
 * remains functional.
 */
const RouteErrorFallback = ({ error, resetError }) => (
  <Box
    display="flex"
    flexDirection="column"
    alignItems="center"
    justifyContent="center"
    minHeight="60vh"
    p={4}
    textAlign="center"
  >
    <ErrorOutlineIcon sx={{ fontSize: 64, color: '#EF4444', mb: 2 }} />
    <Typography variant="h5" gutterBottom sx={{ fontWeight: 700 }}>
      This section encountered an error
    </Typography>
    <Typography variant="body1" color="textSecondary" paragraph>
      The rest of the app is still working. You can try reloading this section.
    </Typography>
    {process.env.NODE_ENV === 'development' && error && (
      <Box
        bgcolor="#FEF2F2"
        border="1px solid #FECACA"
        p={2}
        borderRadius={2}
        mt={1}
        mb={3}
        maxWidth="600px"
        width="100%"
        overflow="auto"
      >
        <Typography
          variant="caption"
          component="pre"
          align="left"
          sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: '#991B1B' }}
        >
          {error?.toString()}
        </Typography>
      </Box>
    )}
    <Box display="flex" gap={2}>
      <Button variant="contained" color="primary" onClick={resetError}>
        Try Again
      </Button>
      <Button variant="outlined" onClick={() => (window.location.href = '/')}>
        Go Home
      </Button>
    </Box>
  </Box>
);

const RouteErrorBoundary = ({ children }) => {
  return (
    <Sentry.ErrorBoundary fallback={({ error, resetError }) => <RouteErrorFallback error={error} resetError={resetError} />}>
      {children}
    </Sentry.ErrorBoundary>
  );
};

export default RouteErrorBoundary;
