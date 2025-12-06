import React, { useState, useEffect } from 'react';
import {
  Paper, Typography, FormControl, InputLabel, Select, MenuItem,
  Button, Alert, CircularProgress, Box
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { updateUserProfile } from '../../redux/actions/userActions';
import { useAuth } from '../../context/AuthContext';

const ThemeMode = () => {
  const dispatch = useDispatch();
  const { setTheme } = useAuth();
  const { userInfo } = useSelector(state => state.userLogin);
  const { loading, error, success } = useSelector(state => state.userUpdateProfile);

  const [theme, setThemeMode] = useState(userInfo?.preferences?.theme || 'system');

  useEffect(() => {
    if (success) {
      setTheme(theme);
      alert('Theme updated!');
    }
  }, [success, theme, setTheme]);

  const handleSave = (e) => {
    e.preventDefault();
    dispatch(updateUserProfile({
      preferences: { ...userInfo?.preferences, theme }
    }));
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>Theme Mode</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Box component="form" onSubmit={handleSave}>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Theme</InputLabel>
          <Select value={theme} onChange={e => setThemeMode(e.target.value)} label="Theme">
            <MenuItem value="light">Light</MenuItem>
            <MenuItem value="dark">Dark</MenuItem>
            <MenuItem value="system">System</MenuItem>
          </Select>
        </FormControl>
        <Button type="submit" variant="contained" disabled={loading}>
          {loading ? <CircularProgress size={20} /> : 'Save'}
        </Button>
      </Box>
    </Paper>
  );
};
export default ThemeMode;