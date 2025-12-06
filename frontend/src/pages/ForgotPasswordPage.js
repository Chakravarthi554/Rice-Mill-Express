// frontend/src/pages/ForgotPasswordPage.js (NEW FILE)
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Container, Typography, Box, TextField, Button, CircularProgress, Paper, Alert } from '@mui/material';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../redux/actions/userActions';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const dispatch = useDispatch();

  const { loading, error, success, message } = useSelector((state) => state.userForgotPassword);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(forgotPassword(email));
  };

  return (
    <Container component="main" maxWidth="xs">
      <Paper elevation={3} sx={{ p: 4, mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h4" gutterBottom>
          Forgot Password
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 2 }}>
          Enter your email address and we'll send you a link to reset your password.
        </Typography>

        {error && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ width: '100%', mb: 2 }}>{message}</Alert>}

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={success} // Disable field after success
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading || success} // Disable button during load or after success
          >
            {loading ? <CircularProgress size={24} /> : 'Send Reset Link'}
          </Button>
          <Typography variant="body2" align="center">
            Remember your password? <Link to="/login">Sign In</Link>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default ForgotPasswordPage;