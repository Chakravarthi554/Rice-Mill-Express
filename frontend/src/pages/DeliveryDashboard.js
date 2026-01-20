import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
    Box, Typography, Container, Grid, Card, CardContent, Button,
    Dialog, DialogTitle, DialogContent, Alert, CircularProgress, Chip
} from '@mui/material';
import { CheckCircle, LocalShipping, AttachMoney } from '@mui/icons-material';
import DeliveryOtpVerification from '../components/delivery/DeliveryOtpVerification';
import Message from '../components/common/Message';
import Loader from '../components/common/Loader';
import axios from 'axios';

const DeliveryDashboard = () => {
    const { userInfo } = useSelector((state) => state.userLogin);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showOtpModal, setShowOtpModal] = useState(false);

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

            // Fetch orders assigned to this delivery partner
            const { data } = await axios.get('/api/delivery-partners/my-deliveries?status=out_for_delivery', config);
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
        setShowOtpModal(true);
    };

    const handleDeliverySuccess = (data) => {
        console.log('Delivery confirmed:', data);
        setShowOtpModal(false);
        setSelectedOrder(null);

        // Refresh deliveries list
        fetchMyDeliveries();

        // Show success message
        alert('✅ Delivery confirmed successfully!');
    };

    // Calculate stats
    const activeDeliveries = orders.filter(o => o.orderStatus === 'out_for_delivery').length;
    const completedToday = orders.filter(o =>
        o.orderStatus === 'delivered' &&
        new Date(o.deliveredAt).toDateString() === new Date().toDateString()
    ).length;
    const cashInHand = orders
        .filter(o => o.paymentMethod === 'cod' && o.codCollected && !o.codSettled)
        .reduce((acc, o) => acc + o.totalPrice, 0);

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" gutterBottom>
                🚚 Delivery Partner Dashboard
            </Typography>

            {/* Stats Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={4}>
                    <Card sx={{ bgcolor: '#e3f2fd' }}>
                        <CardContent>
                            <Box display="flex" alignItems="center" gap={2}>
                                <LocalShipping fontSize="large" color="primary" />
                                <Box>
                                    <Typography variant="h6">Active Deliveries</Typography>
                                    <Typography variant="h3">{activeDeliveries}</Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Card sx={{ bgcolor: '#e8f5e9' }}>
                        <CardContent>
                            <Box display="flex" alignItems="center" gap={2}>
                                <CheckCircle fontSize="large" color="success" />
                                <Box>
                                    <Typography variant="h6">Completed Today</Typography>
                                    <Typography variant="h3">{completedToday}</Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Card sx={{ bgcolor: '#fff3e0' }}>
                        <CardContent>
                            <Box display="flex" alignItems="center" gap={2}>
                                <AttachMoney fontSize="large" color="warning" />
                                <Box>
                                    <Typography variant="h6">Cash in Hand</Typography>
                                    <Typography variant="h3">₹{cashInHand}</Typography>
                                    <Typography variant="caption">To be deposited</Typography>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Typography variant="h5" gutterBottom>
                📦 Active Deliveries
            </Typography>

            {loading ? (
                <Loader />
            ) : error ? (
                <Message severity="error">{error}</Message>
            ) : orders.length === 0 ? (
                <Alert severity="info">No active deliveries assigned to you</Alert>
            ) : (
                <Grid container spacing={3}>
                    {orders.map((order) => (
                        <Grid item xs={12} md={6} key={order._id}>
                            <Card>
                                <CardContent>
                                    <Box display="flex" justifyContent="space-between" mb={2}>
                                        <Typography variant="h6">
                                            Order #{order.orderNumber || order._id.substring(18, 24).toUpperCase()}
                                        </Typography>
                                        <Chip
                                            label={order.orderStatus}
                                            color={order.orderStatus === 'delivered' ? 'success' : 'warning'}
                                        />
                                    </Box>

                                    <Typography><strong>Customer:</strong> {order.user?.name}</Typography>
                                    <Typography><strong>Phone:</strong> {order.user?.phone}</Typography>
                                    <Typography>
                                        <strong>Address:</strong> {order.shippingAddress?.street}, {order.shippingAddress?.city}
                                    </Typography>
                                    <Typography><strong>Amount:</strong> ₹{order.totalPrice}</Typography>
                                    <Typography>
                                        <strong>Payment:</strong> {order.paymentMethod?.toUpperCase()}
                                        {order.paymentMethod === 'cod' && ' (Collect Cash)'}
                                    </Typography>

                                    {order.orderStatus === 'out_for_delivery' && (
                                        <Button
                                            variant="contained"
                                            color="success"
                                            fullWidth
                                            sx={{ mt: 2 }}
                                            startIcon={<CheckCircle />}
                                            onClick={() => handleOpenDeliveryModal(order)}
                                        >
                                            Confirm Delivery
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* Firebase OTP Verification Modal */}
            {showOtpModal && selectedOrder && (
                <DeliveryOtpVerification
                    order={selectedOrder}
                    onSuccess={handleDeliverySuccess}
                    onCancel={() => {
                        setShowOtpModal(false);
                        setSelectedOrder(null);
                    }}
                />
            )}
        </Container>
    );
};

export default DeliveryDashboard;
