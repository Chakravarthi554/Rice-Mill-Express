import React, { useState, useEffect } from 'react';
import {
  Paper, Typography, FormControl, InputLabel, Select, MenuItem,
  Button, Alert, CircularProgress, Box
} from '@mui/material';
import { PaletteOutlined } from '@mui/icons-material';
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
    <Paper sx={{ p: 4, borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.04)', maxWidth: 600 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <PaletteOutlined sx={{ color: '#16A34A', fontSize: 24 }} />
        <Typography variant="h6" sx={{ fontWeight: 800, color: '#111827' }}>
          Theme Mode
        </Typography>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 3 }}>{error}</Alert>}
      <Box component="form" onSubmit={handleSave}>
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Theme</InputLabel>
          <Select value={theme} onChange={e => setThemeMode(e.target.value)} label="Theme" sx={{ borderRadius: 3, bgcolor: '#F9FAFB' }}>
            <MenuItem value="light">Light</MenuItem>
            <MenuItem value="dark">Dark</MenuItem>
            <MenuItem value="system">System</MenuItem>
          </Select>
        </FormControl>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button type="submit" variant="contained" color="success" disabled={loading} sx={{ borderRadius: 3, px: 5, py: 1.2, fontWeight: 700 }}>
            {loading ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : 'Save'}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
};

export default ThemeMode;
