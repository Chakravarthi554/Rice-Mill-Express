import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import {
    Box,
    Container,
    Grid,
    Card,
    CardContent,
    Typography,
    Button,
    Chip,
    Avatar,
    IconButton,
    LinearProgress,
    Alert,
    Fade,
    Grow,
    Paper,
    Divider,
    Dialog,
    TextField,
    CircularProgress,
} from '@mui/material';
import {
    LocalShipping,
    CheckCircle,
    Schedule,
    TrendingUp,
    Star,
    Person,
    Logout,
    Help,
    Warning,
    Assignment,
    Phone,
    AccountBalanceWallet,
    History,
} from '@mui/icons-material';
import { styled, keyframes } from '@mui/material/styles';
import { LoadingState, EmptyState, ErrorState } from '../../components/common/PageStates';

// Animated gradient background
const pulse = keyframes`
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
`;

const DashboardContainer = styled(Box)(({ theme }) => ({
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    paddingTop: theme.spacing(3),
    paddingBottom: theme.spacing(3),
}));

const StatsCard = styled(Card)(({ theme, color }) => ({
    background: `linear-gradient(135deg, ${color}15 0%, ${color}25 100%)`,
    borderLeft: `4px solid ${color}`,
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    '&:hover': {
        transform: 'translateY(-8px)',
        boxShadow: `0 12px 24px ${color}40`,
    },
}));

const OrderCard = styled(Card)(({ theme }) => ({
    background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
    borderRadius: 16,
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
    },
}));

const HeaderCard = styled(Card)(({ theme }) => ({
    background: 'linear-gradient(135deg, #ffffff 0%, #f0f4ff 100%)',
    borderRadius: 20,
    marginBottom: theme.spacing(3),
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
}));

const BalanceCard = styled(Card)(({ theme }) => ({
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: '#ffffff',
    borderRadius: 20,
    marginBottom: theme.spacing(3),
    boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)',
}));

const ActionButton = styled(Button)(({ theme, bgcolor }) => ({
    background: `linear-gradient(135deg, ${bgcolor} 0%, ${bgcolor}dd 100%)`,
    color: '#ffffff',
    borderRadius: 12,
    padding: '12px 24px',
    fontWeight: 600,
    textTransform: 'none',
    boxShadow: `0 4px 12px ${bgcolor}40`,
    '&:hover': {
        background: `linear-gradient(135deg, ${bgcolor}dd 0%, ${bgcolor} 100%)`,
        transform: 'translateY(-2px)',
        boxShadow: `0 6px 16px ${bgcolor}60`,
    },
}));

const DeliveryPartnerDashboard = () => {
    const navigate = useNavigate();
    const { userInfo } = useSelector((state) => state.user);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState({
        todayOrders: 0,
        activeDeliveries: 0,
        totalDeliveries: 0,
        todayCompleted: 0,
        totalEarnings: 0,
        todayEarnings: 0,
        rating: 5,
        onTimeRate: 100,
        withdrawals: []
    });
    const [orders, setOrders] = useState([]);

    // Withdrawal State
    const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [withdrawLoading, setWithdrawLoading] = useState(false);
    const [withdrawError, setWithdrawError] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const config = {
                headers: {
                    Authorization: `Bearer ${userInfo.token}`,
                },
            };

            const [statsRes, ordersRes] = await Promise.all([
                axios.get(`${process.env.REACT_APP_API_URL}/api/dp/dashboard`, config),
                axios.get(`${process.env.REACT_APP_API_URL}/api/dp/my-orders?limit=10`, config)
            ]);

            if (statsRes.data) {
                setStats(statsRes.data.stats);
            }
            if (ordersRes.data) {
                setOrders(ordersRes.data.orders || []);
            }
            setError(null);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const handleWithdrawRequest = async () => {
        if (!withdrawAmount || isNaN(withdrawAmount) || Number(withdrawAmount) <= 0) {
            setWithdrawError('Please enter a valid amount greater than 0');
            return;
        }

        const availableBalance = stats.totalEarnings - (stats.withdrawals?.reduce((acc, w) => w.status !== 'rejected' ? acc + w.amount : acc, 0) || 0);
        
        if (Number(withdrawAmount) > availableBalance) {
            setWithdrawError('Withdrawal amount cannot exceed your available balance.');
            return;
        }

        try {
            setWithdrawLoading(true);
            setWithdrawError(null);
            const config = {
                headers: {
                    Authorization: `Bearer ${userInfo.token}`,
                },
            };
            const { data } = await axios.post(
                `${process.env.REACT_APP_API_URL}/api/dp/request-withdrawal`,
                { amount: Number(withdrawAmount) },
                config
            );

            if (data.success) {
                alert('Withdrawal request submitted successfully');
                setShowWithdrawDialog(false);
                setWithdrawAmount('');
                fetchData(); // Refresh stats
            }
        } catch (err) {
            setWithdrawError(err.response?.data?.message || err.message);
        } finally {
            setWithdrawLoading(false);
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            assigned: '#3b82f6',
            picked_up: '#f59e0b',
            in_transit: '#8b5cf6',
            delivered: '#10b981',
        };
        return colors[status] || '#6b7280';
    };

    const getStatusLabel = (status) => {
        const labels = {
            assigned: 'Assigned',
            picked_up: 'Picked Up',
            in_transit: 'In Transit',
            delivered: 'Delivered',
        };
        return labels[status] || status;
    };

    const handleOrderClick = (orderId) => {
        navigate(`/delivery-partner/order/${orderId}`);
    };

    if (loading) {
        return (
            <DashboardContainer>
                <Container maxWidth="lg">
                    <LoadingState message="Loading delivery dashboard..." />
                </Container>
            </DashboardContainer>
        );
    }

    const availableBalance = stats.totalEarnings - (stats.withdrawals?.reduce((acc, w) => w.status !== 'rejected' ? acc + w.amount : acc, 0) || 0);

    return (
        <DashboardContainer>
            <Container maxWidth="lg">
                {/* Header */}
                <Fade in timeout={500}>
                    <HeaderCard>
                        <CardContent>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Box display="flex" alignItems="center" gap={2}>
                                    <Avatar
                                        sx={{
                                            width: 64,
                                            height: 64,
                                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        }}
                                    >
                                        <Person sx={{ fontSize: 40 }} />
                                    </Avatar>
                                    <Box>
                                        <Typography variant="h4" fontWeight="700" color="primary">
                                            Welcome Back! 👋
                                        </Typography>
                                        <Typography variant="body1" color="textSecondary">
                                            {userInfo?.name || 'Delivery Partner'}
                                        </Typography>
                                    </Box>
                                </Box>
                                <Box display="flex" gap={1}>
                                    <IconButton
                                        onClick={() => navigate('/delivery-partner/help')}
                                        sx={{
                                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                            color: '#ffffff',
                                            '&:hover': { background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)' },
                                        }}
                                    >
                                        <Help />
                                    </IconButton>
                                    <IconButton
                                        onClick={() => navigate('/delivery-partner/profile')}
                                        sx={{
                                            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                            color: '#ffffff',
                                            '&:hover': { background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)' },
                                        }}
                                    >
                                        <Person />
                                    </IconButton>
                                    <IconButton
                                        onClick={() => navigate('/logout')}
                                        sx={{
                                            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                            color: '#ffffff',
                                            '&:hover': { background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)' },
                                        }}
                                    >
                                        <Logout />
                                    </IconButton>
                                </Box>
                            </Box>
                        </CardContent>
                    </HeaderCard>
                </Fade>

                {/* Error Alert */}
                {error && (
                    <Fade in>
                        <Box sx={{ mb: 3 }}>
                            <ErrorState
                                title="Unable to load dashboard"
                                description={error}
                                actionLabel="Retry"
                                onAction={fetchData}
                            />
                        </Box>
                    </Fade>
                )}

                {/* Stats Cards */}
                <Grid container spacing={3} mb={4}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Grow in timeout={600}>
                            <StatsCard color="#10b981">
                                <CardContent>
                                    <Box display="flex" alignItems="center" justifyContent="space-between">
                                        <Box>
                                            <Typography variant="h4" fontWeight="700" color="#10b981">
                                                ₹{stats?.totalEarnings?.toLocaleString('en-IN') || 0}
                                            </Typography>
                                            <Typography variant="body2" color="textSecondary" fontWeight="600">
                                                Total Earned
                                            </Typography>
                                        </Box>
                                        <TrendingUp sx={{ fontSize: 40, color: '#10b981', opacity: 0.3 }} />
                                    </Box>
                                </CardContent>
                            </StatsCard>
                        </Grow>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Grow in timeout={700}>
                            <StatsCard color="#3b82f6">
                                <CardContent>
                                    <Box display="flex" alignItems="center" justifyContent="space-between">
                                        <Box>
                                            <Typography variant="h4" fontWeight="700" color="#3b82f6">
                                                ₹{stats?.todayEarnings?.toLocaleString('en-IN') || 0}
                                            </Typography>
                                            <Typography variant="body2" color="textSecondary" fontWeight="600">
                                                Today's Earnings
                                            </Typography>
                                        </Box>
                                        <CheckCircle sx={{ fontSize: 40, color: '#3b82f6', opacity: 0.3 }} />
                                    </Box>
                                </CardContent>
                            </StatsCard>
                        </Grow>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Grow in timeout={800}>
                            <StatsCard color="#f59e0b">
                                <CardContent>
                                    <Box display="flex" alignItems="center" justifyContent="space-between">
                                        <Box>
                                            <Typography variant="h4" fontWeight="700" color="#f59e0b">
                                                {stats?.activeDeliveries || 0}
                                            </Typography>
                                            <Typography variant="body2" color="textSecondary" fontWeight="600">
                                                Active Deliveries
                                            </Typography>
                                        </Box>
                                        <LocalShipping sx={{ fontSize: 40, color: '#f59e0b', opacity: 0.3 }} />
                                    </Box>
                                </CardContent>
                            </StatsCard>
                        </Grow>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Grow in timeout={900}>
                            <StatsCard color="#8b5cf6">
                                <CardContent>
                                    <Box display="flex" alignItems="center" justifyContent="space-between">
                                        <Box>
                                            <Typography variant="h4" fontWeight="700" color="#8b5cf6">
                                                {stats?.rating?.toFixed(1) || '5.0'}
                                            </Typography>
                                            <Typography variant="body2" color="textSecondary" fontWeight="600">
                                                Your Rating
                                            </Typography>
                                        </Box>
                                        <Star sx={{ fontSize: 40, color: '#8b5cf6', opacity: 0.3 }} />
                                    </Box>
                                </CardContent>
                            </StatsCard>
                        </Grow>
                    </Grid>
                </Grid>

                {/* Granular Order Stats */}
                <Grid container spacing={3} mb={4}>
                    <Grid item xs={12} sm={4}>
                        <Grow in timeout={1000}>
                            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
                                <CardContent>
                                    <Box display="flex" alignItems="center" gap={2}>
                                        <Assignment color="primary" sx={{ fontSize: 32 }} />
                                        <Box>
                                            <Typography variant="h5" fontWeight="700">
                                                {stats?.assignedCount || 0}
                                            </Typography>
                                            <Typography variant="body2" color="textSecondary">
                                                Assigned (Pending Pickup)
                                            </Typography>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grow>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <Grow in timeout={1100}>
                            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
                                <CardContent>
                                    <Box display="flex" alignItems="center" gap={2}>
                                        <LocalShipping color="warning" sx={{ fontSize: 32 }} />
                                        <Box>
                                            <Typography variant="h5" fontWeight="700">
                                                {stats?.inTransitCount || 0}
                                            </Typography>
                                            <Typography variant="body2" color="textSecondary">
                                                In Transit (Picked Up)
                                            </Typography>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grow>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <Grow in timeout={1200}>
                            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
                                <CardContent>
                                    <Box display="flex" alignItems="center" gap={2}>
                                        <CheckCircle color="success" sx={{ fontSize: 32 }} />
                                        <Box>
                                            <Typography variant="h5" fontWeight="700">
                                                {stats?.todayCompleted || 0}
                                            </Typography>
                                            <Typography variant="body2" color="textSecondary">
                                                Completed Today
                                            </Typography>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grow>
                    </Grid>
                </Grid>

                {/* Balance & Withdrawal Section */}
                <Fade in timeout={1000}>
                    <BalanceCard>
                        <CardContent>
                            <Grid container alignItems="center" spacing={2}>
                                <Grid item xs={12} sm={8}>
                                    <Typography variant="h6" sx={{ opacity: 0.9 }}>
                                        Available Balance
                                    </Typography>
                                    <Typography variant="h3" fontWeight="800">
                                        ₹{availableBalance.toLocaleString('en-IN')}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={4} sx={{ textAlign: { sm: 'right' } }}>
                                    <Button
                                        variant="contained"
                                        size="large"
                                        onClick={() => setShowWithdrawDialog(true)}
                                        sx={{
                                            bgcolor: 'rgba(255,255,255,0.2)',
                                            '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                                            borderRadius: 3,
                                            px: 4,
                                            backdropFilter: 'blur(10px)',
                                        }}
                                        startIcon={<AccountBalanceWallet />}
                                    >
                                        Request Payout
                                    </Button>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </BalanceCard>
                </Fade>

                {/* Orders Section */}
                <Fade in timeout={1000}>
                    <Box mt={4}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                            <Typography variant="h5" fontWeight="700" color="#ffffff">
                                📦 Your Orders
                            </Typography>
                            <ActionButton
                                bgcolor="#3b82f6"
                                startIcon={<Assignment />}
                                onClick={() => navigate('/delivery-partner/orders')}
                            >
                                View All Orders
                            </ActionButton>
                        </Box>

                        {orders.length === 0 ? (
                            <EmptyState
                                title="No active orders"
                                description="New orders will appear here when assigned by sellers."
                                actionLabel="Refresh"
                                onAction={fetchData}
                            />
                        ) : (
                            <Grid container spacing={3}>
                                {orders.map((order, index) => (
                                    <Grid item xs={12} key={order._id}>
                                        <Grow in timeout={1100 + index * 100}>
                                            <OrderCard onClick={() => handleOrderClick(order._id)}>
                                                <CardContent>
                                                    <Grid container spacing={2} alignItems="center">
                                                        {/* Order ID & Status */}
                                                        <Grid item xs={12} sm={3}>
                                                            <Typography variant="h6" fontWeight="700" color="primary">
                                                                #{order._id.slice(-8).toUpperCase()}
                                                            </Typography>
                                                            <Chip
                                                                label={getStatusLabel(order.deliveryPartnerStatus)}
                                                                size="small"
                                                                sx={{
                                                                    mt: 1,
                                                                    background: getStatusColor(order.deliveryPartnerStatus),
                                                                    color: '#ffffff',
                                                                    fontWeight: 600,
                                                                }}
                                                            />
                                                        </Grid>

                                                        {/* Customer Info */}
                                                        <Grid item xs={12} sm={3}>
                                                            <Typography variant="body2" color="textSecondary" fontWeight="600">
                                                                Customer
                              </Typography>
                                                            <Typography variant="body1" fontWeight="600">
                                                                {order.user?.name}
                                                            </Typography>
                                                            <Typography variant="caption" color="textSecondary">
                                                                {order.user?.phone}
                                                            </Typography>
                                                        </Grid>

                                                        {/* Delivery Address */}
                                                        <Grid item xs={12} sm={4}>
                                                            <Typography variant="body2" color="textSecondary" fontWeight="600">
                                                                Delivery Address
                              </Typography>
                                                            <Typography variant="body2">
                                                                {order.shippingAddress?.street}, {order.shippingAddress?.city}
                                                            </Typography>
                                                            <Typography variant="caption" color="textSecondary">
                                                                {order.shippingAddress?.pinCode}
                                                            </Typography>
                                                        </Grid>

                                                        {/* Payment & Amount */}
                                                        <Grid item xs={12} sm={2}>
                                                            <Typography variant="body2" color="textSecondary" fontWeight="600">
                                                                Payment
                              </Typography>
                                                            <Chip
                                                                label={order.paymentMethod === 'cod' ? 'COD' : 'Prepaid'}
                                                                size="small"
                                                                color={order.paymentMethod === 'cod' ? 'warning' : 'success'}
                                                                sx={{ mt: 0.5 }}
                                                            />
                                                            <Typography variant="h6" fontWeight="700" color="primary" mt={1}>
                                                                ₹{order.totalPrice?.toFixed(2)}
                                                            </Typography>
                                                        </Grid>
                                                    </Grid>
                                                </CardContent>
                                            </OrderCard>
                                        </Grow>
                                    </Grid>
                                ))}
                            </Grid>
                        )}
                    </Box>
                </Fade>

                {/* Withdrawal History */}
                {stats.withdrawals?.length > 0 && (
                    <Fade in timeout={1100}>
                        <Box mt={6}>
                            <Typography variant="h5" fontWeight="700" color="#ffffff" mb={3}>
                                💰 Recent Withdrawals
                            </Typography>
                            <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
                                {stats.withdrawals.map((w, index) => (
                                    <Box key={w._id}>
                                        <Box p={2} display="flex" justifyContent="space-between" alignItems="center">
                                            <Box>
                                                <Typography fontWeight="700">₹{w.amount.toLocaleString('en-IN')}</Typography>
                                                <Typography variant="caption" color="textSecondary">
                                                    Requested on {new Date(w.createdAt).toLocaleDateString()}
                                                </Typography>
                                            </Box>
                                            <Chip
                                                label={w.status}
                                                size="small"
                                                color={w.status === 'processed' ? 'success' : w.status === 'pending' ? 'warning' : 'default'}
                                            />
                                        </Box>
                                        {index < stats.withdrawals.length - 1 && <Divider />}
                                    </Box>
                                ))}
                            </Paper>
                        </Box>
                    </Fade>
                )}

                {/* Quick Actions */}
                <Fade in timeout={1200}>
                    <Box mt={4}>
                        <Typography variant="h5" fontWeight="700" color="#ffffff" mb={3}>
                            ⚡ Quick Actions
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6} md={3}>
                                <ActionButton
                                    fullWidth
                                    bgcolor="#10b981"
                                    startIcon={<Phone />}
                                    onClick={() => window.location.href = `tel:${userInfo?.sellerPhone || ''}`}
                                >
                                    Call Seller
                                </ActionButton>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <ActionButton
                                    fullWidth
                                    bgcolor="#ef4444"
                                    startIcon={<Warning />}
                                    onClick={() => navigate('/delivery-partner/emergency')}
                                >
                                    Emergency Alert
                                </ActionButton>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <ActionButton
                                    fullWidth
                                    bgcolor="#8b5cf6"
                                    startIcon={<Schedule />}
                                    onClick={() => navigate('/delivery-partner/history')}
                                >
                                    View History
                                </ActionButton>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <ActionButton
                                    fullWidth
                                    bgcolor="#f59e0b"
                                    startIcon={<Help />}
                                    onClick={() => navigate('/delivery-partner/help')}
                                >
                                    Get Help
                                </ActionButton>
                            </Grid>
                        </Grid>
                    </Box>
                </Fade>

                {/* Withdrawal Dialog */}
                <Dialog
                    open={showWithdrawDialog}
                    onClose={() => setShowWithdrawDialog(false)}
                    PaperProps={{ sx: { borderRadius: 4, padding: 2, minWidth: 320 } }}
                >
                    <Box textAlign="center" py={2}>
                        <AccountBalanceWallet color="primary" sx={{ fontSize: 48, mb: 1 }} />
                        <Typography variant="h5" fontWeight="700">Request Withdrawal</Typography>
                        <Typography variant="body2" color="textSecondary">
                            Available: ₹{availableBalance.toLocaleString('en-IN')}
                        </Typography>
                    </Box>
                    <Box p={2}>
                        <TextField
                            fullWidth
                            label="Amount (₹)"
                            type="number"
                            variant="outlined"
                            value={withdrawAmount}
                            onChange={(e) => setWithdrawAmount(e.target.value)}
                            sx={{ mb: 2 }}
                            autoFocus
                        />
                        {withdrawError && (
                            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                                {withdrawError}
                            </Alert>
                        )}
                        <Box display="flex" gap={2}>
                            <Button
                                fullWidth
                                variant="outlined"
                                onClick={() => setShowWithdrawDialog(false)}
                                sx={{ borderRadius: 2, py: 1.5 }}
                            >
                                Cancel
                            </Button>
                            <Button
                                fullWidth
                                variant="contained"
                                onClick={handleWithdrawRequest}
                                disabled={withdrawLoading}
                                sx={{ borderRadius: 2, py: 1.5 }}
                            >
                                {withdrawLoading ? <CircularProgress size={24} color="inherit" /> : 'Confirm'}
                            </Button>
                        </Box>
                    </Box>
                </Dialog>
            </Container>
        </DashboardContainer>
    );
};

export default DeliveryPartnerDashboard;
