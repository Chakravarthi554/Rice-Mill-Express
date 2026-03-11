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

  // ✅ FIXED: Load analytics data with polling for real-time updates
  useEffect(() => {
    loadAnalyticsData();
    const interval = setInterval(() => {
      loadAnalyticsData();
    }, 15000); // Poll every 15 seconds

    return () => clearInterval(interval);
  }, [dispatch, timeframe]);

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

  // ✅ FIXED: Use real data from API with robust fallbacks
  const analyticsData = {
    salesOverview: {
      totalSales: data?.salesOverview?.totalSales ?? 0,
      dailySales: data?.salesOverview?.dailySales || [],
      topRiceTypes: data?.salesOverview?.topRiceTypes || [],
      commissionEarned: data?.salesOverview?.commissionEarned ?? 0
    },
    orderPerformance: {
      totalOrders: data?.orderPerformance?.totalOrders ?? 0,
      deliveryStats: data?.orderPerformance?.deliveryStats || { onTime: 0, delayed: 0, cancelled: 0 },
      orderStatus: data?.orderPerformance?.orderStatus || [],
      topSellers: data?.orderPerformance?.topSellers || []
    },
    paymentTrends: {
      paymentMethods: data?.paymentTrends?.paymentMethods || [],
      refundRate: data?.paymentTrends?.refundRate ?? 0,
      dailyPayments: data?.paymentTrends?.dailyPayments || [],
      highValueCOD: data?.paymentTrends?.highValueCOD ?? 0
    },
    userEngagement: {
      activeUsers: data?.userEngagement?.activeUsers || { customers: 0, sellers: 0 },
      recipeViews: data?.userEngagement?.recipeViews ?? 0,
      conversionRate: data?.userEngagement?.conversionRate ?? 0,
      forumPosts: data?.userEngagement?.forumPosts ?? 0,
      userGrowth: data?.userEngagement?.userGrowth || []
    },
    inventoryAlerts: {
      lowStock: data?.inventoryAlerts?.lowStock || [],
      topPromotions: data?.inventoryAlerts?.topPromotions || [],
      fraudFlags: data?.inventoryAlerts?.fraudFlags ?? 0
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
    <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.2 }}>
      <Card sx={{
        height: '100%',
        borderRadius: 4,
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)'
      }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box>
              <Typography color="rgba(255,255,255,0.6)" gutterBottom variant="overline" sx={{ letterSpacing: 1 }}>
                {title}
              </Typography>
              <Typography variant="h4" component="div" fontWeight="bold" sx={{ color: 'white' }}>
                {value}
              </Typography>
              {subtitle && (
                <Typography variant="body2" color="rgba(255,255,255,0.4)">
                  {subtitle}
                </Typography>
              )}
            </Box>
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                bgcolor: `rgba(56, 189, 248, 0.1)`,
                color: `#38bdf8`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Icon fontSize="medium" />
            </Box>
          </Box>
          {trend !== undefined && (
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <TrendingUpIcon
                sx={{
                  fontSize: 16,
                  color: trend >= 0 ? '#4ade80' : '#f87171',
                  mr: 0.5,
                  transform: trend >= 0 ? 'none' : 'rotate(180deg)'
                }}
              />
              <Typography
                variant="body2"
                sx={{ color: trend >= 0 ? '#4ade80' : '#f87171', fontWeight: 600 }}
              >
                {trend >= 0 ? '+' : ''}{trend}%
              </Typography>
              <Typography variant="caption" sx={{ ml: 1, color: 'rgba(255,255,255,0.4)' }}>
                vs last period
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
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'white' }}>
            Analytics Dashboard
          </Typography>
          <Typography variant="h6" color="rgba(255,255,255,0.6)">
            Real-time insights and performance metrics
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel sx={{ color: 'rgba(255,255,255,0.7)' }}>Timeframe</InputLabel>
            <Select
              value={timeframe}
              label="Timeframe"
              onChange={(e) => setTimeframe(e.target.value)}
              disabled={loading}
              sx={{
                color: 'white',
                '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.4)' },
                '.MuiSvgIcon-root': { color: 'rgba(255,255,255,0.7)' }
              }}
            >
              <MenuItem value="today">Today</MenuItem>
              <MenuItem value="week">This Week</MenuItem>
              <MenuItem value="month">This Month</MenuItem>
              <MenuItem value="quarter">This Quarter</MenuItem>
              <MenuItem value="year">This Year</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={() => handleExport('csv')}
            disabled={exporting || loading}
            sx={{
              background: 'rgba(56, 189, 248, 0.2)',
              color: '#38bdf8',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              '&:hover': { background: 'rgba(56, 189, 248, 0.3)' }
            }}
          >
            {exporting ? 'Exporting...' : 'Export'}
          </Button>
        </Box>
        <Tooltip title="Refresh Data">
          <span> {/* FIXED: Wrapped disabled button in span for Tooltip */}
            <IconButton
              onClick={handleRefresh}
              disabled={refreshing || loading}
              sx={{ color: '#38bdf8', background: 'rgba(56, 189, 248, 0.1)', '&:hover': { background: 'rgba(56, 189, 248, 0.2)' } }}
            >
              <RefreshIcon />
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      {(refreshing || loading) && <LinearProgress sx={{ mb: 2 }} />}

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Revenue"
            value={`₹${(analyticsData.salesOverview.totalSales || 0).toLocaleString()}`}
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
            value={analyticsData.userEngagement.activeUsers?.customers || 0}
            icon={PeopleIcon}
            color="info"
            trend={15}
            subtitle={`${analyticsData.userEngagement.activeUsers?.sellers || 0} sellers`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Commission"
            value={`₹${(analyticsData.salesOverview.commissionEarned || 0).toLocaleString()}`}
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
            <Card sx={{
              borderRadius: 4,
              height: 450,
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              <CardContent sx={{ height: '100%', p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', color: 'white', mb: 3 }}>
                  <BarChartIcon sx={{ mr: 1, color: '#38bdf8' }} />
                  Sales Overview
                </Typography>
                <Box sx={{ width: '100%', height: 'calc(100% - 60px)', minHeight: 150 }}> {/* FIXED: Stable child container */}
                  <ResponsiveContainer width="100%" height="100%" debounce={50}>
                    <BarChart data={analyticsData.salesOverview.dailySales}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis
                        dataKey="day"
                        stroke="rgba(255,255,255,0.5)"
                        tick={{ fill: 'rgba(255,255,255,0.5)' }}
                        axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                      />
                      <YAxis
                        stroke="rgba(255,255,255,0.5)"
                        tick={{ fill: 'rgba(255,255,255,0.5)' }}
                        tickFormatter={(value) => `₹${value / 1000}k`}
                        axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                      />
                      <ChartTooltip
                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: 8, color: 'white' }}
                        itemStyle={{ color: '#38bdf8' }}
                        formatter={(value) => [`₹${(value || 0).toLocaleString()}`, 'Sales']}
                      />
                      <Legend wrapperStyle={{ paddingTop: 20 }} />
                      <Bar dataKey="sales" fill="#38bdf8" name="Daily Sales" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
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
                        ₹{(seller.revenue || 0).toLocaleString()}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>
    </Box >
  );
};

export default AnalyticsTab;