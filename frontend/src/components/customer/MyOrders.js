// [Premium Figma-level Redesign — MyOrders (Web)]
import React from 'react';
import { Box, Grid, Button, Chip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import Loader from '../common/Loader';
import OrderTracker from '../customer/OrderTracker';
import Price from '../common/Price';
import { addToCart } from '../../redux/actions/cartActions';
import { addToWishlist } from '../../redux/actions/userActions';
import { useTranslation } from 'react-i18next';

const STATUS_CONFIG = {
    pending: { label: 'Pending', bg: '#FEF3C7', text: '#92400E', border: '#FDE68A', dot: '#F59E0B' },
    placed: { label: 'Placed', bg: '#EEF2FF', text: '#3730A3', border: '#C7D2FE', dot: '#6366F1' },
    processing: { label: 'Processing', bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE', dot: '#3B82F6' },
    packed: { label: 'Packed', bg: '#F5F3FF', text: '#6D28D9', border: '#DDD6FE', dot: '#7C3AED' },
    shipped: { label: 'Shipped', bg: '#FFF7ED', text: '#B45309', border: '#FED7AA', dot: '#F97316' },
    out_for_delivery: { label: 'On The Way', bg: '#FFF3E0', text: '#C2410C', border: '#FDBA74', dot: '#EF4444' },
    delivered: { label: 'Delivered', bg: '#F0FDF4', text: '#166534', border: '#D1FAE5', dot: '#16A34A' },
    cancelled: { label: 'Cancelled', bg: '#FEF2F2', text: '#B91C1C', border: '#FECACA', dot: '#EF4444' },
};

const MyOrders = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const { loading: ordersLoading, error: ordersError, orders = [] } = useSelector((state) => state.orderListMy || {});

    const formatDate = (ds) => {
        try {
            return new Date(ds).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        } catch { return ds; }
    };

    return (
        <Box sx={{ fontFamily: "'Inter', sans-serif" }}>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Box sx={{ fontSize: 26, fontWeight: 800, color: '#111827', letterSpacing: '-0.5px', mb: 0.5 }}>
                    My Orders
                </Box>
                <Box sx={{ fontSize: 14, color: '#9CA3AF' }}>
                    {orders.length} total order{orders.length !== 1 ? 's' : ''}
                </Box>
            </Box>

            {ordersLoading ? (
                <Loader />
            ) : ordersError ? (
                <Box sx={{
                    p: 3, background: '#FEF2F2', borderRadius: 3, textAlign: 'center',
                    border: '1px solid #FECACA', color: '#EF4444', fontWeight: 600,
                }}>
                    {ordersError}
                </Box>
            ) : orders.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {orders.map((order) => {
                        const status = STATUS_CONFIG[order.orderStatus] || STATUS_CONFIG['pending'];
                        const orderId = order._id?.slice(-10).toUpperCase() || 'N/A';

                        return (
                            <Box
                                key={order._id}
                                sx={{
                                    background: '#fff', borderRadius: 4, overflow: 'hidden',
                                    border: '1px solid #F3F4F6',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                                    transition: 'all 0.2s ease',
                                    '&:hover': { boxShadow: '0 8px 20px rgba(0,0,0,0.08)', transform: 'translateY(-2px)' },
                                }}
                            >
                                {/* Status accent bar */}
                                <Box sx={{ height: 4, background: status.dot }} />

                                <Box sx={{ p: 3 }}>
                                    {/* Top row */}
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2.5 }}>
                                        <Box>
                                            <Box sx={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.8px', mb: 0.5 }}>
                                                Order ID
                                            </Box>
                                            <Box sx={{ fontSize: 20, fontWeight: 800, color: '#111827', letterSpacing: '-0.3px' }}>
                                                #{orderId}
                                            </Box>
                                            <Box sx={{ fontSize: 13, color: '#9CA3AF', mt: 0.5 }}>
                                                Placed on {formatDate(order.createdAt)}
                                            </Box>
                                        </Box>
                                        <Box sx={{
                                            display: 'flex', alignItems: 'center', gap: 0.8,
                                            px: 2, py: 0.8, borderRadius: 99,
                                            background: status.bg, border: `1px solid ${status.border}`,
                                        }}>
                                            <Box sx={{ width: 8, height: 8, borderRadius: 4, background: status.dot, flexShrink: 0, ...(order.orderStatus === 'out_for_delivery' && { animation: 'pulse 2s infinite' }) }} />
                                            <Box sx={{ fontSize: 13, fontWeight: 700, color: status.text }}>
                                                {status.label}
                                            </Box>
                                        </Box>
                                    </Box>

                                    {/* Order Tracker */}
                                    <Box sx={{ mb: 2.5 }}>
                                        <OrderTracker order={order} />
                                    </Box>

                                    {/* Items */}
                                    <Box sx={{ fontSize: 13, fontWeight: 800, color: '#111827', mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        Order Items
                                    </Box>
                                    <Grid container spacing={2} sx={{ mb: 2.5 }}>
                                        {order.orderItems.map((item) => (
                                            <Grid item xs={12} sm={6} md={4} key={item.product._id}>
                                                <Box sx={{
                                                    display: 'flex', gap: 1.5, p: 1.5,
                                                    background: '#F9FAFB', borderRadius: 3,
                                                    border: '1px solid #F3F4F6',
                                                }}>
                                                    <Box component="img"
                                                        src={item.product.images?.[0] || '/placeholder.jpg'}
                                                        alt={item.product.name}
                                                        sx={{ width: 60, height: 60, borderRadius: 2, objectFit: 'cover', flexShrink: 0 }}
                                                    />
                                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                                        <Box sx={{ fontSize: 13, fontWeight: 700, color: '#111827', mb: 0.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {item.product.name}
                                                        </Box>
                                                        <Box sx={{ fontSize: 12, color: '#9CA3AF', mb: 0.5 }}>
                                                            Qty: {item.qty} × <Price amount={item.price} />
                                                        </Box>
                                                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                                            <Box
                                                                component="button"
                                                                onClick={() => { dispatch(addToCart(item.product._id, 1)); navigate('/cart'); }}
                                                                sx={{ background: '#16A34A', color: '#fff', fontSize: 11, fontWeight: 700, px: 1.5, py: 0.5, borderRadius: 99, border: 'none', cursor: 'pointer', '&:hover': { background: '#15803D' } }}
                                                            >
                                                                Buy Again
                                                            </Box>
                                                            <Box
                                                                component="button"
                                                                onClick={async () => { try { await dispatch(addToWishlist(item.product._id)); } catch (er) {} }}
                                                                sx={{ background: '#F9FAFB', color: '#6B7280', fontSize: 11, fontWeight: 600, px: 1.5, py: 0.5, borderRadius: 99, border: '1px solid #E5E7EB', cursor: 'pointer', '&:hover': { color: '#EF4444' } }}
                                                            >
                                                                ♡ Wishlist
                                                            </Box>
                                                            <Box
                                                                component="button"
                                                                onClick={() => navigate(`/products/${item.product._id}#reviews`)}
                                                                sx={{ background: '#F9FAFB', color: '#6B7280', fontSize: 11, fontWeight: 600, px: 1.5, py: 0.5, borderRadius: 99, border: '1px solid #E5E7EB', cursor: 'pointer', '&:hover': { color: '#16A34A' } }}
                                                            >
                                                                ⭐ Review
                                                            </Box>
                                                        </Box>
                                                    </Box>
                                                </Box>
                                            </Grid>
                                        ))}
                                    </Grid>

                                    {/* Footer */}
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 2, borderTop: '1px solid #F3F4F6' }}>
                                        <Box>
                                            <Box sx={{ fontSize: 13, color: '#6B7280', mb: 0.3 }}>Total Paid</Box>
                                            <Box sx={{ fontSize: 22, fontWeight: 800, color: '#16A34A' }}>
                                                ₹{(order.totalPrice || 0).toFixed(2)}
                                            </Box>
                                        </Box>
                                        <Box
                                            component="button"
                                            onClick={() => navigate(`/orders/${order._id}`)}
                                            sx={{
                                                background: '#111827', color: '#fff', fontSize: 14,
                                                fontWeight: 700, px: 3, py: 1.5, borderRadius: '14px',
                                                border: 'none', cursor: 'pointer',
                                                boxShadow: '0 4px 12px rgba(17,24,39,0.2)',
                                                transition: 'all 0.2s',
                                                '&:hover': { background: '#1F2937', transform: 'translateY(-1px)' },
                                            }}
                                        >
                                            View Full Details →
                                        </Box>
                                    </Box>
                                </Box>
                            </Box>
                        );
                    })}
                </Box>
            ) : (
                <Box sx={{
                    textAlign: 'center', p: 8, background: '#fff',
                    borderRadius: 4, border: '1px dashed #E5E7EB',
                }}>
                    <Box sx={{ fontSize: 52, mb: 2 }}>📦</Box>
                    <Box sx={{ fontSize: 20, fontWeight: 800, color: '#111827', mb: 1 }}>No orders yet</Box>
                    <Box sx={{ fontSize: 14, color: '#9CA3AF', mb: 3 }}>Your order history will appear here</Box>
                    <Box
                        component="button"
                        onClick={() => navigate('/')}
                        sx={{ background: '#16A34A', color: '#fff', fontSize: 15, fontWeight: 700, px: 4, py: 1.8, borderRadius: '50px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(22,163,74,0.25)' }}
                    >
                        Start Shopping
                    </Box>
                </Box>
            )}
        </Box>
    );
};

export default MyOrders;