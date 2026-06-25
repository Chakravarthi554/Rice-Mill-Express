import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import {
  AccountBalanceWallet,
  AttachMoney,
  Chat,
  CheckCircle,
  DateRange,
  DirectionsBike,
  EmojiEvents,
  History,
  Home,
  Language,
  LocalShipping,
  Navigation,
  Notifications,
  NotificationsOff,
  Person,
  Phone,
  Route,
  Settings,
  Star,
  Timeline,
  WbSunny,
  NightsStay,
  SettingsBrightness,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import axios from 'axios';
import DeliveryPhotoConfirmation from '../components/delivery/DeliveryPhotoConfirmation';

const MotionPaper = motion(Paper);

const mockOrders = [
  { _id: 'mock-1', orderNumber: 'RM240301-001', orderStatus: 'shipped', user: { name: 'Rahul Sharma', phone: '+91 98765 43210' }, shippingAddress: { street: '12B, Green Valley Apt', city: 'Chennai' }, totalPrice: 1250, paymentMethod: 'cod', orderItems: [{ name: 'Sona Masoori 25kg', qty: 2 }] },
  { _id: 'mock-2', orderNumber: 'RM240301-002', orderStatus: 'out_for_delivery', user: { name: 'Priya Patel', phone: '+91 98765 12345' }, shippingAddress: { street: '45C, Park Avenue', city: 'Chennai' }, totalPrice: 2450, paymentMethod: 'prepaid', orderItems: [{ name: 'Basmati Gold 10kg', qty: 1 }] },
];

const mockCompletedOrders = [
  { _id: 'hist-1', orderNumber: 'RM240228-009', orderStatus: 'delivered', user: { name: 'Kiran Kumar' }, totalPrice: 1800, paymentMethod: 'prepaid', deliveredAt: new Date(Date.now() - 3600000), orderItems: [{ name: 'Kolam Rice 10kg', qty: 2 }] },
  { _id: 'hist-2', orderNumber: 'RM240228-010', orderStatus: 'delivered', user: { name: 'Sunita Rao' }, totalPrice: 3200, paymentMethod: 'cod', deliveredAt: new Date(Date.now() - 7200000), orderItems: [{ name: 'Basmati 5kg', qty: 3 }] },
  { _id: 'hist-3', orderNumber: 'RM240227-003', orderStatus: 'cancelled', user: { name: 'Mohan Das' }, totalPrice: 950, paymentMethod: 'prepaid', deliveredAt: new Date(Date.now() - 86400000), orderItems: [{ name: 'Brown Rice 2kg', qty: 1 }] },
];

const StatCard = ({ icon: Icon, label, value, helper, color = '#E65100' }) => (
  <MotionPaper whileHover={{ y: -4 }} elevation={0} sx={{ p: 2.5, borderRadius: 4, bgcolor: '#fff', border: '1px solid #FFE2C2', boxShadow: '0 8px 24px rgba(15,23,42,0.05)', height: '100%' }}>
    <Stack direction="row" alignItems="center" justifyContent="space-between">
      <Box sx={{ width: 44, height: 44, borderRadius: 3, display: 'grid', placeItems: 'center', bgcolor: `${color}18`, color }}><Icon /></Box>
      <Chip label={helper} size="small" sx={{ bgcolor: '#FFF7ED', color: '#9A3412', fontWeight: 800, fontSize: 11 }} />
    </Stack>
    <Typography sx={{ mt: 2, color: '#6B7280', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</Typography>
    <Typography sx={{ mt: 0.5, color: '#111827', fontSize: 28, fontWeight: 950, letterSpacing: '-0.04em' }}>{value}</Typography>
  </MotionPaper>
);

const DeliveryDashboard = () => {
  const { userInfo } = useSelector((state) => state.userLogin || {});
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  const [showIncomingRequest, setShowIncomingRequest] = useState(true);
  const [earningsRange, setEarningsRange] = useState('today');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');

  // Settings state (persisted in localStorage)
  const [dpSettings, setDpSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('dp_settings');
      return saved ? JSON.parse(saved) : { language: 'en', theme: 'system', notifications: { orders: true, payments: true, promotions: false } };
    } catch { return { language: 'en', theme: 'system', notifications: { orders: true, payments: true, promotions: false } }; }
  });

  const saveSettings = (newSettings) => {
    setDpSettings(newSettings);
    localStorage.setItem('dp_settings', JSON.stringify(newSettings));
  };

  const fetchMyDeliveries = async () => {
    try {
      setLoading(true);
      const token = userInfo?.accessToken || userInfo?.token;
      if (!token) { setLoading(false); return; }
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const { data } = await axios.get('/api/delivery-partners/my-deliveries', config);
      setOrders(data.orders || []);
      setError('');
    } catch (err) {
      console.error('Fetch deliveries error:', err);
      setError(err.response?.data?.message || 'Failed to fetch deliveries');
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

  const displayOrders = orders.length ? orders : mockOrders;
  const activeOrders = displayOrders.filter(o => o.orderStatus === 'out_for_delivery' || o.orderStatus === 'shipped');
  const completedOrders = [...(orders.filter(o => o.orderStatus === 'delivered')), ...(orders.length === 0 ? mockCompletedOrders : [])];

  const stats = useMemo(() => ({
    active: activeOrders.length || 2,
    delivered: completedOrders.length || 8,
    cashInHand: displayOrders.filter(o => o.paymentMethod === 'cod' && !o.codSettled).reduce((a, o) => a + (o.totalPrice || 0), 0) || 4250,
    earnings: { today: 1250, week: 7840, month: 28500 },
    acceptance: '94%',
    rating: '4.8',
  }), [activeOrders.length, completedOrders.length, displayOrders]);

  const cashPercent = Math.min(100, Math.round((stats.cashInHand / 5000) * 100));

  const earningsValue = earningsRange === 'today' ? stats.earnings.today
    : earningsRange === 'week' ? stats.earnings.week
    : earningsRange === 'month' ? stats.earnings.month
    : stats.earnings.today;

  // Incentives data
  const incentives = [
    { title: 'Daily Goal', target: 15, current: 8, bonus: 200, period: 'today', color: '#16A34A' },
    { title: 'Weekly Streak', target: 80, current: 52, bonus: 1000, period: 'this week', color: '#2563EB' },
    { title: 'Monthly Champion', target: 300, current: 198, bonus: 5000, period: 'this month', color: '#7C3AED' },
  ];

  const LANGS = [{ value: 'en', label: 'English' }, { value: 'hi', label: 'हिंदी' }, { value: 'ta', label: 'தமிழ்' }, { value: 'te', label: 'తెలుగు' }];
  const THEMES = [
    { value: 'light', label: 'Light', icon: <WbSunny fontSize="small" /> },
    { value: 'dark', label: 'Dark', icon: <NightsStay fontSize="small" /> },
    { value: 'system', label: 'System', icon: <SettingsBrightness fontSize="small" /> },
  ];

  const OrderCard = ({ order }) => {
    const isPrepaid = order.paymentMethod?.toLowerCase() !== 'cod';
    return (
      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 4, border: '1px solid #FFE2C2', bgcolor: '#fff', boxShadow: '0 8px 20px rgba(15,23,42,0.04)', mb: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
          <Box>
            <Typography sx={{ color: '#E65100', fontWeight: 950, fontSize: 15 }}>#{order.orderNumber || order._id?.slice(-6)?.toUpperCase()}</Typography>
            <Typography sx={{ color: '#6B7280', fontWeight: 700, fontSize: 13 }}>{order.orderItems?.[0]?.name || 'Rice delivery'} • ₹{order.totalPrice}</Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Chip label={isPrepaid ? 'PREPAID' : 'COD'} size="small" sx={{ bgcolor: isPrepaid ? '#E0F2FE' : '#FEE2E2', color: isPrepaid ? '#0369A1' : '#DC2626', fontWeight: 900 }} />
          </Stack>
        </Stack>
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ color: '#9CA3AF', fontSize: 10, fontWeight: 800, textTransform: 'uppercase' }}>Pickup</Typography>
            <Typography sx={{ color: '#111827', fontWeight: 800, fontSize: 13 }}>Sharma Rice Mill</Typography>
            <Typography sx={{ color: '#6B7280', fontSize: 12 }}>45, Industrial Area, Chennai</Typography>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ color: '#9CA3AF', fontSize: 10, fontWeight: 800, textTransform: 'uppercase' }}>Drop</Typography>
            <Typography sx={{ color: '#111827', fontWeight: 800, fontSize: 13 }}>{order.user?.name || 'Customer'}</Typography>
            <Typography sx={{ color: '#6B7280', fontSize: 12 }}>{order.shippingAddress?.street || 'Delivery address'}, {order.shippingAddress?.city || 'Chennai'}</Typography>
          </Box>
          <Stack spacing={1}>
            <IconButton size="small" sx={{ bgcolor: '#FFF3E0', color: '#E65100' }}><Phone fontSize="small" /></IconButton>
            <IconButton size="small" sx={{ bgcolor: '#F0FDF4', color: '#16A34A' }}><Chat fontSize="small" /></IconButton>
          </Stack>
        </Stack>
        <Divider sx={{ mb: 2 }} />
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={1} alignItems="center">
            <Navigation sx={{ color: '#E65100', fontSize: 18 }} />
            <Typography sx={{ color: '#374151', fontWeight: 700, fontSize: 13 }}>2.5 km pickup • 4.2 km drop • ETA 28 min</Typography>
          </Stack>
          <Button variant="contained" size="small" onClick={() => handleOpenDeliveryModal(order)} sx={{ bgcolor: '#E65100', borderRadius: 999, px: 2.5, fontWeight: 900, textTransform: 'none', '&:hover': { bgcolor: '#BF360C' } }}>
            Confirm Delivery
          </Button>
        </Stack>
      </Paper>
    );
  };

  const HistoryCard = ({ order }) => {
    const isDelivered = order.orderStatus === 'delivered';
    return (
      <Paper elevation={0} sx={{ p: 2, borderRadius: 4, border: `1px solid ${isDelivered ? '#BBF7D0' : '#FEE2E2'}`, bgcolor: '#fff', mb: 1.5 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: 14, color: '#111827' }}>#{order.orderNumber || order._id?.slice(-6)?.toUpperCase()}</Typography>
            <Typography sx={{ fontSize: 12, color: '#6B7280' }}>{order.orderItems?.[0]?.name} • ₹{order.totalPrice}</Typography>
            <Typography sx={{ fontSize: 11, color: '#9CA3AF', mt: 0.5 }}>
              {order.deliveredAt ? new Date(order.deliveredAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
            </Typography>
          </Box>
          <Chip
            label={isDelivered ? 'Delivered' : 'Cancelled'}
            size="small"
            sx={{ bgcolor: isDelivered ? '#DCFCE7' : '#FEE2E2', color: isDelivered ? '#15803D' : '#DC2626', fontWeight: 800 }}
          />
        </Stack>
      </Paper>
    );
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#FFF8F1' }}>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Box sx={{ width: 44, height: 44, borderRadius: 3, bgcolor: '#E65100', display: 'grid', placeItems: 'center' }}>
              <DirectionsBike sx={{ color: '#fff', fontSize: 24 }} />
            </Box>
            <Box>
              <Typography sx={{ color: '#111827', fontSize: 22, fontWeight: 950, letterSpacing: '-0.03em' }}>Delivery Partner</Typography>
              <Typography sx={{ color: '#9A3412', fontSize: 12, fontWeight: 700 }}>Rice Mill Express</Typography>
            </Box>
          </Stack>
          <Paper elevation={0} sx={{ px: 2, py: 1, borderRadius: 999, border: '1px solid #FED7AA', bgcolor: '#fff' }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: isOnline ? '#16A34A' : '#9CA3AF' }} />
              <Typography sx={{ fontWeight: 800, color: isOnline ? '#16A34A' : '#6B7280', fontSize: 13 }}>{isOnline ? 'Online' : 'Offline'}</Typography>
              <Switch checked={isOnline} onChange={e => setIsOnline(e.target.checked)} color="success" size="small" />
            </Stack>
          </Paper>
        </Stack>

        {error && <Alert severity="warning" sx={{ mb: 2, borderRadius: 3 }}>{error} — showing sample data.</Alert>}

        {/* Tab Navigation */}
        <Paper elevation={0} sx={{ mb: 3, p: 0.5, borderRadius: 999, border: '1px solid #FED7AA', bgcolor: '#fff', display: 'inline-flex' }}>
          <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ minHeight: 40, '& .MuiTabs-indicator': { display: 'none' }, '& .MuiTab-root': { minHeight: 40, borderRadius: 999, px: 2.5, fontWeight: 800, textTransform: 'none', color: '#9A3412', fontSize: 13 }, '& .Mui-selected': { bgcolor: '#E65100', color: '#fff !important' } }}>
            <Tab icon={<Home sx={{ fontSize: 16 }} />} iconPosition="start" label="Home" />
            <Tab icon={<History sx={{ fontSize: 16 }} />} iconPosition="start" label="History" />
            <Tab icon={<AttachMoney sx={{ fontSize: 16 }} />} iconPosition="start" label="Earnings" />
            <Tab icon={<EmojiEvents sx={{ fontSize: 16 }} />} iconPosition="start" label="Incentives" />
            <Tab icon={<AccountBalanceWallet sx={{ fontSize: 16 }} />} iconPosition="start" label="Wallet" />
            <Tab icon={<Person sx={{ fontSize: 16 }} />} iconPosition="start" label="Profile" />
            <Tab icon={<Settings sx={{ fontSize: 16 }} />} iconPosition="start" label="Settings" />
          </Tabs>
        </Paper>

        {/* HOME TAB */}
        {tabValue === 0 && (
          <Grid container spacing={3}>
            <Grid item md={8.5}>
              {/* Stats */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6} md={3}><StatCard icon={AttachMoney} label="Today's Earnings" value={`₹${stats.earnings.today}`} helper="8 trips" /></Grid>
                <Grid item xs={6} md={3}><StatCard icon={LocalShipping} label="Active Orders" value={stats.active} helper="Live" color="#2563EB" /></Grid>
                <Grid item xs={6} md={3}><StatCard icon={CheckCircle} label="Acceptance" value={stats.acceptance} helper="Good" color="#16A34A" /></Grid>
                <Grid item xs={6} md={3}><StatCard icon={Star} label="Rating" value={stats.rating} helper="Top" color="#F59E0B" /></Grid>
              </Grid>

              {/* Incoming Request */}
              {showIncomingRequest && (
                <Paper elevation={0} sx={{ p: 2.5, mb: 3, borderRadius: 4, border: '2px solid #E65100', bgcolor: '#fff' }}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip label="New Request" sx={{ bgcolor: '#FFEDD5', color: '#C2410C', fontWeight: 900, fontSize: 12 }} />
                      <Typography sx={{ fontFamily: 'monospace', color: '#E65100', fontWeight: 900 }}>00:25</Typography>
                    </Stack>
                    <Typography sx={{ color: '#16A34A', fontSize: 22, fontWeight: 950 }}>₹45</Typography>
                  </Stack>
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }} justifyContent="space-between">
                    <Stack spacing={1}>
                      <Stack direction="row" spacing={1} alignItems="center"><Route sx={{ color: '#E65100', fontSize: 18 }} /><Typography sx={{ fontWeight: 800, fontSize: 13 }}>2.5 km — Sharma Rice Mill</Typography></Stack>
                      <Stack direction="row" spacing={1} alignItems="center"><Navigation sx={{ color: '#16A34A', fontSize: 18 }} /><Typography sx={{ fontWeight: 800, fontSize: 13 }}>4.2 km — Green Valley Apt</Typography></Stack>
                    </Stack>
                    <Stack direction="row" spacing={1.5}>
                      <Button variant="contained" size="small" onClick={() => setShowIncomingRequest(false)} sx={{ bgcolor: '#16A34A', borderRadius: 999, px: 3, fontWeight: 900, textTransform: 'none' }}>Accept</Button>
                      <Button variant="outlined" size="small" onClick={() => setShowIncomingRequest(false)} sx={{ borderColor: '#DC2626', color: '#DC2626', borderRadius: 999, px: 3, fontWeight: 900, textTransform: 'none' }}>Decline</Button>
                    </Stack>
                  </Stack>
                </Paper>
              )}

              {/* Active Orders */}
              <Typography sx={{ color: '#111827', fontSize: 18, fontWeight: 900, mb: 2 }}>
                Active Deliveries
                <Chip label={`${activeOrders.length} assigned`} size="small" sx={{ ml: 1.5, bgcolor: '#FFF7ED', color: '#9A3412', fontWeight: 800 }} />
              </Typography>
              {loading ? <LinearProgress sx={{ borderRadius: 999 }} /> : activeOrders.map(order => <OrderCard key={order._id} order={order} />)}
            </Grid>

            <Grid item md={3.5}>
              <Stack spacing={3}>
                {/* Floating Cash */}
                <Paper elevation={0} sx={{ p: 3, borderRadius: 5, bgcolor: '#fff', border: '1px solid #FED7AA' }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                    <Typography sx={{ fontWeight: 900, fontSize: 16 }}>Cash in Hand</Typography>
                    <Chip label={`${cashPercent}%`} size="small" sx={{ bgcolor: '#FFEDD5', color: '#C2410C', fontWeight: 900 }} />
                  </Stack>
                  <Typography sx={{ color: '#E65100', fontSize: 32, fontWeight: 950, letterSpacing: '-0.04em' }}>₹{stats.cashInHand}</Typography>
                  <LinearProgress variant="determinate" value={cashPercent} sx={{ height: 8, borderRadius: 999, my: 1.5, bgcolor: '#FFEDD5', '& .MuiLinearProgress-bar': { bgcolor: '#E65100' } }} />
                  <Typography sx={{ color: '#DC2626', fontWeight: 700, fontSize: 12 }}>Remit to receive more COD orders</Typography>
                  <Button fullWidth variant="contained" onClick={() => setTabValue(4)} sx={{ mt: 2, bgcolor: '#E65100', borderRadius: 999, fontWeight: 900, textTransform: 'none' }}>Remit Now</Button>
                </Paper>

                {/* Quick Stats */}
                <Paper elevation={0} sx={{ p: 3, borderRadius: 5, bgcolor: '#111827', color: '#fff' }}>
                  <Typography sx={{ color: '#FDBA74', fontWeight: 900, fontSize: 13, textTransform: 'uppercase', mb: 1.5 }}>Today's Progress</Typography>
                  <Stack spacing={1.5}>
                    {[['Deliveries', '8 of 15'], ['On Time', '7 (87.5%)'], ['Distance', '42 km']].map(([k, v]) => (
                      <Stack key={k} direction="row" justifyContent="space-between">
                        <Typography sx={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: 700 }}>{k}</Typography>
                        <Typography sx={{ fontWeight: 900, fontSize: 13 }}>{v}</Typography>
                      </Stack>
                    ))}
                  </Stack>
                </Paper>
              </Stack>
            </Grid>
          </Grid>
        )}

        {/* HISTORY TAB */}
        {tabValue === 1 && (
          <Box>
            <Typography sx={{ fontSize: 20, fontWeight: 900, mb: 3, color: '#111827' }}>Order History</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                {loading ? <LinearProgress /> : completedOrders.length === 0 ? (
                  <Paper elevation={0} sx={{ p: 4, borderRadius: 4, textAlign: 'center', border: '1px dashed #FED7AA' }}>
                    <History sx={{ fontSize: 48, color: '#FED7AA', mb: 1 }} />
                    <Typography sx={{ color: '#6B7280', fontWeight: 700 }}>No completed deliveries yet</Typography>
                  </Paper>
                ) : completedOrders.map(order => <HistoryCard key={order._id} order={order} />)}
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper elevation={0} sx={{ p: 3, borderRadius: 5, bgcolor: '#fff', border: '1px solid #FED7AA' }}>
                  <Typography sx={{ fontWeight: 900, mb: 2 }}>Summary</Typography>
                  {[['Total Delivered', completedOrders.filter(o => o.orderStatus === 'delivered').length], ['Cancelled', completedOrders.filter(o => o.orderStatus === 'cancelled').length], ['Avg. Rating', '4.8 ⭐']].map(([k, v]) => (
                    <Stack key={k} direction="row" justifyContent="space-between" sx={{ py: 1, borderBottom: '1px solid #F3F4F6' }}>
                      <Typography sx={{ color: '#6B7280', fontWeight: 700, fontSize: 13 }}>{k}</Typography>
                      <Typography sx={{ fontWeight: 900, fontSize: 13 }}>{v}</Typography>
                    </Stack>
                  ))}
                </Paper>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* EARNINGS TAB */}
        {tabValue === 2 && (
          <Box>
            <Typography sx={{ fontSize: 20, fontWeight: 900, mb: 3, color: '#111827' }}>Earnings Dashboard</Typography>
            {/* Range Selector */}
            <Stack direction="row" spacing={1.5} sx={{ mb: 3, flexWrap: 'wrap' }}>
              {[['today', 'Today'], ['week', 'This Week'], ['month', 'This Month'], ['custom', 'Custom Range']].map(([v, l]) => (
                <Chip key={v} label={l} onClick={() => setEarningsRange(v)} sx={{ fontWeight: 800, cursor: 'pointer', bgcolor: earningsRange === v ? '#E65100' : '#FFF7ED', color: earningsRange === v ? '#fff' : '#9A3412' }} />
              ))}
            </Stack>
            {earningsRange === 'custom' && (
              <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                <TextField type="date" size="small" label="From" value={customDateFrom} onChange={e => setCustomDateFrom(e.target.value)} InputLabelProps={{ shrink: true }} />
                <TextField type="date" size="small" label="To" value={customDateTo} onChange={e => setCustomDateTo(e.target.value)} InputLabelProps={{ shrink: true }} />
              </Stack>
            )}
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Paper elevation={0} sx={{ p: 3, borderRadius: 5, bgcolor: '#E65100', color: '#fff', textAlign: 'center' }}>
                  <Typography sx={{ fontWeight: 900, opacity: 0.85, fontSize: 13, textTransform: 'uppercase', mb: 1 }}>
                    {earningsRange === 'today' ? "Today's Earnings" : earningsRange === 'week' ? 'Weekly Earnings' : earningsRange === 'month' ? 'Monthly Earnings' : 'Custom Range'}
                  </Typography>
                  <Typography sx={{ fontSize: 48, fontWeight: 950, letterSpacing: '-0.05em' }}>₹{earningsValue.toLocaleString()}</Typography>
                  <Typography sx={{ opacity: 0.75, fontSize: 13 }}>{earningsRange === 'today' ? '8 deliveries' : earningsRange === 'week' ? '52 deliveries' : '198 deliveries'}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={8}>
                <Paper elevation={0} sx={{ p: 3, borderRadius: 5, bgcolor: '#fff', border: '1px solid #FED7AA' }}>
                  <Typography sx={{ fontWeight: 900, mb: 2 }}>Breakdown</Typography>
                  {[['Base Earnings', `₹${Math.round(earningsValue * 0.75).toLocaleString()}`], ['Incentive Bonus', `₹${Math.round(earningsValue * 0.15).toLocaleString()}`], ['Tips', `₹${Math.round(earningsValue * 0.05).toLocaleString()}`], ['Fuel Allowance', `₹${Math.round(earningsValue * 0.05).toLocaleString()}`]].map(([k, v]) => (
                    <Stack key={k} direction="row" justifyContent="space-between" sx={{ py: 1.5, borderBottom: '1px solid #F3F4F6' }}>
                      <Typography sx={{ color: '#374151', fontWeight: 700 }}>{k}</Typography>
                      <Typography sx={{ fontWeight: 900, color: '#16A34A' }}>{v}</Typography>
                    </Stack>
                  ))}
                  <Stack direction="row" justifyContent="space-between" sx={{ pt: 2 }}>
                    <Typography sx={{ fontWeight: 900 }}>Total</Typography>
                    <Typography sx={{ fontWeight: 950, fontSize: 18, color: '#E65100' }}>₹{earningsValue.toLocaleString()}</Typography>
                  </Stack>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* INCENTIVES TAB */}
        {tabValue === 3 && (
          <Box>
            <Typography sx={{ fontSize: 20, fontWeight: 900, mb: 1, color: '#111827' }}>Incentives & Rewards</Typography>
            <Typography sx={{ color: '#6B7280', fontSize: 14, mb: 3 }}>Complete challenges to earn bonus rewards</Typography>
            <Grid container spacing={3}>
              {incentives.map(inc => (
                <Grid item xs={12} md={4} key={inc.title}>
                  <Paper elevation={0} sx={{ p: 3, borderRadius: 5, bgcolor: '#fff', border: `1px solid ${inc.color}30` }}>
                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                      <EmojiEvents sx={{ color: inc.color, fontSize: 28 }} />
                      <Box>
                        <Typography sx={{ fontWeight: 900, fontSize: 16 }}>{inc.title}</Typography>
                        <Typography sx={{ color: '#6B7280', fontSize: 12 }}>{inc.period}</Typography>
                      </Box>
                    </Stack>
                    <Typography sx={{ color: '#16A34A', fontSize: 28, fontWeight: 950, mb: 1 }}>₹{inc.bonus} Bonus</Typography>
                    <LinearProgress variant="determinate" value={Math.round((inc.current / inc.target) * 100)} sx={{ height: 10, borderRadius: 999, mb: 1, bgcolor: `${inc.color}20`, '& .MuiLinearProgress-bar': { bgcolor: inc.color } }} />
                    <Stack direction="row" justifyContent="space-between">
                      <Typography sx={{ fontSize: 12, color: '#6B7280', fontWeight: 700 }}>{inc.current} / {inc.target} deliveries</Typography>
                      <Typography sx={{ fontSize: 12, fontWeight: 900, color: inc.color }}>{Math.round((inc.current / inc.target) * 100)}%</Typography>
                    </Stack>
                  </Paper>
                </Grid>
              ))}
              <Grid item xs={12}>
                <Paper elevation={0} sx={{ p: 3, borderRadius: 5, bgcolor: '#FFF7ED', border: '1px solid #FED7AA' }}>
                  <Typography sx={{ fontWeight: 900, mb: 2 }}>Incentive Rules</Typography>
                  <Grid container spacing={2}>
                    {[['Daily Goal (15 trips)', '₹200 bonus'], ['On-Time Rate > 90%', '₹100 extra'], ['Weekly Streak (80 trips)', '₹1000 bonus'], ['5-Star Rating', '₹50 per 5-star'], ['Zero Cancellations', '₹300 weekly'], ['Monthly Champion (300 trips)', '₹5000 grand reward']].map(([rule, reward]) => (
                      <Grid item xs={12} sm={6} md={4} key={rule}>
                        <Stack direction="row" spacing={1.5} alignItems="flex-start">
                          <CheckCircle sx={{ color: '#16A34A', fontSize: 18, mt: 0.2 }} />
                          <Box>
                            <Typography sx={{ fontWeight: 700, fontSize: 13 }}>{rule}</Typography>
                            <Typography sx={{ color: '#E65100', fontWeight: 900, fontSize: 13 }}>{reward}</Typography>
                          </Box>
                        </Stack>
                      </Grid>
                    ))}
                  </Grid>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* WALLET TAB */}
        {tabValue === 4 && (
          <Grid container spacing={3}>
            <Grid item md={4}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: 5, bgcolor: '#FFF3E0', border: '1px solid #FED7AA' }}>
                <Typography sx={{ color: '#9A3412', fontWeight: 900, textTransform: 'uppercase', fontSize: 12 }}>Cash to Remit</Typography>
                <Typography sx={{ color: '#E65100', fontSize: 44, fontWeight: 950, letterSpacing: '-0.05em', my: 1 }}>₹{stats.cashInHand}</Typography>
                <LinearProgress variant="determinate" value={cashPercent} sx={{ height: 10, borderRadius: 999, bgcolor: '#FFEDD5', '& .MuiLinearProgress-bar': { bgcolor: '#E65100' } }} />
                <Button fullWidth variant="contained" sx={{ mt: 3, bgcolor: '#16A34A', borderRadius: 999, fontWeight: 900, textTransform: 'none' }}>I Have Paid</Button>
              </Paper>
            </Grid>
            <Grid item md={4}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: 5, bgcolor: '#fff', border: '1px solid #FED7AA', minHeight: 280, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
                <Box>
                  <Box sx={{ width: 160, height: 160, borderRadius: 4, border: '2px dashed #E65100', display: 'grid', placeItems: 'center', color: '#E65100', fontWeight: 900, fontSize: 24, mx: 'auto', mb: 2 }}>QR</Box>
                  <Typography sx={{ color: '#6B7280', fontWeight: 700, fontSize: 13 }}>Scan with GPay, PhonePe or Paytm to pay ₹{stats.cashInHand}</Typography>
                </Box>
              </Paper>
            </Grid>
            <Grid item md={4}>
              <Stack spacing={1.5}>
                {[['UPI Remittance', 'Today, 6:30 PM', '+₹3,100', 'Completed', '#16A34A'], ['Cash Deposit', 'Yesterday, 8:15 PM', '+₹4,500', 'Pending', '#E65100'], ['UPI Payment', 'Mar 19, 5:45 PM', '+₹2,800', 'Failed', '#DC2626']].map(([title, date, amount, status, color]) => (
                  <Paper key={title} elevation={0} sx={{ p: 2, borderRadius: 4, bgcolor: '#fff', border: '1px solid #FED7AA' }}>
                    <Stack direction="row" justifyContent="space-between">
                      <Box><Typography sx={{ fontWeight: 900, fontSize: 14 }}>{title}</Typography><Typography sx={{ color: '#6B7280', fontSize: 12 }}>{date}</Typography></Box>
                      <Box textAlign="right"><Typography sx={{ color, fontWeight: 900, fontSize: 14 }}>{amount}</Typography><Chip label={status} size="small" sx={{ bgcolor: `${color}15`, color, fontWeight: 800, height: 20, mt: 0.5 }} /></Box>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            </Grid>
          </Grid>
        )}

        {/* PROFILE TAB */}
        {tabValue === 5 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: 5, bgcolor: '#fff', border: '1px solid #FED7AA' }}>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                  <Avatar sx={{ width: 60, height: 60, bgcolor: '#E65100', fontSize: 22 }}>{userInfo?.name?.[0] || 'R'}</Avatar>
                  <Box>
                    <Typography sx={{ fontSize: 20, fontWeight: 950 }}>{userInfo?.name || 'Rajesh Kumar'}</Typography>
                    <Typography sx={{ color: '#6B7280', fontWeight: 700, fontSize: 13 }}>DP-2403-001 • Bike TN-01-AB-1234</Typography>
                  </Box>
                </Stack>
                <Divider sx={{ mb: 2 }} />
                <Stack direction="row" spacing={2}>
                  {[['94%', 'Acceptance'], ['89%', 'On-time'], ['45', 'Compliments']].map(([v, l]) => (
                    <Box key={l} sx={{ flex: 1, p: 2, borderRadius: 3, bgcolor: '#FFF7ED', textAlign: 'center' }}>
                      <Typography sx={{ color: '#E65100', fontWeight: 950, fontSize: 18 }}>{v}</Typography>
                      <Typography sx={{ color: '#6B7280', fontWeight: 700, fontSize: 11 }}>{l}</Typography>
                    </Box>
                  ))}
                </Stack>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: 5, bgcolor: '#fff', border: '1px solid #FED7AA' }}>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                  <EmojiEvents sx={{ color: '#F59E0B', fontSize: 28 }} />
                  <Box>
                    <Typography sx={{ fontWeight: 900 }}>Daily Bonus Challenge</Typography>
                    <Typography sx={{ color: '#6B7280', fontSize: 13 }}>Complete 15 deliveries today</Typography>
                  </Box>
                </Stack>
                <Typography sx={{ color: '#16A34A', fontSize: 26, fontWeight: 950, mb: 2 }}>₹200 Bonus</Typography>
                <LinearProgress variant="determinate" value={53} sx={{ height: 10, borderRadius: 999, mb: 1, bgcolor: '#DCFCE7', '& .MuiLinearProgress-bar': { bgcolor: '#16A34A' } }} />
                <Typography sx={{ color: '#6B7280', fontWeight: 700, fontSize: 13 }}>8/15 deliveries completed</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: 5, bgcolor: '#111827', color: '#fff' }}>
                <Typography sx={{ fontWeight: 900, mb: 2 }}>Payout Status</Typography>
                <Stack spacing={2}>
                  <Box><Typography sx={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, fontWeight: 700 }}>Last Payout</Typography><Typography sx={{ fontWeight: 900 }}>₹12,400 on 28 Feb 2026</Typography></Box>
                  <Box><Typography sx={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, fontWeight: 700 }}>Next Payout</Typography><Typography sx={{ color: '#86EFAC', fontWeight: 950 }}>₹8,750 on 7 Mar 2026</Typography></Box>
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        )}

        {/* SETTINGS TAB */}
        {tabValue === 6 && (
          <Box>
            <Typography sx={{ fontSize: 20, fontWeight: 900, mb: 3, color: '#111827' }}>Settings</Typography>
            <Grid container spacing={3}>
              {/* Language */}
              <Grid item xs={12} md={6}>
                <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid #E5E7EB' }}>
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                    <Language sx={{ color: '#E65100' }} />
                    <Typography sx={{ fontWeight: 900, fontSize: 16 }}>Language</Typography>
                  </Stack>
                  <FormControl fullWidth size="small">
                    <InputLabel>Select Language</InputLabel>
                    <Select
                      value={dpSettings.language}
                      label="Select Language"
                      onChange={e => saveSettings({ ...dpSettings, language: e.target.value })}
                    >
                      {LANGS.map(l => <MenuItem key={l.value} value={l.value}>{l.label}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Paper>
              </Grid>

              {/* Theme */}
              <Grid item xs={12} md={6}>
                <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid #E5E7EB' }}>
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                    <SettingsBrightness sx={{ color: '#E65100' }} />
                    <Typography sx={{ fontWeight: 900, fontSize: 16 }}>Theme</Typography>
                  </Stack>
                  <Stack direction="row" spacing={1}>
                    {THEMES.map(t => (
                      <Paper key={t.value} elevation={0} onClick={() => saveSettings({ ...dpSettings, theme: t.value })} sx={{ flex: 1, p: 2, borderRadius: 3, textAlign: 'center', cursor: 'pointer', border: `2px solid ${dpSettings.theme === t.value ? '#E65100' : '#E5E7EB'}`, bgcolor: dpSettings.theme === t.value ? '#FFF7ED' : '#fff' }}>
                        {t.icon}
                        <Typography sx={{ fontSize: 12, fontWeight: 800, mt: 0.5, color: dpSettings.theme === t.value ? '#E65100' : '#374151' }}>{t.label}</Typography>
                      </Paper>
                    ))}
                  </Stack>
                </Paper>
              </Grid>

              {/* Notifications */}
              <Grid item xs={12}>
                <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: '1px solid #E5E7EB' }}>
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                    <Notifications sx={{ color: '#E65100' }} />
                    <Typography sx={{ fontWeight: 900, fontSize: 16 }}>Notification Preferences</Typography>
                  </Stack>
                  <Stack spacing={2}>
                    {[['orders', 'New Order Alerts', 'Get notified when a new delivery order is assigned'], ['payments', 'Payment Updates', 'Remittance reminders and payout confirmations'], ['promotions', 'Promotions & Incentives', 'Special bonuses and incentive updates']].map(([key, title, desc]) => (
                      <Stack key={key} direction="row" alignItems="center" justifyContent="space-between" sx={{ py: 1.5, borderBottom: '1px solid #F3F4F6' }}>
                        <Box>
                          <Typography sx={{ fontWeight: 800, fontSize: 14 }}>{title}</Typography>
                          <Typography sx={{ color: '#6B7280', fontSize: 12 }}>{desc}</Typography>
                        </Box>
                        <Switch
                          checked={dpSettings.notifications[key]}
                          onChange={e => saveSettings({ ...dpSettings, notifications: { ...dpSettings.notifications, [key]: e.target.checked } })}
                          color="warning"
                        />
                      </Stack>
                    ))}
                  </Stack>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Photo Confirmation Modal */}
        {showPhotoModal && selectedOrder && (
          <DeliveryPhotoConfirmation
            order={selectedOrder}
            onSuccess={handleDeliverySuccess}
            onCancel={() => { setShowPhotoModal(false); setSelectedOrder(null); }}
          />
        )}
      </Container>
    </Box>
  );
};

export default DeliveryDashboard;
