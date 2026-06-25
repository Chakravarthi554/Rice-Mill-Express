import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper,
  IconButton, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, FormControl, InputLabel,
  Select, MenuItem, TextField, FormControlLabel,
  Checkbox, Chip, Radio, RadioGroup, FormControlLabel as MFormControlLabel,
} from '@mui/material';
import {
  Edit, Delete, Add, Home as HomeIcon, Work as WorkIcon,
  LocationOn, MyLocation
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { listAddresses, addAddress, updateAddress, deleteAddress, setDefaultAddress } from '../../redux/actions/addressActions';

const AddressManager = ({ onSelectAddress, elevation = 2 }) => {
  const [openDialog, setOpenDialog] = useState(false);
  const [currentAddress, setCurrentAddress] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [newAddress, setNewAddress] = useState({
    name: '', phone: '', type: 'home', houseNumber: '', colony: '',
    street: '', landmark: '', city: '', state: '', pinCode: '',
    alternativePhone: '', location: null, isDefault: false,
  });

  const dispatch = useDispatch();
  const { addresses = [], loading, error } = useSelector((state) => state.addressList || { addresses: [], loading: false, error: null });

  useEffect(() => {
    dispatch(listAddresses());
  }, [dispatch]);

  useEffect(() => {
    if (addresses.length > 0) {
      const defaultAddr = addresses.find((a) => a.isDefault);
      const addrToSelect = defaultAddr || addresses[0];
      setSelectedId(addrToSelect._id);
      onSelectAddress?.(addrToSelect);
    }
  }, [addresses, onSelectAddress]);

  const handleOpenAddDialog = () => {
    setIsEditing(false);
    setCurrentAddress(null);
    setNewAddress({
      name: '', phone: '', type: 'home', houseNumber: '', colony: '',
      street: '', landmark: '', city: '', state: '', pinCode: '',
      alternativePhone: '', location: null, isDefault: false,
    });
    setOpenDialog(true);
  };

  const [locationLoading, setLocationLoading] = useState(false);

  const handleDetectLocation = async () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          if (data && data.address) {
            const addr = data.address;
            setNewAddress((prev) => ({
              ...prev,
              street: addr.road || addr.suburb || '',
              city: addr.city || addr.town || addr.village || '',
              state: addr.state || '',
              pinCode: addr.postcode || '',
              location: { type: 'Point', coordinates: [longitude, latitude] },
            }));
            alert('Location detected and fields pre-filled!');
          }
        } catch (err) {
          console.error('Geocoding error:', err);
          alert('Failed to detect address details. Please enter manually.');
        } finally {
          setLocationLoading(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert('Permission denied or location not found.');
        setLocationLoading(false);
      }
    );
  };

  const handleOpenEditDialog = (address) => {
    setIsEditing(true);
    setCurrentAddress(address);
    setNewAddress(address);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => setOpenDialog(false);

  const handleInputChange = (e) => {
    const { name, value, checked } = e.target;
    setNewAddress((prev) => ({
      ...prev,
      [name]: name === 'isDefault' ? checked : value,
    }));
  };

  const handleAdd = () => {
    dispatch(addAddress(newAddress));
    handleCloseDialog();
  };

  const handleUpdate = () => {
    if (currentAddress) {
      dispatch(updateAddress(currentAddress._id, newAddress));
    }
    handleCloseDialog();
  };

  const handleDelete = (addressId) => dispatch(deleteAddress(addressId));
  const handleSetDefault = (addressId) => dispatch(setDefaultAddress(addressId));

  const handleSelectAddress = (address) => {
    setSelectedId(address._id);
    onSelectAddress?.(address);
  };

  const containerSx = {
    bgcolor: '#FFFFFE', borderRadius: 4,
    border: '1px solid #BBF7D0', boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#111827' }}>Delivery Addresses</Typography>
          <Typography sx={{ fontSize: 13, color: '#9CA3AF' }}>{addresses.length} saved address{addresses.length !== 1 ? 'es' : ''}</Typography>
        </Box>
        <Button variant="contained" color="success" startIcon={<Add />} onClick={handleOpenAddDialog} disabled={loading} sx={{ borderRadius: 3, fontWeight: 700 }}>
          Add New
        </Button>
      </Box>

      {error && <Typography color="error" sx={{ mb: 2, p: 2, bgcolor: '#FEF2F2', borderRadius: 3 }}>{error}</Typography>}

      <RadioGroup value={selectedId} onChange={(e) => {
        const addr = addresses.find((a) => a._id === e.target.value);
        if (addr) handleSelectAddress(addr);
      }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {Array.isArray(addresses) && addresses.length > 0 ? (
            addresses.map((address, index) => (
              <Paper key={address._id} sx={containerSx}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', p: 2.5 }}>
                  <MFormControlLabel
                    value={address._id}
                    control={<Radio sx={{ '&.Mui-checked': { color: '#16A34A' } }} />}
                    sx={{ flex: 1, m: 0, alignItems: 'flex-start' }}
                    label={
                      <Box sx={{ ml: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          {address.type === 'home' ? <HomeIcon sx={{ color: '#16A34A', fontSize: 20 }} /> : <WorkIcon sx={{ color: '#F97316', fontSize: 20 }} />}
                          <Typography sx={{ fontWeight: 700, color: '#111827', textTransform: 'capitalize' }}>
                            {address.type}
                          </Typography>
                          {address.isDefault && <Chip label="Default" size="small" sx={{ bgcolor: '#F0FDF4', color: '#166534', fontWeight: 700, fontSize: 11, height: 22 }} />}
                        </Box>
                        <Typography variant="body2" sx={{ color: '#6B7280', mb: 0.5 }}>
                          {address.houseNumber}{address.colony ? `, ${address.colony}` : ''}{address.street ? `, ${address.street}` : ''}
                        </Typography>
                        {address.landmark && (
                          <Typography variant="caption" sx={{ color: '#9CA3AF', display: 'block', mb: 0.3 }}>
                            Landmark: {address.landmark}
                          </Typography>
                        )}
                        <Typography variant="body2" sx={{ color: '#6B7280' }}>
                          {address.city}, {address.state} - {address.pinCode}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#9CA3AF', mt: 0.5, display: 'block' }}>
                          {address.phone}{address.alternativePhone ? ` | Alt: ${address.alternativePhone}` : ''}
                        </Typography>
                      </Box>
                    }
                  />
                  <Box sx={{ display: 'flex', gap: 0.5, ml: 2, flexShrink: 0 }}>
                    <IconButton size="small" onClick={() => handleOpenEditDialog(address)} sx={{ color: '#6B7280', '&:hover': { bgcolor: '#F3F4F6' } }}>
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(address._id)} sx={{ color: '#EF4444', '&:hover': { bgcolor: '#FEF2F2' } }}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
                {!address.isDefault && (
                  <Box sx={{ px: 2.5, pb: 2, pt: 0 }}>
                    <Button variant="text" size="small" onClick={() => handleSetDefault(address._id)} sx={{ fontWeight: 700, fontSize: 12, color: '#16A34A' }}>
                      Set as Default
                    </Button>
                  </Box>
                )}
              </Paper>
            ))
          ) : (
            <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 4, border: '1px dashed #E5E7EB' }}>
              <LocationOn sx={{ fontSize: 48, color: '#D1D5DB', mb: 1 }} />
              <Typography sx={{ color: '#9CA3AF' }}>No addresses saved yet</Typography>
              <Button variant="contained" color="success" startIcon={<Add />} onClick={handleOpenAddDialog} sx={{ mt: 2, borderRadius: 3 }}>
                Add Address
              </Button>
            </Paper>
          )}
        </Box>
      </RadioGroup>

      <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 800, fontSize: 20, color: '#111827' }}>
          {isEditing ? 'Edit Address' : 'Add New Address'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Address Type</InputLabel>
              <Select name="type" value={newAddress.type} onChange={handleInputChange} label="Address Type" sx={{ borderRadius: 3, bgcolor: '#F9FAFB' }}>
                <MenuItem value="home">Home</MenuItem>
                <MenuItem value="work">Work</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="outlined"
              fullWidth
              onClick={handleDetectLocation}
              disabled={locationLoading}
              startIcon={<MyLocation />}
              sx={{ mb: 3, borderRadius: 3, py: 1, fontWeight: 700 }}
            >
              {locationLoading ? 'Detecting...' : 'Detect My Current Location'}
            </Button>

            <TextField fullWidth label="Recipient Name *" name="name" value={newAddress.name} onChange={handleInputChange} sx={{ mb: 2 }} required InputProps={{ sx: { borderRadius: 3, bgcolor: '#F9FAFB' } }} />
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField fullWidth label="House/Flat No *" name="houseNumber" value={newAddress.houseNumber} onChange={handleInputChange} required InputProps={{ sx: { borderRadius: 3, bgcolor: '#F9FAFB' } }} />
              <TextField fullWidth label="Colony/Area" name="colony" value={newAddress.colony} onChange={handleInputChange} InputProps={{ sx: { borderRadius: 3, bgcolor: '#F9FAFB' } }} />
            </Box>
            <TextField fullWidth label="Street Address *" name="street" value={newAddress.street} onChange={handleInputChange} sx={{ mb: 2 }} required InputProps={{ sx: { borderRadius: 3, bgcolor: '#F9FAFB' } }} />
            <TextField fullWidth label="Landmark (Optional)" name="landmark" value={newAddress.landmark} onChange={handleInputChange} sx={{ mb: 2 }} InputProps={{ sx: { borderRadius: 3, bgcolor: '#F9FAFB' } }} />
            <TextField fullWidth label="City *" name="city" value={newAddress.city} onChange={handleInputChange} sx={{ mb: 2 }} required InputProps={{ sx: { borderRadius: 3, bgcolor: '#F9FAFB' } }} />
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField fullWidth label="State *" name="state" value={newAddress.state} onChange={handleInputChange} required InputProps={{ sx: { borderRadius: 3, bgcolor: '#F9FAFB' } }} />
              <TextField fullWidth label="PIN Code *" name="pinCode" value={newAddress.pinCode} onChange={handleInputChange} required InputProps={{ sx: { borderRadius: 3, bgcolor: '#F9FAFB' } }} />
            </Box>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField fullWidth label="Phone Number *" name="phone" value={newAddress.phone} onChange={handleInputChange} required InputProps={{ sx: { borderRadius: 3, bgcolor: '#F9FAFB' } }} />
              <TextField fullWidth label="Alt Phone (Optional)" name="alternativePhone" value={newAddress.alternativePhone} onChange={handleInputChange} InputProps={{ sx: { borderRadius: 3, bgcolor: '#F9FAFB' } }} />
            </Box>
            <FormControlLabel control={<Checkbox name="isDefault" checked={newAddress.isDefault} onChange={handleInputChange} sx={{ '&.Mui-checked': { color: '#16A34A' } }} />} label="Set as default address" />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleCloseDialog} disabled={loading} sx={{ borderRadius: 3, fontWeight: 700 }}>Cancel</Button>
          <Button
            onClick={isEditing ? handleUpdate : handleAdd}
            variant="contained"
            color="success"
            disabled={
              loading || !newAddress.name || !newAddress.phone ||
              !newAddress.houseNumber || !newAddress.street ||
              !newAddress.city || !newAddress.state || !newAddress.pinCode
            }
            sx={{ borderRadius: 3, fontWeight: 700, px: 4 }}
          >
            {isEditing ? 'Update' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AddressManager;
