import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, CircularProgress, Alert, Grid,
  TextField, Avatar, Paper, IconButton, Divider, Chip, Tooltip,
  Snackbar, InputAdornment
} from '@mui/material';
import {
  Search, Add, Home, Bookmark, Share, Comment,
  Favorite, PhotoCamera, Tag, MoreVert, Forum as ForumIcon
} from '@mui/icons-material';
import { createForumPost, getForumPosts } from '../../redux/actions/forumActions';
import ForumPostCard from '../common/ForumPostCard';

const STORY_COLORS = ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#3B82F6', '#8B5CF6', '#EC4899'];

const CommunityForum = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.userLogin);
  const { posts = [], loading, error } = useSelector((state) => state.forumPostList || {});
  const { success: createSuccess, loading: createLoading } = useSelector((state) => state.forumPostCreate || {});

  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchPosts = useCallback(() => {
    dispatch(getForumPosts({ category: 'Messages', status: 'approved' }));
  }, [dispatch]);

  useEffect(() => {
    fetchPosts();

    const handleSocialUpdate = (event) => {
      console.log('💬 Forum: Social update detected, refreshing...');
      fetchPosts();
    };

    window.addEventListener('socialUpdate', handleSocialUpdate);
    return () => window.removeEventListener('socialUpdate', handleSocialUpdate);
  }, [fetchPosts]);

  useEffect(() => {
    if (createSuccess) {
      setSnackbarOpen(true);
      setMessage('');
      fetchPosts();
      dispatch({ type: 'FORUM_POST_CREATE_RESET' });
    }
  }, [createSuccess, dispatch, fetchPosts]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    dispatch(createForumPost({ title: 'Message', content: message, category: 'Messages' }));
  };

  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      dispatch(getForumPosts({ category: 'Messages', status: 'approved', search: searchQuery }));
    }
  };

  // Extract story users from recent posts
  const storyUsers = [userInfo, ...posts.slice(0, 6).map(p => p.userId)].filter(Boolean);

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', py: 2 }}>
      {/* ── Header & Search ── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={800}>Community Feed</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            size="small"
            placeholder="Search posts..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" sx={{ color: '#9CA3AF' }} />
                </InputAdornment>
              ),
              sx: { borderRadius: 2, bgcolor: '#fff', minWidth: 240 }
            }}
          />
        </Box>
      </Box>

      {/* ── Story Row (Redesigned matching customer dashboard) ── */}
      <Paper variant="outlined" sx={{ borderRadius: 3, p: 2, mb: 3, border: '1px solid #F3F4F6', bgcolor: '#fff', overflow: 'hidden' }}>
        <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 1, '&::-webkit-scrollbar': { height: 4 }, '&::-webkit-scrollbar-thumb': { bgcolor: '#E5E7EB', borderRadius: 2 } }}>
          {storyUsers.length > 0 ? storyUsers.map((u, i) => (
            <Box key={i} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5, flexShrink: 0, cursor: 'pointer' }}>
              <Box sx={{ width: 56, height: 56, borderRadius: '50%', border: `3px solid ${STORY_COLORS[i % STORY_COLORS.length]}`, p: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Avatar sx={{ width: '100%', height: '100%', bgcolor: STORY_COLORS[i % STORY_COLORS.length], fontSize: 20, fontWeight: 700 }}>
                  {u?.name?.[0] || '?' }
                </Avatar>
              </Box>
              <Typography variant="caption" fontWeight={600} sx={{ maxWidth: 60 }} noWrap>{u?.name?.split(' ')[0] || 'User'}</Typography>
            </Box>
          )) : (
            <Typography variant="caption" color="text.secondary">No active members yet</Typography>
          )}
        </Box>
      </Paper>

      {/* ── Create Post Card ── */}
      <Paper variant="outlined" sx={{ borderRadius: 3, p: 2, mb: 3, border: '1px solid #F3F4F6', bgcolor: '#fff' }}>
        <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
          <Avatar sx={{ width: 40, height: 40, bgcolor: '#4F46E5', fontSize: 16 }}>{userInfo?.name?.[0] || '?'}</Avatar>
          <TextField
            fullWidth
            multiline
            rows={2}
            placeholder="What's on your mind? Share a rice tip, recipe, or update..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            variant="outlined"
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                bgcolor: '#F9FAFB',
                '&:hover fieldset': { borderColor: '#4F46E5' },
              }
            }}
          />
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="Add Photo">
              <IconButton size="small" sx={{ color: '#6B7280' }}><PhotoCamera fontSize="small" /></IconButton>
            </Tooltip>
            <Tooltip title="Add Tags">
              <IconButton size="small" sx={{ color: '#6B7280' }}><Tag fontSize="small" /></IconButton>
            </Tooltip>
          </Box>
          <Button
            variant="contained"
            disabled={createLoading || !message.trim()}
            onClick={handleSubmit}
            startIcon={createLoading ? <CircularProgress size={16} color="inherit" /> : <Add />}
            sx={{
              bgcolor: '#4F46E5',
              '&:hover': { bgcolor: '#4338CA' },
              borderRadius: 2,
              fontWeight: 700,
              textTransform: 'none',
              px: 3
            }}
          >
            {createLoading ? 'Posting...' : 'Post Message'}
          </Button>
        </Box>
      </Paper>

      <Divider sx={{ mb: 3 }} />

      {/* ── Posts Feed ── */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {loading && posts.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress sx={{ color: '#4F46E5' }} />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>
        ) : posts.length === 0 ? (
          <Paper variant="outlined" sx={{ borderRadius: 3, p: 6, textAlign: 'center', border: '2px dashed #E5E7EB', bgcolor: '#fff' }}>
            <ForumIcon sx={{ fontSize: 48, color: '#D1D5DB', mb: 2 }} />
            <Typography variant="h6" fontWeight={700}>No posts yet</Typography>
            <Typography variant="body2" color="text.secondary">Be the first to start a conversation in the community!</Typography>
          </Paper>
        ) : (
          posts.map((post) => (
            <Box key={post._id}>
              <ForumPostCard post={post} onUpdate={fetchPosts} />
            </Box>
          ))
        )}
        
        {loading && posts.length > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress size={24} sx={{ color: '#4F46E5' }} />
          </Box>
        )}
      </Box>

      <Snackbar open={snackbarOpen} autoHideDuration={3000} onClose={() => setSnackbarOpen(false)}>
        <Alert severity="success" sx={{ borderRadius: 2 }}>Message posted successfully!</Alert>
      </Snackbar>
    </Box>
  );
};

export default CommunityForum;