import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Container, Typography, TextField, Button, Paper } from '@mui/material';
import { suggestRecipe } from '../../redux/actions/productActions';

const RecipeSuggestion = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.userLogin);
  const [recipe, setRecipe] = useState({ title: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setRecipe((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (!user) throw new Error('User not authenticated');
      await dispatch(suggestRecipe({ ...recipe, sellerId: user._id }));
      setRecipe({ title: '', description: '' });
    } catch (error) {
      setError(error.message || 'Failed to submit recipe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
        <Typography variant="h5" gutterBottom>Suggest a Recipe</Typography>
        {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
        <form onSubmit={handleSubmit}>
          <TextField fullWidth label="Title" name="title" value={recipe.title} onChange={handleChange} required sx={{ mb: 2 }} />
          <TextField fullWidth label="Description" name="description" value={recipe.description} onChange={handleChange} multiline rows={4} required sx={{ mb: 2 }} />
          <Button type="submit" variant="contained" color="primary" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Recipe'}
          </Button>
        </form>
      </Paper>
    </Container>
  );
};

export default RecipeSuggestion;