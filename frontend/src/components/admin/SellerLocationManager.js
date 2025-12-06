import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { TextField, Button, Box, Typography, Select, MenuItem, FormControl, InputLabel, CircularProgress, Alert } from '@mui/material';
import { listUsers, updateSellerLocation } from '../../redux/actions/adminActions';

const SellerLocationManager = () => {
  const dispatch = useDispatch();
  const { users = [], loading: usersLoading } = useSelector((state) => state.userList || {});
  const { loading: updateLoading, error: updateError, success: updateSuccess } = useSelector((state) => state.sellerLocationUpdate || {});
  const [selectedSeller, setSelectedSeller] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    dispatch(listUsers());
  }, [dispatch]);

  useEffect(() => {
    if (updateSuccess) {
      setMessage('Seller location updated successfully');
      setSelectedSeller('');
      setLatitude('');
      setLongitude('');
    }
  }, [updateSuccess]);

  const handleUpdate = () => {
    if (!selectedSeller || !latitude || !longitude) {
      setMessage('Please fill all fields');
      return;
    }
    const locationData = {
      sellerId: selectedSeller,
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
      },
    };
    dispatch(updateSellerLocation(locationData));
  };

  const sellers = users.filter(user => user.role === 'seller');

  return (
    <Box sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1 }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
        Manage Seller Locations
      </Typography>
      {usersLoading || updateLoading ? <CircularProgress /> : null}
      {updateError && <Alert severity="error" sx={{ mb: 2 }}>{updateError}</Alert>}
      {message && <Alert severity={updateSuccess ? 'success' : 'warning'} sx={{ mb: 2 }}>{message}</Alert>}
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Select Seller</InputLabel>
        <Select
          value={selectedSeller}
          onChange={(e) => setSelectedSeller(e.target.value)}
          label="Select Seller"
        >
          {sellers.map((seller) => (
            <MenuItem key={seller._id} value={seller._id}>
              {seller.name} ({seller.businessDetails?.businessName || 'N/A'})
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <TextField
        fullWidth
        label="Latitude"
        value={latitude}
        onChange={(e) => setLatitude(e.target.value)}
        sx={{ mb: 2 }}
        type="number"
        inputProps={{ step: 'any' }}
      />
      <TextField
        fullWidth
        label="Longitude"
        value={longitude}
        onChange={(e) => setLongitude(e.target.value)}
        sx={{ mb: 2 }}
        type="number"
        inputProps={{ step: 'any' }}
      />
      <Button
        variant="contained"
        color="primary"
        onClick={handleUpdate}
        disabled={usersLoading || updateLoading}
      >
        Update Location
      </Button>
    </Box>
  );
};

export default SellerLocationManager;