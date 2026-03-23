import React, { useState } from 'react';
import {
    Container,
    Paper,
    Typography,
    TextField,
    Button,
    Box,
    MenuItem,
    Select,
    InputLabel,
    FormControl,
    Alert,
    CircularProgress
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';

const ContactForm = () => {
    const { userInfo } = useSelector(state => state.userLogin);
    const [formData, setFormData] = useState({
        name: userInfo?.name || '',
        email: userInfo?.email || '',
        subject: '',
        message: '',
        category: 'general'
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const categories = [
        { value: 'general', label: 'General Inquiry' },
        { value: 'technical', label: 'Technical Support' },
        { value: 'billing', label: 'Billing Issue' },
        { value: 'feedback', label: 'Feedback/Suggestion' },
        { value: 'legal', label: 'Legal Question' }
    ];

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const validateForm = () => {
        if (!formData.name.trim()) {
            setError('Name is required');
            return false;
        }
        if (!formData.email.trim()) {
            setError('Email is required');
            return false;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setError('Invalid email format');
            return false;
        }
        if (!formData.subject.trim()) {
            setError('Subject is required');
            return false;
        }
        if (!formData.message.trim()) {
            setError('Message is required');
            return false;
        }
        if (formData.message.length < 10) {
            setError('Message must be at least 10 characters');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            setLoading(true);
            setError('');

            const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';
            const config = {
                headers: {
                    Authorization: `Bearer ${userInfo.token}`
                }
            };

            const response = await axios.post(`${API_BASE_URL}/api/support/tickets`, {
                subject: formData.subject,
                message: formData.message,
                category: formData.category,
                priority: 'medium'
            }, config);

            if (response.data.success) {
                setSuccess(true);

                // Reset form
                setFormData({
                    name: userInfo?.name || '',
                    email: userInfo?.email || '',
                    subject: '',
                    message: '',
                    category: 'general'
                });
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send message. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Paper sx={{ p: 4 }}>
                <Typography variant="h4" gutterBottom align="center" sx={{ mb: 3 }}>
                    Contact Us
                </Typography>

                <Typography variant="body1" align="center" sx={{ mb: 4, color: 'text.secondary' }}>
                    Have questions or need help? Fill out the form below and we'll get back to you within 24-48 hours.
                </Typography>

                {success && (
                    <Alert severity="success" sx={{ mb: 3 }}>
                        Thank you for contacting us. We will respond within 24-48 hours.
                    </Alert>
                )}

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
                    </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
                    <TextField
                        fullWidth
                        label="Full Name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        margin="normal"
                        required
                    />

                    <TextField
                        fullWidth
                        label="Email Address"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        margin="normal"
                        required
                    />

                    <TextField
                        fullWidth
                        label="Subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        margin="normal"
                        required
                    />

                    <FormControl fullWidth margin="normal">
                        <InputLabel>Category</InputLabel>
                        <Select
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            label="Category"
                        >
                            {categories.map((cat) => (
                                <MenuItem key={cat.value} value={cat.value}>
                                    {cat.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <TextField
                        fullWidth
                        label="Message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        margin="normal"
                        multiline
                        rows={6}
                        required
                        helperText="Please provide as much detail as possible"
                    />

                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                        <Button
                            type="submit"
                            variant="contained"
                            size="large"
                            disabled={loading}
                            sx={{
                                px: 4,
                                py: 1.5,
                                backgroundColor: '#4CAF50',
                                '&:hover': { backgroundColor: '#45a049' }
                            }}
                        >
                            {loading ? (
                                <>
                                    <CircularProgress size={20} sx={{ mr: 1 }} />
                                    Sending...
                                </>
                            ) : (
                                'Send Message'
                            )}
                        </Button>
                    </Box>
                </Box>
            </Paper>
        </Container>
    );
};

export default ContactForm;
