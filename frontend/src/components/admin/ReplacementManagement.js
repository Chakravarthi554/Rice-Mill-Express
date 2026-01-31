import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Chip,
    Grid,
    CircularProgress,
    Alert,
    Tabs,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Divider,
} from '@mui/material';
import { CheckCircle, Cancel, Visibility, LocalShipping } from '@mui/icons-material';

const ReplacementManagement = () => {
    const { userInfo } = useSelector((state) => state.user);

    const [replacements, setReplacements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [activeTab, setActiveTab] = useState(0);

    // Review Dialog State
    const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
    const [selectedReplacement, setSelectedReplacement] = useState(null);
    const [reviewAction, setReviewAction] = useState('');
    const [reviewNotes, setReviewNotes] = useState('');
    const [reviewLoading, setReviewLoading] = useState(false);

    // Assign Delivery Dialog State
    const [assignDialogOpen, setAssignDialogOpen] = useState(false);
    const [deliveryPartners, setDeliveryPartners] = useState([]);
    const [selectedPartner, setSelectedPartner] = useState('');
    const [assignLoading, setAssignLoading] = useState(false);

    const statusFilters = [
        { label: 'All', value: '' },
        { label: 'Pending', value: 'pending' },
        { label: 'Approved', value: 'approved' },
        { label: 'Rejected', value: 'rejected' },
        { label: 'Completed', value: 'completed' },
    ];

    useEffect(() => {
        fetchReplacements();
        if (userInfo.role === 'seller') {
            fetchDeliveryPartners();
        }
    }, []);

    const fetchReplacements = async () => {
        try {
            setLoading(true);
            const config = {
                headers: {
                    Authorization: `Bearer ${userInfo.token}`,
                },
            };

            const { data } = await axios.get(`${process.env.REACT_APP_API_URL}/api/replacements`, config);

            setReplacements(data.replacements || []);
            setError('');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch replacement requests');
        } finally {
            setLoading(false);
        }
    };

    const fetchDeliveryPartners = async () => {
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${userInfo.token}`,
                },
            };

            const { data } = await axios.get(`${process.env.REACT_APP_API_URL}/api/delivery-partners/partners`, config);

            setDeliveryPartners(data || []);
        } catch (err) {
            console.error('Failed to fetch delivery partners:', err);
        }
    };

    const getFilteredReplacements = () => {
        if (activeTab === 0) return replacements;

        const filterValue = statusFilters[activeTab].value;
        return replacements.filter((replacement) => replacement.status === filterValue);
    };

    const handleReviewOpen = (replacement, action) => {
        setSelectedReplacement(replacement);
        setReviewAction(action);
        setReviewNotes('');
        setReviewDialogOpen(true);
    };

    const handleReviewSubmit = async () => {
        try {
            setReviewLoading(true);
            const config = {
                headers: {
                    Authorization: `Bearer ${userInfo.token}`,
                    'Content-Type': 'application/json',
                },
            };

            await axios.put(
                `${process.env.REACT_APP_API_URL}/api/replacements/${selectedReplacement._id}/review`,
                {
                    status: reviewAction,
                    reviewNotes,
                },
                config
            );

            setSuccessMessage(`Replacement request ${reviewAction} successfully`);
            setReviewDialogOpen(false);
            fetchReplacements();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to review replacement request');
        } finally {
            setReviewLoading(false);
        }
    };

    const handleAssignOpen = (replacement) => {
        setSelectedReplacement(replacement);
        setSelectedPartner('');
        setAssignDialogOpen(true);
    };

    const handleAssignSubmit = async () => {
        if (!selectedPartner) {
            setError('Please select a delivery partner');
            return;
        }

        try {
            setAssignLoading(true);
            const config = {
                headers: {
                    Authorization: `Bearer ${userInfo.token}`,
                    'Content-Type': 'application/json',
                },
            };

            await axios.put(
                `${process.env.REACT_APP_API_URL}/api/replacements/${selectedReplacement._id}/assign-delivery`,
                {
                    deliveryPartnerId: selectedPartner,
                },
                config
            );

            setSuccessMessage('Delivery partner assigned successfully');
            setAssignDialogOpen(false);
            fetchReplacements();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to assign delivery partner');
        } finally {
            setAssignLoading(false);
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            pending: 'warning',
            approved: 'success',
            rejected: 'error',
            completed: 'info',
        };
        return colors[status] || 'default';
    };

    const getReasonLabel = (reason) => {
        const labels = {
            damaged_product: 'Damaged Product',
            wrong_product: 'Wrong Product',
            quality_issue: 'Quality Issue',
            incomplete_order: 'Incomplete Order',
            customer_refused: 'Customer Refused',
            address_issue: 'Address Issue',
            other: 'Other',
        };
        return labels[reason] || reason;
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box p={3}>
            <Typography variant="h4" gutterBottom>
                Replacement Requests
            </Typography>

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

            {/* Stats Cards */}
            <Grid container spacing={2} mb={3}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Typography variant="h4" color="warning.main">
                                {replacements.filter((r) => r.status === 'pending').length}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                Pending
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Typography variant="h4" color="success.main">
                                {replacements.filter((r) => r.status === 'approved').length}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                Approved
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Typography variant="h4" color="error.main">
                                {replacements.filter((r) => r.status === 'rejected').length}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                Rejected
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Typography variant="h4" color="info.main">
                                {replacements.filter((r) => r.status === 'completed').length}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                Completed
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Tabs */}
            <Card>
                <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    {statusFilters.map((filter, index) => (
                        <Tab key={index} label={filter.label} />
                    ))}
                </Tabs>

                {/* Replacements Table */}
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Order ID</TableCell>
                                <TableCell>Requested By</TableCell>
                                <TableCell>Reason</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Date</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {getFilteredReplacements().length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center">
                                        <Typography variant="body2" color="textSecondary" py={3}>
                                            No replacement requests found
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                getFilteredReplacements().map((replacement) => (
                                    <TableRow key={replacement._id} hover>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight="bold">
                                                #{replacement.order?._id?.slice(-8)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">{replacement.requestedBy?.name}</Typography>
                                            <Chip label={replacement.requesterRole} size="small" sx={{ mt: 0.5 }} />
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">{getReasonLabel(replacement.reason)}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip label={replacement.status.toUpperCase()} color={getStatusColor(replacement.status)} size="small" />
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">{new Date(replacement.createdAt).toLocaleDateString()}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Box display="flex" gap={1}>
                                                {replacement.status === 'pending' && (
                                                    <>
                                                        <Button
                                                            size="small"
                                                            variant="contained"
                                                            color="success"
                                                            startIcon={<CheckCircle />}
                                                            onClick={() => handleReviewOpen(replacement, 'approved')}
                                                        >
                                                            Approve
                                                        </Button>
                                                        <Button
                                                            size="small"
                                                            variant="outlined"
                                                            color="error"
                                                            startIcon={<Cancel />}
                                                            onClick={() => handleReviewOpen(replacement, 'rejected')}
                                                        >
                                                            Reject
                                                        </Button>
                                                    </>
                                                )}
                                                {replacement.status === 'approved' && !replacement.replacementDeliveryPartner && userInfo.role === 'seller' && (
                                                    <Button
                                                        size="small"
                                                        variant="contained"
                                                        color="primary"
                                                        startIcon={<LocalShipping />}
                                                        onClick={() => handleAssignOpen(replacement)}
                                                    >
                                                        Assign Delivery
                                                    </Button>
                                                )}
                                                {replacement.photoProof && (
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        startIcon={<Visibility />}
                                                        onClick={() => window.open(`${process.env.REACT_APP_API_URL}${replacement.photoProof}`, '_blank')}
                                                    >
                                                        View Photo
                                                    </Button>
                                                )}
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Card>

            {/* Review Dialog */}
            <Dialog open={reviewDialogOpen} onClose={() => setReviewDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>{reviewAction === 'approved' ? 'Approve' : 'Reject'} Replacement Request</DialogTitle>
                <DialogContent>
                    {selectedReplacement && (
                        <Box>
                            <Typography variant="body2" color="textSecondary" gutterBottom>
                                Order: #{selectedReplacement.order?._id?.slice(-8)}
                            </Typography>
                            <Typography variant="body2" gutterBottom>
                                <strong>Reason:</strong> {getReasonLabel(selectedReplacement.reason)}
                            </Typography>
                            <Typography variant="body2" gutterBottom>
                                <strong>Description:</strong> {selectedReplacement.description}
                            </Typography>
                            <Divider sx={{ my: 2 }} />
                            <TextField
                                label="Review Notes (Optional)"
                                multiline
                                rows={3}
                                fullWidth
                                value={reviewNotes}
                                onChange={(e) => setReviewNotes(e.target.value)}
                                sx={{ mt: 2 }}
                            />
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setReviewDialogOpen(false)} disabled={reviewLoading}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleReviewSubmit}
                        variant="contained"
                        color={reviewAction === 'approved' ? 'success' : 'error'}
                        disabled={reviewLoading}
                    >
                        {reviewLoading ? <CircularProgress size={24} /> : reviewAction === 'approved' ? 'Approve' : 'Reject'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Assign Delivery Dialog */}
            <Dialog open={assignDialogOpen} onClose={() => setAssignDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Assign Delivery Partner</DialogTitle>
                <DialogContent>
                    <FormControl fullWidth sx={{ mt: 2 }}>
                        <InputLabel>Delivery Partner</InputLabel>
                        <Select value={selectedPartner} onChange={(e) => setSelectedPartner(e.target.value)} label="Delivery Partner">
                            {deliveryPartners.map((partner) => (
                                <MenuItem key={partner._id} value={partner._id}>
                                    {partner.name} - {partner.vehicle_type}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAssignDialogOpen(false)} disabled={assignLoading}>
                        Cancel
                    </Button>
                    <Button onClick={handleAssignSubmit} variant="contained" disabled={assignLoading || !selectedPartner}>
                        {assignLoading ? <CircularProgress size={24} /> : 'Assign'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ReplacementManagement;
