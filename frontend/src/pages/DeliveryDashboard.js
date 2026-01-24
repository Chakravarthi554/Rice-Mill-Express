import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
    Box, Typography, Container, Grid, Card, CardContent, Button,
    Dialog, DialogTitle, DialogContent, Alert, CircularProgress, Chip,
    Tabs, Tab, Paper
} from '@mui/material';
import {
    CheckCircle, LocalShipping, AttachMoney,
    History, TrendingUp, PhotoCamera
} from '@mui/icons-material';
import DeliveryPhotoConfirmation from '../components/delivery/DeliveryPhotoConfirmation';
import Message from '../components/common/Message';
import Loader from '../components/common/Loader';
import axios from 'axios';

const DeliveryDashboard = () => {
    const { userInfo } = useSelector((state) => state.userLogin);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showPhotoModal, setShowPhotoModal] = useState(false);
    const [tabValue, setTabValue] = useState(0);

    // Fetch orders assigned to this delivery partner
    useEffect(() => {
        fetchMyDeliveries();
    }, []);

    const fetchMyDeliveries = async () => {
        try {
            setLoading(true);
            const config = {
                headers: {
                    Authorization: `Bearer ${userInfo.accessToken || userInfo.token}`,
                },
            };

            // Fetch orders assigned to this delivery partner (Returns all statuses for history)
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

    const handleOpenDeliveryModal = (order) => {
        setSelectedOrder(order);
        setShowPhotoModal(true);
    };

    const handleDeliverySuccess = (data) => {
        console.log('Delivery confirmed:', data);
        setShowPhotoModal(false);
        setSelectedOrder(null);
        fetchMyDeliveries();
        alert('✅ Delivery confirmed successfully with photo proof!');
    };

    // Calculate analytics using useMemo
    const stats = useMemo(() => {
        const active = orders.filter(o => o.orderStatus === 'out_for_delivery' || o.orderStatus === 'shipped').length;
        const delivered = orders.filter(o => o.orderStatus === 'delivered');
        const total = delivered.length;

        const today = new Date().toDateString();
        const deliveredToday = delivered.filter(o => new Date(o.deliveredAt).toDateString() === today).length;

        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const deliveredWeekly = delivered.filter(o => new Date(o.deliveredAt) > oneWeekAgo).length;

        const cashInHand = orders
            .filter(o => o.paymentMethod === 'cod' && o.codCollected && !o.codSettled)
            .reduce((acc, o) => acc + o.totalPrice, 0);

        return { active, total, deliveredToday, deliveredWeekly, cashInHand };
    }, [orders]);

    const activeOrders = orders.filter(o => o.orderStatus === 'out_for_delivery' || o.orderStatus === 'shipped');
    const completedOrders = orders.filter(o => o.orderStatus === 'delivered');

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                <Typography variant="h4" fontWeight="bold">
                    🚚 Delivery Partner
                </Typography>
                <Button variant="outlined" startIcon={<History />} onClick={fetchMyDeliveries}>
                    Refresh
                </Button>
            </Box>

            {/* Operational Analytics */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ bgcolor: '#e3f2fd', height: '100%' }}>
                        <CardContent>
                            <Box display="flex" alignItems="center" gap={2}>
                                <LocalShipping fontSize="large" color="primary" />
                                <Box>
                                    <Typography variant="body2" color="textSecondary">Active Orders</Typography>
                                    <Typography variant="h4">{stats.active}</Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ bgcolor: '#e8f5e9', height: '100%' }}>
                        <CardContent>
                            <Box display="flex" alignItems="center" gap={2}>
                                <CheckCircle fontSize="large" color="success" />
                                <Box>
                                    <Typography variant="body2" color="textSecondary">Total Done</Typography>
                                    <Typography variant="h4">{stats.total}</Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ bgcolor: '#ede7f6', height: '100%' }}>
                        <CardContent>
                            <Box display="flex" alignItems="center" gap={2}>
                                <TrendingUp fontSize="large" color="secondary" />
                                <Box>
                                    <Typography variant="body2" color="textSecondary">This Week</Typography>
                                    <Typography variant="h4">{stats.deliveredWeekly}</Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ bgcolor: '#fff3e0', height: '100%' }}>
                        <CardContent>
                            <Box display="flex" alignItems="center" gap={2}>
                                <AttachMoney fontSize="large" color="warning" />
                                <Box>
                                    <Typography variant="body2" color="textSecondary">Cash in Hand</Typography>
                                    <Typography variant="h4">₹{stats.cashInHand}</Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Tabs for Organization */}
            <Paper sx={{ mb: 3 }}>
                <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} indicatorColor="primary" textColor="primary" variant="fullWidth">
                    <Tab label={`Assigned (${activeOrders.length})`} />
                    <Tab label={`History (${completedOrders.length})`} />
                </Tabs>
            </Paper>

            {loading ? (
                <Loader />
            ) : error ? (
                <Message severity="error">{error}</Message>
            ) : (
                <Box>
                    {tabValue === 0 ? (
                        <Grid container spacing={3}>
                            {activeOrders.length === 0 ? (
                                <Grid item xs={12}>
                                    <Alert severity="info">No active deliveries assigned to you</Alert>
                                </Grid>
                            ) : (
                                activeOrders.map((order) => (
                                    <Grid item xs={12} md={6} key={order._id}>
                                        <Card elevation={2}>
                                            <CardContent>
                                                <Box display="flex" justifyContent="space-between" mb={2}>
                                                    <Typography variant="h6" fontWeight="bold">
                                                        Order #{order.orderNumber || order._id.substring(18, 24).toUpperCase()}
                                                    </Typography>
                                                    <Chip label={order.orderStatus} color="warning" size="small" />
                                                </Box>

                                                <Typography variant="body2"><strong>Customer:</strong> {order.user?.name}</Typography>
                                                <Typography variant="body2"><strong>Phone:</strong> {order.user?.phone}</Typography>
                                                <Typography variant="body2" sx={{ mb: 1 }}>
                                                    <strong>Address:</strong> {order.shippingAddress?.street}, {order.shippingAddress?.city}
                                                </Typography>
                                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                                    <Typography variant="h6" color="primary">₹{order.totalPrice}</Typography>
                                                    <Typography variant="caption" sx={{ bgcolor: '#f5f5f5', p: 0.5, borderRadius: 1 }}>
                                                        {order.paymentMethod?.toUpperCase()}
                                                    </Typography>
                                                </Box>

                                                <Button
                                                    variant="contained"
                                                    color="primary"
                                                    fullWidth
                                                    sx={{ mt: 2, height: 45, fontWeight: 'bold' }}
                                                    startIcon={<PhotoCamera />}
                                                    onClick={() => handleOpenDeliveryModal(order)}
                                                >
                                                    Confirm with Photo
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                ))
                            )}
                        </Grid>
                    ) : (
                        <Grid container spacing={2}>
                            {completedOrders.length === 0 ? (
                                <Grid item xs={12}>
                                    <Alert severity="info" variant="outlined">No delivery history yet</Alert>
                                </Grid>
                            ) : (
                                completedOrders.map((order) => (
                                    <Grid item xs={12} key={order._id}>
                                        <Card variant="outlined">
                                            <Box display="flex" p={2} alignItems="center">
                                                <Box flex={1}>
                                                    <Typography fontWeight="bold">Order #{order.orderNumber}</Typography>
                                                    <Typography variant="caption" color="textSecondary">
                                                        Delivered on: {new Date(order.deliveredAt).toLocaleString()}
                                                    </Typography>
                                                </Box>
                                                <Box flex={1}>
                                                    <Typography variant="body2">{order.user?.name}</Typography>
                                                </Box>
                                                <Box>
                                                    {order.deliveryConfirmation?.photoProofUrl && (
                                                        <Chip
                                                            label="Photo Proof"
                                                            onClick={() => window.open(order.deliveryConfirmation.photoProofUrl, '_blank')}
                                                            icon={<PhotoCamera />}
                                                            variant="outlined"
                                                            size="small"
                                                        />
                                                    )}
                                                </Box>
                                            </Box>
                                        </Card>
                                    </Grid>
                                ))
                            )}
                        </Grid>
                    )}
                </Box>
            )}

            {/* Photo-Based Delivery Confirmation Modal */}
            {showPhotoModal && selectedOrder && (
                <DeliveryPhotoConfirmation
                    order={selectedOrder}
                    onSuccess={handleDeliverySuccess}
                    onCancel={() => {
                        setShowPhotoModal(false);
                        setSelectedOrder(null);
                    }}
                />
            )}
        </Container>
    );
};

export default DeliveryDashboard;
