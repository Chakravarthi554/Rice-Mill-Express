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

  useEffect(() => {
    dispatch(listMyOrders());
  }, [dispatch]);

  const handleDownload = async (orderId) => {
    try {
      const { data } = await axios.get(`/api/orders/${orderId}/invoice`, {
        responseType: 'blob',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice_${orderId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to download invoice');
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>Download Invoices</Typography>
      {loading && <CircularProgress />}
      {error && <Alert severity="error">{error}</Alert>}
      <List>
        {orders.map(o => (
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