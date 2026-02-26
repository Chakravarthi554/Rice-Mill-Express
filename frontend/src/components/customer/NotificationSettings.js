// frontend/src/pages/customer/NotificationsPage.js
import React, { useState, useEffect } from 'react';
import { Paper, Box, Typography, FormControlLabel, Switch, Button, Divider, Alert, CircularProgress } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { updateUserProfile } from '../../redux/actions/userActions';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const NotificationSettings = () => {
  const { t, user } = useAuth();
  const dispatch = useDispatch();
  const { loading, success } = useSelector(state => state.userUpdateProfile);

  const [prefs, setPrefs] = useState({
    email: true,
    sms: false,
    push: true,
    categories: {
      orders: true,
      marketing: true,
      social: true,
    }
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user?.notificationPreferences) {
      setPrefs(user.notificationPreferences);
    }
  }, [user]);

  useEffect(() => {
    if (success) {
      setMessage(t('saved') || 'Preferences saved!');
      setTimeout(() => setMessage(''), 3000);
    }
  }, [success, t]);

  const handleToggle = (path) => {
    const keys = path.split('.');
    setPrefs(prev => {
      const newPrefs = { ...prev };
      let current = newPrefs;
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = !current[keys[keys.length - 1]];
      return newPrefs;
    });
  };

  const handleSave = () => {
    dispatch(updateUserProfile({ notificationPreferences: prefs }));
  };

  const sendTest = async (type) => {
    try {
      await axios.post('/api/users/test-notification', { type }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setMessage(`Test ${type} sent!`);
    } catch {
      setMessage('Failed to send test');
    }
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 2 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          {t('notificationPreferences') || 'Notification Preferences'}
        </Typography>

        {message && <Alert severity={message.includes('saved') || message.includes('sent') ? 'success' : 'error'} sx={{ mb: 2 }}>
          {message}
        </Alert>}

        <Typography variant="subtitle1" sx={{ mt: 2, fontWeight: 'bold' }}>Channels</Typography>
        <FormControlLabel
          control={<Switch checked={prefs.email} onChange={() => handleToggle('email')} />}
          label={t('email') || 'Email'}
        />
        <Button size="small" onClick={() => sendTest('email')} disabled={!prefs.email}>Test</Button><br />

        <FormControlLabel
          control={<Switch checked={prefs.sms} onChange={() => handleToggle('sms')} />}
          label={t('sms') || 'SMS'}
        />
        <Button size="small" onClick={() => sendTest('sms')} disabled={!prefs.sms}>Test</Button><br />

        <FormControlLabel
          control={<Switch checked={prefs.push} onChange={() => handleToggle('push')} />}
          label={t('push') || 'Push'}
        />
        <Button size="small" onClick={() => sendTest('push')} disabled={!prefs.push}>Test</Button>

        <Divider sx={{ my: 3 }} />

        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Categories</Typography>
        <FormControlLabel
          control={<Switch checked={prefs.categories.orders} onChange={() => handleToggle('categories.orders')} />}
          label={t('orders') || 'Order Updates'}
        />
        <br />
        <FormControlLabel
          control={<Switch checked={prefs.categories.marketing} onChange={() => handleToggle('categories.marketing')} />}
          label={t('marketing') || 'Promotions & Offers'}
        />
        <br />
        <FormControlLabel
          control={<Switch checked={prefs.categories.social} onChange={() => handleToggle('categories.social')} />}
          label={t('social') || 'Community & Social'}
        />

        <Box sx={{ mt: 4, textAlign: 'right' }}>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : (t('save') || 'Save Changes')}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default NotificationSettings;