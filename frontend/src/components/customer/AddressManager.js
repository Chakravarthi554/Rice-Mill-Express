import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  FormControlLabel,
  Checkbox,
  Chip,
  Radio,
  RadioGroup,
  FormControlLabel as MFormControlLabel,
} from '@mui/material';
import { Edit, Delete, Add, Home as HomeIcon, Work as WorkIcon } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { listAddresses, addAddress, updateAddress, deleteAddress, setDefaultAddress } from '../../redux/actions/addressActions';

const AddressManager = ({ onSelectAddress, elevation = 2 }) => {
  const [openDialog, setOpenDialog] = useState(false);
  const [currentAddress, setCurrentAddress] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [newAddress, setNewAddress] = useState({
    name: '',
    phone: '',
    type: 'home',
    houseNumber: '',
    colony: '',
    street: '',
    landmark: '',
    city: '',
    state: '',
    pinCode: '',
    alternativePhone: '',
    location: null,
    isDefault: false,
  });

  const dispatch = useDispatch();
  const { addresses = [], loading, error } = useSelector((state) => state.addressList || { addresses: [], loading: false, error: null });

  // Load addresses
  useEffect(() => {
    dispatch(listAddresses());
  }, [dispatch]);

  // Auto-select default address
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
      name: '',
      phone: '',
      type: 'home',
      houseNumber: '',
      colony: '',
      street: '',
      landmark: '',
      city: '',
      state: '',
      pinCode: '',
      alternativePhone: '',
      location: null,
      isDefault: false,
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
        } catch (error) {
          console.error('Geocoding error:', error);
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

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

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

  const handleDelete = (addressId) => {
    dispatch(deleteAddress(addressId));
  };

  const handleSetDefault = (addressId) => {
    dispatch(setDefaultAddress(addressId));
  };

  const handleSelectAddress = (address) => {
    setSelectedId(address._id);
    onSelectAddress?.(address);
  };

  return (
    <Paper elevation={elevation} sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Delivery Addresses</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={handleOpenAddDialog} disabled={loading}>
          Add New
        </Button>
      </Box>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      <RadioGroup value={selectedId} onChange={(e) => {
        const addr = addresses.find((a) => a._id === e.target.value);
        if (addr) handleSelectAddress(addr);
      }}>
        <List>
          {Array.isArray(addresses) && addresses.length > 0 ? (
            addresses.map((address, index) => (
              <React.Fragment key={address._id}>
                <ListItem
                  secondaryAction={
                    <Box>
                      <IconButton edge="end" onClick={() => handleOpenEditDialog(address)} disabled={loading}>
                        <Edit />
                      </IconButton>
                      <IconButton edge="end" onClick={() => handleDelete(address._id)} disabled={loading}>
                        <Delete />
                      </IconButton>
                    </Box>
                  }
                >
                  <MFormControlLabel
                    value={address._id}
                    control={<Radio />}
                    label={
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {address.type === 'home' ? <HomeIcon sx={{ mr: 1 }} /> : <WorkIcon sx={{ mr: 1 }} />}
                            <Typography variant="subtitle1">
                              {address.type.charAt(0).toUpperCase() + address.type.slice(1)}
                              {address.isDefault && <Chip label="Default" size="small" sx={{ ml: 1 }} />}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Box component="span">
                            <Typography component="span" variant="body2">
                              {address.houseNumber}, {address.colony && `${address.colony}, `}{address.street}
                            </Typography>
                            {address.landmark && (
                              <Typography component="span" variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                                Landmark: {address.landmark}
                              </Typography>
                            )}
                            <Typography component="span" variant="body2">
                              {address.city}, {address.state} - {address.pinCode}
                            </Typography>
                          </Box>
                        }
                      />
                    }
                    sx={{ flexGrow: 1, m: 0 }}
                  />
                  {!address.isDefault && (
                    <Button variant="outlined" size="small" onClick={() => handleSetDefault(address._id)} sx={{ ml: 2 }}>
                      Set as Default
                    </Button>
                  )}
                </ListItem>
                {index < addresses.length - 1 && <Divider />}
              </React.Fragment>
            ))
          ) : (
            <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
              No addresses saved
            </Typography>
          )}
        </List>
      </RadioGroup>

      {/* Add / Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="sm">
        <DialogTitle>{isEditing ? 'Edit Address' : 'Add New Address'}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Address Type</InputLabel>
              <Select
                name="type"
                value={newAddress.type}
                onChange={handleInputChange}
                label="Address Type"
              >
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
              sx={{ mb: 3 }}
            >
              {locationLoading ? 'Detecting...' : 'Detect My Current Location'}
            </Button>
            <TextField
              fullWidth
              label="Recipient Name *"
              name="name"
              value={newAddress.name}
              onChange={handleInputChange}
              sx={{ mb: 2 }}
              required
            />
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                fullWidth
                label="House/Flat No *"
                name="houseNumber"
                value={newAddress.houseNumber}
                onChange={handleInputChange}
                required
              />
              <TextField
                fullWidth
                label="Colony/Area"
                name="colony"
                value={newAddress.colony}
                onChange={handleInputChange}
              />
            </Box>
            <TextField
              fullWidth
              label="Street Address *"
              name="street"
              value={newAddress.street}
              onChange={handleInputChange}
              sx={{ mb: 2 }}
              required
            />
            <TextField
              fullWidth
              label="Landmark (Optional)"
              name="landmark"
              value={newAddress.landmark}
              onChange={handleInputChange}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="City *"
              name="city"
              value={newAddress.city}
              onChange={handleInputChange}
              sx={{ mb: 2 }}
              required
            />
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                fullWidth
                label="State *"
                name="state"
                value={newAddress.state}
                onChange={handleInputChange}
                required
              />
              <TextField
                fullWidth
                label="PIN Code *"
                name="pinCode"
                value={newAddress.pinCode}
                onChange={handleInputChange}
                required
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                fullWidth
                label="Phone Number *"
                name="phone"
                value={newAddress.phone}
                onChange={handleInputChange}
                required
              />
              <TextField
                fullWidth
                label="Alt Phone (Optional)"
                name="alternativePhone"
                value={newAddress.alternativePhone}
                onChange={handleInputChange}
              />
            </Box>
            <FormControlLabel
              control={<Checkbox name="isDefault" checked={newAddress.isDefault} onChange={handleInputChange} />}
              label="Set as default address"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={isEditing ? handleUpdate : handleAdd}
            variant="contained"
            disabled={
              loading ||
              !newAddress.name ||
              !newAddress.phone ||
              !newAddress.houseNumber ||
              !newAddress.street ||
              !newAddress.city ||
              !newAddress.state ||
              !newAddress.pinCode
            }
          >
            {isEditing ? 'Update' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default AddressManager;