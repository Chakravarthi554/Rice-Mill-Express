import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, TextField, Button, CircularProgress, Paper, Alert, FormControlLabel, Checkbox, Grid, Tabs, Tab } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { auth, RecaptchaVerifier } from '../firebase';
import { signInWithPhoneNumber } from 'firebase/auth';
import axios from 'axios';

const LoginPage = () => {
  const [email, setEmail] = useState('admin@ricemill.com');
  const [password, setPassword] = useState('adminpass123');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loginMode, setLoginMode] = useState('email'); // 'email' or 'phone'
  const [otpSent, setOtpSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [rememberMe, setRememberMe] = useState(false);
  const { login, loading, isAuthenticated, message, setMessage } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (message && !loading) {
      const timer = setTimeout(() => setMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [message, loading, setMessage]);

  // Redirect based on role if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      const user = JSON.parse(localStorage.getItem('userInfo'));
      if (user?.role === 'seller') {
        navigate('/seller/dashboard');
      } else if (user?.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/customer/dashboard');
      }
    }
  }, [isAuthenticated, navigate]);

  // Setup reCAPTCHA when switching to phone mode
  useEffect(() => {
    if (loginMode === 'phone' && !window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: () => {
            console.log('reCAPTCHA solved');
          },
        });
      } catch (error) {
        console.error('reCAPTCHA setup error:', error);
      }
    }
  }, [loginMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loginMode === 'email') {
      const result = await login(email, password);
      if (!result.success) setMessage(result.message || 'Login failed.');
    } else {
      if (!otpSent) {
        // Send OTP via Firebase
        try {
          setMessage('');
          const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
          const appVerifier = window.recaptchaVerifier;
          const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
          setConfirmationResult(confirmation);
          setOtpSent(true);
          setMessage('OTP sent successfully!');
        } catch (error) {
          console.error('Error sending OTP:', error);
          setMessage(error.message || 'Failed to send OTP. Please try again.');
          // Reset reCAPTCHA
          if (window.recaptchaVerifier) {
            window.recaptchaVerifier.clear();
            window.recaptchaVerifier = null;
          }
        }
      } else {
        // Verify OTP and login
        try {
          setMessage('');
          const result = await confirmationResult.confirm(otp);
          const idToken = await result.user.getIdToken();

          // Call backend to exchange Firebase token for app JWT
          const { data } = await axios.post('/api/auth/phone-login', {
            idToken,
            phone: result.user.phoneNumber,
          });

          // Store user info and token
          localStorage.setItem('userInfo', JSON.stringify(data));
          localStorage.setItem('accessToken', data.accessToken);

          setMessage('Login successful!');

          // Redirect based on role
          if (data.role === 'seller') {
            navigate('/seller/dashboard');
          } else if (data.role === 'admin') {
            navigate('/admin/dashboard');
          } else if (data.role === 'deliveryPartner') {
            navigate('/delivery/dashboard');
          } else {
            navigate('/customer/dashboard');
          }
        } catch (error) {
          console.error('Error verifying OTP:', error);
          setMessage(error.response?.data?.message || 'Invalid OTP. Please try again.');
        }
      }
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Paper elevation={3} sx={{ p: 4, mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h4" gutterBottom>
          Sign in
        </Typography>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', width: '100%', mb: 2 }}>
          <Tabs value={loginMode} onChange={(e, val) => setLoginMode(val)} centered>
            <Tab label="Email" value="email" />
            <Tab label="Phone" value="phone" />
          </Tabs>
        </Box>

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
          {loginMode === 'email' ? (
            <>
              <TextField margin="normal" required fullWidth id="email" label="Email Address" name="email" autoComplete="email" autoFocus={loginMode === 'email'} value={email} onChange={(e) => setEmail(e.target.value)} />
              <TextField margin="normal" required fullWidth name="password" label="Password" type="password" id="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </>
          ) : (
            <>
              <TextField margin="normal" required fullWidth id="phone" label="Phone Number" name="phone" autoComplete="tel" autoFocus={loginMode === 'phone'} value={phone} onChange={(e) => setPhone(e.target.value)} disabled={otpSent} />
              {otpSent && (
                <TextField margin="normal" required fullWidth id="otp" label="Enter OTP" name="otp" value={otp} onChange={(e) => setOtp(e.target.value)} autoFocus />
              )}
            </>
          )}

          <FormControlLabel control={<Checkbox checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} color="primary" />} label="Remember Me" />

          <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }} disabled={loading}>
            {loading ? <CircularProgress size={24} /> : (loginMode === 'phone' && !otpSent ? 'Send OTP' : 'Sign In')}
          </Button>
          <Grid container>
            <Grid item xs>
              <Link to="/forgotpassword" variant="body2">
                Forgot password?
              </Link>
            </Grid>
            <Grid item>
              <Link to="/register" variant="body2">
                {"Don't have an account? Sign Up"}
              </Link>
            </Grid>
          </Grid>
          {message && <Alert severity={message.includes('success') || message.includes('Welcome') ? 'success' : 'error'} sx={{ mt: 2, width: '100%' }}>{message}</Alert>}
        </Box>
      </Paper>
      <div id="recaptcha-container"></div>
    </Container>
  );
};

export default LoginPage;