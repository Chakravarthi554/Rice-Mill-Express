import React, { useState, useEffect } from 'react';
import Header from '../components/common/Header';
import Dashboard from '../components/customer/Dashboard';
import ProductFilter from '../components/common/ProductFilter';
import SettingsBanner from '../components/common/SettingsBanner';
import {
  Box, Tabs, Tab, Container, Button, Paper, Typography, Grid, Avatar,
  Chip
} from '@mui/material';
import {
  ShoppingBag, Explore, LocalOffer, Favorite, Person, Storefront
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useDispatch, useSelector } from 'react-redux';
import { listMyOrders } from '../redux/actions/orderActions';
import { getUserDetails } from '../redux/actions/userActions';
import { listMyCart } from '../redux/actions/cartActions';
import { useNavigate } from 'react-router-dom';

const CustomerDashboard = () => {
  const { user: userInfo } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // ✅ Load all customer data on dashboard mount
  useEffect(() => {
    if (userInfo?._id) {
      dispatch(getUserDetails());
      dispatch(listMyOrders());
      dispatch(listMyCart());
    }
  }, [dispatch, userInfo?._id]);

  const handleTabChange = (event, newValue) => setActiveTab(newValue);

  const handleBootstrapAdmin = async () => {
    try {
      const confirm = window.confirm('Are you sure you want to activate ADMIN access for this account?');
      if (!confirm) return;
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/admin/bootstrap', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        alert('✅ Admin access activated! Please log in again.');
        localStorage.clear();
        window.location.href = '/login';
      } else {
        const data = await response.json();
        alert(`Failed: ${data.message}`);
      }
    } catch (error) {
      alert('Failed to activate admin access.');
    }
  };

  const quickLinks = [
    { label: 'My Orders', icon: <ShoppingBag />, path: '/settings/order-history', color: '#4F46E5', bg: '#EEF2FF' },
    { label: 'Wishlist', icon: <Favorite />, path: '/wishlist', color: '#DB2777', bg: '#FDF2F8' },
    { label: 'Offers', icon: <LocalOffer />, path: '/products?sale=true', color: '#EA580C', bg: '#FFF7ED' },
    { label: 'My Profile', icon: <Person />, path: '/settings/profile', color: '#0284C7', bg: '#F0F9FF' },
  ];

  return (
    <>
      <Header />
      <SettingsBanner />
      <Box sx={{ minHeight: '100vh', bgcolor: '#F9FAFB' }}>
        <Container maxWidth="xl" sx={{ pt: 3, pb: 6 }}>

          {/* Welcome Hero */}
          <Paper
            elevation={0}
            sx={{
              mb: 3, p: 3, borderRadius: 4,
              background: 'linear-gradient(135deg, #16A34A 0%, #059669 50%, #0D9488 100%)',
              color: '#fff', position: 'relative', overflow: 'hidden'
            }}>
            <Box sx={{ position: 'absolute', top: -30, right: -30, width: 200, height: 200, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.06)' }} />
            <Box sx={{ position: 'absolute', bottom: -40, right: 80, width: 140, height: 140, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.04)' }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Typography variant="h5" fontWeight={800} gutterBottom>
                  Welcome back, {userInfo?.name?.split(' ')[0] || 'there'} 👋
                </Typography>
                <Typography sx={{ opacity: 0.85, mb: 2 }}>
                  Fresh rice delivered to your doorstep. What are you looking for today?
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip label="🌾 Premium Basmati" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 600 }} />
                  <Chip label="🌿 Organic Rice" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 600 }} />
                  <Chip label="📦 Bulk Orders" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 600 }} />
                </Box>
              </Box>
              <Avatar sx={{ width: 72, height: 72, bgcolor: 'rgba(255,255,255,0.2)', border: '3px solid rgba(255,255,255,0.4)', fontSize: 28 }}>
                {userInfo?.name?.[0] || '👤'}
              </Avatar>
            </Box>
          </Paper>

          {/* Quick Links */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {quickLinks.map(link => (
              <Grid item xs={6} sm={3} key={link.label}>
                <Paper elevation={0} variant="outlined"
                  onClick={() => navigate(link.path)}
                  sx={{ borderRadius: 3, p: 2.5, cursor: 'pointer', border: '1px solid #F3F4F6', textAlign: 'center', transition: 'all 0.2s', '&:hover': { borderColor: link.color, boxShadow: `0 4px 20px ${link.color}20`, transform: 'translateY(-2px)' } }}>
                  <Avatar sx={{ bgcolor: link.bg, color: link.color, width: 48, height: 48, mx: 'auto', mb: 1 }}>
                    {link.icon}
                  </Avatar>
                  <Typography variant="body2" fontWeight={700} color="text.primary">{link.label}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>

          {/* Dev Bootstrap */}
          {userInfo?.canBootstrap && (
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button onClick={handleBootstrapAdmin} color="error" variant="contained" size="small">
                🛡️ Activate Admin Access
              </Button>
            </Box>
          )}

          {/* Tabs */}
          <Paper elevation={0} variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid #F3F4F6' }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              sx={{
                borderBottom: '1px solid #F3F4F6',
                bgcolor: '#fff',
                '& .MuiTab-root': { textTransform: 'none', fontWeight: 700, minHeight: 52, fontSize: '0.9rem', color: '#6B7280' },
                '& .Mui-selected': { color: '#16A34A' },
                '& .MuiTabs-indicator': { bgcolor: '#16A34A', height: 3, borderRadius: '3px 3px 0 0' }
              }}>
              <Tab label="📊 My Dashboard" />
              <Tab label="🛍️ Browse All Products" />
            </Tabs>
            <Box sx={{ bgcolor: '#F9FAFB', p: 3 }}>
              {activeTab === 0 && <Dashboard />}
              {activeTab === 1 && <ProductFilter />}
            </Box>
          </Paper>

        </Container>
      </Box>
    </>
  );
};

export default CustomerDashboard;
