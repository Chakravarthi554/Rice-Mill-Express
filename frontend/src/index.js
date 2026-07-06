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
// Polyfills
import { Buffer } from 'buffer';
import process from 'process';

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

// Register service worker for PWA support (ONLY in production)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    if (process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/service-worker.js').then(
        (registration) => {
          console.log('ServiceWorker registration successful with scope: ', registration.scope);
        },
        (err) => {
          console.log('ServiceWorker registration failed: ', err);
        }
      );
    } else {
      // Force unregister all service workers in development to prevent infinite HMR reload loops
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (let registration of registrations) {
          registration.unregister().then(
            () => console.log('ServiceWorker unregistered successfully in development mode.')
          );
        }
      });
    }
  });
}