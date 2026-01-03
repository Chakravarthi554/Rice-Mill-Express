import React, { useState, useEffect } from 'react';
import {
  Paper, Typography, FormControlLabel, Switch, Button,
  Alert, CircularProgress, Box, Snackbar
} from '@mui/material';
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

  // ✅ FIXED: Fetch privacy settings on mount
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
        preferences: {
          adsPersonalization: ads, 
          dataSharing: sharing 
        }
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
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>Privacy Settings</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading && !ads && !sharing && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress />
        </Box>
      )}
      <Box component="form" onSubmit={handleSave}>
        <FormControlLabel
          control={<Switch checked={ads} onChange={e => setAds(e.target.checked)} disabled={loading} />}
          label="Allow Personalized Ads"
          sx={{ mb: 2, display: 'block' }}
        />
        <FormControlLabel
          control={<Switch checked={sharing} onChange={e => setSharing(e.target.checked)} disabled={loading} />}
          label="Allow Data Sharing with Partners"
          sx={{ mb: 2, display: 'block' }}
        />
        <Button type="submit" variant="contained" disabled={loading} sx={{ mt: 2 }}>
          {loading ? <CircularProgress size={20} /> : 'Save Settings'}
        </Button>
      </Box>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </Paper>
  );
};
export default PrivacySettings;