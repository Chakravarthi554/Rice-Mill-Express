import React from 'react';
import { IconButton } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../../context/AuthContext';

const LogoutButton = () => {
  const { logout } = useAuth();
  
  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  return (
    <IconButton 
      color="inherit" 
      onClick={handleLogout}
      sx={{ ml: 'auto' }}
      title="Logout"
    >
      <LogoutIcon />
    </IconButton>
  );
};

export default LogoutButton;