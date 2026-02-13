// frontend/src/components/customer/AccountManagement.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  DeleteSweepOutlined,
  RefreshOutlined,
  LogoutOutlined,
  DeleteForeverOutlined,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { resetPreferences } from '../../redux/actions/userActions';
import { useAuth } from '../../context/AuthContext';
import {
  USER_RESET_PREFERENCES_RESET,
  USER_RESET_PREFERENCES_SUCCESS,
} from '../../redux/constants/userConstants';

const AccountManagement = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [clearingCache, setClearingCache] = useState(false);
  const [cacheMessage, setCacheMessage] = useState(null);

  const resetState = useSelector((state) => state.userResetPreferences);
  const { loading: resetLoading, success: resetSuccess, error: resetError } = resetState;

  const handleClearCache = () => {
    setClearingCache(true);
    setCacheMessage(null);

    try {
      // ✅ PRESERVE critical user data
      const preservedData = {
        userInfo: localStorage.getItem('userInfo'),
        token: localStorage.getItem('token'),
        refreshToken: localStorage.getItem('refreshToken'),
        // Preserve cart for better UX
        cartItems: localStorage.getItem('cartItems'),
        shippingAddress: localStorage.getItem('shippingAddress')
      };

      // ✅ Clear only temporary/cache data
      const cacheKeys = [
        'recentSearches',
        'browseHistory', 
        'tempImages',
        'cachedRecipes',
        'tempFormData',
        'uiPreferences_temp', // Temporary UI settings only
        'analytics_pending',
        'offline_data'
      ];

      // Clear specific cache keys
      cacheKeys.forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });

      // Clear browser caches
      if ('caches' in window) {
        caches.keys().then((names) => {
          names.forEach((name) => {
            // Only clear non-critical caches
            if (name.includes('cache') || name.includes('temp') || name.includes('offline')) {
              caches.delete(name);
            }
          });
        });
      }

      // Restore preserved data
      Object.entries(preservedData).forEach(([key, value]) => {
        if (value) {
          localStorage.setItem(key, value);
        }
      });

      setCacheMessage('Cache cleared successfully! User data preserved.');
      setTimeout(() => {
        setCacheMessage(null);
        setClearingCache(false);
      }, 2000);
    } catch (err) {
      setCacheMessage('Failed to clear cache.');
      setClearingCache(false);
    }
  };

  const handleResetPreferences = () => {
    dispatch(resetPreferences());
  };

  useEffect(() => {
    if (resetSuccess) {
      const timer = setTimeout(() => {
        dispatch({ type: USER_RESET_PREFERENCES_RESET });
        window.location.reload();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [resetSuccess, dispatch]);

  return (
    <Paper sx={{ p: 4 }}>
      <Typography variant="h6" gutterBottom>
        Account Management
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Manage your app data and preferences.
      </Typography>

      {cacheMessage && (
        <Alert severity={cacheMessage.includes('success') || cacheMessage.includes('Reloading') ? 'success' : 'error'} sx={{ mb: 2 }}>
          {cacheMessage}
        </Alert>
      )}

      {resetError && <Alert severity="error" sx={{ mb: 2 }}>{resetError}</Alert>}

      {resetSuccess && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Preferences reset! Reloading...
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Button
          variant="outlined"
          color="warning"
          startIcon={<DeleteSweepOutlined />}
          onClick={handleClearCache}
          disabled={clearingCache}
          fullWidth
        >
          {clearingCache ? <CircularProgress size={20} /> : 'Clear Cache & Storage'}
        </Button>

        <Divider />

        <Button
          variant="outlined"
          color="info"
          startIcon={<RefreshOutlined />}
          onClick={handleResetPreferences}
          disabled={resetLoading}
          fullWidth
        >
          {resetLoading ? <CircularProgress size={20} /> : 'Reset All Preferences'}
        </Button>

        <Divider />

        <Button
          variant="outlined"
          color="secondary"
          startIcon={<LogoutOutlined />}
          onClick={() => navigate('/settings/logout')}
          fullWidth
        >
          Logout
        </Button>

        <Button
          variant="outlined"
          color="error"
          startIcon={<DeleteForeverOutlined />}
          onClick={() => navigate('/settings/delete-account')}
          fullWidth
        >
          Delete Account
        </Button>
      </Box>
    </Paper>
  );
};

export default AccountManagement;