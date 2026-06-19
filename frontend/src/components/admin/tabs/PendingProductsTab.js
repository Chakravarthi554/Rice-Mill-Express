import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box, Typography, Button, CircularProgress, TextField, Dialog,
  DialogTitle, DialogContent, DialogActions, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Avatar, Chip, Alert
} from '@mui/material';
import { Refresh as RefreshIcon, CheckCircle, Cancel } from '@mui/icons-material';
import { listPendingProducts, approveProduct } from '../../../redux/actions/productActions';
import { PRODUCT_APPROVE_RESET } from '../../../redux/constants/productConstants';

const PendingProductsTab = () => {
  const dispatch = useDispatch();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [openRejectDialog, setOpenRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [search, setSearch] = useState('');

  const { products = [], loading, error } = useSelector(state => state.productListPending || {});
  const { success: approveSuccess, loading: approveLoading, error: approveError } = useSelector(state => state.productApprove || {});

  useEffect(() => {
    dispatch(listPendingProducts());
  }, [dispatch]);

  useEffect(() => {
    if (approveSuccess) {
      setOpenRejectDialog(false);
      setRejectionReason('');
      setSelectedProduct(null);
      dispatch(listPendingProducts());
      dispatch({ type: PRODUCT_APPROVE_RESET });
    }
  }, [approveSuccess, dispatch]);

  const handleApprove = (id) => {
    if (window.confirm('Are you sure you want to approve this product?')) {
      dispatch(approveProduct(id, 'approved'));
    }
  };

  const handleOpenReject = (product) => {
    setSelectedProduct(product);
    setOpenRejectDialog(true);
  };

  const handleRejectSubmit = () => {
    if (!rejectionReason.trim()) return;
    dispatch(approveProduct(selectedProduct._id, 'rejected', rejectionReason));
  };

  const filteredProducts = products.filter(p => 
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.brand?.toLowerCase().includes(search.toLowerCase()) ||
    p.seller?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: 2, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Search product, brand, seller..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          sx={{ minWidth: 260 }}
        />
        <Button
          startIcon={<RefreshIcon />}
          variant="outlined"
          onClick={() => dispatch(listPendingProducts())}
          size="small"
          sx={{ borderRadius: 1.5, textTransform: 'none' }}
        >
          Refresh List
        </Button>
      </Box>

      {approveError && <Alert severity="error" sx={{ mb: 2 }}>{approveError}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress />
        </Box>
      ) : filteredProducts.length === 0 ? (
        <Paper variant="outlined" sx={{ py: 6, textAlign: 'center', borderRadius: 3, borderStyle: 'dashed' }}>
          <Typography color="text.secondary">No pending products found</Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <Table>
            <TableHead sx={{ bgcolor: '#FAFAFA' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Image</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Product Name</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Seller</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Price</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Stock</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredProducts.map(product => (
                <TableRow key={product._id} hover>
                  <TableCell>
                    <Avatar
                      variant="rounded"
                      src={product.images?.[0] || '/images/default-image.jpg'}
                      alt={product.name}
                      sx={{ width: 48, height: 48, border: '1px solid #E5E7EB' }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography fontWeight={700} fontSize="0.9rem">{product.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{product.brand || 'No Brand'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography fontWeight={500} fontSize="0.85rem">{product.seller?.name || 'Seller'}</Typography>
                    <Typography variant="caption" color="text.secondary">{product.seller?.businessName || ''}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={product.category} size="small" variant="outlined" sx={{ fontSize: '0.75rem', fontWeight: 600 }} />
                  </TableCell>
                  <TableCell>
                    <Typography fontWeight={700} fontSize="0.9rem">₹{product.offerPrice || product.price}</Typography>
                    {product.offerPrice && (
                      <Typography variant="caption" color="text.secondary" sx={{ textDecoration: 'line-through', ml: 0.5 }}>
                        ₹{product.price}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{product.countInStock} {product.unit || 'kg'}</Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Box display="flex" justifyContent="center" gap={1}>
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        startIcon={<CheckCircle />}
                        onClick={() => handleApprove(product._id)}
                        disabled={approveLoading}
                        sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 600, fontSize: '0.75rem' }}
                      >
                        Approve
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        startIcon={<Cancel />}
                        onClick={() => handleOpenReject(product)}
                        disabled={approveLoading}
                        sx={{ borderRadius: 1.5, textTransform: 'none', fontWeight: 600, fontSize: '0.75rem' }}
                      >
                        Reject
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Reject dialog */}
      <Dialog open={openRejectDialog} onClose={() => setOpenRejectDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Reject Product Approval</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Please state the reason for rejecting <b>{selectedProduct?.name}</b>. This reason will be emailed to the seller.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Rejection Reason"
            value={rejectionReason}
            onChange={e => setRejectionReason(e.target.value)}
            error={!rejectionReason.trim()}
            helperText={!rejectionReason.trim() ? 'Reason is required' : ''}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenRejectDialog(false)} sx={{ color: '#6B7280' }}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            disabled={!rejectionReason.trim() || approveLoading}
            onClick={handleRejectSubmit}
            sx={{ borderRadius: 1.5, fontWeight: 700 }}
          >
            {approveLoading ? 'Submitting...' : 'Reject Product'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PendingProductsTab;
