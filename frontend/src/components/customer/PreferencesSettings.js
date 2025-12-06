import React, { useState, useEffect } from 'react';
import { Typography, Paper, Box, FormControl, InputLabel, Select, MenuItem, Button, Alert, CircularProgress, Divider } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Notifications } from '@mui/icons-material';
import { updateUserProfile } from '../../redux/actions/userActions';
import { USER_UPDATE_PROFILE_RESET } from '../../redux/constants/userConstants';
import { useAuth } from '../../context/AuthContext';
const PreferencesSettings = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t, setLanguage, setTheme } = useAuth();
  const { userInfo } = useSelector((state) => state.userLogin);
  const { loading, error, success } = useSelector((state) => state.userUpdateProfile);
  const [language, setLocalLanguage] = useState('english');
  const [themeMode, setLocalTheme] = useState('system');
  const [recommendations, setRecommendations] = useState(true);
  const [message, setMessage] = useState(null);
  useEffect(() => {
    if (userInfo?.preferences) {
      setLocalLanguage(userInfo.preferences.language || 'english');
      setLocalTheme(userInfo.preferences.theme || 'system');
      setRecommendations(userInfo.preferences.recommendationsEnabled !== false);
    }
    dispatch({ type: USER_UPDATE_PROFILE_RESET });
  }, [userInfo, dispatch]);
  useEffect(() => {
    if (success) {
      setMessage(t('preferencesUpdated') || 'Preferences saved!');
      setLanguage(language);
      setTheme(themeMode);
      const timer = setTimeout(() => { setMessage(null); dispatch({ type: USER_UPDATE_PROFILE_RESET }); }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, language, themeMode, setLanguage, setTheme, t, dispatch]);
  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(updateUserProfile({
      preferences: { language, theme: themeMode, recommendationsEnabled: recommendations }
    }));
  };
  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>{t('preferences') || 'Preferences'}</Typography>
        {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Box sx={{ mb: 3 }}>
          <FormControl fullWidth>
            <InputLabel>{t('language') || 'Language'}</InputLabel>
            <Select value={language} onChange={(e) => setLocalLanguage(e.target.value)} label="Language">
              <MenuItem value="english">English</MenuItem>
              <MenuItem value="hindi">हिन्दी</MenuItem>
              <MenuItem value="telugu">తెలుగు</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <Divider sx={{ my: 3 }} />
        <Box sx={{ mb: 3 }}>
          <FormControl fullWidth>
            <InputLabel>{t('theme') || 'Theme'}</InputLabel>
            <Select value={themeMode} onChange={(e) => setLocalTheme(e.target.value)} label="Theme">
              <MenuItem value="light">Light</MenuItem>
              <MenuItem value="dark">Dark</MenuItem>
              <MenuItem value="system">System</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <Divider sx={{ my: 3 }} />
        <Box sx={{ mb: 3 }}>
          <Button variant="outlined" startIcon={<Notifications />} onClick={() => navigate('/settings/notifications')}>
            {t('manageNotifications') || 'Manage Notifications'}
          </Button>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={20} /> : (t('save') || 'Save')}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};
export default PreferencesSettings;