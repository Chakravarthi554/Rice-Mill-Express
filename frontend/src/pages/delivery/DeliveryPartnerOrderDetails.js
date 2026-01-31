import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Grid,
    Chip,
    Divider,
    Alert,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    IconButton,
    Paper,
} from '@mui/material';
import {
    LocalShipping,
    CheckCircle,
    PhotoCamera,
    MyLocation,
    SwapHoriz,
    ArrowBack,
    Phone,
    Email,
    Home,
    Person,
} from '@mui/icons-material';

const DeliveryPartnerOrderDetails = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const { userInfo } = useSelector((state) => state.user);

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    // Start Delivery State
    const [startDialogOpen, setStartDialogOpen] = useState(false);
    const [startLocation, setStartLocation] = useState(null);
    const [gettingLocation, setGettingLocation] = useState(false);

    // Confirm Delivery State
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [deliveryPhoto, setDeliveryPhoto] = useState(null);
    const [deliveryPhotoPreview, setDeliveryPhotoPreview] = useState('');
    const [deliveryLocation, setDeliveryLocation] = useState(null);
    const [deliveryNotes, setDeliveryNotes] = useState('');

    // Replacement Request State
    const [replacementDialogOpen, setReplacementDialogOpen] = useState(false);
    const [replacementReason, setReplacementReason] = useState('');
    const [replacementDescription, setReplacementDescription] = useState('');
    const [replacementPhoto, setReplacementPhoto] = useState(null);
    const [replacementPhotoPreview, setReplacementPhotoPreview] = useState('');

    // Fetch order details
    useEffect(() => {
        fetchOrderDetails();
    }, [orderId]);

    const fetchOrderDetails = async () => {
        try {
            setLoading(true);
            const config = {
                headers: {
                    Authorization: `Bearer ${userInfo.token}`,
                },
            };

            const { data } = await axios.get(
                `${process.env.REACT_APP_API_URL}/api/delivery-partners/orders/${orderId}`,
                config
            );

            setOrder(data.order);
            setError('');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch order details');
        } finally {
            setLoading(false);
        }
    };

    // Get current location
    const getCurrentLocation = () => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported by your browser'));
                return;
            }

            setGettingLocation(true);
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setGettingLocation(false);
                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                    });
                },
                (error) => {
                    setGettingLocation(false);
                    reject(error);
                }
            );
        });
    };

    // Handle Start Delivery
    const handleStartDelivery = async () => {
        try {
            setActionLoading(true);
            const config = {
                headers: {
                    Authorization: `Bearer ${userInfo.token}`,
                    'Content-Type': 'application/json',
                },
            };

            const body = startLocation || {};

            const { data } = await axios.post(
                `${process.env.REACT_APP_API_URL}/api/delivery-partners/orders/${orderId}/start`,
                body,
                config
            );

            setOrder(data.order);
            setSuccessMessage('Delivery started successfully!');
            setStartDialogOpen(false);
            setStartLocation(null);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to start delivery');
        } finally {
            setActionLoading(false);
        }
    };

    // Handle Confirm Delivery
    const handleConfirmDelivery = async () => {
        if (!deliveryPhoto) {
            setError('Please upload a delivery photo');
            return;
        }

        try {
            setActionLoading(true);
            const formData = new FormData();
            formData.append('deliveryPhoto', deliveryPhoto);
            if (deliveryLocation) {
                formData.append('latitude', deliveryLocation.latitude);
                formData.append('longitude', deliveryLocation.longitude);
            }
            if (deliveryNotes) {
                formData.append('notes', deliveryNotes);
            }

            const config = {
                headers: {
                    Authorization: `Bearer ${userInfo.token}`,
                    'Content-Type': 'multipart/form-data',
                },
            };

            const { data } = await axios.post(
                `${process.env.REACT_APP_API_URL}/api/delivery-partners/orders/${orderId}/confirm`,
                formData,
                config
            );

            setOrder(data.order);
            setSuccessMessage('Delivery confirmed successfully!');
            setConfirmDialogOpen(false);
            resetConfirmForm();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to confirm delivery');
        } finally {
            setActionLoading(false);
        }
    };

    // Handle Replacement Request
    const handleReplacementRequest = async () => {
        if (!replacementReason || !replacementDescription || !replacementPhoto) {
            setError('Please fill all required fields and upload a photo');
            return;
        }

        try {
            setActionLoading(true);
            const formData = new FormData();
            formData.append('reason', replacementReason);
            formData.append('description', replacementDescription);
            formData.append('replacementPhoto', replacementPhoto);

            const config = {
                headers: {
                    Authorization: `Bearer ${userInfo.token}`,
                    'Content-Type': 'multipart/form-data',
                },
            };

            await axios.post(
                `${process.env.REACT_APP_API_URL}/api/delivery-partners/orders/${orderId}/replacement`,
                formData,
                config
            );

            setSuccessMessage('Replacement request submitted successfully!');
            setReplacementDialogOpen(false);
            resetReplacementForm();
            fetchOrderDetails(); // Refresh order data
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit replacement request');
        } finally {
            setActionLoading(false);
        }
    };

    const resetConfirmForm = () => {
        setDeliveryPhoto(null);
        setDeliveryPhotoPreview('');
        setDeliveryLocation(null);
        setDeliveryNotes('');
    };

    const resetReplacementForm = () => {
        setReplacementReason('');
        setReplacementDescription('');
        setReplacementPhoto(null);
        setReplacementPhotoPreview('');
    };

    const handleDeliveryPhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setDeliveryPhoto(file);
            setDeliveryPhotoPreview(URL.createObjectURL(file));
        }
    };

    const handleReplacementPhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setReplacementPhoto(file);
            setReplacementPhotoPreview(URL.createObjectURL(file));
        }
    };

    const getStatusColor = (status) => {
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

    if (error && !order) {
        return (
            <Box p={3}>
                <Alert severity="error">{error}</Alert>
                <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)} sx={{ mt: 2 }}>
                    Go Back
                </Button>
            </Box>
        );
    }

    return (
        <Box p={3}>
            {/* Header */}
            <Box display="flex" alignItems="center" mb={3}>
                <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
                    <ArrowBack />
                </IconButton>
                <Typography variant="h4">Order Details</Typography>
            </Box>

            {/* Success/Error Messages */}
            {successMessage && (
                <Alert severity="success" onClose={() => setSuccessMessage('')} sx={{ mb: 2 }}>
                    {successMessage}
                </Alert>
            )}
            {error && (
                <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Grid container spacing={3}>
                {/* Order Status Card */}
                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                <Typography variant="h6">Order #{order?._id?.slice(-8)}</Typography>
                                <Chip
                                    label={order?.orderStatus?.replace('_', ' ').toUpperCase()}
                                    color={getStatusColor(order?.orderStatus)}
                                />
                            </Box>
                            <Divider sx={{ my: 2 }} />
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="body2" color="textSecondary">
                                        Delivery Status
                                    </Typography>
                                    <Chip
                                        label={order?.deliveryPartnerStatus?.replace('_', ' ').toUpperCase() || 'NOT STARTED'}
                                        size="small"
                                        sx={{ mt: 1 }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="body2" color="textSecondary">
                                        Total Amount
                                    </Typography>
                                    <Typography variant="h6">₹{order?.totalPrice?.toFixed(2)}</Typography>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Action Buttons */}
                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Actions
                            </Typography>
                            <Box display="flex" gap={2} flexWrap="wrap">
                                {order?.deliveryPartnerStatus === 'assigned' && (
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        startIcon={<LocalShipping />}
                                        onClick={() => setStartDialogOpen(true)}
                                    >
                                        Start Delivery
                                    </Button>
                                )}
                                {order?.deliveryPartnerStatus === 'in_transit' && (
                                    <Button
                                        variant="contained"
                                        color="success"
                                        startIcon={<CheckCircle />}
                                        onClick={() => setConfirmDialogOpen(true)}
                                    >
                                        Confirm Delivery
                                    </Button>
                                )}
                                {order?.deliveryPartnerStatus !== 'delivered' && (
                                    <Button
                                        variant="outlined"
                                        color="warning"
                                        startIcon={<SwapHoriz />}
                                        onClick={() => setReplacementDialogOpen(true)}
                                        disabled={order?.hasReplacementRequest}
                                    >
                                        {order?.hasReplacementRequest ? 'Replacement Requested' : 'Request Replacement'}
                                    </Button>
                                )}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Customer Details */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                <Person sx={{ mr: 1, verticalAlign: 'middle' }} />
                                Customer Details
                            </Typography>
                            <Divider sx={{ my: 2 }} />
                            <Box>
                                <Typography variant="body2" color="textSecondary">
                                    Name
                                </Typography>
                                <Typography variant="body1" gutterBottom>
                                    {order?.user?.name}
                                </Typography>
                                <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                                    <Phone sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                                    Phone
                                </Typography>
                                <Typography variant="body1" gutterBottom>
                                    {order?.user?.phone}
                                </Typography>
                                <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                                    <Email sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                                    Email
                                </Typography>
                                <Typography variant="body1">{order?.user?.email}</Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Delivery Address */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                <Home sx={{ mr: 1, verticalAlign: 'middle' }} />
                                Delivery Address
                            </Typography>
                            <Divider sx={{ my: 2 }} />
                            <Box>
                                <Typography variant="body1" gutterBottom>
                                    {order?.shippingAddress?.name}
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                    {order?.shippingAddress?.street}
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                    {order?.shippingAddress?.city}, {order?.shippingAddress?.state}
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                    {order?.shippingAddress?.pinCode}
                                </Typography>
                                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                                    <Phone sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                                    {order?.shippingAddress?.phone}
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Order Items */}
                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Order Items
                            </Typography>
                            <Divider sx={{ my: 2 }} />
                            {order?.orderItems?.map((item, index) => (
                                <Box key={index} display="flex" alignItems="center" mb={2}>
                                    <img
                                        src={item.image || '/images/default-product.jpg'}
                                        alt={item.name}
                                        style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 4, marginRight: 16 }}
                                    />
                                    <Box flex={1}>
                                        <Typography variant="body1">{item.name}</Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            Qty: {item.qty} × ₹{item.price}
                                        </Typography>
                                    </Box>
                                    <Typography variant="body1" fontWeight="bold">
                                        ₹{(item.qty * item.price).toFixed(2)}
                                    </Typography>
                                </Box>
                            ))}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Start Delivery Dialog */}
            <Dialog open={startDialogOpen} onClose={() => setStartDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Start Delivery</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                        You can optionally capture your current location when starting the delivery.
                    </Typography>
                    <Box mt={2}>
                        <Button
                            variant="outlined"
                            startIcon={<MyLocation />}
                            onClick={async () => {
                                try {
                                    const location = await getCurrentLocation();
                                    setStartLocation(location);
                                    setSuccessMessage('Location captured successfully');
                                } catch (err) {
                                    setError('Failed to get location: ' + err.message);
                                }
                            }}
                            disabled={gettingLocation}
                            fullWidth
                        >
                            {gettingLocation ? 'Getting Location...' : startLocation ? 'Location Captured ✓' : 'Capture Location'}
                        </Button>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setStartDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleStartDelivery} variant="contained" disabled={actionLoading}>
                        {actionLoading ? <CircularProgress size={24} /> : 'Start Delivery'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Confirm Delivery Dialog */}
            <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Confirm Delivery</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                        Upload a photo proof of delivery (required)
                    </Typography>
                    <Box mt={2}>
                        <input
                            accept="image/*"
                            style={{ display: 'none' }}
                            id="delivery-photo-upload"
                            type="file"
                            onChange={handleDeliveryPhotoChange}
                        />
                        <label htmlFor="delivery-photo-upload">
                            <Button variant="outlined" component="span" startIcon={<PhotoCamera />} fullWidth>
                                Upload Delivery Photo
                            </Button>
                        </label>
                        {deliveryPhotoPreview && (
                            <Box mt={2}>
                                <img src={deliveryPhotoPreview} alt="Preview" style={{ width: '100%', borderRadius: 8 }} />
                            </Box>
                        )}
                    </Box>
                    <Box mt={2}>
                        <Button
                            variant="outlined"
                            startIcon={<MyLocation />}
                            onClick={async () => {
                                try {
                                    const location = await getCurrentLocation();
                                    setDeliveryLocation(location);
                                    setSuccessMessage('Location captured successfully');
                                } catch (err) {
                                    setError('Failed to get location: ' + err.message);
                                }
                            }}
                            disabled={gettingLocation}
                            fullWidth
                        >
                            {gettingLocation ? 'Getting Location...' : deliveryLocation ? 'Location Captured ✓' : 'Capture Location (Optional)'}
                        </Button>
                    </Box>
                    <TextField
                        label="Notes (Optional)"
                        multiline
                        rows={3}
                        fullWidth
                        value={deliveryNotes}
                        onChange={(e) => setDeliveryNotes(e.target.value)}
                        sx={{ mt: 2 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleConfirmDelivery} variant="contained" color="success" disabled={actionLoading || !deliveryPhoto}>
                        {actionLoading ? <CircularProgress size={24} /> : 'Confirm Delivery'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Replacement Request Dialog */}
            <Dialog open={replacementDialogOpen} onClose={() => setReplacementDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Request Replacement</DialogTitle>
                <DialogContent>
                    <FormControl fullWidth sx={{ mt: 2 }}>
                        <InputLabel>Reason</InputLabel>
                        <Select value={replacementReason} onChange={(e) => setReplacementReason(e.target.value)} label="Reason">
                            <MenuItem value="damaged_product">Damaged Product</MenuItem>
                            <MenuItem value="wrong_product">Wrong Product</MenuItem>
                            <MenuItem value="quality_issue">Quality Issue</MenuItem>
                            <MenuItem value="incomplete_order">Incomplete Order</MenuItem>
                            <MenuItem value="customer_refused">Customer Refused</MenuItem>
                            <MenuItem value="address_issue">Address Issue</MenuItem>
                            <MenuItem value="other">Other</MenuItem>
                        </Select>
                    </FormControl>
                    <TextField
                        label="Description"
                        multiline
                        rows={4}
                        fullWidth
                        value={replacementDescription}
                        onChange={(e) => setReplacementDescription(e.target.value)}
                        sx={{ mt: 2 }}
                        required
                    />
                    <Box mt={2}>
                        <input
                            accept="image/*"
                            style={{ display: 'none' }}
                            id="replacement-photo-upload"
                            type="file"
                            onChange={handleReplacementPhotoChange}
                        />
                        <label htmlFor="replacement-photo-upload">
                            <Button variant="outlined" component="span" startIcon={<PhotoCamera />} fullWidth>
                                Upload Photo Proof (Required)
                            </Button>
                        </label>
                        {replacementPhotoPreview && (
                            <Box mt={2}>
                                <img src={replacementPhotoPreview} alt="Preview" style={{ width: '100%', borderRadius: 8 }} />
                            </Box>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setReplacementDialogOpen(false)}>Cancel</Button>
                    <Button
                        onClick={handleReplacementRequest}
                        variant="contained"
                        color="warning"
                        disabled={actionLoading || !replacementReason || !replacementDescription || !replacementPhoto}
                    >
                        {actionLoading ? <CircularProgress size={24} /> : 'Submit Request'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default DeliveryPartnerOrderDetails;
