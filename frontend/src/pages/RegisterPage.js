import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Box, TextField, Button, CircularProgress, Paper, FormControl,
  InputLabel, Select, MenuItem, Alert
} from '@mui/material';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('customer');
  const [referralCode, setReferralCode] = useState('');
  const { register, loading, isAuthenticated, message, setMessage } = useAuth();

  useEffect(() => {
    if (message && !loading) {
      const timer = setTimeout(() => setMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [message, loading, setMessage]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }
    // Validate phone as 10 digits
    const phoneDigits = phone.replace(/\D/g, ''); // Remove non-digits
    if (!/^\d{10}$/.test(phoneDigits)) {
      setMessage('Please enter a valid 10-digit phone number.');
      return;
    }

    const result = await register({ name, email, phone: phoneDigits, password, role, referralCode });
    if (!result.success) setMessage(result.message || 'Registration failed.');
  };

  return (
    <Container maxWidth="xs">
      <Paper elevation={3} sx={{ p: 4, mt: 8 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Register
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          <TextField margin="normal" required fullWidth id="name" label="Full Name" name="name" autoComplete="name" autoFocus value={name} onChange={(e) => setName(e.target.value)} />
          <TextField margin="normal" required fullWidth id="email" label="Email Address" name="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <TextField margin="normal" required fullWidth id="phone" label="Phone Number" name="phone" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <TextField margin="normal" required fullWidth name="password" label="Password" type="password" id="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <TextField margin="normal" required fullWidth name="confirmPassword" label="Confirm Password" type="password" id="confirmPassword" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          <FormControl fullWidth margin="normal">
            <InputLabel id="role-select-label">Register As</InputLabel>
            <Select labelId="role-select-label" id="role-select" value={role} label="Register As" onChange={(e) => setRole(e.target.value)}>
              <MenuItem value="customer">Customer</MenuItem>
              <MenuItem value="seller">Seller</MenuItem>
            </Select>
          </FormControl>
          <TextField
            margin="normal"
            fullWidth
            id="referralCode"
            label="Referral Code (Optional)"
            name="referralCode"
            value={referralCode}
            onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
          />
          <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }} disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Register'}
          </Button>
          <Typography variant="body2" align="center">
            Already have an account? <Link to="/login">Login</Link>
          </Typography>
          {message && <Alert severity={message.includes('success') || message.includes('Welcome') ? 'success' : 'error'} sx={{ mt: 2 }}>{message}</Alert>}
        </Box>
      </Paper>
    </Container>
  );
};

export default RegisterPage;