import React, { useState } from 'react';
import { Container, Paper, Typography, Button, Box, Alert, CircularProgress } from '@mui/material';
import { MailOutline, Refresh, Logout } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { sendEmailVerification } from 'firebase/auth';
import { auth } from '../firebase';
import { refreshFirebaseToken } from '../utils/authUtils';
import { useNavigate } from 'react-router-dom';

const VerifyEmailNotice = () => {
    const { logout, user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleResendEmail = async () => {
        try {
            setLoading(true);
            setError('');
            setMessage('');
            if (auth.currentUser) {
                await sendEmailVerification(auth.currentUser);
                setMessage('Verification email sent! Please check your Gmail inbox and spam folder.');
            } else {
                setError('No active session found. Please log in again.');
            }
        } catch (err) {
            console.error('Error resending email:', err);
            setError(err.message || 'Failed to send verification email.');
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        try {
            setIsRefreshing(true);
            setError('');
            const newToken = await refreshFirebaseToken();
            if (newToken) {
                setMessage('Verification successful! Redirecting...');
                setTimeout(() => navigate('/'), 1500);
            } else {
                setError('Could not verify email status yet. Please try again or log out and back in.');
            }
        } catch (err) {
            setError('Error checking verification status.');
        } finally {
            setIsRefreshing(false);
        }
    };

    return (
        <Container maxWidth="sm" sx={{ mt: 8 }}>
            <Paper elevation={3} sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
                <Box sx={{ mb: 2 }}>
                    <MailOutline sx={{ fontSize: 60, color: 'primary.main' }} />
                </Box>

                <Typography variant="h4" gutterBottom fontWeight="bold">
                    Verify Your Email
                </Typography>

                <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>
                    Hello <strong>{user?.name || 'User'}</strong>! To access your dashboard and all features, you must verify your email address (<strong>{user?.email}</strong>).
                </Typography>

                <Alert severity="info" sx={{ mb: 4, textAlign: 'left' }}>
                    Please check your Gmail for a verification link sent from Rice-Express. If you don't see it, check your spam folder or click below to resend.
                </Alert>

                {message && <Alert severity="success" sx={{ mb: 3 }}>{message}</Alert>}
                {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Button
                        variant="contained"
                        size="large"
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        startIcon={!isRefreshing && <Refresh />}
                        fullWidth
                    >
                        {isRefreshing ? <CircularProgress size={24} color="inherit" /> : "I've Verified (Refresh Session)"}
                    </Button>

                    <Button
                        variant="outlined"
                        size="large"
                        onClick={handleResendEmail}
                        disabled={loading}
                        fullWidth
                    >
                        {loading ? <CircularProgress size={24} /> : 'Resend Verification Email'}
                    </Button>

                    <Button
                        variant="text"
                        color="inherit"
                        onClick={() => logout()}
                        startIcon={<Logout />}
                    >
                        Logout and try again
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
};

export default VerifyEmailNotice;
