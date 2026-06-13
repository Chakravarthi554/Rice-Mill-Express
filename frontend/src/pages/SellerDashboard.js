import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Box, Typography, Grid, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Button, Dialog, DialogTitle,
    DialogContent, DialogActions, FormControl, InputLabel, Select,
    MenuItem, Alert, CircularProgress, TextField, IconButton, Chip,
    Avatar, Divider, Badge, LinearProgress, Tooltip
} from '@mui/material';
import {
    Dashboard as DashboardIcon, ShoppingBag, Inventory2, AccountBalanceWallet,
    LocalShipping, BarChart, Settings, Logout, Notifications, Search,
    TrendingUp, TrendingDown, Add, Edit, Delete, Download, Visibility,
    Chat, Warning, CheckCircle, Cancel, ArrowForward, PeopleAlt
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { listSellerOrders, updateOrderStatus, downloadInvoice } from '../redux/actions/orderActions';
import { listDeliveryPartners, assignDeliveryPartner } from '../redux/actions/deliveryActions';
import { listSellerProducts } from '../redux/actions/productActions';
import { listMyRecipes } from '../redux/actions/recipeActions';
import { setupSocialListeners, OrderTrackingSocket } from '../utils/socket';
import SellerProfile from '../components/seller/SellerProfile';
import SellerProducts from '../components/seller/SellerProducts';
import SellerPayments from '../components/seller/SellerPayments';
import SellerDelivery from '../components/seller/SellerDelivery';
import AnalyticsDashboard from '../components/seller/AnalyticsDashboard';
import OrderKanban from '../components/seller/OrderKanban';
import Message from '../components/common/Message';
import CommunityForum from '../components/seller/CommunityForum';
import RecipeEngagementDashboard from '../components/seller/RecipeEngagementDashboard';
import { RECIPE_SUBMIT_RESET } from '../redux/constants/RecipeConstants';
import NotificationBadge from '../components/common/NotificationBadge';

// ────────────────────────────────────────────────────────────
// Design Tokens (matching image: dark navy sidebar)
// ────────────────────────────────────────────────────────────
const SIDEBAR_BG = '#1E2B4A';
const SIDEBAR_ACTIVE = '#2D4073';
const ACCENT = '#16A34A';
const ACCENT_ORANGE = '#F97316';

const NAV_ITEMS = (tab) => [
    { label: 'Dashboard', icon: <DashboardIcon fontSize="small" />, id: 0 },
    { label: 'Products', icon: <Inventory2 fontSize="small" />, id: 1 },
    { label: 'Orders', icon: <ShoppingBag fontSize="small" />, id: 2 },
    { label: 'Payments', icon: <AccountBalanceWallet fontSize="small" />, id: 3 },
    { label: 'Delivery Partners', icon: <LocalShipping fontSize="small" />, id: 4 },
    { label: 'Analytics', icon: <BarChart fontSize="small" />, id: 5 },
    { label: 'Community Forum', icon: <Chat fontSize="small" />, id: 6 },
    { label: 'Recipes', icon: <PeopleAlt fontSize="small" />, id: 7 },
    { label: 'Settings', icon: <Settings fontSize="small" />, id: 8 },
];

// ────────────────────────────────────────────────────────────
// Stat Card
// ────────────────────────────────────────────────────────────
const StatCard = ({ title, value, change, changeDir, suffix = '', cta, onCta }) => (
    <Paper variant="outlined" sx={{ borderRadius: 3, p: 2.5, border: '1px solid #F3F4F6', height: '100%' }}>
        <Typography variant="body2" color="text.secondary" fontWeight={600} gutterBottom>{title}</Typography>
        <Typography variant="h4" fontWeight={800} sx={{ my: 0.5 }}>{suffix}{value}</Typography>
        {change !== undefined && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {changeDir === 'up'
                    ? <TrendingUp sx={{ fontSize: 16, color: '#16A34A' }} />
                    : <TrendingDown sx={{ fontSize: 16, color: '#EF4444' }} />}
                <Typography variant="caption" sx={{ color: changeDir === 'up' ? '#16A34A' : '#EF4444', fontWeight: 700 }}>{change}</Typography>
                <Typography variant="caption" color="text.secondary">vs yesterday</Typography>
            </Box>
        )}
        {cta && (
            <Button size="small" variant="contained" onClick={onCta}
                sx={{ mt: 1.5, bgcolor: ACCENT, '&:hover': { bgcolor: '#15803D' }, borderRadius: 1.5, fontWeight: 700, fontSize: '0.75rem' }}>
                {cta}
            </Button>
        )}
    </Paper>
);

// ────────────────────────────────────────────────────────────
// Overview / Home Panel
// ────────────────────────────────────────────────────────────
const OverviewPanel = ({ orders, products, onTabChange }) => {
    const pending = orders.filter(o => o.orderStatus === 'placed' || o.orderStatus === 'pending').length;
    const todayOrders = orders.filter(o => {
        const d = new Date(o.createdAt);
        const now = new Date();
        return d.toDateString() === now.toDateString();
    }).length;
    const revenue = orders.filter(o => o.orderStatus === 'delivered').reduce((s, o) => s + (o.totalPrice || 0), 0);
    const balance = revenue * 0.85; // after 15% platform commission
    const lowStock = (products || []).filter(p => (p.countInStock || 0) < 10);
    const recent = [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

    const statusChip = (s) => {
        const map = {
            placed: { label: 'New', color: '#DBEAFE', text: '#1E40AF' },
            pending: { label: 'New', color: '#DBEAFE', text: '#1E40AF' },
            processing: { label: 'Processing', color: '#FEF3C7', text: '#92400E' },
            packed: { label: 'Packed', color: '#F5F3FF', text: '#6D28D9' },
            shipped: { label: 'Shipped', color: '#E0F2FE', text: '#0369A1' },
            delivered: { label: 'Delivered', color: '#DCFCE7', text: '#166534' },
            cancelled: { label: 'Cancelled', color: '#FEE2E2', text: '#B91C1C' },
        };
        const cfg = map[s] || { label: s, color: '#F3F4F6', text: '#374151' };
        return <Chip label={cfg.label} size="small" sx={{ bgcolor: cfg.color, color: cfg.text, fontWeight: 700, fontSize: '0.7rem' }} />;
    };

    return (
        <Box>
            {/* Stat Cards */}
            <Grid container spacing={2.5} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard title="Today's Orders" value={todayOrders} change="12%" changeDir="up" />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard title="Pending Orders" value={pending} change={pending > 5 ? '5%' : '0%'} changeDir={pending > 5 ? 'down' : 'up'} />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard title="Total Revenue" value={revenue.toLocaleString('en-IN')} suffix="₹" change="8%" changeDir="up" />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard title="Available Balance" value={balance.toLocaleString('en-IN')} suffix="₹" cta="Request Payout" onCta={() => onTabChange(3)} />
                </Grid>
            </Grid>

            <Grid container spacing={3}>
                {/* Recent Orders */}
                <Grid item xs={12} md={8}>
                    <Paper variant="outlined" sx={{ borderRadius: 3, border: '1px solid #F3F4F6', overflow: 'hidden' }}>
                        <Box sx={{ px: 3, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F9FAFB' }}>
                            <Typography fontWeight={800}>Recent Orders</Typography>
                            <Button size="small" endIcon={<ArrowForward fontSize="small" />} onClick={() => onTabChange(2)} sx={{ color: ACCENT, fontWeight: 700 }}>View All</Button>
                        </Box>
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: '#FAFAFA' }}>
                                        {['Order ID', 'Customer', 'Items', 'Amount', 'Status', 'Actions'].map(h => (
                                            <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#6B7280' }}>{h}</TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {recent.length === 0 ? (
                                        <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4, color: '#9CA3AF' }}>No orders yet</TableCell></TableRow>
                                    ) : recent.map(order => (
                                        <TableRow key={order._id} hover>
                                            <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#4F46E5' }}>#{order._id?.slice(-6).toUpperCase()}</TableCell>
                                            <TableCell sx={{ fontSize: '0.8rem' }}>{order.user?.name || 'Customer'}</TableCell>
                                            <TableCell sx={{ fontSize: '0.8rem' }}>{order.orderItems?.length || 0} items</TableCell>
                                            <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem' }}>₹{order.totalPrice?.toFixed(0)}</TableCell>
                                            <TableCell>{statusChip(order.orderStatus)}</TableCell>
                                            <TableCell>
                                                <Button size="small" sx={{ color: ACCENT, fontWeight: 700, fontSize: '0.75rem', p: 0 }}>Invoice</Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Grid>

                {/* Low Stock Alert */}
                <Grid item xs={12} md={4}>
                    <Paper variant="outlined" sx={{ borderRadius: 3, border: '1px solid #F3F4F6', overflow: 'hidden' }}>
                        <Box sx={{ px: 3, py: 2, display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid #F9FAFB', borderLeft: '4px solid #EF4444' }}>
                            <Warning sx={{ color: '#EF4444', fontSize: 20 }} />
                            <Typography fontWeight={800} color="#EF4444">Low Stock Alert</Typography>
                        </Box>
                        <Box sx={{ p: 2 }}>
                            {lowStock.length === 0 ? (
                                <Box sx={{ textAlign: 'center', py: 3 }}>
                                    <CheckCircle sx={{ color: '#16A34A', fontSize: 32, mb: 1 }} />
                                    <Typography variant="body2" color="#16A34A" fontWeight={700}>All products well stocked!</Typography>
                                </Box>
                            ) : lowStock.map(p => (
                                <Box key={p._id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5, borderBottom: '1px solid #F9FAFB' }}>
                                    <Typography variant="body2" noWrap sx={{ maxWidth: '70%', fontWeight: 500 }}>{p.name}</Typography>
                                    <Chip label={`${p.countInStock} left`} size="small" sx={{ bgcolor: '#FEE2E2', color: '#B91C1C', fontWeight: 700, fontSize: '0.7rem' }} />
                                </Box>
                            ))}
                            {lowStock.length > 0 && (
                                <Button fullWidth size="small" variant="outlined" sx={{ mt: 2, borderColor: ACCENT, color: ACCENT, borderRadius: 2, fontWeight: 700 }} onClick={() => onTabChange(1)}>
                                    Manage Inventory
                                </Button>
                            )}
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

// ────────────────────────────────────────────────────────────
// Orders Panel (card-based matching design image)
// ────────────────────────────────────────────────────────────
const OrdersPanel = ({ orders, partners, onAssign, onUpdateStatus, onDownloadInvoice, invoiceLoading }) => {
    const [statusFilter, setStatusFilter] = useState('All');
    const [search, setSearch] = useState('');
    const [dateFilter, setDateFilter] = useState('');

    const STATUS_TABS = ['All', 'New', 'Processing', 'Ready', 'Shipped', 'Delivered'];

    const filtered = useMemo(() => orders.filter(o => {
        // 1. Status Mapping
        let matchStatus = true;
        if (statusFilter === 'New') matchStatus = ['placed', 'pending'].includes(o.orderStatus?.toLowerCase());
        else if (statusFilter === 'Ready') matchStatus = o.orderStatus?.toLowerCase() === 'packed';
        else if (statusFilter !== 'All') matchStatus = o.orderStatus?.toLowerCase() === statusFilter.toLowerCase();

        // 2. Search (ID or Customer Name)
        const matchSearch = search === '' ||
            o._id?.toLowerCase().includes(search.toLowerCase()) ||
            (o.user?.name || '').toLowerCase().includes(search.toLowerCase());

        // 3. Date filtering
        let matchDate = true;
        if (dateFilter) {
            const orderDate = new Date(o.createdAt).toISOString().split('T')[0];
            matchDate = orderDate === dateFilter;
        }

        return matchStatus && matchSearch && matchDate;
    }), [orders, statusFilter, search, dateFilter]);

    const STATUS_CONFIG = {
        placed: { label: 'NEW', bg: '#EF4444', text: '#fff' },
        pending: { label: 'NEW', bg: '#EF4444', text: '#fff' },
        processing: { label: 'PROCESSING', bg: '#F59E0B', text: '#fff' },
        packed: { label: 'READY', bg: '#8B5CF6', text: '#fff' },
        shipped: { label: 'SHIPPED', bg: '#3B82F6', text: '#fff' },
        delivered: { label: 'DELIVERED', bg: '#16A34A', text: '#fff' },
        cancelled: { label: 'CANCELLED', bg: '#6B7280', text: '#fff' },
    };

    return (
        <Box>
            {/* Filters */}
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, mb: 3, border: '1px solid #F3F4F6' }}>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                    <TextField size="small" type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)}
                        sx={{ minWidth: 160 }} InputLabelProps={{ shrink: true }} label="Filter by Date" />
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Typography variant="body2" fontWeight={700} sx={{ mr: 1, alignSelf: 'center' }}>Status</Typography>
                        {STATUS_TABS.map(s => (
                            <Chip key={s} label={s} size="small" onClick={() => setStatusFilter(s)}
                                sx={{ cursor: 'pointer', fontWeight: 700, bgcolor: statusFilter === s ? ACCENT : '#F3F4F6', color: statusFilter === s ? '#fff' : '#4B5563' }} />
                        ))}
                    </Box>
                    <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#F9FAFB', borderRadius: 2, px: 2, py: 0.8, border: '1px solid #E5E7EB' }}>
                        <Search fontSize="small" sx={{ color: '#9CA3AF' }} />
                        <input style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 14, color: '#374151' }} placeholder="Search by Order ID" value={search} onChange={e => setSearch(e.target.value)} />
                    </Box>
                </Box>
            </Paper>

            {/* Order Cards Grid */}
            <Grid container spacing={2}>
                {filtered.length === 0 ? (
                    <Grid item xs={12}><Box textAlign="center" py={6} color="#9CA3AF"><ShoppingBag sx={{ fontSize: 48, mb: 1 }} /><Typography>No orders found</Typography></Box></Grid>
                ) : filtered.map(order => {
                    const sc = STATUS_CONFIG[order.orderStatus] || { label: order.orderStatus?.toUpperCase(), bg: '#6B7280', text: '#fff' };
                    const isNew = ['placed', 'pending'].includes(order.orderStatus);
                    const addr = order.shippingAddress ? `${order.shippingAddress.street || ''}, ${order.shippingAddress.city || ''} - ${order.shippingAddress.pinCode || ''}`.trim() : 'No address';

                    return (
                        <Grid item xs={12} md={6} lg={4} key={order._id}>
                            <Paper variant="outlined" sx={{ borderRadius: 3, border: '1px solid #F3F4F6', overflow: 'hidden', '&:hover': { boxShadow: '0 4px 20px rgba(0,0,0,0.08)', borderColor: '#D1D5DB' }, transition: 'all 0.2s' }}>
                                {/* Card Header */}
                                <Box sx={{ px: 2, py: 1.5, bgcolor: '#FAFAFA', borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">Order ID</Typography>
                                        <Typography fontWeight={800} fontSize="0.95rem">#{order._id?.slice(-10).toUpperCase()}</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                                        <Chip label={sc.label} size="small" sx={{ bgcolor: sc.bg, color: sc.text, fontWeight: 700, fontSize: '0.65rem' }} />
                                        {isNew && <Chip label="NEW" size="small" sx={{ bgcolor: '#EF4444', color: '#fff', fontWeight: 800, fontSize: '0.65rem' }} />}
                                    </Box>
                                </Box>

                                {/* Customer Info */}
                                <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #F9FAFB' }}>
                                    <Typography fontWeight={700} fontSize="0.9rem">{order.user?.name || 'Customer'}</Typography>
                                    <Typography variant="caption" color="text.secondary">{order.user?.phone || ''}</Typography>
                                    {addr && <Typography variant="caption" display="block" color="text.secondary" noWrap>{addr}</Typography>}
                                </Box>

                                {/* Items */}
                                <Box sx={{ px: 2, py: 1 }}>
                                    {(order.orderItems || []).slice(0, 2).map((item, i) => (
                                        <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                            <Typography variant="caption" noWrap sx={{ maxWidth: '65%' }}>{item.name} × {item.qty}</Typography>
                                            <Typography variant="caption" fontWeight={700}>₹{((item.price || 0) * item.qty).toFixed(0)}</Typography>
                                        </Box>
                                    ))}
                                    {(order.orderItems || []).length > 2 && (
                                        <Typography variant="caption" color={ACCENT}>+{order.orderItems.length - 2} more items</Typography>
                                    )}
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, pt: 1, borderTop: '1px solid #F3F4F6' }}>
                                        <Typography fontWeight={700} fontSize="0.9rem">₹{order.totalPrice?.toFixed(0)} ({order.paymentMethod === 'cod' ? 'COD' : 'Prepaid'})</Typography>
                                        <Typography variant="caption" color="text.secondary">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</Typography>
                                    </Box>
                                </Box>

                                {/* Actions */}
                                <Box sx={{ px: 2, pb: 2, pt: 1, display: 'flex', gap: 1 }}>
                                    {isNew && (
                                        <>
                                            <Button size="small" variant="contained" onClick={() => onUpdateStatus(order._id, 'processing')}
                                                sx={{ flex: 1, bgcolor: ACCENT, '&:hover': { bgcolor: '#15803D' }, fontWeight: 700, fontSize: '0.75rem', borderRadius: 1.5 }}>
                                                Accept Order
                                            </Button>
                                            <Button size="small" variant="outlined" onClick={() => onUpdateStatus(order._id, 'cancelled')}
                                                sx={{ fontWeight: 700, fontSize: '0.75rem', borderRadius: 1.5, borderColor: '#E5E7EB', color: '#6B7280' }}>
                                                Reject
                                            </Button>
                                        </>
                                    )}
                                    {order.orderStatus === 'packed' && !order.deliveryPartner && (
                                        <Button size="small" variant="outlined" endIcon={<ArrowForward fontSize="small" />} onClick={() => onAssign(order)}
                                            sx={{ flex: 1, fontWeight: 700, fontSize: '0.75rem', borderRadius: 1.5, borderColor: '#3B82F6', color: '#3B82F6' }}>
                                            Assign to DP
                                        </Button>
                                    )}
                                    <IconButton size="small" onClick={() => onDownloadInvoice(order._id)} disabled={invoiceLoading} sx={{ border: '1px solid #E5E7EB', borderRadius: 1.5 }}>
                                        {invoiceLoading ? <CircularProgress size={14} /> : <Download fontSize="small" sx={{ color: '#6B7280' }} />}
                                    </IconButton>
                                </Box>
                            </Paper>
                        </Grid>
                    );
                })}
            </Grid>
        </Box>
    );
};

// ────────────────────────────────────────────────────────────
// Assign DP Dialog (matching design image)
// ────────────────────────────────────────────────────────────
const AssignDPDialog = ({ open, onClose, onAssign, partners, loading, selectedOrder }) => {
    const [search, setSearch] = useState('');
    const [selectedId, setSelectedId] = useState('');

    const filteredPartners = partners.filter(p =>
        p.name?.toLowerCase().includes(search.toLowerCase()) || (p._id || '').includes(search)
    );

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
            <DialogTitle sx={{ fontWeight: 800 }}>Assign Delivery Partner</DialogTitle>
            <DialogContent>
                <TextField
                    fullWidth placeholder="Search by name or ID..." size="small"
                    value={search} onChange={e => setSearch(e.target.value)}
                    InputProps={{ startAdornment: <Search fontSize="small" sx={{ mr: 1, color: '#9CA3AF' }} /> }}
                    sx={{ mb: 2 }} />
                <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" mb={1}>Available Delivery Partners</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {filteredPartners.map(p => {
                        const isOnline = p.isOnline ?? p.status === 'active';
                        return (
                            <Box key={p._id} onClick={() => setSelectedId(p._id)}
                                sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1.5, borderRadius: 2, cursor: 'pointer', border: '1px solid', borderColor: selectedId === p._id ? ACCENT : '#F3F4F6', bgcolor: selectedId === p._id ? '#F0FDF4' : '#FAFAFA', '&:hover': { borderColor: ACCENT } }}>
                                <Avatar sx={{ width: 42, height: 42 }}>{p.name?.[0]}</Avatar>
                                <Box sx={{ flex: 1 }}>
                                    <Typography fontWeight={700} fontSize="0.9rem">{p.name}</Typography>
                                    <Typography variant="caption" color="text.secondary">Load: {p.activeOrdersCount || 0} active orders</Typography>
                                </Box>
                                <Box textAlign="right">
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: isOnline ? '#16A34A' : '#9CA3AF' }} />
                                        <Typography variant="caption" fontWeight={700} color={isOnline ? '#16A34A' : '#9CA3AF'}>{isOnline ? 'Online' : 'Offline'}</Typography>
                                    </Box>
                                    <Typography variant="caption" color="text.secondary">Rating {p.rating || '4.5'}</Typography>
                                </Box>
                                <Button size="small" variant="contained" onClick={e => { e.stopPropagation(); onAssign(p._id); }}
                                    sx={{ bgcolor: '#3B82F6', '&:hover': { bgcolor: '#2563EB' }, fontWeight: 700, fontSize: '0.75rem', minWidth: 64 }}>
                                    Assign
                                </Button>
                            </Box>
                        );
                    })}
                    {filteredPartners.length === 0 && <Typography color="text.secondary" textAlign="center" py={2}>No partners found</Typography>}
                </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onClose} sx={{ color: '#6B7280' }}>Cancel</Button>
            </DialogActions>
        </Dialog>
    );
};

// ────────────────────────────────────────────────────────────
// Main SellerDashboard Shell
// ────────────────────────────────────────────────────────────
const SellerDashboard = () => {
    const [activeTab, setActiveTab] = useState(0);
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [invoiceLoading, setInvoiceLoading] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const dispatch = useDispatch();
    const { user, logout } = useAuth();

    const { orders: rawOrders = [], loading: ordersLoading, error: ordersError } = useSelector(s => s.orderListSeller || {});
    const orders = useMemo(() => Array.isArray(rawOrders) ? rawOrders : rawOrders?.orders || [], [rawOrders]);
    const { partners = [] } = useSelector(s => s.deliveryPartnerList || {});
    const { products: sellerProducts = [] } = useSelector(s => s.productSellerList || {});
    const { recipes: myRecipes = [] } = useSelector(s => s.recipeListMy || {});
    const assignState = useSelector(s => s.deliveryPartnerAction || {});
    const updateState = useSelector(s => s.orderUpdate || {});

    useEffect(() => {
        dispatch(listSellerOrders());
        dispatch(listDeliveryPartners());
        dispatch(listSellerProducts());
        dispatch(listMyRecipes());
    }, [dispatch]);

    useEffect(() => {
        if (assignState.success) { dispatch(listSellerOrders()); dispatch({ type: 'DELIVERY_ASSIGN_RESET' }); setOpenDialog(false); }
    }, [assignState.success, dispatch]);

    useEffect(() => {
        if (updateState.success) { dispatch(listSellerOrders()); dispatch({ type: 'ORDER_UPDATE_RESET' }); }
    }, [updateState.success, dispatch]);

    // ✅ NEW: Real-time synchronization via Socket
    useEffect(() => {
        console.log('🔌 SellerDashboard: Setting up socket listeners');
        setupSocialListeners({
            onOrderUpdate: (data) => {
                console.log('📦 Socket: Order update received', data);
                dispatch(listSellerOrders());
                dispatch(listSellerProducts());
                dispatch(listDeliveryPartners());
                // Trigger global refresh event for sub-components (like Analytics)
                window.dispatchEvent(new CustomEvent('seller:refresh-data', { detail: data }));
            },
            onBulkOrderUpdate: (data) => {
                console.log('📦 Socket: Bulk order update received', data);
                dispatch(listSellerOrders());
                window.dispatchEvent(new CustomEvent('seller:refresh-data', { detail: data }));
            }
        });

        return () => {
            console.log('🧹 SellerDashboard: Cleaning up order socket callbacks');
            // Only clear order-specific callbacks, not ALL social listeners
            window.orderUpdateCallback = null;
            window.bulkOrderUpdateCallback = null;
        };
    }, [dispatch]);

    const handleAssign = async (partnerId) => {
        if (!selectedOrder || !partnerId) return;
        try { await dispatch(assignDeliveryPartner(selectedOrder._id, { partnerId })); } catch (e) { console.error(e); }
    };

    const handleUpdateStatus = async (orderId, status) => {
        try { await dispatch(updateOrderStatus(orderId, status)); } catch (e) { console.error(e); }
    };

    const handleDownloadInvoice = async (orderId) => {
        setInvoiceLoading(true);
        await dispatch(downloadInvoice(orderId));
        setInvoiceLoading(false);
    };

    const handleLogout = () => { if (window.confirm('Logout?')) logout(); };

    const renderContent = () => {
        switch (activeTab) {
            case 0: 
                return ordersLoading ? 
                    <Box display="flex" justifyContent="center" mt={8}><CircularProgress sx={{ color: ACCENT }} /></Box> : 
                    <OverviewPanel orders={orders} products={sellerProducts} onTabChange={setActiveTab} />;
            case 1: return <SellerProducts />;
            case 2: 
                return ordersLoading ? 
                    <Box display="flex" justifyContent="center" mt={8}><CircularProgress sx={{ color: ACCENT }} /></Box> : 
                    <OrdersPanel orders={orders} partners={partners} onAssign={o => { setSelectedOrder(o); setOpenDialog(true); }} onUpdateStatus={handleUpdateStatus} onDownloadInvoice={handleDownloadInvoice} invoiceLoading={invoiceLoading} />;
            case 3: return <SellerPayments />;
            case 4: return <SellerDelivery />;
            case 5: return <AnalyticsDashboard />;
            case 6: return <CommunityForum />;
            case 7: return <RecipeEngagementDashboard recipes={myRecipes} />;
            case 8: return <SellerProfile />;
            default: return null;
        }
    };

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#F9FAFB' }}>
            {/* Sidebar */}
            <Box sx={{ width: 220, bgcolor: SIDEBAR_BG, display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 100 }}>
                {/* Logo */}
                <Box sx={{ px: 3, py: 3, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <Typography variant="h6" fontWeight={800} color="#fff" fontSize="1rem">🌾 Rice Mill Express</Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Seller Portal</Typography>
                </Box>

                {/* Nav Items */}
                <Box sx={{ flex: 1, py: 2, overflowY: 'auto' }}>
                    {NAV_ITEMS(activeTab).map(item => (
                        <Box key={item.id} onClick={() => setActiveTab(item.id)}
                            sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 3, py: 1.5, cursor: 'pointer', bgcolor: activeTab === item.id ? SIDEBAR_ACTIVE : 'transparent', borderLeft: activeTab === item.id ? `3px solid ${ACCENT}` : '3px solid transparent', color: activeTab === item.id ? '#fff' : 'rgba(255,255,255,0.55)', transition: 'all 0.15s', '&:hover': { bgcolor: 'rgba(255,255,255,0.06)', color: '#fff' } }}>
                            {item.icon}
                            <Typography variant="body2" fontWeight={activeTab === item.id ? 700 : 400} fontSize="0.88rem">{item.label}</Typography>
                        </Box>
                    ))}
                </Box>

                {/* Logout */}
                <Box sx={{ px: 3, py: 2.5, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <Box onClick={handleLogout} sx={{ display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer', color: 'rgba(255,255,255,0.55)', '&:hover': { color: '#fff' } }}>
                        <Logout fontSize="small" />
                        <Typography variant="body2" fontWeight={500}>Logout</Typography>
                    </Box>
                </Box>
            </Box>

            {/* Main Content */}
            <Box sx={{ ml: '220px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                {/* Top Bar */}
                <Box sx={{ height: 64, bgcolor: '#fff', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', px: 3, gap: 2, position: 'sticky', top: 0, zIndex: 99 }}>
                    <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1.5, bgcolor: '#F9FAFB', borderRadius: 2, px: 2, py: 1, border: '1px solid #E5E7EB', maxWidth: 360 }}>
                        <Search fontSize="small" sx={{ color: '#9CA3AF' }} />
                        <input style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 14, color: '#374151', flex: 1 }} placeholder="Search orders, customers, or IDs" />
                    </Box>
                    <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 2 }}>
                        <NotificationBadge />
                        <Box onClick={() => setActiveTab(8)} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer' }}>
                            <Avatar sx={{ width: 36, height: 36, bgcolor: ACCENT, fontSize: '0.9rem' }}>{user?.name?.[0] || 'S'}</Avatar>
                            <Box>
                                <Typography variant="body2" fontWeight={700} lineHeight={1}>{user?.name || 'Seller'}</Typography>
                                <Typography variant="caption" color="text.secondary">Seller Portal</Typography>
                            </Box>
                        </Box>
                    </Box>
                </Box>

                {/* Page Content */}
                <Box sx={{ p: 3, flex: 1 }}>
                    <Typography variant="h5" fontWeight={800} gutterBottom sx={{ mb: 3 }}>
                        {NAV_ITEMS(activeTab).find(n => n.id === activeTab)?.label || 'Dashboard'}
                    </Typography>
                    {ordersError && <Alert severity="error" sx={{ mb: 2 }}>{ordersError}</Alert>}
                    {renderContent()}
                </Box>
            </Box>

            {/* Assign DP Dialog */}
            <AssignDPDialog
                open={openDialog}
                onClose={() => setOpenDialog(false)}
                onAssign={handleAssign}
                partners={partners}
                loading={assignState.loading}
                selectedOrder={selectedOrder}
            />
        </Box>
    );
};

export default SellerDashboard;