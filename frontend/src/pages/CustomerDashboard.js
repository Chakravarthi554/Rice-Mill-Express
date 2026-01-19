// src/pages/CustomerDashboard.js
import React, { useState } from 'react';
import Header from '../components/common/Header';
import Dashboard from '../components/customer/Dashboard';
import ProductFilter from '../components/common/ProductFilter';
import SettingsBanner from '../components/common/SettingsBanner';
import { Box, Tabs, Tab, Container } from '@mui/material';

const CustomerDashboard = () => {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <>
      <Header />
      <SettingsBanner />
      <Box sx={{ minHeight: '100vh', bgcolor: '#f4f6f8' }}>
        <Container maxWidth="xl" sx={{ pt: 3 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
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
