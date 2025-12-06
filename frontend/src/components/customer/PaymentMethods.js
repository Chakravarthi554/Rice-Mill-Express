import React, { useState, useEffect } from 'react';
import {
  Paper, Typography, List, ListItem, ListItemText,
  ListItemSecondaryAction, IconButton, Button, TextField,
  Alert, CircularProgress, Box
} from '@mui/material';
import { CreditCard, Delete } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import {
  addPaymentMethod, deletePaymentMethod, getUserDetails
} from '../../redux/actions/userActions';

const PaymentMethods = () => {
  const dispatch = useDispatch();
  const { userInfo } = useSelector(state => state.userLogin);
  const { loading, error, success } = useSelector(state => state.userPaymentMethods || {});

  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  useEffect(() => {
    dispatch(getUserDetails('profile'));
  }, [dispatch]);

  useEffect(() => {
    if (success) {
      setCardNumber(''); setExpiry(''); setCvv('');
      dispatch(getUserDetails('profile'));
    }
  }, [success, dispatch]);

  const handleAdd = (e) => {
    e.preventDefault();
    dispatch(addPaymentMethod({ cardNumber, expiry, cvv }));
  };

  const paymentMethods = userInfo?.paymentMethods || [];

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>Saved Payment Methods</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <List>
        {paymentMethods.map(m => (
          <ListItem key={m._id}>
            <ListItemText primary={m.cardType || 'Card'} secondary={`**** ${m.last4}`} />
            <ListItemSecondaryAction>
              <IconButton color="error" onClick={() => dispatch(deletePaymentMethod(m._id))} disabled={loading}>
                <Delete />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>

      <Box component="form" onSubmit={handleAdd} sx={{ mt: 3 }}>
        <Typography variant="subtitle1" sx={{ mb: 2 }}>Add New Card</Typography>
        <TextField fullWidth label="Card Number" value={cardNumber} onChange={e => setCardNumber(e.target.value)} sx={{ mb: 2 }} />
        <TextField fullWidth label="Expiry (MM/YY)" value={expiry} onChange={e => setExpiry(e.target.value)} sx={{ mb: 2 }} />
        <TextField fullWidth label="CVR" value={cvv} onChange={e => setCvv(e.target.value)} sx={{ mb: 2 }} />
        <Button type="submit" variant="contained" disabled={loading}>
          {loading ? <CircularProgress size={20} /> : 'Add Card'}
        </Button>
      </Box>
    </Paper>
  );
};
export default PaymentMethods;