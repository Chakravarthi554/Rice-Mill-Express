import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Container, Box, Typography, TextField, Button, Divider, Alert, CircularProgress, IconButton, Checkbox, FormControlLabel, InputAdornment, useMediaQuery
} from '@mui/material';
import { Close as CloseIcon, Google as GoogleIcon, Visibility, VisibilityOff, EmailOutlined, LockOutlined, PhoneOutlined, ArrowBack } from '@mui/icons-material';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, signInWithPhoneNumber, RecaptchaVerifier, signInWithPopup, GoogleAuthProvider, FacebookAuthProvider, OAuthProvider } from 'firebase/auth';

const LoginPage = () => {
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 900px)');
  
  const [showSplash, setShowSplash] = useState(true);
  const [step, setStep] = useState(1);
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpArray, setOtpArray] = useState(['', '', '', '', '', '']);
  const [isEmail, setIsEmail] = useState(true);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [resendTimer, setResendTimer] = useState(30);

  const { userInfo, error: loginError } = useSelector((state) => state.userLogin || {});
  const recaptchaRef = useRef(null);

  // Splash Screen effect (mobile only)
  useEffect(() => {
    if (isMobile) {
      const timer = setTimeout(() => {
        setShowSplash(false);
      }, 1500);
      return () => clearTimeout(timer);
    } else {
      setShowSplash(false);
    }
  }, [isMobile]);

  // Sync Redux Errors
  useEffect(() => {
    if (loginError) {
      setMessage(loginError);
    }
  }, [loginError]);

  // OTP Countdown timer
  useEffect(() => {
    let interval = null;
    if (otpSent && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    } else if (resendTimer === 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [otpSent, resendTimer]);

  useEffect(() => {
    if (!window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible'
        });
        recaptchaRef.current = window.recaptchaVerifier;
        window.recaptchaVerifier.render().catch(err => {
          console.error('Recaptcha render error:', err);
        });
      } catch (error) {
        console.error("Recaptcha Initialization Error:", error);
      }
    } else {
      recaptchaRef.current = window.recaptchaVerifier;
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
      console.log('🔑 LoginPage: Initiating Google Sign-In popup...');
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('❌ LoginPage: Google Sign-in Error:', error);
      setMessage(error.message || 'Failed to sign in with Google');
    } finally { setLoading(false); }
  };

  const handleFacebookSignIn = async () => {
    try {
      setLoading(true); setMessage('');
      const provider = new FacebookAuthProvider();
      console.log('🔑 LoginPage: Initiating Facebook Sign-In popup...');
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('❌ LoginPage: Facebook Sign-in Error:', error);
      setMessage(error.message || 'Failed to sign in with Facebook');
    } finally { setLoading(false); }
  };

  const handleAppleSignIn = async () => {
    try {
      setLoading(true); setMessage('');
      const provider = new OAuthProvider('apple.com');
      console.log('🔑 LoginPage: Initiating Apple Sign-In popup...');
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('❌ LoginPage: Apple Sign-in Error:', error);
      setMessage(error.message || 'Failed to sign in with Apple');
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
          const confirmation = await signInWithPhoneNumber(auth, formattedPhone, recaptchaRef.current);
          setConfirmationResult(confirmation);
          setOtpSent(true); 
          setResendTimer(30);
          setMessage('OTP sent successfully!');
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

  const handleOtpBoxChange = (index, value) => {
    if (isNaN(Number(value))) return;
    const newOtpArray = [...otpArray];
    newOtpArray[index] = value.substring(value.length - 1);
    setOtpArray(newOtpArray);
    
    const newOtp = newOtpArray.join('');
    setOtp(newOtp);

    // Auto-focus next box
    if (value && index < 5) {
      const nextBox = document.getElementById(`otp-box-${index + 1}`);
      if (nextBox) nextBox.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpArray[index] && index > 0) {
      const prevBox = document.getElementById(`otp-box-${index - 1}`);
      if (prevBox) {
        prevBox.focus();
        const newOtpArray = [...otpArray];
        newOtpArray[index - 1] = '';
        setOtpArray(newOtpArray);
        setOtp(newOtpArray.join(''));
      }
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setLoading(true); setMessage('');
    try {
      const formattedPhone = emailOrPhone.startsWith('+') ? emailOrPhone : `+91${emailOrPhone}`;
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, recaptchaRef.current);
      setConfirmationResult(confirmation);
      setResendTimer(30);
      setMessage('OTP resent successfully!');
    } catch (error) {
      setMessage(error.message || 'Failed to resend OTP.');
    } finally { setLoading(false); }
  };

  // UI styling tokens matching PDF spec
  const brandGradient = 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 50%, #4CAF50 100%)';
  
  const inputSx = {
    mb: 2.5,
    '& .MuiOutlinedInput-root': {
      height: 56,
      borderRadius: '16px',
      bgcolor: '#F9FAFB',
      transition: 'all 0.2s',
      '& fieldset': { borderColor: '#E5E7EB', borderWidth: 1.5 },
      '&:hover fieldset': { borderColor: '#2E7D32' },
      '&.Mui-focused fieldset': { borderColor: '#2E7D32', borderWidth: 2 },
    }
  };

  // Render Mobile Splash Screen first
  if (showSplash && isMobile) {
    return (
      <Box sx={{
        minHeight: '100vh',
        background: brandGradient,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        p: 3,
        animation: 'fadeIn 0.5s ease-in-out'
      }}>
        <Box sx={{
          width: 120,
          height: 120,
          bgcolor: 'rgba(255,255,255,0.15)',
          borderRadius: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 4,
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          backdropFilter: 'blur(8px)'
        }}>
          <Typography fontSize={64}>🌱</Typography>
        </Box>
        <Typography variant="h3" fontWeight={800} gutterBottom sx={{ letterSpacing: '-0.03em' }}>
          Rice Mill Express
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.8, fontSize: '16px', fontWeight: 500, mb: 10 }}>
          Fresh from mill to your doorstep
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1.5, mt: 'auto', mb: 4 }}>
          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#fff' }} />
          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.4)' }} />
          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.4)' }} />
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', bgcolor: '#fff' }}>
      
      {/* Left side Image branding (60% split for desktop) */}
      <Box sx={{ 
        display: { xs: 'none', md: 'flex' }, 
        width: '60%', 
        background: brandGradient, 
        position: 'relative', 
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        p: 6,
        overflow: 'hidden'
      }}>
        <Box sx={{
          width: 120,
          height: 120,
          bgcolor: 'rgba(255,255,255,0.15)',
          borderRadius: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 4,
          boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
          backdropFilter: 'blur(8px)'
        }}>
          <Typography fontSize={64}>🌱</Typography>
        </Box>
        <Typography variant="h2" fontWeight={800} gutterBottom sx={{ letterSpacing: '-0.03em' }}>
          Rice Mill Express
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.8, fontSize: '18px', fontWeight: 500, mb: 8, maxWidth: 360, textAlign: 'center' }}>
          Fresh from mill to your doorstep
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1.5, position: 'absolute', bottom: 60 }}>
          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#fff' }} />
          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.4)' }} />
          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.4)' }} />
        </Box>
      </Box>

      {/* Right side Form (40% split on desktop, 100% on mobile) */}
      <Box sx={{ 
        width: { xs: '100%', md: '40%' }, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        p: { xs: 3, sm: 6, md: 8 } 
      }}>
        <Box sx={{ width: '100%', maxWidth: 400 }}>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Box>
              <Typography variant="h4" fontWeight={800} color="#111827" sx={{ letterSpacing: '-0.02em' }}>
                Welcome Back
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Sign in to continue
              </Typography>
            </Box>
            <IconButton onClick={() => navigate('/')} sx={{ bgcolor: '#F3F4F6', color: '#6B7280', '&:hover': { bgcolor: '#E5E7EB' } }}>
              <CloseIcon />
            </IconButton>
          </Box>

          {step === 1 ? (
            <Box>
              {/* Social Login Section */}
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mb: 4 }}>
                <IconButton onClick={handleGoogleSignIn} disabled={loading} sx={{
                  width: 48, height: 48, border: '1.5px solid #E5E7EB', bgcolor: '#fff',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  '&:hover': { bgcolor: '#F9FAFB', borderColor: '#2E7D32' }
                }}>
                  <GoogleIcon sx={{ color: '#EA4335', fontSize: 22 }} />
                </IconButton>

                <IconButton onClick={handleFacebookSignIn} disabled={loading} sx={{
                  width: 48, height: 48, border: '1.5px solid #E5E7EB', bgcolor: '#fff',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  '&:hover': { bgcolor: '#F9FAFB', borderColor: '#2E7D32' }
                }}>
                  <Typography variant="body1" fontWeight="bold" sx={{ color: '#1877F2', fontSize: 22, fontFamily: 'sans-serif' }}>f</Typography>
                </IconButton>

                <IconButton onClick={handleAppleSignIn} disabled={loading} sx={{
                  width: 48, height: 48, border: '1.5px solid #E5E7EB', bgcolor: '#fff',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  '&:hover': { bgcolor: '#F9FAFB', borderColor: '#2E7D32' }
                }}>
                  <Typography variant="body1" fontWeight="bold" sx={{ color: '#000000', fontSize: 22, fontFamily: 'sans-serif' }}></Typography>
                </IconButton>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, opacity: 0.6 }}>
                <Divider sx={{ flex: 1 }} />
                <Typography sx={{ px: 2, fontSize: 13, fontWeight: 700, color: 'text.secondary' }}>OR</Typography>
                <Divider sx={{ flex: 1 }} />
              </Box>

              <TextField 
                fullWidth 
                placeholder="Email or Phone Number" 
                value={emailOrPhone} 
                onChange={(e) => setEmailOrPhone(e.target.value)} 
                sx={inputSx}
                InputProps={{ 
                  startAdornment: (
                    <InputAdornment position="start">
                      {emailOrPhone && /^\d+$/.test(emailOrPhone.trim()) ? (
                        <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary', mr: 0.5 }}>IN +91</Typography>
                      ) : (
                        <EmailOutlined sx={{ color: '#9CA3AF' }} />
                      )}
                    </InputAdornment> 
                  ) 
                }}
              />

              <Button 
                fullWidth 
                variant="contained" 
                onClick={handleInitialContinue} 
                disabled={loading}
                sx={{ 
                  height: 52, bgcolor: '#2E7D32', color: '#fff', borderRadius: '50px', textTransform: 'none', fontSize: 16, fontWeight: 700, 
                  boxShadow: '0 8px 24px rgba(46, 125, 50, 0.25)', 
                  '&:hover': { bgcolor: '#1B5E20', boxShadow: '0 12px 28px rgba(46, 125, 50, 0.35)' }, mb: 4 
                }}
              >
                Continue
              </Button>

              <Typography variant="body2" textAlign="center" fontWeight={600} color="text.secondary">
                Don't have an account? <span onClick={() => navigate('/register')} style={{ color: '#E65100', cursor: 'pointer', fontWeight: 700 }}>Sign up</span>
              </Typography>
            </Box>
          ) : (
            <Box>
              <IconButton onClick={() => { setStep(1); setOtpSent(false); }} sx={{ mb: 2, p: 0, color: 'text.secondary' }}>
                <ArrowBack fontSize="small" /> <Typography variant="caption" sx={{ ml: 0.5, fontWeight: 700 }}>Back</Typography>
              </IconButton>
              
              <Typography variant="body1" color="text.secondary" mb={3}>
                Please enter your {isEmail ? 'password' : 'OTP'} for <strong style={{ color: '#111827' }}>{emailOrPhone}</strong>.
              </Typography>

              {isEmail ? (
                <TextField 
                  fullWidth 
                  type={showPassword ? 'text' : 'password'} 
                  placeholder="Password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  sx={inputSx}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><LockOutlined sx={{ color: '#9CA3AF' }} /></InputAdornment>,
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small" sx={{ color: '#9CA3AF' }}>
                          {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              ) : (
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700 }}>Enter OTP</Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                    {otpArray.map((digit, index) => (
                      <input
                        key={index}
                        id={`otp-box-${index}`}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpBoxChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        style={{
                          width: 48,
                          height: 56,
                          textAlign: 'center',
                          fontSize: '20px',
                          fontWeight: '700',
                          borderRadius: '12px',
                          border: '1.5px solid #E5E7EB',
                          backgroundColor: '#F9FAFB',
                          outline: 'none',
                          transition: 'border-color 0.2s'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#2E7D32'}
                        onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                      />
                    ))}
                  </Box>
                </Box>
              )}

              {isEmail ? (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <FormControlLabel 
                    control={<Checkbox size="small" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} sx={{ color: '#D1D5DB', '&.Mui-checked': { color: '#2E7D32' } }} />} 
                    label={<Typography variant="body2" color="text.secondary" fontWeight={600}>Remember me</Typography>} 
                  />
                  <Typography variant="body2" color="#E65100" fontWeight={700} sx={{ cursor: 'pointer' }} onClick={() => navigate('/forgotpassword')}>
                    Forgot Password?
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="body2" color="text.secondary" fontWeight={600}>
                    {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : "Didn't receive OTP?"}
                  </Typography>
                  <Button 
                    disabled={resendTimer > 0} 
                    onClick={handleResendOtp}
                    sx={{ color: '#2E7D32', fontWeight: 700, textTransform: 'none', p: 0 }}
                  >
                    Resend
                  </Button>
                </Box>
              )}

              <Button 
                fullWidth 
                variant="contained" 
                onClick={handleFinalContinue} 
                disabled={loading}
                sx={{ 
                  height: 52, bgcolor: '#2E7D32', color: '#fff', borderRadius: '50px', textTransform: 'none', fontSize: 16, fontWeight: 700, 
                  boxShadow: '0 8px 24px rgba(46, 125, 50, 0.25)',
                  '&:hover': { bgcolor: '#1B5E20' } 
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : (isEmail ? 'Log In' : 'Verify')}
              </Button>
            </Box>
          )}

          {message && <Alert severity={message.includes('success') ? 'success' : 'error'} sx={{ mt: 3, borderRadius: 3, fontWeight: 600 }}>{message}</Alert>}

          <Typography variant="caption" display="block" textAlign="center" color="text.disabled" sx={{ mt: 6, fontWeight: 500 }}>
            By continuing, you agree to our Terms of Service & Privacy Policy.
          </Typography>
        </Box>
      </Box>
      <div id="recaptcha-container"></div>
    </Box>
  );
};

export default LoginPage;
