import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, CircularProgress, Alert, Grid,
  TextField, InputAdornment, Avatar, AvatarGroup, Paper,
  IconButton, Divider, Chip, Badge
} from '@mui/material';
import {
  Search, Add, Refresh, Home, People, Subscriptions,
  Settings, HelpOutline, ExitToApp, Notifications, MoreVert,
  Bookmark, Forum as ForumIcon
} from '@mui/icons-material';
import { getForumPosts } from '../../redux/actions/forumActions';
import ForumPostCard from './ForumPostCard';
import AdminForumPanel from '../admin/AdminForumPanel';

const SIDEBAR_LINKS = [
  { icon: <Home fontSize="small" />, label: 'Feed', badge: 10 },
  { icon: <People fontSize="small" />, label: 'Friends', badge: 2 },
  { icon: <Subscriptions fontSize="small" />, label: 'Recipes' },
  { icon: <Bookmark fontSize="small" />, label: 'Bookmarks' },
  { icon: <Settings fontSize="small" />, label: 'Settings' },
  { icon: <HelpOutline fontSize="small" />, label: 'Help & Support' },
];

// Fake story row avatars (uses initial + color)
const STORY_COLORS = ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#3B82F6', '#8B5CF6', '#EC4899'];

const ForumList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userInfo } = useSelector((s) => s.userLogin);
  const { posts = [], loading, error } = useSelector((s) => s.forumPostList || {});
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeNav, setActiveNav] = useState('Feed');

  const fetchPosts = useCallback(() => {
    if (userInfo?.token) {
      dispatch(getForumPosts(1, 50, '', '', { status: 'approved' }));
    }
  }, [dispatch, userInfo]);

  useEffect(() => { if (userInfo) fetchPosts(); }, [fetchPosts, userInfo, refreshKey]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) dispatch(getForumPosts(1, 50, searchQuery, '', { status: 'approved' }));
    else fetchPosts();
  };

  const storyUsers = [userInfo, ...posts.slice(0, 6).map(p => p.userId)].filter(Boolean);

  return (
    <Box sx={{ bgcolor: '#F3F4F6', minHeight: '100vh', display: 'flex' }}>

      {/* ── Left Sidebar ── */}
      <Box sx={{ width: 260, flexShrink: 0, position: 'sticky', top: 0, height: '100vh', bgcolor: '#fff', borderRight: '1px solid #F3F4F6', display: 'flex', flexDirection: 'column', py: 3, px: 2 }}>

        {/* Logo */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 1, mb: 2 }}>
          <Box sx={{ width: 34, height: 34, bgcolor: '#4F46E5', borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography sx={{ color: '#fff', fontSize: 16 }}>🌾</Typography>
          </Box>
          <Typography fontWeight={800} fontSize="0.95rem">Rice Community</Typography>
        </Box>

        {/* Search */}
        <Box sx={{ bgcolor: '#F3F4F6', borderRadius: 2, px: 1.5, py: 0.8, display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Search fontSize="small" sx={{ color: '#9CA3AF' }} />
          <input
            style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 13, color: '#374151', flex: 1 }}
            placeholder="Search friends, groups, pages"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch(e)}
          />
        </Box>

        {/* Nav Links */}
        <Box sx={{ flex: 1 }}>
          {SIDEBAR_LINKS.map(item => (
            <Box key={item.label} onClick={() => setActiveNav(item.label)}
              sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.2, borderRadius: 2, cursor: 'pointer', mb: 0.5, bgcolor: activeNav === item.label ? '#EEF2FF' : 'transparent', color: activeNav === item.label ? '#4F46E5' : '#374151', '&:hover': { bgcolor: '#F9FAFB' }, transition: 'all 0.15s' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ color: activeNav === item.label ? '#4F46E5' : '#6B7280' }}>{item.icon}</Box>
                <Typography variant="body2" fontWeight={activeNav === item.label ? 700 : 500}>{item.label}</Typography>
              </Box>
              {item.badge && (
                <Box sx={{ width: 20, height: 20, bgcolor: '#4F46E5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography sx={{ fontSize: 10, color: '#fff', fontWeight: 800 }}>{item.badge}</Typography>
                </Box>
              )}
            </Box>
          ))}
        </Box>

        {/* User footer */}
        {userInfo && (
          <Box sx={{ borderTop: '1px solid #F3F4F6', pt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 1 }}>
              <Avatar sx={{ width: 36, height: 36, bgcolor: '#16A34A', fontSize: 14 }}>{userInfo.name?.[0]}</Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" fontWeight={700} noWrap>{userInfo.name}</Typography>
                <Typography variant="caption" color="text.secondary">Basic Member</Typography>
              </Box>
              <IconButton size="small" sx={{ color: '#9CA3AF' }}><ExitToApp fontSize="small" /></IconButton>
            </Box>
          </Box>
        )}
      </Box>

      {/* ── Main Feed ── */}
      <Box sx={{ flex: 1, maxWidth: 680, mx: 'auto', py: 3, px: 2 }}>

        {/* Story Row */}
        <Paper variant="outlined" sx={{ borderRadius: 3, p: 2, mb: 2.5, border: '1px solid #F3F4F6', bgcolor: '#fff' }}>
          <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 1 }}>
            {storyUsers.slice(0, 8).map((u, i) => (
              <Box key={i} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5, flexShrink: 0, cursor: 'pointer' }}>
                <Box sx={{ width: 48, height: 48, borderRadius: '50%', border: `3px solid ${STORY_COLORS[i % STORY_COLORS.length]}`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  <Avatar sx={{ width: 40, height: 40, bgcolor: STORY_COLORS[i % STORY_COLORS.length], fontSize: 18 }}>{u?.name?.[0] || '?'}</Avatar>
                </Box>
                <Typography variant="caption" fontWeight={500} sx={{ maxWidth: 50 }} noWrap>{u?.name?.split(' ')[0] || `User${i}`}</Typography>
              </Box>
            ))}
          </Box>
        </Paper>

        {/* Create Post */}
        <Paper variant="outlined" sx={{ borderRadius: 3, p: 2, mb: 2.5, border: '1px solid #F3F4F6', bgcolor: '#fff' }}>
          <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5 }}>
            <Avatar sx={{ width: 38, height: 38, bgcolor: '#16A34A', fontSize: 15 }}>{userInfo?.name?.[0] || '?'}</Avatar>
            <Box sx={{ flex: 1, bgcolor: '#F9FAFB', borderRadius: 5, px: 2, py: 1.2, cursor: 'pointer', border: '1px solid #E5E7EB' }} onClick={() => navigate('/forum/create')}>
              <Typography variant="body2" color="text.secondary">Share a rice tip, recipe, or experience...</Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button size="small" sx={{ color: '#6B7280', fontWeight: 600, textTransform: 'none' }}>📷 Photo</Button>
            <Button size="small" sx={{ color: '#6B7280', fontWeight: 600, textTransform: 'none' }}>🏷️ Tag</Button>
            <Button size="small" variant="contained" onClick={() => navigate('/forum/create')} startIcon={<Add fontSize="small" />}
              sx={{ bgcolor: '#4F46E5', '&:hover': { bgcolor: '#4338CA' }, borderRadius: 2, fontWeight: 700, textTransform: 'none' }}>
              Add New Post
            </Button>
          </Box>
        </Paper>

        {/* Error */}
        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

        {/* Admin Panel */}
        {userInfo?.role === 'admin' && (
          <Box sx={{ mb: 3 }}>
            <AdminForumPanel />
          </Box>
        )}

        {/* Posts Feed */}
        {loading && posts.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress sx={{ color: '#4F46E5' }} />
          </Box>
        ) : posts.length === 0 ? (
          <Paper variant="outlined" sx={{ borderRadius: 3, p: 6, textAlign: 'center', border: '2px dashed #E5E7EB', bgcolor: '#fff' }}>
            <ForumIcon sx={{ fontSize: 56, color: '#D1D5DB', mb: 2 }} />
            <Typography variant="h6" fontWeight={700} gutterBottom>No posts yet</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Be the first to share your rice story with the community!</Typography>
            {userInfo && (
              <Button variant="contained" onClick={() => navigate('/forum/create')}
                sx={{ bgcolor: '#4F46E5', '&:hover': { bgcolor: '#4338CA' }, borderRadius: 2, fontWeight: 700 }}>
                Share Your First Post
              </Button>
            )}
          </Paper>
        ) : (
          <>
            {posts.map(post => (
              <Box key={post._id} sx={{
                mb: 2.5, bgcolor: '#fff', borderRadius: 3, border: '1px solid #F3F4F6', overflow: 'hidden',
                '& .MuiCard-root': { boxShadow: 'none', border: 'none', borderRadius: 0 }
              }}>
                <ForumPostCard post={post} onUpdate={() => setRefreshKey(k => k + 1)} />
              </Box>
            ))}
            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <CircularProgress size={24} sx={{ color: '#4F46E5' }} />
              </Box>
            )}
          </>
        )}
      </Box>

      {/* ── Right Sidebar ── */}
      <Box sx={{ width: 280, flexShrink: 0, position: 'sticky', top: 0, height: '100vh', overflowY: 'auto', py: 3, px: 2 }}>

        {/* Platform Promo */}
        <Paper variant="outlined" sx={{ borderRadius: 3, p: 2.5, mb: 2.5, border: '1px solid #F3F4F6', bgcolor: '#fff' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <Box sx={{ width: 28, height: 28, bgcolor: '#4F46E5', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography sx={{ fontSize: 14 }}>🌾</Typography>
            </Box>
            <Typography fontWeight={800} fontSize="0.9rem">Rice Mill Express</Typography>
          </Box>
          <Box sx={{ bgcolor: '#F9FAFB', borderRadius: 2, px: 1.5, py: 1, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Search fontSize="small" sx={{ color: '#9CA3AF' }} />
            <Typography variant="caption" color="text.secondary">Search friends, groups, pages</Typography>
          </Box>
          <Divider sx={{ mb: 1.5 }} />
          {['Feed', 'Friends', 'Recipes', 'Bookmarks', 'Settings', 'Help & Support'].map((link, i) => (
            <Box key={link} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.8, cursor: 'pointer', '&:hover': { color: '#4F46E5' } }}>
              <Typography variant="body2" fontWeight={500}>{link}</Typography>
              {i < 2 && <Chip label={i === 0 ? 10 : 2} size="small" sx={{ height: 18, fontSize: '0.65rem', bgcolor: '#EEF2FF', color: '#4F46E5', fontWeight: 700 }} />}
            </Box>
          ))}
        </Paper>

        {/* Upgrade CTA */}
        <Paper sx={{ borderRadius: 3, p: 2.5, bgcolor: '#FFFBEB', border: '1px solid #FDE68A', position: 'relative', mb: 2 }}>
          <IconButton size="small" sx={{ position: 'absolute', top: 8, right: 8, color: '#9CA3AF' }}><MoreVert fontSize="small" /></IconButton>
          <Typography variant="body2" fontWeight={700} gutterBottom>🌾 Go Premium</Typography>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>
            Access exclusive rice deals, priority support & seller analytics.
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button size="small" sx={{ color: '#9CA3AF', fontWeight: 500, textTransform: 'none', fontSize: '0.75rem' }}>Dismiss</Button>
            <Button size="small" variant="contained" sx={{ bgcolor: '#F97316', '&:hover': { bgcolor: '#EA580C' }, fontWeight: 700, textTransform: 'none', fontSize: '0.75rem', borderRadius: 1.5 }}>Go Pro</Button>
          </Box>
        </Paper>

        {/* Friends Online */}
        <Paper variant="outlined" sx={{ borderRadius: 3, p: 2, border: '1px solid #F3F4F6', bgcolor: '#fff' }}>
          <Typography variant="body2" fontWeight={700} gutterBottom color="text.secondary">Friends Online</Typography>
          {storyUsers.slice(0, 4).map((u, i) => (
            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.8 }}>
              <Box sx={{ position: 'relative' }}>
                <Avatar sx={{ width: 32, height: 32, bgcolor: STORY_COLORS[i], fontSize: 13 }}>{u?.name?.[0]}</Avatar>
                <Box sx={{ width: 10, height: 10, bgcolor: '#16A34A', borderRadius: '50%', position: 'absolute', bottom: 0, right: 0, border: '2px solid #fff' }} />
              </Box>
              <Typography variant="body2" fontWeight={500}>{u?.name?.split(' ')[0] || 'User'}</Typography>
            </Box>
          ))}
        </Paper>

      </Box>
    </Box>
  );
};

export default ForumList;