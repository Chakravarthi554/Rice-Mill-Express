import React, { useEffect, useState } from 'react';
import {
  Grid,
  Typography,
  Card,
  CardContent,
  Box,
  Chip,
  Button,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  LinearProgress,
  IconButton,
  Tooltip,
  Paper,
  Alert
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  ShoppingCart as ShoppingCartIcon,
  People as PeopleIcon,
  Payment as PaymentIcon,
  Inventory as InventoryIcon,
  Warning as WarningIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  ShowChart as ShowChartIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

// ✅ ADDED: Redux actions import
import { getAnalyticsData, exportAnalyticsData } from '../../../redux/actions/adminActions';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const AnalyticsTab = () => {
  const dispatch = useDispatch();
  const [timeframe, setTimeframe] = useState('week');
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  
  // ✅ ADDED: Get analytics data from Redux store
  const { loading, data, error } = useSelector((state) => state.adminAnalytics || {});
  
  // ✅ ADDED: Load analytics data on component mount
  useEffect(() => {
    loadAnalyticsData();
  }, [timeframe]);
  
  const loadAnalyticsData = async () => {
    setRefreshing(true);
    try {
      await dispatch(getAnalyticsData(timeframe));
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setRefreshing(false);
    }
  };
  
  // ✅ ADDED: Use real data from API or fallback to mock data
  const analyticsData = data || {
    salesOverview: {
      totalSales: 50000,
      dailySales: [
        { day: 'Mon', sales: 8000 },
        { day: 'Tue', sales: 12000 },
        { day: 'Wed', sales: 9000 },
        { day: 'Thu', sales: 15000 },
        { day: 'Fri', sales: 11000 },
        { day: 'Sat', sales: 13000 },
        { day: 'Sun', sales: 10000 }
      ],
      topRiceTypes: [
        { name: 'Basmati', percentage: 40, sales: 20000 },
        { name: 'Sona Masoori', percentage: 30, sales: 15000 },
        { name: 'Brown Rice', percentage: 15, sales: 7500 },
        { name: 'Jasmine', percentage: 10, sales: 5000 },
        { name: 'Others', percentage: 5, sales: 2500 }
      ],
      commissionEarned: 7500
    },
    orderPerformance: {
      totalOrders: 200,
      deliveryStats: {
        onTime: 85,
        delayed: 10,
        cancelled: 5
      },
      orderStatus: [
        { name: 'Delivered', value: 160, color: '#4caf50' },
        { name: 'Pending', value: 30, color: '#ff9800' },
        { name: 'Refunded', value: 10, color: '#f44336' }
      ],
      topSellers: [
        { name: 'Seller A', orders: 50, revenue: 15000 },
        { name: 'Seller B', orders: 30, revenue: 12000 },
        { name: 'Seller C', orders: 25, revenue: 9000 }
      ]
    },
    paymentTrends: {
      paymentMethods: [
        { name: 'Razorpay', value: 60, color: '#667eea' },
        { name: 'COD', value: 40, color: '#764ba2' }
      ],
      refundRate: 3,
      dailyPayments: [
        { date: '01 Nov', online: 8000, cod: 5000 },
        { date: '02 Nov', online: 12000, cod: 7000 },
        { date: '03 Nov', online: 9000, cod: 6000 },
        { date: '04 Nov', online: 15000, cod: 8000 },
        { date: '05 Nov', online: 11000, cod: 9000 }
      ],
      highValueCOD: 5
    },
    userEngagement: {
      activeUsers: {
        customers: 500,
        sellers: 10
      },
      recipeViews: 1000,
      conversionRate: 20,
      forumPosts: 50,
      userGrowth: [
        { month: 'Jan', users: 300 },
        { month: 'Feb', users: 350 },
        { month: 'Mar', users: 400 },
        { month: 'Apr', users: 420 },
        { month: 'May', users: 450 },
        { month: 'Jun', users: 500 }
      ]
    },
    inventoryAlerts: {
      lowStock: [
        { product: '5kg Basmati', stock: 10, threshold: 20 },
        { product: '2kg Sona Masoori', stock: 15, threshold: 25 },
        { product: '1kg Brown Rice', stock: 8, threshold: 15 }
      ],
      topPromotions: [
        { name: 'Diwali 20% Off', sales: 50, revenue: 25000 },
        { name: 'Free Delivery', sales: 30, revenue: 15000 }
      ],
      fraudFlags: 2
    }
  };

  const handleRefresh = async () => {
    await loadAnalyticsData();
  };

  const handleExport = async (format) => {
    setExporting(true);
    try {
      await dispatch(exportAnalyticsData('sales', timeframe));
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setExporting(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, trend, subtitle }) => (
    <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
      <Card sx={{ height: '100%', borderRadius: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box>
              <Typography color="textSecondary" gutterBottom variant="overline">
                {title}
              </Typography>
              <Typography variant="h4" component="div" fontWeight="bold">
                {value}
              </Typography>
              {subtitle && (
                <Typography variant="body2" color="textSecondary">
                  {subtitle}
                </Typography>
              )}
            </Box>
            <Box
              sx={{
                p: 1,
                borderRadius: 2,
                bgcolor: `${color}.light`,
                color: `${color}.main`,
              }}
            >
              <Icon />
            </Box>
          </Box>
          {trend && (
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <TrendingUpIcon
                sx={{
                  fontSize: 16,
                  color: trend >= 0 ? 'success.main' : 'error.main',
                  mr: 0.5,
                  transform: trend >= 0 ? 'none' : 'rotate(180deg)'
                }}
              />
              <Typography
                variant="body2"
                sx={{ color: trend >= 0 ? 'success.main' : 'error.main' }}
              >
                {trend >= 0 ? '+' : ''}{trend}%
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );

  // ✅ ADDED: Error handling
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Error loading analytics: {error}
        </Alert>
        <Button onClick={loadAnalyticsData} startIcon={<RefreshIcon />}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
            Analytics Dashboard
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Real-time insights and performance metrics
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Timeframe</InputLabel>
            <Select
              value={timeframe}
              label="Timeframe"
              onChange={(e) => setTimeframe(e.target.value)}
              disabled={loading}
            >
              <MenuItem value="today">Today</MenuItem>
              <MenuItem value="week">This Week</MenuItem>
              <MenuItem value="month">This Month</MenuItem>
              <MenuItem value="quarter">This Quarter</MenuItem>
              <MenuItem value="year">This Year</MenuItem>
            </Select>
          </FormControl>
          <Tooltip title="Export Data">
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => handleExport('csv')}
              disabled={exporting || loading}
            >
              Export
            </Button>
          </Tooltip>
          <Tooltip title="Refresh Data">
            <IconButton onClick={handleRefresh} disabled={refreshing || loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {(refreshing || loading) && <LinearProgress sx={{ mb: 2 }} />}

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Revenue"
            value={`₹${analyticsData.salesOverview.totalSales.toLocaleString()}`}
            icon={TrendingUpIcon}
            color="success"
            trend={12}
            subtitle="This week"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Orders"
            value={analyticsData.orderPerformance.totalOrders}
            icon={ShoppingCartIcon}
            color="primary"
            trend={8}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Users"
            value={analyticsData.userEngagement.activeUsers.customers}
            icon={PeopleIcon}
            color="info"
            trend={15}
            subtitle={`${analyticsData.userEngagement.activeUsers.sellers} sellers`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Commission"
            value={`₹${analyticsData.salesOverview.commissionEarned.toLocaleString()}`}
            icon={PaymentIcon}
            color="warning"
            trend={10}
          />
        </Grid>
      </Grid>

      {/* Charts Row 1 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Sales Trend */}
        <Grid item xs={12} md={8}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card sx={{ borderRadius: 3, height: 400 }}>
              <CardContent sx={{ height: '100%' }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <BarChartIcon sx={{ mr: 1 }} />
                  Sales Overview
                </Typography>
                <ResponsiveContainer width="100%" height="85%">
                  <BarChart data={analyticsData.salesOverview.dailySales}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis tickFormatter={(value) => `₹${value / 1000}k`} />
                    <ChartTooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Sales']} />
                    <Legend />
                    <Bar dataKey="sales" fill="#4caf50" name="Daily Sales" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Order Status Distribution */}
        <Grid item xs={12} md={4}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card sx={{ borderRadius: 3, height: 400 }}>
              <CardContent sx={{ height: '100%' }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <PieChartIcon sx={{ mr: 1 }} />
                  Order Status
                </Typography>
                <ResponsiveContainer width="100%" height="85%">
                  <PieChart>
                    <Pie
                      data={analyticsData.orderPerformance.orderStatus}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {analyticsData.orderPerformance.orderStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip formatter={(value) => [value, 'Orders']} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      {/* Charts Row 2 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Payment Methods */}
        <Grid item xs={12} md={4}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card sx={{ borderRadius: 3, height: 300 }}>
              <CardContent sx={{ height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Payment Methods
                </Typography>
                <ResponsiveContainer width="100%" height="80%">
                  <PieChart>
                    <Pie
                      data={analyticsData.paymentTrends.paymentMethods}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name} ${value}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {analyticsData.paymentTrends.paymentMethods.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* User Growth */}
        <Grid item xs={12} md={8}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card sx={{ borderRadius: 3, height: 300 }}>
              <CardContent sx={{ height: '100%' }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <ShowChartIcon sx={{ mr: 1 }} />
                  User Growth
                </Typography>
                <ResponsiveContainer width="100%" height="80%">
                  <LineChart data={analyticsData.userEngagement.userGrowth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <ChartTooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="users"
                      stroke="#8884d8"
                      strokeWidth={2}
                      name="Active Users"
                      dot={{ fill: '#8884d8', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      {/* Alerts and Top Performers */}
      <Grid container spacing={3}>
        {/* Low Stock Alerts */}
        <Grid item xs={12} md={6}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', color: 'warning.main' }}>
                  <WarningIcon sx={{ mr: 1 }} />
                  Low Stock Alerts
                </Typography>
                <Box sx={{ mt: 2 }}>
                  {analyticsData.inventoryAlerts.lowStock.map((item, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        py: 1,
                        borderBottom: index < analyticsData.inventoryAlerts.lowStock.length - 1 ? '1px solid' : 'none',
                        borderColor: 'divider'
                      }}
                    >
                      <Typography variant="body2">{item.product}</Typography>
                      <Chip
                        label={`${item.stock} units`}
                        color="warning"
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Top Sellers */}
        <Grid item xs={12} md={6}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', color: 'success.main' }}>
                  <TrendingUpIcon sx={{ mr: 1 }} />
                  Top Performing Sellers
                </Typography>
                <Box sx={{ mt: 2 }}>
                  {analyticsData.orderPerformance.topSellers.map((seller, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        py: 1,
                        borderBottom: index < analyticsData.orderPerformance.topSellers.length - 1 ? '1px solid' : 'none',
                        borderColor: 'divider'
                      }}
                    >
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {seller.name}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {seller.orders} orders
                        </Typography>
                      </Box>
                      <Typography variant="body2" fontWeight="medium">
                        ₹{seller.revenue.toLocaleString()}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AnalyticsTab;