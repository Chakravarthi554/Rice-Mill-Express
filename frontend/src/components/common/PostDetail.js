import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Button, 
  TextField, 
  Alert, 
  Card, 
  CardContent,
  Divider,
  IconButton,
  Chip,
  Snackbar
} from '@mui/material';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined';
import ReportIcon from '@mui/icons-material/Report';
import { getPostById, likePost, addComment } from '../../redux/actions/forumActions';

const PostDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { post, loading, error } = useSelector((state) => state.forumPostDetails);
  const { userInfo } = useSelector((state) => state.userLogin);
  const [comment, setComment] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    dispatch(getPostById(id));
  }, [dispatch, id]);

  // Check if user has liked the post
  const hasLiked = post?.likes?.includes(userInfo?._id);

  const handleLike = () => {
    if (!userInfo) {
      setSnackbar({
        open: true,
        message: 'Please login to like posts',
        severity: 'warning'
      });
      return;
    }
    
    dispatch(likePost(id)).then(() => {
      dispatch(getPostById(id)); // Refresh post data
    });
  };

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!userInfo) {
      setSnackbar({
        open: true,
        message: 'Please login to comment',
        severity: 'warning'
      });
      return;
    }

    if (comment.trim()) {
      dispatch(addComment(id, comment)).then(() => {
        setComment('');
        dispatch(getPostById(id)); // Refresh post data
        setSnackbar({
          open: true,
          message: 'Comment added successfully',
          severity: 'success'
        });
      });
    }
  };

  const handleReport = () => {
    if (!userInfo) {
      setSnackbar({
        open: true,
        message: 'Please login to report posts',
        severity: 'warning'
      });
      return;
    }
    // Implement report functionality
    setSnackbar({
      open: true,
      message: 'Post reported to administrators',
      severity: 'info'
    });
  };

  if (loading) return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
      <Typography>Loading post...</Typography>
    </Box>
  );
  
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!post) return <Typography>Post not found</Typography>;

  // Don't show pending posts to regular users
  if (post.status === 'pending' && userInfo?.role !== 'admin') {
    return (
      <Alert severity="info">
        This post is pending approval and cannot be viewed yet.
      </Alert>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, margin: '0 auto', p: 3 }}>
      {/* Post Content */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h4" gutterBottom>{post.title}</Typography>
          <Typography variant="subtitle1" color="textSecondary" gutterBottom>
            By: {post.userId?.name || 'Unknown'} • {new Date(post.createdAt).toLocaleDateString()}
          </Typography>
          
          <Box sx={{ my: 2 }}>
            <Chip label={post.category} color="primary" sx={{ mr: 1 }} />
            {post.tags?.map(tag => (
              <Chip key={tag} label={tag} variant="outlined" sx={{ mr: 1, mb: 1 }} />
            ))}
          </Box>

          <Typography variant="body1" sx={{ my: 3, lineHeight: 1.6 }}>
            {post.content}
          </Typography>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <Button
              variant={hasLiked ? "contained" : "outlined"}
              startIcon={hasLiked ? <ThumbUpIcon /> : <ThumbUpOutlinedIcon />}
              onClick={handleLike}
              disabled={!userInfo}
            >
              Like ({post.likes?.length || 0})
            </Button>

            <Button
              variant="outlined"
              startIcon={<ReportIcon />}
              onClick={handleReport}
              disabled={!userInfo}
            >
              Report
            </Button>

            {post.linkedRecipe && (
              <Button 
                variant="outlined" 
                component={Link} 
                to={`/recipes/${post.linkedRecipe._id}`}
              >
                View Recipe
              </Button>
            )}
            
            {post.linkedProduct && (
              <Button 
                variant="outlined" 
                component={Link} 
                to={`/product/${post.linkedProduct._id}`}
              >
                View Product
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Comments Section */}
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Comments ({post.comments?.length || 0})
          </Typography>

          {/* Add Comment Form */}
          {userInfo && (
            <Box component="form" onSubmit={handleCommentSubmit} sx={{ mb: 3 }}>
              <TextField
                fullWidth
                multiline
                rows={3}
                placeholder="Add a comment..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                variant="outlined"
                sx={{ mb: 1 }}
              />
              <Button type="submit" variant="contained" disabled={!comment.trim()}>
                Post Comment
              </Button>
            </Box>
          )}

          <Divider sx={{ my: 2 }} />

          {/* Comments List */}
          {post.comments?.length > 0 ? (
            post.comments.map((comment, index) => (
              <Box key={index} sx={{ mb: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  {comment.userId?.name || 'Anonymous'} • {new Date(comment.createdAt).toLocaleDateString()}
                </Typography>
                <Typography variant="body1">{comment.content}</Typography>
              </Box>
            ))
          ) : (
            <Typography color="textSecondary" align="center" sx={{ py: 3 }}>
              No comments yet. Be the first to comment!
            </Typography>
          )}
        </CardContent>
      </Card>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </Box>
  );
};

export default PostDetail;