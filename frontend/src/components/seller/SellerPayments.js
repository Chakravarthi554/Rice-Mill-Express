// frontend/src/components/seller/SellerPayments.js
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box, Typography, Grid, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button, Chip, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField,
  CircularProgress, Alert, Snackbar, Select, MenuItem,
  FormControl, InputLabel, Divider, Avatar
} from '@mui/material';
import {
  TrendingUp, AccessTime, Download, CheckCircle, Cancel,
  AccountBalance, VerifiedUser, ArrowUpward
} from '@mui/icons-material';
import {
  getSellerPayments, recordCodReceived, requestPayout
} from '../../redux/actions/paymentActions';
import { PAYMENT_RECORD_COD_RESET, PAYOUT_REQUEST_RESET } from '../../redux/constants/paymentConstants';

// Simple SVG donut chart for commission split
const DonutChart = ({ sellerPct = 85, platformPct = 15 }) => {
  const r = 40;
  const circ = 2 * Math.PI * r;
  const dashSeller = (sellerPct / 100) * circ;
  return (
    <svg width={100} height={100} viewBox="0 0 100 100">
      <circle cx="50" cy="50" r={r} fill="none" stroke="#E5E7EB" strokeWidth={14} />
      <circle cx="50" cy="50" r={r} fill="none" stroke="#16A34A" strokeWidth={14}
        strokeDasharray={`${dashSeller} ${circ - dashSeller}`} strokeLinecap="round"
        transform="rotate(-90 50 50)" />
      <text x="50" y="46" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#111827">{sellerPct}%</text>
      <text x="50" y="58" textAnchor="middle" fontSize="8" fill="#6B7280">Yours</text>
    </svg>
  );
};

const STATUS_CONFIG = {
  completed: { label: 'Completed', bg: '#DCFCE7', text: '#166534' },
  pending: { label: 'Pending', bg: '#FEF3C7', text: '#92400E' },
  failed: { label: 'Failed', bg: '#FEE2E2', text: '#B91C1C' },
  processing: { label: 'Processing', bg: '#DBEAFE', text: '#1E40AF' },
  verified: { label: 'Verified', bg: '#DCFCE7', text: '#166534' },
  unverified: { label: 'Unverified', bg: '#FEF3C7', text: '#92400E' },
};

const StatusChip = ({ status = 'pending' }) => {
  const cfg = STATUS_CONFIG[status] || { label: status, bg: '#F3F4F6', text: '#374151' };
  return <Chip label={cfg.label} size="small" sx={{ bgcolor: cfg.bg, color: cfg.text, fontWeight: 700, fontSize: '0.7rem' }} />;
};

const SellerPayments = () => {
  const dispatch = useDispatch();
  const [openCodDialog, setOpenCodDialog] = useState(false);
  const [openPayoutDialog, setOpenPayoutDialog] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [payoutAmount, setPayoutAmount] = useState(0);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // ── Download Statement as CSV ──────────────────────────────────────────────
  const handleDownloadStatement = () => {
    if (payments.length === 0) {
      setSnackbar({ open: true, message: 'No transactions to download.', severity: 'info' });
      return;
    }
    const headers = ['Date', 'Amount (₹)', 'Commission (15%)', 'Net Payout (₹)', 'Method', 'Status'];
    const rows = payments.map(p => [
      new Date(p.createdAt).toLocaleDateString('en-IN'),
      p.amount?.toFixed(2) || '0.00',
      ((p.amount || 0) * 0.15).toFixed(2),
      p.sellerPayoutAmount?.toFixed(2) || '0.00',
      p.method || 'UPI',
      p.status || 'pending'
    ]);
    const csvContent = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `seller-statement-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const {
    payments = [], balance = { totalEarnings: 0, availableBalance: 0, pendingPayouts: 0 },
    payoutHistory = [], loading: paymentsLoading = true, error: paymentsError = null
  } = useSelector(s => s.sellerPayments || {});

  const { loading: codLoading, error: codError, success: codSuccess } = useSelector(s => s.paymentRecordCod || {});
  const { loading: payoutLoading, error: payoutError, success: payoutSuccess } = useSelector(s => s.payoutRequest || {});

  useEffect(() => { dispatch(getSellerPayments()); }, [dispatch, codSuccess, payoutSuccess]);

  useEffect(() => {
    if (codSuccess) { setSnackbar({ open: true, message: 'COD Payment Recorded!', severity: 'success' }); dispatch({ type: PAYMENT_RECORD_COD_RESET }); setOpenCodDialog(false); }
    if (codError) { setSnackbar({ open: true, message: `Error: ${codError}`, severity: 'error' }); dispatch({ type: PAYMENT_RECORD_COD_RESET }); }
  }, [codSuccess, codError, dispatch]);

  useEffect(() => {
    if (payoutSuccess) { setSnackbar({ open: true, message: 'Payout Requested Successfully!', severity: 'success' }); dispatch({ type: PAYOUT_REQUEST_RESET }); setOpenPayoutDialog(false); }
    if (payoutError) { setSnackbar({ open: true, message: `Error: ${payoutError}`, severity: 'error' }); dispatch({ type: PAYOUT_REQUEST_RESET }); }
  }, [payoutSuccess, payoutError, dispatch]);

  const thisMonthEarnings = payments.filter(p => {
    const d = new Date(p.createdAt);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((s, p) => s + (p.sellerPayoutAmount || 0), 0);

  const pendingSettlement = balance.pendingPayouts || 0;
  const totalEarnings = balance.totalEarnings || 0;
  const availableBalance = balance.availableBalance || 0;

  // COD collections from payments
  const codPayments = payments.filter(p => p.method === 'cod');

  return (
    <Box>
      {paymentsError && <Alert severity="error" sx={{ mb: 2 }}>{paymentsError}</Alert>}

      {/* Earnings Overview - 3 colored cards matching image */}
      <Typography variant="body2" fontWeight={700} color="text.secondary" sx={{ mb: 1.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        Payment Earnings
      </Typography>
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ borderRadius: 3, p: 2.5, bgcolor: '#1E2B4A', color: '#fff' }}>
            <Typography variant="body2" sx={{ opacity: 0.7, mb: 1 }}>Total Earnings</Typography>
            <Typography variant="h4" fontWeight={800}>₹{totalEarnings.toLocaleString('en-IN')}</Typography>
            <Typography variant="caption" sx={{ opacity: 0.6 }}>Lifetime</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ borderRadius: 3, p: 2.5, bgcolor: '#DBEAFE' }}>
            <Typography variant="body2" color="#1E40AF" fontWeight={600} sx={{ mb: 1 }}>This Month</Typography>
            <Typography variant="h4" fontWeight={800} color="#1E40AF">₹{thisMonthEarnings.toLocaleString('en-IN')}</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
              <TrendingUp sx={{ fontSize: 14, color: '#16A34A' }} />
              <Typography variant="caption" color="#16A34A" fontWeight={700}>↑15% vs last month</Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ borderRadius: 3, p: 2.5, bgcolor: '#FEF3C7' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography variant="body2" color="#92400E" fontWeight={600} sx={{ mb: 1 }}>Pending Settlement</Typography>
                <Typography variant="h4" fontWeight={800} color="#92400E">₹{pendingSettlement.toLocaleString('en-IN')}</Typography>
                <Typography variant="caption" color="#B45309">(T+2 days)</Typography>
              </Box>
              <Box sx={{ width: 28, height: 28, bgcolor: '#16A34A', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ArrowUpward sx={{ fontSize: 16, color: '#fff' }} />
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Main content: Transaction History + COD + Payout */}
      <Grid container spacing={3}>
        {/* Transaction History */}
        <Grid item xs={12} md={8}>
          <Paper variant="outlined" sx={{ borderRadius: 3, border: '1px solid #F3F4F6', overflow: 'hidden' }}>
            <Box sx={{ px: 3, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F3F4F6' }}>
              <Typography fontWeight={800}>Transaction History</Typography>
              <Button size="small" startIcon={<Download fontSize="small" />}
                variant="outlined" onClick={handleDownloadStatement}
                sx={{ borderColor: '#E5E7EB', color: '#6B7280', borderRadius: 2, fontWeight: 700 }}>
                Download Statement
              </Button>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#FAFAFA' }}>
                    {['Date', 'Commission (15%)', 'Net Amount', 'Method', 'Status'].map(h => (
                      <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#6B7280' }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paymentsLoading ? (
                    <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4 }}><CircularProgress size={24} /></TableCell></TableRow>
                  ) : payments.length === 0 ? (
                    <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4, color: '#9CA3AF' }}>No transactions yet</TableCell></TableRow>
                  ) : payments.map(p => {
                    const commission = (p.amount || 0) * 0.15;
                    const net = (p.sellerPayoutAmount || 0);
                    return (
                      <TableRow key={p._id} hover>
                        <TableCell sx={{ fontSize: '0.8rem' }}>{new Date(p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</TableCell>
                        <TableCell sx={{ fontSize: '0.8rem', color: '#EF4444' }}>-₹{commission.toFixed(0)}</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#16A34A' }}>₹{net.toFixed(0)}</TableCell>
                        <TableCell sx={{ fontSize: '0.8rem', textTransform: 'capitalize' }}>{p.method || 'UPI'}</TableCell>
                        <TableCell><StatusChip status={p.status} /></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Right: COD Collections + Request Payout */}
        <Grid item xs={12} md={4}>
          {/* COD Collections */}
          <Paper variant="outlined" sx={{ borderRadius: 3, border: '1px solid #F3F4F6', mb: 2, overflow: 'hidden' }}>
            <Box sx={{ px: 3, py: 2, borderBottom: '1px solid #F3F4F6' }}>
              <Typography fontWeight={800}>COD Collections</Typography>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#FAFAFA' }}>
                    {['DP Name', 'Amount', 'Status'].map(h => (
                      <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.7rem', color: '#6B7280' }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {codPayments.length === 0 ? (
                    <TableRow><TableCell colSpan={3} align="center" sx={{ py: 3, color: '#9CA3AF', fontSize: '0.8rem' }}>No COD orders</TableCell></TableRow>
                  ) : codPayments.slice(0, 4).map(p => (
                    <TableRow key={p._id} hover>
                      <TableCell sx={{ fontSize: '0.75rem' }}>{p.deliveryPartner?.name || 'Partner'}</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem' }}>₹{p.amount?.toFixed(0)}</TableCell>
                      <TableCell>
                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: p.status === 'completed' ? '#16A34A' : '#F59E0B', display: 'inline-block' }} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Box sx={{ px: 2, pb: 2, pt: 1 }}>
              <Button fullWidth size="small" variant="outlined"
                onClick={() => { if (codPayments.length > 0) { setSelectedPayment(codPayments[0]); setPaymentAmount(codPayments[0]?.amount || 0); setOpenCodDialog(true); } else { setSnackbar({ open: true, message: 'No COD payments pending verification.', severity: 'info' }); } }}
                sx={{ borderColor: '#E5E7EB', color: '#374151', borderRadius: 2, fontWeight: 700 }}>
                Verify Remittance
              </Button>
            </Box>
          </Paper>

          {/* Request Payout */}
          <Paper variant="outlined" sx={{ borderRadius: 3, border: '1px solid #F3F4F6', p: 2.5 }}>
            <Typography fontWeight={800} gutterBottom>Request Payout</Typography>
            <Typography variant="caption" color="text.secondary">Available Balance</Typography>
            <Typography variant="h5" fontWeight={800} color="#111827" sx={{ mb: 2 }}>₹{availableBalance.toLocaleString('en-IN')}</Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box>
                <Typography variant="caption" color="text.secondary" display="block">Commission (85%)</Typography>
                <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#16A34A' }} />
                    <Typography variant="caption" fontWeight={700}>You (85%)</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#E5E7EB' }} />
                    <Typography variant="caption" color="text.secondary">Platform (15%)</Typography>
                  </Box>
                </Box>
              </Box>
              <DonutChart sellerPct={85} platformPct={15} />
            </Box>

            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel>Select Account</InputLabel>
              <Select value={selectedAccount} label="Select Account" onChange={e => setSelectedAccount(e.target.value)}>
                <MenuItem value="primary">Primary Bank Account</MenuItem>
                <MenuItem value="upi">UPI - Linked</MenuItem>
              </Select>
            </FormControl>

            <Button fullWidth variant="contained" size="large"
              onClick={() => setOpenPayoutDialog(true)}
              disabled={availableBalance <= 0 || payoutLoading}
              sx={{ bgcolor: '#3B82F6', '&:hover': { bgcolor: '#2563EB' }, borderRadius: 2, fontWeight: 800, py: 1.2 }}>
              {payoutLoading ? <CircularProgress size={20} color="inherit" /> : 'Request Payout'}
            </Button>
          </Paper>
        </Grid>
      </Grid>

      {/* COD Record Dialog */}
      <Dialog open={openCodDialog} onClose={() => setOpenCodDialog(false)} PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle fontWeight={800}>Record COD Received</DialogTitle>
        <DialogContent>
          {codError && <Alert severity="error" sx={{ mb: 2 }}>{codError}</Alert>}
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Order #{selectedPayment?.order?._id?.slice(-6)} — Expected: ₹{selectedPayment?.amount?.toFixed(0)}</Typography>
          <TextField fullWidth label="Amount Received (₹)" type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} size="small" />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenCodDialog(false)} sx={{ color: '#6B7280' }}>Cancel</Button>
          <Button variant="contained" onClick={() => { dispatch(recordCodReceived(selectedPayment.order._id, paymentAmount)); }} disabled={codLoading || paymentAmount <= 0}
            sx={{ bgcolor: '#16A34A', '&:hover': { bgcolor: '#15803D' }, fontWeight: 700 }}>
            {codLoading ? <CircularProgress size={18} color="inherit" /> : 'Confirm Received'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Payout Request Dialog */}
      <Dialog open={openPayoutDialog} onClose={() => setOpenPayoutDialog(false)} PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle fontWeight={800}>Request Payout</DialogTitle>
        <DialogContent>
          {payoutError && <Alert severity="error" sx={{ mb: 2 }}>{payoutError}</Alert>}
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Available: ₹{availableBalance.toFixed(0)}</Typography>
          <TextField fullWidth label="Amount to Withdraw (₹)" type="number" value={payoutAmount}
            onChange={e => setPayoutAmount(Math.min(availableBalance, Math.max(0, parseFloat(e.target.value) || 0)))}
            inputProps={{ min: 0, max: availableBalance, step: 1 }} size="small" sx={{ mb: 2 }} />
          <Typography variant="caption" color="text.secondary">Payouts are processed within 2-3 business days to your registered bank account.</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => { setOpenPayoutDialog(false); setPayoutAmount(0); }} sx={{ color: '#6B7280' }}>Cancel</Button>
          <Button variant="contained" onClick={() => dispatch(requestPayout({ amount: payoutAmount }))} disabled={payoutLoading || payoutAmount <= 0}
            sx={{ bgcolor: '#3B82F6', '&:hover': { bgcolor: '#2563EB' }, fontWeight: 700 }}>
            {payoutLoading ? <CircularProgress size={18} color="inherit" /> : 'Request Payout'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar open={snackbar.open} autoHideDuration={5000} onClose={() => setSnackbar(s => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(s => ({ ...s, open: false }))} sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default SellerPayments;