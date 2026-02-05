import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputLabel,
  Select,
  MenuItem,
  Paper,
} from '@mui/material';
import jsPDF from 'jspdf';
import api from '../../utils/api';
import FileUpload from '../common/FileUpload';

const SellerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [partnerId, setPartnerId] = useState('');
  const [deliveryPartners, setDeliveryPartners] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('');
  const [showReplacements, setShowReplacements] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const queryParams = showReplacements ? '?hasReplacementRequest=true' : '';
        const [ordersRes, partnersRes, productsRes] = await Promise.all([
          api.get(`/api/orders/sellerorders${queryParams}`),
          api.get('/api/users/delivery-partners'),
          api.get('/api/products/seller'),
        ]);
        setOrders(ordersRes.data.orders || ordersRes.data || []); // Handle both paginated and flat response
        setDeliveryPartners(partnersRes.data || []);
        setProducts(productsRes.data || []);
        setError(null);
      } catch (error) {
        console.error('Error fetching data:', error.response?.status, error.response?.data?.message || error.message);
        setError(`Failed to fetch data: ${error.response?.data?.message || 'Server error. Check backend logs.'}`);
      }
    };
    fetchData();
  }, [showReplacements]);

  const handleOpenDialog = (order) => {
    setSelectedOrder(order);
    setSelectedProducts(order.orderItems || []);
    setPartnerId(order.deliveryPartner?._id || '');
    setPaymentStatus(order.paymentVerificationStatus || '');
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedOrder(null);
    setSelectedProducts([]);
    setPartnerId('');
    setPaymentStatus('');
  };

  const handleSaveOrder = async () => {
    try {
      const response = await api.put(`/api/orders/${selectedOrder._id}`, {
        orderItems: selectedProducts,
        deliveryPartner: partnerId,
        paymentVerificationStatus: paymentStatus,
      });
      setOrders(orders.map(order => (order._id === selectedOrder._id ? response.data : order)));
      handleCloseDialog();
      setError(null);
    } catch (error) {
      console.error('Error updating order:', error.response?.status, error.response?.data?.message || error.message);
      setError(`Failed to update order: ${error.response?.data?.message || 'Server error.'}`);
    }
  };

  const handleAssignPartner = async () => {
    try {
      const response = await api.put(`/api/orders/${selectedOrder._id}/assign-partner`, { partnerId });
      console.log('Assign partner response:', response.data);
      const ordersRes = await api.get('/api/orders/sellerorders');
      setOrders(ordersRes.data || []);
      setError(null);
    } catch (error) {
      console.error('Error assigning partner:', error.response?.status, error.response?.data?.message || error.message);
      setError(`Failed to assign partner: ${error.response?.data?.message || 'Server error.'}`);
    }
  };

  const handleCodUpload = async (file) => {
    const formData = new FormData();
    formData.append('proof', file);
    try {
      const response = await api.put(`/api/orders/${selectedOrder._id}/cod-proof`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPaymentStatus('verified');
      setOrders(orders.map(order => (order._id === selectedOrder._id ? response.data : order)));
      setError(null);
    } catch (error) {
      console.error('Error uploading COD proof:', error.response?.status, error.response?.data?.message || error.message);
      setError(`Failed to upload COD proof: ${error.response?.data?.message || 'Server error.'}`);
    }
  };

  const handleReplacementReview = async (decision) => {
    if (!window.confirm(`Are you sure you want to ${decision} this replacement request?`)) return;

    try {
      const response = await api.put(`/api/delivery-partners/orders/${selectedOrder._id}/replacement-review`, {
        decision,
        notes: `Manual ${decision} by seller`
      });

      setOrders(orders.map(order => (order._id === selectedOrder._id ? response.data : order)));
      setSelectedOrder(response.data); // Update the modal content
      alert(`Replacement request ${decision}ed successfully!`);
    } catch (error) {
      console.error('Error reviewing replacement:', error);
      alert('Failed to update replacement status');
    }
  };

  const handleRedispatch = async () => {
    if (!partnerId) {
      alert('Please select a delivery partner');
      return;
    }

    if (!window.confirm('Are you sure you want to re-dispatch this replacement?')) return;

    try {
      const response = await api.post(`/api/delivery-partners/orders/${selectedOrder._id}/redispatch`, {
        deliveryPartnerId: partnerId
      });

      setOrders(orders.map(order => (order._id === selectedOrder._id ? response.data.order : order)));
      handleCloseDialog();
      alert('Replacement re-dispatched successfully!');
    } catch (error) {
      console.error('Error re-dispatching replacement:', error);
      alert(`Failed to re-dispatch: ${error.response?.data?.message || 'Server error'}`);
    }
  };

  const generatePDF = (order) => {
    const doc = new jsPDF();
    const margin = 10;
    let y = margin;

    // Header
    doc.setFillColor(0, 128, 0);
    doc.rect(0, 0, doc.internal.pageSize.width, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text('Invoice', margin, y + 15);
    y += 30;

    // Order Details
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.text(`Order ID: ${order._id || 'N/A'}`, margin, y);
    doc.text(`Order Date: ${new Date(order.createdAt).toLocaleDateString() || 'N/A'}`, margin, y + 5);
    y += 15;

    // Customer Details
    doc.text('Recipient Details:', margin, y);
    doc.text(`Name: ${order.user?.name || 'N/A'}`, margin, y + 5);
    doc.text(`Phone: ${order.user?.phone || 'N/A'}`, margin, y + 10);
    doc.text(`Address: ${formatAddress(order.shippingAddress)}`, margin, y + 15);
    y += 30;

    // Seller Details
    doc.text('Sender Details:', margin, y);
    doc.text(`Seller: ${order.seller?.name || 'N/A'}`, margin, y + 5);
    doc.text(`Phone: ${order.seller?.phone || 'N/A'}`, margin, y + 10);

    // Footer
    doc.setFillColor(0, 128, 0);
    doc.rect(0, doc.internal.pageSize.height - 20, doc.internal.pageSize.width, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text('Thank you for your business!', doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center' });

    // Open in new tab
    window.open(doc.output('bloburl'), '_blank');
  };

  const formatAddress = (address) => {
    if (!address) return 'N/A';
    return `${address.street || ''}, ${address.city || ''}, ${address.state || ''} - ${address.pinCode || ''}`.trim();
  };

  const isAddressValid = (address) => {
    return !!address;
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
          Seller Orders
        </Typography>
        <Button
          variant={showReplacements ? "contained" : "outlined"}
          color="warning"
          onClick={() => setShowReplacements(!showReplacements)}
        >
          {showReplacements ? "Show All Orders" : "Show Replacement Requests"}
        </Button>
      </Box>
      {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
      <TableContainer component={Paper} elevation={3} sx={{ borderRadius: 2 }}>
        <Table size="small">
          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
            <TableRow>
              <TableCell>Order ID</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Shipping Address</TableCell>
              <TableCell>Total Amount</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.map((order) => {
              const hasPendingReplacement = order.hasReplacementRequest && order.replacementStatus === 'requested';
              const rowStyle = hasPendingReplacement ? { backgroundColor: '#fff3e0' } : {};

              return (
                <TableRow key={order._id} sx={rowStyle}>
                  <TableCell>
                    {order._id.substring(18)}
                    {hasPendingReplacement && (
                      <Box component="span" sx={{ ml: 1, bgcolor: '#ff9800', color: 'white', px: 0.5, py: 0.25, borderRadius: 1, fontSize: '0.7rem' }}>
                        REPLACEMENT
                      </Box>
                    )}
                  </TableCell>
                  <TableCell>{order.user?.name} ({order.user?.phone})</TableCell>
                  <TableCell>{formatAddress(order.shippingAddress)}</TableCell>
                  <TableCell>₹{order.totalPrice?.toFixed(2) || '0.00'}</TableCell>
                  <TableCell>
                    {hasPendingReplacement ? (
                      <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#e65100' }}>
                        Replacement Requested
                      </Typography>
                    ) : (
                      order.orderStatus
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant={hasPendingReplacement ? "contained" : "contained"}
                      color={hasPendingReplacement ? "warning" : "primary"}
                      size="small"
                      sx={{ mr: 1 }}
                      onClick={() => handleOpenDialog(order)}
                    >
                      {hasPendingReplacement ? "Review Request" : "View Details"}
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      color="secondary"
                      onClick={() => generatePDF(order)}
                      disabled={!isAddressValid(order.shippingAddress)}
                    >
                      Print Invoice
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Order Details Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>Order Details</DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Box>
              <Typography><strong>Order ID:</strong> {selectedOrder._id}</Typography>
              <Typography><strong>Status:</strong> {selectedOrder.orderStatus}</Typography>
              <Typography><strong>Customer:</strong> {selectedOrder.user?.name} ({selectedOrder.user?.phone})</Typography>
              <Typography><strong>Shipping Address:</strong> {formatAddress(selectedOrder.shippingAddress)}</Typography>
              <Typography><strong>Total Amount:</strong> ₹{selectedOrder.totalPrice?.toFixed(2)}</Typography>

              {/* Replacement Request Section */}
              {selectedOrder.hasReplacementRequest && (
                <Paper variant="outlined" sx={{ p: 2, mt: 2, borderColor: '#ff9800', backgroundColor: '#fff3e0' }}>
                  <Typography variant="h6" color="#e65100" gutterBottom>
                    Replacement Request
                  </Typography>
                  <Typography><strong>Status:</strong> {selectedOrder.replacementStatus.toUpperCase()}</Typography>
                  <Typography><strong>Reason:</strong> {selectedOrder.replacementReason}</Typography>
                  <Typography><strong>Description:</strong> {selectedOrder.replacementDescription}</Typography>
                  {selectedOrder.replacementPhotoUrl && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="subtitle2">Proof Photo:</Typography>
                      <img
                        src={`http://localhost:5000${selectedOrder.replacementPhotoUrl}`}
                        alt="Damage Proof"
                        style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 4, marginTop: 4 }}
                      />
                    </Box>
                  )}

                  {/* Action Buttons for Replacement */}
                  {selectedOrder.replacementStatus === 'requested' && (
                    <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                      <Button
                        variant="contained"
                        color="success"
                        onClick={() => handleReplacementReview('approve')}
                      >
                        Approve Replacement
                      </Button>
                      <Button
                        variant="contained"
                        color="error"
                        onClick={() => handleReplacementReview('reject')}
                      >
                        Reject
                      </Button>
                      <Button
                        variant="outlined"
                        color="warning"
                        onClick={() => handleReplacementReview('refund')}
                      >
                        Approve Refund
                      </Button>
                    </Box>
                  )}

                  {/* Re-dispatch Section for Approved Replacements */}
                  {selectedOrder.replacementStatus === 'approved' && (
                    <Box sx={{ mt: 2, p: 2, bgcolor: '#ffffff', borderRadius: 1, border: '1px solid #e0e0e0' }}>
                      <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                        Assign Delivery Partner for Replacement
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <Select
                          value={partnerId || ''}
                          onChange={(e) => setPartnerId(e.target.value)}
                          displayEmpty
                          size="small"
                          sx={{ minWidth: 200 }}
                        >
                          <MenuItem value="" disabled>Select Delivery Partner</MenuItem>
                          {deliveryPartners.map((partner) => (
                            <MenuItem key={partner._id} value={partner._id}>
                              {partner.name} ({partner.vehicle_type})
                            </MenuItem>
                          ))}
                        </Select>
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={handleRedispatch}
                          disabled={!partnerId}
                        >
                          Re-dispatch Order
                        </Button>
                      </Box>
                    </Box>
                  )}
                </Paper>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSaveOrder} variant="contained">Save</Button>
          <Button onClick={handleCloseDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SellerOrders;
