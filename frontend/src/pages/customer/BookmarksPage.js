import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Container, Typography, Box, Grid, Card, CardContent, CardActions,
  Button, IconButton, Avatar, Chip, TextField, InputAdornment,
  CircularProgress, Alert, Snackbar, Paper, Divider
} from '@mui/material';
import {
  Bookmark, BookmarkBorder, Search, Visibility, Delete,
  Comment, Favorite
} from '@mui/icons-material';
import axiosInstance from '../../utils/axiosInstance';

const BookmarksPage = () => {
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.userLogin);

  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (userInfo) {
      fetchBookmarks();
    }
  }, [userInfo, page]);

  const fetchBookmarks = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await axiosInstance.get(`/api/v1/forum/bookmarks?page=${page}&limit=20`, {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      });
      setBookmarks(data.posts || []);
      setTotalPages(data.pages || 1);
    } catch (fetchError) {
      console.error('Error fetching bookmarks:', fetchError);
      setError(fetchError.response?.data?.message || 'Failed to load bookmarks');
      setBookmarks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUnbookmark = async (postId) => {
    try {
      await axiosInstance.post(`/api/v1/forum/${postId}/bookmark`, {}, {
        headers: { Authorization: `Bearer ${userInfo.token}` }
      });
      setBookmarks((prev) => prev.filter((post) => post._id !== postId));
      setSnackbar({ open: true, message: 'Bookmark removed', severity: 'success' });
    } catch (unbookmarkError) {
      console.error('Error unbookmarking:', unbookmarkError);
      setSnackbar({ open: true, message: 'Failed to remove bookmark', severity: 'error' });
    }
  };

  const handleViewPost = (postId) => {
    navigate(`/forum/post/${postId}`);
  };

  const filteredBookmarks = bookmarks.filter(post =>
    post.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.content?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getImageUrl = (path) => {
    if (!path) return '/default_avatar.jpg';
    return path.startsWith('http') ? path : `${process.env.REACT_APP_API_URL || ''}${path}`;
  };

  if (!userInfo) {
    return (
      <Box sx={{ bgcolor: '#FAFAFA', minHeight: '100vh', py: 8 }}>
        <Container maxWidth="lg">
          <Paper sx={{ p: 6, borderRadius: 4, textAlign: 'center' }}>
            <Alert severity="warning">Please login to view your bookmarks</Alert>
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: '#F0FDF4', minHeight: '100vh', pb: 8 }}>
      <Container maxWidth="lg" sx={{ pt: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2.5 }}>
          <Bookmark sx={{ fontSize: 28, color: '#16A34A' }} />
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#111827' }}>
            My Bookmarks
          </Typography>
          <Chip
            label={`${bookmarks.length} saved`}
            sx={{ bgcolor: '#DCFCE7', color: '#166534', fontWeight: 700 }}
          />
        </Box>

        <Paper sx={{ p: 2, borderRadius: 3, mb: 2.5, boxShadow: '0 4px 12px rgba(0,0,0,0.04)', bgcolor: '#FFFFFE', border: '1px solid #BBF7D0' }}>
          <TextField
            fullWidth
            placeholder="Search bookmarked posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: '#9CA3AF' }} />
                </InputAdornment>
              ),
              sx: { borderRadius: 3, bgcolor: '#F9FAFB' },
            }}
          />
        </Paper>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress color="success" />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ borderRadius: 3, mb: 2 }}>{error}</Alert>
        ) : filteredBookmarks.length === 0 ? (
          <Paper sx={{ p: 6, borderRadius: 4, textAlign: 'center', border: '1px dashed #BBF7D0', bgcolor: '#F0FDF4' }}>
            <BookmarkBorder sx={{ fontSize: 64, color: '#16A34A', mb: 2 }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#111827', mb: 1 }}>
              {searchQuery ? 'No matching bookmarks' : 'No bookmarks yet'}
            </Typography>
            <Typography sx={{ color: '#9CA3AF', mb: 3 }}>
              {searchQuery ? 'Try a different search term' : 'Start bookmarking forum posts to save them for later'}
            </Typography>
            {!searchQuery && (
              <Button variant="contained" color="success" onClick={() => navigate('/forum')} sx={{ borderRadius: 3, fontWeight: 700 }}>
                Browse Forum
              </Button>
            )}
          </Paper>
        ) : (
          <>
            <Grid container spacing={2.5}>
              {filteredBookmarks.map((post) => (
                <Grid item xs={12} key={post._id}>
                  <Card sx={{
                    borderRadius: 4,
                    border: '1px solid #F3F4F6',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                    transition: 'all 0.25s ease',
                    '&:hover': { boxShadow: '0 8px 24px rgba(0,0,0,0.08)', transform: 'translateY(-2px)' },
                  }}>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar
                          src={getImageUrl(post.userId?.profilePic)}
                          sx={{ width: 44, height: 44, mr: 2, border: '2px solid #F3F4F6' }}
                        >
                          {post.userId?.name?.[0]}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#111827' }}>
                            {post.userId?.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#9CA3AF' }}>
                            {new Date(post.createdAt).toLocaleDateString()}
                          </Typography>
                        </Box>
                        <IconButton
                          onClick={() => handleUnbookmark(post._id)}
                          sx={{ bgcolor: '#F0FDF4', color: '#16A34A', '&:hover': { bgcolor: '#DCFCE7' } }}
                        >
                          <Bookmark />
                        </IconButton>
                      </Box>

                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#111827', mb: 1 }}>
                        {post.title}
                      </Typography>

                      <Typography
                        variant="body2"
                        sx={{
                          color: '#6B7280', mb: 2, lineHeight: 1.7,
                          overflow: 'hidden',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical'
                        }}
                      >
                        {post.content}
                      </Typography>

                      {post.tags?.length > 0 && (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                          {post.tags.map((tag) => (
                            <Chip key={tag} label={`#${tag}`} size="small" sx={{ bgcolor: '#F3F4F6', color: '#6B7280', fontWeight: 600, borderRadius: 2 }} />
                          ))}
                        </Box>
                      )}

                      <Divider sx={{ my: 1.5 }} />

                      <Box sx={{ display: 'flex', gap: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                          <Favorite sx={{ fontSize: 16, color: '#EF4444' }} />
                          <Typography variant="caption" sx={{ fontWeight: 600, color: '#6B7280' }}>
                            {post.likesCount || post.likes?.length || 0}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                          <Comment sx={{ fontSize: 16, color: '#16A34A' }} />
                          <Typography variant="caption" sx={{ fontWeight: 600, color: '#6B7280' }}>
                            {post.commentsCount || 0}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>

                    <CardActions sx={{ px: 3, pb: 3, pt: 0 }}>
                      <Button
                        variant="contained"
                        color="success"
                        startIcon={<Visibility />}
                        onClick={() => handleViewPost(post._id)}
                        sx={{ borderRadius: 3, fontWeight: 700, fontSize: 12 }}
                      >
                        View Post
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<Delete />}
                        onClick={() => handleUnbookmark(post._id)}
                        sx={{ borderRadius: 3, fontWeight: 700, fontSize: 12 }}
                      >
                        Remove
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, gap: 2 }}>
                <Button
                  variant="outlined"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  sx={{ borderRadius: 3, fontWeight: 700 }}
                >
                  Previous
                </Button>
                <Typography sx={{ display: 'flex', alignItems: 'center', px: 2, fontWeight: 600, color: '#6B7280' }}>
                  Page {page} of {totalPages}
                </Typography>
                <Button
                  variant="outlined"
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                  sx={{ borderRadius: 3, fontWeight: 700 }}
                >
                  Next
                </Button>
              </Box>
            )}
          </>
        )}
      </Container>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={2500}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      >
        <Alert severity={snackbar.severity} sx={{ borderRadius: 3, width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default BookmarksPage;
