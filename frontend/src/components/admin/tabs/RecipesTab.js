import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, Chip, IconButton, Pagination, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField
} from '@mui/material';
import { 
  Visibility as ViewIcon, 
  Check as ApproveIcon, 
  Close as RejectIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { listPendingRecipes, approveRecipe, getRecipeDetails } from '../../../redux/actions/recipeActions';
import RecipeReviewModal from '../RecipeReviewModal';
import Loader from '../../common/Loader';
import Message from '../../common/Message';

const RecipesTab = () => {
  const dispatch = useDispatch();
  const [page, setPage] = useState(1);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const recipeListPending = useSelector((state) => state.recipeListPending);
  const { loading, error, recipes = [], pages = 1, total = 0 } = recipeListPending;

  const recipeApprove = useSelector((state) => state.recipeApprove);
  const { loading: approving, error: approveError, success: approveSuccess } = recipeApprove;

  useEffect(() => {
    dispatch(listPendingRecipes({ pageNumber: page }));
  }, [dispatch, page, approveSuccess]);

  const handleViewRecipe = async (recipeId) => {
    try {
      await dispatch(getRecipeDetails(recipeId));
      setSelectedRecipe(recipeId);
      setReviewModalOpen(true);
    } catch (error) {
      console.error('Error loading recipe details:', error);
    }
  };

  const handleApprove = (recipeId) => {
    if (window.confirm('Are you sure you want to approve this recipe?')) {
      dispatch(approveRecipe(recipeId, 'approved'));
    }
  };

  const handleReject = (recipeId) => {
    setSelectedRecipe(recipeId);
    setRejectDialogOpen(true);
  };

  const confirmReject = () => {
    if (selectedRecipe && rejectReason.trim()) {
      dispatch(approveRecipe(selectedRecipe, 'rejected'));
      setRejectDialogOpen(false);
      setRejectReason('');
      setSelectedRecipe(null);
    } else {
      alert('Please provide a rejection reason');
    }
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  const refreshList = () => {
    dispatch(listPendingRecipes({ pageNumber: page }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'approved': return 'success';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Recipe Approvals
        </Typography>
        <Button
          startIcon={<RefreshIcon />}
          onClick={refreshList}
          variant="outlined"
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {approveError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {approveError}
        </Alert>
      )}

      {approveSuccess && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Recipe status updated successfully!
        </Alert>
      )}

      <Paper elevation={3} sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Pending Recipes ({total})
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Page {page} of {pages}
          </Typography>
        </Box>

        {loading && recipes.length === 0 ? (
          <Loader />
        ) : error ? (
          <Message severity="error">{error}</Message>
        ) : recipes.length === 0 ? (
          <Alert severity="info">
            No pending recipes for approval.
          </Alert>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Title</strong></TableCell>
                    <TableCell><strong>Seller</strong></TableCell>
                    <TableCell><strong>Rice Type</strong></TableCell>
                    <TableCell><strong>Products</strong></TableCell>
                    <TableCell><strong>Submitted</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recipes.map((recipe) => (
                    <TableRow key={recipe._id} hover>
                      <TableCell>
                        <Typography variant="subtitle2" noWrap sx={{ maxWidth: 200 }}>
                          {recipe.title}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {recipe.sellerId?.name || 'Unknown Seller'}
                      </TableCell>
                      <TableCell>
                        <Chip label={recipe.riceType} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        {recipe.linkedProducts?.length > 0 ? (
                          <Typography variant="body2">
                            {recipe.linkedProducts.length} product(s)
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No products
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(recipe.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={recipe.status}
                          color={getStatusColor(recipe.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleViewRecipe(recipe._id)}
                            title="View Details"
                          >
                            <ViewIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => handleApprove(recipe._id)}
                            disabled={approving}
                            title="Approve Recipe"
                          >
                            <ApproveIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleReject(recipe._id)}
                            disabled={approving}
                            title="Reject Recipe"
                          >
                            <RejectIcon />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {pages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Pagination
                  count={pages}
                  page={page}
                  onChange={handlePageChange}
                  color="primary"
                />
              </Box>
            )}
          </>
        )}
      </Paper>

      {/* Recipe Review Modal */}
      <RecipeReviewModal
        open={reviewModalOpen}
        onClose={() => {
          setReviewModalOpen(false);
          setSelectedRecipe(null);
        }}
        recipeId={selectedRecipe}
        onApprove={handleApprove}
        onReject={handleReject}
      />

      {/* Reject Reason Dialog */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reject Recipe</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Please provide a reason for rejecting this recipe. The seller will see this feedback.
          </Typography>
          <TextField
            autoFocus
            label="Rejection Reason"
            fullWidth
            multiline
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="e.g., Missing cooking instructions, poor image quality, inappropriate content..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={confirmReject} 
            variant="contained" 
            color="error"
            disabled={!rejectReason.trim()}
          >
            Confirm Reject
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RecipesTab;