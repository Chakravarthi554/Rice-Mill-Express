import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
    Box, Typography, Container, Grid, Card, CardContent, Button,
    Alert, CircularProgress, Chip, Tabs, Tab, Paper, Switch, Avatar,
    LinearProgress, Divider
} from '@mui/material';
import {
    History, LocalShipping, AttachMoney, Star, CheckCircle, DirectionsRun,
    Phone, Chat, Navigation, AccountBalanceWallet, Person, DirectionsBike,
    EmojiEvents, AccountBalance
} from '@mui/icons-material';
import DeliveryPhotoConfirmation from '../components/delivery/DeliveryPhotoConfirmation';
import Message from '../components/common/Message';
import axios from 'axios';

const DeliveryDashboard = () => {
    const { userInfo } = useSelector((state) => state.userLogin);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showPhotoModal, setShowPhotoModal] = useState(false);
    const [tabValue, setTabValue] = useState(0); // 0 = Dashboard, 1 = Wallet, 2 = Profile
    const [isOnline, setIsOnline] = useState(true);
    const [showIncomingRequest, setShowIncomingRequest] = useState(true);

    const fetchMyDeliveries = async () => {
        try {
            setLoading(true);
            const config = {
                headers: {
                    Authorization: `Bearer ${userInfo.accessToken || userInfo.token}`,
                },
            };
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

    useEffect(() => {
        if (userInfo) {
            fetchMyDeliveries();
        }
    }, [userInfo]);

    const handleOpenDeliveryModal = (order) => {
        setSelectedOrder(order);
        setShowPhotoModal(true);
    };

    const handleDeliverySuccess = () => {
        setShowPhotoModal(false);
        setSelectedOrder(null);
        fetchMyDeliveries();
        alert('✅ Delivery confirmed successfully with photo proof!');
    };

    // Analytics calculations
    const stats = useMemo(() => {
        const active = orders.filter(o => o.orderStatus === 'out_for_delivery' || o.orderStatus === 'shipped').length;
        const delivered = orders.filter(o => o.orderStatus === 'delivered');
        const total = delivered.length;
        const cashInHand = orders
            .filter(o => o.paymentMethod === 'cod' && o.codCollected && !o.codSettled)
            .reduce((acc, o) => acc + o.totalPrice, 0);

        return { 
            active: active || 2, 
            total: total || 8, 
            cashInHand: cashInHand || 4250 
        };
    }, [orders]);

    const activeOrders = orders.length > 0 
        ? orders.filter(o => o.orderStatus === 'out_for_delivery' || o.orderStatus === 'shipped')
        : [
            { _id: 'mock-1', orderNumber: 'RM240301-001', orderStatus: 'shipped', user: { name: 'Rahul Sharma', phone: '+91 98765 43210' }, shippingAddress: { street: '12B, Green Valley Apt', city: 'Chennai' }, totalPrice: 1250, paymentMethod: 'cod', orderItems: [{ name: 'Sona Masoori 25kg', qty: 2 }] },
            { _id: 'mock-2', orderNumber: 'RM240301-002', orderStatus: 'out_for_delivery', user: { name: 'Priya Patel', phone: '+91 98765 12345' }, shippingAddress: { street: '45C, Park Avenue', city: 'Chennai' }, totalPrice: 2450, paymentMethod: 'prepaid', orderItems: [{ name: 'Basmati Gold 10kg', qty: 1 }] }
        ];

    const completedOrders = orders.filter(o => o.orderStatus === 'delivered');

    return (
        <Container maxWidth="xs" sx={{ bgcolor: '#FFFDF9', minHeight: '100vh', pb: 10, pt: 2, px: 2 }}>
            
            {/* ── HEADER & ONLINE SWITCH ── */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box>
                    <Typography variant="h5" fontWeight={900} color="#E65100" sx={{ letterSpacing: '-0.02em' }}>
                        Delivery Partner
                    </Typography>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        Logistics Portal
                    </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={0.5}>
                    <Typography variant="caption" fontWeight={800} color={isOnline ? '#16A34A' : '#9CA3AF'}>
                        {isOnline ? 'Online' : 'Offline'}
                    </Typography>
                    <Switch size="small" checked={isOnline} onChange={(e) => setIsOnline(e.target.checked)} color="success" />
                </Box>
            </Box>

            {/* ── TABS (01 Dashboard, 02 Wallet, 03 Profile) ── */}
            <Paper sx={{ mb: 3, borderRadius: '12px', border: '1px solid #FFE0B2' }} elevation={0}>
                <Tabs 
                    value={tabValue} 
                    onChange={(e, v) => setTabValue(v)} 
                    variant="fullWidth"
                    sx={{ 
                        '& .MuiTabs-indicator': { bgcolor: '#E65100', height: 3 },
                        '& .MuiTab-root': { textTransform: 'none', fontWeight: 800, fontSize: '0.85rem', color: '#6B7280' },
                        '& .Mui-selected': { color: '#E65100' }
                    }}
                >
                    <Tab label="Dashboard" />
                    <Tab label="Wallet" />
                    <Tab label="Profile" />
                </Tabs>
            </Paper>

            {/* ── TAB 1: DASHBOARD VIEW ── */}
            {tabValue === 0 && (
                <Box>
                    {/* Today's Earnings */}
                    <Card sx={{ bgcolor: '#E65100', color: '#fff', borderRadius: '12px', mb: 3 }} elevation={2}>
                        <CardContent sx={{ p: 2.5 }}>
                            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                                <Box>
                                    <Typography variant="caption" sx={{ opacity: 0.9, fontWeight: 700, textTransform: 'uppercase' }}>TODAY'S EARNINGS</Typography>
                                    <Typography variant="h4" fontWeight={900} sx={{ mt: 0.5 }}>₹1,250</Typography>
                                    <Typography variant="caption" sx={{ opacity: 0.85, mt: 0.5, display: 'block', fontWeight: 600 }}>8 deliveries completed</Typography>
                                </Box>
                                <Button size="small" sx={{ color: '#fff', fontWeight: 800, textTransform: 'none', textDecoration: 'underline' }}>
                                    View Details →
                                </Button>
                            </Box>
                            
                            <Divider sx={{ my: 1.5, borderColor: 'rgba(255,255,255,0.15)' }} />

                            <Grid container spacing={1} sx={{ textAlign: 'center' }}>
                                {[
                                    { label: "Today's", val: "8" },
                                    { label: "Acceptance", val: "94%" },
                                    { label: "Rating", val: "4.8★" }
                                ].map((stat, idx) => (
                                    <Grid item xs={4} key={idx}>
                                        <Typography variant="h6" fontWeight={800}>{stat.val}</Typography>
                                        <Typography variant="caption" sx={{ opacity: 0.8, fontSize: '0.65rem', fontWeight: 600 }}>{stat.label}</Typography>
                                    </Grid>
                                ))}
                            </Grid>
                        </CardContent>
                    </Card>

                    {/* Floating Cash Alert */}
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: '12px', border: '1px solid #FFE0B2', bgcolor: '#FFF3E0', mb: 3 }}>
                        <Box display="flex" alignItems="center" gap={1.5} mb={1}>
                            <AttachMoney sx={{ color: '#E65100' }} />
                            <Box>
                                <Typography variant="subtitle2" fontWeight={800} color="#E65100">FLOATING CASH ALERT</Typography>
                                <Typography variant="caption" color="text.secondary" fontWeight={600}>You are holding: <strong>₹{stats.cashInHand}</strong></Typography>
                            </Box>
                        </Box>
                        
                        <Box sx={{ mt: 1.5 }}>
                            <Box display="flex" justifyContent="space-between" mb={0.5}>
                                <Typography variant="caption" fontWeight={700}>Limit: ₹5,000</Typography>
                                <Typography variant="caption" fontWeight={700} color="#E65100">85% reached</Typography>
                            </Box>
                            <LinearProgress variant="determinate" value={85} sx={{ height: 6, borderRadius: 3, bgcolor: '#FFE0B2', '& .MuiLinearProgress-bar': { bgcolor: '#E65100' } }} />
                        </Box>

                        <Box display="flex" gap={2} mt={2}>
                            <Button fullWidth variant="contained" sx={{ bgcolor: '#E65100', '&:hover': { bgcolor: '#BF360C' }, borderRadius: '8px', fontWeight: 800, fontSize: '0.8rem', textTransform: 'none' }}>
                                Remit Now
                            </Button>
                            <Button fullWidth variant="outlined" sx={{ color: '#6B7280', borderColor: '#E5E7EB', borderRadius: '8px', fontWeight: 800, fontSize: '0.8rem', textTransform: 'none' }}>
                                Later
                            </Button>
                        </Box>
                    </Paper>

                    {/* Incoming Order Request Notification */}
                    {showIncomingRequest && (
                        <Paper variant="outlined" sx={{ p: 2, borderRadius: '12px', border: '2px solid #E65100', bgcolor: '#FFF', mb: 3, position: 'relative' }}>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                                <Chip label="New Order Request" size="small" sx={{ bgcolor: '#FFE0B2', color: '#E65100', fontWeight: 800 }} />
                                <Typography variant="caption" sx={{ bgcolor: '#FFE0B2', color: '#E65100', px: 1, py: 0.5, borderRadius: '6px', fontWeight: 800, fontFamily: 'monospace' }}>
                                    00:25
                                </Typography>
                            </Box>
                            
                            <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700, color: '#374151' }}>
                                    📍 2.5 km away <span style={{ color: '#9CA3AF', fontWeight: 500 }}>(Pickup: Sharma Rice Mill)</span>
                                </Typography>
                                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700, color: '#374151', mt: 0.5 }}>
                                    🏁 4.2 km delivery <span style={{ color: '#9CA3AF', fontWeight: 500 }}>(Drop: Green Valley Apt)</span>
                                </Typography>
                            </Box>

                            <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ bgcolor: '#F9FAFB', p: 1.5, borderRadius: '8px', mb: 2 }}>
                                <Typography variant="caption" fontWeight={700} color="text.secondary">Earnings for this trip:</Typography>
                                <Typography variant="h6" fontWeight={900} color="#16A34A">₹45</Typography>
                            </Box>

                            <Box display="flex" gap={2}>
                                <Button fullWidth variant="contained" onClick={() => setShowIncomingRequest(false)} sx={{ bgcolor: '#16A34A', '&:hover': { bgcolor: '#15803D' }, borderRadius: '8px', fontWeight: 800, textTransform: 'none' }}>
                                    Accept
                                </Button>
                                <Button fullWidth variant="outlined" onClick={() => setShowIncomingRequest(false)} sx={{ color: '#DC2626', borderColor: '#DC2626', borderRadius: '8px', fontWeight: 800, textTransform: 'none' }}>
                                    Decline
                                </Button>
                            </Box>
                        </Paper>
                    )}

                    {/* Active Deliveries */}
                    <Typography variant="subtitle2" fontWeight={800} color="text.secondary" sx={{ mb: 1.5, textTransform: 'uppercase' }}>
                        Active Orders ({activeOrders.length})
                    </Typography>
                    
                    <Stack spacing={2}>
                        {activeOrders.map((order) => {
                            const isPrepaid = order.paymentMethod?.toLowerCase() !== 'cod';
                            return (
                                <Paper key={order._id} variant="outlined" sx={{ p: 2, borderRadius: '12px', border: '1.5px solid #F3F4F6' }}>
                                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                                        <Typography fontWeight={800} color="#E65100">
                                            #{order.orderNumber || order._id.substring(18, 24).toUpperCase()}
                                        </Typography>
                                        <Chip 
                                            label={isPrepaid ? 'PREPAID' : 'COD'} 
                                            size="small" 
                                            sx={{ bgcolor: isPrepaid ? '#E0F2FE' : '#FEE2E2', color: isPrepaid ? '#0284C7' : '#DC2626', fontWeight: 800, fontSize: '0.65rem' }} 
                                        />
                                    </Box>

                                    <Box sx={{ mb: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                                        <Box>
                                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>PICKUP FROM</Typography>
                                            <Typography variant="body2" fontWeight={800}>Sharma Rice Mill</Typography>
                                            <Typography variant="caption" color="text.secondary" display="block">45, Industrial Area, Chennai</Typography>
                                        </Box>
                                        
                                        <Box>
                                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>DELIVER TO</Typography>
                                            <Typography variant="body2" fontWeight={800}>{order.user?.name || 'Rahul Sharma'}</Typography>
                                            <Typography variant="caption" color="text.secondary" display="block">{order.shippingAddress?.street || '12B, Green Valley Apt, Chennai'}</Typography>
                                            <Chip label="Leave at door" size="small" sx={{ mt: 0.5, bgcolor: '#FFF3E0', color: '#E65100', fontWeight: 700, fontSize: '0.65rem' }} />
                                        </Box>
                                    </Box>

                                    <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ borderTop: '1px solid #F3F4F6', pt: 1.5 }}>
                                        <Typography variant="subtitle2" fontWeight={800}>₹{order.totalPrice}</Typography>
                                        
                                        <Box display="flex" gap={1}>
                                            <IconButton size="small" sx={{ bgcolor: '#FFF3E0', color: '#E65100' }}>
                                                <Phone fontSize="small" />
                                            </IconButton>
                                            <Button 
                                                variant="contained" 
                                                size="small"
                                                onClick={() => handleOpenDeliveryModal(order)}
                                                sx={{ bgcolor: '#E65100', '&:hover': { bgcolor: '#BF360C' }, fontWeight: 800, borderRadius: '6px', textTransform: 'none' }}
                                            >
                                                Confirm Delivery
                                            </Button>
                                        </Box>
                                    </Box>
                                </Paper>
                            );
                        })}
                    </Stack>
                </Box>
            )}

            {/* ── TAB 2: WALLET VIEW ── */}
            {tabValue === 1 && (
                <Box>
                    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: '12px', border: '1px solid #FFE0B2', bgcolor: '#FFF3E0', mb: 3 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>FLOATING CASH</Typography>
                        <Typography variant="h3" fontWeight={900} color="#E65100" sx={{ my: 1 }}>₹4,250</Typography>
                        
                        <Box sx={{ mt: 2 }}>
                            <Box display="flex" justifyContent="space-between" mb={0.5}>
                                <Typography variant="caption" fontWeight={700}>Limit: ₹5,000</Typography>
                                <Typography variant="caption" fontWeight={700} color="#E65100">85% reached</Typography>
                            </Box>
                            <LinearProgress variant="determinate" value={85} sx={{ height: 6, borderRadius: 3, bgcolor: '#FFE0B2', '& .MuiLinearProgress-bar': { bgcolor: '#E65100' } }} />
                        </Box>
                        <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block', fontWeight: 700 }}>
                            ⚠️ Remit soon to receive more orders
                        </Typography>
                    </Paper>

                    <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1.5, textTransform: 'uppercase' }}>Remittance Methods</Typography>
                    
                    {/* Scan & Pay Card */}
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: '12px', border: '1px solid #FFE0B2', mb: 3 }}>
                        <Box display="flex" alignItems="center" gap={1} mb={2}>
                            <Typography fontSize={24}>📱</Typography>
                            <Box>
                                <Typography variant="subtitle2" fontWeight={800}>Scan & Pay Instantly</Typography>
                                <Typography variant="caption" color="success.main" fontWeight={700}>Recommended</Typography>
                            </Box>
                        </Box>
                        
                        {/* Placeholder QR Code */}
                        <Box sx={{ 
                            width: 150, height: 150, mx: 'auto', border: '2px dashed #E65100', 
                            borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 
                        }}>
                            <Typography fontSize={48}>🏁 QR</Typography>
                        </Box>

                        <Typography variant="caption" color="text.secondary" display="block" textAlign="center" sx={{ mb: 2, fontWeight: 500 }}>
                            1. Open GPay, PhonePe, or Paytm.<br />
                            2. Scan this QR code.<br />
                            3. Pay exactly ₹4,250.
                        </Typography>

                        <Button fullWidth variant="contained" sx={{ bgcolor: '#16A34A', '&:hover': { bgcolor: '#15803D' }, borderRadius: '8px', fontWeight: 800, textTransform: 'none' }}>
                            I have paid
                        </Button>
                    </Paper>

                    {/* Transaction History */}
                    <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1.5, textTransform: 'uppercase' }}>Transaction History</Typography>
                    <Stack spacing={1.5}>
                        {[
                            { title: "UPI Remittance", date: "Today, 6:30 PM", amt: "+₹3,100", status: "Completed", color: "#16A34A" },
                            { title: "Cash Deposit", date: "Yesterday, 8:15 PM", amt: "+₹4,500", status: "Pending", color: "#E65100" },
                            { title: "UPI Payment", date: "Mar 19, 5:45 PM", amt: "+₹2,800", status: "Failed", color: "#DC2626" }
                        ].map((t, i) => (
                            <Paper key={i} variant="outlined" sx={{ p: 1.5, borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box>
                                    <Typography variant="body2" fontWeight={800}>{t.title}</Typography>
                                    <Typography variant="caption" color="text.secondary">{t.date}</Typography>
                                </Box>
                                <Box textAlign="right">
                                    <Typography variant="body2" fontWeight={800} color={t.color}>{t.amt}</Typography>
                                    <Chip label={t.status} size="small" sx={{ height: 18, fontSize: '0.62rem', fontWeight: 800, bgcolor: t.color === "#16A34A" ? "#E0F2FE" : t.color === "#E65100" ? "#FFF3E0" : "#FEE2E2", color: t.color }} />
                                </Box>
                            </Paper>
                        ))}
                    </Stack>
                </Box>
            )}

            {/* ── TAB 3: PROFILE VIEW ── */}
            {tabValue === 2 && (
                <Box>
                    {/* Driver Card */}
                    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: '12px', border: '1px solid #FFE0B2', bgcolor: '#FFF', mb: 3 }}>
                        <Box display="flex" alignItems="center" gap={2} mb={2.5}>
                            <Avatar sx={{ width: 56, height: 56, bgcolor: '#E65100' }}>
                                <Person />
                            </Avatar>
                            <Box>
                                <Typography variant="h6" fontWeight={800}>Rajesh Kumar</Typography>
                                <Typography variant="caption" color="text.secondary" fontWeight={700}>DP-2403-001</Typography>
                                <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
                                    <Star sx={{ fontSize: 14, color: '#F59E0B' }} />
                                    <Typography variant="caption" fontWeight={700}>4.8 (1.2k ratings)</Typography>
                                </Box>
                            </Box>
                        </Box>

                        {/* Performance Grid */}
                        <Grid container spacing={1.5} sx={{ textAlign: 'center', mb: 2 }}>
                            {[
                                { title: "94%", label: "Acceptance" },
                                { title: "89%", label: "On-time" },
                                { title: "45", label: "Compliments" }
                            ].map((stat, i) => (
                                <Grid item xs={4} key={i}>
                                    <Box sx={{ bgcolor: '#F9FAFB', py: 1, borderRadius: '8px' }}>
                                        <Typography variant="subtitle2" fontWeight={800} color="#E65100">{stat.title}</Typography>
                                        <Typography variant="caption" sx={{ fontSize: '0.65rem', color: '#6B7280', fontWeight: 600 }}>{stat.label}</Typography>
                                    </Box>
                                </Grid>
                            ))}
                        </Grid>

                        <Divider sx={{ my: 2 }} />

                        {/* Vehicle details */}
                        <Box display="flex" alignItems="center" gap={1.5}>
                            <DirectionsBike sx={{ color: '#E65100' }} />
                            <Box>
                                <Typography variant="caption" color="text.secondary" fontWeight={600}>VEHICLE INFO</Typography>
                                <Typography variant="body2" fontWeight={800}>Bike • TN-01-AB-1234</Typography>
                            </Box>
                        </Box>
                    </Paper>

                    {/* Incentive progress */}
                    <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1.5, textTransform: 'uppercase' }}>Incentive Progress</Typography>
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: '12px', border: '1px solid #FFE0B2', mb: 3 }}>
                        <Box display="flex" alignItems="center" gap={1.5} mb={1.5}>
                            <EmojiEvents sx={{ color: '#FBBF24', fontSize: 24 }} />
                            <Box>
                                <Typography variant="subtitle2" fontWeight={800}>Daily Bonus Challenge</Typography>
                                <Typography variant="caption" color="text.secondary" fontWeight={600}>Complete 15 deliveries today</Typography>
                            </Box>
                        </Box>
                        
                        <Box sx={{ bgcolor: '#F0FDF4', p: 1.5, borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="caption" fontWeight={700} color="#16A34A">Reward:</Typography>
                            <Typography variant="subtitle2" fontWeight={900} color="#16A34A">₹200 Bonus</Typography>
                        </Box>

                        <Box>
                            <Box display="flex" justifyContent="space-between" mb={0.5}>
                                <Typography variant="caption" fontWeight={700}>Progress: 8/15 deliveries</Typography>
                                <Typography variant="caption" fontWeight={700} color="#16A34A">53% done</Typography>
                            </Box>
                            <LinearProgress variant="determinate" value={53} sx={{ height: 6, borderRadius: 3, bgcolor: '#DCFCE7', '& .MuiLinearProgress-bar': { bgcolor: '#16A34A' } }} />
                        </Box>
                    </Paper>

                    {/* Payout Status */}
                    <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1.5, textTransform: 'uppercase' }}>Payout Status</Typography>
                    <Paper variant="outlined" sx={{ p: 2, borderRadius: '12px', border: '1px solid #FFE0B2' }}>
                        <Box display="flex" alignItems="center" gap={1.5} mb={2}>
                            <AccountBalance sx={{ color: '#E65100' }} />
                            <Box>
                                <Typography variant="caption" color="text.secondary" fontWeight={600}>LAST PAYOUT</Typography>
                                <Typography variant="body1" fontWeight={800}>₹12,400</Typography>
                                <Typography variant="caption" color="text.secondary" display="block">Received on 28 Feb 2026</Typography>
                            </Box>
                        </Box>
                        
                        <Divider sx={{ my: 1.5 }} />

                        <Box display="flex" alignItems="center" gap={1.5}>
                            <AccountBalanceWallet sx={{ color: '#16A34A' }} />
                            <Box>
                                <Typography variant="caption" color="text.secondary" fontWeight={600}>NEXT PAYOUT</Typography>
                                <Typography variant="body1" fontWeight={800} color="#16A34A">₹8,750</Typography>
                                <Typography variant="caption" color="text.secondary" display="block">Scheduled for 7 Mar 2026 (T+2)</Typography>
                            </Box>
                        </Box>
                    </Paper>
                </Box>
            )}

            {/* Photo confirm dialog */}
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
