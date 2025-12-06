import React, { useEffect } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Button, CircularProgress, Alert, Box, Typography
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { listMyOrders, cancelOrder } from '../../redux/actions/orderActions';
import OrderTracker from './OrderTracker';

const OrderHistory = () => {
  const dispatch = useDispatch();
  const { loading, error, orders } = useSelector(state => state.orderListMy);
  const { success: cancelSuccess } = useSelector(state => state.orderCancel);

  useEffect(() => {
    dispatch(listMyOrders());
  }, [dispatch, cancelSuccess]);

  const handleCancel = (orderId) => {
    const reason = window.prompt('Reason for cancellation:');
    if (reason && window.confirm('Cancel order?')) {
      dispatch(cancelOrder(orderId, reason));
    }
  };

  if (loading) return <CircularProgress sx={{ display: 'block', mx: 'auto', my: 4 }} />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <TableContainer component={Paper} sx={{ mt: 3 }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell><strong>ID</strong></TableCell>
            <TableCell><strong>Date</strong></TableCell>
            <TableCell><strong>Total</strong></TableCell>
            <TableCell><strong>Status</strong></TableCell>
            <TableCell><strong>Actions</strong></TableCell>
            <TableCell><strong>Tracking</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {orders.map(o => (
            <TableRow key={o._id}>
              <TableCell>{o._id}</TableCell>
              <TableCell>{new Date(o.createdAt).toLocaleDateString()}</TableCell>
              <TableCell>₹{o.totalPrice}</TableCell>
              <TableCell>{o.orderStatus}</TableCell>
              <TableCell>
                {['placed', 'processing', 'packed'].includes(o.orderStatus.toLowerCase()) && (
                  <Button size="small" color="error" variant="outlined" onClick={() => handleCancel(o._id)}>
                    Cancel
                  </Button>
                )}
              </TableCell>
              <TableCell><OrderTracker order={o} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
export default OrderHistory;