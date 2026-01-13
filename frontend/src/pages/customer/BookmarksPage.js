import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  IconButton,
  Avatar,
  Chip,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Paper,
  Divider
} from '@mui/material';
import {
  Bookmark,
  BookmarkBorder,
  Search,
  Visibility,
  Delete,
  Share,
  Comment,
  Favorite
} from '@mui/icons-material';

const BookmarksPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.userLogin);

  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
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
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/forum/bookmarks?page=${page}&limit=20`, {
        headers: {
          'Authorization': `Bearer ${userInfo.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch bookmarks: ${response.statusText}`);
      }

      const data = await response.json();
      setBookmarks(data.posts || []);
      setTotalPages(data.pages || 1);
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
      setBookmarks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUnbookmark = async (postId) => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/forum/${postId}/bookmark`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userInfo.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Remove from local state
        setBookmarks(bookmarks.filter(post => post._id !== postId));
      }
    } catch (error) {
      console.error('Error unbookmarking:', error);
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
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="warning">Please login to view your bookmarks</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Bookmark sx={{ fontSize: 40, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" fontWeight="bold">
              My Bookmarks
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {bookmarks.length} saved post{bookmarks.length !== 1 ? 's' : ''}
            </Typography>
          </Box>
        </Box>

        {/* Search */}
        <TextField
          fullWidth
          placeholder="Search bookmarked posts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          sx={{ bgcolor: 'background.paper', borderRadius: 2 }}
        />
      </Box>

      {/* Loading State */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : filteredBookmarks.length === 0 ? (
        /* Empty State */
        <Paper sx={{ p: 8, textAlign: 'center', bgcolor: 'grey.50' }}>
          <BookmarkBorder sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            {searchQuery ? 'No matching bookmarks' : 'No bookmarks yet'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {searchQuery
              ? 'Try a different search term'
              : 'Start bookmarking posts to save them for later reading'
            }
          </Typography>
          {!searchQuery && (
            <Button
              variant="contained"
              onClick={() => navigate('/forum')}
              sx={{ borderRadius: 3 }}
            >
              Browse Forum
            </Button>
          )}
        </Paper>
      ) : (
        /* Bookmarks Grid */
        <>
          <Grid container spacing={3}>
            {filteredBookmarks.map((post) => (
              <Grid item xs={12} key={post._id}>
                <Card sx={{
                  borderRadius: 3,
                  boxShadow: 2,
                  '&:hover': { boxShadow: 6 },
                  transition: 'box-shadow 0.3s'
                }}>
                  <CardContent>
                    {/* Post Header */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar
                        src={getImageUrl(post.userId?.profilePic)}
                        sx={{ width: 40, height: 40, mr: 2 }}
                      >
                        {post.userId?.name?.[0]}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {post.userId?.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(post.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <IconButton
                        onClick={() => handleUnbookmark(post._id)}
                        color="primary"
                        size="small"
                      >
                        <Bookmark />
                      </IconButton>
                    </Box>

                    {/* Post Title */}
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      {post.title}
                    </Typography>

                    {/* Post Content Preview */}
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mb: 2,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical'
                      }}
                    >
                      {post.content}
                    </Typography>

                    {/* Tags */}
                    {post.tags?.length > 0 && (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                        {post.tags.map((tag) => (
                          <Chip key={tag} label={`#${tag}`} size="small" variant="outlined" />
                        ))}
                      </Box>
                    )}

                    <Divider sx={{ my: 1 }} />

                    {/* Engagement Stats */}
                    <Box sx={{ display: 'flex', gap: 3, mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Favorite sx={{ fontSize: 18, color: 'error.main' }} />
                        <Typography variant="caption">
                          {post.likesCount || post.likes?.length || 0}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Comment sx={{ fontSize: 18, color: 'primary.main' }} />
                        <Typography variant="caption">
                          {post.commentsCount || 0}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>

                  {/* Actions */}
                  <CardActions sx={{ px: 2, pb: 2 }}>
                    <Button
                      variant="contained"
                      startIcon={<Visibility />}
                      onClick={() => handleViewPost(post._id)}
                      sx={{ borderRadius: 2 }}
                    >
                      View Post
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<Delete />}
                      onClick={() => handleUnbookmark(post._id)}
                      color="error"
                      sx={{ borderRadius: 2 }}
                    >
                      Remove
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, gap: 2 }}>
              <Button
                variant="outlined"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <Typography sx={{ display: 'flex', alignItems: 'center', px: 2 }}>
                Page {page} of {totalPages}
              </Typography>
              <Button
                variant="outlined"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </Box>
          )}
        </>
      )}
    </Container>
  );
};

export default BookmarksPage;
