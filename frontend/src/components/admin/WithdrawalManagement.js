import React, { useState, useEffect } from 'react';
import {
    Box, Paper, Typography, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Chip, IconButton,
    Tooltip, Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TextField, Alert, CircularProgress, Stack
} from '@mui/material';
import {
    CheckCircle, Cancel, Visibility, AccountBalance,
    History
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { listAdminWithdrawals, updateWithdrawalStatus } from '../../redux/actions/rewardsActions';
import { ADMIN_WITHDRAWAL_UPDATE_RESET } from '../../redux/constants/rewardsConstants';

const WithdrawalManagement = () => {
    const dispatch = useDispatch();

    const [openDialog, setOpenDialog] = useState(false);
    const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
    const [adminNotes, setAdminNotes] = useState('');
    const [transactionId, setTransactionId] = useState('');

    const { withdrawals, loading, error } = useSelector(state => state.adminWithdrawalList || {});
    const { success: updateSuccess, loading: updateLoading, error: updateError } = useSelector(state => state.adminWithdrawalUpdate || {});

    useEffect(() => {
        dispatch(listAdminWithdrawals());
    }, [dispatch]);

    useEffect(() => {
        if (updateSuccess) {
            setOpenDialog(false);
            setAdminNotes('');
            setTransactionId('');
            dispatch({ type: ADMIN_WITHDRAWAL_UPDATE_RESET });
            dispatch(listAdminWithdrawals());
        }
    }, [updateSuccess, dispatch]);

    const handleOpenDialog = (withdrawal) => {
        setSelectedWithdrawal(withdrawal);
        setAdminNotes(withdrawal.adminNotes || '');
        setTransactionId(withdrawal.transactionId || '');
        setOpenDialog(true);
    };

    const handleUpdateStatus = (status) => {
        dispatch(updateWithdrawalStatus(selectedWithdrawal._id, {
            status,
            adminNotes,
            transactionId
        }));
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
                Withdrawal Requests Management
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: 'grey.100' }}>
                            <TableCell>Customer</TableCell>
                            <TableCell>Amount</TableCell>
                            <TableCell>Date</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Bank Details</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center"><CircularProgress size={24} /></TableCell>
                            </TableRow>
                        ) : withdrawals?.length > 0 ? withdrawals.map((w) => (
                            <TableRow key={w._id} hover>
                                <TableCell>
                                    <Typography variant="body2" fontWeight="bold">{w.user?.name}</Typography>
                                    <Typography variant="caption" color="textSecondary">{w.user?.email}</Typography>
                                </TableCell>
                                <TableCell>₹{w.amount}</TableCell>
                                <TableCell>{new Date(w.createdAt).toLocaleDateString()}</TableCell>
                                <TableCell>
                                    <Chip
                                        label={w.status.toUpperCase()}
                                        color={w.status === 'processed' || w.status === 'approved' ? 'success' : w.status === 'pending' ? 'warning' : 'error'}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Typography variant="caption" sx={{ display: 'block' }}>{w.bankDetails?.bankName}</Typography>
                                    <Typography variant="caption" color="textSecondary">{w.bankDetails?.accountNumber}</Typography>
                                </TableCell>
                                <TableCell align="right">
                                    <Tooltip title="View & Process">
                                        <IconButton size="small" color="primary" onClick={() => handleOpenDialog(w)}>
                                            <Visibility />
                                        </IconButton>
                                    </Tooltip>
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={6} align="center">No withdrawal requests found</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Process Withdrawal Dialog */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullWidth maxWidth="sm">
                <DialogTitle>Process Withdrawal Request</DialogTitle>
                <DialogContent dividers>
                    {updateError && <Alert severity="error" sx={{ mb: 2 }}>{updateError}</Alert>}
                    {selectedWithdrawal && (
                        <Box>
                            <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="overline">Customer Name</Typography>
                                    <Typography variant="body1">{selectedWithdrawal.user?.name}</Typography>
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="overline">Withdrawal Amount</Typography>
                                    <Typography variant="h5" color="secondary.main" fontWeight="bold">₹{selectedWithdrawal.amount}</Typography>
                                </Box>
                            </Stack>

                            <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: '#f9f9f9' }}>
                                <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <AccountBalance fontSize="small" /> Bank Details
                                </Typography>
                                <Grid container spacing={1}>
                                    <Grid item xs={12}><Typography variant="body2"><strong>Bank:</strong> {selectedWithdrawal.bankDetails?.bankName}</Typography></Grid>
                                    <Grid item xs={12}><Typography variant="body2"><strong>A/C No:</strong> {selectedWithdrawal.bankDetails?.accountNumber}</Typography></Grid>
                                    <Grid item xs={12}><Typography variant="body2"><strong>IFSC:</strong> {selectedWithdrawal.bankDetails?.ifscCode}</Typography></Grid>
                                    <Grid item xs={12}><Typography variant="body2"><strong>Holder:</strong> {selectedWithdrawal.bankDetails?.accountHolderName}</Typography></Grid>
                                </Grid>
                            </Paper>

                            <TextField
                                fullWidth
                                label="Transaction ID (if processed)"
                                value={transactionId}
                                onChange={(e) => setTransactionId(e.target.value)}
                                sx={{ mb: 2 }}
                                disabled={selectedWithdrawal.status !== 'pending'}
                            />

                            <TextField
                                fullWidth
                                label="Admin Notes"
                                multiline
                                rows={3}
                                value={adminNotes}
                                onChange={(e) => setAdminNotes(e.target.value)}
                                disabled={selectedWithdrawal.status !== 'pending'}
                            />
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>Close</Button>
                    {selectedWithdrawal?.status === 'pending' && (
                        <>
                            <Button
                                color="error"
                                variant="outlined"
                                startIcon={<Cancel />}
                                onClick={() => handleUpdateStatus('rejected')}
                                disabled={updateLoading}
                            >
                                Reject
                            </Button>
                            <Button
                                color="success"
                                variant="contained"
                                startIcon={<CheckCircle />}
                                onClick={() => handleUpdateStatus('approved')}
                                disabled={updateLoading}
                            >
                                Approve & Process
                            </Button>
                        </>
                    )}
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default WithdrawalManagement;
