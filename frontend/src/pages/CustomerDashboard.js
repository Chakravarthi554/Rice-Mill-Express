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
        <Box sx={{ bgcolor: '#fff', borderBottom: '1px solid #F3F4F6', position: 'sticky', top: 0, zIndex: 100, py: 0.5 }}>
          <Container maxWidth={false} sx={{ px: { xs: 2, md: 6 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4, py: 1 }}>
              
              {/* Logo and Location */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                <Typography
                  onClick={() => navigate('/customer/dashboard')}
                  sx={{ fontSize: '2rem', fontWeight: 900, color: '#3C006F', cursor: 'pointer', fontFamily: "'Outfit', 'Inter', sans-serif", letterSpacing: '-0.05em' }}
                >
                  ricemill
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', cursor: 'pointer' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 800, color: '#1F2937' }}>
                      Select Location
                    </Typography>
                    <Typography sx={{ fontSize: '0.75rem', color: '#3C006F' }}>▼</Typography>
                  </Box>
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#6B7280' }}>
                    {userInfo?.address?.city || userInfo?.city || 'Delivering to you'}
                  </Typography>
                </Box>
              </Box>

              {/* Search Bar */}
              <Box sx={{ flex: 1, maxWidth: 750 }}>
                <form onSubmit={handleSearchSubmit}>
                  <Box sx={{
                    display: 'flex', alignItems: 'center', bgcolor: '#F3F4F6',
                    borderRadius: '8px', px: 2, height: 46,
                    border: '1px solid #E5E7EB',
                    transition: 'all 0.2s',
                    '&:focus-within': { borderColor: '#3C006F', bgcolor: '#fff', boxShadow: '0 4px 12px rgba(60, 0, 111, 0.08)' }
                  }}>
                    <Search sx={{ color: '#6B7280', mr: 1.5, fontSize: 22 }} />
                    <InputBase
                      fullWidth
                      placeholder="Search for 'Sona Masuri', 'Premium Basmati', 'Brown Rice'..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      sx={{ fontSize: '0.95rem', fontWeight: 500, color: '#1F2937' }}
                    />
                  </Box>
                </form>
              </Box>

              {/* Cart & Profile Controls */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3.5 }}>
                <Box onClick={() => navigate('/settings/profile')} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', gap: 0.25 }}>
                  <Avatar
                    sx={{ width: 24, height: 24, bgcolor: '#3C006F', fontSize: 11, fontWeight: 700 }}
                  >
                    {userInfo?.name?.[0] || 'U'}
                  </Avatar>
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#4B5563' }}>Login</Typography>
                </Box>

                <Box onClick={() => navigate('/wishlist')} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', gap: 0.25 }}>
                  <Favorite sx={{ fontSize: 24, color: '#4B5563' }} />
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#4B5563' }}>Wishlist</Typography>
                </Box>

                <Box onClick={() => navigate('/notifications')} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', gap: 0.25 }}>
                  <Notifications sx={{ fontSize: 24, color: '#4B5563' }} />
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#4B5563' }}>Alerts</Typography>
                </Box>

                <Box onClick={() => navigate('/cart')} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', gap: 0.25 }}>
                  <Badge badgeContent={cartItems.length || 0} color="error" sx={{ '& .MuiBadge-badge': { bgcolor: '#FF3F6C', fontWeight: 700 } }}>
                    <ShoppingCart sx={{ fontSize: 24, color: '#4B5563' }} />
                  </Badge>
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#4B5563' }}>Cart</Typography>
                </Box>
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
