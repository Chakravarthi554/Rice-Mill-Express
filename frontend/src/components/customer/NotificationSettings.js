import React, { useState, useEffect } from 'react';
import {
  Paper, Box, Typography, FormControlLabel, Switch,
  Button, Divider, Alert, CircularProgress
} from '@mui/material';
import { NotificationsActive, Email, Phone, ShoppingBag, Campaign, Group } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { updateUserProfile } from '../../redux/actions/userActions';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const NotificationSettings = () => {
  const { t, user } = useAuth();
  const dispatch = useDispatch();
  const { loading, success } = useSelector(state => state.userUpdateProfile);

  const [prefs, setPrefs] = useState({
    email: true, sms: false, push: true,
    categories: { orders: true, marketing: true, social: true }
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
      for (let i = 0; i < keys.length - 1; i++) current = current[keys[i]];
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

  const channelItems = [
    { key: 'email', label: 'Email', icon: <Email />, color: '#4F46E5', bg: '#EEF2FF' },
    { key: 'sms', label: 'SMS', icon: <Phone />, color: '#EA580C', bg: '#FFF7ED' },
    { key: 'push', label: 'Push', icon: <NotificationsActive />, color: '#16A34A', bg: '#F0FDF4' },
  ];

  const categoryItems = [
    { key: 'orders', label: 'Order Updates', icon: <ShoppingBag />, color: '#16A34A', bg: '#F0FDF4' },
    { key: 'marketing', label: 'Promotions & Offers', icon: <Campaign />, color: '#F97316', bg: '#FFF7ED' },
    { key: 'social', label: 'Community & Social', icon: <Group />, color: '#7C3AED', bg: '#F5F3FF' },
  ];

  return (
    <Box sx={{ maxWidth: 600 }}>
      <Paper sx={{ p: 3, borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.04)', bgcolor: '#F0FDF4', border: '1px solid #BBF7D0' }}>
        <Typography variant="h6" sx={{ fontWeight: 800, color: '#111827', mb: 2.5 }}>
          Notification Preferences
        </Typography>

        {message && (
          <Alert severity={message.includes('saved') || message.includes('sent') ? 'success' : 'error'} sx={{ mb: 3, borderRadius: 3 }}>
            {message}
          </Alert>
        )}

        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#374151', mb: 2 }}>
          Channels
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 3 }}>
          {channelItems.map(item => (
            <Box key={item.key} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5, bgcolor: '#F9FAFB', borderRadius: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.color }}>
                  {item.icon}
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 600, fontSize: 14, color: '#374151' }}>{item.label}</Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Button size="small" onClick={() => sendTest(item.key)} disabled={!prefs[item.key]} sx={{ borderRadius: 2, fontSize: 11, fontWeight: 700 }}>
                  Test
                </Button>
                <Switch checked={prefs[item.key]} onChange={() => handleToggle(item.key)} sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: item.color } }} />
              </Box>
            </Box>
          ))}
        </Box>

        <Divider sx={{ my: 3 }} />

        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#374151', mb: 2 }}>
          Categories
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 3 }}>
          {categoryItems.map(item => (
            <Box key={item.key} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5, bgcolor: '#F9FAFB', borderRadius: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.color }}>
                  {item.icon}
                </Box>
                <Typography sx={{ fontWeight: 600, fontSize: 14, color: '#374151' }}>{item.label}</Typography>
              </Box>
              <Switch
                checked={prefs.categories[item.key]}
                onChange={() => handleToggle(`categories.${item.key}`)}
                sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: item.color } }}
              />
            </Box>
          ))}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2, borderTop: '1px solid #F3F4F6' }}>
          <Button variant="contained" color="success" onClick={handleSave} disabled={loading} sx={{ borderRadius: 3, px: 5, py: 1.2, fontWeight: 700 }}>
            {loading ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : (t('save') || 'Save Changes')}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default NotificationSettings;
