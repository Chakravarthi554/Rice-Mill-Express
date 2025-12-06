import React, { useState, useEffect } from 'react';
import {
  Paper, Typography, FormControlLabel, Switch, Button,
  Alert, CircularProgress, Box
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { updateUserProfile } from '../../redux/actions/userActions';

const Recommendations = () => {
  const dispatch = useDispatch();
  const { userInfo } = useSelector(state => state.userLogin);
  const { loading, error, success } = useSelector(state => state.userUpdateProfile);

  const [enabled, setEnabled] = useState(userInfo?.preferences?.recommendationsEnabled ?? true);

  useEffect(() => {
    if (success) alert('Recommendation toggle saved!');
  }, [success]);

  const handleSave = (e) => {
    e.preventDefault();
    dispatch(updateUserProfile({
      preferences: { ...userInfo?.preferences, recommendationsEnabled: enabled }
    }));
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>Personalized Recommendations</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Box component="form" onSubmit={handleSave}>
        <FormControlLabel
          control={<Switch checked={enabled} onChange={e => setEnabled(e.target.checked)} />}
          label="Enable Recommendations"
        />
        <Button type="submit" variant="contained" disabled={loading} sx={{ mt: 2 }}>
          {loading ? <CircularProgress size={20} /> : 'Save'}
        </Button>
      </Box>
    </Paper>
  );
};
export default Recommendations;