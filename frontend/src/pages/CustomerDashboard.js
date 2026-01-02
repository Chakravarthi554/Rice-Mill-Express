// src/pages/CustomerDashboard.js
import React from 'react';
import Header from '../components/common/Header';
import Dashboard from '../components/customer/Dashboard';
import { Box } from '@mui/material';

const CustomerDashboard = () => {
  return (
    <>
      <Header />
      <Box sx={{ minHeight: '100vh', bgcolor: '#f4f6f8' }}>
        <Dashboard />
      </Box>
    </>
  );
};

export default CustomerDashboard;