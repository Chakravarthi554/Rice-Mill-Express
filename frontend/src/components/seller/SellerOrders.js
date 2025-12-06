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
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersRes, partnersRes, productsRes] = await Promise.all([
          api.get('/api/orders/sellerorders'),
          api.get('/api/users/delivery-partners'),
          api.get('/api/products/seller'),
        ]);
        setOrders(ordersRes.data || []);
        setDeliveryPartners(partnersRes.data || []);
        setProducts(productsRes.data || []);
        setError(null);
      } catch (error) {
        console.error('Error fetching data:', error.response?.status, error.response?.data?.message || error.message);
        setError(`Failed to fetch data: ${error.response?.data?.message || 'Server error. Check backend logs.'}`);
      }
    };
    fetchData();
  }, []);

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
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
        Seller Orders
      </Typography>
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
            {orders.map((order) => (
              <TableRow key={order._id}>
                <TableCell>{order._id.substring(18)}</TableCell>
                <TableCell>{order.user?.name} ({order.user?.phone})</TableCell>
                <TableCell>{formatAddress(order.shippingAddress)}</TableCell>
                <TableCell>₹{order.totalPrice?.toFixed(2) || '0.00'}</TableCell>
                <TableCell>{order.orderStatus}</TableCell>
                <TableCell>
                  <Button
                    variant="contained"
                    size="small"
                    sx={{ mr: 1 }}
                    onClick={() => handleOpenDialog(order)}
                  >
                    View Details
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
            ))}
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
