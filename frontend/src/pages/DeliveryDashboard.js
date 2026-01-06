import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Box, Typography, Container, Grid, Card, CardContent, Button,
    TextField, Dialog, DialogTitle, DialogContent, DialogActions,
    Alert, CircularProgress, Chip, Avatar
} from '@mui/material';
import { CameraAlt, CheckCircle, LocalShipping } from '@mui/icons-material';
import { listMyOrders, updateOrderToDelivered } from '../../redux/actions/orderActions';
import Message from '../../components/common/Message';
import Loader from '../../components/common/Loader';
import axios from 'axios';

const DeliveryDashboard = () => {
    const dispatch = useDispatch();
    const { userInfo } = useSelector((state) => state.userLogin);
    const { orders, loading, error } = useSelector((state) => state.orderListMy || {}); // Assuming reusing my orders or a new action

    const [selectedOrder, setSelectedOrder] = useState(null);
    const [otp, setOtp] = useState('');
    const [proofImage, setProofImage] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [deliveryLoading, setDeliveryLoading] = useState(false);
    const [deliveryError, setDeliveryError] = useState('');
    const [deliverySuccess, setDeliverySuccess] = useState('');

    // Fetch orders assigned to this delivery partner
    useEffect(() => {
        // TODO: Need a specific action for delivery partners to get their assigned orders
        // For now, using listMyOrders as a placeholder if backend supports it
        // dispatch(listMyOrders()); 
    }, [dispatch]);

    const handleOpenDeliveryModal = (order) => {
        setSelectedOrder(order);
        setOtp('');
        setProofImage(null);
        setPreviewUrl('');
        setDeliveryError('');
        setDeliverySuccess('');
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProofImage(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleCompleteDelivery = async () => {
        if (!otp) {
            setDeliveryError('Please enter the OTP provided by the customer.');
            return;
        }
        // if (!proofImage) {
        //   setDeliveryError('Please upload a proof of delivery photo.');
        //   return;
        // }

        setDeliveryLoading(true);
        setDeliveryError('');

        try {
            const formData = new FormData();
            formData.append('otp', otp);
            if (proofImage) {
                formData.append('image', proofImage);
            }

            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${userInfo.token}`,
                },
            };

            await axios.put(`/api/orders/${selectedOrder._id}/complete-delivery`, formData, config);

            setDeliverySuccess('Delivery completed successfully!');
            setTimeout(() => {
                setSelectedOrder(null);
                // Refresh orders
                // dispatch(listMyOrders());
            }, 2000);

        } catch (err) {
            setDeliveryError(err.response?.data?.message || 'Failed to complete delivery');
        } finally {
            setDeliveryLoading(false);
        }
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" gutterBottom>
                Delivery Partner Dashboard
            </Typography>

            {/* Stats or Summary */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={4}>
                    <Card sx={{ bgcolor: '#e3f2fd' }}>
                        <CardContent>
                            <Typography variant="h6">Assigned Orders</Typography>
                            <Typography variant="h3">{orders?.filter(o => o.orderStatus === 'shipped' || o.orderStatus === 'out_for_delivery').length || 0}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Card sx={{ bgcolor: '#e8f5e9' }}>
                        <CardContent>
                            <Typography variant="h6">Completed Today</Typography>
                            <Typography variant="h3">{orders?.filter(o => o.orderStatus === 'delivered' && new Date(o.deliveredAt).toDateString() === new Date().toDateString()).length || 0}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                    <Card sx={{ bgcolor: '#fff3e0' }}>
                        <CardContent>
                            <Typography variant="h6">Cash in Hand</Typography>
                            <Typography variant="h3">₹{orders?.filter(o => o.paymentMethod === 'cod' && o.codCollected && !o.codSettled).reduce((acc, o) => acc + o.totalPrice, 0) || 0}</Typography>
                            <Typography variant="caption">To be deposited</Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Typography variant="h5" gutterBottom>
                Active Deliveries
            </Typography>

            {loading ? <Loader /> : error ? <Message severity="error">{error}</Message> : (
                <Grid container spacing={3}>
                    {orders?.map((order) => (
                        <Grid item xs={12} md={6} key={order._id}>
                            <Card>
                                <CardContent>
                                    <Box display="flex" justifyContent="space-between" mb={2}>
                                        <Typography variant="h6">Order #{order._id.substring(18, 24).toUpperCase()}</Typography>
                                        <Chip label={order.orderStatus} color={order.orderStatus === 'delivered' ? 'success' : 'warning'} />
                                    </Box>
                                    <Typography><strong>Customer:</strong> {order.user?.name}</Typography>
                                    <Typography><strong>Address:</strong> {order.shippingAddress?.street}, {order.shippingAddress?.city}</Typography>
                                    <Typography><strong>Amount:</strong> ₹{order.totalPrice}</Typography>
                                    <Typography><strong>Payment:</strong> {order.paymentMethod} ({order.isPaid ? 'Paid' : 'Pending'})</Typography>

                                    {order.orderStatus === 'out_for_delivery' && (
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            fullWidth
                                            sx={{ mt: 2 }}
                                            startIcon={<CheckCircle />}
                                            onClick={() => handleOpenDeliveryModal(order)}
                                        >
                                            Complete Delivery
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* Complete Delivery Modal */}
            <Dialog open={Boolean(selectedOrder)} onClose={() => setSelectedOrder(null)} maxWidth="sm" fullWidth>
                <DialogTitle>Complete Delivery</DialogTitle>
                <DialogContent>
                    {deliveryError && <Alert severity="error" sx={{ mb: 2 }}>{deliveryError}</Alert>}
                    {deliverySuccess && <Alert severity="success" sx={{ mb: 2 }}>{deliverySuccess}</Alert>}

                    <Typography gutterBottom>
                        Enter the 4-digit OTP provided by the customer to verify delivery.
                    </Typography>

                    <TextField
                        autoFocus
                        margin="dense"
                        label="Enter OTP"
                        type="text"
                        fullWidth
                        variant="outlined"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        inputProps={{ maxLength: 4, style: { fontSize: 24, textAlign: 'center', letterSpacing: 10 } }}
                    />

                    <Box sx={{ mt: 3 }}>
                        <Typography gutterBottom>Upload Delivery Proof (Photo)</Typography>
                        <Button
                            variant="outlined"
                            component="label"
                            startIcon={<CameraAlt />}
                            fullWidth
                        >
                            Capture/Upload Photo
                            <input type="file" hidden accept="image/*" onChange={handleFileChange} />
                        </Button>
                        {previewUrl && (
                            <Box sx={{ mt: 2, textAlign: 'center' }}>
                                <img src={previewUrl} alt="Proof" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8 }} />
                            </Box>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSelectedOrder(null)}>Cancel</Button>
                    <Button
                        onClick={handleCompleteDelivery}
                        variant="contained"
                        color="success"
                        disabled={deliveryLoading || !otp}
                    >
                        {deliveryLoading ? <CircularProgress size={24} /> : 'Verify & Complete'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default DeliveryDashboard;
