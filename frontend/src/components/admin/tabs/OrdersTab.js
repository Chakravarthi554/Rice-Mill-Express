import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, IconButton, Tooltip, Chip, Button, LinearProgress
} from '@mui/material';
import {
    Refresh as RefreshIcon,
    Visibility as ViewIcon,
    LocalShipping as ShippingIcon,
    CheckCircle as DeliveredIcon,
    Pending as PendingIcon
} from '@mui/icons-material';
import { listOrders } from '../../../redux/actions/adminActions';
import Loader from '../../common/Loader';
import Message from '../../common/Message';

const OrdersTab = () => {
    const dispatch = useDispatch();

    const orderList = useSelector((state) => state.orderList);
    const { loading, error, orders = [] } = orderList;

    useEffect(() => {
        dispatch(listOrders());
    }, [dispatch]);

    const handleRefresh = () => {
        dispatch(listOrders());
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'paid':
            case 'delivered': return 'success';
            case 'shipped':
            case 'processing': return 'info';
            case 'pending': return 'warning';
            case 'cancelled': return 'error';
            default: return 'default';
        }
    };

    const getStatusIcon = (status) => {
        switch (status?.toLowerCase()) {
            case 'delivered': return <DeliveredIcon />;
            case 'shipped': return <ShippingIcon />;
            default: return <PendingIcon />;
        }
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'white' }}>
                        Order Management
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                        Monitor and manage all customer orders across the platform
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<RefreshIcon />}
                    onClick={handleRefresh}
                    disabled={loading}
                    sx={{
                        background: 'rgba(56, 189, 248, 0.2)',
                        color: '#38bdf8',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        '&:hover': { background: 'rgba(56, 189, 248, 0.3)' }
                    }}
                >
                    Refresh
                </Button>
            </Box>

            {loading && <LinearProgress sx={{ mb: 2 }} />}
            {error && <Message severity="error">{error}</Message>}

            <TableContainer component={Paper} sx={{
                borderRadius: 4,
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                '& .MuiTableCell-root': { borderColor: 'rgba(255,255,255,0.05)', color: 'white' },
                '& .MuiTableHead-root': { background: 'rgba(255, 255, 255, 0.03)' }
            }}>
                <Table sx={{ minWidth: 650 }} size="medium">
                    <TableHead>
                        <TableRow>
                            <TableCell><strong>Order ID</strong></TableCell>
                            <TableCell><strong>Customer</strong></TableCell>
                            <TableCell><strong>Date</strong></TableCell>
                            <TableCell><strong>Total</strong></TableCell>
                            <TableCell><strong>Status</strong></TableCell>
                            <TableCell align="right"><strong>Actions</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {orders.length === 0 && !loading ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                                    <Typography variant="body1" color="rgba(255,255,255,0.4)">No orders found</Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            orders.map((order) => (
                                <TableRow key={order._id} sx={{ '&:hover': { background: 'rgba(255,255,255,0.02)' } }}>
                                    <TableCell>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                            #{order._id.substring(order._id.length - 8).toUpperCase()}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">{order.user?.name || 'Guest'}</Typography>
                                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>{order.user?.email}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {new Date(order.createdAt).toLocaleDateString()}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="subtitle2" sx={{ color: '#38bdf8', fontWeight: 'bold' }}>
                                            ₹{order.totalPrice.toLocaleString()}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={order.orderStatus}
                                            size="small"
                                            color={getStatusColor(order.orderStatus)}
                                            icon={getStatusIcon(order.orderStatus)}
                                            sx={{ fontWeight: 'bold', textTransform: 'capitalize' }}
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <Tooltip title="View Details">
                                            <IconButton size="small" sx={{ color: '#38bdf8' }}><ViewIcon fontSize="small" /></IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default OrdersTab;
