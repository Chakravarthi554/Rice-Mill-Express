import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, Chip, TextField, InputAdornment,
  CircularProgress, Alert, IconButton, Tooltip, Stack
} from '@mui/material';
import { Search, CheckCircle, Cancel, Delete, PushPin, Warning, Refresh } from '@mui/icons-material';
import {
  getPendingPosts, approvePost, deleteForumPost, pinPost,
  getFlaggedForumComments, getForumPosts
} from '../../redux/actions/forumActions';

const AdminForumPanel = () => {
  const dispatch = useDispatch();
  const { userInfo } = useSelector(state => state.userLogin);

  // Forum states
  const [pendingPosts, setPendingPosts] = useState([]);
  const [approvedPosts, setApprovedPosts] = useState([]);
  const [flaggedComments, setFlaggedComments] = useState([]);
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 🔥 CRITICAL FIX: Enhanced data fetching with authentication check
  const fetchData = useCallback(async () => {
    if (!userInfo || userInfo.role !== 'admin') {
      console.error('❌ AdminForumPanel: User not authenticated or not admin');
      setError('Authentication required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('🔄 AdminForumPanel: Fetching data for admin:', userInfo._id);
      
      // Fetch pending posts
      const pendingResult = await dispatch(getPendingPosts());
      if (pendingResult && pendingResult.posts) {
        setPendingPosts(pendingResult.posts);
      }

      // Fetch approved posts
      const approvedResult = await dispatch(getForumPosts(1, 100, '', '', { status: 'approved' }));
      if (approvedResult && approvedResult.posts) {
        setApprovedPosts(approvedResult.posts);
      }

      // Fetch flagged comments
      const flaggedResult = await dispatch(getFlaggedForumComments());
      if (flaggedResult && flaggedResult.comments) {
        setFlaggedComments(flaggedResult.comments);
      }

      console.log('✅ AdminForumPanel: Data fetched successfully');
    } catch (err) {
      console.error('❌ AdminForumPanel: Error fetching data:', err);
      setError(err.message || 'Failed to load forum data');
    } finally {
      setLoading(false);
    }
  }, [dispatch, userInfo]);

  useEffect(() => {
    if (userInfo && userInfo.role === 'admin') {
      fetchData();
    }
  }, [fetchData, userInfo]);

  const handleApprove = async (id) => {
    try {
      await dispatch(approvePost(id, 'approved'));
      await fetchData(); // Refresh data
    } catch (err) {
      console.error('Error approving post:', err);
      setError('Failed to approve post');
    }
  };

  const handleReject = async (id) => {
    try {
      await dispatch(approvePost(id, 'rejected'));
      await fetchData(); // Refresh data
    } catch (err) {
      console.error('Error rejecting post:', err);
      setError('Failed to reject post');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this post permanently?')) {
      try {
        await dispatch(deleteForumPost(id));
        setApprovedPosts(prev => prev.filter(p => p._id !== id));
        await fetchData(); // Refresh data
      } catch (err) {
        console.error('Error deleting post:', err);
        setError('Failed to delete post');
      }
    }
  };

  const handlePin = async (id) => {
    try {
      await dispatch(pinPost(id));
      setApprovedPosts(prev => prev.map(p => p._id === id ? { ...p, pinned: !p.pinned } : p));
    } catch (err) {
      console.error('Error pinning post:', err);
      setError('Failed to pin/unpin post');
    }
  };

  const handleRefresh = () => {
    fetchData();
  };

  const filteredPending = pendingPosts.filter(p =>
    p.title?.toLowerCase().includes(search.toLowerCase()) &&
    (!tagFilter || p.tags?.includes(tagFilter))
  );

  const filteredFlagged = flaggedComments.filter(c =>
    c.postTitle?.toLowerCase().includes(search.toLowerCase())
  );

  // Show loading if user info is not loaded yet
  if (!userInfo) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading user information...</Typography>
      </Box>
    );
  }

  // Show access denied if user is not admin
  if (userInfo.role !== 'admin') {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Access denied. Admin privileges required to view this panel.
          Current role: {userInfo.role}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" color="primary" fontWeight="bold">
          Forum Moderation
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={handleRefresh}
          disabled={loading}
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* PENDING POSTS */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 2, boxShadow: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" fontWeight="bold">
            Pending Posts ({filteredPending.length})
          </Typography>
          <TextField 
            size="small" 
            placeholder="Search pending posts..." 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            InputProps={{ 
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ) 
            }} 
          />
        </Stack>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : filteredPending.length === 0 ? (
          <Alert severity="info">No pending posts for review</Alert>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Title</strong></TableCell>
                  <TableCell><strong>User</strong></TableCell>
                  <TableCell><strong>Tags</strong></TableCell>
                  <TableCell><strong>Time</strong></TableCell>
                  <TableCell align="center"><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredPending.map(p => (
                  <TableRow key={p._id}>
                    <TableCell>{p.title}</TableCell>
                    <TableCell>{p.userId?.name}</TableCell>
                    <TableCell>
                      {p.tags?.map(t => (
                        <Chip key={t} label={`#${t}`} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                      ))}
                    </TableCell>
                    <TableCell>{new Date(p.createdAt).toLocaleTimeString()}</TableCell>
                    <TableCell align="center">
                      <Tooltip title="Approve">
                        <IconButton color="success" onClick={() => handleApprove(p._id)}>
                          <CheckCircle />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Reject">
                        <IconButton color="error" onClick={() => handleReject(p._id)}>
                          <Cancel />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* FLAGGED COMMENTS */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 2, boxShadow: 3 }}>
        <Typography variant="h6" fontWeight="bold" mb={2}>
          Flagged Comments ({filteredFlagged.length})
        </Typography>
        {filteredFlagged.length === 0 ? (
          <Alert severity="info">No flagged comments</Alert>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Post</strong></TableCell>
                  <TableCell><strong>Comment</strong></TableCell>
                  <TableCell><strong>User</strong></TableCell>
                  <TableCell><strong>Reports</strong></TableCell>
                  <TableCell align="center"><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredFlagged.map(c => (
                  <TableRow key={c._id}>
                    <TableCell>{c.postTitle}</TableCell>
                    <TableCell>{c.text?.substring(0, 50)}...</TableCell>
                    <TableCell>{c.userId?.name}</TableCell>
                    <TableCell>
                      <Chip label={c.reports?.length || 0} color="error" size="small" />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Delete Comment">
                        <IconButton color="error">
                          <Delete />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Warn User">
                        <IconButton color="warning">
                          <Warning />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* APPROVED POSTS */}
      <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" fontWeight="bold">
            Approved Posts ({approvedPosts.length})
          </Typography>
          <TextField 
            size="small" 
            placeholder="Filter by tag..." 
            value={tagFilter} 
            onChange={e => setTagFilter(e.target.value)} 
          />
        </Stack>
        
        {approvedPosts.length === 0 ? (
          <Alert severity="info">No approved posts found</Alert>
        ) : (
          <Box sx={{ maxHeight: '400px', overflow: 'auto' }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Title</strong></TableCell>
                    <TableCell><strong>User</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {approvedPosts.map(p => (
                    <TableRow key={p._id}>
                      <TableCell>{p.title}</TableCell>
                      <TableCell>{p.userId?.name}</TableCell>
                      <TableCell>
                        <Chip 
                          label={p.pinned ? 'Pinned' : 'Approved'} 
                          color={p.pinned ? 'primary' : 'success'} 
                          size="small" 
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title={p.pinned ? 'Unpin' : 'Pin'}>
                          <IconButton 
                            size="small" 
                            color="primary" 
                            onClick={() => handlePin(p._id)}
                          >
                            <PushPin fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton 
                            size="small" 
                            color="error" 
                            onClick={() => handleDelete(p._id)}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default AdminForumPanel;