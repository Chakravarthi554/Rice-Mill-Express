import React, { useEffect, useState } from 'react';
import {
  Paper, Typography, Button, Alert, CircularProgress, Box, Snackbar, Chip
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { subscribe, unsubscribe, getSubscription } from '../../redux/actions/userActions';

const Subscription = () => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [subscription, setSubscription] = useState({ active: false, plan: 'free' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });

  // ✅ FIXED: Fetch subscription on mount
  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        setLoading(true);
        const data = await dispatch(getSubscription());
        if (data?.subscription) {
          setSubscription(data.subscription);
        }
      } catch (err) {
        console.error('Failed to fetch subscription:', err);
        setError(err.message || 'Failed to load subscription');
      } finally {
        setLoading(false);
      }
    };
    fetchSubscription();
  }, [dispatch]);

  const handleToggle = async () => {
    try {
      setLoading(true);
      setError(null);
      if (subscription?.active) {
        await dispatch(unsubscribe());
        setSubscription({ ...subscription, active: false });
        setSnackbar({ open: true, message: 'Subscription cancelled successfully' });
      } else {
        await dispatch(subscribe());
        setSubscription({ ...subscription, active: true });
        setSnackbar({ open: true, message: 'Subscription activated successfully' });
      }
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Failed to update subscription');
      setSnackbar({ open: true, message: 'Failed to update subscription' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>Premium Subscription</Typography>
      {loading && !subscription && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress />
        </Box>
      )}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>Settings updated!</Alert>}
      
      <Box sx={{ mb: 2 }}>
        <Typography variant="body1" gutterBottom>
          Status: <Chip 
            label={subscription?.active ? 'Active' : 'Inactive'} 
            color={subscription?.active ? 'success' : 'default'}
            size="small"
          />
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Plan: {subscription?.plan || 'Free'}
        </Typography>
      </Box>
      
      <Button 
        variant="contained" 
        onClick={handleToggle} 
        disabled={loading}
        sx={{ mt: 2 }}
      >
        {loading ? <CircularProgress size={20} /> : (subscription?.active ? 'Cancel Subscription' : 'Subscribe Now')}
      </Button>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </Paper>
  );
};
export default Subscription;