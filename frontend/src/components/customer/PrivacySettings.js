import React, { useState, useEffect } from 'react';
import {
  Paper, Typography, FormControlLabel, Switch, Button,
  Alert, CircularProgress, Box
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { updateUserProfile } from '../../redux/actions/userActions';

const PrivacySettings = () => {
  const dispatch = useDispatch();
  const { userInfo } = useSelector(state => state.userLogin);
  const { loading, error, success } = useSelector(state => state.userUpdateProfile);

  const [ads, setAds] = useState(userInfo?.preferences?.adsPersonalization ?? true);
  const [sharing, setSharing] = useState(userInfo?.preferences?.dataSharing ?? false);

  useEffect(() => {
    if (success) alert('Privacy settings saved!');
  }, [success]);

  const handleSave = (e) => {
    e.preventDefault();
    dispatch(updateUserProfile({
      preferences: { ...userInfo?.preferences, adsPersonalization: ads, dataSharing: sharing }
    }));
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>Privacy Settings</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Box component="form" onSubmit={handleSave}>
        <FormControlLabel
          control={<Switch checked={ads} onChange={e => setAds(e.target.checked)} />}
          label="Allow Personalized Ads"
          sx={{ mb: 2, display: 'block' }}
        />
        <FormControlLabel
          control={<Switch checked={sharing} onChange={e => setSharing(e.target.checked)} />}
          label="Allow Data Sharing with Partners"
          sx={{ mb: 2, display: 'block' }}
        />
        <Button type="submit" variant="contained" disabled={loading}>
          {loading ? <CircularProgress size={20} /> : 'Save'}
        </Button>
      </Box>
    </Paper>
  );
};
export default PrivacySettings;