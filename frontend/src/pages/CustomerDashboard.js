// src/pages/CustomerDashboard.js
import React, { useState } from 'react';
import Header from '../components/common/Header';
import Dashboard from '../components/customer/Dashboard';
import ProductFilter from '../components/common/ProductFilter';
import SettingsBanner from '../components/common/SettingsBanner';
import { Box, Tabs, Tab, Container, Button } from '@mui/material';
import { useAuth } from '../context/AuthContext';

const CustomerDashboard = () => {
  const { user: userInfo } = useAuth();
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleBootstrapAdmin = async () => {
    try {
      const confirm = window.confirm('Are you sure you want to activate ADMIN access for this account?');
      if (!confirm) return;

      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/admin/bootstrap', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        alert('✅ Admin access activated! Please log in again to see the Admin Dashboard.');
        localStorage.clear();
        window.location.href = '/login';
      } else {
        const data = await response.json();
        alert(`Failed: ${data.message}`);
      }
    } catch (error) {
      console.error('Bootstrap error:', error);
      alert('Failed to activate admin access.');
    }
  };

  return (
    <>
      <Header />
      <SettingsBanner />
      <Box sx={{ minHeight: '100vh', bgcolor: '#f4f6f8' }}>
        <Container maxWidth="xl" sx={{ pt: 3 }}>
          {/* 🛡️ DEV HELPERS - Only visible if NO admin exists in system */}
          {userInfo?.canBootstrap && (
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                onClick={handleBootstrapAdmin}
                color="error"
                variant="contained"
                size="small"
              >
                🛡️ Activate Admin Access
              </Button>
            </Box>
          )}

          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            sx={{
              mb: 2,
              borderBottom: 1,
              borderColor: 'divider',
              '& .MuiTab-root': { textTransform: 'none', minHeight: 44, fontWeight: 600 }
            }}
          >
            <Tab label="Dashboard" />
            <Tab label="Browse All Products" />
          </Tabs>

          {activeTab === 0 && <Dashboard />}
          {activeTab === 1 && <ProductFilter />}
        </Container>
      </Box>
    </>
  );
};

export default CustomerDashboard;

