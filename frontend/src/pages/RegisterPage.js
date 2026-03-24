// [AI: Premium UI Polish - Rounded inputs, pill buttons, high-contrast branding]
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, TextField, Button, Alert, CircularProgress, IconButton, InputAdornment, MenuItem, Grid
} from '@mui/material';
import { Close as CloseIcon, Visibility, VisibilityOff, PersonOutline, EmailOutlined, PhoneOutlined, LockOutlined, CardGiftcard } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, loading, message, setMessage } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: '', role: 'customer', referralCode: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (message && !loading) {
      const timer = setTimeout(() => setMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [message, loading, setMessage]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) { setMessage('Passwords do not match.'); return; }
    
    const phoneDigits = formData.phone.replace(/\D/g, '');
    if (!/^\d{10}$/.test(phoneDigits)) { setMessage('Please enter a valid 10-digit phone number.'); return; }

    const result = await register({ ...formData, phone: phoneDigits });
    if (!result.success) setMessage(result.message || 'Registration failed.');
  };

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
      <Box sx={{ display: { xs: 'none', md: 'flex' }, flex: 1, position: 'relative', bgcolor: '#F97316', overflow: 'hidden' }}>
        <img src="https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=1350&q=80" alt="Authentic Food" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.35 }} />
        <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(249,115,22,0.9), transparent)' }} />
        <Box sx={{ position: 'absolute', bottom: 60, left: 60, color: '#fff', pr: 4 }}>
          <Box sx={{ width: 48, height: 48, bgcolor: '#fff', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
            <Typography fontSize={24}>✨</Typography>
          </Box>
          <Typography variant="h3" fontWeight={800} gutterBottom lineHeight={1.2}>Join the<br />Community.</Typography>
          <Typography variant="body1" sx={{ opacity: 0.9, maxWidth: 400 }}>Create an account to track orders, save multiple addresses, and earn amazing referral rewards.</Typography>
        </Box>
      </Box>

      {/* Right side Form */}
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: { xs: 3, sm: 4, md: 6 } }}>
        <Box sx={{ width: '100%', maxWidth: 460 }}>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Typography variant="h4" fontWeight={800} color="#111827">Create Account</Typography>
            <IconButton onClick={() => navigate('/')} sx={{ bgcolor: '#F3F4F6', color: '#6B7280', '&:hover': { bgcolor: '#E5E7EB' } }}><CloseIcon /></IconButton>
          </Box>

          <Typography variant="body1" color="text.secondary" mb={4}>Join thousands exploring premium rice today.</Typography>

          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField fullWidth required name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} sx={inputSx}
                  InputProps={{ startAdornment: <InputAdornment position="start"><PersonOutline sx={{ color: '#9CA3AF' }} /></InputAdornment> }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth required name="email" type="email" placeholder="Email Address" value={formData.email} onChange={handleChange} sx={inputSx}
                  InputProps={{ startAdornment: <InputAdornment position="start"><EmailOutlined sx={{ color: '#9CA3AF' }} /></InputAdornment> }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth required name="phone" type="tel" placeholder="Phone Number" value={formData.phone} onChange={handleChange} sx={inputSx}
                  InputProps={{ startAdornment: <InputAdornment position="start"><PhoneOutlined sx={{ color: '#9CA3AF' }} /></InputAdornment> }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField fullWidth required name="password" type={showPassword ? 'text' : 'password'} placeholder="Password" value={formData.password} onChange={handleChange} sx={inputSx}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><LockOutlined sx={{ color: '#9CA3AF' }} /></InputAdornment>,
                    endAdornment: <InputAdornment position="end"><IconButton onClick={() => setShowPassword(!showPassword)} size="small" sx={{ color: '#9CA3AF' }}>{showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}</IconButton></InputAdornment>
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth required name="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} placeholder="Confirm Password" value={formData.confirmPassword} onChange={handleChange} sx={inputSx}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><LockOutlined sx={{ color: '#9CA3AF' }} /></InputAdornment>,
                    endAdornment: <InputAdornment position="end"><IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} size="small" sx={{ color: '#9CA3AF' }}>{showConfirmPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}</IconButton></InputAdornment>
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField fullWidth select required name="role" label="Account Type" value={formData.role} onChange={handleChange} sx={inputSx}>
                  <MenuItem value="customer">Customer</MenuItem>
                  <MenuItem value="seller">Seller / Partner</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth name="referralCode" placeholder="Referral Code (Optional)" value={formData.referralCode} onChange={handleChange} sx={inputSx}
                  InputProps={{ startAdornment: <InputAdornment position="start"><CardGiftcard sx={{ color: '#F97316' }} /></InputAdornment> }}
                />
              </Grid>
            </Grid>

            {message && <Alert severity={message.includes('failed') ? 'error' : 'success'} sx={{ mt: 3, borderRadius: 3, fontWeight: 500 }}>{message}</Alert>}

            <Button type="submit" fullWidth variant="contained" disabled={loading}
              sx={{ py: 1.8, mt: 4, mb: 3, bgcolor: '#16A34A', color: '#fff', borderRadius: '50px', textTransform: 'none', fontSize: 16, fontWeight: 700, boxShadow: '0 8px 16px -4px rgba(22, 163, 74, 0.3)', '&:hover': { bgcolor: '#15803D' }}}>
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Create Account'}
            </Button>
          </form>

          <Typography variant="body2" textAlign="center" fontWeight={500} color="text.secondary">
            Already have an account? <span onClick={() => navigate('/login')} style={{ color: '#16A34A', cursor: 'pointer', fontWeight: 700 }}>Log In</span>
          </Typography>
          
          <Typography variant="caption" display="block" textAlign="center" color="text.disabled" sx={{ mt: 5 }}>
            By creating an account, you agree to our Terms of Service & Privacy Policy.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default RegisterPage;