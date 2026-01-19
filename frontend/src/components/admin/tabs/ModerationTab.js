import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Paper,
  Chip,
  Button,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  ThumbUp,
  ThumbDown,
  Delete,
  PushPin,
  Flag,
  Restaurant,  // ← Fixed: Use Restaurant instead of non-existent Recipe
  Forum,
  Comment,
  Star,
  Refresh,
  Visibility
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import {
  getPendingContent,
  getFlaggedContent,
  approveContent,
  rejectContent,
  deleteContent,
  pinForumPost,
  getModerationStats
} from '../../../redux/actions/moderationActions';  // ← Fixed: Correct relative path
import ModerationItem from '../ModerationItem';

const ModerationTab = () => {
  const dispatch = useDispatch();
  const {
    pendingContent,
    flaggedContent,
    stats,
    loading,
    error
  } = useSelector(state => state.moderation);

  const { userInfo } = useSelector(state => state.userLogin);

  const [activeTab, setActiveTab] = useState(0);
  const [contentType, setContentType] = useState('all');
  const [actionDialog, setActionDialog] = useState({ open: false, type: '', item: null });
  const [moderationNotes, setModerationNotes] = useState('');

  const socketRef = useRef();

  useEffect(() => {
    loadContent();
    dispatch(getModerationStats());
  }, [dispatch, activeTab, contentType]);

  useEffect(() => {
    // Setup socket for real-time updates with proper URL fallback and error handling
    const socketUrl = process.env.REACT_APP_SOCKET_URL || process.env.REACT_APP_API_URL || "http://localhost:5000";

    try {
      socketRef.current = io(socketUrl, {
        auth: { token: `Bearer ${userInfo?.token}` },
        transports: ["websocket", "polling"],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      socketRef.current.on('connect', () => {
        console.log('✅ Socket connected to moderation updates');
        socketRef.current.emit('joinAdminRoom');
      });

      socketRef.current.on('connect_error', (error) => {
        console.warn('⚠️ Socket connection error:', error.message);
        // Continue without socket - moderation will work via manual refresh
      });

      socketRef.current.on('NEW_CONTENT_PENDING', () => {
        console.log('🔔 New content pending moderation');
        loadContent();
        dispatch(getModerationStats());
      });

      socketRef.current.on('CONTENT_REPORTED', () => {
        console.log('🔔 Content reported');
        if (activeTab === 1) {
          dispatch(getFlaggedContent({ page: 1, limit: 20 }));
        }
        dispatch(getModerationStats());
      });

      return () => {
        socketRef.current?.disconnect();
      };
    } catch (error) {
      console.error('❌ Failed to initialize socket:', error);
      // Continue without socket - not critical for functionality
    }
  }, [dispatch, userInfo, activeTab]);

  const loadContent = async () => {
    try {
      if (activeTab === 0) {
        await dispatch(getPendingContent({ type: contentType, page: 1, limit: 20 }));
      } else {
        await dispatch(getFlaggedContent({ page: 1, limit: 20 }));
      }
    } catch (error) {
      console.error('Error loading moderation content:', error);
      // Error will be handled by Redux and displayed in the UI
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleApprove = (item) => {
    dispatch(approveContent(item.type, item._id, { moderationNotes }))
      .then(() => {
        setActionDialog({ open: false, type: '', item: null });
        setModerationNotes('');
        loadContent();
        dispatch(getModerationStats());
      });
  };

  const handleReject = (item) => {
    if (!moderationNotes.trim()) {
      alert('Please provide moderation notes for rejection');
      return;
    }
    dispatch(rejectContent(item.type, item._id, { moderationNotes }))
      .then(() => {
        setActionDialog({ open: false, type: '', item: null });
        setModerationNotes('');
        loadContent();
        dispatch(getModerationStats());
      });
  };

  const handleDelete = (item) => {
    dispatch(deleteContent(item.type, item._id, { moderationNotes }))
      .then(() => {
        setActionDialog({ open: false, type: '', item: null });
        setModerationNotes('');
        loadContent();
        dispatch(getModerationStats());
      });
  };

  const handlePin = (postId) => {
    dispatch(pinForumPost(postId))
      .then(() => {
        loadContent();
      });
  };

  const openActionDialog = (actionType, item) => {
    setActionDialog({ open: true, type: actionType, item });
    setModerationNotes('');
  };

  const closeActionDialog = () => {
    setActionDialog({ open: false, type: '', item: null });
    setModerationNotes('');
  };

  const getContentTypeIcon = (type) => {
    switch (type) {
      case 'recipe': return <Restaurant />;  // ← Fixed: Use Restaurant icon
      case 'forum_post': return <Forum />;
      case 'recipe_comment':
      case 'forum_comment': return <Comment />;
      case 'product_review': return <Star />;
      default: return <Visibility />;
    }
  };

  const getContentTypeColor = (type) => {
    switch (type) {
      case 'recipe': return 'primary';
      case 'forum_post': return 'secondary';
      case 'recipe_comment':
      case 'forum_comment': return 'info';
      case 'product_review': return 'warning';
      default: return 'default';
    }
  };

  const currentContent = activeTab === 0 ? pendingContent : flaggedContent;

  return (
    <Box>
      {/* Header with Stats */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h5" gutterBottom>
              🛡️ Content Moderation
            </Typography>
            <Button
              startIcon={<Refresh />}
              onClick={loadContent}
              variant="outlined"
              disabled={loading}
            >
              Refresh
            </Button>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.light', color: 'warning.contrastText' }}>
                <Typography variant="h6">{stats?.pending?.total || 0}</Typography>
                <Typography variant="body2">Pending Review</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'error.light', color: 'error.contrastText' }}>
                <Typography variant="h6">{stats?.flagged?.total || 0}</Typography>
                <Typography variant="body2">Flagged Content</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'info.light', color: 'info.contrastText' }}>
                <Typography variant="h6">{stats?.moderationActivity?.today || 0}</Typography>
                <Typography variant="body2">Today's Actions</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.light', color: 'success.contrastText' }}>
                <Typography variant="h6">{stats?.moderationActivity?.thisWeek || 0}</Typography>
                <Typography variant="body2">This Week</Typography>
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card>
        <CardContent>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs value={activeTab} onChange={handleTabChange}>
              <Tab
                icon={<ThumbUp />}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    Pending Review
                    {stats?.pending?.total > 0 && (
                      <Chip
                        label={stats.pending.total}
                        size="small"
                        color="warning"
                      />
                    )}
                  </Box>
                }
              />
              <Tab
                icon={<Flag />}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    Flagged Content
                    {stats?.flagged?.total > 0 && (
                      <Chip
                        label={stats.flagged.total}
                        size="small"
                        color="error"
                      />
                    )}
                  </Box>
                }
              />
            </Tabs>
          </Box>

          {/* Filters */}
          {activeTab === 0 && (
            <Box sx={{ mb: 2 }}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Content Type</InputLabel>
                <Select
                  value={contentType}
                  label="Content Type"
                  onChange={(e) => setContentType(e.target.value)}
                >
                  <MenuItem value="all">All Types</MenuItem>
                  <MenuItem value="recipes">Recipes</MenuItem>
                  <MenuItem value="forum">Forum Posts</MenuItem>
                  <MenuItem value="comments">Comments & Reviews</MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}

          {/* Content List */}
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          ) : (
            <Box>
              {currentContent?.length === 0 ? (
                <Box textAlign="center" py={4}>
                  <Typography variant="h6" color="text.secondary">
                    {activeTab === 0 ? 'No content pending review' : 'No flagged content'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {activeTab === 0
                      ? 'All content has been moderated'
                      : 'No content has been reported recently'
                    }
                  </Typography>
                </Box>
              ) : (
                <Grid container spacing={2}>
                  {currentContent.map((item) => (
                    <Grid item xs={12} key={`${item.type}-${item._id}`}>
                      <ModerationItem
                        item={item}
                        onApprove={() => openActionDialog('approve', item)}
                        onReject={() => openActionDialog('reject', item)}
                        onDelete={() => openActionDialog('delete', item)}
                        onPin={activeTab === 0 && item.type === 'forum_post' ? () => handlePin(item._id) : null}
                        getTypeIcon={getContentTypeIcon}
                        getTypeColor={getContentTypeColor}
                      />
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog
        open={actionDialog.open}
        onClose={closeActionDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {actionDialog.type === 'approve' && 'Approve Content'}
          {actionDialog.type === 'reject' && 'Reject Content'}
          {actionDialog.type === 'delete' && 'Delete Content'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            You are about to {actionDialog.type} this content:
          </Typography>

          {actionDialog.item && (
            <Paper sx={{ p: 2, bgcolor: 'grey.50', mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                {actionDialog.item.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {actionDialog.item.content}
              </Typography>
              <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  icon={getContentTypeIcon(actionDialog.item.type)}
                  label={actionDialog.item.type.replace('_', ' ')}
                  size="small"
                  color={getContentTypeColor(actionDialog.item.type)}
                />
                <Chip
                  label={`By: ${actionDialog.item.user?.name}`}
                  size="small"
                  variant="outlined"
                />
              </Box>
            </Paper>
          )}

          <TextField
            fullWidth
            multiline
            rows={3}
            label="Moderation Notes"
            value={moderationNotes}
            onChange={(e) => setModerationNotes(e.target.value)}
            placeholder={
              actionDialog.type === 'approve'
                ? 'Optional notes about why this was approved...'
                : 'Please explain why this content is being rejected/deleted...'
            }
            required={actionDialog.type !== 'approve'}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeActionDialog}>Cancel</Button>
          <Button
            onClick={() => {
              if (actionDialog.type === 'approve') handleApprove(actionDialog.item);
              else if (actionDialog.type === 'reject') handleReject(actionDialog.item);
              else if (actionDialog.type === 'delete') handleDelete(actionDialog.item);
            }}
            variant="contained"
            color={
              actionDialog.type === 'approve' ? 'success' :
                actionDialog.type === 'reject' ? 'warning' : 'error'
            }
            disabled={actionDialog.type !== 'approve' && !moderationNotes.trim()}
          >
            {actionDialog.type === 'approve' && 'Approve'}
            {actionDialog.type === 'reject' && 'Reject'}
            {actionDialog.type === 'delete' && 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ModerationTab;