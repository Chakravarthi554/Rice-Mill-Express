import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Grid,
  TextField,
  InputAdornment,
  Avatar,
  Paper,
  Chip,
  Stack,
} from '@mui/material';
import {
  Search,
  Add,
  Forum as ForumIcon,
  AutoAwesome,
  ThumbUpAltOutlined,
  ChatBubbleOutline,
  PushPin,
  EditNote,
  Home,
} from '@mui/icons-material';
import { getForumPosts } from '../../redux/actions/forumActions';
import ForumPostCard from './ForumPostCard';
import AdminForumPanel from '../admin/AdminForumPanel';

const ForumList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.userLogin || {});
  const { posts = [], loading, error } = useSelector((state) => state.forumPostList || {});
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchPosts = useCallback(() => {
    if (userInfo?.token) {
      dispatch(getForumPosts(1, 50, '', '', { status: 'approved' }));
    }
  }, [dispatch, userInfo]);

  useEffect(() => {
    if (userInfo) fetchPosts();
  }, [fetchPosts, userInfo, refreshKey]);

  const handleSearch = (event) => {
    event.preventDefault();
    if (searchQuery.trim()) {
      dispatch(getForumPosts(1, 50, searchQuery, '', { status: 'approved' }));
    } else {
      fetchPosts();
    }
  };

  const pinnedCount = posts.filter((post) => post.isPinned).length;
  const totalReplies = posts.reduce((sum, post) => sum + (post.commentsCount || 0), 0);

  return (
    <Box sx={{ px: { xs: 2, md: 4 }, py: { xs: 2, md: 4 }, minHeight: '100vh' }}>
      <Paper
        sx={{
          p: { xs: 3, md: 4 },
          mb: 3,
          borderRadius: 5,
          background: 'linear-gradient(135deg, #14532D 0%, #16A34A 60%, #4ADE80 100%)',
          color: '#fff',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <Box sx={{ position: 'absolute', top: -80, right: -40, width: 240, height: 240, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.08)' }} />
        <Button
          startIcon={<Home />}
          onClick={() => navigate('/customer/dashboard')}
          sx={{ mb: 2, bgcolor: 'rgba(255,255,255,0.18)', color: '#fff', borderRadius: 999, px: 2, py: 0.5, fontSize: 13, fontWeight: 700, textTransform: 'none', '&:hover': { bgcolor: 'rgba(255,255,255,0.28)' } }}
        >
          Back to Home
        </Button>
        <Typography sx={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.8, mb: 1 }}>
          Customer Community
        </Typography>
        <Typography variant="h3" sx={{ fontWeight: 800, maxWidth: 700, mb: 1.5 }}>
          A cleaner, premium forum for recipes, rice tips, and customer conversations
        </Typography>
        <Typography sx={{ maxWidth: 680, lineHeight: 1.7, opacity: 0.9 }}>
          Discover discussions, share experience-driven insights, and create trust with a focused community layout built for desktop and mobile.
        </Typography>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} sx={{ mt: 3 }}>
          <Chip icon={<ForumIcon sx={{ color: '#fff !important' }} />} label={`${posts.length} discussions`} sx={{ bgcolor: 'rgba(255,255,255,0.16)', color: '#fff', fontWeight: 700 }} />
          <Chip icon={<PushPin sx={{ color: '#fff !important' }} />} label={`${pinnedCount} pinned`} sx={{ bgcolor: 'rgba(255,255,255,0.16)', color: '#fff', fontWeight: 700 }} />
          <Chip icon={<AutoAwesome sx={{ color: '#fff !important' }} />} label={`${totalReplies} replies`} sx={{ bgcolor: 'rgba(255,255,255,0.16)', color: '#fff', fontWeight: 700 }} />
        </Stack>
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={8.2}>
          <Paper sx={{ p: 2.5, borderRadius: 4, mb: 2.5 }}>
            <Box component="form" onSubmit={handleSearch} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr auto auto' }, gap: 1.5 }}>
              <TextField
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search discussions, updates, or questions"
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: '#94A3B8' }} />
                    </InputAdornment>
                  ),
                }}
              />
              <Button type="submit" variant="outlined" color="success">Search</Button>
              <Button
                variant="contained"
                color="success"
                startIcon={<Add />}
                onClick={() => navigate('/forum/create')}
              >
                New Post
              </Button>
            </Box>
          </Paper>

          <Paper sx={{ p: 2.5, borderRadius: 4, mb: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar sx={{ width: 44, height: 44, bgcolor: '#16A34A', fontWeight: 800 }}>
                {userInfo?.name?.[0] || 'R'}
              </Avatar>
              <Box
                onClick={() => navigate('/forum/create')}
                sx={{
                  flex: 1,
                  borderRadius: 999,
                  px: 2,
                  py: 1.5,
                  bgcolor: '#F8FAFC',
                  border: '1px solid rgba(15,23,42,0.06)',
                  cursor: 'pointer',
                }}
              >
                <Typography color="text.secondary">Share a recipe tip, product question, or delivery experience...</Typography>
              </Box>
              <Button
                variant="contained"
                color="secondary"
                startIcon={<EditNote />}
                onClick={() => navigate('/forum/create')}
                sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
              >
                Post
              </Button>
            </Box>
          </Paper>

          {error ? <Alert severity="error" sx={{ mb: 2, borderRadius: 3 }}>{error}</Alert> : null}

          {userInfo?.role === 'admin' ? (
            <Box sx={{ mb: 3 }}>
              <AdminForumPanel />
            </Box>
          ) : null}

          {loading && posts.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress color="success" />
            </Box>
          ) : posts.length === 0 ? (
            <Paper sx={{ p: 6, borderRadius: 5, textAlign: 'center', border: '1px dashed rgba(15,23,42,0.12)' }}>
              <ForumIcon sx={{ fontSize: 56, color: '#94A3B8', mb: 2 }} />
              <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>No posts yet</Typography>
              <Typography color="text.secondary" sx={{ mb: 3 }}>
                Start the first conversation and build a more helpful customer community.
              </Typography>
              <Button variant="contained" color="success" onClick={() => navigate('/forum/create')}>
                Create First Post
              </Button>
            </Paper>
          ) : (
            posts.map((post) => (
              <Box
                key={post._id}
                sx={{
                  mb: 2.5,
                  borderRadius: 4,
                  overflow: 'hidden',
                  backgroundColor: 'background.paper',
                  border: '1px solid rgba(15,23,42,0.06)',
                  boxShadow: '0 14px 30px rgba(15,23,42,0.06)',
                  '& .MuiCard-root': { boxShadow: 'none', borderRadius: 0, border: 'none' },
                }}
              >
                <ForumPostCard post={post} onUpdate={() => setRefreshKey((current) => current + 1)} />
              </Box>
            ))
          )}
        </Grid>

        <Grid item xs={12} lg={3.8}>
          <Stack spacing={2.5}>
            <Paper sx={{ p: 2.5, borderRadius: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>Forum Snapshot</Typography>
              <Stack spacing={1.5}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ThumbUpAltOutlined sx={{ color: '#16A34A', fontSize: 18 }} />
                    <Typography color="text.secondary">Total likes</Typography>
                  </Box>
                  <Typography sx={{ fontWeight: 800 }}>
                    {posts.reduce((sum, post) => sum + (post.likesCount || 0), 0)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ChatBubbleOutline sx={{ color: '#F97316', fontSize: 18 }} />
                    <Typography color="text.secondary">Replies</Typography>
                  </Box>
                  <Typography sx={{ fontWeight: 800 }}>{totalReplies}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PushPin sx={{ color: '#7C3AED', fontSize: 18 }} />
                    <Typography color="text.secondary">Pinned posts</Typography>
                  </Box>
                  <Typography sx={{ fontWeight: 800 }}>{pinnedCount}</Typography>
                </Box>
              </Stack>
            </Paper>

            <Paper sx={{ p: 2.5, borderRadius: 4, background: 'linear-gradient(180deg, #FFF7ED, #FFFFFF)' }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>Community Guidelines</Typography>
              <Stack spacing={1}>
                <Typography color="text.secondary">Ask clearly so other customers can help quickly.</Typography>
                <Typography color="text.secondary">Keep recipe recommendations specific to rice type when possible.</Typography>
                <Typography color="text.secondary">Use the new post button for support requests and product questions.</Typography>
              </Stack>
            </Paper>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ForumList;
