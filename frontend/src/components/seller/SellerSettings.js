import React, { useState } from 'react';
import { Box, Typography, Paper, FormControl, Select, MenuItem, Divider, Switch, Stack } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';

const SellerSettings = () => {
  const { t, i18n } = useTranslation();
  const { theme, setThemeMode } = useTheme();

  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('seller_settings');
      return saved ? JSON.parse(saved) : { language: 'en', theme: 'system', notifications: true };
    } catch {
      return { language: 'en', theme: 'system', notifications: true };
    }
  });

  const saveSettings = (newSettings) => {
    setSettings(newSettings);
    localStorage.setItem('seller_settings', JSON.stringify(newSettings));
    if (newSettings.theme) setThemeMode(newSettings.theme);
    if (newSettings.language) i18n.changeLanguage(newSettings.language);
  };

  return (
    <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid #E5E7EB', maxWidth: 600 }}>
      <Typography variant="h5" fontWeight={800} mb={4}>Platform Settings</Typography>

      <Box mb={4}>
        <Typography fontWeight={700} mb={1}>Language</Typography>
        <FormControl fullWidth size="small">
          <Select value={settings.language} onChange={(e) => saveSettings({ ...settings, language: e.target.value })}>
            <MenuItem value="en">English</MenuItem>
            <MenuItem value="hi">हिन्दी (Hindi)</MenuItem>
            <MenuItem value="ta">தமிழ் (Tamil)</MenuItem>
            <MenuItem value="te">తెలుగు (Telugu)</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box mb={4}>
        <Typography fontWeight={700} mb={1}>Theme Preferences</Typography>
        <FormControl fullWidth size="small">
          <Select value={settings.theme} onChange={(e) => saveSettings({ ...settings, theme: e.target.value })}>
            <MenuItem value="light">Light Mode</MenuItem>
            <MenuItem value="dark">Dark Mode</MenuItem>
            <MenuItem value="system">System Default</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography fontWeight={700}>Push Notifications</Typography>
            <Typography variant="caption" color="text.secondary">Receive alerts for new orders</Typography>
          </Box>
          <Switch checked={settings.notifications} onChange={(e) => saveSettings({ ...settings, notifications: e.target.checked })} color="primary" />
        </Stack>
      </Box>
    </Paper>
  );
};

export default SellerSettings;