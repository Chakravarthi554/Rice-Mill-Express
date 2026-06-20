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
import { useI18n } from '../context/i18nContext';

const CustomerDashboard = () => {
  const { user: userInfo } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t } = useI18n();

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
    { label: t('my_orders') || 'My Orders', icon: <ShoppingBag />, path: '/settings/order-history', color: '#4F46E5', bg: '#EEF2FF' },
    { label: t('wishlist') || 'Wishlist', icon: <Favorite />, path: '/wishlist', color: '#DB2777', bg: '#FDF2F8' },
    { label: t('offers') || 'Offers', icon: <LocalOffer />, path: '/products?sale=true', color: '#EA580C', bg: '#FFF7ED' },
    { label: t('my_profile') || 'My Profile', icon: <Person />, path: '/settings/profile', color: '#0284C7', bg: '#F0F9FF' },
  ];

  return (
    <>
      <Header />
      <SettingsBanner />
      <Box sx={{ minHeight: '100vh', bgcolor: '#F9FAFB' }}>
        <Container maxWidth={false} sx={{ pt: 3, pb: 6, px: { xs: 2, md: 6 } }}>

          {/* Welcome Hero */}
          <Paper
            elevation={12}
            sx={{
              mb: 4, p: 4, borderRadius: 6,
              background: 'linear-gradient(135deg, #10B981 0%, #059669 40%, #047857 100%)',
              color: '#fff', position: 'relative', overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(5, 150, 105, 0.45)',
              transform: 'perspective(1000px) translateZ(0)',
              transformStyle: 'preserve-3d'
            }}>
            <Box sx={{ position: 'absolute', top: -40, right: -40, width: 250, height: 250, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 70%)', transform: 'translateZ(20px)' }} />
            <Box sx={{ position: 'absolute', bottom: -60, right: 120, width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)', transform: 'translateZ(10px)' }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Typography variant="h5" fontWeight={800} gutterBottom>
                  Welcome back, {userInfo?.name?.split(' ')[0] || 'there'} 👋
                </Typography>
                <Typography sx={{ opacity: 0.85, mb: 2 }}>
                  {t('dashboard_subtitle') || 'Fresh rice delivered to your doorstep. What are you looking for today?'}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip label={`🌾 ${t('cat_basmati') || 'Premium Basmati'}`} size="small" onClick={() => navigate('/products?category=basmati')} sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 600, cursor: 'pointer', '&:hover': { bgcolor: 'rgba(255,255,255,0.35)' } }} />
                  <Chip label={`🌿 ${t('cat_organic') || 'Organic Rice'}`} size="small" onClick={() => navigate('/products?category=organic')} sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 600, cursor: 'pointer', '&:hover': { bgcolor: 'rgba(255,255,255,0.35)' } }} />
                  <Chip label={`📦 ${t('cat_bulk') || 'Bulk Orders'}`} size="small" onClick={() => navigate('/products?minQty=50')} sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 600, cursor: 'pointer', '&:hover': { bgcolor: 'rgba(255,255,255,0.35)' } }} />
                </Box>
              </Box>
              <Avatar sx={{ width: 72, height: 72, bgcolor: 'rgba(255,255,255,0.2)', border: '3px solid rgba(255,255,255,0.4)', fontSize: 28 }}>
                {userInfo?.name?.[0] || '👤'}
              </Avatar>
            </Box>
          </Paper>

          {/* Quick Links */}
          <Grid container spacing={2.5} sx={{ mb: 5 }}>
            {quickLinks.map(link => (
              <Grid item xs={6} sm={3} key={link.label}>
                <Paper elevation={4}
                  onClick={() => navigate(link.path)}
                  sx={{ 
                    borderRadius: 4, p: 3, cursor: 'pointer', 
                    background: 'linear-gradient(145deg, #ffffff, #f3f4f6)',
                    boxShadow: '8px 8px 16px #e5e7eb, -8px -8px 16px #ffffff',
                    textAlign: 'center', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
                    position: 'relative', overflow: 'hidden',
                    '&:hover': { 
                      transform: 'translateY(-6px) scale(1.02)',
                      boxShadow: `0 20px 25px -5px ${link.color}40`, 
                      '&::before': { opacity: 1 }
                    },
                    '&::before': {
                      content: '""', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                      background: `linear-gradient(135deg, ${link.color}15 0%, transparent 100%)`,
                      opacity: 0, transition: 'opacity 0.3s'
                    }
                  }}>
                  <Avatar sx={{ 
                    bgcolor: link.bg, color: link.color, width: 56, height: 56, mx: 'auto', mb: 1.5,
                    boxShadow: `inset 0 2px 4px rgba(255,255,255,0.8), 0 4px 10px ${link.color}30` 
                  }}>
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
              <Tab label={`📊 ${t('my_dashboard') || 'My Dashboard'}`} />
              <Tab label={`🛍️ ${t('browse_all_products') || 'Browse All Products'}`} />
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
