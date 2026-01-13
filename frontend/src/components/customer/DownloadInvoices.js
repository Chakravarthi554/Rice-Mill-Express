import React, { useEffect, useState } from 'react';
import {
  Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Button, CircularProgress, Alert, Box
} from '@mui/material';
import { Download as DownloadIcon, Visibility as VisibilityIcon } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { listMyOrders, downloadInvoice } from '../../redux/actions/orderActions';
import { useNavigate } from 'react-router-dom';

const DownloadInvoices = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { orders, loading, error } = useSelector(state => state.orderListMy);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    dispatch(listMyOrders());
  }, [dispatch]);

  const handleDownload = async (orderId) => {
    setDownloadingId(orderId);
    const result = await dispatch(downloadInvoice(orderId));
    setDownloadingId(null);
    if (!result.success) {
      alert(result.error || 'Failed to download invoice');
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 'medium' }}>
        Download Invoices
      </Typography>
      {loading ? (
        <CircularProgress sx={{ display: 'block', mx: 'auto', my: 4 }} />
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : orders && orders.length > 0 ? (
        <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead sx={{ backgroundColor: 'grey.100' }}>
              <TableRow>
                <TableCell><strong>Order ID</strong></TableCell>
                <TableCell><strong>Date</strong></TableCell>
                <TableCell><strong>Amount</strong></TableCell>
                <TableCell align="center"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((o) => (
                <TableRow key={o._id} hover>
                  <TableCell>#{o._id.toString().slice(-8).toUpperCase()}</TableCell>
                  <TableCell>{new Date(o.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>₹{(o.totalPrice || 0).toFixed(2)}</TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<VisibilityIcon />}
                        onClick={() => navigate(`/orders/${o._id}`)}
                      >
                        Details
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        startIcon={downloadingId === o._id ? <CircularProgress size={16} color="inherit" /> : <DownloadIcon />}
                        onClick={() => handleDownload(o._id)}
                        disabled={downloadingId !== null}
                      >
                        {downloadingId === o._id ? 'Downloading...' : 'Invoice'}
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Typography variant="body1" sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
          No orders found to generate invoices.
        </Typography>
      )}
    </Box>
  );
};

export default DownloadInvoices;