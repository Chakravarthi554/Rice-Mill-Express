import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Box,
    Typography,
    Paper,
    Grid,
    Card,
    CardContent,
    Chip,
    Button,
    Avatar,
    Divider
} from '@mui/material';
import {
    LocalShipping,
    CheckCircle,
    Pending,
    Assignment,
    ExitToApp
} from '@mui/icons-material';
import { logoutUser } from '../redux/actions/userActions';
import Loader from '../components/common/Loader';
import { EmptyState, ErrorState } from '../components/common/PageStates';

const DeliveryPartnerDashboard = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const { userInfo } = useSelector(state => state.userLogin);

    useEffect(() => {
        const fetchAssignedOrders = async () => {
            try {
                const response = await fetch('/api/delivery-partners/my-deliveries', {
                    headers: {
                        'Authorization': `Bearer ${userInfo.token}`
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch orders');
                }

                const data = await response.json();
                setOrders(data.orders || []);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (userInfo?.token) {
            fetchAssignedOrders();
        }
    }, [userInfo]);

    const handleLogout = () => {
        dispatch(logoutUser());
        navigate('/login');
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'delivered':
                return 'success';
            case 'out_for_delivery':
                return 'primary';
            case 'ready_for_delivery':
                return 'warning';
            default:
                return 'default';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'delivered':
                return <CheckCircle />;
            case 'out_for_delivery':
                return <LocalShipping />;
            default:
                return <Pending />;
        }
    };

    if (loading) return <Loader />;

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            {/* Header */}
            <Paper elevation={3} sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <Grid container alignItems="center" spacing={2}>
                    <Grid item>
                        <Avatar sx={{ width: 64, height: 64, bgcolor: 'white', color: '#667eea' }}>
                            <LocalShipping fontSize="large" />
                        </Avatar>
                    </Grid>
                    <Grid item xs>
                        <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                            Delivery Partner Dashboard
                        </Typography>
                        <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                            Welcome, {userInfo?.user?.name || 'Partner'}
                        </Typography>
                    </Grid>
                    <Grid item>
                        <Button
                            variant="contained"
                            color="error"
                            startIcon={<ExitToApp />}
                            onClick={handleLogout}
                        >
                            Logout
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            {/* Stats */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={4}>
                    <Card elevation={2}>
                        <CardContent>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Box>
                                    <Typography color="textSecondary" gutterBottom>
                                        Total Assigned
                                    </Typography>
                                    <Typography variant="h3" component="div">
                                        {orders.length}
                                    </Typography>
                                </Box>
                                <Assignment sx={{ fontSize: 48, color: '#667eea' }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Card elevation={2}>
                        <CardContent>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Box>
                                    <Typography color="textSecondary" gutterBottom>
                                        Out for Delivery
                                    </Typography>
                                    <Typography variant="h3" component="div">
                                        {orders.filter(o => o.status === 'out_for_delivery').length}
                                    </Typography>
                                </Box>
                                <LocalShipping sx={{ fontSize: 48, color: '#f59e0b' }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Card elevation={2}>
                        <CardContent>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Box>
                                    <Typography color="textSecondary" gutterBottom>
                                        Delivered
                                    </Typography>
                                    <Typography variant="h3" component="div">
                                        {orders.filter(o => o.status === 'delivered').length}
                                    </Typography>
                                </Box>
                                <CheckCircle sx={{ fontSize: 48, color: '#10b981' }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Orders List */}
            <Paper elevation={3} sx={{ p: 3 }}>
                <Typography variant="h5" gutterBottom sx={{ mb: 2, fontWeight: 'bold' }}>
                    My Assigned Orders
                </Typography>
                <Divider sx={{ mb: 2 }} />

                {error && (
                    <Box sx={{ mb: 2 }}>
                        <ErrorState
                            title="Failed to load deliveries"
                            description={error}
                            actionLabel="Retry"
                            onAction={() => window.location.reload()}
                        />
                    </Box>
                )}

                {orders.length === 0 ? (
                    <EmptyState
                        title="No orders assigned yet"
                        description="Check back later for new deliveries."
                        actionLabel="Refresh"
                        onAction={() => window.location.reload()}
                    />
                ) : (
                    <Grid container spacing={2}>
                        {orders.map((order) => (
                            <Grid item xs={12} key={order._id}>
                                <Card variant="outlined" sx={{ '&:hover': { boxShadow: 3 } }}>
                                    <CardContent>
                                        <Grid container spacing={2} alignItems="center">
                                            <Grid item>
                                                {getStatusIcon(order.status)}
                                            </Grid>
                                            <Grid item xs>
                                                <Typography variant="h6" gutterBottom>
                                                    Order #{order._id?.slice(-8)}
                                                </Typography>
                                                <Typography variant="body2" color="textSecondary">
                                                    Customer: {order.shippingAddress?.name || 'N/A'}
                                                </Typography>
                                                <Typography variant="body2" color="textSecondary">
                                                    Address: {order.shippingAddress?.address}, {order.shippingAddress?.city}
                                                </Typography>
                                            </Grid>
                                            <Grid item>
                                                <Chip
                                                    label={order.status?.replace(/_/g, ' ').toUpperCase()}
                                                    color={getStatusColor(order.status)}
                                                    icon={getStatusIcon(order.status)}
                                                />
                                            </Grid>
                                            <Grid item>
                                                <Typography variant="h6" color="primary">
                                                    ₹{order.totalPrice}
                                                </Typography>
                                            </Grid>
                                        </Grid>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                )}
            </Paper>

            {/* Info Box */}
            <Alert severity="info" sx={{ mt: 3 }}>
                <Typography variant="body2">
                    <strong>Note:</strong> For full delivery management features including photo upload and delivery confirmation,
                    please use the mobile app. This web dashboard is for viewing assigned orders only.
                </Typography>
            </Alert>
        </Container>
    );
};

export default DeliveryPartnerDashboard;
