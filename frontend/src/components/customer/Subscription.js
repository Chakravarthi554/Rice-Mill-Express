import React, { useEffect } from 'react';
import {
  Paper, Typography, Button, Alert, CircularProgress
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { subscribe, unsubscribe, getSubscription } from '../../redux/actions/userActions';

const Subscription = () => {
  const dispatch = useDispatch();
  const { subscription, loading, error } = useSelector(state => state.userSubscription || {});

  useEffect(() => {
    dispatch(getSubscription());
  }, [dispatch]);

  const toggle = () => {
    if (subscription?.active) dispatch(unsubscribe());
    else dispatch(subscribe());
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>Premium Subscription</Typography>
      {loading && <CircularProgress sx={{ display: 'block', mx: 'auto', my: 2 }} />}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Typography>
        Status: <strong>{subscription?.active ? 'Active' : 'Inactive'}</strong>
      </Typography>
      <Button variant="contained" onClick={toggle} sx={{ mt: 2 }}>
        {subscription?.active ? 'Cancel' : 'Subscribe Now'}
      </Button>
    </Paper>
  );
};
export default Subscription;