import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  TextField, Button, Select, MenuItem, Box, Snackbar, Alert,
  FormControl, InputLabel, Chip, CircularProgress, Typography
} from '@mui/material';
import { createForumPost } from '../../redux/actions/forumActions';

const CreatePostForm = () => {
  const dispatch = useDispatch();
  const { userInfo } = useSelector((state) => state.userLogin);
  const { loading, success, error } = useSelector((state) => state.forumPostCreate || {});

  const [formData, setFormData] = useState({
    title: '', content: '', category: 'Tips', tags: [], linkedRecipe: '', linkedProduct: ''
  });
  const [tagInput, setTagInput] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    if (success) {
      setSnackbar({
        open: true,
        message: `Post created! ${userInfo?.role === 'customer' ? '(Pending approval)' : ''}`,
        severity: 'success'
      });
      setFormData({ title: '', content: '', category: 'Tips', tags: [], linkedRecipe: '', linkedProduct: '' });
      setTagInput('');
    }
  }, [success, userInfo]);

  useEffect(() => {
    if (error) setSnackbar({ open: true, message: error, severity: 'error' });
  }, [error]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTagAdd = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
      setTagInput('');
    }
  };

  const handleTagDelete = (tag) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      setSnackbar({ open: true, message: 'Title and content are required', severity: 'error' });
      return;
    }
    dispatch(createForumPost(formData));
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#1a3c34' }}>
        Create New Post
      </Typography>
      <TextField fullWidth name="title" label="Post Title" value={formData.title} onChange={handleChange} required sx={{ mb: 3 }} />
      <TextField fullWidth name="content" label="Post Content" value={formData.content} onChange={handleChange} required multiline rows={6} sx={{ mb: 3 }} />
      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>Category</InputLabel>
        <Select name="category" value={formData.category} onChange={handleChange} label="Category">
          <MenuItem value="Tips">Tips & Tricks</MenuItem>
          <MenuItem value="Storage">Storage</MenuItem>
          <MenuItem value="Festivals">Festivals</MenuItem>
          <MenuItem value="Messages">Messages</MenuItem>
          <MenuItem value="Recipes">Recipes</MenuItem>
          <MenuItem value="General">General</MenuItem>
        </Select>
      </FormControl>
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>Tags</Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
          <TextField value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleTagAdd())} placeholder="Add tag + Enter" size="small" sx={{ flexGrow: 1 }} />
          <Button onClick={handleTagAdd} variant="outlined" size="small">Add</Button>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {formData.tags.map((tag, i) => (
            <Chip key={i} label={tag} onDelete={() => handleTagDelete(tag)} color="primary" variant="outlined" />
          ))}
        </Box>
      </Box>
      <TextField fullWidth name="linkedRecipe" label="Linked Recipe ID (Optional)" value={formData.linkedRecipe} onChange={handleChange} sx={{ mb: 3 }} />
      <TextField fullWidth name="linkedProduct" label="Linked Product ID (Optional)" value={formData.linkedProduct} onChange={handleChange} sx={{ mb: 3 }} />
      <Button type="submit" variant="contained" size="large" disabled={loading} sx={{ minWidth: 120 }}>
        {loading ? <>Creating...</> : 'Create Post'}
      </Button>
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default CreatePostForm;