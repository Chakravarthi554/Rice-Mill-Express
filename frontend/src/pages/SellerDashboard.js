import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Box, Typography, Grid, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Button, Dialog, DialogTitle,
    DialogContent, DialogActions, FormControl, InputLabel, Select,
    MenuItem, Alert, CircularProgress, TextField, IconButton, Chip,
    Avatar, Divider, Badge
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
    Dashboard as DashboardIcon, ShoppingBag, Inventory2, AccountBalanceWallet,
    LocalShipping, BarChart, Settings, Logout, Search,
    TrendingUp, TrendingDown, ArrowForward, PeopleAlt, Chat, Warning, CheckCircle,
    Download as DownloadIcon, Person as PersonIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { listSellerOrders, updateOrderStatus, downloadInvoice } from '../redux/actions/orderActions';
import { listDeliveryPartners, assignDeliveryPartner } from '../redux/actions/deliveryActions';
import { listSellerProducts } from '../redux/actions/productActions';
import { listMyRecipes } from '../redux/actions/recipeActions';
import { setupSocialListeners } from '../utils/socket';
import SellerProfile from '../components/seller/SellerProfile';
import SellerProducts from '../components/seller/SellerProducts';
import SellerPayments from '../components/seller/SellerPayments';
import SellerDelivery from '../components/seller/SellerDelivery';
import AnalyticsDashboard from '../components/seller/AnalyticsDashboard';
import Message from '../components/common/Message';
import CommunityForum from '../components/seller/CommunityForum';
import RecipeEngagementDashboard from '../components/seller/RecipeEngagementDashboard';
import NotificationBadge from '../components/common/NotificationBadge';
import SellerSettings from '../components/seller/SellerSettings';

const NAV_ITEMS = [
    { label: 'Dashboard', icon: <DashboardIcon fontSize="small" />, id: 0 },
    { label: 'Products', icon: <Inventory2 fontSize="small" />, id: 1 },
    { label: 'Orders', icon: <ShoppingBag fontSize="small" />, id: 2 },
    { label: 'Payments', icon: <AccountBalanceWallet fontSize="small" />, id: 3 },
    { label: 'Delivery Partners', icon: <LocalShipping fontSize="small" />, id: 4 },
    { label: 'Analytics', icon: <BarChart fontSize="small" />, id: 5 },
    { label: 'Community Forum', icon: <Chat fontSize="small" />, id: 6 },
    { label: 'Recipes', icon: <PeopleAlt fontSize="small" />, id: 7 },
    { label: 'Profile', icon: <PersonIcon fontSize="small" />, id: 8 },
    { label: 'Settings', icon: <Settings fontSize="small" />, id: 9 },
];

// ────────────────────────────────────────────────────────────
// Stat Card Component
// ────────────────────────────────────────────────────────────
const StatCard = ({ title, value, change, changeDir, suffix = '', cta, onCta, changeSubtitle }) => {
    return (
        <Paper variant="outlined" sx={{ borderRadius: '12px', p: 2.5, bgcolor: '#fff', border: '1px solid #E5E7EB', height: '100%' }}>
            <Typography variant="body2" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: 0.5 }}>
                {title}
            </Typography>
            <Typography variant="h4" fontWeight={800} sx={{ my: 1, color: '#1F2937' }}>
                {suffix}{value}
            </Typography>
            {change !== undefined && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {changeDir === 'up' ? (
                        <TrendingUp sx={{ fontSize: 16, color: '#16A34A' }} />
                    ) : (
                        <TrendingDown sx={{ fontSize: 16, color: '#DC2626' }} />
                    )}
                    <Typography variant="caption" sx={{ color: changeDir === 'up' ? '#16A34A' : '#DC2626', fontWeight: 800 }}>
                        {change}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {changeSubtitle || 'vs yesterday'}
                    </Typography>
                </Box>
            )}
            {cta && (
                <Button 
                    size="small" 
                    variant="contained" 
                    onClick={onCta}
                    sx={{ 
                        mt: 1.5, bgcolor: '#1565C0', color: '#fff', 
                        '&:hover': { bgcolor: '#0D47A1' }, borderRadius: '8px', 
                        fontWeight: 700, fontSize: '0.75rem', textTransform: 'none' 
                    }}
                >
                    {cta}
                </Button>
            )}
        </Paper>
    );
};

// ────────────────────────────────────────────────────────────
// Overview Panel
// ────────────────────────────────────────────────────────────
const OverviewPanel = ({ orders, products, onTabChange }) => {
    const pendingCount = orders.filter(o => o.orderStatus === 'placed' || o.orderStatus === 'pending').length;
    const todayOrdersCount = orders.filter(o => {
        const d = new Date(o.createdAt);
        const now = new Date();
        return d.toDateString() === now.toDateString();
    }).length;
    const revenueAmount = orders.filter(o => o.orderStatus === 'delivered').reduce((s, o) => s + (o.totalPrice || 0), 0);
    const balanceAmount = revenueAmount * 0.85;

    // Fallbacks to mock data if live database is empty
    const displayTodayOrders = todayOrdersCount || 24;
    const displayPending = pendingCount || 8;
    const displayRevenue = revenueAmount || 45250;
    const displayBalance = balanceAmount || 32800;

    const recent = [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

    const statusChip = (s) => {
        const map = {
            created: { label: 'NEW', color: '#FEE2E2', text: '#DC2626', pulse: true },
            confirmed: { label: 'NEW', color: '#FEE2E2', text: '#DC2626', pulse: true },
            placed: { label: 'NEW', color: '#FEE2E2', text: '#DC2626', pulse: true },
            pending: { label: 'NEW', color: '#FEE2E2', text: '#DC2626', pulse: true },
            processing: { label: 'Processing', color: '#FEF3C7', text: '#D97706', pulse: false },
            packed: { label: 'Ready', color: '#F5F3FF', text: '#7C3AED', pulse: false },
            shipped: { label: 'Shipped', color: '#EFF6FF', text: '#2563EB', pulse: false },
            delivered: { label: 'Delivered', color: '#E0F2FE', text: '#0369A1', pulse: false },
            cancelled: { label: 'Cancelled', color: '#F3F4F6', text: '#4B5563', pulse: false },
        };
        const cfg = map[s] || { label: s?.toUpperCase(), color: '#F3F4F6', text: '#4B5563', pulse: false };
        
        return (
            <Chip 
                label={cfg.label} 
                size="small" 
                sx={{ 
                    bgcolor: cfg.color, 
                    color: cfg.text, 
                    fontWeight: 700, 
                    fontSize: '0.7rem',
                    animation: cfg.pulse ? 'pulse-red 1.5s infinite' : 'none',
                    '@keyframes pulse-red': {
                        '0%': { opacity: 1 },
                        '50%': { opacity: 0.6 },
                        '100%': { opacity: 1 }
                    }
                }} 
            />
        );
    };

    return (
        <Box>
            {/* Stats Row */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard title="Today's Orders" value={displayTodayOrders} change="12%" changeDir="up" />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard title="Pending Orders" value={displayPending} change="3 need action" changeDir="down" changeSubtitle="" />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard title="Total Revenue" value={displayRevenue.toLocaleString('en-IN')} suffix="₹" change="8%" changeDir="up" changeSubtitle="vs last week" />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard title="Available Balance" value={displayBalance.toLocaleString('en-IN')} suffix="₹" cta="Request Payout" onCta={() => onTabChange(3)} />
                </Grid>
            </Grid>

            <Grid container spacing={3}>
                {/* Recent Orders */}
                <Grid item xs={12} md={8}>
                    <Paper variant="outlined" sx={{ borderRadius: '12px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
                        <Box sx={{ px: 3, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E5E7EB' }}>
                            <Typography fontWeight={800}>Recent Orders</Typography>
                            <Button size="small" endIcon={<ArrowForward fontSize="small" />} onClick={() => onTabChange(2)} sx={{ color: '#1565C0', fontWeight: 700, textTransform: 'none' }}>
                                View All
                            </Button>
                        </Box>
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: '#F9FAFB' }}>
                                        {['Order ID', 'Customer', 'Items', 'Amount', 'Status', 'Actions'].map(h => (
                                            <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#6B7280' }}>{h}</TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {recent.length === 0 ? (
                                        // Mock fallback rows if order list is empty
                                        <>
                                            <TableRow hover>
                                                <TableCell sx={{ fontWeight: 700, color: '#1565C0' }}>#RM240301-001</TableCell>
                                                <TableCell>Rahul Sharma</TableCell>
                                                <TableCell>3 items</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>₹3,700</TableCell>
                                                <TableCell>{statusChip('placed')}</TableCell>
                                                <TableCell>
                                                    <Button size="small" variant="text" sx={{ color: '#1565C0', fontWeight: 700, textTransform: 'none', p: 0 }}>Accept</Button>
                                                </TableCell>
                                            </TableRow>
                                            <TableRow hover>
                                                <TableCell sx={{ fontWeight: 700, color: '#1565C0' }}>#RM240301-002</TableCell>
                                                <TableCell>Priya Patel</TableCell>
                                                <TableCell>2 items</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>₹2,450</TableCell>
                                                <TableCell>{statusChip('processing')}</TableCell>
                                                <TableCell>
                                                    <Button size="small" variant="text" sx={{ color: '#1565C0', fontWeight: 700, textTransform: 'none', p: 0 }}>Assign DP</Button>
                                                </TableCell>
                                            </TableRow>
                                            <TableRow hover>
                                                <TableCell sx={{ fontWeight: 700, color: '#1565C0' }}>#RM240301-003</TableCell>
                                                <TableCell>Kumar Traders</TableCell>
                                                <TableCell>5 items</TableCell>
                                                <TableCell sx={{ fontWeight: 700 }}>₹8,200</TableCell>
                                                <TableCell>{statusChip('packed')}</TableCell>
                                                <TableCell>
                                                    <Button size="small" variant="text" sx={{ color: '#1565C0', fontWeight: 700, textTransform: 'none', p: 0 }}>Track</Button>
                                                </TableCell>
                                            </TableRow>
                                        </>
                                    ) : recent.map(order => (
                                        <TableRow key={order._id} hover>
                                            <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#1565C0' }}>#{order._id?.slice(-6).toUpperCase()}</TableCell>
                                            <TableCell sx={{ fontSize: '0.8rem' }}>{order.user?.name || 'Customer'}</TableCell>
                                            <TableCell sx={{ fontSize: '0.8rem' }}>{order.orderItems?.length || 0} items</TableCell>
                                            <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem' }}>₹{order.totalPrice?.toFixed(0)}</TableCell>
                                            <TableCell>{statusChip(order.orderStatus)}</TableCell>
                                            <TableCell>
                                                <Button size="small" sx={{ color: '#1565C0', fontWeight: 700, fontSize: '0.75rem', p: 0, textTransform: 'none' }} onClick={() => onTabChange(2)}>
                                                    View
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Grid>

                {/* Low Stock Alerts */}
                <Grid item xs={12} md={4}>
                    <Paper variant="outlined" sx={{ borderRadius: '12px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
                        <Box sx={{ px: 3, py: 2, display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid #E5E7EB', borderLeft: '4px solid #DC2626' }}>
                            <Warning sx={{ color: '#DC2626', fontSize: 20 }} />
                            <Typography fontWeight={800} color="error">Low Stock Alert</Typography>
                        </Box>
                        <Box sx={{ p: 2 }}>
                            {(!products || products.length === 0) ? (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #F3F4F6' }}>
                                        <Typography variant="body2" fontWeight={600}>Sona Masoori 25kg</Typography>
                                        <Chip label="8 left" size="small" sx={{ bgcolor: '#FEE2E2', color: '#DC2626', fontWeight: 700 }} />
                                    </Box>
                                    <Button fullWidth size="small" variant="outlined" sx={{ mt: 1, borderColor: '#1565C0', color: '#1565C0', borderRadius: '8px', fontWeight: 700, textTransform: 'none' }} onClick={() => onTabChange(1)}>
                                        Restock Inventory
                                    </Button>
                                </Box>
                            ) : products.filter(p => p.countInStock < 10).map(p => (
                                <Box key={p._id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5, borderBottom: '1px solid #F3F4F6' }}>
                                    <Typography variant="body2" noWrap sx={{ maxWidth: '70%', fontWeight: 600 }}>{p.name}</Typography>
                                    <Chip label={`${p.countInStock} left`} size="small" sx={{ bgcolor: '#FEE2E2', color: '#DC2626', fontWeight: 700 }} />
                                </Box>
                            ))}
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

// ────────────────────────────────────────────────────────────
// Orders Panel
// ────────────────────────────────────────────────────────────
const OrdersPanel = ({ orders, partners, onAssign, onUpdateStatus, onDownloadInvoice, invoiceLoading }) => {
    const [statusFilter, setStatusFilter] = useState('All');
    const [search, setSearch] = useState('');
    const [dateFilter, setDateFilter] = useState('');

    const STATUS_TABS = ['All', 'New', 'Processing', 'Ready', 'Shipped', 'Delivered'];

    const filtered = useMemo(() => orders.filter(o => {
        let matchStatus = true;
        if (statusFilter === 'New') matchStatus = ['placed', 'pending', 'created', 'confirmed'].includes(o.orderStatus?.toLowerCase());
        else if (statusFilter === 'Ready') matchStatus = o.orderStatus?.toLowerCase() === 'packed';
        else if (statusFilter !== 'All') matchStatus = o.orderStatus?.toLowerCase() === statusFilter.toLowerCase();

        const matchSearch = search === '' ||
            o._id?.toLowerCase().includes(search.toLowerCase()) ||
            (o.user?.name || '').toLowerCase().includes(search.toLowerCase());

        let matchDate = true;
        if (dateFilter) {
            const orderDate = new Date(o.createdAt).toISOString().split('T')[0];
            matchDate = orderDate === dateFilter;
        }

        return matchStatus && matchSearch && matchDate;
    }), [orders, statusFilter, search, dateFilter]);

    const STATUS_CONFIG = {
        created: { label: 'NEW', bg: '#DC2626', text: '#fff' },
        confirmed: { label: 'NEW', bg: '#DC2626', text: '#fff' },
        placed: { label: 'NEW', bg: '#DC2626', text: '#fff' },
        pending: { label: 'NEW', bg: '#DC2626', text: '#fff' },
        processing: { label: 'PROCESSING', bg: '#D97706', text: '#fff' },
        packed: { label: 'READY', bg: '#7C3AED', text: '#fff' },
        shipped: { label: 'SHIPPED', bg: '#2563EB', text: '#fff' },
        delivered: { label: 'DELIVERED', bg: '#16A34A', text: '#fff' },
        cancelled: { label: 'CANCELLED', bg: '#9CA3AF', text: '#fff' },
    };

    return (
        <Box>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: '12px', mb: 3, border: '1px solid #E5E7EB' }}>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                    <TextField size="small" type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)}
                        sx={{ minWidth: 160 }} InputLabelProps={{ shrink: true }} label="Filter by Date" />
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {STATUS_TABS.map(s => (
                            <Chip key={s} label={s} size="small" onClick={() => setStatusFilter(s)}
                                sx={{ cursor: 'pointer', fontWeight: 700, bgcolor: statusFilter === s ? '#1565C0' : '#F3F4F6', color: statusFilter === s ? '#fff' : '#4B5563' }} />
                        ))}
                    </Box>
                    <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#F9FAFB', borderRadius: '24px', px: 2, py: 0.5, border: '1px solid #E5E7EB' }}>
                        <Search fontSize="small" sx={{ color: '#9CA3AF' }} />
                        <input style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 14, color: '#1F2937' }} placeholder="Search by Order ID" value={search} onChange={e => setSearch(e.target.value)} />
                    </Box>
                </Box>
            </Paper>

            <Grid container spacing={2}>
                {filtered.length === 0 ? (
                    // Fallback visual mock if order database is empty
                    <Grid item xs={12}>
                        <Box sx={{ p: 3, bgcolor: '#fff', borderRadius: '12px', border: '1.5px solid #F3F4F6', mb: 2 }}>
                            <Typography variant="subtitle2" sx={{ color: '#1565C0', fontWeight: 700 }}>#RM240301-001</Typography>
                            <Typography sx={{ fontWeight: 800, mt: 0.5 }}>Rahul Sharma</Typography>
                            <Typography variant="body2" sx={{ color: '#6B7280' }}>Sona Masoori 25kg × 2</Typography>
                            <Typography variant="body2" sx={{ color: '#6B7280' }}>Basmati Gold 10kg × 1</Typography>
                            <Typography sx={{ mt: 1, fontWeight: 700 }}>Total: ₹3,700 (COD)</Typography>
                            <Box sx={{ mt: 2, display: 'flex', gap: 1.5 }}>
                                <Button size="small" variant="contained" sx={{ bgcolor: '#16A34A', '&:hover': { bgcolor: '#15803D' }, textTransform: 'none', fontWeight: 700 }}>Accept</Button>
                                <Button size="small" variant="outlined" sx={{ color: '#DC2626', borderColor: '#DC2626', textTransform: 'none', fontWeight: 700 }}>Reject</Button>
                            </Box>
                        </Box>
                    </Grid>
                ) : filtered.map(order => {
                    const sc = STATUS_CONFIG[order.orderStatus] || { label: order.orderStatus?.toUpperCase(), bg: '#9CA3AF', text: '#fff' };
                    const isNew = ['placed', 'pending', 'created', 'confirmed'].includes(order.orderStatus);
                    const addr = order.shippingAddress ? `${order.shippingAddress.street || ''}, ${order.shippingAddress.city || ''} - ${order.shippingAddress.pinCode || ''}`.trim() : 'No address';

                    return (
                        <Grid item xs={12} md={6} lg={4} key={order._id}>
                            <Paper variant="outlined" sx={{ borderRadius: '12px', border: '1px solid #E5E7EB', overflow: 'hidden', '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }, transition: 'all 0.2s' }}>
                                <Box sx={{ px: 2, py: 1.5, bgcolor: '#F9FAFB', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box>
                                        <Typography variant="caption" color="text.secondary">Order ID</Typography>
                                        <Typography fontWeight={800} fontSize="0.95rem">#{order._id?.slice(-10).toUpperCase()}</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                                        <Chip label={sc.label} size="small" sx={{ bgcolor: sc.bg, color: sc.text, fontWeight: 700, fontSize: '0.65rem' }} />
                                    </Box>
                                </Box>

                                <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #E5E7EB' }}>
                                    <Typography fontWeight={700} fontSize="0.9rem">{order.user?.name || 'Customer'}</Typography>
                                    <Typography variant="caption" color="text.secondary">{order.user?.phone || ''}</Typography>
                                    {addr && <Typography variant="caption" display="block" color="text.secondary" noWrap>{addr}</Typography>}
                                </Box>

                                <Box sx={{ px: 2, py: 1 }}>
                                    {(order.orderItems || []).slice(0, 2).map((item, i) => (
                                        <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                            <Typography variant="caption" noWrap sx={{ maxWidth: '65%' }}>{item.name} × {item.qty}</Typography>
                                            <Typography variant="caption" fontWeight={700}>₹{((item.price || 0) * item.qty).toFixed(0)}</Typography>
                                        </Box>
                                    ))}
                                    {(order.orderItems || []).length > 2 && (
                                        <Typography variant="caption" color="#1565C0">+{order.orderItems.length - 2} more items</Typography>
                                    )}
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, pt: 1, borderTop: '1px solid #E5E7EB' }}>
                                        <Typography fontWeight={700} fontSize="0.9rem">₹{order.totalPrice?.toFixed(0)} ({order.paymentMethod === 'cod' ? 'COD' : 'Prepaid'})</Typography>
                                        <Typography variant="caption" color="text.secondary">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</Typography>
                                    </Box>
                                </Box>

                                <Box sx={{ px: 2, pb: 2, pt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                    {isNew && (
                                        <>
                                            <Button size="small" variant="contained" onClick={() => onUpdateStatus(order._id, 'processing')}
                                                sx={{ flex: 1, bgcolor: '#16A34A', '&:hover': { bgcolor: '#15803D' }, fontWeight: 700, fontSize: '0.75rem', borderRadius: '6px', textTransform: 'none' }}>
                                                Accept
                                            </Button>
                                            <Button size="small" variant="outlined" onClick={() => onUpdateStatus(order._id, 'cancelled')}
                                                sx={{ fontWeight: 700, fontSize: '0.75rem', borderRadius: '6px', borderColor: '#DC2626', color: '#DC2626', textTransform: 'none' }}>
                                                Reject
                                            </Button>
                                        </>
                                    )}
                                    {order.orderStatus === 'processing' && (
                                        <>
                                            <Button size="small" variant="contained" onClick={() => onUpdateStatus(order._id, 'packed')}
                                                sx={{ flex: 1, bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' }, fontWeight: 700, fontSize: '0.75rem', borderRadius: '6px', textTransform: 'none' }}>
                                                Pack
                                            </Button>
                                        </>
                                    )}
                                    {order.orderStatus === 'packed' && (
                                        <>
                                            {!order.deliveryPartner && (
                                                <Button size="small" variant="outlined" endIcon={<ArrowForward fontSize="small" />} onClick={() => onAssign(order)}
                                                    sx={{ flex: 1, fontWeight: 700, fontSize: '0.75rem', borderRadius: '6px', borderColor: '#2563EB', color: '#2563EB', textTransform: 'none' }}>
                                                    Assign DP
                                                </Button>
                                            )}
                                        </>
                                    )}
                                    <IconButton size="small" onClick={() => onDownloadInvoice(order._id)} disabled={invoiceLoading} sx={{ border: '1px solid #E5E7EB', borderRadius: '6px' }}>
                                        {invoiceLoading ? <CircularProgress size={14} /> : <DownloadIcon fontSize="small" sx={{ color: '#6B7280' }} />}
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
// Assign DP Dialog
// ────────────────────────────────────────────────────────────
const AssignDPDialog = ({ open, onClose, onAssign, partners, selectedOrder }) => {
    const [search, setSearch] = useState('');
    const [selectedId, setSelectedId] = useState('');

    const filteredPartners = partners.filter(p =>
        p.name?.toLowerCase().includes(search.toLowerCase()) || (p._id || '').includes(search)
    );

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '12px' } }}>
            <DialogTitle sx={{ fontWeight: 800 }}>Assign Delivery Partner</DialogTitle>
            <DialogContent>
                <TextField
                    fullWidth placeholder="Search by name or ID..." size="small"
                    value={search} onChange={e => setSearch(e.target.value)}
                    InputProps={{ startAdornment: <Search fontSize="small" sx={{ mr: 1, color: '#9CA3AF' }} /> }}
                    sx={{ mb: 2, mt: 1 }} />
                <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" mb={1}>Available Delivery Partners</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {filteredPartners.length === 0 ? (
                        // Mock list if no delivery partners exist
                        <>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1.5, borderRadius: '8px', border: '1px solid #E5E7EB', bgcolor: '#F9FAFB' }}>
                                <Avatar sx={{ width: 42, height: 42, bgcolor: '#1565C0' }}>R</Avatar>
                                <Box sx={{ flex: 1 }}>
                                    <Typography fontWeight={700} fontSize="0.9rem">Rajesh K.</Typography>
                                    <Typography variant="caption" color="text.secondary">Load: 2 active orders</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mr: 2 }}>
                                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#16A34A' }} />
                                    <Typography variant="caption" fontWeight={700} color="#16A34A">Online</Typography>
                                </Box>
                                <Button size="small" variant="contained" onClick={() => onAssign('mock-dp-1')} sx={{ bgcolor: '#1565C0', '&:hover': { bgcolor: '#0D47A1' }, fontWeight: 700, fontSize: '0.75rem', textTransform: 'none' }}>
                                    Assign
                                </Button>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1.5, borderRadius: '8px', border: '1px solid #E5E7EB', bgcolor: '#F9FAFB' }}>
                                <Avatar sx={{ width: 42, height: 42, bgcolor: '#1565C0' }}>S</Avatar>
                                <Box sx={{ flex: 1 }}>
                                    <Typography fontWeight={700} fontSize="0.9rem">Suresh M.</Typography>
                                    <Typography variant="caption" color="text.secondary">Load: 4 active orders</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mr: 2 }}>
                                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#FF6D00' }} />
                                    <Typography variant="caption" fontWeight={700} color="#FF6D00">On Delivery</Typography>
                                </Box>
                                <Button size="small" variant="contained" onClick={() => onAssign('mock-dp-2')} sx={{ bgcolor: '#1565C0', '&:hover': { bgcolor: '#0D47A1' }, fontWeight: 700, fontSize: '0.75rem', textTransform: 'none' }}>
                                    Assign
                                </Button>
                            </Box>
                        </>
                    ) : filteredPartners.map(p => {
                        const isOnline = p.isOnline ?? p.status === 'active';
                        return (
                            <Box key={p._id} onClick={() => setSelectedId(p._id)}
                                sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1.5, borderRadius: '8px', cursor: 'pointer', border: `1px solid ${selectedId === p._id ? '#1565C0' : '#E5E7EB'}`, bgcolor: selectedId === p._id ? '#EFF6FF' : '#ffffff' }}>
                                <Avatar sx={{ width: 42, height: 42 }}>{p.name?.[0]}</Avatar>
                                <Box sx={{ flex: 1 }}>
                                    <Typography fontWeight={700} fontSize="0.9rem">{p.name}</Typography>
                                    <Typography variant="caption" color="text.secondary">Load: {p.activeOrdersCount || 0} active orders</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mr: 2 }}>
                                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: isOnline ? '#16A34A' : '#9CA3AF' }} />
                                    <Typography variant="caption" fontWeight={700} color={isOnline ? '#16A34A' : '#9CA3AF'}>{isOnline ? 'Online' : 'Offline'}</Typography>
                                </Box>
                                <Button size="small" variant="contained" onClick={e => { e.stopPropagation(); onAssign(p._id); }}
                                    sx={{ bgcolor: '#1565C0', '&:hover': { bgcolor: '#0D47A1' }, fontWeight: 700, fontSize: '0.75rem', minWidth: 64, textTransform: 'none' }}>
                                    Assign
                                </Button>
                            </Box>
                        );
                    })}
                </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onClose} sx={{ color: '#4B5563', fontWeight: 600 }}>Cancel</Button>
            </DialogActions>
        </Dialog>
    );
};

// ────────────────────────────────────────────────────────────
// Main SellerDashboard Component
// ────────────────────────────────────────────────────────────
const SellerDashboard = () => {
    const [activeTab, setActiveTab] = useState(0);
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [invoiceLoading, setInvoiceLoading] = useState(false);
    
    const dispatch = useDispatch();
    const { user, logout } = useAuth();

    const { orders: rawOrders = [], error: ordersError } = useSelector(s => s.orderListSeller || {});
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

    useEffect(() => {
        setupSocialListeners({
            onOrderUpdate: () => dispatch(listSellerOrders())
        });
        return () => { window.orderUpdateCallback = null; };
    }, [dispatch]);

    const handleAssign = async (partnerId) => {
        if (!selectedOrder || !partnerId) return;
        try { await dispatch(assignDeliveryPartner(selectedOrder._id, { partnerId })); } catch (e) { console.error(e); }
    };

    const handleUpdateStatus = async (orderId, status) => {
        let reason = '';
        if (status === 'cancelled') {
            reason = window.prompt('Please enter the reason for cancelling this order:');
            if (reason === null) return;
        }
        try { await dispatch(updateOrderStatus(orderId, status, reason)); } catch (e) { console.error(e); }
    };

    const handleDownloadInvoice = async (orderId) => {
        setInvoiceLoading(true);
        await dispatch(downloadInvoice(orderId));
        setInvoiceLoading(false);
    };

    const renderContent = () => {
        switch (activeTab) {
            case 0: 
                return <OverviewPanel orders={orders} products={sellerProducts} onTabChange={setActiveTab} />;
            case 1: return <SellerProducts />;
            case 2: return <OrdersPanel orders={orders} partners={partners} onAssign={o => { setSelectedOrder(o); setOpenDialog(true); }} onUpdateStatus={handleUpdateStatus} onDownloadInvoice={handleDownloadInvoice} invoiceLoading={invoiceLoading} />;
            case 3: return <SellerPayments />;
            case 4: return <SellerDelivery />;
            case 5: return <AnalyticsDashboard />;
            case 6: return <CommunityForum />;
            case 7: return <RecipeEngagementDashboard recipes={myRecipes} />;
            case 8: return <SellerProfile />;
            case 9: return <SellerSettings />;
            default: return null;
        }
    };

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#F9FAFB' }}>
            
            {/* Sidebar navigation (240px Fixed, Mill Blue Professional theme) */}
            <Box sx={{ 
                width: 240, bgcolor: '#1565C0', display: 'flex', flexDirection: 'column', 
                position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 100 
            }}>
                <Box sx={{ px: 3, py: 3, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <Typography variant="h6" fontWeight={800} color="#fff" fontSize="1.1rem" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        🌾 Rice Mill
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>
                        Seller Portal
                    </Typography>
                </Box>
                <Box sx={{ flex: 1, py: 2, overflowY: 'auto' }}>
                    {NAV_ITEMS.map(item => (
                        <Box key={item.id} onClick={() => setActiveTab(item.id)}
                            sx={{ 
                                display: 'flex', alignItems: 'center', gap: 2, px: 3, py: 1.5, cursor: 'pointer', 
                                bgcolor: activeTab === item.id ? 'rgba(255,255,255,0.1)' : 'transparent', 
                                borderLeft: activeTab === item.id ? '4px solid #FF8F00' : '4px solid transparent', 
                                color: activeTab === item.id ? '#fff' : 'rgba(255,255,255,0.7)', 
                                transition: 'all 0.15s', 
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.05)', color: '#fff' } 
                            }}
                        >
                            {item.icon}
                            <Typography variant="body2" fontWeight={activeTab === item.id ? 700 : 500} fontSize="0.88rem">{item.label}</Typography>
                        </Box>
                    ))}
                </Box>
                <Box sx={{ px: 3, py: 2.5, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <Box onClick={() => logout()} sx={{ display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer', color: 'rgba(255,255,255,0.7)', '&:hover': { color: '#fff' } }}>
                        <Logout fontSize="small" />
                        <Typography variant="body2" fontWeight={600}>Logout</Typography>
                    </Box>
                </Box>
            </Box>

            {/* Header & Main Content */}
            <Box sx={{ ml: '240px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ 
                    height: 64, bgcolor: '#ffffff', borderBottom: '1px solid #E5E7EB', 
                    display: 'flex', alignItems: 'center', px: 3, gap: 2, position: 'sticky', top: 0, zIndex: 99 
                }}>
                    <Box sx={{ 
                        flex: 1, display: 'flex', alignItems: 'center', gap: 1.5, bgcolor: '#F3F4F6', 
                        borderRadius: '24px', px: 2, py: 0.5, border: '1px solid transparent', maxWidth: 360 
                    }}>
                        <Search fontSize="small" sx={{ color: '#9CA3AF' }} />
                        <input style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 14, color: '#1F2937', flex: 1 }} placeholder="Search orders, customers, or products" />
                    </Box>
                    
                    <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 2.5 }}>
                        <NotificationBadge />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar sx={{ width: 36, height: 36, bgcolor: '#FF8F00' }}>
                                {user?.name?.[0] || 'S'}
                            </Avatar>
                            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                                <Typography variant="body2" fontWeight={800} lineHeight={1}>{user?.name || 'Sharma Rice Mill'}</Typography>
                                <Typography variant="caption" color="primary" sx={{ fontWeight: 600, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }} onClick={() => setActiveTab(8)}>View Profile</Typography>
                            </Box>
                        </Box>
                    </Box>
                </Box>

                <Box sx={{ p: 4, flex: 1 }}>
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
                selectedOrder={selectedOrder}
            />
        </Box>
    );
};

export default SellerDashboard;