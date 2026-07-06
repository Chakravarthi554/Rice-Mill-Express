import React from 'react';
import { Box, Typography, Button } from '@mui/material';

/**
 * Global Error Boundary using a class component.
 * Unlike the Sentry.ErrorBoundary, this version properly resets
 * its state on retry, preventing infinite reload loops with HMR.
 */
class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('🛑 GlobalErrorBoundary caught an error:', error, errorInfo);
    // If Sentry is available, report to it
    try {
      const Sentry = require('@sentry/react');
      if (Sentry && Sentry.captureException) {
        Sentry.captureException(error, { extra: errorInfo });
      }
    } catch (_) {
      // Sentry not available, that's fine
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          height="100vh"
          p={3}
          textAlign="center"
        >
          <Typography variant="h4" color="error" gutterBottom>
            Oops! Something went wrong.
          </Typography>
          <Typography variant="body1" color="textSecondary" paragraph>
            We've been notified of the crash and are looking into it.
          </Typography>
          {process.env.NODE_ENV === 'development' && (
            <Box bgcolor="#f5f5f5" p={2} borderRadius={2} mt={2} mb={4} maxWidth="100%" overflow="auto">
              <Typography variant="caption" component="pre" align="left" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {this.state.error?.toString()}
              </Typography>
            </Box>
          )}
          <Box display="flex" gap={2}>
            <Button variant="contained" color="primary" onClick={this.handleReset}>
              Try Again
            </Button>
            <Button variant="outlined" onClick={() => window.location.reload()}>
              Reload Page
            </Button>
          </Box>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;
