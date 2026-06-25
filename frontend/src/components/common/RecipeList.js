import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link as RouterLink, useSearchParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Grid,
  Pagination,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Chip,
  Stack,
  InputAdornment,
} from '@mui/material';
import {
  Search,
  RestaurantMenu,
  Star,
  LocalDining,
  ShoppingBagOutlined,
  Home,
} from '@mui/icons-material';
import { listRecipes } from '../../redux/actions/recipeActions';
import Loader from './Loader';

const riceTypes = ['Basmati', 'Jasmine', 'Brown Rice', 'Arborio', 'Sushi Rice', 'Wild Rice', 'Other'];

const toneByRiceType = {
  Basmati: { bg: '#FEF3C7', color: '#B45309' },
  Jasmine: { bg: '#E0F2FE', color: '#0369A1' },
  'Brown Rice': { bg: '#F5E6D3', color: '#9A3412' },
  Arborio: { bg: '#F3E8FF', color: '#7C3AED' },
  'Sushi Rice': { bg: '#FCE7F3', color: '#BE185D' },
  'Wild Rice': { bg: '#DCFCE7', color: '#166534' },
  Other: { bg: '#E2E8F0', color: '#475569' },
};

const RecipeList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const page = Number(searchParams.get('pageNumber')) || 1;
  const searchTerm = searchParams.get('search') || '';
  const riceTypeFilter = searchParams.get('riceType') || '';

  const [currentSearch, setCurrentSearch] = useState(searchTerm);
  const [currentRiceType, setCurrentRiceType] = useState(riceTypeFilter);

  const { loading, error, recipes = [], pages = 1 } = useSelector(
    (state) => state.recipeList || { loading: true, error: null, recipes: [], pages: 1 }
  );

  useEffect(() => {
    dispatch(listRecipes({ pageNumber: page, search: searchTerm, riceType: riceTypeFilter }));
  }, [dispatch, page, searchTerm, riceTypeFilter]);

  const handleSearch = (event) => {
    event.preventDefault();
    setSearchParams({ pageNumber: 1, search: currentSearch, riceType: currentRiceType });
  };

  const handleFilterChange = (event) => {
    const nextType = event.target.value;
    setCurrentRiceType(nextType);
    setSearchParams({ pageNumber: 1, search: currentSearch, riceType: nextType });
  };

  const handlePageChange = (_event, value) => {
    setSearchParams({ pageNumber: value, search: searchTerm, riceType: riceTypeFilter });
  };

  const featuredRecipe = recipes[0];

  return (
    <Box sx={{ px: { xs: 2, md: 4 }, py: { xs: 2, md: 4 } }}>
      <Box
        sx={{
          mb: 4,
          borderRadius: 5,
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #166534 0%, #16A34A 55%, #4ADE80 100%)',
          color: '#fff',
          p: { xs: 3, md: 4 },
          position: 'relative',
        }}
      >
        <Box sx={{ position: 'absolute', top: -80, right: -60, width: 220, height: 220, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.08)' }} />
        <Button
          startIcon={<Home />}
          onClick={() => navigate('/customer/dashboard')}
          sx={{ mb: 2, bgcolor: 'rgba(255,255,255,0.18)', color: '#fff', borderRadius: 999, px: 2, py: 0.5, fontSize: 13, fontWeight: 700, textTransform: 'none', '&:hover': { bgcolor: 'rgba(255,255,255,0.28)' } }}
        >
          Back to Home
        </Button>
        <Typography sx={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.78, mb: 1 }}>
          Recipe Studio
        </Typography>
        <Typography variant="h3" sx={{ fontWeight: 800, maxWidth: 560, mb: 1.5 }}>
          Curated rice recipes that look premium on every screen
        </Typography>
        <Typography sx={{ maxWidth: 640, opacity: 0.88, lineHeight: 1.7 }}>
          Browse chef-style inspiration, home favorites, and recipe ideas connected directly to the products customers already love.
        </Typography>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} sx={{ mt: 3 }}>
          <Chip label={`${recipes.length} recipes loaded`} sx={{ bgcolor: 'rgba(255,255,255,0.18)', color: '#fff', fontWeight: 700 }} />
          <Chip label={riceTypeFilter || 'All rice types'} sx={{ bgcolor: 'rgba(255,255,255,0.18)', color: '#fff', fontWeight: 700 }} />
        </Stack>
      </Box>

      <Box
        component="form"
        onSubmit={handleSearch}
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1.4fr 0.7fr auto' },
          gap: 2,
          mb: 4,
          p: 2,
          borderRadius: 4,
          bgcolor: 'background.paper',
          border: '1px solid rgba(15,23,42,0.06)',
          boxShadow: '0 12px 28px rgba(15,23,42,0.05)',
        }}
      >
        <TextField
          value={currentSearch}
          onChange={(event) => setCurrentSearch(event.target.value)}
          placeholder="Search biryani, pulao, pongal..."
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: '#94A3B8' }} />
              </InputAdornment>
            ),
          }}
        />
        <FormControl fullWidth>
          <InputLabel>Rice Type</InputLabel>
          <Select value={currentRiceType} label="Rice Type" onChange={handleFilterChange}>
            <MenuItem value="">All Types</MenuItem>
            {riceTypes.map((type) => (
              <MenuItem key={type} value={type}>{type}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button type="submit" variant="contained" color="success" sx={{ minHeight: 56 }}>
          Explore Recipes
        </Button>
      </Box>

      {featuredRecipe ? (
        <Card
          sx={{
            mb: 4,
            borderRadius: 5,
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1.2fr 0.8fr' },
            overflow: 'hidden',
          }}
        >
          <Box sx={{ p: { xs: 3, md: 4 }, bgcolor: '#F8FFF8' }}>
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#16A34A', letterSpacing: '0.08em', textTransform: 'uppercase', mb: 1 }}>
              Featured
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 1.5 }}>
              {featuredRecipe.title}
            </Typography>
            <Typography sx={{ color: 'text.secondary', lineHeight: 1.75, mb: 2 }}>
              {featuredRecipe.description || 'A standout recipe built for customers who want flavor, clarity, and easy ingredient pairing.'}
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip icon={<LocalDining />} label={featuredRecipe.riceType || 'Rice recipe'} sx={{ bgcolor: '#ECFCCB', color: '#3F6212', fontWeight: 700 }} />
              <Chip icon={<ShoppingBagOutlined />} label={`${featuredRecipe.linkedProducts?.length || 0} linked products`} sx={{ bgcolor: '#FFF7ED', color: '#C2410C', fontWeight: 700 }} />
              <Chip icon={<Star />} label={`${Number(featuredRecipe.averageRating || featuredRecipe.rating || 0).toFixed(1)} rating`} sx={{ bgcolor: '#FEF3C7', color: '#B45309', fontWeight: 700 }} />
            </Stack>
          </Box>
          <Box sx={{ minHeight: 260, bgcolor: '#EEF6EF' }}>
            <CardMedia
              component="img"
              image={featuredRecipe.image || '/images/default-image.jpg'}
              alt={featuredRecipe.title}
              sx={{ height: '100%', minHeight: 260 }}
              onError={(event) => {
                event.target.onerror = null;
                event.target.src = '/images/default-image.jpg';
              }}
            />
          </Box>
        </Card>
      ) : null}

      {loading && page === 1 ? (
        <Loader />
      ) : error ? (
        <Alert severity="error" sx={{ borderRadius: 3 }}>{error}</Alert>
      ) : recipes.length === 0 ? (
        <Box
          sx={{
            textAlign: 'center',
            py: 8,
            px: 3,
            borderRadius: 5,
            border: '1px dashed rgba(15,23,42,0.12)',
            bgcolor: 'background.paper',
          }}
        >
          <RestaurantMenu sx={{ fontSize: 52, color: '#94A3B8', mb: 2 }} />
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>No recipes found</Typography>
          <Typography color="text.secondary">Try a different keyword or switch to another rice type.</Typography>
        </Box>
      ) : (
        <>
          <Grid container spacing={2.5}>
            {recipes.map((recipe) => {
              const tone = toneByRiceType[recipe.riceType] || toneByRiceType.Other;
              const rating = Number(recipe.averageRating || recipe.rating || 0).toFixed(1);

              return (
                <Grid item xs={12} sm={6} lg={4} key={recipe._id}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <Box sx={{ position: 'relative' }}>
                      <CardMedia
                        component={recipe.video ? "video" : "img"}
                        height="220"
                        image={recipe.video || (recipe.images?.length > 0 ? recipe.images[0] : (recipe.image || '/images/default-image.jpg'))}
                        alt={recipe.title}
                        onError={(event) => {
                          event.target.onerror = null;
                          event.target.src = '/images/default-image.jpg';
                        }}
                        style={recipe.video ? { objectFit: 'cover' } : {}}
                      />
                      <Chip label={recipe.riceType || 'Recipe'} sx={{ position: 'absolute', top: 14, left: 14, bgcolor: tone.bg, color: tone.color, fontWeight: 800 }} />
                      <Chip icon={<Star sx={{ color: '#F59E0B !important' }} />} label={rating} sx={{ position: 'absolute', bottom: 14, right: 14, bgcolor: 'rgba(255,255,255,0.94)', fontWeight: 800 }} />
                    </Box>
                    <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
                      <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }} noWrap title={recipe.title}>
                        {recipe.title}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5, minHeight: 44 }}>
                        {recipe.description || 'A polished rice recipe with great pairing ideas and practical cooking inspiration.'}
                      </Typography>
                      <Stack spacing={0.8} sx={{ mb: 2 }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          By <strong>{recipe.sellerId?.name || 'Rice Mill Kitchen'}</strong>
                        </Typography>
                        {recipe.linkedProducts?.length > 0 ? (
                          <Typography variant="body2" sx={{ color: '#C2410C' }}>
                            Uses: {recipe.linkedProducts.map((product) => product.name).join(', ')}
                          </Typography>
                        ) : null}
                      </Stack>
                      <Button
                        component={RouterLink}
                        to={`/recipes/${recipe._id}`}
                        variant="contained"
                        color="success"
                        fullWidth
                      >
                        View Recipe
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>

          {pages > 1 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination count={pages} page={page} onChange={handlePageChange} color="success" disabled={loading} />
            </Box>
          ) : null}
          {loading && page > 1 ? <Loader /> : null}
        </>
      )}
    </Box>
  );
};

export default RecipeList;
