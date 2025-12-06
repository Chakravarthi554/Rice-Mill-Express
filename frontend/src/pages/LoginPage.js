import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, TextField, Button, CircularProgress, Paper, Alert, FormControlLabel, Checkbox, Grid } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const [email, setEmail] = useState('admin@ricemill.com');
  const [password, setPassword] = useState('adminpass123');
  const [rememberMe, setRememberMe] = useState(false);
  const { login, loading, isAuthenticated, message, setMessage } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (message && !loading) {
      const timer = setTimeout(() => setMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [message, loading, setMessage]);

   // Redirect if already logged in
   useEffect(() => {
    if (isAuthenticated) {
        navigate('/customer/dashboard');
    }
   }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(email, password);
    if (!result.success) setMessage(result.message || 'Login failed.');
  };

  return (
    <Container component="main" maxWidth="xs">
      <Paper elevation={3} sx={{ p: 4, mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h4" gutterBottom>
          Sign in
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
          <TextField margin="normal" required fullWidth id="email" label="Email Address" name="email" autoComplete="email" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} />
          <TextField margin="normal" required fullWidth name="password" label="Password" type="password" id="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <FormControlLabel control={<Checkbox checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} color="primary" />} label="Remember Me" />
          <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }} disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Sign In'}
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
    </Container>
  );
};

export default LoginPage;