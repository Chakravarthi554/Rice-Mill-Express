import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, IconButton, Tooltip, Chip, Button, LinearProgress, TextField, InputAdornment,
    Dialog, DialogTitle, DialogContent, DialogActions, Divider, Grid, List, ListItem, ListItemText, Avatar
} from '@mui/material';
import {
    Refresh as RefreshIcon,
    Visibility as ViewIcon,
    LocalShipping as ShippingIcon,
    CheckCircle as DeliveredIcon,
    Pending as PendingIcon,
    Search as SearchIcon,
    Close as CloseIcon,
    ShoppingBag as BagIcon,
    Person as PersonIcon,
    Payment as PaymentIcon
} from '@mui/icons-material';
import { listOrders, getOrderDetails } from '../../../redux/actions/adminActions';
import Loader from '../../common/Loader';
import Message from '../../common/Message';
import { EmptyState } from '../../common/PageStates';
import { PaymentStatusChip, PriceBreakdown } from '../../common/FinancialUI';

const OrdersTab = () => {
    const dispatch = useDispatch();
    const [searchTerm, setSearchTerm] = useState('');
    const [detailsOpen, setDetailsOpen] = useState(false);

    const orderList = useSelector((state) => state.orderList);
    const { loading, error, orders = [] } = orderList;

    const orderDetails = useSelector((state) => state.orderDetails);
    const { loading: loadingDetails, error: errorDetails, order: selectedOrder } = orderDetails || {};

    useEffect(() => {
        dispatch(listOrders());
    }, [dispatch]);

    const handleRefresh = () => {
        dispatch(listOrders());
        setSearchTerm(''); // Clear search on refresh
    };

    const handleViewDetails = (id) => {
        dispatch(getOrderDetails(id));
        setDetailsOpen(true);
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

    // Filter orders based on search term
    const filteredOrders = orders.filter(order => {
        if (!searchTerm) return true;
        const search = searchTerm.toLowerCase();
        return (
            order._id?.toString().toLowerCase().includes(search) ||
            order.user?.name?.toLowerCase().includes(search) ||
            order.user?.email?.toLowerCase().includes(search) ||
            order.orderStatus?.toLowerCase().includes(search)
        );
    });

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#111827' }}>
                        Order Management
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#6B7280' }}>
                        Monitor and manage all customer orders across the platform
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <TextField
                        size="small"
                        placeholder="Search orders..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon sx={{ color: '#6B7280' }} />
                                </InputAdornment>
                            ),
                        }}
                        sx={{ width: 250 }}
                    />
                    <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={handleRefresh}
                        disabled={loading}
                    >
                        Refresh
                    </Button>
                </Box>
            </Box>

            {loading && <LinearProgress sx={{ mb: 2 }} />}
            {error && <Message severity="error">{error}</Message>}

            {/* Search Results Info */}
            {searchTerm && (
                <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ color: '#374151' }}>
                        Found {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''} matching "{searchTerm}"
                    </Typography>
                </Box>
            )}

            <TableContainer component={Paper} sx={{
                borderRadius: 4,
                border: '1px solid #E5E7EB',
                '& .MuiTableCell-root': { borderColor: '#E5E7EB', color: '#111827' },
                '& .MuiTableHead-root': { background: '#F9FAFB' }
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
                        {filteredOrders.length === 0 && !loading ? (
                            <TableRow>
                                <TableCell colSpan={6} sx={{ py: 2 }}>
                                    <EmptyState
                                        title={searchTerm ? 'No matching orders' : 'No orders found'}
                                        description={searchTerm ? 'Try broader search terms.' : 'New orders will appear here.'}
                                        actionLabel="Refresh"
                                        onAction={handleRefresh}
                                    />
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredOrders.map((order) => (
                                <TableRow key={order._id} sx={{ '&:hover': { background: '#F9FAFB' } }}>
                                    <TableCell>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#1565C0' }}>
                                            #{order._id.substring(order._id.length - 8).toUpperCase()}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">{order.user?.name || 'Guest'}</Typography>
                                        <Typography variant="caption" sx={{ color: '#6B7280' }}>{order.user?.email}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">
                                            {new Date(order.createdAt).toLocaleDateString()}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="subtitle2" sx={{ color: '#1565C0', fontWeight: 'bold' }}>
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
                                            <IconButton
                                                size="small"
                                                sx={{ color: '#1565C0' }}
                                                onClick={() => handleViewDetails(order._id)}
                                            >
                                                <ViewIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Order Details Dialog */}
            <Dialog
                open={detailsOpen}
                onClose={() => setDetailsOpen(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 3
                    }
                }}
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    Order Details
                    <IconButton onClick={() => setDetailsOpen(false)} sx={{ color: '#6B7280' }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers sx={{ borderColor: '#E5E7EB' }}>
                    {loadingDetails ? (
                        <Box sx={{ py: 4, textAlign: 'center' }}>
                            <Loader />
                            <Typography sx={{ mt: 2, color: '#6B7280' }}>Fetching order information...</Typography>
                        </Box>
                    ) : errorDetails ? (
                        <Message severity="error">{errorDetails}</Message>
                    ) : selectedOrder ? (
                        <Grid container spacing={3}>
                            {/* Left Column: Items */}
                            <Grid item xs={12} md={7}>
                                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <BagIcon fontSize="small" color="primary" /> Order Items
                                </Typography>
                                <List sx={{ background: '#F9FAFB', borderRadius: 2 }}>
                                    {selectedOrder.orderItems?.map((item, index) => (
                                        <React.Fragment key={index}>
                                            <ListItem sx={{ py: 1.5 }}>
                                                <Avatar
                                                    src={item.image}
                                                    variant="rounded"
                                                    sx={{ width: 50, height: 50, mr: 2, border: '1px solid #E5E7EB' }}
                                                >
                                                    {item.name?.[0]}
                                                </Avatar>
                                                <ListItemText
                                                    primary={<Typography variant="subtitle2">{item.name}</Typography>}
                                                    secondary={
                                                        <Typography variant="caption" sx={{ color: '#6B7280' }}>
                                                            {item.qty} x ₹{item.price.toLocaleString()}
                                                        </Typography>
                                                    }
                                                />
                                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                                    ₹{(item.qty * item.price).toLocaleString()}
                                                </Typography>
                                            </ListItem>
                                            {index < selectedOrder.orderItems.length - 1 && <Divider sx={{ borderColor: '#E5E7EB' }} />}
                                        </React.Fragment>
                                    ))}
                                </List>

                                <Box sx={{ mt: 3, p: 2, background: 'rgba(56, 189, 248, 0.05)', borderRadius: 2 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="body2" sx={{ color: '#6B7280' }}>Items Price</Typography>
                                        <Typography variant="body2">₹{selectedOrder.itemsPrice?.toLocaleString()}</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="body2" sx={{ color: '#6B7280' }}>Tax</Typography>
                                        <Typography variant="body2">₹{selectedOrder.taxPrice?.toLocaleString()}</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="body2" sx={{ color: '#6B7280' }}>Shipping</Typography>
                                        <Typography variant="body2">₹{selectedOrder.shippingPrice?.toLocaleString()}</Typography>
                                    </Box>
                                    <Divider sx={{ my: 1, borderColor: 'rgba(56, 189, 248, 0.2)' }} />
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#1565C0' }}>Total Price</Typography>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#1565C0' }}>₹{selectedOrder.totalPrice?.toLocaleString()}</Typography>
                                    </Box>
                                </Box>
                            </Grid>

                            {/* Right Column: Info */}
                            <Grid item xs={12} md={5}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                    <Box>
                                        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <PersonIcon fontSize="small" color="primary" /> Customer Info
                                        </Typography>
                                        <Paper sx={{ p: 2, background: '#F9FAFB', border: '1px solid #E5E7EB' }}>
                                            <Typography variant="subtitle2">{selectedOrder.user?.name}</Typography>
                                            <Typography variant="body2" sx={{ color: '#6B7280' }}>{selectedOrder.user?.email}</Typography>
                                            <Typography variant="body2" sx={{ color: '#6B7280' }}>{selectedOrder.user?.phone}</Typography>
                                        </Paper>
                                    </Box>

                                    <Box>
                                        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <ShippingIcon fontSize="small" color="primary" /> Shipping Address
                                        </Typography>
                                        <Paper sx={{ p: 2, background: '#F9FAFB', border: '1px solid #E5E7EB' }}>
                                            <Typography variant="body2">
                                                {selectedOrder.shippingAddress?.address}, {selectedOrder.shippingAddress?.city}
                                            </Typography>
                                            <Typography variant="body2">
                                                {selectedOrder.shippingAddress?.postalCode}, {selectedOrder.shippingAddress?.country}
                                            </Typography>
                                        </Paper>
                                    </Box>

                                    <Box>
                                        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <PaymentIcon fontSize="small" color="primary" /> Payment Status
                                        </Typography>
                                        <Paper sx={{ p: 2, background: '#F9FAFB', border: '1px solid #E5E7EB' }}>
                                            <Typography variant="body2" sx={{ mb: 1 }}>
                                                Method: <strong>{selectedOrder.paymentMethod}</strong>
                                            </Typography>
                                            <PaymentStatusChip status={selectedOrder.isPaid ? 'paid' : 'unpaid'} />
                                            {selectedOrder.isPaid && (
                                                <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#6B7280' }}>
                                                    On {new Date(selectedOrder.paidAt).toLocaleString()}
                                                </Typography>
                                            )}
                                            <Box sx={{ mt: 2 }}>
                                                <PriceBreakdown
                                                    dense
                                                    rows={[
                                                        { label: 'Items', value: Number(selectedOrder.itemsPrice || 0) },
                                                        { label: 'Tax', value: Number(selectedOrder.taxPrice || 0) },
                                                        { label: 'Shipping', value: Number(selectedOrder.shippingPrice || 0) },
                                                    ]}
                                                    totalLabel="Order Total"
                                                    totalValue={Number(selectedOrder.totalPrice || 0)}
                                                />
                                            </Box>
                                        </Paper>
                                    </Box>
                                </Box>
                            </Grid>
                        </Grid>
                    ) : null}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setDetailsOpen(false)} sx={{ color: '#1565C0' }}>Close</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default OrdersTab;
