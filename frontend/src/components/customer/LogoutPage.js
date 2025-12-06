// frontend/src/components/customer/LogoutPage.js
import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const LogoutPage = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout(); // This clears everything
    navigate('/login', { replace: true });
  };

  return (
    <Paper sx={{ p: 4, textAlign: 'center', maxWidth: 500, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom color="error">
        Logout
      </Typography>
      <Typography variant="body1" sx={{ mb: 3 }}>
        Are you sure you want to logout?
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
        <Button variant="outlined" onClick={() => navigate(-1)}>
          Cancel
        </Button>
        <Button variant="contained" color="error" onClick={handleLogout}>
          Yes, Logout
        </Button>
      </Box>
    </Paper>
  );
};

export default LogoutPage;