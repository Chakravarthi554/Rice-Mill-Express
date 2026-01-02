import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import {
  Box, Card, CardContent, CardMedia, Typography, Button, Grid,
  CircularProgress, Alert, Pagination, TextField, Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import { listRecipes } from '../../redux/actions/recipeActions'; // Correct import

import Loader from './Loader'; // Use your Loader component

const RecipeList = () => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  const page = Number(searchParams.get('pageNumber')) || 1;
  const searchTerm = searchParams.get('search') || '';
  const riceTypeFilter = searchParams.get('riceType') || '';

  // State for search and filter inputs
  const [currentSearch, setCurrentSearch] = useState(searchTerm);
  const [currentRiceType, setCurrentRiceType] = useState(riceTypeFilter);

  // --- FIX: Correct useSelector and provide default value ---
  const { loading, error, recipes = [], pages = 1, total = 0 } = useSelector(
    (state) => state.recipeList || { loading: true, error: null, recipes: [], page: 1, pages: 1, total: 0 }
  );
  const { userInfo } = useSelector((state) => state.userLogin); // Get user info for chat



  useEffect(() => {
    // Fetch recipes based on current URL params
    dispatch(listRecipes({ pageNumber: page, search: searchTerm, riceType: riceTypeFilter }));
  }, [dispatch, page, searchTerm, riceTypeFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchParams({ pageNumber: 1, search: currentSearch, riceType: currentRiceType });
  };

  const handleFilterChange = (e) => {
    setCurrentRiceType(e.target.value);
    setSearchParams({ pageNumber: 1, search: currentSearch, riceType: e.target.value });
  };

  const handlePageChange = (event, value) => {
    setSearchParams({ pageNumber: value, search: searchTerm, riceType: riceTypeFilter });
  };

  // Define Rice Types for Filter (adjust as needed)
  const riceTypes = ['Basmati', 'Jasmine', 'Brown Rice', 'Arborio', 'Sushi Rice', 'Wild Rice', 'Other'];

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 'bold', color: 'primary.main' }}>
        Discover Rice Recipes
      </Typography>

      {/* Filter and Search Bar */}
      <Box component="form" onSubmit={handleSearch} sx={{ display: 'flex', gap: 2, mb: 4, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField
          label="Search Recipes"
          variant="outlined"
          value={currentSearch}
          onChange={(e) => setCurrentSearch(e.target.value)}
          sx={{ flexGrow: 1, minWidth: '200px' }}
        />
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Rice Type</InputLabel>
          <Select
            value={currentRiceType}
            label="Rice Type"
            onChange={handleFilterChange}
          >
            <MenuItem value=""><em>All Types</em></MenuItem>
            {riceTypes.map(type => <MenuItem key={type} value={type}>{type}</MenuItem>)}
          </Select>
        </FormControl>
        <Button type="submit" variant="contained">Search</Button>
      </Box>

      {loading && page === 1 ? ( // Show loader only on initial load
        <Loader />
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : recipes.length === 0 ? (
        <Typography>No recipes found matching your criteria.</Typography>
      ) : (
        <>
          <Grid container spacing={3}>
            {recipes.map((recipe) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={recipe._id}>
                <Card sx={{ display: 'flex', flexDirection: 'column', height: '100%', boxShadow: 3, '&:hover': { boxShadow: 6 } }}>
                  <CardMedia
                    component="img"
                    height="160"
                    image={recipe.image || '/images/default-image.jpg'} // Use default image path
                    alt={recipe.title}
                    onError={(e) => { e.target.onerror = null; e.target.src = '/images/default-image.jpg'; }} // Fallback image
                  />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography gutterBottom variant="h6" component="div" noWrap title={recipe.title}>
                      {recipe.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Rice Type: {recipe.riceType}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      By: {recipe.sellerId?.name || 'Unknown Seller'}
                    </Typography>
                    {/* Display linked products concisely */}
                    {recipe.linkedProducts && recipe.linkedProducts.length > 0 && (
                      <Typography variant="caption" display="block" color="text.secondary">
                        Uses: {recipe.linkedProducts.map(p => p.name).join(', ')}
                      </Typography>
                    )}
                  </CardContent>
                  <Box sx={{ p: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #eee' }}>
                    <Button component={RouterLink} to={`/recipes/${recipe._id}`} size="small">
                      View Recipe
                    </Button>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Pagination */}
          {pages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={pages}
                page={page}
                onChange={handlePageChange}
                color="primary"
                disabled={loading} // Disable during loading
              />
            </Box>
          )}
          {loading && page > 1 && <Loader sx={{ mt: 2 }} />} {/* Show loader during page changes */}
        </>
      )}


    </Box>
  );
};

export default RecipeList;