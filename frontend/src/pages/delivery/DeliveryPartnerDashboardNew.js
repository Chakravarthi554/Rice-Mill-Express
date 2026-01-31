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
    Navigation,
    Assignment,
    Phone,
} from '@mui/icons-material';
import { styled, keyframes } from '@mui/material/styles';

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

    const [stats, setStats] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchDashboardData();
        fetchOrders();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${userInfo.token}`,
                },
            };

            const { data } = await axios.get(
                `${process.env.REACT_APP_API_URL}/api/dp/dashboard`,
                config
            );

            setStats(data.stats);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const fetchOrders = async () => {
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${userInfo.token}`,
                },
            };

            const { data } = await axios.get(
                `${process.env.REACT_APP_API_URL}/api/dp/my-orders?limit=10`,
                config
            );

            setOrders(data.orders || []);
        } catch (err) {
            console.error('Failed to fetch orders:', err);
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
                    <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                        <Box textAlign="center">
                            <LocalShipping sx={{ fontSize: 80, color: '#ffffff', mb: 2 }} />
                            <Typography variant="h5" color="#ffffff">
                                Loading Dashboard...
                            </Typography>
                            <LinearProgress sx={{ mt: 2, width: 200 }} />
                        </Box>
                    </Box>
                </Container>
            </DashboardContainer>
        );
    }

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
                        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError('')}>
                            {error}
                        </Alert>
                    </Fade>
                )}

                {/* Stats Cards */}
                <Grid container spacing={3} mb={4}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Grow in timeout={600}>
                            <StatsCard color="#3b82f6">
                                <CardContent>
                                    <Box display="flex" alignItems="center" justifyContent="space-between">
                                        <Box>
                                            <Typography variant="h3" fontWeight="700" color="#3b82f6">
                                                {stats?.todayOrders || 0}
                                            </Typography>
                                            <Typography variant="body2" color="textSecondary" fontWeight="600">
                                                Today's Orders
                                            </Typography>
                                        </Box>
                                        <Assignment sx={{ fontSize: 48, color: '#3b82f6', opacity: 0.3 }} />
                                    </Box>
                                </CardContent>
                            </StatsCard>
                        </Grow>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Grow in timeout={700}>
                            <StatsCard color="#f59e0b">
                                <CardContent>
                                    <Box display="flex" alignItems="center" justifyContent="space-between">
                                        <Box>
                                            <Typography variant="h3" fontWeight="700" color="#f59e0b">
                                                {stats?.activeDeliveries || 0}
                                            </Typography>
                                            <Typography variant="body2" color="textSecondary" fontWeight="600">
                                                Active Deliveries
                                            </Typography>
                                        </Box>
                                        <LocalShipping sx={{ fontSize: 48, color: '#f59e0b', opacity: 0.3 }} />
                                    </Box>
                                </CardContent>
                            </StatsCard>
                        </Grow>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Grow in timeout={800}>
                            <StatsCard color="#10b981">
                                <CardContent>
                                    <Box display="flex" alignItems="center" justifyContent="space-between">
                                        <Box>
                                            <Typography variant="h3" fontWeight="700" color="#10b981">
                                                {stats?.todayCompleted || 0}
                                            </Typography>
                                            <Typography variant="body2" color="textSecondary" fontWeight="600">
                                                Today Completed
                                            </Typography>
                                        </Box>
                                        <CheckCircle sx={{ fontSize: 48, color: '#10b981', opacity: 0.3 }} />
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
                                            <Typography variant="h3" fontWeight="700" color="#8b5cf6">
                                                {stats?.rating?.toFixed(1) || '5.0'}
                                            </Typography>
                                            <Typography variant="body2" color="textSecondary" fontWeight="600">
                                                Your Rating
                                            </Typography>
                                        </Box>
                                        <Star sx={{ fontSize: 48, color: '#8b5cf6', opacity: 0.3 }} />
                                    </Box>
                                </CardContent>
                            </StatsCard>
                        </Grow>
                    </Grid>
                </Grid>

                {/* Orders Section */}
                <Fade in timeout={1000}>
                    <Box>
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
                            <Paper
                                sx={{
                                    p: 6,
                                    textAlign: 'center',
                                    background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                                    borderRadius: 3,
                                }}
                            >
                                <LocalShipping sx={{ fontSize: 80, color: '#cbd5e1', mb: 2 }} />
                                <Typography variant="h6" color="textSecondary">
                                    No active orders at the moment
                                </Typography>
                                <Typography variant="body2" color="textSecondary" mt={1}>
                                    New orders will appear here when assigned by sellers
                                </Typography>
                            </Paper>
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
            </Container>
        </DashboardContainer>
    );
};

export default DeliveryPartnerDashboard;
