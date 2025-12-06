import React from 'react';
import { Button } from '@mui/material';
import { Logout as LogoutIcon } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

const LogoutButton = () => {
  const { logout } = useAuth();
  return (
    <Button
      color="inherit"
      onClick={() => {
        if (window.confirm('Are you sure you want to logout?')) {
          logout();
        }
      }}
      startIcon={<LogoutIcon />}
      sx={{ textTransform: 'none', fontWeight: 600 }}
    >
      Logout
    </Button>
  );
};

export default LogoutButton;