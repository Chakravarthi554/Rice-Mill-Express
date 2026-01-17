import React, { useEffect, useState } from 'react';
import {
  Grid,
  Typography,
  Card,
  CardContent,
  Box,
  Chip,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  LinearProgress,
  IconButton,
  Tooltip,
  Paper
} from '@mui/material';
import {
  People as PeopleIcon,
  ShoppingCart as ShoppingCartIcon,
  Store as StoreIcon,
  Person as PersonIcon,
  RestaurantMenu as RestaurantMenuIcon,
  Forum as ForumIcon,
  Payment as PaymentIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  RiceBowl as RiceBowlIcon,
  LocalShipping as LocalShippingIcon,
  Notifications as NotificationsIcon,
  Refresh as RefreshIcon,
  Security as SecurityIcon,
  Storage as StorageIcon,
  Backup as BackupIcon,
  AccessTime as AccessTimeIcon,
  ThumbUp as ThumbUpIcon,
  Comment as CommentIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip as ChartTooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { getDashboardStats, getRealTimeActivities } from '../../../redux/actions/adminActions';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, ChartTooltip, Legend);

const OverviewTab = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);

  const {
    stats = {},
    topSellingRice = [],
    topSellers = [],
    monthlyRevenue = [],
    growthPercentage = 0,
    systemHealth = {},
    loading
  } = useSelector((state) => state.adminDashboardStats);

  const { activities = [] } = useSelector((state) => state.adminActivities);

  const pendingModeration = stats.pendingModeration || {
    forumPosts: 0,
    recipes: 0,
    comments: 0
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    const dataInterval = setInterval(() => loadData(), 15000); // Poll every 15s

    return () => {
      clearInterval(interval);
      clearInterval(dataInterval);
    };
  }, []);

  const loadData = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        dispatch(getDashboardStats()),
        dispatch(getRealTimeActivities())
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleQuickAction = (path) => {
    if (path.startsWith('#')) {
      window.location.hash = path.replace('#', '');
      window.scrollTo(0, 0);
    } else {
      navigate(path);
    }
  };

  const handleModerationClick = (type) => {
    window.location.hash = 'moderation';
    window.scrollTo(0, 0);
  };

  const formatTime = (date) => date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const formatDate = (date) => date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const getActivityIcon = (type) => {
    switch (type) {
      case 'ORDER_PLACED': return <ShoppingCartIcon sx={{ color: '#38bdf8' }} />;
      case 'NEW_CHAT_MESSAGE': return <CommentIcon sx={{ color: '#818cf8' }} />;
      case 'POST_APPROVED': return <ThumbUpIcon sx={{ color: '#4ade80' }} />;
      case 'RECIPE_SUBMITTED': return <RestaurantMenuIcon sx={{ color: '#fbbf24' }} />;
      default: return <NotificationsIcon sx={{ color: '#94a3b8' }} />;
    }
  };

  const getHealthColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'healthy':
      case 'connected':
      case 'completed': return 'success';
      case 'warning': return 'warning';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  const chartData = {
    labels: monthlyRevenue.length > 0 ? monthlyRevenue.map(item => item.month) : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'Revenue (₹)',
      data: monthlyRevenue.length > 0 ? monthlyRevenue.map(item => item.revenue) : [0, 0, 0, 0, 0, 0],
      backgroundColor: 'rgba(56, 189, 248, 0.6)',
      borderColor: '#38bdf8',
      borderWidth: 2,
      borderRadius: 8,
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: 'rgba(255,255,255,0.7)' } },
      title: { display: false }
    },
    scales: {
      y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'rgba(255,255,255,0.5)', callback: (v) => '₹' + v.toLocaleString() } },
      x: { grid: { display: false }, ticks: { color: 'rgba(255,255,255,0.5)' } }
    }
  };

  const AppStatCard = ({ title, value, icon: Icon, trend }) => (
    <motion.div whileHover={{ y: -5 }}>
      <Card sx={{
        height: '100%',
        borderRadius: 4,
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)'
      }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Box sx={{ p: 1, borderRadius: 2, background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8' }}>
              <Icon />
            </Box>
            {trend !== undefined && (
              <Chip
                label={`${trend > 0 ? '+' : ''}${trend}%`}
                size="small"
                sx={{
                  bgcolor: trend > 0 ? 'rgba(74, 222, 128, 0.1)' : 'rgba(248, 113, 113, 0.1)',
                  color: trend > 0 ? '#4ade80' : '#f87171',
                  fontWeight: 'bold'
                }}
              />
            )}
          </Box>
          <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold', mb: 0.5 }}>{value}</Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>{title}</Typography>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <Box sx={{ p: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'white' }}>
            Welcome back, Admin
          </Typography>
          <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.5)' }}>
            {formatDate(currentTime)} • {formatTime(currentTime)}
          </Typography>
        </Box>
        <Tooltip title="Refresh Dashboard">
          <span>
            <IconButton
              onClick={loadData}
              disabled={refreshing}
              sx={{ bgcolor: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', '&:hover': { bgcolor: 'rgba(56, 189, 248, 0.2)' } }}
            >
              <RefreshIcon />
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      {refreshing && <LinearProgress sx={{ mb: 3, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.05)', '& .MuiLinearProgress-bar': { bgcolor: '#38bdf8' } }} />}

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}><AppStatCard title="Total Users" value={stats.totalUsers || 0} icon={PeopleIcon} trend={12} /></Grid>
        <Grid item xs={12} sm={6} md={3}><AppStatCard title="Total Orders" value={stats.totalOrders || 0} icon={ShoppingCartIcon} trend={18} /></Grid>
        <Grid item xs={12} sm={6} md={3}><AppStatCard title="Active Sellers" value={stats.activeSellers || 0} icon={StoreIcon} trend={8} /></Grid>
        <Grid item xs={12} sm={6} md={3}><AppStatCard title="Total Revenue" value={`₹${(stats.totalRevenue || 0).toLocaleString()}`} icon={PaymentIcon} trend={parseFloat(growthPercentage)} /></Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card sx={{ height: 480, borderRadius: 4, background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <CardContent sx={{ height: '100%', p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6" fontWeight="bold" color="white">Revenue Trends</Typography>
                <Chip label={`${growthPercentage}% Growth`} sx={{ bgcolor: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', fontWeight: 'bold' }} />
              </Box>
              <Box sx={{ height: 'calc(100% - 60px)' }}>
                <Bar data={chartData} options={chartOptions} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: 480, borderRadius: 4, background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" fontWeight="bold" color="white" gutterBottom>Recent Activities</Typography>
              <Box sx={{ flex: 1, overflow: 'auto', mt: 1 }}>
                <List disablePadding>
                  {activities.map((activity, i) => (
                    <ListItem key={i} sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)', py: 1.5 }}>
                      <ListItemIcon sx={{ minWidth: 45 }}>{getActivityIcon(activity.type)}</ListItemIcon>
                      <ListItemText
                        primary={<Typography variant="body2" color="white" noWrap>{activity.message}</Typography>}
                        secondary={<Typography variant="caption" color="rgba(255,255,255,0.4)">{activity.timeAgo || 'Just now'}</Typography>}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 4, background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <Typography variant="h6" color="white" fontWeight="bold" sx={{ mb: 2 }}>Moderation</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Button fullWidth variant="outlined" onClick={() => handleQuickAction('#forum')} sx={{ justifyContent: 'space-between', borderColor: 'rgba(251, 191, 36, 0.3)', color: '#fbbf24' }}>
                Pending Posts <Chip size="small" label={pendingModeration.forumPosts} sx={{ bgcolor: 'rgba(251, 191, 36, 0.2)', color: '#fbbf24' }} />
              </Button>
              <Button fullWidth variant="outlined" onClick={() => handleQuickAction('#recipes')} sx={{ justifyContent: 'space-between', borderColor: 'rgba(251, 191, 36, 0.3)', color: '#fbbf24' }}>
                Pending Recipes <Chip size="small" label={pendingModeration.recipes} sx={{ bgcolor: 'rgba(251, 191, 36, 0.2)', color: '#fbbf24' }} />
              </Button>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 4, background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <Typography variant="h6" color="white" fontWeight="bold" sx={{ mb: 2 }}>Quick Actions</Typography>
            <Grid container spacing={1}>
              <Grid item xs={6}><Button fullWidth variant="contained" onClick={() => handleQuickAction('#users')} sx={{ bgcolor: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', '&:hover': { bgcolor: 'rgba(56, 189, 248, 0.2)' } }}>Users</Button></Grid>
              <Grid item xs={6}><Button fullWidth variant="contained" onClick={() => handleQuickAction('#orders')} sx={{ bgcolor: 'rgba(129, 140, 248, 0.1)', color: '#818cf8', '&:hover': { bgcolor: 'rgba(129, 140, 248, 0.2)' } }}>Orders</Button></Grid>
              <Grid item xs={6}><Button fullWidth variant="contained" onClick={() => handleQuickAction('#payments')} sx={{ bgcolor: 'rgba(74, 222, 128, 0.1)', color: '#4ade80', '&:hover': { bgcolor: 'rgba(74, 222, 128, 0.2)' } }}>Payments</Button></Grid>
              <Grid item xs={6}><Button fullWidth variant="contained" onClick={() => handleQuickAction('#analytics')} sx={{ bgcolor: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24', '&:hover': { bgcolor: 'rgba(251, 191, 36, 0.2)' } }}>Analytics</Button></Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 4, background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <Typography variant="h6" color="white" fontWeight="bold" sx={{ mb: 2 }}>Top Sellers</Typography>
            <List disablePadding>
              {topSellers.slice(0, 3).map((seller, i) => (
                <ListItem key={i} sx={{ py: 1, px: 0 }}>
                  <Avatar sx={{ width: 32, height: 32, mr: 2, bgcolor: '#38bdf8' }}>{i + 1}</Avatar>
                  <ListItemText primary={<Typography color="white" variant="body2">{seller.name}</Typography>} secondary={<Typography variant="caption" color="rgba(255,255,255,0.4)">{seller.orderCount} orders</Typography>} />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default OverviewTab;