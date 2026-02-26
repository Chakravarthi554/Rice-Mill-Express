import React, { useEffect, useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Button, CircularProgress, Alert, Box, Typography
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { listMyOrders, cancelOrder, downloadInvoice } from '../../redux/actions/orderActions';
import OrderTracker from './OrderTracker';
import { Download as DownloadIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

const OrderHistory = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { loading, error, orders } = useSelector(state => state.orderListMy);
  const { loading: cancelLoading, success: cancelSuccess } = useSelector(state => state.orderCancel);
  const [cancellingId, setCancellingId] = React.useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    dispatch(listMyOrders());
  }, [dispatch, cancelSuccess]);

  const handleCancel = async (orderId) => {
    const reason = window.prompt(t('cancelReasonPrompt'));
    if (reason && window.confirm(t('cancelOrderConfirm'))) {
      setCancellingId(orderId);
      await dispatch(cancelOrder(orderId, reason));
      setCancellingId(null);
    }
  };

  const handleDownload = async (orderId) => {
    setDownloadingId(orderId);
    await dispatch(downloadInvoice(orderId));
    setDownloadingId(null);
  };

  if (loading) return <CircularProgress sx={{ display: 'block', mx: 'auto', my: 4 }} />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <TableContainer component={Paper} sx={{ mt: 3 }}>
      <Table>
        <TableHead sx={{ backgroundColor: 'grey.100' }}>
          <TableRow>
            <TableCell><strong>{t('id')}</strong></TableCell>
            <TableCell><strong>{t('date')}</strong></TableCell>
            <TableCell><strong>{t('total')}</strong></TableCell>
            <TableCell><strong>{t('status')}</strong></TableCell>
            <TableCell align="center"><strong>{t('actions')}</strong></TableCell>
            <TableCell><strong>{t('tracking')}</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {orders.map(o => (
            <TableRow key={o._id} hover>
              <TableCell>{o._id.toString().slice(-8).toUpperCase()}</TableCell>
              <TableCell>{new Date(o.createdAt).toLocaleDateString()}</TableCell>
              <TableCell>₹{o.totalPrice}</TableCell>
              <TableCell>{t(o.orderStatus.toLowerCase())}</TableCell>
              <TableCell align="center">
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                  <Button
                    size="small"
                    color="primary"
                    variant="contained"
                    startIcon={downloadingId === o._id ? <CircularProgress size={16} color="inherit" /> : <DownloadIcon />}
                    onClick={() => handleDownload(o._id)}
                    disabled={downloadingId !== null}
                  >
                    {downloadingId === o._id ? '...' : t('invoice')}
                  </Button>
                  {['placed', 'processing', 'packed'].includes(o.orderStatus.toLowerCase()) && (
                    <Button
                      size="small"
                      color="error"
                      variant="outlined"
                      onClick={() => handleCancel(o._id)}
                      disabled={cancellingId === o._id}
                    >
                      {cancellingId === o._id ? '...' : t('cancel')}
                    </Button>
                  )}
                </Box>
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