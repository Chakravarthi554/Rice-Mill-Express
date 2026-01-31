import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import {
    Box,
    Container,
    Card,
    CardContent,
    Typography,
    Button,
    IconButton,
    Alert,
    CircularProgress,
    TextField,
    Grid,
    Paper,
} from '@mui/material';
import {
    ArrowBack,
    Warning,
    MyLocation,
    Phone,
    Help,
    Send,
} from '@mui/icons-material';
import { styled, keyframes } from '@mui/material/styles';

const pulse = keyframes`
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.9;
  }
`;

const PageContainer = styled(Box)(({ theme }) => ({
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    paddingTop: theme.spacing(3),
    paddingBottom: theme.spacing(3),
}));

const EmergencyButton = styled(Button)(({ theme }) => ({
    background: 'linear-gradient(135deg, #ffffff 0%, #fee2e2 100%)',
    color: '#dc2626',
    borderRadius: 20,
    padding: '40px',
    fontSize: '1.5rem',
    fontWeight: 700,
    textTransform: 'none',
    boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
    animation: `${pulse} 2s ease-in-out infinite`,
    '&:hover': {
        background: 'linear-gradient(135deg, #fee2e2 0%, #ffffff 100%)',
        transform: 'scale(1.05)',
    },
}));

const EmergencyAlert = () => {
    const navigate = useNavigate();
    const { userInfo } = useSelector((state) => state.user);

    const [location, setLocation] = useState(null);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [gettingLocation, setGettingLocation] = useState(false);

    const getLocation = () => {
        setGettingLocation(true);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                    });
                    setGettingLocation(false);
                },
                (error) => {
                    setError('Failed to get location. Please enable location services.');
                    setGettingLocation(false);
                }
            );
        } else {
            setError('Geolocation is not supported by your browser');
            setGettingLocation(false);
        }
    };

    useEffect(() => {
        getLocation();
    }, []);

    const handleSendEmergencyAlert = async () => {
        if (!location) {
            setError('Please enable location to send emergency alert');
            return;
        }

        try {
            setLoading(true);
            const config = {
                headers: {
                    Authorization: `Bearer ${userInfo.token}`,
                    'Content-Type': 'application/json',
                },
            };

            await axios.post(
                `${process.env.REACT_APP_API_URL}/api/dp/emergency-alert`,
                {
                    latitude: location.latitude,
                    longitude: location.longitude,
                    message: message || 'Emergency alert triggered',
                },
                config
            );

            setSuccess('🚨 Emergency alert sent successfully! Seller and admin have been notified.');
            setMessage('');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send emergency alert');
        } finally {
            setLoading(false);
        }
    };

    return (
        <PageContainer>
            <Container maxWidth="md">
                <Box display="flex" alignItems="center" mb={3}>
                    <IconButton
                        onClick={() => navigate('/delivery-partner/dashboard')}
                        sx={{ color: '#ffffff', mr: 2 }}
                    >
                        <ArrowBack />
                    </IconButton>
                    <Typography variant="h4" fontWeight="700" color="#ffffff">
                        🚨 Emergency Alert
                    </Typography>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                        {error}
                    </Alert>
                )}
                {success && (
                    <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
                        {success}
                    </Alert>
                )}

                <Card sx={{ mb: 3, borderRadius: 3 }}>
                    <CardContent>
                        <Alert severity="warning" sx={{ mb: 3 }}>
                            <Typography variant="body1" fontWeight="600">
                                ⚠️ Use this feature only in case of genuine emergency
                            </Typography>
                            <Typography variant="body2">
                                This will immediately alert your seller and admin with your current location.
                            </Typography>
                        </Alert>

                        <Box textAlign="center" py={4}>
                            <EmergencyButton
                                fullWidth
                                startIcon={<Warning sx={{ fontSize: 48 }} />}
                                onClick={handleSendEmergencyAlert}
                                disabled={loading || !location}
                            >
                                {loading ? (
                                    <CircularProgress size={32} sx={{ color: '#dc2626' }} />
                                ) : (
                                    'SEND EMERGENCY ALERT'
                                )}
                            </EmergencyButton>
                        </Box>

                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            label="Additional Message (Optional)"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Describe the emergency situation..."
                            sx={{ mb: 2 }}
                        />

                        <Paper sx={{ p: 2, background: '#f8f9fa' }}>
                            <Box display="flex" alignItems="center" mb={1}>
                                <MyLocation sx={{ mr: 1, color: location ? '#10b981' : '#94a3b8' }} />
                                <Typography variant="body2" fontWeight="600">
                                    Current Location:
                                </Typography>
                            </Box>
                            {gettingLocation ? (
                                <Typography variant="body2" color="textSecondary">
                                    Getting location...
                                </Typography>
                            ) : location ? (
                                <Typography variant="body2" color="success.main">
                                    ✅ Location captured: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                                </Typography>
                            ) : (
                                <Box>
                                    <Typography variant="body2" color="error">
                                        ❌ Location not available
                                    </Typography>
                                    <Button
                                        size="small"
                                        startIcon={<MyLocation />}
                                        onClick={getLocation}
                                        sx={{ mt: 1 }}
                                    >
                                        Retry Location
                                    </Button>
                                </Box>
                            )}
                        </Paper>
                    </CardContent>
                </Card>

                <Card sx={{ borderRadius: 3 }}>
                    <CardContent>
                        <Typography variant="h6" fontWeight="700" mb={2}>
                            📞 Quick Help
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <Button
                                    fullWidth
                                    variant="contained"
                                    startIcon={<Phone />}
                                    sx={{ background: '#10b981', py: 2 }}
                                    onClick={() => window.location.href = `tel:${userInfo?.sellerPhone || ''}`}
                                >
                                    Call Seller
                                </Button>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Button
                                    fullWidth
                                    variant="contained"
                                    startIcon={<Help />}
                                    sx={{ background: '#3b82f6', py: 2 }}
                                    onClick={() => navigate('/delivery-partner/help')}
                                >
                                    Help Center
                                </Button>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
            </Container>
        </PageContainer>
    );
};

export default EmergencyAlert;
