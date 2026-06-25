import React, { useEffect, useState } from 'react';
import {
  Paper, Typography, Box, FormControl, InputLabel, Select,
  MenuItem, Button, Divider, Alert, Chip
} from '@mui/material';
import { Language as LanguageIcon } from '@mui/icons-material';
import { useI18n } from '../../context/i18nContext';
import { useDispatch, useSelector } from 'react-redux';
import { getSocket } from '../../utils/socket';
import { updateUserProfile } from '../../redux/actions/userActions';

const LanguageSettings = () => {
  const { language, changeLanguage, availableLanguages, t } = useI18n();
  const dispatch = useDispatch();
  const { userInfo } = useSelector(state => state.userLogin);

  const [localLanguage, setLocalLanguage] = useState(language);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const socket = getSocket(userInfo?._id, userInfo?.role, userInfo?.token);
    if (socket) {
      const handlePreferenceUpdate = (data) => {
        if (data.userId === userInfo?._id) {
          setLocalLanguage(data.preferences?.language || language);
          if (data.preferences?.language && data.preferences.language !== language) {
            changeLanguage(data.preferences.language);
          }
        }
      };
      socket.on('PREFERENCES_UPDATED', handlePreferenceUpdate);
      socket.on('GLOBAL_PREFERENCES_UPDATE', handlePreferenceUpdate);
      return () => {
        socket.off('PREFERENCES_UPDATED', handlePreferenceUpdate);
        socket.off('GLOBAL_PREFERENCES_UPDATE', handlePreferenceUpdate);
      };
    }
  }, [userInfo?._id, userInfo?.token, language, changeLanguage]);

  const handleSave = () => {
    changeLanguage(localLanguage);
    dispatch(updateUserProfile({ preferences: { language: localLanguage } }));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  useEffect(() => {
    setLocalLanguage(language);
  }, [language]);

  const languageNames = {
    english: 'English',
    hindi: 'हिन्दी (Hindi)',
    tamil: 'தமிழ் (Tamil)',
    telugu: 'తెలుగు (Telugu)'
  };

  return (
    <Box sx={{ maxWidth: 600 }}>
      <Paper sx={{ p: 3, borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.04)', bgcolor: '#EFF6FF', border: '1px solid #BFDBFE' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
          <LanguageIcon sx={{ color: '#2563EB', fontSize: 24 }} />
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#111827' }}>
            Language & Region
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: '#9CA3AF', mb: 3 }}>
          Customize language, region, and currency preferences
        </Typography>

        {saved && (
          <Alert severity="success" sx={{ mb: 3, borderRadius: 3 }}>
            Settings saved! Changes applied globally.
          </Alert>
        )}

        <Box sx={{ mb: 4 }}>
          <FormControl fullWidth>
            <InputLabel id="language-select-label">Language</InputLabel>
            <Select
              labelId="language-select-label"
              value={localLanguage}
              label="Language"
              onChange={(e) => setLocalLanguage(e.target.value)}
              sx={{ borderRadius: 3, bgcolor: '#F9FAFB' }}
            >
              {availableLanguages.map((lang) => (
                <MenuItem key={lang} value={lang}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography>{languageNames[lang]}</Typography>
                    {language === lang && (
                      <Chip label="Current" size="small" sx={{ bgcolor: '#F0FDF4', color: '#166534', fontWeight: 700, height: 22 }} />
                    )}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Typography variant="caption" sx={{ color: '#9CA3AF', mt: 1, display: 'block' }}>
            Select your preferred language for the interface
          </Typography>
        </Box>

        <Button
          variant="contained"
          color="success"
          fullWidth
          size="large"
          onClick={handleSave}
          sx={{ borderRadius: 3, py: 1.5, fontWeight: 700, fontSize: 15 }}
        >
          Save & Apply Changes Globally
        </Button>

        <Divider sx={{ my: 4 }} />

        <Box sx={{ p: 3, bgcolor: '#F9FAFB', borderRadius: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#374151', mb: 2 }}>
            Preview
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Typography variant="body2" sx={{ color: '#6B7280' }}><strong>Welcome Message:</strong> {t('welcome')}</Typography>
            <Typography variant="body2" sx={{ color: '#6B7280' }}><strong>Dashboard:</strong> {t('dashboard')}</Typography>
            <Typography variant="body2" sx={{ color: '#6B7280' }}><strong>My Orders:</strong> {t('myOrders')}</Typography>
            <Typography variant="body2" sx={{ color: '#6B7280' }}>
              <strong>Sample Price:</strong> {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(1250.50)}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ mt: 3, p: 2, bgcolor: '#F0FDF4', borderRadius: 3 }}>
          <Typography variant="caption" sx={{ color: '#166534' }}>
            <strong>Note:</strong> Your language and region preferences are saved automatically. The app will remember your choices for future visits.
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default LanguageSettings;
