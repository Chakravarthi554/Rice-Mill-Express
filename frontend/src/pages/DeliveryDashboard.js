import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Alert, Avatar, Box, Button, Chip, Container, Divider, Grid, IconButton, LinearProgress, Paper, Stack, Switch, TextField, Typography, BottomNavigation, BottomNavigationAction, Select, MenuItem, InputLabel, FormControl
} from '@mui/material';
import {
  Chat, CheckCircle, DirectionsBike, History, Home, LocalShipping, Navigation, Phone, Route, Settings, AccountBalanceWallet, AttachMoney, Language, SettingsBrightness, NightsStay, WbSunny, ExitToApp, FilterList
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import DeliveryPhotoConfirmation from '../components/delivery/DeliveryPhotoConfirmation';

const MotionPaper = motion(Paper);

const DeliveryDashboard = () => {
  const { userInfo } = useSelector((state) => state.userLogin || {});
  const { t, i18n } = useTranslation();
  const { theme, setThemeMode } = useTheme();

  const [orders, setOrders] = useState([]);
  const [incentives, setIncentives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  
  // Wallet state
  const [earningsRange, setEarningsRange] = useState('today');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  
  // Settings state
  const [dpSettings, setDpSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('dp_settings');
      return saved ? JSON.parse(saved) : { language: 'en', theme: 'system', notifications: true };
    } catch { return { language: 'en', theme: 'system', notifications: true }; }
  });

  const saveSettings = (newSettings) => {
    setDpSettings(newSettings);
    localStorage.setItem('dp_settings', JSON.stringify(newSettings));
    if (newSettings.theme) setThemeMode(newSettings.theme);
    if (newSettings.language) i18n.changeLanguage(newSettings.language);
  };

  const fetchMyDeliveries = async () => {
    try {
      setLoading(true);
      const token = userInfo?.accessToken || userInfo?.token;
      if (!token) { setLoading(false); return; }
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const [deliveriesRes, incentivesRes] = await Promise.all([
        axios.get('/api/v1/delivery-partners/my-deliveries', config).catch(() => ({ data: { orders: [] } })),
        axios.get('/api/v1/delivery-partners/incentives', config).catch(() => ({ data: { incentives: [] } }))
      ]);

      setOrders(deliveriesRes.data?.orders || []);
      setIncentives(incentivesRes.data?.incentives || []);
      setError('');
    } catch (err) {
      console.error('Fetch deliveries error:', err);
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userInfo) fetchMyDeliveries();
    else setLoading(false);
  }, [userInfo]);

  const handleOpenDeliveryModal = (order) => { setSelectedOrder(order); setShowPhotoModal(true); };
  const handleDeliverySuccess = () => { setShowPhotoModal(false); setSelectedOrder(null); fetchMyDeliveries(); };

  // Data processing
  const activeOrders = orders.filter(o => ['assigned', 'shipped', 'out_for_delivery', 'in_transit'].includes(o.orderStatus) || ['assigned', 'picked_up', 'in_transit'].includes(o.deliveryPartnerStatus));
  const completedOrders = orders.filter(o => o.orderStatus === 'delivered' || o.deliveryPartnerStatus === 'delivered')
                                .sort((a, b) => new Date(b.deliveredAt) - new Date(a.deliveredAt));

  // Date Filtering for Earnings
  const filterByDate = (ordersList) => {
    const now = new Date();
    return ordersList.filter(o => {
      if (!o.deliveredAt) return false;
      const dDate = new Date(o.deliveredAt);
      if (earningsRange === 'today') {
        return dDate.toDateString() === now.toDateString();
      } else if (earningsRange === 'week') {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0,0,0,0);
        return dDate >= startOfWeek;
      } else if (earningsRange === 'month') {
        return dDate.getMonth() === now.getMonth() && dDate.getFullYear() === now.getFullYear();
      } else if (earningsRange === 'custom') {
        if (!customDateFrom || !customDateTo) return true;
        return dDate >= new Date(customDateFrom) && dDate <= new Date(customDateTo + 'T23:59:59');
      }
      return true;
    });
  };

  const filteredEarningsOrders = filterByDate(completedOrders);
  const earningsValue = filteredEarningsOrders.reduce((acc, o) => acc + (o.deliveryFee || o.deliveryCharge || Math.round(o.totalPrice * 0.1) || 50), 0);
  const cashInHand = activeOrders.filter(o => o.paymentMethod === 'cod' && o.codCollected && !o.codSettled).reduce((acc, o) => acc + (o.totalPrice || 0), 0);

  const OrderCard = ({ order, isHistory = false }) => {
    const isPrepaid = order.paymentMethod?.toLowerCase() !== 'cod';
    return (
      <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: `1px solid ${isHistory ? '#BBF7D0' : '#FED7AA'}`, mb: 2 }}>
        <Stack direction="row" justifyContent="space-between" mb={1.5}>
          <Box>
            <Typography sx={{ fontWeight: 800, color: isHistory ? '#16A34A' : '#E65100', fontSize: 15 }}>#{order.orderNumber || order._id?.slice(-6)?.toUpperCase()}</Typography>
            <Typography sx={{ fontSize: 13, color: '#6B7280', fontWeight: 600 }}>{order.orderItems?.[0]?.name} • ₹{order.totalPrice}</Typography>
          </Box>
          <Chip label={isPrepaid ? 'PREPAID' : 'COD'} size="small" sx={{ bgcolor: isPrepaid ? '#E0F2FE' : '#FEE2E2', color: isPrepaid ? '#0369A1' : '#DC2626', fontWeight: 800, fontSize: 10 }} />
        </Stack>
        {!isHistory && (
          <>
            <Divider sx={{ my: 1.5 }} />
            <Stack direction="row" spacing={2} mb={1.5}>
              <Box flex={1}>
                <Typography sx={{ color: '#9CA3AF', fontSize: 10, fontWeight: 800, textTransform: 'uppercase' }}>Pickup</Typography>
                <Typography sx={{ fontWeight: 800, fontSize: 13 }}>{order.seller?.name || 'Seller'}</Typography>
              </Box>
              <Box flex={1}>
                <Typography sx={{ color: '#9CA3AF', fontSize: 10, fontWeight: 800, textTransform: 'uppercase' }}>Drop</Typography>
                <Typography sx={{ fontWeight: 800, fontSize: 13 }}>{order.user?.name || 'Customer'}</Typography>
                <Typography sx={{ color: '#6B7280', fontSize: 11 }}>{order.shippingAddress?.street}</Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={1}>
              <Button fullWidth variant="outlined" startIcon={<Navigation />} size="small" sx={{ borderRadius: 999, fontWeight: 800, textTransform: 'none' }}>Directions</Button>
              <Button fullWidth variant="contained" onClick={() => handleOpenDeliveryModal(order)} size="small" sx={{ bgcolor: '#E65100', borderRadius: 999, fontWeight: 800, textTransform: 'none', '&:hover': { bgcolor: '#BF360C' } }}>Complete</Button>
            </Stack>
          </>
        )}
        {isHistory && (
          <Typography sx={{ fontSize: 11, color: '#9CA3AF', mt: 1 }}>
            Delivered At: {new Date(order.deliveredAt).toLocaleString('en-IN')}
          </Typography>
        )}
      </Paper>
    );
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F9FAFB', pb: 10 }}>
      {/* Header */}
      <Paper elevation={0} sx={{ p: 2, borderRadius: 0, bgcolor: '#fff', borderBottom: '1px solid #E5E7EB', position: 'sticky', top: 0, zIndex: 10 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Avatar sx={{ bgcolor: '#E65100', width: 36, height: 36 }}><DirectionsBike fontSize="small" /></Avatar>
            <Box>
              <Typography sx={{ fontWeight: 900, fontSize: 16 }}>{userInfo?.name || 'Partner'}</Typography>
              <Typography sx={{ color: '#6B7280', fontSize: 11, fontWeight: 700 }}>Rice Mill Express</Typography>
            </Box>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: isOnline ? '#16A34A' : '#9CA3AF' }} />
            <Switch checked={isOnline} onChange={e => setIsOnline(e.target.checked)} color="success" size="small" />
          </Stack>
        </Stack>
      </Paper>

      <Container maxWidth="md" sx={{ pt: 3 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
        {/* HOME TAB */}
        {tabValue === 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Typography sx={{ fontWeight: 900, fontSize: 18, mb: 2 }}>Active Deliveries ({activeOrders.length})</Typography>
            {loading ? <LinearProgress sx={{ borderRadius: 999 }} /> : (
              activeOrders.length === 0 ? (
                <Paper elevation={0} sx={{ p: 4, textAlign: 'center', borderRadius: 4, border: '1px dashed #D1D5DB' }}>
                  <LocalShipping sx={{ fontSize: 48, color: '#D1D5DB', mb: 1 }} />
                  <Typography sx={{ color: '#6B7280', fontWeight: 700 }}>No active deliveries.</Typography>
                </Paper>
              ) : activeOrders.map(o => <OrderCard key={o._id} order={o} />)
            )}
          </motion.div>
        )}

        {/* HISTORY TAB */}
        {tabValue === 1 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Typography sx={{ fontWeight: 900, fontSize: 18, mb: 2 }}>Order History ({completedOrders.length})</Typography>
            {loading ? <LinearProgress /> : (
              completedOrders.length === 0 ? (
                <Typography sx={{ textAlign: 'center', color: '#6B7280', mt: 4, fontWeight: 600 }}>No history found.</Typography>
              ) : completedOrders.map(o => <OrderCard key={o._id} order={o} isHistory />)
            )}
          </motion.div>
        )}

        {/* WALLET / EARNINGS TAB */}
        {tabValue === 2 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Typography sx={{ fontWeight: 900, fontSize: 18, mb: 2 }}>Wallet & Earnings</Typography>
            
            <Stack direction="row" spacing={1} sx={{ mb: 2, overflowX: 'auto', pb: 1 }}>
              {[['today', 'Today'], ['week', 'Week'], ['month', 'Month'], ['custom', 'Custom']].map(([val, lbl]) => (
                <Chip key={val} label={lbl} onClick={() => setEarningsRange(val)} sx={{ fontWeight: 800, bgcolor: earningsRange === val ? '#E65100' : '#F3F4F6', color: earningsRange === val ? '#fff' : '#4B5563' }} />
              ))}
            </Stack>

            {earningsRange === 'custom' && (
              <Stack direction="row" spacing={2} mb={3}>
                <TextField type="date" size="small" label="From" value={customDateFrom} onChange={e => setCustomDateFrom(e.target.value)} InputLabelProps={{ shrink: true }} />
                <TextField type="date" size="small" label="To" value={customDateTo} onChange={e => setCustomDateTo(e.target.value)} InputLabelProps={{ shrink: true }} />
              </Stack>
            )}

            <Grid container spacing={2} mb={3}>
              <Grid item xs={12} sm={6}>
                <Paper elevation={0} sx={{ p: 3, borderRadius: 4, bgcolor: '#E65100', color: '#fff', textAlign: 'center' }}>
                  <Typography sx={{ fontWeight: 800, fontSize: 12, opacity: 0.9, textTransform: 'uppercase' }}>Total Payment Received</Typography>
                  <Typography sx={{ fontSize: 36, fontWeight: 900 }}>₹{earningsValue.toLocaleString()}</Typography>
                  <Typography sx={{ fontSize: 12, opacity: 0.8 }}>From {filteredEarningsOrders.length} deliveries</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid #E5E7EB', textAlign: 'center' }}>
                  <Typography sx={{ fontWeight: 800, fontSize: 12, color: '#6B7280', textTransform: 'uppercase' }}>Floating Cash (COD)</Typography>
                  <Typography sx={{ fontSize: 36, fontWeight: 900, color: '#111827' }}>₹{cashInHand.toLocaleString()}</Typography>
                </Paper>
              </Grid>
            </Grid>

            {/* Real-time Incentives */}
            <Typography sx={{ fontWeight: 900, fontSize: 16, mb: 1.5 }}>Active Incentives</Typography>
            {incentives.map(inc => (
              <Paper key={inc.id} elevation={0} sx={{ p: 2, mb: 2, borderRadius: 3, border: `1px solid ${inc.color}40` }}>
                <Stack direction="row" justifyContent="space-between" mb={1}>
                  <Typography sx={{ fontWeight: 800, color: inc.color }}>{inc.title}</Typography>
                  <Typography sx={{ fontWeight: 900 }}>+₹{inc.bonus}</Typography>
                </Stack>
                <LinearProgress variant="determinate" value={Math.min(100, (inc.current / inc.target) * 100)} sx={{ height: 8, borderRadius: 999, mb: 1, bgcolor: `${inc.color}20`, '& .MuiLinearProgress-bar': { bgcolor: inc.color } }} />
                <Typography sx={{ fontSize: 12, color: '#6B7280', fontWeight: 600 }}>{inc.current} / {inc.target} completed {inc.isAchieved && '🎉 Achieved!'}</Typography>
              </Paper>
            ))}
          </motion.div>
        )}

        {/* SETTINGS TAB */}
        {tabValue === 3 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Typography sx={{ fontWeight: 900, fontSize: 18, mb: 2 }}>Settings</Typography>
            <Paper elevation={0} sx={{ borderRadius: 4, border: '1px solid #E5E7EB' }}>
              
              <Box p={2.5}>
                <Typography sx={{ fontWeight: 800, fontSize: 14, mb: 1.5 }}>Language</Typography>
                <FormControl fullWidth size="small">
                  <Select value={dpSettings.language} onChange={e => saveSettings({ ...dpSettings, language: e.target.value })}>
                    <MenuItem value="en">English</MenuItem>
                    <MenuItem value="hi">हिंदी (Hindi)</MenuItem>
                    <MenuItem value="ta">தமிழ் (Tamil)</MenuItem>
                    <MenuItem value="te">తెలుగు (Telugu)</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Divider />

              <Box p={2.5}>
                <Typography sx={{ fontWeight: 800, fontSize: 14, mb: 1.5 }}>Theme</Typography>
                <FormControl fullWidth size="small">
                  <Select value={dpSettings.theme} onChange={e => saveSettings({ ...dpSettings, theme: e.target.value })}>
                    <MenuItem value="light">Light Mode</MenuItem>
                    <MenuItem value="dark">Dark Mode</MenuItem>
                    <MenuItem value="system">System Default</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Divider />

              <Box p={2.5}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography sx={{ fontWeight: 800, fontSize: 14 }}>Push Notifications</Typography>
                    <Typography sx={{ fontSize: 12, color: '#6B7280' }}>Get alerts for new orders</Typography>
                  </Box>
                  <Switch checked={dpSettings.notifications} onChange={e => saveSettings({ ...dpSettings, notifications: e.target.checked })} color="primary" />
                </Stack>
              </Box>
              
            </Paper>
          </motion.div>
        )}
      </Container>

      {/* Bottom Navigation */}
      <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50 }} elevation={8}>
        <BottomNavigation showLabels value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ height: 65, '& .Mui-selected': { color: '#E65100' } }}>
          <BottomNavigationAction label="Home" icon={<Home />} />
          <BottomNavigationAction label="History" icon={<History />} />
          <BottomNavigationAction label="Wallet" icon={<AccountBalanceWallet />} />
          <BottomNavigationAction label="Settings" icon={<Settings />} />
        </BottomNavigation>
      </Paper>

      {/* Modals */}
      {showPhotoModal && selectedOrder && (
        <DeliveryPhotoConfirmation
          orderId={selectedOrder._id}
          open={showPhotoModal}
          onClose={() => setShowPhotoModal(false)}
          onSuccess={handleDeliverySuccess}
          requireSignature={false}
        />
      )}
    </Box>
  );
};

export default DeliveryDashboard;
