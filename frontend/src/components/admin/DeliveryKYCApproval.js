import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Box, Typography, Paper, Grid, Card, CardContent, CardMedia,
    Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, IconButton, Alert
} from '@mui/material';
import { CheckCircle, Cancel, Visibility, CloudUpload } from '@mui/icons-material';
import axios from 'axios';

const DeliveryKYCApproval = () => {
    const dispatch = useDispatch();
    const [pendingPartners, setPendingPartners] = useState([]);
    const [selectedPartner, setSelectedPartner] = useState(null);
    const [viewDialog, setViewDialog] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const userLogin = useSelector(state => state.userLogin);
    const { userInfo } = userLogin;

    useEffect(() => {
        fetchPendingKYC();
    }, []);

    const fetchPendingKYC = async () => {
        try {
            setLoading(true);
            const config = {
                headers: {
                    Authorization: `Bearer ${userInfo.token}`
                }
            };
            const { data } = await axios.get('/api/v1/delivery-partners/admin/kyc/pending', config);
            setPendingPartners(data);
            setLoading(false);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch pending KYC');
            setLoading(false);
        }
    };

    const handleApprove = async (partnerId) => {
        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${userInfo.token}`
                }
            };
            await axios.put(`/api/v1/delivery-partners/admin/kyc/${partnerId}`,
                { status: 'approved' },
                config
            );
            fetchPendingKYC();
            setViewDialog(false);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to approve KYC');
        }
    };

    const handleReject = async (partnerId) => {
        if (!rejectionReason.trim()) {
            setError('Please provide a rejection reason');
            return;
        }
        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${userInfo.token}`
                }
            };
            await axios.put(`/api/v1/delivery-partners/admin/kyc/${partnerId}`,
                { status: 'rejected', rejectionReason },
                config
            );
            fetchPendingKYC();
            setViewDialog(false);
            setRejectionReason('');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reject KYC');
        }
    };

    const openViewDialog = (partner) => {
        setSelectedPartner(partner);
        setViewDialog(true);
        setError('');
    };

    // Helper function to construct proper image URL
    const getImageUrl = (imagePath) => {
        if (!imagePath) return null;

        // Handle absolute paths (old format) - extract just the filename
        if (imagePath.includes('\\') || imagePath.includes('uploads')) {
            // Extract filename from path
            const filename = imagePath.split(/[\\\/]/).pop();
            return `http://localhost:5001/uploads/${filename}`;
        }

        // Handle relative paths (new format)
        return `http://localhost:5001/${imagePath}`;
    };

    return (
        <Box>
            <Typography variant="h5" gutterBottom fontWeight="bold">
                Delivery Partner KYC Approval
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

            {loading ? (
                <Typography>Loading...</Typography>
            ) : pendingPartners.length === 0 ? (
                <Alert severity="info">No pending KYC submissions</Alert>
            ) : (
                <Grid container spacing={3}>
                    {pendingPartners.map(partner => (
                        <Grid item xs={12} md={6} lg={4} key={partner._id}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>{partner.name}</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Phone: {partner.phone}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Vehicle: {partner.vehicle_type} - {partner.vehicle_number}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        License: {partner.license_number}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                        Seller: {partner.seller?.name || 'N/A'}
                                    </Typography>
                                    <Chip
                                        label={partner.kycStatus}
                                        color="warning"
                                        size="small"
                                        sx={{ mt: 1 }}
                                    />
                                    <Box sx={{ mt: 2 }}>
                                        <Button
                                            variant="contained"
                                            size="small"
                                            startIcon={<Visibility />}
                                            onClick={() => openViewDialog(partner)}
                                            fullWidth
                                        >
                                            View KYC Documents
                                        </Button>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* View KYC Dialog */}
            <Dialog open={viewDialog} onClose={() => setViewDialog(false)} maxWidth="md" fullWidth>
                <DialogTitle>KYC Documents - {selectedPartner?.name}</DialogTitle>
                <DialogContent>
                    {selectedPartner && (
                        <Box>
                            <Alert severity="info" sx={{ mb: 2 }}>
                                Partner: {selectedPartner.name} | Status: {selectedPartner.kycStatus}
                            </Alert>
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle2" gutterBottom>Aadhaar Number</Typography>
                                    <Typography variant="body2" sx={{ mb: 2 }}>{selectedPartner.aadharNumber || 'Not provided'}</Typography>
                                    {selectedPartner.aadharPhoto ? (
                                        <Box>
                                            <Typography variant="caption">Aadhaar Photo:</Typography>
                                            <Box
                                                component="img"
                                                src={getImageUrl(selectedPartner.aadharPhoto)}
                                                alt="Aadhaar"
                                                sx={{
                                                    maxWidth: '100%',
                                                    maxHeight: 200,
                                                    objectFit: 'contain',
                                                    mt: 1,
                                                    border: '1px solid #ddd',
                                                    borderRadius: 1,
                                                    display: 'block'
                                                }}
                                                onError={(e) => {
                                                    console.log('Failed to load:', e.target.src);
                                                    e.target.style.display = 'none';
                                                    e.target.nextSibling.style.display = 'block';
                                                }}
                                            />
                                            <Alert severity="error" sx={{ mt: 1, display: 'none' }}>
                                                Failed to load image. Path: {selectedPartner.aadharPhoto}
                                            </Alert>
                                        </Box>
                                    ) : (
                                        <Alert severity="warning" sx={{ mt: 1 }}>No Aadhaar photo uploaded</Alert>
                                    )}
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="subtitle2" gutterBottom>PAN Number</Typography>
                                    <Typography variant="body2" sx={{ mb: 2 }}>{selectedPartner.panNumber || 'Not provided'}</Typography>
                                    {selectedPartner.panPhoto ? (
                                        <Box>
                                            <Typography variant="caption">PAN Photo:</Typography>
                                            <Box
                                                component="img"
                                                src={getImageUrl(selectedPartner.panPhoto)}
                                                alt="PAN"
                                                sx={{
                                                    maxWidth: '100%',
                                                    maxHeight: 200,
                                                    objectFit: 'contain',
                                                    mt: 1,
                                                    border: '1px solid #ddd',
                                                    borderRadius: 1,
                                                    display: 'block'
                                                }}
                                                onError={(e) => {
                                                    console.log('Failed to load:', e.target.src);
                                                    e.target.style.display = 'none';
                                                    e.target.nextSibling.style.display = 'block';
                                                }}
                                            />
                                            <Alert severity="error" sx={{ mt: 1, display: 'none' }}>
                                                Failed to load image. Path: {selectedPartner.panPhoto}
                                            </Alert>
                                        </Box>
                                    ) : (
                                        <Alert severity="warning" sx={{ mt: 1 }}>No PAN photo uploaded</Alert>
                                    )}
                                </Grid>
                                <Grid item xs={12}>
                                    {selectedPartner.driverPhoto ? (
                                        <Box>
                                            <Typography variant="subtitle2" gutterBottom>Driver Photo</Typography>
                                            <Box
                                                component="img"
                                                src={getImageUrl(selectedPartner.driverPhoto)}
                                                alt="Driver"
                                                sx={{
                                                    maxWidth: '100%',
                                                    maxHeight: 250,
                                                    objectFit: 'contain',
                                                    mt: 1,
                                                    border: '1px solid #ddd',
                                                    borderRadius: 1,
                                                    display: 'block'
                                                }}
                                                onError={(e) => {
                                                    console.log('Failed to load:', e.target.src);
                                                    e.target.style.display = 'none';
                                                    e.target.nextSibling.style.display = 'block';
                                                }}
                                            />
                                            <Alert severity="error" sx={{ mt: 1, display: 'none' }}>
                                                Failed to load image. Path: {selectedPartner.driverPhoto}
                                            </Alert>
                                        </Box>
                                    ) : (
                                        <Alert severity="warning" sx={{ mt: 1 }}>No driver photo uploaded</Alert>
                                    )}
                                </Grid>
                            </Grid>

                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                label="Rejection Reason (if rejecting)"
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                sx={{ mt: 3 }}
                            />
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setViewDialog(false)}>Cancel</Button>
                    <Button
                        onClick={() => handleReject(selectedPartner?._id)}
                        color="error"
                        startIcon={<Cancel />}
                    >
                        Reject
                    </Button>
                    <Button
                        onClick={() => handleApprove(selectedPartner?._id)}
                        color="success"
                        variant="contained"
                        startIcon={<CheckCircle />}
                    >
                        Approve
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default DeliveryKYCApproval;

