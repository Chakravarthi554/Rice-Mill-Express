import React, { useEffect, useState } from 'react';
import {
  Grid,
  Typography,
  Card,
  CardContent,
  Box,
  Chip,
  Button,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  Stack
} from '@mui/material';
import {
  ShoppingCart as ShoppingCartIcon,
  Payment as PaymentIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  LocalShipping as LocalShippingIcon,
  Notifications as NotificationsIcon,
  People as PeopleIcon,
  TrendingDown as TrendingDownIcon,
  Star as StarIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import { getDashboardStats, getRealTimeActivities } from '../../../redux/actions/adminActions';

const OverviewTab = () => {
  const dispatch = useDispatch();
  const [currentTime, setCurrentTime] = useState(new Date());

  const { stats = {}, loading } = useSelector((state) => state.adminDashboardStats);
  const { activities = [] } = useSelector((state) => state.adminActivities);

  useEffect(() => {
    dispatch(getDashboardStats());
    dispatch(getRealTimeActivities());
    
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, [dispatch]);

  // Fallbacks to mock data if empty (matching PDF spec)
  const displayActiveOrders = stats.activeOrders || 156;
  const displayTodayOrders = stats.todayOrders || 423;
  const displayRevenueToday = stats.revenueToday || "2.4L";
  const displayCodOrders = stats.codOrders || 298;
  const displayFloatingCash = stats.floatingCash || "1.8L";

  const AppStatCard = ({ title, value, icon: Icon, trend, trendDir, subtitle }) => (
    <motion.div whileHover={{ y: -4 }}>
      <Card sx={{
        height: '100%',
        borderRadius: '12px',
        bgcolor: '#ffffff',
        border: '1px solid #E5E7EB',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <CardContent sx={{ p: 2.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {title}
            </Typography>
            <Box sx={{ p: 0.75, borderRadius: '8px', bgcolor: '#F3F4F6', color: '#374151' }}>
              <Icon fontSize="small" />
            </Box>
          </Box>
          <Typography variant="h4" sx={{ color: '#111827', fontWeight: 800, mb: 1 }}>{value}</Typography>
          {trend !== undefined && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {trendDir === 'up' ? (
                <TrendingUpIcon sx={{ fontSize: 16, color: '#16A34A' }} />
              ) : (
                <TrendingDownIcon sx={{ fontSize: 16, color: '#DC2626' }} />
              )}
              <Typography variant="caption" sx={{ color: trendDir === 'up' ? '#16A34A' : '#DC2626', fontWeight: 800 }}>
                {trend}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                {subtitle || 'vs yesterday'}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>
            Control Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
            {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} • {currentTime.toLocaleTimeString()}
          </Typography>
        </Box>
      </Box>

      {/* Stats Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <AppStatCard title="Active Orders" value={displayActiveOrders} icon={LocalShippingIcon} trend="8%" trendDir="up" subtitle="vs last hour" />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <AppStatCard title="Today's Orders" value={displayTodayOrders} icon={ShoppingCartIcon} trend="12%" trendDir="up" />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <AppStatCard title="Revenue Today" value={`₹${displayRevenueToday}`} icon={PaymentIcon} trend="15%" trendDir="up" />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <AppStatCard title="COD Orders" value={displayCodOrders} icon={PaymentIcon} trend="70%" trendDir="up" subtitle="of total" />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <AppStatCard title="Floating Cash" value={`₹${displayFloatingCash}`} icon={WarningIcon} trend="3 DPs exceeding" trendDir="down" subtitle="" />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Floating Cash Monitoring Block */}
        <Grid item xs={12} md={8}>
          <Paper variant="outlined" sx={{ borderRadius: '12px', border: '1px solid #E5E7EB', overflow: 'hidden', mb: 3 }}>
            <Box sx={{ p: 2.5, borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="subtitle1" fontWeight={800} color="#111827">
                  Floating Cash Monitoring
                </Typography>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  Total floating cash: ₹1,84,500 across 47 active delivery partners
                </Typography>
              </Box>
              <Stack direction="row" spacing={1}>
                <Chip label="3 Critical" size="small" sx={{ bgcolor: '#FEE2E2', color: '#DC2626', fontWeight: 800 }} />
                <Chip label="5 Warning" size="small" sx={{ bgcolor: '#FEF3C7', color: '#D97706', fontWeight: 800 }} />
              </Stack>
            </Box>

            <Box sx={{ p: 2 }}>
              <Alert severity="error" sx={{ mb: 2, borderRadius: '8px', fontWeight: 700 }}>
                Alert: 3 DPs exceeding cash limit!
              </Alert>
              
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#F9FAFB' }}>
                      {['DP Name', 'Phone', 'Holding', 'Limit', 'Status', 'Last Remit', 'Actions'].map((col) => (
                        <TableCell key={col} sx={{ fontWeight: 800, fontSize: '0.75rem', color: '#6B7280' }}>{col}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {[
                      { name: "Rajesh K.", phone: "+91 98765 11111", holding: "₹6,800", limit: "₹5,000", status: "Critical", last: "6 hours ago", actions: ["Force Logout", "Call"], color: "#DC2626" },
                      { name: "Suresh M.", phone: "+91 98765 22222", holding: "₹5,900", limit: "₹5,000", status: "Critical", last: "4 hours ago", actions: ["Block COD", "Call"], color: "#DC2626" },
                      { name: "Amit P.", phone: "+91 98765 33333", holding: "₹4,800", limit: "₹5,000", status: "Warning", last: "2 hours ago", actions: ["Notify", "Call"], color: "#D97706" },
                      { name: "Vikram S.", phone: "+91 98765 44444", holding: "₹2,100", limit: "₹5,000", status: "Normal", last: "1 hour ago", actions: ["View"], color: "#16A34A" }
                    ].map((row, idx) => (
                      <TableRow key={idx} hover>
                        <TableCell sx={{ fontWeight: 700 }}>{row.name}</TableCell>
                        <TableCell sx={{ fontSize: '0.8rem', color: '#6B7280' }}>{row.phone}</TableCell>
                        <TableCell sx={{ fontWeight: 800, color: row.color }}>{row.holding}</TableCell>
                        <TableCell sx={{ color: '#6B7280' }}>{row.limit}</TableCell>
                        <TableCell>
                          <Chip label={row.status} size="small" sx={{ 
                            bgcolor: row.color === "#DC2626" ? "#FEE2E2" : row.color === "#D97706" ? "#FFF3E0" : "#E0F2FE",
                            color: row.color, fontWeight: 800, fontSize: '0.65rem'
                          }} />
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.8rem', color: '#6B7280' }}>{row.last}</TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1}>
                            {row.actions.map((act) => (
                              <Button 
                                key={act} 
                                size="small" 
                                variant={act === "Call" ? "outlined" : "contained"} 
                                color={row.status === "Critical" ? "error" : "primary"}
                                sx={{ textTransform: 'none', fontSize: '0.7rem', fontWeight: 800, borderRadius: '6px', py: 0.25 }}
                                onClick={() => alert(`${act} triggered for ${row.name}`)}
                              >
                                {act}
                              </Button>
                            ))}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Live Activity Feed */}
        <Grid item xs={12} md={4}>
          <Paper variant="outlined" sx={{ borderRadius: '12px', border: '1px solid #E5E7EB', overflow: 'hidden', height: '100%', bgcolor: '#fff' }}>
            <Box sx={{ p: 2.5, borderBottom: '1px solid #E5E7EB' }}>
              <Typography variant="subtitle1" fontWeight={800} color="#111827">
                Live Activity Feed
              </Typography>
            </Box>
            
            <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[
                { type: "auto", msg: "Auto-action: DP-Rajesh auto-logged out at 6:30 PM (Limit exceeded)", time: "2 mins ago", color: "#DC2626" },
                { type: "block", msg: "COD blocked: New COD orders blocked for DP-Suresh", time: "5 mins ago", color: "#D97706" },
                { type: "remit", msg: "Remittance: DP-Amit verified ₹3,100 via UPI", time: "8 mins ago", color: "#16A34A" }
              ].map((act, i) => (
                <Box key={i} sx={{ p: 1.5, borderRadius: '8px', borderLeft: `4px solid ${act.color}`, bgcolor: '#F9FAFB' }}>
                  <Typography variant="body2" fontWeight={600} color="#374151">
                    {act.msg}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, fontWeight: 600 }}>
                    {act.time}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default OverviewTab;