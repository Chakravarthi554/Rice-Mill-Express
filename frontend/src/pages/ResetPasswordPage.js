// frontend/src/pages/ResetPasswordPage.js (NEW FILE)
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Container, Typography, Box, TextField, Button, CircularProgress, Paper, Alert, IconButton, InputAdornment } from '@mui/material';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { resetPassword } from '../redux/actions/userActions';

const ResetPasswordPage = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [localError, setLocalError] = useState('');

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { token } = useParams(); // Get token from URL

  const { loading, error, success, message } = useSelector((state) => state.userResetPassword);

  useEffect(() => {
    if (success) {
      // Optionally redirect after a delay
       const timer = setTimeout(() => {
           navigate('/login');
       }, 3000); // Redirect after 3 seconds
       return () => clearTimeout(timer);
    }
  }, [success, navigate]);

   const handleClickShowPassword = (setter) => () => {
    setter(prev => !prev);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLocalError('');
    if (!token) {
        setLocalError('Reset token is missing from the URL.');
        return;
    }
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }
     if (password.length < 8) {
       setLocalError('Password must be at least 8 characters long.');
      return;
    }
    dispatch(resetPassword(token, password));
  };

  return (
    <Container component="main" maxWidth="xs">
      <Paper elevation={3} sx={{ p: 4, mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h4" gutterBottom>
          Reset Password
        </Typography>

        {localError && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{localError}</Alert>}
        {error && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ width: '100%', mb: 2 }}>{message}. Redirecting to login...</Alert>}

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="New Password"
            type={showPassword ? 'text' : 'password'}
            id="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={success}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={handleClickShowPassword(setShowPassword)} edge="end">
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="confirmPassword"
            label="Confirm New Password"
            type={showConfirm ? 'text' : 'password'}
            id="confirmPassword"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={success}
             InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={handleClickShowPassword(setShowConfirm)} edge="end">
                    {showConfirm ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading || success}
          >
            {loading ? <CircularProgress size={24} /> : 'Reset Password'}
          </Button>
           {success && (
                <Typography variant="body2" align="center">
                    <Link to="/login">Go to Login</Link>
                </Typography>
           )}
        </Box>
      </Paper>
    </Container>
  );
};

export default ResetPasswordPage;