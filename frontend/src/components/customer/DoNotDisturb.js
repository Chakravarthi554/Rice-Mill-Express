import React, { useState, useEffect } from 'react';
import {
  Paper, Typography, FormControlLabel, Switch, Button,
  Alert, CircularProgress, Box
} from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider, TimePicker } from '@mui/x-date-pickers';
import { useDispatch, useSelector } from 'react-redux';
import { updateUserProfile } from '../../redux/actions/userActions';
import dayjs from 'dayjs';

const DoNotDisturb = () => {
  const dispatch = useDispatch();
  const { userInfo } = useSelector(state => state.userLogin);
  const { loading, error, success } = useSelector(state => state.userUpdateProfile);

  const dnd = userInfo?.notificationPreferences?.dnd || {};
  const [enabled, setEnabled] = useState(dnd.enabled || false);
  const [start, setStart] = useState(dnd.start ? dayjs(dnd.start) : null);
  const [end, setEnd] = useState(dnd.end ? dayjs(dnd.end) : null);

  useEffect(() => {
    if (success) alert('DND schedule saved!');
  }, [success]);

  const handleSave = (e) => {
    e.preventDefault();
    dispatch(updateUserProfile({
      notificationPreferences: {
        ...userInfo?.notificationPreferences,
        dnd: { enabled, start: start?.toISOString(), end: end?.toISOString() }
      }
    }));
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>Do Not Disturb</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Box component="form" onSubmit={handleSave}>
          <FormControlLabel
            control={<Switch checked={enabled} onChange={e => setEnabled(e.target.checked)} />}
            label="Enable DND"
            sx={{ mb: 2, display: 'block' }}
          />
          <TimePicker
            label="Start"
            value={start}
            onChange={setStart}
            slotProps={{ textField: { fullWidth: true, sx: { mb: 2 } } }}
          />
          <TimePicker
            label="End"
            value={end}
            onChange={setEnd}
            slotProps={{ textField: { fullWidth: true, sx: { mb: 2 } } }}
          />
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={20} /> : 'Save'}
          </Button>
        </Box>
      </Paper>
    </LocalizationProvider>
  );
};
export default DoNotDisturb;