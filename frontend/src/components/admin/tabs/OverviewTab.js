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
  Tooltip
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
  Comment as CommentIcon,
  Favorite as FavoriteIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom'; // ADDED FOR NAVIGATION
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip as ChartTooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { getDashboardStats, getRealTimeActivities } from '../../../redux/actions/adminActions';
import AnimatedStatCard from '../../common/AnimatedStatCard';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, ChartTooltip, Legend);

const OverviewTab = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate(); // ADDED FOR NAVIGATION
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
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    const dataInterval = setInterval(() => {
      loadData();
    }, 30000); // Refresh every 30 seconds

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

  // FIXED: Navigation functions for quick actions
  const handleQuickAction = (path) => {
    switch (path) {
      case '#users':
        navigate('/admin/users'); // You'll need to create this route
        break;
      case '#orders':
        navigate('/admin/orders'); // You'll need to create this route
        break;
      case '#moderation':
        // Switch to moderation tab using URL hash
        window.location.hash = 'moderation';
        break;
      case '#payments':
        // Switch to payments tab using URL hash
        window.location.hash = 'payments';
        break;
      default:
        console.log('Navigation not implemented for:', path);
    }
  };

  // FIXED: Moderation navigation functions
  const handleModerationClick = (type) => {
    window.location.hash = 'moderation';
    // You can add logic to pre-filter the moderation tab based on type
    console.log(`Navigating to moderation for: ${type}`);
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: true,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'ORDER_PLACED':
        return <ShoppingCartIcon color="primary" />;
      case 'NEW_CHAT_MESSAGE':
        return <CommentIcon color="info" />;
      case 'POST_APPROVED':
        return <ThumbUpIcon color="success" />;
      case 'RECIPE_SUBMITTED':
        return <RestaurantMenuIcon color="warning" />;
      default:
        return <NotificationsIcon color="action" />;
    }
  };

  const getHealthColor = (status) => {
    switch (status) {
      case 'healthy':
      case 'connected':
      case 'completed':
        return 'success';
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  // FIXED: Ensure chart data is properly formatted
  const chartData = {
    labels: monthlyRevenue && monthlyRevenue.length > 0 
      ? monthlyRevenue.map(item => item.month) 
      : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'Monthly Revenue (₹)',
        data: monthlyRevenue && monthlyRevenue.length > 0 
          ? monthlyRevenue.map(item => item.revenue) 
          : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        backgroundColor: 'rgba(76, 175, 80, 0.6)',
        borderColor: 'rgba(76, 175, 80, 1)',
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Monthly Revenue Overview',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return '₹' + value.toLocaleString();
          },
        },
      },
    },
  };

  // FIXED: Quick actions with proper navigation
  const quickActions = [
    { label: 'Manage Users', icon: PeopleIcon, color: 'primary', path: '#users' },
    { label: 'View Orders', icon: ShoppingCartIcon, color: 'secondary', path: '#orders' },
    { label: 'Moderate Content', icon: SecurityIcon, color: 'warning', path: '#moderation' },
    { label: 'Payment Review', icon: PaymentIcon, color: 'success', path: '#payments' },
  ];

  if (loading && !refreshing) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading dashboard...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header with Greeting and Refresh */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
            Good {currentTime.getHours() < 12 ? 'Morning' : currentTime.getHours() < 18 ? 'Afternoon' : 'Evening'}, Admin!
          </Typography>
          <Typography variant="h6" color="text.secondary">
            {formatDate(currentTime)} • {formatTime(currentTime)}
          </Typography>
        </Box>
        <Tooltip title="Refresh Data">
          <span> {/* FIXED: Added wrapper span for disabled button */}
            <IconButton 
              onClick={loadData} 
              disabled={refreshing}
              sx={{ 
                bgcolor: 'primary.main', 
                color: 'white',
                '&:hover': { bgcolor: 'primary.dark' },
                '&:disabled': { bgcolor: 'grey.400' }
              }}
            >
              <RefreshIcon />
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      {refreshing && <LinearProgress sx={{ mb: 2 }} />}

      {/* Stat Cards Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <AnimatedStatCard
            title="Total Users"
            value={stats.totalUsers || 0}
            icon={PeopleIcon}
            color="#4caf50"
            trend={12}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <AnimatedStatCard
            title="Total Orders"
            value={stats.totalOrders || 0}
            icon={ShoppingCartIcon}
            color="#2196f3"
            trend={18}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <AnimatedStatCard
            title="Active Sellers"
            value={stats.activeSellers || 0}
            icon={StoreIcon}
            color="#ff9800"
            trend={8}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <AnimatedStatCard
            title="Active Customers"
            value={stats.activeCustomers || 0}
            icon={PersonIcon}
            color="#9c27b0"
            trend={15}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <AnimatedStatCard
            title="Total Recipes"
            value={stats.totalRecipes || 0}
            icon={RestaurantMenuIcon}
            color="#f44336"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <AnimatedStatCard
            title="Forum Posts"
            value={stats.totalForumPosts || 0}
            icon={ForumIcon}
            color="#673ab7"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <AnimatedStatCard
            title="Total Revenue"
            value={`₹${(stats.totalRevenue || 0).toLocaleString()}`}
            icon={PaymentIcon}
            color="#4caf50"
            trend={parseFloat(growthPercentage)}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <AnimatedStatCard
            title="Growth"
            value={`${growthPercentage}%`}
            icon={TrendingUpIcon}
            color={growthPercentage >= 0 ? "#4caf50" : "#f44336"}
          />
        </Grid>
      </Grid>

      {/* Second Row: Charts and Activities */}
      <Grid container spacing={3}>
        {/* Monthly Revenue Chart */}
        <Grid item xs={12} md={8}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card sx={{ height: '400px', borderRadius: 3 }}> {/* FIXED: Fixed height */}
              <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" fontWeight="bold">
                    Revenue Analytics
                  </Typography>
                  <Chip 
                    icon={<TrendingUpIcon />} 
                    label={`${growthPercentage}% Growth`} 
                    color={growthPercentage >= 0 ? "success" : "error"}
                    variant="outlined"
                  />
                </Box>
                <Box sx={{ flex: 1, minHeight: 0 }}> {/* FIXED: Flexible chart container */}
                  <Bar data={chartData} options={chartOptions} />
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Real-time Activities */}
        <Grid item xs={12} md={4}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card sx={{ height: '400px', borderRadius: 3 }}> {/* FIXED: Fixed height */}
              <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Real-time Activities
                </Typography>
                <Box sx={{ flex: 1, overflow: 'auto' }}>
                  <List>
                    {activities.length > 0 ? activities.slice(0, 8).map((activity, index) => (
                      <ListItem key={activity.id || index} divider>
                        <ListItemIcon>
                          {getActivityIcon(activity.type)}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography variant="body2" noWrap>
                              {activity.message}
                            </Typography>
                          }
                          secondary={
                            <Typography variant="caption" color="text.secondary">
                              {activity.timeAgo || new Date(activity.createdAt).toLocaleTimeString()}
                            </Typography>
                          }
                        />
                      </ListItem>
                    )) : (
                      <ListItem>
                        <ListItemText primary="No recent activities" />
                      </ListItem>
                    )}
                  </List>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Third Row: Three Columns */}
        <Grid item xs={12} md={4}>
          {/* Pending Moderation */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card sx={{ borderRadius: 3, mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <WarningIcon color="warning" sx={{ mr: 1 }} />
                  <Typography variant="h6" fontWeight="bold">
                    Pending Moderation
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {/* FIXED: Added onClick handlers for moderation chips */}
                  <Chip 
                    icon={<ForumIcon />} 
                    label={`${pendingModeration.forumPosts} Forum Posts`} 
                    color="warning" 
                    variant="outlined"
                    clickable
                    onClick={() => handleModerationClick('forum')}
                  />
                  <Chip 
                    icon={<RestaurantMenuIcon />} 
                    label={`${pendingModeration.recipes} Recipes`} 
                    color="warning" 
                    variant="outlined"
                    clickable
                    onClick={() => handleModerationClick('recipes')}
                  />
                  <Chip 
                    icon={<CommentIcon />} 
                    label={`${pendingModeration.comments} Comments`} 
                    color="warning" 
                    variant="outlined"
                    clickable
                    onClick={() => handleModerationClick('comments')}
                  />
                </Box>
                <Button 
                  fullWidth 
                  variant="outlined" 
                  color="warning" 
                  sx={{ mt: 2 }}
                  onClick={() => handleModerationClick('all')}
                >
                  Review All
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Actions */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Quick Actions
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {quickActions.map((action, index) => (
                    <Button
                      key={index}
                      startIcon={<action.icon />}
                      variant="outlined"
                      color={action.color}
                      fullWidth
                      onClick={() => handleQuickAction(action.path)}
                      sx={{ justifyContent: 'flex-start' }}
                    >
                      {action.label}
                    </Button>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Top Selling Rice Varieties */}
        <Grid item xs={12} md={4}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card sx={{ borderRadius: 3, mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <RiceBowlIcon color="success" sx={{ mr: 1 }} />
                  <Typography variant="h6" fontWeight="bold">
                    Top Selling Rice
                  </Typography>
                </Box>
                <List>
                  {topSellingRice && topSellingRice.length > 0 ? topSellingRice.map((item, index) => (
                    <ListItem key={item._id || index} divider>
                      <ListItemIcon>
                        <Avatar sx={{ bgcolor: 'success.light', width: 32, height: 32 }}>
                          {index + 1}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={item._id || 'Unknown Rice'}
                        secondary={`${item.totalSold || 0} bags sold`}
                      />
                    </ListItem>
                  )) : (
                    <ListItem>
                      <ListItemText primary="No sales data available" />
                    </ListItem>
                  )}
                </List>
              </CardContent>
            </Card>
          </motion.div>

          {/* System Health */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  System Health
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <StorageIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography>Server</Typography>
                    </Box>
                    <Chip 
                      label={systemHealth.server || 'Unknown'} 
                      color={getHealthColor(systemHealth.server)}
                      size="small"
                    />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <BackupIcon sx={{ mr: 1, color: 'secondary.main' }} />
                      <Typography>Database</Typography>
                    </Box>
                    <Chip 
                      label={systemHealth.database || 'Unknown'} 
                      color={getHealthColor(systemHealth.database)}
                      size="small"
                    />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <BackupIcon sx={{ mr: 1, color: 'warning.main' }} />
                      <Typography>Backup</Typography>
                    </Box>
                    <Chip 
                      label={systemHealth.backup || 'Unknown'} 
                      color={getHealthColor(systemHealth.backup)}
                      size="small"
                    />
                  </Box>
                  {systemHealth.uptime && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <AccessTimeIcon sx={{ mr: 1, color: 'info.main' }} />
                        <Typography>Uptime</Typography>
                      </Box>
                      <Typography variant="body2">
                        {Math.floor(systemHealth.uptime / 3600)}h
                      </Typography>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Top Active Sellers */}
        <Grid item xs={12} md={4}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <LocalShippingIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6" fontWeight="bold">
                    Top Active Sellers
                  </Typography>
                </Box>
                <List>
                  {topSellers && topSellers.length > 0 ? topSellers.map((seller, index) => (
                    <ListItem key={seller._id || index} divider>
                      <ListItemIcon>
                        <Avatar sx={{ bgcolor: 'primary.light', width: 32, height: 32 }}>
                          {index + 1}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={seller.name || 'Unknown Seller'}
                        secondary={`${seller.orderCount || 0} orders • ₹${(seller.totalRevenue || 0).toLocaleString()}`}
                      />
                    </ListItem>
                  )) : (
                    <ListItem>
                      <ListItemText primary="No seller data available" />
                    </ListItem>
                  )}
                </List>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>
    </Box>
  );
};

export default OverviewTab;