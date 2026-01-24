import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Divider,
  Alert,
  CircularProgress,
  IconButton,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import {
  Google as GoogleIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { auth, db } from '../firebase';
import {
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

const LoginPage = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1: Email/Phone, 2: Password/OTP
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [isEmail, setIsEmail] = useState(true);
  const [rememberMe, setRememberMe] = useState(false);

  const [otpSent, setOtpSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Redirection is now handled centrally by AuthContext
  // This prevents race conditions where a user might be redirected 
  // before their role is securely hashed in MongoDB.

  const recaptchaRef = React.useRef(null);

  // Setup reCAPTCHA
  useEffect(() => {
    if (!recaptchaRef.current) {
      try {
        console.log('🛡️ Recaptcha: Initializing...');
        recaptchaRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: () => console.log('✅ reCAPTCHA solved'),
          'expired-callback': () => {
            console.log('⚠️ reCAPTCHA expired');
            if (recaptchaRef.current) recaptchaRef.current.clear();
            recaptchaRef.current = null;
          }
        });
      } catch (error) {
        console.error('❌ reCAPTCHA setup error:', error);
      }
    }

    return () => {
      // Don't clear on unmount as it might be needed for the async flow, 
      // but if the app is truly leaving the page, we might want cleanup.
    };
  }, []);

  // Manual role resolution is now handled by AuthContext listener
  // We just let the listener in AuthContext handle the sync and redirect

  const handleInitialContinue = () => {
    if (!emailOrPhone.trim()) {
      setMessage('Please enter your email or phone number');
      return;
    }

    // Check if it's email or phone
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isE = emailRegex.test(emailOrPhone);
    setIsEmail(isE);

    setStep(2);
    setMessage('');
  };

  const handleUseDifferentEmail = () => {
    setStep(1);
    setPassword('');
    setOtp('');
    setOtpSent(false);
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setMessage('');

      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      // Success! AuthContext will handle the redirect.

    } catch (error) {
      console.error('Google sign-in error:', error);
      if (error.code === 'auth/popup-blocked') {
        setMessage('Popup blocked. Please allow popups for this site.');
      } else if (error.code === 'auth/popup-closed-by-user') {
        setMessage('Sign-in cancelled.');
      } else {
        setMessage(error.message || 'Failed to sign in with Google');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFinalContinue = async () => {
    setLoading(true);
    setMessage('');

    try {
      if (isEmail) {
        // Email/Password login
        await signInWithEmailAndPassword(auth, emailOrPhone, password);
        // Success! AuthContext will handle the redirect.
      } else {
        // Phone OTP flow
        if (!otpSent) {
          const formattedPhone = emailOrPhone.startsWith('+') ? emailOrPhone : `+91${emailOrPhone}`;
          const appVerifier = recaptchaRef.current;

          if (!appVerifier) {
            throw new Error('reCAPTCHA not initialized. Please refresh.');
          }

          const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
          setConfirmationResult(confirmation);
          setOtpSent(true);
          setMessage('OTP sent successfully!');
        } else {
          await confirmationResult.confirm(otp);
          // Success! AuthContext will handle the redirect.
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      if (error.code === 'auth/billing-not-enabled') {
        setMessage('Phone authentication requires a paid plan. Please use Google or Email.');
      } else {
        setMessage(error.message || 'Authentication failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth={false} disableGutters sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f5f5f5',
      background: 'url("https://images.unsplash.com/photo-1586201375761-83865001e31c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80")', // Example rice background
      backgroundSize: 'cover'
    }}>
      <Paper elevation={3} sx={{
        p: 0,
        width: '100%',
        maxWidth: 450,
        borderRadius: 2,
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* Close Button */}
        <IconButton sx={{ position: 'absolute', right: 8, top: 8, color: '#333' }}>
          <CloseIcon />
        </IconButton>

        <Box sx={{ p: 4 }}>
          {step === 1 ? (
            <>
              <Typography variant="h6" sx={{
                mb: 3,
                fontWeight: 600,
                fontSize: '15px',
                letterSpacing: '0.1em',
                color: '#333'
              }}>
                SIGN IN / CREATE AN ACCOUNT
              </Typography>

              <Typography variant="body2" sx={{ mb: 4, color: '#666' }}>
                Enter your email or phone number to sign in or create a new account.
              </Typography>

              <Box sx={{ mb: 3 }}>
                <Typography variant="caption" sx={{ display: 'block', mb: 1, fontWeight: 500, color: '#333' }}>
                  Email or Phone Number <span style={{ color: 'red' }}>*</span>
                </Typography>
                <TextField
                  fullWidth
                  variant="outlined"
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  placeholder="name@email.com or 9876543210"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '0px',
                      height: '45px'
                    }
                  }}
                />
              </Box>

              <Button
                fullWidth
                variant="contained"
                onClick={handleInitialContinue}
                disabled={loading}
                sx={{
                  py: 1.5,
                  bgcolor: '#000',
                  color: '#fff',
                  borderRadius: '0px',
                  textTransform: 'none',
                  fontSize: '14px',
                  fontWeight: 600,
                  '&:hover': {
                    bgcolor: '#333'
                  },
                  mb: 4
                }}
              >
                CONTINUE
              </Button>

              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Divider sx={{ flex: 1 }} />
                <Typography sx={{ px: 2, color: '#ccc', fontSize: '12px' }}>OR</Typography>
                <Divider sx={{ flex: 1 }} />
              </Box>

              <Button
                fullWidth
                variant="outlined"
                onClick={handleGoogleSignIn}
                disabled={loading}
                startIcon={<img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: 18 }} />}
                sx={{
                  py: 1.5,
                  color: '#333',
                  borderColor: '#ddd',
                  borderRadius: '0px',
                  textTransform: 'none',
                  fontSize: '14px',
                  fontWeight: 400,
                  '&:hover': {
                    borderColor: '#999',
                    bgcolor: 'transparent'
                  },
                  mb: 3
                }}
              >
                Continue with google
              </Button>

              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Typography variant="body2" sx={{ color: '#666' }}>
                  New here? <a href="/register" onClick={(e) => { e.preventDefault(); navigate('/register'); }} style={{ color: '#000', fontWeight: 600, textDecoration: 'none' }}>Create an Account</a>
                </Typography>
              </Box>

              <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 4, color: '#999', fontSize: '10px' }}>
                By continuing, you agree to our <a href="#" style={{ color: '#999' }}>Terms of Service</a> and <a href="#" style={{ color: '#999' }}>Privacy Policy</a>
              </Typography>
            </>
          ) : (
            <>
              <Typography variant="h6" sx={{
                mb: 3,
                fontWeight: 600,
                fontSize: '15px',
                color: '#333'
              }}>
                SIGN IN
              </Typography>

              <Typography variant="body2" sx={{ mb: 4, color: '#666' }}>
                Please sign in with your {isEmail ? 'email and password' : 'OTP'}.
              </Typography>

              <Box sx={{ mb: 3 }}>
                <Typography variant="caption" sx={{ display: 'block', mb: 1, fontWeight: 500, color: '#333' }}>
                  {isEmail ? 'Email' : 'Phone'} <span style={{ color: 'red' }}>*</span>
                </Typography>
                <TextField
                  fullWidth
                  variant="outlined"
                  value={emailOrPhone}
                  disabled
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '0px',
                      height: '45px',
                      backgroundColor: '#f9f9f9'
                    }
                  }}
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" sx={{ display: 'block', mb: 1, fontWeight: 500, color: '#333' }}>
                  {isEmail ? 'Password' : 'Enter OTP'} <span style={{ color: 'red' }}>*</span>
                </Typography>
                <TextField
                  fullWidth
                  type={isEmail ? 'password' : 'text'}
                  variant="outlined"
                  value={isEmail ? password : otp}
                  onChange={(e) => isEmail ? setPassword(e.target.value) : setOtp(e.target.value)}
                  placeholder={isEmail ? 'Enter your password' : 'Enter 6-digit OTP'}
                  autoFocus
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '0px',
                      height: '45px'
                    }
                  }}
                />
              </Box>

              {isEmail && (
                <FormControlLabel
                  control={<Checkbox checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} color="primary" />}
                  label={<Typography variant="body2" sx={{ fontSize: '13px' }}>Remember me</Typography>}
                  sx={{ mb: 3 }}
                />
              )}

              <Button
                fullWidth
                variant="contained"
                onClick={handleFinalContinue}
                disabled={loading}
                sx={{
                  py: 1.5,
                  bgcolor: '#000',
                  color: '#fff',
                  borderRadius: '0px',
                  textTransform: 'none',
                  fontSize: '14px',
                  fontWeight: 600,
                  '&:hover': {
                    bgcolor: '#333'
                  },
                  mb: 2
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'CONTINUE'}
              </Button>

              <Button
                fullWidth
                variant="outlined"
                onClick={handleUseDifferentEmail}
                disabled={loading}
                sx={{
                  py: 1.5,
                  color: '#333',
                  borderColor: '#ddd',
                  borderRadius: '0px',
                  textTransform: 'none',
                  fontSize: '14px',
                  fontWeight: 400,
                  '&:hover': {
                    borderColor: '#999',
                    bgcolor: 'transparent'
                  }
                }}
              >
                USE A DIFFERENT EMAIL
              </Button>
            </>
          )}

          {message && (
            <Alert severity={message.includes('success') ? 'success' : 'error'} sx={{ mt: 3 }}>
              {message}
            </Alert>
          )}
        </Box>
      </Paper>
      <div id="recaptcha-container"></div>
    </Container>
  );
};

export default LoginPage;
