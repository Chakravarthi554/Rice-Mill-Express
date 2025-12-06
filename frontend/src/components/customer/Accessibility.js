import React, { useState, useEffect } from 'react';
import {
  Paper, Typography, FormControlLabel, Switch, Button,
  Alert, CircularProgress, Box
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { updateUserProfile } from '../../redux/actions/userActions';

const Accessibility = () => {
  const dispatch = useDispatch();
  const { userInfo } = useSelector(state => state.userLogin);
  const { loading, error, success } = useSelector(state => state.userUpdateProfile);

  const [highContrast, setHighContrast] = useState(userInfo?.preferences?.highContrast || false);
  const [largeText, setLargeText] = useState(userInfo?.preferences?.largeText || false);

  useEffect(() => {
    if (success) alert('Accessibility settings saved!');
  }, [success]);

  const handleSave = (e) => {
    e.preventDefault();
    dispatch(updateUserProfile({
      preferences: { ...userInfo?.preferences, highContrast, largeText }
    }));
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>Accessibility</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Box component="form" onSubmit={handleSave}>
        <FormControlLabel
          control={<Switch checked={highContrast} onChange={e => setHighContrast(e.target.checked)} />}
          label="High Contrast Mode"
          sx={{ mb: 2, display: 'block' }}
        />
        <FormControlLabel
          control={<Switch checked={largeText} onChange={e => setLargeText(e.target.checked)} />}
          label="Large Text Size"
          sx={{ mb: 2, display: 'block' }}
        />
        <Button type="submit" variant="contained" disabled={loading}>
          {loading ? <CircularProgress size={20} /> : 'Save'}
        </Button>
      </Box>
    </Paper>
  );
};
export default Accessibility;