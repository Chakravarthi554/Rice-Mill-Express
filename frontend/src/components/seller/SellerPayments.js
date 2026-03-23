// frontend/src/components/seller/SellerPayments.js
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box, Typography, Container, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Button, Chip, Dialog, DialogTitle, Snackbar,
  DialogContent, DialogActions, TextField, Grid, Divider, MenuItem,
  CircularProgress, Alert // Added Alert
} from '@mui/material';
import { grey } from '@mui/material/colors';
import {
  Payment as PaymentIcon,
  AttachMoney,
  Receipt,
  CheckCircle,
  Cancel,
  History // Icon for Payout History
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import {
  getSellerPayments,
  recordCodReceived, // Use specific action name
  requestPayout
} from '../../redux/actions/paymentActions';
import Message from '../common/Message';
import Loader from '../common/Loader';
import { PAYMENT_RECORD_COD_RESET, PAYOUT_REQUEST_RESET } from '../../redux/constants/paymentConstants'; // Import resets


const SellerPayments = () => {
  const dispatch = useDispatch();
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false); // For COD Recording
  const [openPayoutDialog, setOpenPayoutDialog] = useState(false); // For Payout Request
  const [selectedPayment, setSelectedPayment] = useState(null); // For COD dialog context
  const [paymentAmount, setPaymentAmount] = useState(0); // Amount for COD dialog
  const [payoutAmount, setPayoutAmount] = useState(0); // Amount for Payout dialog
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' }); // Simple snackbar state

  // Selectors with defaults
  const {
    payments = [],
    balance = { totalEarnings: 0, availableBalance: 0, pendingPayouts: 0 },
    payoutHistory = [], // Added payoutHistory selector
    loading: paymentsLoading = true,
    error: paymentsError = null
  } = useSelector(state => state.sellerPayments || {}); // Default structure

  const {
    loading: paymentRecordLoading,
    error: paymentRecordError,
    success: paymentRecordSuccess
  } = useSelector(state => state.paymentRecordCod || {}); // Use paymentRecordCod state

  const {
    loading: payoutRequestLoading,
    error: payoutRequestError,
    success: payoutRequestSuccess
  } = useSelector(state => state.payoutRequest || {});

  // Fetch initial data and refetch on success of actions
  useEffect(() => {
    dispatch(getSellerPayments());
    // Optionally clear success flags after refetching
    // if (paymentRecordSuccess) dispatch({ type: PAYMENT_RECORD_COD_RESET });
    // if (payoutRequestSuccess) dispatch({ type: PAYOUT_REQUEST_RESET });
  }, [dispatch, paymentRecordSuccess, payoutRequestSuccess]);

  // Show snackbar messages on success/error from actions
  useEffect(() => {
    if (paymentRecordSuccess) {
      setSnackbar({ open: true, message: 'COD Payment Recorded Successfully!', severity: 'success' });
      dispatch({ type: PAYMENT_RECORD_COD_RESET }); // Reset state
    }
    if (paymentRecordError) {
      setSnackbar({ open: true, message: `Error Recording COD: ${paymentRecordError}`, severity: 'error' });
      dispatch({ type: PAYMENT_RECORD_COD_RESET }); // Reset state
    }
  }, [paymentRecordSuccess, paymentRecordError, dispatch]);

  useEffect(() => {
    if (payoutRequestSuccess) {
      setSnackbar({ open: true, message: 'Payout Requested Successfully!', severity: 'success' });
      dispatch({ type: PAYOUT_REQUEST_RESET }); // Reset state
    }
    if (payoutRequestError) {
      setSnackbar({ open: true, message: `Error Requesting Payout: ${payoutRequestError}`, severity: 'error' });
      dispatch({ type: PAYOUT_REQUEST_RESET }); // Reset state
    }
  }, [payoutRequestSuccess, payoutRequestError, dispatch]);


  const handleOpenCodDialog = (payment) => {
    setSelectedPayment(payment);
    setPaymentAmount(payment.amount); // Pre-fill with expected amount
    setOpenPaymentDialog(true);
  };

  const handleRecordCodSubmit = () => {
    if (!selectedPayment?._id) return;
    dispatch(recordCodReceived(selectedPayment.order._id, paymentAmount)); // Pass Order ID
    setOpenPaymentDialog(false);
    // Refetch handled by useEffect
  };

  const handleRequestPayoutSubmit = () => {
    dispatch(requestPayout({ amount: payoutAmount }));
    setOpenPayoutDialog(false);
    setPayoutAmount(0);
    // Refetch handled by useEffect
  };

  const getPaymentStatusChip = (status = 'unknown') => { /* ... Keep as is ... */ };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" gutterBottom>Payment Dashboard</Typography>

        {/* Display High-Level Errors */}
        {paymentsError && <Message severity="error">{paymentsError}</Message>}

        {/* Balance Summary */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Total Earnings */}
          <Grid item xs={12} md={4}>
            <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>Total Earnings (After Commission)</Typography>
              <Typography variant="h4" color="primary">
                ₹{balance?.totalEarnings?.toFixed(2) || '0.00'}
              </Typography>
            </Paper>
          </Grid>
          {/* Available Balance */}
          <Grid item xs={12} md={4}>
            <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>Available for Payout</Typography>
              <Typography variant="h4" color="success.main">
                ₹{balance?.availableBalance?.toFixed(2) || '0.00'}
              </Typography>
            </Paper>
          </Grid>
          {/* Pending Payouts */}
          <Grid item xs={12} md={4}>
            <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>Pending Payouts</Typography>
              <Typography variant="h4" color="warning.main">
                ₹{balance?.pendingPayouts?.toFixed(2) || '0.00'}
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Payout Request Button */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button
            variant="contained"
            startIcon={<AttachMoney />}
            onClick={() => setOpenPayoutDialog(true)}
            disabled={!balance?.availableBalance || balance.availableBalance <= 0 || payoutRequestLoading}
          >
            Request Payout
          </Button>
        </Box>

        {/* Payments History Table */}
        <Typography variant="h6" gutterBottom>Payment Transactions</Typography>
        <TableContainer component={Paper} elevation={2} sx={{ mb: 4 }}>
          <Table aria-label="payment history table">
            <TableHead>
              <TableRow sx={{ backgroundColor: grey[100] }}>
                <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Order ID</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Amount (Total)</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Your Earning</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Method</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paymentsLoading ? (
                <TableRow><TableCell colSpan={7} align="center"><CircularProgress /></TableCell></TableRow>
              ) : payments.length === 0 ? (
                <TableRow><TableCell colSpan={7} align="center">No payment transactions found</TableCell></TableRow>
              ) : (
                payments.map((payment) => (
                  <TableRow key={payment._id} hover>
                    <TableCell>{new Date(payment.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>#{payment.order?._id?.slice(-6) || 'N/A'}</TableCell>
                    <TableCell>₹{payment.amount?.toFixed(2) || '0.00'}</TableCell>
                    <TableCell sx={{ color: 'success.dark', fontWeight: '500' }}>₹{payment.sellerPayoutAmount?.toFixed(2) || '0.00'}</TableCell>
                    <TableCell>{payment.method}</TableCell>
                    <TableCell>{getPaymentStatusChip(payment.status)}</TableCell>
                    <TableCell>
                      {payment.method === 'cod' && payment.status === 'pending' && (
                        <Button size="small" onClick={() => handleOpenCodDialog(payment)}>
                          Record COD Received
                        </Button>
                      )}
                      {/* Add View Order link/button */}
                      {payment.order?._id && <Button size="small" component={Link} to={`/orders/${payment.order._id}`} sx={{ ml: 1 }}>View Order</Button>}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Payout History Table */}
        <Typography variant="h6" gutterBottom>Payout History</Typography>
        <TableContainer component={Paper} elevation={2}>
          <Table aria-label="payout history table">
            <TableHead>
              <TableRow sx={{ backgroundColor: grey[100] }}>
                <TableCell sx={{ fontWeight: 'bold' }}>Requested At</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Amount</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Processed At</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Notes/Txn ID</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paymentsLoading ? ( // Reuse paymentsLoading for initial load
                <TableRow><TableCell colSpan={5} align="center"><CircularProgress /></TableCell></TableRow>
              ) : payoutHistory.length === 0 ? (
                <TableRow><TableCell colSpan={5} align="center">No payout requests found</TableCell></TableRow>
              ) : (
                payoutHistory.map((payout) => (
                  <TableRow key={payout._id} hover>
                    <TableCell>{new Date(payout.createdAt).toLocaleString()}</TableCell>
                    <TableCell>₹{payout.amount?.toFixed(2) || '0.00'}</TableCell>
                    <TableCell>
                      <Chip
                        label={payout.status}
                        size="small"
                        color={payout.status === 'completed' ? 'success' : payout.status === 'failed' ? 'error' : 'warning'}
                      />
                    </TableCell>
                    <TableCell>{payout.processedAt ? new Date(payout.processedAt).toLocaleDateString() : 'N/A'}</TableCell>
                    <TableCell>{payout.transactionId || payout.notes || 'N/A'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

      </Box>

      {/* Record COD Dialog */}
      <Dialog open={openPaymentDialog} onClose={() => setOpenPaymentDialog(false)}>
        <DialogTitle>Record Cash Received (COD)</DialogTitle>
        <DialogContent>
          {paymentRecordError && <Alert severity="error" sx={{ mb: 2 }}>{paymentRecordError}</Alert>}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Typography>Order: #{selectedPayment?.order?._id?.slice(-6)}</Typography>
              <Typography>Customer: {selectedPayment?.order?.user?.name || 'N/A'}</Typography>
              <Typography>Amount Expected: ₹{selectedPayment?.amount?.toFixed(2)}</Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Amount Received (₹)"
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                inputProps={{ min: 0, max: selectedPayment?.amount || 0, step: 0.01 }}
                required
              />
            </Grid>
            {/* Add optional notes field if needed */}
            {/* <Grid item xs={12}> <TextField fullWidth label="Notes (Optional)" /> </Grid> */}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPaymentDialog(false)}>Cancel</Button>
          <Button
            onClick={handleRecordCodSubmit}
            variant="contained"
            color="primary"
            disabled={paymentRecordLoading || paymentAmount <= 0 || paymentAmount > selectedPayment?.amount}
          >
            {paymentRecordLoading ? <CircularProgress size={24} /> : 'Confirm Received'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Request Payout Dialog */}
      <Dialog open={openPayoutDialog} onClose={() => setOpenPayoutDialog(false)}>
        <DialogTitle>Request Payout</DialogTitle>
        <DialogContent>
          {payoutRequestError && <Alert severity="error" sx={{ mb: 2 }}>{payoutRequestError}</Alert>}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Typography>Available Balance: ₹{balance?.availableBalance?.toFixed(2) || '0.00'}</Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Amount to Withdraw (₹)"
                type="number"
                value={payoutAmount}
                onChange={(e) => {
                  const maxAmount = balance?.availableBalance || 0;
                  const requestedAmount = e.target.value === '' ? 0 : parseFloat(e.target.value);
                  const amount = Math.max(0, Math.min(maxAmount, requestedAmount || 0));
                  setPayoutAmount(amount);
                }}
                inputProps={{ min: 0, max: balance?.availableBalance || 0, step: 0.01 }}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">
                Payouts are typically processed within 3-5 business days to your registered bank account.
              </Typography>
              <Typography variant="body2" color="primary" sx={{ mt: 1 }}>
                Ensure your <Link to="/profile" style={{ color: '#1976d2', fontWeight: 'bold' }}>Bank Details</Link> are up to date in your profile.
              </Typography>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setOpenPayoutDialog(false); setPayoutAmount(0); }}>Cancel</Button>
          <Button
            onClick={handleRequestPayoutSubmit}
            variant="contained"
            color="primary"
            disabled={payoutRequestLoading || payoutAmount <= 0 || payoutAmount > balance?.availableBalance}
          >
            {payoutRequestLoading ? <CircularProgress size={24} /> : 'Request Payout'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for feedback */}
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

    </Container>
  );
};

export default SellerPayments;