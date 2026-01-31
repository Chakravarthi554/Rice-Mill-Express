import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
    Divider,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    CircularProgress,
    IconButton,
    Paper,
    Stepper,
    Step,
    StepLabel,
    List,
    ListItem,
    ListItemText,
    Avatar,
} from '@mui/material';
import {
    ArrowBack,
    CheckCircle,
    LocalShipping,
    CameraAlt,
    Navigation,
    Phone,
    LocationOn,
    Payment,
    Warning,
    Assignment,
    Schedule,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const PageContainer = styled(Box)(({ theme }) => ({
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    paddingTop: theme.spacing(3),
    paddingBottom: theme.spacing(3),
}));

const ActionButton = styled(Button)(({ theme, bgcolor }) => ({
    background: `linear-gradient(135deg, ${bgcolor} 0%, ${bgcolor}dd 100%)`,
    color: '#ffffff',
    borderRadius: 12,
    padding: '14px 28px',
    fontWeight: 600,
    fontSize: '1rem',
    textTransform: 'none',
    boxShadow: `0 4px 12px ${bgcolor}40`,
    '&:hover': {
        background: `linear-gradient(135deg, ${bgcolor}dd 0%, ${bgcolor} 100%)`,
        transform: 'translateY(-2px)',
        boxShadow: `0 6px 16px ${bgcolor}60`,
    },
    '&:disabled': {
        background: '#cbd5e1',
        color: '#94a3b8',
    },
}));

const InfoCard = styled(Card)(({ theme }) => ({
    background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
    borderRadius: 16,
    marginBottom: theme.spacing(2),
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
}));

const DeliveryPartnerOrderDetailsNew = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const { userInfo } = useSelector((state) => state.user);
    const fileInputRef = useRef(null);

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    // Dialog states
    const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
    const [replacementDialogOpen, setReplacementDialogOpen] = useState(false);
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const [photoPreview, setPhotoPreview] = useState('');
    const [replacementReason, setReplacementReason] = useState('');
    const [replacementDescription, setReplacementDescription] = useState('');
    const [replacementPhoto, setReplacementPhoto] = useState(null);

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
                `${process.env.REACT_APP_API_URL}/api/dp/order/${orderId}`,
                config
            );

            setOrder(data.order);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch order details');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmPickup = async () => {
        try {
            setActionLoading(true);
            const config = {
                headers: {
                    Authorization: `Bearer ${userInfo.token}`,
                },
            };

            const { data } = await axios.post(
                `${process.env.REACT_APP_API_URL}/api/dp/confirm-pickup/${orderId}`,
                {},
                config
            );

            setSuccess('Pickup confirmed! Order status updated to "Out for Delivery"');
            setOrder(data.order);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to confirm pickup');
        } finally {
            setActionLoading(false);
        }
    };

    const handleStartNavigation = async () => {
        try {
            setActionLoading(true);

            // Calculate estimated arrival (example: 30 minutes from now)
            const estimatedArrival = new Date();
            estimatedArrival.setMinutes(estimatedArrival.getMinutes() + 30);

            const config = {
                headers: {
                    Authorization: `Bearer ${userInfo.token}`,
                    'Content-Type': 'application/json',
                },
            };

            const { data } = await axios.post(
                `${process.env.REACT_APP_API_URL}/api/dp/start-navigation/${orderId}`,
                { estimatedArrival: estimatedArrival.toISOString() },
                config
            );

            setSuccess('Navigation started! Opening Google Maps...');
            setOrder(data.order);

            // Open Google Maps with destination
            const destination = `${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.pinCode}`;
            const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
            window.open(mapsUrl, '_blank');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to start navigation');
        } finally {
            setActionLoading(false);
        }
    };

    const handleConfirmCOD = async () => {
        try {
            setActionLoading(true);
            const config = {
                headers: {
                    Authorization: `Bearer ${userInfo.token}`,
                },
            };

            const { data } = await axios.post(
                `${process.env.REACT_APP_API_URL}/api/dp/confirm-cod/${orderId}`,
                {},
                config
            );

            setSuccess('COD amount collection confirmed successfully!');
            setOrder(data.order);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to confirm COD');
        } finally {
            setActionLoading(false);
        }
    };

    const handlePhotoSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedPhoto(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result);
            };
            reader.readAsDataURL(file);
            setPhotoDialogOpen(true);
        }
    };

    const handleUploadDeliveryPhoto = async () => {
        if (!selectedPhoto) {
            setError('Please select a photo');
            return;
        }

        try {
            setActionLoading(true);
            const formData = new FormData();
            formData.append('deliveryPhoto', selectedPhoto);

            const config = {
                headers: {
                    Authorization: `Bearer ${userInfo.token}`,
                    'Content-Type': 'multipart/form-data',
                },
            };

            const { data } = await axios.post(
                `${process.env.REACT_APP_API_URL}/api/dp/upload-delivery-photo/${orderId}`,
                formData,
                config
            );

            setSuccess('Delivery completed successfully! ✅');
            setOrder(data.order);
            setPhotoDialogOpen(false);
            setSelectedPhoto(null);
            setPhotoPreview('');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to upload delivery photo');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReplacementPhotoSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setReplacementPhoto(file);
        }
    };

    const handleSubmitReplacement = async () => {
        if (!replacementReason) {
            setError('Please select a replacement reason');
            return;
        }

        if (!replacementPhoto) {
            setError('Photo proof is required for replacement request');
            return;
        }

        try {
            setActionLoading(true);
            const formData = new FormData();
            formData.append('replacementPhoto', replacementPhoto);
            formData.append('reason', replacementReason);
            formData.append('description', replacementDescription);

            const config = {
                headers: {
                    Authorization: `Bearer ${userInfo.token}`,
                    'Content-Type': 'multipart/form-data',
                },
            };

            const { data } = await axios.post(
                `${process.env.REACT_APP_API_URL}/api/dp/request-replacement/${orderId}`,
                formData,
                config
            );

            setSuccess('Replacement request submitted successfully!');
            setOrder(data.order);
            setReplacementDialogOpen(false);
            setReplacementReason('');
            setReplacementDescription('');
            setReplacementPhoto(null);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit replacement request');
        } finally {
            setActionLoading(false);
        }
    };

    const getStatusStep = (status) => {
        const steps = ['assigned', 'picked_up', 'in_transit', 'delivered'];
        return steps.indexOf(status);
    };

    if (loading) {
        return (
            <PageContainer>
                <Container maxWidth="lg">
                    <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                        <CircularProgress sx={{ color: '#ffffff' }} />
                    </Box>
                </Container>
            </PageContainer>
        );
    }

    if (!order) {
        return (
            <PageContainer>
                <Container maxWidth="lg">
                    <Alert severity="error">Order not found</Alert>
                </Container>
            </PageContainer>
        );
    }

    return (
        <PageContainer>
            <Container maxWidth="lg">
                {/* Header */}
                <Box display="flex" alignItems="center" mb={3}>
                    <IconButton
                        onClick={() => navigate('/delivery-partner/dashboard')}
                        sx={{ color: '#ffffff', mr: 2 }}
                    >
                        <ArrowBack />
                    </IconButton>
                    <Typography variant="h4" fontWeight="700" color="#ffffff">
                        Order #{order._id.slice(-8).toUpperCase()}
                    </Typography>
                </Box>

                {/* Alerts */}
                {error && (
                    <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>
                        {error}
                    </Alert>
                )}
                {success && (
                    <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setSuccess('')}>
                        {success}
                    </Alert>
                )}

                {/* Status Stepper */}
                <InfoCard>
                    <CardContent>
                        <Stepper activeStep={getStatusStep(order.deliveryPartnerStatus)} alternativeLabel>
                            <Step>
                                <StepLabel>Assigned</StepLabel>
                            </Step>
                            <Step>
                                <StepLabel>Picked Up</StepLabel>
                            </Step>
                            <Step>
                                <StepLabel>In Transit</StepLabel>
                            </Step>
                            <Step>
                                <StepLabel>Delivered</StepLabel>
                            </Step>
                        </Stepper>
                    </CardContent>
                </InfoCard>

                <Grid container spacing={3}>
                    {/* Customer Information */}
                    <Grid item xs={12} md={6}>
                        <InfoCard>
                            <CardContent>
                                <Box display="flex" alignItems="center" mb={2}>
                                    <Avatar sx={{ bgcolor: '#3b82f6', mr: 2 }}>
                                        <Phone />
                                    </Avatar>
                                    <Typography variant="h6" fontWeight="700">
                                        Customer Information
                                    </Typography>
                                </Box>
                                <Divider sx={{ mb: 2 }} />
                                <Typography variant="body1" fontWeight="600" gutterBottom>
                                    {order.user?.name}
                                </Typography>
                                <Typography variant="body2" color="textSecondary" gutterBottom>
                                    📞 {order.user?.phone}
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                    📧 {order.user?.email}
                                </Typography>
                                <Button
                                    fullWidth
                                    variant="contained"
                                    startIcon={<Phone />}
                                    sx={{ mt: 2, background: '#10b981' }}
                                    onClick={() => window.location.href = `tel:${order.user?.phone}`}
                                >
                                    Call Customer
                                </Button>
                            </CardContent>
                        </InfoCard>
                    </Grid>

                    {/* Delivery Address */}
                    <Grid item xs={12} md={6}>
                        <InfoCard>
                            <CardContent>
                                <Box display="flex" alignItems="center" mb={2}>
                                    <Avatar sx={{ bgcolor: '#f59e0b', mr: 2 }}>
                                        <LocationOn />
                                    </Avatar>
                                    <Typography variant="h6" fontWeight="700">
                                        Delivery Address
                                    </Typography>
                                </Box>
                                <Divider sx={{ mb: 2 }} />
                                <Typography variant="body1" fontWeight="600" gutterBottom>
                                    {order.shippingAddress?.street}
                                </Typography>
                                <Typography variant="body2" color="textSecondary" gutterBottom>
                                    {order.shippingAddress?.city}, {order.shippingAddress?.state}
                                </Typography>
                                <Typography variant="body2" color="textSecondary" gutterBottom>
                                    PIN: {order.shippingAddress?.pinCode}
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                    📍 {order.shippingAddress?.landmark}
                                </Typography>
                            </CardContent>
                        </InfoCard>
                    </Grid>

                    {/* Payment Information */}
                    <Grid item xs={12} md={6}>
                        <InfoCard>
                            <CardContent>
                                <Box display="flex" alignItems="center" mb={2}>
                                    <Avatar sx={{ bgcolor: '#8b5cf6', mr: 2 }}>
                                        <Payment />
                                    </Avatar>
                                    <Typography variant="h6" fontWeight="700">
                                        Payment Information
                                    </Typography>
                                </Box>
                                <Divider sx={{ mb: 2 }} />
                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                    <Typography variant="body1" color="textSecondary">
                                        Payment Method:
                                    </Typography>
                                    <Chip
                                        label={order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Prepaid'}
                                        color={order.paymentMethod === 'cod' ? 'warning' : 'success'}
                                    />
                                </Box>
                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                    <Typography variant="h6" fontWeight="700">
                                        Total Amount:
                                    </Typography>
                                    <Typography variant="h5" fontWeight="700" color="primary">
                                        ₹{order.totalPrice?.toFixed(2)}
                                    </Typography>
                                </Box>
                                {order.paymentMethod === 'cod' && !order.codCollectedConfirmedAt && (
                                    <ActionButton
                                        fullWidth
                                        bgcolor="#f59e0b"
                                        startIcon={<CheckCircle />}
                                        onClick={handleConfirmCOD}
                                        disabled={actionLoading}
                                        sx={{ mt: 2 }}
                                    >
                                        {actionLoading ? <CircularProgress size={24} /> : 'Confirm COD Collected'}
                                    </ActionButton>
                                )}
                                {order.codCollectedConfirmedAt && (
                                    <Alert severity="success" sx={{ mt: 2 }}>
                                        COD Collected ✅
                                    </Alert>
                                )}
                            </CardContent>
                        </InfoCard>
                    </Grid>

                    {/* Order Items */}
                    <Grid item xs={12} md={6}>
                        <InfoCard>
                            <CardContent>
                                <Box display="flex" alignItems="center" mb={2}>
                                    <Avatar sx={{ bgcolor: '#10b981', mr: 2 }}>
                                        <Assignment />
                                    </Avatar>
                                    <Typography variant="h6" fontWeight="700">
                                        Order Items
                                    </Typography>
                                </Box>
                                <Divider sx={{ mb: 2 }} />
                                <List>
                                    {order.orderItems?.map((item, index) => (
                                        <ListItem key={index} divider>
                                            <ListItemText
                                                primary={item.name}
                                                secondary={`Qty: ${item.quantity} × ₹${item.price}`}
                                            />
                                            <Typography variant="body1" fontWeight="600">
                                                ₹{(item.quantity * item.price).toFixed(2)}
                                            </Typography>
                                        </ListItem>
                                    ))}
                                </List>
                            </CardContent>
                        </InfoCard>
                    </Grid>
                </Grid>

                {/* Action Buttons */}
                <Paper sx={{ p: 3, mt: 3, borderRadius: 3, background: 'linear-gradient(135deg, #ffffff 0%, #f0f4ff 100%)' }}>
                    <Typography variant="h6" fontWeight="700" mb={3}>
                        🚀 Delivery Actions
                    </Typography>
                    <Grid container spacing={2}>
                        {order.deliveryPartnerStatus === 'assigned' && (
                            <Grid item xs={12} sm={6}>
                                <ActionButton
                                    fullWidth
                                    bgcolor="#10b981"
                                    startIcon={<CheckCircle />}
                                    onClick={handleConfirmPickup}
                                    disabled={actionLoading}
                                >
                                    {actionLoading ? <CircularProgress size={24} /> : 'Confirm Pickup'}
                                </ActionButton>
                            </Grid>
                        )}

                        {(order.deliveryPartnerStatus === 'picked_up' || order.deliveryPartnerStatus === 'in_transit') && (
                            <>
                                <Grid item xs={12} sm={6}>
                                    <ActionButton
                                        fullWidth
                                        bgcolor="#3b82f6"
                                        startIcon={<Navigation />}
                                        onClick={handleStartNavigation}
                                        disabled={actionLoading}
                                    >
                                        {actionLoading ? <CircularProgress size={24} /> : 'Start Navigation'}
                                    </ActionButton>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <ActionButton
                                        fullWidth
                                        bgcolor="#8b5cf6"
                                        startIcon={<CameraAlt />}
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={actionLoading}
                                    >
                                        Upload Delivery Photo
                                    </ActionButton>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        style={{ display: 'none' }}
                                        accept="image/*"
                                        capture="environment"
                                        onChange={handlePhotoSelect}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <ActionButton
                                        fullWidth
                                        bgcolor="#ef4444"
                                        startIcon={<Warning />}
                                        onClick={() => setReplacementDialogOpen(true)}
                                        disabled={actionLoading || order.hasReplacementRequest}
                                    >
                                        Request Replacement
                                    </ActionButton>
                                </Grid>
                            </>
                        )}

                        {order.deliveryPartnerStatus === 'delivered' && (
                            <Grid item xs={12}>
                                <Alert severity="success" icon={<CheckCircle />}>
                                    <Typography variant="h6" fontWeight="700">
                                        Delivery Completed! ✅
                                    </Typography>
                                    <Typography variant="body2">
                                        Delivered on: {new Date(order.deliveredAt).toLocaleString()}
                                    </Typography>
                                    {order.deliveryPhotoUrl && (
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            sx={{ mt: 1 }}
                                            onClick={() => window.open(order.deliveryPhotoUrl, '_blank')}
                                        >
                                            View Delivery Photo
                                        </Button>
                                    )}
                                </Alert>
                            </Grid>
                        )}
                    </Grid>
                </Paper>

                {/* Photo Upload Dialog */}
                <Dialog open={photoDialogOpen} onClose={() => setPhotoDialogOpen(false)} maxWidth="sm" fullWidth>
                    <DialogTitle>Upload Delivery Photo</DialogTitle>
                    <DialogContent>
                        {photoPreview && (
                            <Box textAlign="center" mb={2}>
                                <img src={photoPreview} alt="Preview" style={{ maxWidth: '100%', borderRadius: 8 }} />
                            </Box>
                        )}
                        <Alert severity="info" sx={{ mt: 2 }}>
                            This photo will be uploaded with Order ID and timestamp overlay as proof of delivery.
                        </Alert>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setPhotoDialogOpen(false)}>Cancel</Button>
                        <Button
                            variant="contained"
                            onClick={handleUploadDeliveryPhoto}
                            disabled={actionLoading || !selectedPhoto}
                        >
                            {actionLoading ? <CircularProgress size={24} /> : 'Upload & Complete Delivery'}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Replacement Request Dialog */}
                <Dialog open={replacementDialogOpen} onClose={() => setReplacementDialogOpen(false)} maxWidth="sm" fullWidth>
                    <DialogTitle>Request Replacement</DialogTitle>
                    <DialogContent>
                        <FormControl fullWidth sx={{ mt: 2 }}>
                            <InputLabel>Reason</InputLabel>
                            <Select
                                value={replacementReason}
                                onChange={(e) => setReplacementReason(e.target.value)}
                                label="Reason"
                            >
                                <MenuItem value="damaged_product">Damaged Product</MenuItem>
                                <MenuItem value="wrong_product">Wrong Product</MenuItem>
                                <MenuItem value="quality_issue">Quality Issue</MenuItem>
                                <MenuItem value="incomplete_order">Incomplete Order</MenuItem>
                                <MenuItem value="other">Other</MenuItem>
                            </Select>
                        </FormControl>
                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            label="Description (Optional)"
                            value={replacementDescription}
                            onChange={(e) => setReplacementDescription(e.target.value)}
                            sx={{ mt: 2 }}
                        />
                        <Button
                            fullWidth
                            variant="outlined"
                            component="label"
                            sx={{ mt: 2 }}
                        >
                            {replacementPhoto ? '✅ Photo Selected' : 'Upload Photo Proof (Required)'}
                            <input
                                type="file"
                                hidden
                                accept="image/*"
                                capture="environment"
                                onChange={handleReplacementPhotoSelect}
                            />
                        </Button>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setReplacementDialogOpen(false)}>Cancel</Button>
                        <Button
                            variant="contained"
                            color="error"
                            onClick={handleSubmitReplacement}
                            disabled={actionLoading || !replacementReason || !replacementPhoto}
                        >
                            {actionLoading ? <CircularProgress size={24} /> : 'Submit Request'}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Container>
        </PageContainer>
    );
};

export default DeliveryPartnerOrderDetailsNew;
