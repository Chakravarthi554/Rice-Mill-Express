import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import {
    Box,
    Container,
    Card,
    CardContent,
    Typography,
    Button,
    Grid,
    Chip,
    IconButton,
    Tabs,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Alert,
    CircularProgress,
    FormControl,
    Select,
    MenuItem,
} from '@mui/material';
import {
    ArrowBack,
    CheckCircle,
    Cancel,
    LocalShipping,
    FilterList,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const PageContainer = styled(Box)(({ theme }) => ({
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    paddingTop: theme.spacing(3),
    paddingBottom: theme.spacing(3),
}));

const DeliveryHistory = () => {
    const navigate = useNavigate();
    const { userInfo } = useSelector((state) => state.user);

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState(0);
    const [daysFilter, setDaysFilter] = useState(7);

    useEffect(() => {
        fetchHistory();
    }, [daysFilter, activeTab]);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const config = {
                headers: {
                    Authorization: `Bearer ${userInfo.token}`,
                },
            };

            const statusMap = ['delivered', 'delivered', 'delivered']; // All show delivered for now
            const status = statusMap[activeTab];

            const { data } = await axios.get(
                `${process.env.REACT_APP_API_URL}/api/dp/history?days=${daysFilter}&status=${status}`,
                config
            );

            setOrders(data.orders || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch history');
        } finally {
            setLoading(false);
        }
    };

    return (
        <PageContainer>
            <Container maxWidth="lg">
                <Box display="flex" alignItems="center" mb={3}>
                    <IconButton
                        onClick={() => navigate('/delivery-partner/dashboard')}
                        sx={{ color: '#ffffff', mr: 2 }}
                    >
                        <ArrowBack />
                    </IconButton>
                    <Typography variant="h4" fontWeight="700" color="#ffffff">
                        📜 Delivery History
                    </Typography>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                        {error}
                    </Alert>
                )}

                <Card sx={{ mb: 3, borderRadius: 3 }}>
                    <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                            <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
                                <Tab label="All Deliveries" />
                                <Tab label="Completed" />
                                <Tab label="Failed/Returned" />
                            </Tabs>
                            <FormControl size="small" sx={{ minWidth: 150 }}>
                                <Select
                                    value={daysFilter}
                                    onChange={(e) => setDaysFilter(e.target.value)}
                                    startAdornment={<FilterList sx={{ mr: 1 }} />}
                                >
                                    <MenuItem value={7}>Last 7 Days</MenuItem>
                                    <MenuItem value={15}>Last 15 Days</MenuItem>
                                    <MenuItem value={30}>Last 30 Days</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>

                        {loading ? (
                            <Box textAlign="center" py={4}>
                                <CircularProgress />
                            </Box>
                        ) : orders.length === 0 ? (
                            <Box textAlign="center" py={6}>
                                <LocalShipping sx={{ fontSize: 80, color: '#cbd5e1', mb: 2 }} />
                                <Typography variant="h6" color="textSecondary">
                                    No delivery history found
                                </Typography>
                            </Box>
                        ) : (
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Order ID</TableCell>
                                            <TableCell>Customer</TableCell>
                                            <TableCell>Address</TableCell>
                                            <TableCell>Amount</TableCell>
                                            <TableCell>Payment</TableCell>
                                            <TableCell>Delivered At</TableCell>
                                            <TableCell>Status</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {orders.map((order) => (
                                            <TableRow key={order._id} hover sx={{ cursor: 'pointer' }}>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight="600">
                                                        #{order._id.slice(-8).toUpperCase()}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>{order.user?.name}</TableCell>
                                                <TableCell>
                                                    {order.shippingAddress?.city}, {order.shippingAddress?.pinCode}
                                                </TableCell>
                                                <TableCell>₹{order.totalPrice?.toFixed(2)}</TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={order.paymentMethod === 'cod' ? 'COD' : 'Prepaid'}
                                                        size="small"
                                                        color={order.paymentMethod === 'cod' ? 'warning' : 'success'}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    {order.deliveredAt ? new Date(order.deliveredAt).toLocaleDateString() : '-'}
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label="Delivered"
                                                        size="small"
                                                        color="success"
                                                        icon={<CheckCircle />}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </CardContent>
                </Card>
            </Container>
        </PageContainer>
    );
};

export default DeliveryHistory;
