import React, { useState, useEffect } from 'react';
import Dashboard from '../components/customer/Dashboard';
import SettingsBanner from '../components/common/SettingsBanner';
import {
  Box, Container, Button, Typography, IconButton, InputBase, Badge, Avatar
} from '@mui/material';
import {
  Search, ShoppingCart, Favorite, Notifications
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useDispatch, useSelector } from 'react-redux';
import { listMyOrders } from '../redux/actions/orderActions';
import { getUserDetails } from '../redux/actions/userActions';
import { listMyCart } from '../redux/actions/cartActions';
import { useNavigate } from 'react-router-dom';

const CustomerDashboard = () => {
  const { user: userInfo } = useAuth();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchQuery, setSearchQuery] = useState('');

  const { cartItems = [] } = useSelector(state => state.cart || {});

  useEffect(() => {
    if (userInfo?._id) {
      dispatch(getUserDetails());
      dispatch(listMyOrders());
      dispatch(listMyCart());
    }
  }, [dispatch, userInfo?._id]);

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

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${searchQuery}`);
    }
  };

  return (
    <>
      <Box sx={{ minHeight: '100vh', bgcolor: '#F9FAFB' }}>
        {/* ── ZEPTO-STYLE TOP SEARCH BAR ── */}
        <Box sx={{ bgcolor: '#fff', borderBottom: '1px solid #F3F4F6', position: 'sticky', top: 0, zIndex: 100 }}>
          <Container maxWidth={false} sx={{ px: { xs: 2, md: 6 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                <Typography
                  onClick={() => navigate('/customer/dashboard')}
                  sx={{ fontSize: '1.4rem', fontWeight: 900, color: '#2E7D32', cursor: 'pointer', letterSpacing: '-0.03em' }}
                >
                  RiceMill
                </Typography>
                <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#6B7280', bgcolor: '#F3F4F6', px: 1, py: 0.25, borderRadius: '4px' }}>
                  {userInfo?.address?.city || userInfo?.city || 'Delivering to you'}
                </Typography>
              </Box>
              <Box sx={{ flex: 1, maxWidth: 640, mx: 'auto' }}>
                <form onSubmit={handleSearchSubmit}>
                  <Box sx={{
                    display: 'flex', alignItems: 'center', bgcolor: '#F3F4F6',
                    borderRadius: '24px', px: 2, height: 44,
                    border: '2px solid transparent',
                    transition: 'all 0.2s',
                    '&:focus-within': { borderColor: '#2E7D32', bgcolor: '#fff' }
                  }}>
                    <Search sx={{ color: '#9CA3AF', mr: 1.5, fontSize: 20 }} />
                    <InputBase
                      fullWidth
                      placeholder="Search products, brands, categories..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      sx={{ fontSize: '0.9rem', fontWeight: 500, color: '#1F2937' }}
                    />
                  </Box>
                </form>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <IconButton onClick={() => navigate('/wishlist')} sx={{ color: '#4B5563' }}>
                  <Favorite sx={{ fontSize: 22 }} />
                </IconButton>
                <IconButton onClick={() => navigate('/cart')} sx={{ color: '#4B5563' }}>
                  <Badge badgeContent={cartItems.length || 0} color="error" sx={{ '& .MuiBadge-badge': { bgcolor: '#2E7D32', fontWeight: 700 } }}>
                    <ShoppingCart sx={{ fontSize: 22 }} />
                  </Badge>
                </IconButton>
                <IconButton onClick={() => navigate('/notifications')} sx={{ color: '#4B5563' }}>
                  <Notifications sx={{ fontSize: 22 }} />
                </IconButton>
                <Avatar
                  onClick={() => navigate('/settings/profile')}
                  sx={{ width: 34, height: 34, ml: 0.5, bgcolor: '#2E7D32', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}
                >
                  {userInfo?.name?.[0] || 'U'}
                </Avatar>
              </Box>
            </Box>
          </Container>
        </Box>

        <SettingsBanner />

        <Container maxWidth={false} sx={{ px: { xs: 2, md: 6 }, pt: 1, pb: 6 }}>

          {/* Dev Bootstrap */}
          {userInfo?.canBootstrap && (
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button onClick={handleBootstrapAdmin} color="error" variant="contained" size="small">
                🛡️ Activate Admin Access
              </Button>
            </Box>
          )}

          {/* ── MAIN DASHBOARD CONTENT ── */}
          <Dashboard />

        </Container>
      </Box>
    </>
  );
};

export default CustomerDashboard;
