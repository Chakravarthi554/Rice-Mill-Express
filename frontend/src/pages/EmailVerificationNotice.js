import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Box,
    Typography,
    Button,
    Paper,
    Alert,
    CircularProgress
} from '@mui/material';
import { MailOutline as MailIcon, CheckCircle as CheckIcon } from '@mui/icons-material';
import { auth } from '../firebase';
import { sendEmailVerification } from 'firebase/auth';
import { useAuth } from '../context/AuthContext';

const EmailVerificationNotice = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [checkingVerification, setCheckingVerification] = useState(false);

    // Auto-check verification status every 5 seconds
    useEffect(() => {
        const interval = setInterval(async () => {
            if (auth.currentUser) {
                setCheckingVerification(true);
                await auth.currentUser.reload();
                if (auth.currentUser.emailVerified) {
                    setMessage('Email verified! Redirecting...');
                    setTimeout(() => {
                        window.location.reload(); // Reload to trigger AuthContext
                    }, 1000);
                }
                setCheckingVerification(false);
            }
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    const handleResendEmail = async () => {
        try {
            setLoading(true);
            setMessage('');

            if (!auth.currentUser) {
                setMessage('No user logged in');
                return;
            }

            await sendEmailVerification(auth.currentUser);
            setMessage('Verification email sent! Please check your inbox.');
        } catch (error) {
            console.error('Resend email error:', error);
            if (error.code === 'auth/too-many-requests') {
                setMessage('Too many requests. Please wait a few minutes before trying again.');
            } else {
                setMessage(error.message || 'Failed to send verification email');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
    };

    return (
        <Container component="main" maxWidth="sm" sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            py: 4
        }}>
            <Paper elevation={3} sx={{ p: 4, width: '100%', textAlign: 'center' }}>
                <Box sx={{ mb: 3 }}>
                    <MailIcon sx={{ fontSize: 80, color: '#1976d2', mb: 2 }} />
                    <Typography variant="h5" component="h1" gutterBottom fontWeight={600}>
                        Verify Your Email
                    </Typography>
                </Box>

                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    We've sent a verification email to:
                </Typography>

                <Typography variant="h6" sx={{ mb: 3, color: '#1976d2' }}>
                    {user?.email || auth.currentUser?.email}
                </Typography>

                <Alert severity="info" sx={{ mb: 3, textAlign: 'left' }}>
                    <Typography variant="body2">
                        <strong>Please verify your email to continue.</strong>
                        <br />
                        1. Check your inbox (and spam folder)
                        <br />
                        2. Click the verification link in the email
                        <br />
                        3. Return to this page - it will auto-refresh
                    </Typography>
                </Alert>

                {checkingVerification && (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                        <CircularProgress size={20} sx={{ mr: 1 }} />
                        <Typography variant="body2" color="text.secondary">
                            Checking verification status...
                        </Typography>
                    </Box>
                )}

                <Button
                    fullWidth
                    variant="contained"
                    onClick={handleResendEmail}
                    disabled={loading}
                    sx={{ mb: 2 }}
                >
                    {loading ? <CircularProgress size={24} /> : 'Resend Verification Email'}
                </Button>

                <Button
                    fullWidth
                    variant="outlined"
                    onClick={handleLogout}
                    disabled={loading}
                >
                    Logout
                </Button>

                {message && (
                    <Alert
                        severity={message.includes('sent') || message.includes('verified') ? 'success' : 'error'}
                        sx={{ mt: 3 }}
                        icon={message.includes('verified') ? <CheckIcon /> : undefined}
                    >
                        {message}
                    </Alert>
                )}
            </Paper>
        </Container>
    );
};

export default EmailVerificationNotice;
