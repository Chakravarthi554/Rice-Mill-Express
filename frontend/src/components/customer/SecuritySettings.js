/*
* FILE: frontend/src/components/customer/SecuritySettings.js (NEW FILE)
* - This is the file you are missing.
* - This component renders the "Change Password" form.
* - It connects to the 'userChangePassword' Redux state for loading/error/success.
* - It dispatches the 'changeUserPassword' action.
*/

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  CircularProgress,
  Alert,
  IconButton,
  InputAdornment
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { changeUserPassword } from '../../redux/actions/userActions';
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

  const { loading, error, success } = useSelector((state) => state.userChangePassword);

  useEffect(() => {
    if (success) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setLocalMessage({ type: 'success', text: 'Password changed successfully!' });
    }
  }, [success]);

  // Clear state on component unmount
  useEffect(() => {
    return () => {
      dispatch({ type: USER_CHANGE_PASSWORD_RESET });
    };
  }, [dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLocalMessage(null); // Clear previous local messages
    dispatch({ type: USER_CHANGE_PASSWORD_RESET }); // Clear previous Redux errors

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
  
  const handleClickShowPassword = (setter) => () => {
    setter(prev => !prev);
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 600 }}>
      <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
        Login & Security
      </Typography>

      <Box component="form" onSubmit={handleSubmit}>
        <Typography variant="h6" gutterBottom>
          Change Password
        </Typography>

        {/* --- FEEDBACK MESSAGES --- */}
        {localMessage && <Alert severity={localMessage.type} sx={{ mb: 2 }}>{localMessage.text}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <TextField
          type={showCurrent ? 'text' : 'password'}
          label="Current Password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          fullWidth
          required
          sx={{ mb: 2 }}
          InputProps={{
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
          sx={{ mb: 2 }}
          InputProps={{
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
          sx={{ mb: 2 }}
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

        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', position: 'relative' }}>
          <Button type="submit" variant="contained" disabled={loading}>
            Save Changes
          </Button>
          {loading && (
            <CircularProgress
              size={24}
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                marginTop: '-12px',
                marginLeft: '-12px',
              }}
            />
          )}
        </Box>
      </Box>
    </Paper>
  );
};

export default SecuritySettings;