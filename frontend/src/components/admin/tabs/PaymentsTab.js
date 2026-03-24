import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Tab,
  Tabs,
  Paper,
  Alert,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  GetApp as ExportIcon,
  Payment as PaymentIcon,
  AccountBalanceWallet as WalletIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Flag as FlagIcon
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import {
  getAdminPaymentStats,
  getAdminTransactions,
  processRefund,
  getPayoutsList,
  flagPayment,
  exportPaymentReport,
  releasePayout,
  getAdminCODSettlements,
  settleCOD
} from '../../../redux/actions/adminPaymentActions';
import { EmptyState, LoadingState } from '../../common/PageStates';
import { PaymentStatusChip, PayoutStatusChip } from '../../common/FinancialUI';

const selectAdminPaymentStats = (state) => state.adminPaymentStats || {};

const selectAdminTransactions = (state) => state.adminTransactions || {};
const selectAdminPayoutsList = (state) => state.adminPayoutsList || {};
const selectAdminCODSettlements = (state) => state.adminCODSettlements || {};
const selectAdminSettleCOD = (state) => state.adminSettleCOD || {};

const PaymentsTab = () => {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState(0);
  const [refundDialog, setRefundDialog] = useState({ open: false, payment: null });
  const [payoutDialog, setPayoutDialog] = useState({ open: false, payout: null });
  const [flagDialog, setFlagDialog] = useState({ open: false, payment: null });
  const [filters, setFilters] = useState({
    status: 'all',
    method: 'all',
    page: 1,
    limit: 10
  });

  const { stats = {}, loading: statsLoading } = useSelector(selectAdminPaymentStats);
  const { transactions = [], loading: transactionsLoading, total = 0 } = useSelector(selectAdminTransactions);
  const { payouts = [], loading: payoutsLoading } = useSelector(selectAdminPayoutsList);
  const { settlements = [], loading: settlementsLoading, total: settlementsTotal } = useSelector(selectAdminCODSettlements);
  const { success: settleSuccess } = useSelector(selectAdminSettleCOD);

  useEffect(() => {
    loadData();
  }, [filters, activeTab]);

  const loadData = () => {
    dispatch(getAdminPaymentStats());

    if (activeTab === 0) {
      dispatch(getAdminTransactions(filters));
    } else if (activeTab === 1) {
      dispatch(getPayoutsList(filters));
    } else if (activeTab === 3) {
      dispatch(getAdminCODSettlements(filters));
    }
  };

  const handleRefund = (payment) => {
    setRefundDialog({ open: true, payment });
  };

  const handlePayoutRelease = (payout) => {
    setPayoutDialog({ open: true, payout });
  };

  const handleFlag = (payment) => {
    setFlagDialog({ open: true, payment });
  };

  const confirmRefund = () => {
    const { payment } = refundDialog;
    const refundData = {
      amount: payment.amount,
      reason: 'Admin initiated refund',
      notes: 'Refund processed by admin'
    };
    dispatch(processRefund(payment._id, refundData));
    setRefundDialog({ open: false, payment: null });
  };

  const confirmPayout = () => {
    const { payout } = payoutDialog;
    dispatch(releasePayout(payout._id, { notes: 'Payout released by admin' }));
    setPayoutDialog({ open: false, payout: null });
  };

  const handleSettleCOD = (orderId) => {
    if (window.confirm('Are you sure you want to mark this COD as settled?')) {
      dispatch(settleCOD(orderId));
    }
  };

  const confirmFlag = () => {
    const { payment } = flagDialog;
    const flagData = {
      isFlagged: !payment.isFlagged,
      flagReason: payment.isFlagged ? null : 'suspicious_pattern',
      adminNotes: payment.isFlagged ? '' : 'Flagged for review by admin'
    };
    dispatch(flagPayment(payment._id, flagData));
    setFlagDialog({ open: false, payment: null });
  };

  const handleExport = () => {
    const type = activeTab === 0 ? 'payments' : 'payouts';
    dispatch(exportPaymentReport({ type }));
  };

  const StatCard = ({ title, value, subtitle, icon, color }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography color="textSecondary" gutterBottom variant="overline">
              {title}
            </Typography>
            <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color }}>
              ₹{typeof value === 'number' ? value.toLocaleString('en-IN') : value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="textSecondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box sx={{ color, opacity: 0.8 }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Today's Sales"
            value={stats?.today?.sales || 0}
            subtitle={`${stats?.today?.transactions || 0} transactions`}
            icon={<PaymentIcon fontSize="large" />}
            color="#4caf50"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Commission Earned"
            value={stats?.today?.commission || 0}
            subtitle="15% platform fee"
            icon={<WalletIcon fontSize="large" />}
            color="#ff9800"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Payouts"
            value={stats?.payouts?.pendingAmount || 0}
            subtitle={`${stats?.payouts?.pendingCount || 0} sellers`}
            icon={<WarningIcon fontSize="large" />}
            color="#f44336"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Flagged Payments"
            value={stats?.flaggedPayments || 0}
            subtitle="Requires review"
            icon={<FlagIcon fontSize="large" />}
            color="#9c27b0"
          />
        </Grid>
      </Grid>
      {statsLoading && <LoadingState message="Refreshing payment stats..." />}

      {/* Tabs and Controls */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            <Tab label="Transactions" />
            <Tab label="Seller Payouts" />
            <Tab label="Analytics" />
            <Tab label="COD Settlements" />
          </Tabs>
          <Box>
            <Tooltip title="Refresh">
              <IconButton onClick={loadData} disabled={statsLoading}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Export Data">
              <IconButton onClick={handleExport}>
                <ExportIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Box>

      {/* Filters */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Status</InputLabel>
            <Select
              value={filters.status}
              label="Status"
              onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="failed">Failed</MenuItem>
              <MenuItem value="refunded">Refunded</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Method</InputLabel>
            <Select
              value={filters.method}
              label="Method"
              onChange={(e) => setFilters({ ...filters, method: e.target.value, page: 1 })}
            >
              <MenuItem value="all">All Methods</MenuItem>
              <MenuItem value="razorpay">Razorpay</MenuItem>
              <MenuItem value="cod">COD</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* Transactions Table */}
      {activeTab === 0 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Payment ID</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Seller</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Commission</TableCell>
                <TableCell>Method</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transactionsLoading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9}>
                    <EmptyState
                      title="No transactions found"
                      description="Try changing filters or refresh data."
                      actionLabel="Refresh"
                      onAction={loadData}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((payment) => (
                  <TableRow key={payment._id}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {payment._id?.slice(-8) || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {payment.user?.name || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {payment.seller?.name || 'N/A'}
                    </TableCell>
                    <TableCell>₹{payment.amount?.toLocaleString('en-IN') || 0}</TableCell>
                    <TableCell>₹{payment.commissionAmount?.toLocaleString('en-IN') || 0}</TableCell>
                    <TableCell>
                      <Chip
                        label={payment.method?.toUpperCase() || 'N/A'}
                        color={payment.method === 'razorpay' ? 'primary' : 'secondary'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <PaymentStatusChip status={payment.status} />
                    </TableCell>
                    <TableCell>
                      {payment.createdAt ? new Date(payment.createdAt).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {payment.method === 'razorpay' && payment.status === 'completed' && (
                          <Tooltip title="Refund">
                            <IconButton
                              size="small"
                              color="warning"
                              onClick={() => handleRefund(payment)}
                            >
                              <CancelIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title={payment.isFlagged ? "Unflag" : "Flag"}>
                          <IconButton
                            size="small"
                            color={payment.isFlagged ? "error" : "default"}
                            onClick={() => handleFlag(payment)}
                          >
                            <FlagIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={total || 0}
            rowsPerPage={filters.limit}
            page={filters.page - 1}
            onPageChange={(e, newPage) => setFilters({ ...filters, page: newPage + 1 })}
            onRowsPerPageChange={(e) => setFilters({ ...filters, limit: parseInt(e.target.value), page: 1 })}
          />
        </TableContainer>
      )}

      {/* Payouts Table */}
      {activeTab === 1 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Payout ID</TableCell>
                <TableCell>Seller</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Requested</TableCell>
                <TableCell>Bank Details</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {payoutsLoading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : payouts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <EmptyState
                      title="No payouts found"
                      description="Pending seller payouts will appear here."
                      actionLabel="Refresh"
                      onAction={loadData}
                    />
                  </TableCell>
                </TableRow>
              ) : (
                payouts.map((payout) => (
                  <TableRow key={payout._id}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {payout._id?.slice(-8) || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {payout.seller?.name || 'N/A'}
                    </TableCell>
                    <TableCell>₹{payout.amount?.toLocaleString('en-IN') || 0}</TableCell>
                    <TableCell>
                      <PayoutStatusChip status={payout.status} />
                    </TableCell>
                    <TableCell>
                      {payout.createdAt ? new Date(payout.createdAt).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {payout.bankDetailsSnapshot?.accountHolderName || 'N/A'}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {payout.bankDetailsSnapshot?.accountNumber?.slice(-4)} • {payout.bankDetailsSnapshot?.ifsc}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {payout.status === 'pending' && (
                        <Tooltip title="Release Payout">
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => handlePayoutRelease(payout)}
                          >
                            <CheckCircleIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Analytics Tab */}
      {activeTab === 2 && (
        <Box>
          <Alert severity="info" sx={{ mb: 3 }}>
            Advanced analytics and charts coming soon. Currently showing basic statistics.
          </Alert>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Payment Methods Distribution
                  </Typography>
                  {stats?.paymentMethods?.map((method) => (
                    <Box key={method._id} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" textTransform="capitalize">
                          {method._id}
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">
                          ₹{method.totalAmount?.toLocaleString('en-IN') || 0}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ flexGrow: 1, bgcolor: 'grey.200', borderRadius: 1, height: 8 }}>
                          <Box
                            sx={{
                              height: '100%',
                              bgcolor: method._id === 'razorpay' ? '#1976d2' : '#ed6c02',
                              borderRadius: 1,
                              width: `${(method.count / (stats.today?.transactions || 1)) * 100}%`
                            }}
                          />
                        </Box>
                        <Typography variant="caption" color="textSecondary">
                          {method.count} transactions
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Weekly Summary
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography>Total Sales:</Typography>
                    <Typography fontWeight="bold">
                      ₹{stats?.weekly?.sales?.toLocaleString('en-IN') || 0}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography>Commission:</Typography>
                    <Typography fontWeight="bold" color="warning.main">
                      ₹{stats?.weekly?.commission?.toLocaleString('en-IN') || 0}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography>Refunds:</Typography>
                    <Typography fontWeight="bold" color="error.main">
                      ₹{stats?.refunds?.totalRefunded?.toLocaleString('en-IN') || 0}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* COD Settlements Tab */}
      {activeTab === 3 && (
        <Box>
          <Alert severity="info" sx={{ mb: 3 }}>
            Review and settle cash collected by delivery partners. Outstand settlement: ₹{stats?.codSettlements?.totalAmount?.toLocaleString('en-IN') || 0} ({stats?.codSettlements?.count || 0} orders)
          </Alert>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Order ID</TableCell>
                  <TableCell>Delivery Partner</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Collected At</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {settlementsLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : settlements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <EmptyState
                        title="No outstanding COD settlements"
                        description="All collected COD amounts are settled."
                        actionLabel="Refresh"
                        onAction={loadData}
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  settlements.map((settlement) => (
                    <TableRow key={settlement._id}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          #{settlement._id?.slice(-8).toUpperCase()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {settlement.deliveryPartner?.name || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {settlement.user?.name || 'N/A'}
                      </TableCell>
                      <TableCell>₹{settlement.totalPrice?.toLocaleString('en-IN') || 0}</TableCell>
                      <TableCell>
                        {settlement.codCollectedAt ? new Date(settlement.codCollectedAt).toLocaleString() : settlement.deliveredAt ? new Date(settlement.deliveredAt).toLocaleString() : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outlined"
                          size="small"
                          color="success"
                          onClick={() => handleSettleCOD(settlement._id)}
                        >
                          Settle Now
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={settlementsTotal || 0}
              rowsPerPage={filters.limit}
              page={filters.page - 1}
              onPageChange={(e, newPage) => setFilters({ ...filters, page: newPage + 1 })}
              onRowsPerPageChange={(e) => setFilters({ ...filters, limit: parseInt(e.target.value), page: 1 })}
            />
          </TableContainer>
        </Box>
      )}

      {/* Refund Dialog */}
      <Dialog open={refundDialog.open} onClose={() => setRefundDialog({ open: false, payment: null })}>
        <DialogTitle>Process Refund</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to refund ₹{refundDialog.payment?.amount} for payment {refundDialog.payment?._id}?
          </Typography>
          <TextField
            fullWidth
            margin="dense"
            label="Refund Reason"
            defaultValue="Admin initiated refund"
            variant="outlined"
          />
          <TextField
            fullWidth
            margin="dense"
            label="Admin Notes"
            multiline
            rows={3}
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRefundDialog({ open: false, payment: null })}>Cancel</Button>
          <Button onClick={confirmRefund} color="warning" variant="contained">
            Process Refund
          </Button>
        </DialogActions>
      </Dialog>

      {/* Payout Dialog */}
      <Dialog open={payoutDialog.open} onClose={() => setPayoutDialog({ open: false, payout: null })}>
        <DialogTitle>Release Payout</DialogTitle>
        <DialogContent>
          <Typography>
            Release ₹{payoutDialog.payout?.amount} to {payoutDialog.payout?.seller?.name}?
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            Bank: {payoutDialog.payout?.bankDetailsSnapshot?.accountHolderName} •
            {payoutDialog.payout?.bankDetailsSnapshot?.accountNumber?.slice(-4)}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPayoutDialog({ open: false, payout: null })}>Cancel</Button>
          <Button onClick={confirmPayout} color="success" variant="contained">
            Release Payout
          </Button>
        </DialogActions>
      </Dialog>

      {/* Flag Dialog */}
      <Dialog open={flagDialog.open} onClose={() => setFlagDialog({ open: false, payment: null })}>
        <DialogTitle>
          {flagDialog.payment?.isFlagged ? 'Unflag Payment' : 'Flag Payment'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {flagDialog.payment?.isFlagged
              ? 'Remove flag from this payment?'
              : 'Flag this payment for review?'}
          </Typography>
          <TextField
            fullWidth
            margin="dense"
            label="Reason for flagging"
            select
            variant="outlined"
          >
            <MenuItem value="high_value_cod">High Value COD</MenuItem>
            <MenuItem value="multiple_orders">Multiple Orders</MenuItem>
            <MenuItem value="suspicious_pattern">Suspicious Pattern</MenuItem>
            <MenuItem value="other">Other</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFlagDialog({ open: false, payment: null })}>Cancel</Button>
          <Button
            onClick={confirmFlag}
            color={flagDialog.payment?.isFlagged ? "primary" : "warning"}
            variant="contained"
          >
            {flagDialog.payment?.isFlagged ? 'Unflag' : 'Flag'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PaymentsTab;