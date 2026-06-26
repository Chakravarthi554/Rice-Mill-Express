import React, { useState, useEffect } from 'react';
import {
  Paper, Typography, FormControlLabel, Switch, Button,
  Alert, CircularProgress, Box, Snackbar, Divider
} from '@mui/material';
import { Lock, AdsClick, Share } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { getPrivacySettings, updatePrivacySettings } from '../../redux/actions/userActions';

const PrivacySettings = () => {
  const dispatch = useDispatch();
  const { userInfo } = useSelector(state => state.userLogin);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [ads, setAds] = useState(userInfo?.preferences?.adsPersonalization ?? true);
  const [sharing, setSharing] = useState(userInfo?.preferences?.dataSharing ?? false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const data = await dispatch(getPrivacySettings());
        if (data?.preferences) {
          setAds(data.preferences.adsPersonalization ?? true);
          setSharing(data.preferences.dataSharing ?? false);
        }
      } catch (err) {
        console.error('Failed to fetch privacy settings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [dispatch]);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await dispatch(updatePrivacySettings({
        preferences: { adsPersonalization: ads, dataSharing: sharing }
      }));
      setSuccess(true);
      setSnackbar({ open: true, message: 'Privacy settings saved successfully!' });
    } catch (err) {
      setError(err.message || 'Failed to save settings');
      setSnackbar({ open: true, message: 'Failed to save settings' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 600 }}>
      <Paper sx={{ p: 3, borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.04)', bgcolor: '#F5F3FF', border: '1px solid #DDD6FE' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
          <Lock sx={{ color: '#7C3AED', fontSize: 24 }} />
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#111827' }}>
            Privacy Settings
          </Typography>
        </Box>
        <Divider sx={{ mb: 2.5 }} />

        {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>{error}</Alert>}
        {loading && !ads && !sharing && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress color="success" />
          </Box>
        )}

        <Box component="form" onSubmit={handleSave}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, bgcolor: '#F9FAFB', borderRadius: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <AdsClick sx={{ color: '#7C3AED', fontSize: 20 }} />
                <Box>
                  <Typography sx={{ fontWeight: 600, fontSize: 14, color: '#374151' }}>Allow Personalized Ads</Typography>
                  <Typography variant="caption" sx={{ color: '#9CA3AF' }}>Based on your browsing behavior</Typography>
                </Box>
              </Box>
              <Switch checked={ads} onChange={e => setAds(e.target.checked)} disabled={loading} sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#7C3AED' } }} />
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, bgcolor: '#F9FAFB', borderRadius: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Share sx={{ color: '#F97316', fontSize: 20 }} />
                <Box>
                  <Typography sx={{ fontWeight: 600, fontSize: 14, color: '#374151' }}>Allow Data Sharing with Partners</Typography>
                  <Typography variant="caption" sx={{ color: '#9CA3AF' }}>Helps improve product recommendations</Typography>
                </Box>
              </Box>
              <Switch checked={sharing} onChange={e => setSharing(e.target.checked)} disabled={loading} sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#F97316' } }} />
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, bgcolor: '#F9FAFB', borderRadius: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Lock sx={{ color: '#16A34A', fontSize: 20 }} />
                <Box>
                  <Typography sx={{ fontWeight: 600, fontSize: 14, color: '#374151' }}>Public Profile Visibility</Typography>
                  <Typography variant="caption" sx={{ color: '#9CA3AF' }}>Hide your identity in recipes, forum, and reviews</Typography>
                </Box>
              </Box>
              <Switch
                checked={userInfo?.privacySettings?.profileVisible ?? true}
                onChange={e => dispatch(updatePrivacySettings({ profileVisible: e.target.checked }))}
                disabled={loading}
                sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#16A34A' } }}
              />
            </Box>
          </Box>

          <Box sx={{ p: 2, bgcolor: '#EFF6FF', borderRadius: 3, mb: 3 }}>
            <Typography variant="caption" sx={{ color: '#1D4ED8' }}>
              <strong>Note:</strong> You will still see your own name on your posts. To verify, please log in with a different account or ask a friend.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2, borderTop: '1px solid #F3F4F6' }}>
            <Button type="submit" variant="contained" color="success" disabled={loading} sx={{ borderRadius: 3, px: 5, py: 1.2, fontWeight: 700 }}>
              {loading ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : 'Save Ad Preferences'}
            </Button>
          </Box>
        </Box>
      </Paper>
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={success ? 'success' : 'error'} sx={{ borderRadius: 3 }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default PrivacySettings;
