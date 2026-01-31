import React, { useState } from 'react';
import axios from 'axios';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Box,
    CircularProgress,
    Alert,
} from '@mui/material';
import { PhotoCamera } from '@mui/icons-material';

const CustomerReplacementDialog = ({ open, onClose, orderId, userToken, onSuccess }) => {
    const [reason, setReason] = useState('');
    const [description, setDescription] = useState('');
    const [photo, setPhoto] = useState(null);
    const [photoPreview, setPhotoPreview] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPhoto(file);
            setPhotoPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async () => {
        if (!reason || !description) {
            setError('Please fill all required fields');
            return;
        }

        try {
            setLoading(true);
            setError('');

            const formData = new FormData();
            formData.append('reason', reason);
            formData.append('description', description);
            if (photo) {
                formData.append('replacementPhoto', photo);
            }

            const config = {
                headers: {
                    Authorization: `Bearer ${userToken}`,
                    'Content-Type': 'multipart/form-data',
                },
            };

            await axios.post(
                `${process.env.REACT_APP_API_URL}/api/replacements/customer/${orderId}`,
                formData,
                config
            );

            // Reset form
            setReason('');
            setDescription('');
            setPhoto(null);
            setPhotoPreview('');

            if (onSuccess) {
                onSuccess();
            }

            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit replacement request');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setReason('');
        setDescription('');
        setPhoto(null);
        setPhotoPreview('');
        setError('');
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>Request Replacement</DialogTitle>
            <DialogContent>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <FormControl fullWidth sx={{ mt: 2 }}>
                    <InputLabel>Reason *</InputLabel>
                    <Select value={reason} onChange={(e) => setReason(e.target.value)} label="Reason *">
                        <MenuItem value="damaged_product">Damaged Product</MenuItem>
                        <MenuItem value="wrong_product">Wrong Product</MenuItem>
                        <MenuItem value="quality_issue">Quality Issue</MenuItem>
                        <MenuItem value="incomplete_order">Incomplete Order</MenuItem>
                        <MenuItem value="other">Other</MenuItem>
                    </Select>
                </FormControl>

                <TextField
                    label="Description *"
                    multiline
                    rows={4}
                    fullWidth
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    sx={{ mt: 2 }}
                    required
                    placeholder="Please describe the issue in detail..."
                />

                <Box mt={2}>
                    <input
                        accept="image/*"
                        style={{ display: 'none' }}
                        id="replacement-photo-upload"
                        type="file"
                        onChange={handlePhotoChange}
                    />
                    <label htmlFor="replacement-photo-upload">
                        <Button variant="outlined" component="span" startIcon={<PhotoCamera />} fullWidth>
                            Upload Photo (Optional)
                        </Button>
                    </label>
                    {photoPreview && (
                        <Box mt={2}>
                            <img src={photoPreview} alt="Preview" style={{ width: '100%', borderRadius: 8 }} />
                        </Box>
                    )}
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} disabled={loading}>
                    Cancel
                </Button>
                <Button onClick={handleSubmit} variant="contained" color="warning" disabled={loading || !reason || !description}>
                    {loading ? <CircularProgress size={24} /> : 'Submit Request'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default CustomerReplacementDialog;
