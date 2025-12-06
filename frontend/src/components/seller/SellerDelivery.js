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
  createDeliveryPartner,
  updateDeliveryPartner,
  deleteDeliveryPartner,
  assignDeliveryPartner,
  listOrdersForDelivery
} from '../../redux/actions/deliveryActions';
import Message from '../common/Message';
import Loader from '../common/Loader';
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
    vehicleType: '',
    vehicleNumber: '',
    licenseNumber: ''
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
    const { user } = JSON.parse(localStorage.getItem('userInfo')) || {};
    if (user?._id) {
      const socket = new OrderTrackingSocket(user._id, user.role, (data) => {
        if (data.type === 'orderUpdated') {
          dispatch(listOrdersForDelivery()); // Refresh orders when updated
        }
      });
      return () => socket.disconnect();
    }
  }, [dispatch]);

  useEffect(() => {
    dispatch(listDeliveryPartners());
    dispatch(listOrdersForDelivery());
  }, [dispatch, partnerActionSuccess]);

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
        licenseNumber: ''
      });
    }
  }, [currentPartner]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPartnerData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    const payload = {
      name: partnerData.name,
      phone: partnerData.phone,
      vehicle_type: partnerData.vehicleType,
      vehicle_number: partnerData.vehicleNumber,
      license_number: partnerData.licenseNumber,
    };
    if (!payload.name || !payload.phone || !payload.vehicle_type || !payload.vehicle_number || !payload.license_number) {
      alert('All fields are required: Name, Phone, Vehicle Type, Vehicle Number, License Number');
      return;
    }
    if (currentPartner) {
      dispatch(updateDeliveryPartner(currentPartner._id, payload));
    } else {
      dispatch(createDeliveryPartner(payload));
    }
    setOpenDialog(false);
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
    if (selectedOrder && partnerId) {
      dispatch(assignDeliveryPartner(selectedOrder._id, { deliveryPartner: partnerId, trackingNumber: '' }));
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
                label="Phone"
                name="phone"
                value={partnerData.phone}
                onChange={handleInputChange}
                required
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
                  {partner.name} - {partner.vehicle_number} ({partner.phone})
                </MenuItem>
              ))}
            </Select>
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