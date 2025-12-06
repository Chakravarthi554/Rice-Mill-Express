import React, { useEffect } from 'react';
import {
  Paper, Typography, List, ListItem, ListItemText,
  ListItemSecondaryAction, Button, Alert, CircularProgress
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { listMyOrders } from '../../redux/actions/orderActions';

const RefundsReturns = () => {
  const dispatch = useDispatch();
  const { orders, loading, error } = useSelector(state => state.orderListMy);

  useEffect(() => {
    dispatch(listMyOrders());
  }, [dispatch]);

  const refundOrders = orders.filter(o => ['refunded', 'returned'].includes(o.orderStatus.toLowerCase()));

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>Refunds & Returns</Typography>
      {loading && <CircularProgress sx={{ display: 'block', mx: 'auto', my: 2 }} />}
      {error && <Alert severity="error">{error}</Alert>}
      {refundOrders.length === 0 && !loading && (
        <Typography color="text.secondary">No refunds or returns yet.</Typography>
      )}
      <List>
        {refundOrders.map(o => (
          <ListItem key={o._id}>
            <ListItemText
              primary={`Order #${o._id}`}
              secondary={`Status: ${o.orderStatus} – ₹${o.totalPrice}`}
            />
            <ListItemSecondaryAction>
              <Button variant="outlined" size="small">Details</Button>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};
export default RefundsReturns;