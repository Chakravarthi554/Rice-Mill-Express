// frontend/src/components/customer/DeleteAccountPage.js
import React, { useState } from 'react';
import { Box, Typography, Button, Paper, TextField, Alert } from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { deleteAccount } from '../../redux/actions/userActions';
import axios from 'axios';

const DeleteAccountPage = () => {
  const { logout } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!password) {
      setError('Please enter your password');
      return;
    }
    setLoading(true);
    setError('');

    try {
      await dispatch(deleteAccount(password));
      logout(); // Full cleanup: localStorage, socket, headers
      navigate('/login', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 4, maxWidth: 500, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom color="error">
        Delete Account
      </Typography>
      <Typography variant="body1" sx={{ mb: 3 }}>
        This action <strong>cannot be undone</strong>. All your data will be permanently deleted.
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <TextField
        fullWidth
        label="Enter Password to Confirm"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        sx={{ mb: 3 }}
        disabled={loading}
      />
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
        <Button variant="outlined" onClick={() => navigate(-1)} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={handleDelete}
          disabled={loading}
        >
          {loading ? 'Deleting...' : 'Delete My Account'}
        </Button>
      </Box>
    </Paper>
  );
};

export default DeleteAccountPage;