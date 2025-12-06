import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Container, Typography, TextField, Button, Paper, List, ListItem, ListItemText, Snackbar, Alert } from '@mui/material';
import { createPost, getPosts } from '../../redux/actions/forumActions';

const CommunityForum = () => {
  const dispatch = useDispatch();
  const { posts = [], loading, error } = useSelector((state) => state.forumPostList);
  const { success: createSuccess } = useSelector((state) => state.forumPostCreate);
  const [message, setMessage] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  useEffect(() => {
    dispatch(getPosts({ category: 'Messages', status: 'approved' }));
  }, [dispatch]);

  useEffect(() => {
    if (createSuccess) {
      setSnackbarOpen(true);
      dispatch(getPosts({ category: 'Messages', status: 'approved' }));
    }
  }, [createSuccess, dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(createPost({ title: 'Message', content: message, category: 'Messages' }));
    setMessage('');
  };

  return (
    <Container maxWidth="md">
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h5" gutterBottom>Community Forum (Messages)</Typography>
        {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
        <form onSubmit={handleSubmit}>
          <TextField fullWidth label="Your Message" value={message} onChange={(e) => setMessage(e.target.value)} multiline rows={4} sx={{ mb: 2 }} />
          <Button type="submit" variant="contained" color="primary" disabled={loading || !message}>
            {loading ? 'Posting...' : 'Post Message'}
          </Button>
        </form>
        <List sx={{ mt: 2 }}>
          {posts.map((post) => (
            <ListItem key={post._id}>
              <ListItemText primary={post.content || 'N/A'} secondary={`By: ${post.userId?.name || 'Unknown'}`} />
            </ListItem>
          ))}
        </List>
      </Paper>
      <Snackbar open={snackbarOpen} autoHideDuration={3000} onClose={() => setSnackbarOpen(false)}>
        <Alert severity="success">Message posted successfully!</Alert>
      </Snackbar>
    </Container>
  );
};

export default CommunityForum;