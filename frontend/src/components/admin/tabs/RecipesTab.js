import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, Chip, IconButton, Pagination, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Tabs, Tab, Tooltip, Avatar
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Check as ApproveIcon,
  Close as RejectIcon,
  Refresh as RefreshIcon,
  Favorite as LikeIcon,
  Comment as CommentIcon,
  Share as ShareIcon,
  Star as StarIcon,
  Assessment as AnalyticsIcon
} from '@mui/icons-material';
import axios from 'axios';
import { listPendingRecipes, approveRecipe, getRecipeDetails } from '../../../redux/actions/recipeActions';
import RecipeReviewModal from '../RecipeReviewModal';
import Loader from '../../common/Loader';
import Message from '../../common/Message';

const RecipesTab = () => {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState(0);
  const [page, setPage] = useState(1);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Library State
  const [libraryRecipes, setLibraryRecipes] = useState([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [libraryError, setLibraryError] = useState(null);
  const [libraryTotal, setLibraryTotal] = useState(0);
  const [libraryPages, setLibraryPages] = useState(1);

  const recipeListPending = useSelector((state) => state.recipeListPending);
  const { loading: pendingLoading, error: pendingError, recipes: pendingRecipes = [], pages: pendingPages = 1, total: pendingTotal = 0 } = recipeListPending;

  const recipeApprove = useSelector((state) => state.recipeApprove);
  const { loading: approving, error: approveError, success: approveSuccess } = recipeApprove;

  const { userInfo } = useSelector((state) => state.userLogin);

  const fetchLibrary = useCallback(async () => {
    try {
      setLibraryLoading(true);
      const config = {
        headers: { Authorization: `Bearer ${userInfo.token}` },
        params: { pageNumber: page }
      };
      const { data } = await axios.get('/api/admin/engagement/recipes', config);
      setLibraryRecipes(data.recipes);
      setLibraryTotal(data.total);
      setLibraryPages(data.pages);
      setLibraryLoading(false);
    } catch (err) {
      setLibraryError(err.response?.data?.message || err.message);
      setLibraryLoading(false);
    }
  }, [userInfo.token, page]);

  useEffect(() => {
    if (activeTab === 0) {
      dispatch(listPendingRecipes({ pageNumber: page }));
    } else {
      fetchLibrary();
    }
  }, [dispatch, page, approveSuccess, activeTab, fetchLibrary]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setPage(1);
  };

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
    if (activeTab === 0) {
      dispatch(listPendingRecipes({ pageNumber: page }));
    } else {
      fetchLibrary();
    }
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
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label={`Pending Approvals (${pendingTotal})`} />
          <Tab label="Recipe Library (Analytics)" />
        </Tabs>
        <Button
          startIcon={<RefreshIcon />}
          onClick={refreshList}
          size="small"
          disabled={pendingLoading || libraryLoading}
        >
          Refresh
        </Button>
      </Box>

      {approveError && <Alert severity="error" sx={{ mb: 2 }}>{approveError}</Alert>}
      {approveSuccess && <Alert severity="success" sx={{ mb: 2 }}>Recipe status updated successfully!</Alert>}

      <Paper elevation={3} sx={{ p: 0, overflow: 'hidden' }}>
        {activeTab === 0 ? (
          // PENDING APPROVALS VIEW
          <>
            <Box sx={{ p: 2, bgcolor: 'rgba(255, 152, 0, 0.05)' }}>
              <Typography variant="h6" color="warning.main">Pending Approvals</Typography>
            </Box>
            {pendingLoading ? <Loader /> : pendingError ? <Message severity="error">{pendingError}</Message> : pendingRecipes.length === 0 ? (
              <Alert severity="info" sx={{ m: 2 }}>No pending recipes for approval.</Alert>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Recipe</strong></TableCell>
                      <TableCell><strong>Seller</strong></TableCell>
                      <TableCell><strong>Type</strong></TableCell>
                      <TableCell><strong>Products</strong></TableCell>
                      <TableCell><strong>Submitted</strong></TableCell>
                      <TableCell align="right"><strong>Actions</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pendingRecipes.map((recipe) => (
                      <TableRow key={recipe._id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar src={recipe.image} variant="rounded" sx={{ width: 40, height: 40 }} />
                            <Typography variant="subtitle2">{recipe.title}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{recipe.sellerId?.name || 'Unknown'}</TableCell>
                        <TableCell><Chip label={recipe.riceType} size="small" variant="outlined" /></TableCell>
                        <TableCell>{recipe.linkedProducts?.length || 0} items</TableCell>
                        <TableCell>{new Date(recipe.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                            <IconButton size="small" color="primary" onClick={() => handleViewRecipe(recipe._id)}><ViewIcon fontSize="small" /></IconButton>
                            <IconButton size="small" color="success" onClick={() => handleApprove(recipe._id)}><ApproveIcon fontSize="small" /></IconButton>
                            <IconButton size="small" color="error" onClick={() => handleReject(recipe._id)}><RejectIcon fontSize="small" /></IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
              {pendingPages > 1 && <Pagination count={pendingPages} page={page} onChange={handlePageChange} color="primary" />}
            </Box>
          </>
        ) : (
          // RECIPE LIBRARY / ANALYTICS VIEW
          <>
            <Box sx={{ p: 2, bgcolor: 'rgba(33, 150, 243, 0.05)' }}>
              <Typography variant="h6" color="primary">Recipe Library & Engagement</Typography>
            </Box>
            {libraryLoading ? <Loader /> : libraryError ? <Message severity="error">{libraryError}</Message> : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Recipe</strong></TableCell>
                      <TableCell><strong>Seller / Business</strong></TableCell>
                      <TableCell align="center"><strong>Rating</strong></TableCell>
                      <TableCell align="center"><strong>Likes</strong></TableCell>
                      <TableCell align="center"><strong>Comments</strong></TableCell>
                      <TableCell align="center"><strong>Shares</strong></TableCell>
                      <TableCell><strong>Status</strong></TableCell>
                      <TableCell align="right"><strong>Actions</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {libraryRecipes.map((recipe) => (
                      <TableRow key={recipe._id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar src={recipe.image} variant="rounded" sx={{ width: 40, height: 40 }} />
                            <Typography variant="subtitle2" noWrap sx={{ maxWidth: 200 }}>{recipe.title}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{recipe.seller}</Typography>
                          <Typography variant="caption" color="text.secondary">{recipe.business}</Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                            <StarIcon sx={{ color: '#faaf00', fontSize: 16 }} />
                            <Typography variant="body2">{recipe.metrics.averageRating}</Typography>
                          </Box>
                          <Typography variant="caption" color="text.secondary">({recipe.metrics.numReviews})</Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip icon={<LikeIcon sx={{ fontSize: '14px !important' }} />} label={recipe.metrics.likes} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell align="center">
                          <Chip icon={<CommentIcon sx={{ fontSize: '14px !important' }} />} label={recipe.metrics.comments} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell align="center">
                          <Chip icon={<ShareIcon sx={{ fontSize: '14px !important' }} />} label={recipe.metrics.shares} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell>
                          <Chip label={recipe.status} color={getStatusColor(recipe.status)} size="small" />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton size="small" color="primary" onClick={() => handleViewRecipe(recipe._id)} title="View Details">
                            <AnalyticsIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
              {libraryPages > 1 && <Pagination count={libraryPages} page={page} onChange={handlePageChange} color="primary" />}
            </Box>
          </>
        )}
      </Paper>

      {/* Modals & Dialogs */}
      <RecipeReviewModal
        open={reviewModalOpen}
        onClose={() => { setReviewModalOpen(false); setSelectedRecipe(null); }}
        recipeId={selectedRecipe}
        onApprove={handleApprove}
        onReject={handleReject}
      />

      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reject Recipe</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Please provide a reason for rejecting this recipe.</Typography>
          <TextField autoFocus label="Rejection Reason" fullWidth multiline rows={3} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmReject} variant="contained" color="error" disabled={!rejectReason.trim()}>Confirm Reject</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RecipesTab;