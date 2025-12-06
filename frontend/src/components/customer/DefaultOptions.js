import React, { useState, useEffect } from 'react';
import {
  Paper, Typography, FormControl, InputLabel, Select, MenuItem,
  Button, Alert, CircularProgress, Box
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { updateUserProfile } from '../../redux/actions/userActions';

const DefaultOptions = () => {
  const dispatch = useDispatch();
  const { userInfo } = useSelector(state => state.userLogin);
  const { loading, error, success } = useSelector(state => state.userUpdateProfile);

  const [defaultAddress, setDefaultAddress] = useState(userInfo?.defaultAddress || '');
  const [defaultPayment, setDefaultPayment] = useState(userInfo?.defaultPayment || '');

  useEffect(() => {
    if (success) alert('Default options saved!');
  }, [success]);

  const handleSave = (e) => {
    e.preventDefault();
    dispatch(updateUserProfile({ defaultAddress, defaultPayment }));
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>Default Options</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Box component="form" onSubmit={handleSave}>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Default Address</InputLabel>
          <Select value={defaultAddress} onChange={e => setDefaultAddress(e.target.value)}>
            <MenuItem value="">None</MenuItem>
            {userInfo?.addresses?.map(a => (
              <MenuItem key={a._id} value={a._id}>
                {a.street}, {a.city}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Default Payment</InputLabel>
          <Select value={defaultPayment} onChange={e => setDefaultPayment(e.target.value)}>
            <MenuItem value="">None</MenuItem>
            {userInfo?.paymentMethods?.map(p => (
              <MenuItem key={p._id} value={p._id}>
                **** {p.last4}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button type="submit" variant="contained" disabled={loading}>
          {loading ? <CircularProgress size={20} /> : 'Save'}
        </Button>
      </Box>
    </Paper>
  );
};
export default DefaultOptions;