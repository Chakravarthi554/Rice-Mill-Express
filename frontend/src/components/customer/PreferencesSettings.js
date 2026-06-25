import React, { useState, useEffect } from 'react';
import {
  Typography, Paper, Box, FormControl, Select,
  MenuItem, Button, Alert, CircularProgress, Divider
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Notifications, Language, PaletteOutlined } from '@mui/icons-material';
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
    <Box sx={{ maxWidth: 600 }}>
      <Paper sx={{ p: 4, borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
        <Typography variant="h6" sx={{ fontWeight: 800, color: '#111827', mb: 3 }}>
          Preferences
        </Typography>

        {message && <Alert severity="success" sx={{ mb: 3, borderRadius: 3 }}>{message}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>{error}</Alert>}

        <Box component="form" onSubmit={handleSubmit}>
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <Language sx={{ fontSize: 20, color: '#16A34A' }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#374151' }}>
                {t('language') || 'Language'}
              </Typography>
            </Box>
            <FormControl fullWidth>
              <Select
                value={language}
                onChange={(e) => setLocalLanguage(e.target.value)}
                sx={{ borderRadius: 3, bgcolor: '#F9FAFB' }}
              >
                <MenuItem value="english">English</MenuItem>
                <MenuItem value="hindi">हिन्दी</MenuItem>
                <MenuItem value="telugu">తెలుగు</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <PaletteOutlined sx={{ fontSize: 20, color: '#16A34A' }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#374151' }}>
                {t('theme') || 'Theme'}
              </Typography>
            </Box>
            <FormControl fullWidth>
              <Select
                value={themeMode}
                onChange={(e) => setLocalTheme(e.target.value)}
                sx={{ borderRadius: 3, bgcolor: '#F9FAFB' }}
              >
                <MenuItem value="light">Light</MenuItem>
                <MenuItem value="dark">Dark</MenuItem>
                <MenuItem value="system">System</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ mb: 3 }}>
            <Button
              variant="outlined"
              color="success"
              startIcon={<Notifications />}
              onClick={() => navigate('/settings/notifications')}
              sx={{ borderRadius: 3, fontWeight: 700, py: 1 }}
              fullWidth
            >
              {t('manageNotifications') || 'Manage Notifications'}
            </Button>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2, borderTop: '1px solid #F3F4F6' }}>
            <Button
              type="submit"
              variant="contained"
              color="success"
              disabled={loading}
              sx={{ borderRadius: 3, px: 5, py: 1.2, fontWeight: 700 }}
            >
              {loading ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : (t('save') || 'Save')}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default PreferencesSettings;
