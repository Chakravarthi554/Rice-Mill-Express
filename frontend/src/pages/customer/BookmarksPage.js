import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  Container, Typography, Box, Card, CardHeader, CardContent, CardActions,
  Avatar, Button, Grid, Chip, CircularProgress, Alert
} from '@mui/material';
import {
  Favorite, Comment, Share, MoreVert
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { getBookmarks } from '../../redux/actions/userActions';

const StyledPaper = styled(Card)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  marginBottom: theme.spacing(2),
  transition: 'transform 0.2s',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
  },
}));

const BookmarksPage = () => {
  const dispatch = useDispatch();
  const { userInfo } = useSelector((state) => state.userLogin);
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBookmarks = async () => {
      try {
        setLoading(true);
        const data = await dispatch(getBookmarks());
        setBookmarks(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (userInfo) {
      fetchBookmarks();
    }
  }, [dispatch, userInfo]);

  const getImageUrl = (path) => {
    if (!path) return '/default-avatar.jpg';
    if (path.startsWith('http')) return path;
    return `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${path}`;
  };

  if (!userInfo) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="info">Please login to view your bookmarks.</Alert>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading bookmarks...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main', mb: 4 }}>
        My Bookmarks ({bookmarks.length})
      </Typography>

      {bookmarks.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No bookmarks yet
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Start bookmarking forum posts to see them here.
          </Typography>
          <Button component={Link} to="/forum" variant="contained">
            Browse Forum
          </Button>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {bookmarks.map((bookmark) => {
            const post = bookmark.postId;
            if (!post) return null; // Skip deleted posts

            return (
              <Grid item xs={12} key={bookmark._id}>
                <StyledPaper>
                  <CardHeader
                    avatar={<Avatar src={getImageUrl(post.userId?.profilePic)}>{post.userId?.name?.[0]}</Avatar>}
                    title={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {post.userId?.name}
                        </Typography>
                        {post.status !== 'approved' && <Chip label="Pending" size="small" color="warning" />}
                      </Box>
                    }
                    subheader={new Date(bookmark.bookmarkedAt).toLocaleDateString()}
                  />
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {post.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {post.content?.substring(0, 200)}{post.content?.length > 200 && '...'}
                    </Typography>
                    {post.tags?.length > 0 && (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                        {post.tags.map(tag => (
                          <Chip key={tag} label={`#${tag}`} size="small" />
                        ))}
                      </Box>
                    )}
                  </CardContent>
                  <CardActions sx={{ px: 2, pb: 2 }}>
                    <Button
                      component={Link}
                      to={`/forum/post/${post._id}`}
                      size="small"
                      color="primary"
                    >
                      View Post
                    </Button>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 'auto' }}>
                      <Favorite sx={{ fontSize: 16, color: 'error.main' }} />
                      <Typography variant="body2" color="text.secondary">
                        {post.likes?.length || 0}
                      </Typography>
                      <Comment sx={{ fontSize: 16, ml: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        {post.comments?.length || 0}
                      </Typography>
                    </Box>
                  </CardActions>
                </StyledPaper>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Container>
  );
};

export default BookmarksPage;
