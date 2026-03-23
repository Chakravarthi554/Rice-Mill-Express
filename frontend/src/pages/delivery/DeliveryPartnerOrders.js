import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Chip,
    Grid,
    CircularProgress,
    Alert,
    Tabs,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Button,
    IconButton,
} from '@mui/material';
import { Visibility, LocalShipping, CheckCircle } from '@mui/icons-material';

const DeliveryPartnerOrders = () => {
    const navigate = useNavigate();
    const { userInfo } = useSelector((state) => state.user);

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState(0);

    const statusFilters = [
        { label: 'All', value: '' },
        { label: 'Assigned', value: 'assigned' },
        { label: 'In Transit', value: 'in_transit' },
        { label: 'Delivered', value: 'delivered' },
    ];

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const config = {
                headers: {
                    Authorization: `Bearer ${userInfo.token}`,
                },
            };

            const { data } = await axios.get(
                `${process.env.REACT_APP_API_URL}/api/delivery-partners/my-deliveries`,
                config
            );

            setOrders(data.orders || []);
            setError('');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch orders');
        } finally {
            setLoading(false);
        }
    };

    const getFilteredOrders = () => {
        if (activeTab === 0) return orders;

        const filterValue = statusFilters[activeTab].value;
        return orders.filter((order) => order.deliveryPartnerStatus === filterValue);
    };

    const getStatusColor = (status) => {
        const colors = {
            not_started: 'default',
            assigned: 'info',
            in_transit: 'warning',
            delivered: 'success',
        };
        return colors[status] || 'default';
    };

    const getOrderStatusColor = (status) => {
        const colors = {
            placed: 'default',
            processing: 'info',
            packed: 'info',
            shipped: 'primary',
            out_for_delivery: 'warning',
            delivered: 'success',
            cancelled: 'error',
        };
        return colors[status] || 'default';
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box p={3}>
            <Typography variant="h4" gutterBottom>
                My Deliveries
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {/* Stats Cards */}
            <Grid container spacing={2} mb={3}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Typography variant="h4" color="primary">
                                {orders.length}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                Total Orders
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Typography variant="h4" color="info.main">
                                {orders.filter((o) => o.deliveryPartnerStatus === 'assigned').length}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                Assigned
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Typography variant="h4" color="warning.main">
                                {orders.filter((o) => ['picked_up', 'in_transit'].includes(o.deliveryPartnerStatus)).length}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                In Transit
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Typography variant="h4" color="success.main">
                                {orders.filter((o) => o.deliveryPartnerStatus === 'delivered').length}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                Delivered
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Tabs */}
            <Card>
                <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    {statusFilters.map((filter, index) => (
                        <Tab key={index} label={filter.label} />
                    ))}
                </Tabs>

                {/* Orders Table */}
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Order ID</TableCell>
                                <TableCell>Customer</TableCell>
                                <TableCell>Address</TableCell>
                                <TableCell>Amount</TableCell>
                                <TableCell>Order Status</TableCell>
                                <TableCell>Delivery Status</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {getFilteredOrders().length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center">
                                        <Typography variant="body2" color="textSecondary" py={3}>
                                            No orders found
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                getFilteredOrders().map((order) => (
                                    <TableRow key={order._id} hover>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight="bold">
                                                #{order._id.slice(-8)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">{order.user?.name}</Typography>
                                            <Typography variant="caption" color="textSecondary">
                                                {order.user?.phone}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">
                                                {order.shippingAddress?.city}, {order.shippingAddress?.state}
                                            </Typography>
                                            <Typography variant="caption" color="textSecondary">
                                                {order.shippingAddress?.pinCode}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight="bold">
                                                ₹{order.totalPrice?.toFixed(2)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={order.orderStatus?.replace('_', ' ').toUpperCase()}
                                                color={getOrderStatusColor(order.orderStatus)}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={order.deliveryPartnerStatus?.replace('_', ' ').toUpperCase() || 'NOT STARTED'}
                                                color={getStatusColor(order.deliveryPartnerStatus)}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                startIcon={<Visibility />}
                                                onClick={() => navigate(`/delivery-partner/orders/${order._id}`)}
                                            >
                                                View
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Card>
        </Box>
    );
};

export default DeliveryPartnerOrders;
