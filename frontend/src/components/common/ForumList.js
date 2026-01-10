import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, CircularProgress, Alert, Container,
  Grid, Card, CardContent, TextField
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import AddIcon from '@mui/icons-material/Add';
import { getForumPosts } from '../../redux/actions/forumActions';
import ForumPostCard from './ForumPostCard';
import AdminForumPanel from '../admin/AdminForumPanel';

const ForumList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.userLogin);
  const { posts = [], loading, error } = useSelector((state) => state.forumPostList || {});
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchPosts = useCallback(() => {
    if (userInfo?.token) {
      console.log('Fetching approved posts for forum');
      dispatch(getForumPosts(1, 50, '', '', { status: 'approved' }));
    }
  }, [dispatch, userInfo]);

  useEffect(() => {
    if (userInfo) {
      fetchPosts();
    }
  }, [fetchPosts, userInfo, refreshKey]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleCreatePost = () => {
    navigate('/forum/create');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      dispatch(getForumPosts(1, 50, searchQuery, '', { status: 'approved' }));
    } else {
      fetchPosts();
    }
  };

  if (loading && posts.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* Header Section */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 4,
        p: 3,
        backgroundColor: 'white',
        borderRadius: 3,
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <Box sx={{ color: 'white' }}>
          <Typography variant="h3" sx={{
            fontWeight: 'bold',
            mb: 1
          }}>
            🌾 Rice Community
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9 }}>
            Share your rice stories, recipes, and experiences with our community
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreatePost}
            disabled={!userInfo}
            sx={{
              borderRadius: 3,
              px: 3,
              py: 1,
              backgroundColor: 'white',
              color: '#764ba2',
              fontWeight: 'bold',
              '&:hover': {
                backgroundColor: '#f8f9fa',
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 20px rgba(0,0,0,0.15)'
              },
              '&:disabled': {
                backgroundColor: 'rgba(255,255,255,0.5)',
                color: 'rgba(255,255,255,0.7)'
              }
            }}
          >
            Create Post
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={loading}
            sx={{
              borderRadius: 3,
              px: 3,
              py: 1,
              borderColor: 'white',
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderColor: 'white',
                transform: 'translateY(-2px)'
              }
            }}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </Box>
      </Box>

      {/* Search Bar */}
      <Box component="form" onSubmit={handleSearch} sx={{ mb: 4, display: 'flex', gap: 2 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search forum posts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ bgcolor: 'white', borderRadius: 1 }}
        />
        <Button type="submit" variant="contained" size="large">Search</Button>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert
          severity="error"
          sx={{
            mb: 3,
            borderRadius: 2
          }}
          onClose={() => { }}
        >
          {error}
        </Alert>
      )}

      {/* Admin Panel */}
      {userInfo?.role === 'admin' && (
        <Box sx={{ mb: 4 }}>
          <AdminForumPanel />
        </Box>
      )}

      {/* Posts Grid */}
      <Grid container spacing={3}>
        {posts && posts.length > 0 ? (
          posts.map((post) => (
            <Grid item xs={12} key={post._id}>
              <ForumPostCard post={post} />
            </Grid>
          ))
        ) : (
          !loading && (
            <Grid item xs={12}>
              <Card sx={{
                textAlign: 'center',
                py: 8,
                backgroundColor: 'white',
                borderRadius: 3,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                border: '2px dashed #e0e0e0'
              }}>
                <CardContent>
                  <Typography variant="h4" sx={{ color: 'text.secondary', mb: 2 }}>
                    📝 No posts yet
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    Be the first to share your rice story, recipe, or experience with the community!
                  </Typography>
                  {userInfo ? (
                    <Button
                      variant="contained"
                      size="large"
                      onClick={handleCreatePost}
                      sx={{
                        borderRadius: 3,
                        px: 4,
                        py: 1.5,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 6px 20px rgba(102,126,234,0.4)'
                        }
                      }}
                    >
                      Share Your First Post
                    </Button>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Please login to create posts
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          )
        )}
      </Grid>

      {/* Loading more indicator */}
      {loading && posts.length > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      )}
    </Container>
  );
};

export default ForumList;