import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box, Typography, Paper, TextField, Button,
  CircularProgress, Alert, IconButton, InputAdornment, Divider
} from '@mui/material';
import { Visibility, VisibilityOff, Lock } from '@mui/icons-material';
import { changeUserPassword, logoutUser } from '../../redux/actions/userActions';
import { USER_CHANGE_PASSWORD_RESET } from '../../redux/constants/userConstants';

const SecuritySettings = () => {
  const dispatch = useDispatch();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [localMessage, setLocalMessage] = useState(null);

  const { loading, error, success, message } = useSelector((state) => state.userChangePassword);

  useEffect(() => {
    if (success) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      if (message && message.includes('Please login again')) {
        setLocalMessage({ type: 'success', text: message });
        setTimeout(() => {
          dispatch(logoutUser());
          window.location.href = '/login';
        }, 3000);
      } else {
        setLocalMessage({ type: 'success', text: 'Password changed successfully!' });
      }
    } else if (error) {
      setLocalMessage({ type: 'error', text: error });
    }
  }, [success, error, message, dispatch]);

  useEffect(() => {
    return () => {
      dispatch({ type: USER_CHANGE_PASSWORD_RESET });
    };
  }, [dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLocalMessage(null);
    dispatch({ type: USER_CHANGE_PASSWORD_RESET });

    if (newPassword !== confirmPassword) {
      setLocalMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    if (newPassword.length < 8) {
      setLocalMessage({ type: 'error', text: 'New password must be at least 8 characters long.' });
      return;
    }

    dispatch(changeUserPassword(currentPassword, newPassword));
  };

  const handleClickShowPassword = (setter) => () => setter(prev => !prev);

  return (
    <Box sx={{ maxWidth: 600 }}>
      <Paper sx={{ p: 3, borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.04)', bgcolor: '#F0FDF4', border: '1px solid #BBF7D0' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
          <Lock sx={{ color: '#16A34A', fontSize: 24 }} />
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#111827' }}>
            Login & Security
          </Typography>
        </Box>
        <Divider sx={{ mb: 2.5 }} />

        <Box component="form" onSubmit={handleSubmit}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#374151', mb: 2 }}>
            Change Password
          </Typography>

          {localMessage && (
            <Alert severity={localMessage.type} sx={{ mb: 2, borderRadius: 3 }}>
              {localMessage.text}
            </Alert>
          )}

          <TextField
            type={showCurrent ? 'text' : 'password'}
            label="Current Password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            fullWidth
            required
            sx={{ mb: 2.5 }}
            InputProps={{
              sx: { borderRadius: 3, bgcolor: '#F9FAFB' },
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={handleClickShowPassword(setShowCurrent)} edge="end">
                    {showCurrent ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <TextField
            type={showNew ? 'text' : 'password'}
            label="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            fullWidth
            required
            sx={{ mb: 2.5 }}
            InputProps={{
              sx: { borderRadius: 3, bgcolor: '#F9FAFB' },
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={handleClickShowPassword(setShowNew)} edge="end">
                    {showNew ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <TextField
            type={showConfirm ? 'text' : 'password'}
            label="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            fullWidth
            required
            sx={{ mb: 3 }}
            InputProps={{
              sx: { borderRadius: 3, bgcolor: '#F9FAFB' },
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={handleClickShowPassword(setShowConfirm)} edge="end">
                    {showConfirm ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2, borderTop: '1px solid #F3F4F6' }}>
            <Button
              type="submit"
              variant="contained"
              color="success"
              disabled={loading}
              startIcon={<Lock />}
              sx={{ borderRadius: 3, px: 5, py: 1.2, fontWeight: 700 }}
            >
              {loading ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : 'Save Changes'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default SecuritySettings;
