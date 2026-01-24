import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box, Typography, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow,
  Paper, Button, Avatar,
  Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Grid,
  CircularProgress, IconButton, MenuItem,
  FormControl, InputLabel, Select
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import {
  listDeliveryPartners,
  updateDeliveryPartner,
  deleteDeliveryPartner,
  assignDeliveryPartner,
  listOrdersForDelivery
} from '../../redux/actions/deliveryActions';
import Message from '../common/Message';
import { OrderTrackingSocket } from '../../utils/socket'; // Import socket utility

const SellerDelivery = () => {
  const dispatch = useDispatch();

  const [openDialog, setOpenDialog] = useState(false);
  const [openAssignDialog, setOpenAssignDialog] = useState(false);
  const [currentPartner, setCurrentPartner] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [partnerId, setPartnerId] = useState('');
  const [partnerData, setPartnerData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    vehicleType: '',
    vehicleNumber: '',
    licenseNumber: '',
    aadharNumber: '',
    panNumber: ''
  });
  const [kycFiles, setKycFiles] = useState({
    aadharPhoto: null,
    panPhoto: null,
    driverPhoto: null
  });
  const deliveryPartnerList = useSelector(state => state.deliveryPartnerList || {});
  const {
    loading: partnersLoading,
    error: partnersError,
    partners = []
  } = deliveryPartnerList;
  const deliveryPartnerAction = useSelector(state => state.deliveryPartnerAction || {});
  const {
    loading: partnerActionLoading,
    error: partnerActionError,
    success: partnerActionSuccess
  } = deliveryPartnerAction;
  const orderListForDelivery = useSelector(state => state.orderListForDelivery || {});
  const {
    loading: ordersLoading,
    error: ordersError,
    orders = []
  } = orderListForDelivery;

  // Set up socket for real-time updates
  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};
    let socket = null;
    if (userInfo.user?._id) {
      socket = new OrderTrackingSocket(
        userInfo.user._id,
        userInfo.user.role,
        userInfo.token,
        (data) => {
          console.log('🔌 Socket event received:', data);
          if (data.type === 'ORDER_UPDATE') {
            console.log('🔄 Refreshing orders due to socket update');
            dispatch(listOrdersForDelivery());
          }
        }
      );
      return () => socket.cleanup();
    }
  }, [dispatch]);

  useEffect(() => {
    dispatch(listDeliveryPartners());
    dispatch(listOrdersForDelivery());

    // Auto-refresh removed to stop blinking. Socket updates handle real-time changes.
    // const interval = setInterval(() => {
    //   dispatch(listDeliveryPartners());
    //   dispatch(listOrdersForDelivery());
    // }, 10000);

    // return () => clearInterval(interval);
  }, [dispatch, partnerActionSuccess]);

  // Debug logging for partners
  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    console.log('👤 Current User Info:', {
      userId: userInfo.user?._id,
      role: userInfo.user?.role,
      name: userInfo.user?.name
    });
    console.log('📋 Partners state updated:', {
      loading: partnersLoading,
      error: partnersError,
      count: partners.length,
      partners: partners.map(p => ({
        id: p._id,
        name: p.name,
        kycStatus: p.kycStatus,
        seller: p.seller,
        vehicleNumber: p.vehicle_number
      }))
    });
  }, [partners, partnersLoading, partnersError]);

  useEffect(() => {
    if (currentPartner) {
      setPartnerData({
        name: currentPartner.name || '',
        phone: currentPartner.phone || '',
        vehicleType: currentPartner.vehicle_type || '',
        vehicleNumber: currentPartner.vehicle_number || '',
        licenseNumber: currentPartner.license_number || ''
      });
    } else {
      setPartnerData({
        name: '',
        phone: '',
        vehicleType: '',
        vehicleNumber: '',
        licenseNumber: '',
        aadharNumber: '',
        panNumber: ''
      });
      setKycFiles({
        aadharPhoto: null,
        panPhoto: null,
        driverPhoto: null
      });
    }
  }, [currentPartner]);

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      setKycFiles(prev => ({ ...prev, [name]: files[0] }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPartnerData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    const payload = {
      name: partnerData.name,
      phone: partnerData.phone,
      email: partnerData.email,
      password: partnerData.password,
      vehicle_type: partnerData.vehicleType,
      vehicle_number: partnerData.vehicleNumber,
      license_number: partnerData.licenseNumber,
    };

    // Validate required fields
    if (!payload.name || !payload.vehicle_type || !payload.vehicle_number || !payload.license_number) {
      alert('Name, Vehicle Type, Vehicle Number, and License Number are required');
      return;
    }

    // Require either phone OR (email + password)
    const hasPhoneAuth = payload.phone && payload.phone.trim();
    const hasEmailAuth = payload.email && payload.email.trim() && payload.password && payload.password.trim();

    if (!hasPhoneAuth && !hasEmailAuth) {
      alert('Please provide either Phone Number OR both Email and Password for login credentials');
      return;
    }

    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      let partnerId;

      if (currentPartner) {
        await dispatch(updateDeliveryPartner(currentPartner._id, payload));
        partnerId = currentPartner._id;
      } else {
        // Create new partner using direct API call to get ID
        const response = await fetch('/api/delivery-partners/partners', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userInfo.token}`
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          // Extract the actual error message from backend
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to create partner');
        }
        const createdPartner = await response.json();
        partnerId = createdPartner._id;

        // Update Redux state
        dispatch(listDeliveryPartners());
      }

      // Upload KYC files if any
      if (partnerId && (kycFiles.aadharPhoto || kycFiles.panPhoto || kycFiles.driverPhoto || partnerData.aadharNumber || partnerData.panNumber)) {
        const formData = new FormData();
        if (partnerData.aadharNumber) formData.append('aadharNumber', partnerData.aadharNumber);
        if (partnerData.panNumber) formData.append('panNumber', partnerData.panNumber);
        if (kycFiles.aadharPhoto) formData.append('aadharPhoto', kycFiles.aadharPhoto);
        if (kycFiles.panPhoto) formData.append('panPhoto', kycFiles.panPhoto);
        if (kycFiles.driverPhoto) formData.append('driverPhoto', kycFiles.driverPhoto);

        const kycResponse = await fetch(`/api/delivery-partners/partners/${partnerId}/kyc`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${userInfo.token}`
          },
          body: formData
        });

        if (!kycResponse.ok) throw new Error('KYC upload failed');

        alert('Partner and KYC documents submitted successfully!');
        dispatch(listDeliveryPartners());
      } else {
        alert('Partner created successfully!');
      }

      setOpenDialog(false);
    } catch (error) {
      console.error('Error:', error);
      alert(error.message || 'Failed to create partner. Please try again.');
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this delivery partner?')) {
      dispatch(deleteDeliveryPartner(id));
    }
  };

  const handleOpenAssignDialog = (order) => {
    setSelectedOrder(order);
    setPartnerId(order?.deliveryPartner?._id || '');
    setOpenAssignDialog(true);
  };

  const handleAssign = () => {
    console.log('👆 Assigning partner:', {
      orderId: selectedOrder?._id,
      partnerId: partnerId,
      order: selectedOrder
    });

    if (selectedOrder && partnerId) {
      dispatch(assignDeliveryPartner(selectedOrder._id, { partnerId }));
    } else {
      console.error('❌ Cannot assign: Missing order or partner ID');
    }
    setOpenAssignDialog(false);
    // Refresh the orders list after assignment
    dispatch(listOrdersForDelivery());
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Delivery Management
      </Typography>

      {partnersError && <Message severity="error">{partnersError}</Message>}
      {partnerActionError && <Message severity="error">{partnerActionError}</Message>}
      {ordersError && <Message severity="error">{ordersError}</Message>}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setCurrentPartner(null);
            setOpenDialog(true);
          }}
        >
          Add Delivery Partner
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Delivery Partners Table */}
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1" gutterBottom>
            Delivery Partners
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Partner</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell>Vehicle</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {partnersLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : partners.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      No delivery partners found
                    </TableCell>
                  </TableRow>
                ) : (
                  partners.map(partner => (
                    <TableRow key={partner._id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ mr: 2 }}>{partner.name.charAt(0)}</Avatar>
                          {partner.name}
                        </Box>
                      </TableCell>
                      <TableCell>{partner.phone}</TableCell>
                      <TableCell>{partner.vehicle_type} ({partner.vehicle_number})</TableCell>
                      <TableCell>
                        <IconButton onClick={() => {
                          setCurrentPartner(partner);
                          setOpenDialog(true);
                        }}>
                          <EditIcon color="primary" />
                        </IconButton>
                        <IconButton onClick={() => handleDelete(partner._id)}>
                          <DeleteIcon color="error" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>

        {/* Orders Table */}
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1" gutterBottom>
            Orders Ready for Delivery
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Order ID</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Assigned Partner</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ordersLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      No orders ready for delivery
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map(order => (
                    <TableRow key={order._id}>
                      <TableCell>{order._id.substring(0, 8)}</TableCell>
                      <TableCell>{order.user?.name}</TableCell>
                      <TableCell>{order.orderStatus}</TableCell>
                      <TableCell>
                        {order.deliveryPartner ? `${order.deliveryPartner.name} (${order.deliveryPartner.vehicle_number})` : 'Not Assigned'}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => handleOpenAssignDialog(order)}
                          disabled={!!order.deliveryPartner}
                        >
                          Assign Partner
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>

      {/* Add/Edit Partner Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{currentPartner ? 'Edit Delivery Partner' : 'Add Delivery Partner'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Name"
                name="name"
                value={partnerData.name}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Phone Number"
                name="phone"
                type="tel"
                value={partnerData.phone}
                onChange={handleInputChange}
                helperText="Required for OTP login"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email (Optional)"
                name="email"
                type="email"
                value={partnerData.email}
                onChange={handleInputChange}
                helperText="Optional: Provide email+password for email login"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Password (Optional)"
                name="password"
                type="password"
                value={partnerData.password}
                onChange={handleInputChange}
                helperText="Required only if email is provided"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Vehicle Type"
                name="vehicleType"
                value={partnerData.vehicleType}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Vehicle Number"
                name="vehicleNumber"
                value={partnerData.vehicleNumber}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="License Number"
                name="licenseNumber"
                value={partnerData.licenseNumber}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Aadhaar Number"
                name="aadharNumber"
                value={partnerData.aadharNumber}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="PAN Number"
                name="panNumber"
                value={partnerData.panNumber}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>Upload KYC Documents</Typography>
              <Button variant="outlined" component="label" fullWidth sx={{ mb: 1 }}>
                Upload Aadhaar Photo
                <input type="file" name="aadharPhoto" hidden accept="image/*" onChange={handleFileChange} />
              </Button>
              {kycFiles.aadharPhoto && <Typography variant="caption" color="success.main">✓ {kycFiles.aadharPhoto.name}</Typography>}
            </Grid>
            <Grid item xs={12}>
              <Button variant="outlined" component="label" fullWidth sx={{ mb: 1 }}>
                Upload PAN Photo
                <input type="file" name="panPhoto" hidden accept="image/*" onChange={handleFileChange} />
              </Button>
              {kycFiles.panPhoto && <Typography variant="caption" color="success.main">✓ {kycFiles.panPhoto.name}</Typography>}
            </Grid>
            <Grid item xs={12}>
              <Button variant="outlined" component="label" fullWidth sx={{ mb: 1 }}>
                Upload Driver Photo
                <input type="file" name="driverPhoto" hidden accept="image/*" onChange={handleFileChange} />
              </Button>
              {kycFiles.driverPhoto && <Typography variant="caption" color="success.main">✓ {kycFiles.driverPhoto.name}</Typography>}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={partnerActionLoading}>
            {currentPartner ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assign Partner Dialog */}
      <Dialog open={openAssignDialog} onClose={() => setOpenAssignDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Delivery Partner</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Delivery Partner</InputLabel>
            <Select
              value={partnerId}
              onChange={(e) => setPartnerId(e.target.value)}
              label="Delivery Partner"
            >
              {partners.map((partner) => (
                <MenuItem key={partner._id} value={partner._id}>
                  {partner.name} - {partner.vehicle_number}
                  {partner.kycStatus === 'approved' && ' ✅ Verified'}
                  {partner.kycStatus === 'pending' && ' ⏳ Pending'}
                  {partner.kycStatus === 'rejected' && ' ❌ Rejected'}
                </MenuItem>
              ))}
            </Select>
            {partnersLoading ? (
              <Typography variant="caption" color="info.main" sx={{ mt: 1, display: 'block' }}>
                Loading partners...
              </Typography>
            ) : partners.length === 0 ? (
              <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                No delivery partners found. Please add partners first.
              </Typography>
            ) : (
              <Typography variant="caption" color="info.main" sx={{ mt: 1, display: 'block' }}>
                Total partners: {partners.length} | Approved: {partners.filter(p => p.kycStatus === 'approved').length}
              </Typography>
            )}
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAssignDialog(false)}>Cancel</Button>
          <Button onClick={handleAssign} variant="contained" disabled={!partnerId || partnerActionLoading}>
            Assign
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SellerDelivery;