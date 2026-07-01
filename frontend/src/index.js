import React from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { theme } from './theme';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from './redux/store';
import { AuthProvider } from './context/AuthContext';
import GlobalErrorBoundary from './components/common/GlobalErrorBoundary';
import App from './App';
import './i18n';
import { io } from 'socket.io-client';
import * as Sentry from "@sentry/react";

if (process.env.REACT_APP_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.REACT_APP_SENTRY_DSN,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}

// Polyfills
import { Buffer } from 'buffer';
import process from 'process';

globalThis.Buffer = Buffer;
globalThis.process = process;

// Socket.io (optional global)

window.io = io; // For debugging

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GlobalErrorBoundary>
        <Provider store={store}>
          <BrowserRouter>
            <AuthProvider>
              <App />
            </AuthProvider>
          </BrowserRouter>
        </Provider>
      </GlobalErrorBoundary>
    </ThemeProvider>
  </React.StrictMode>
);