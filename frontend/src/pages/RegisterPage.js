import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, TextField, Button, Alert, CircularProgress, IconButton, InputAdornment, MenuItem, Grid, useMediaQuery
} from '@mui/material';
import { Close as CloseIcon, Visibility, VisibilityOff, PersonOutline, EmailOutlined, PhoneOutlined, LockOutlined, CardGiftcard } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const RegisterPage = () => {
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 900px)');
  const { register, loading, message, setMessage } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: '', role: 'customer', referralCode: '', sellerType: ''
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
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) { setMessage('Please enter a valid email address.'); return; }
    const phoneDigits = formData.phone.replace(/\D/g, '');
    if (!/^\d{10}$/.test(phoneDigits)) { setMessage('Please enter a valid 10-digit phone number.'); return; }
    if (formData.role === 'seller' && !formData.sellerType) { setMessage('Please select a Business Type.'); return; }

    const result = await register({ ...formData, phone: phoneDigits });
    if (!result.success) setMessage(result.message || 'Registration failed.');
  };

  const brandGradient = 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 50%, #4CAF50 100%)';

  const inputSx = {
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
          <Typography fontSize={64}>✨</Typography>
        </Box>
        <Typography variant="h2" fontWeight={800} gutterBottom sx={{ letterSpacing: '-0.03em' }}>
          Join the Community
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.8, fontSize: '18px', fontWeight: 500, mb: 8, maxWidth: 380, textAlign: 'center' }}>
          Create an account to track orders, save addresses, and earn referral rewards.
        </Typography>
      </Box>

      {/* Right side Form */}
      <Box sx={{ 
        width: { xs: '100%', md: '40%' }, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        p: { xs: 3, sm: 4, md: 6 } 
      }}>
        <Box sx={{ width: '100%', maxWidth: 460 }}>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h4" fontWeight={800} color="#111827" sx={{ letterSpacing: '-0.02em' }}>
                Create Account
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Join thousands exploring premium rice today
              </Typography>
            </Box>
            <IconButton onClick={() => navigate('/')} sx={{ bgcolor: '#F3F4F6', color: '#6B7280', '&:hover': { bgcolor: '#E5E7EB' } }}>
              <CloseIcon />
            </IconButton>
          </Box>

          <form onSubmit={handleSubmit} style={{ marginTop: '24px' }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField 
                  fullWidth 
                  required 
                  name="name" 
                  placeholder="Full Name" 
                  value={formData.name} 
                  onChange={handleChange} 
                  sx={inputSx}
                  InputProps={{ startAdornment: <InputAdornment position="start"><PersonOutline sx={{ color: '#9CA3AF' }} /></InputAdornment> }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField 
                  fullWidth 
                  required 
                  name="email" 
                  type="email" 
                  placeholder="Email Address" 
                  value={formData.email} 
                  onChange={handleChange} 
                  sx={inputSx}
                  InputProps={{ startAdornment: <InputAdornment position="start"><EmailOutlined sx={{ color: '#9CA3AF' }} /></InputAdornment> }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField 
                  fullWidth 
                  required 
                  name="phone" 
                  type="tel" 
                  placeholder="Phone Number" 
                  value={formData.phone} 
                  onChange={handleChange} 
                  sx={inputSx}
                  InputProps={{ 
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneOutlined sx={{ color: '#9CA3AF', mr: 0.5 }} />
                        <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary' }}>+91</Typography>
                      </InputAdornment>
                    ) 
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField 
                  fullWidth 
                  required 
                  name="password" 
                  type={showPassword ? 'text' : 'password'} 
                  placeholder="Password" 
                  value={formData.password} 
                  onChange={handleChange} 
                  sx={inputSx}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><LockOutlined sx={{ color: '#9CA3AF' }} /></InputAdornment>,
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword(!showPassword)} size="small" sx={{ color: '#9CA3AF' }}>
                          {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField 
                  fullWidth 
                  required 
                  name="confirmPassword" 
                  type={showConfirmPassword ? 'text' : 'password'} 
                  placeholder="Confirm Password" 
                  value={formData.confirmPassword} 
                  onChange={handleChange} 
                  sx={inputSx}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><LockOutlined sx={{ color: '#9CA3AF' }} /></InputAdornment>,
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} size="small" sx={{ color: '#9CA3AF' }}>
                          {showConfirmPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField 
                  fullWidth 
                  select 
                  required 
                  name="role" 
                  label="Account Type" 
                  value={formData.role} 
                  onChange={handleChange} 
                  sx={inputSx}
                >
                  <MenuItem value="customer">Customer</MenuItem>
                  <MenuItem value="seller">Seller / Partner</MenuItem>
                </TextField>
              </Grid>

              {formData.role === 'seller' && (
                <Grid item xs={12} sm={6}>
                  <TextField 
                    fullWidth 
                    select 
                    required 
                    name="sellerType" 
                    label="Business Type" 
                    value={formData.sellerType} 
                    onChange={handleChange} 
                    sx={inputSx}
                  >
                    <MenuItem value="Rice Shop">Rice Shop</MenuItem>
                    <MenuItem value="Rice Mill">Rice Mill</MenuItem>
                    <MenuItem value="Farmer Producer Organization (FPO)">Farmer Producer Organization (FPO)</MenuItem>
                    <MenuItem value="Wholesaler">Wholesaler</MenuItem>
                    <MenuItem value="Distributor">Distributor</MenuItem>
                    <MenuItem value="Farmer Cooperative">Farmer Cooperative</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </TextField>
                </Grid>
              )}
              
              <Grid item xs={12} sm={formData.role === 'seller' ? 12 : 6}>
                <TextField 
                  fullWidth 
                  name="referralCode" 
                  placeholder="Referral Code (Optional)" 
                  value={formData.referralCode} 
                  onChange={handleChange} 
                  sx={inputSx}
                  InputProps={{ startAdornment: <InputAdornment position="start"><CardGiftcard sx={{ color: '#E65100' }} /></InputAdornment> }}
                />
              </Grid>
            </Grid>

            {message && <Alert severity={message.toLowerCase().includes('success') ? 'success' : 'error'} sx={{ mt: 3, borderRadius: 3, fontWeight: 600 }}>{message}</Alert>}

            <Button 
              type="submit" 
              fullWidth 
              variant="contained" 
              disabled={loading}
              sx={{ 
                py: 1.8, mt: 4, mb: 3, bgcolor: '#2E7D32', color: '#fff', borderRadius: '50px', textTransform: 'none', fontSize: 16, fontWeight: 700, 
                boxShadow: '0 8px 24px rgba(46, 125, 50, 0.25)', 
                '&:hover': { bgcolor: '#1B5E20' }
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Create Account'}
            </Button>
          </form>

          <Typography variant="body2" textAlign="center" fontWeight={600} color="text.secondary">
            Already have an account? <span onClick={() => navigate('/login')} style={{ color: '#2E7D32', cursor: 'pointer', fontWeight: 700 }}>Log In</span>
          </Typography>
          
          <Typography variant="caption" display="block" textAlign="center" color="text.disabled" sx={{ mt: 5, fontWeight: 500 }}>
            By creating an account, you agree to our Terms of Service & Privacy Policy.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default RegisterPage;