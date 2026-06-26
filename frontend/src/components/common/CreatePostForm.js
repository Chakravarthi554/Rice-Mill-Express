import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  TextField, Button, Select, MenuItem, Box, Snackbar, Alert,
  FormControl, InputLabel, Chip, CircularProgress, Typography, Paper, Divider
} from '@mui/material';
import { Add, Close } from '@mui/icons-material';
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
    <Box sx={{ bgcolor: '#FAFAFA', minHeight: '100vh', py: 4 }}>
      <Box sx={{ maxWidth: 720, mx: 'auto' }}>
        <Paper sx={{ p: 3, borderRadius: 4, boxShadow: '0 8px 24px rgba(0,0,0,0.06)', bgcolor: '#F0FDF4', border: '1px solid #BBF7D0' }}>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#111827', mb: 0.5 }}>
            Create New Post
          </Typography>
          <Typography sx={{ color: '#9CA3AF', fontSize: 14, mb: 2.5 }}>
            Share your thoughts with the community
          </Typography>
          <Divider sx={{ mb: 2.5 }} />

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              name="title"
              label="Post Title"
              value={formData.title}
              onChange={handleChange}
              required
              sx={{ mb: 3 }}
              InputProps={{ sx: { borderRadius: 3, bgcolor: '#F9FAFB' } }}
            />

            <TextField
              fullWidth
              name="content"
              label="Post Content"
              value={formData.content}
              onChange={handleChange}
              required
              multiline
              rows={6}
              sx={{ mb: 3 }}
              InputProps={{ sx: { borderRadius: 3, bgcolor: '#F9FAFB' } }}
            />

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Category</InputLabel>
              <Select
                name="category"
                value={formData.category}
                onChange={handleChange}
                label="Category"
                sx={{ borderRadius: 3, bgcolor: '#F9FAFB' }}
              >
                <MenuItem value="Tips">Tips & Tricks</MenuItem>
                <MenuItem value="Storage">Storage</MenuItem>
                <MenuItem value="Festivals">Festivals</MenuItem>
                <MenuItem value="Messages">Messages</MenuItem>
                <MenuItem value="Recipes">Recipes</MenuItem>
                <MenuItem value="General">General</MenuItem>
              </Select>
            </FormControl>

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#374151', mb: 1 }}>
                Tags
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
                <TextField
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleTagAdd())}
                  placeholder="Type a tag and press Enter"
                  size="small"
                  sx={{ flexGrow: 1 }}
                  InputProps={{ sx: { borderRadius: 3, bgcolor: '#F9FAFB' } }}
                />
                <Button onClick={handleTagAdd} variant="contained" color="success" size="small" sx={{ borderRadius: 3, minWidth: 40, height: 40 }}>
                  <Add />
                </Button>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {formData.tags.map((tag, i) => (
                  <Chip
                    key={i}
                    label={tag}
                    onDelete={() => handleTagDelete(tag)}
                    sx={{ bgcolor: '#F0FDF4', color: '#166534', fontWeight: 600, borderRadius: 2 }}
                    deleteIcon={<Close fontSize="small" />}
                  />
                ))}
              </Box>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
              <TextField
                fullWidth
                name="linkedRecipe"
                label="Linked Recipe ID (Optional)"
                value={formData.linkedRecipe}
                onChange={handleChange}
                InputProps={{ sx: { borderRadius: 3, bgcolor: '#F9FAFB' } }}
              />
              <TextField
                fullWidth
                name="linkedProduct"
                label="Linked Product ID (Optional)"
                value={formData.linkedProduct}
                onChange={handleChange}
                InputProps={{ sx: { borderRadius: 3, bgcolor: '#F9FAFB' } }}
              />
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2, borderTop: '1px solid #F3F4F6' }}>
              <Button
                type="submit"
                variant="contained"
                color="success"
                size="large"
                disabled={loading}
                sx={{ borderRadius: 3, px: 5, py: 1.5, fontWeight: 700, fontSize: 15 }}
              >
                {loading ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : 'Create Post'}
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>
        <Alert severity={snackbar.severity} sx={{ borderRadius: 3 }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default CreatePostForm;
