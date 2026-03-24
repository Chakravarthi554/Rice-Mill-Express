// [AI: Premium UI Polish - Rounded inputs, pill buttons, high-contrast branding]
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Box, Typography, TextField, Button, Paper, Divider, Alert, CircularProgress, IconButton, Checkbox, FormControlLabel, InputAdornment
} from '@mui/material';
import { Close as CloseIcon, Google as GoogleIcon, Visibility, VisibilityOff, EmailOutlined, LockOutlined, PhoneOutlined } from '@mui/icons-material';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, signInWithPhoneNumber, RecaptchaVerifier, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

const LoginPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [isEmail, setIsEmail] = useState(true);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const recaptchaRef = React.useRef(null);

  useEffect(() => {
    if (!recaptchaRef.current) {
      try { recaptchaRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' }); } catch (error) {}
    }
  }, []);

  const handleInitialContinue = () => {
    if (!emailOrPhone.trim()) { setMessage('Please enter your email or phone number'); return; }
    const isE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailOrPhone.trim());
    setIsEmail(isE);
    setStep(2); setMessage('');
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true); setMessage('');
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      const response = await fetch(`${API_BASE_URL}/api/auth/google-login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken })
      });
      if (!response.ok) throw new Error((await response.json()).message || 'Google sign-in failed');
    } catch (error) {
      setMessage(error.message || 'Failed to sign in with Google');
    } finally { setLoading(false); }
  };

  const handleFinalContinue = async () => {
    setLoading(true); setMessage('');
    try {
      if (isEmail) {
        await signInWithEmailAndPassword(auth, emailOrPhone, password);
      } else {
        if (!otpSent) {
          const formattedPhone = emailOrPhone.startsWith('+') ? emailOrPhone : `+91${emailOrPhone}`;
          setConfirmationResult(await signInWithPhoneNumber(auth, formattedPhone, recaptchaRef.current));
          setOtpSent(true); setMessage('OTP sent successfully!');
        } else {
          await confirmationResult.confirm(otp);
        }
      }
    } catch (error) {
      let errorMessage = 'Authentication failed. Please try again.';
      if (error.code === 'auth/user-not-found') errorMessage = 'No account found. Please register.';
      else if (error.code === 'auth/wrong-password') errorMessage = 'Incorrect password.';
      else if (error.message) errorMessage = error.message;
      setMessage(errorMessage);
    } finally { setLoading(false); }
  };

  // UI Styles
  const inputSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '16px', bgcolor: '#F9FAFB', transition: 'all 0.2s',
      '& fieldset': { borderColor: '#E5E7EB', borderWidth: 1 },
      '&:hover fieldset': { borderColor: '#16A34A' },
      '&.Mui-focused fieldset': { borderColor: '#16A34A', borderWidth: 2 },
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', bgcolor: '#fff' }}>
      {/* Left side Image branding */}
      <Box sx={{ display: { xs: 'none', md: 'flex' }, flex: 1, position: 'relative', bgcolor: '#0D9488', overflow: 'hidden' }}>
        <img src="https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=1350&q=80" alt="Rice Fields" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.4 }} />
        <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(13,148,136,0.9), transparent)' }} />
        <Box sx={{ position: 'absolute', bottom: 60, left: 60, color: '#fff', pr: 4 }}>
          <Box sx={{ width: 48, height: 48, bgcolor: '#fff', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
            <Typography fontSize={24}>🌾</Typography>
          </Box>
          <Typography variant="h3" fontWeight={800} gutterBottom lineHeight={1.2}>Fresh Rice,<br />Delivered Fast.</Typography>
          <Typography variant="body1" sx={{ opacity: 0.8, maxWidth: 400 }}>Experience premium quality grains sourced directly from local farmers, delivered to your doorstep.</Typography>
        </Box>
      </Box>

      {/* Right side Form */}
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: { xs: 3, sm: 6, md: 8 } }}>
        <Box sx={{ width: '100%', maxWidth: 420 }}>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 5 }}>
            <Typography variant="h4" fontWeight={800} color="#111827">Welcome Back</Typography>
            <IconButton onClick={() => navigate('/')} sx={{ bgcolor: '#F3F4F6', color: '#6B7280', '&:hover': { bgcolor: '#E5E7EB' } }}><CloseIcon /></IconButton>
          </Box>

          {step === 1 ? (
            <Box>
              <Typography variant="body1" color="text.secondary" mb={4}>Enter your email or phone to continue.</Typography>
              
              <TextField fullWidth placeholder="Email or Phone Number" value={emailOrPhone} onChange={(e) => setEmailOrPhone(e.target.value)} sx={{ ...inputSx, mb: 3 }}
                InputProps={{ startAdornment: <InputAdornment position="start"><EmailOutlined sx={{ color: '#9CA3AF' }} /></InputAdornment> }}
              />
              
              <Button fullWidth variant="contained" onClick={handleInitialContinue} disabled={loading}
                sx={{ py: 1.8, bgcolor: '#16A34A', color: '#fff', borderRadius: '50px', textTransform: 'none', fontSize: 16, fontWeight: 700, boxShadow: '0 8px 16px -4px rgba(22, 163, 74, 0.3)', '&:hover': { bgcolor: '#15803D', boxShadow: '0 12px 20px -4px rgba(22, 163, 74, 0.4)' }, mb: 4 }}>
                Continue
              </Button>

              <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, opacity: 0.6 }}>
                <Divider sx={{ flex: 1 }} />
                <Typography sx={{ px: 2, fontSize: 13, fontWeight: 600 }}>OR</Typography>
                <Divider sx={{ flex: 1 }} />
              </Box>

              <Button fullWidth variant="outlined" onClick={handleGoogleSignIn} disabled={loading} startIcon={<GoogleIcon sx={{ color: '#EA4335' }} />}
                sx={{ py: 1.5, borderRadius: '50px', color: '#374151', borderColor: '#E5E7EB', textTransform: 'none', fontSize: 15, fontWeight: 600, '&:hover': { bgcolor: '#F9FAFB', borderColor: '#D1D5DB' }, mb: 4 }}>
                Continue with Google
              </Button>

              <Typography variant="body2" textAlign="center" fontWeight={500} color="text.secondary">
                Don't have an account? <span onClick={() => navigate('/register')} style={{ color: '#F97316', cursor: 'pointer', fontWeight: 700 }}>Sign up</span>
              </Typography>
            </Box>
          ) : (
            <Box>
              <Typography variant="body1" color="text.secondary" mb={4}>
                Please enter your {isEmail ? 'password' : 'OTP'} for <strong style={{ color: '#111827' }}>{emailOrPhone}</strong>.
              </Typography>
              
              <TextField fullWidth type={isEmail && !showPassword ? 'password' : 'text'} placeholder={isEmail ? 'Password' : 'Enter 6-digit OTP'} value={isEmail ? password : otp} onChange={(e) => isEmail ? setPassword(e.target.value) : setOtp(e.target.value)} sx={{ ...inputSx, mb: 1.5 }}
                InputProps={{
                  startAdornment: <InputAdornment position="start">{isEmail ? <LockOutlined sx={{ color: '#9CA3AF' }} /> : <PhoneOutlined sx={{ color: '#9CA3AF' }} />}</InputAdornment>,
                  endAdornment: isEmail && (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small" sx={{ color: '#9CA3AF' }}>{showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}</IconButton>
                    </InputAdornment>
                  )
                }}
              />

              {isEmail && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <FormControlLabel control={<Checkbox size="small" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} sx={{ color: '#D1D5DB', '&.Mui-checked': { color: '#16A34A' } }} />} label={<Typography variant="body2" color="text.secondary" fontWeight={500}>Remember me</Typography>} />
                  <Typography variant="body2" color="#F97316" fontWeight={600} sx={{ cursor: 'pointer' }}>Forgot Password?</Typography>
                </Box>
              )}

              <Button fullWidth variant="contained" onClick={handleFinalContinue} disabled={loading}
                sx={{ py: 1.8, bgcolor: '#16A34A', color: '#fff', borderRadius: '50px', textTransform: 'none', fontSize: 16, fontWeight: 700, mt: isEmail ? 1 : 2, mb: 2, boxShadow: '0 8px 16px -4px rgba(22, 163, 74, 0.3)', '&:hover': { bgcolor: '#15803D' }}}>
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Log In'}
              </Button>

              <Button fullWidth onClick={() => { setStep(1); setPassword(''); setOtp(''); }} sx={{ color: '#6B7280', textTransform: 'none', fontWeight: 600, py: 1 }}>
                Use a different account
              </Button>
            </Box>
          )}

          {message && <Alert severity={message.includes('success') ? 'success' : 'error'} sx={{ mt: 3, borderRadius: 3, fontWeight: 500 }}>{message}</Alert>}
          
          <Typography variant="caption" display="block" textAlign="center" color="text.disabled" sx={{ mt: 6 }}>
            By continuing, you agree to our Terms of Service & Privacy Policy.
          </Typography>
        </Box>
      </Box>
      <div id="recaptcha-container"></div>
    </Box>
  );
};

export default LoginPage;
