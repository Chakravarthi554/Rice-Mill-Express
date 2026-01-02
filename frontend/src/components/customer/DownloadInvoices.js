import React, { useEffect } from 'react';
import {
  Paper, Typography, List, ListItem, ListItemText,
  ListItemSecondaryAction, IconButton, CircularProgress, Alert
} from '@mui/material';
import { Download } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { listMyOrders } from '../../redux/actions/orderActions';
import axios from 'axios';

const DownloadInvoices = () => {
  const dispatch = useDispatch();
  const { orders, loading, error } = useSelector(state => state.orderListMy);
  const { userInfo } = useSelector(state => state.userLogin);

  useEffect(() => {
    dispatch(listMyOrders());
  }, [dispatch]);

  const handleDownload = async (orderId) => {
    try {
      const config = {
        responseType: 'blob',
        headers: {
          Authorization: `Bearer ${userInfo?.token}`
        }
      };

      const { data } = await axios.get(`/api/orders/${orderId}/invoice`, config);

      // Create blob and download
      const blob = new Blob([data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice_${orderId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Invoice download error:', err);
      alert('Failed to download invoice. Please try again.');
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>Download Invoices</Typography>
      {loading && <CircularProgress />}
      {error && <Alert severity="error">{error}</Alert>}
      <List>
        {orders && orders.map(o => (
          <ListItem key={o._id}>
            <ListItemText
              primary={`Order #${o._id}`}
              secondary={new Date(o.createdAt).toLocaleDateString()}
            />
            <ListItemSecondaryAction>
              <IconButton onClick={() => handleDownload(o._id)} disabled={loading}>
                <Download />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};
export default DownloadInvoices;