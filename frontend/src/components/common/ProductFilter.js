// Enhanced Product Filter System with premium UI components
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Container,
  TextField,
  Button,
  Drawer,
  Box,
  Typography,
  FormControl,
  Select,
  MenuItem,
  Chip,
  Grid,
  IconButton,
  InputAdornment,
  Stack,
  Autocomplete,
  useMediaQuery,
  Paper,
  Slider,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import FilterListIcon from '@mui/icons-material/FilterList';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import SortIcon from '@mui/icons-material/Sort';
import { listProducts, listFilteredProducts } from '../../redux/actions/productActions';
import { addToCart } from '../../redux/actions/cartActions';
import { addToWishlist } from '../../redux/actions/userActions';
import { useNavigate } from 'react-router-dom';

// Premium UI Components
import ProductCard from '../ui/ProductCard';
import LoadingSkeleton from '../ui/LoadingSkeleton';
import EmptyState from '../ui/EmptyState';
import SectionHeader from '../ui/SectionHeader';

// Utils
import { getImageUrl } from '../../utils/urlHelper';

// Theme & Tokens
import { colors, radius, zIndex } from '../../theme/designTokens';

const ProductFilter = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const { products = [], loading: productLoading, error: productError } =
    useSelector((state) => state.productList || {});
  const { wishlistItems = [] } = useSelector(state => state.wishlist || {});

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [openDrawer, setOpenDrawer] = useState(false);
  const [sortBy, setSortBy] = useState('newest');

  const [filters, setFilters] = useState({
    category: '',
    type: '',
    quality: '',
    weight: '',
    priceRange: [0, 5000],
    brand: [],
    dietPreference: [],
    cookingPurpose: [],
    sellerLocation: '',
    deliveryOptions: [],
    ratings: 0,
    discounts: '',
    stockAvailability: '',
  });

  const categories = [
    'Rice',
    'Flour',
    'Millets',
    'Pulses & Legumes',
    'Edible Oils',
    'Spices & Condiments',
    'Dry Fruits & Nuts',
    'Organic Products',
  ];

  const brands = useMemo(() => {
    const uniqueBrands = [...new Set(products.map(p => p.brand).filter(Boolean))];
    return uniqueBrands.sort();
  }, [products]);

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'popular', label: 'Most Popular' },
  ];

  // Load products on mount
  useEffect(() => {
    dispatch(listProducts());
  }, [dispatch]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Apply filters when debounced search or filters change
  useEffect(() => {
    if (debouncedSearch.trim() || hasActiveFilters()) {
      dispatch(listFilteredProducts({ ...filters, search: debouncedSearch }));
    } else {
      dispatch(listProducts());
    }
  }, [debouncedSearch, filters, dispatch]);

  const hasActiveFilters = useCallback(() => {
    return (
      filters.category ||
      filters.type ||
      filters.quality ||
      filters.weight ||
      filters.brand.length > 0 ||
      filters.priceRange[0] !== 0 ||
      filters.priceRange[1] !== 5000 ||
      filters.dietPreference.length > 0 ||
      filters.cookingPurpose.length > 0 ||
      filters.sellerLocation ||
      filters.deliveryOptions.length > 0 ||
      filters.ratings > 0 ||
      filters.discounts ||
      filters.stockAvailability
    );
  }, [filters]);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleClearAllFilters = () => {
    setFilters({
      category: '',
      type: '',
      quality: '',
      weight: '',
      priceRange: [0, 5000],
      brand: [],
      dietPreference: [],
      cookingPurpose: [],
      sellerLocation: '',
      deliveryOptions: [],
      ratings: 0,
      discounts: '',
      stockAvailability: '',
    });
    setSearchQuery('');
    setDebouncedSearch('');
  };

  const handleRemoveFilter = (filterKey, value = null) => {
    if (filterKey === 'priceRange') {
      setFilters(prev => ({ ...prev, priceRange: [0, 5000] }));
    } else if (Array.isArray(filters[filterKey])) {
      setFilters(prev => ({
        ...prev,
        [filterKey]: prev[filterKey].filter(item => item !== value)
      }));
    } else {
      setFilters(prev => ({ ...prev, [filterKey]: filterKey === 'ratings' ? 0 : '' }));
    }
  };

  const handleAddToCart = async (productId) => {
    try { await dispatch(addToCart(productId, 1)); }
    catch (err) { alert(err.message || 'Failed to add to cart'); }
  };

  const handleAddToWishlist = async (productId) => {
    try { await dispatch(addToWishlist(productId)); }
    catch (err) { alert(err.message || 'Failed to add to wishlist'); }
  };

  const isWishlisted = (id) => wishlistItems.some(x => (x._id || x) === id);

  // Sort products
  const sortedProducts = useMemo(() => {
    const productsToSort = [...products];

    switch (sortBy) {
      case 'price-low':
        return productsToSort.sort((a, b) => {
          const priceA = a.offerPrice || a.price || 0;
          const priceB = b.offerPrice || b.price || 0;
          return priceA - priceB;
        });
      case 'price-high':
        return productsToSort.sort((a, b) => {
          const priceA = a.offerPrice || a.price || 0;
          const priceB = b.offerPrice || b.price || 0;
          return priceB - priceA;
        });
      case 'rating':
        return productsToSort.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case 'popular':
        return productsToSort.sort((a, b) => (b.numReviews || 0) - (a.numReviews || 0));
      case 'newest':
      default:
        return productsToSort.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
  }, [products, sortBy]);

  // Active filter badges
  const activeFilterBadges = useMemo(() => {
    const badges = [];

    if (filters.category) badges.push({ label: `Category: ${filters.category}`, key: 'category' });
    if (filters.type) badges.push({ label: `Type: ${filters.type}`, key: 'type' });
    if (filters.quality) badges.push({ label: `Quality: ${filters.quality}`, key: 'quality' });
    if (filters.weight) badges.push({ label: `Weight: ${filters.weight}`, key: 'weight' });
    if (filters.brand.length > 0) {
      filters.brand.forEach(brand =>
        badges.push({ label: `Brand: ${brand}`, key: 'brand', value: brand })
      );
    }
    if (filters.priceRange[0] !== 0 || filters.priceRange[1] !== 5000) {
      badges.push({
        label: `Price: ₹${filters.priceRange[0]} - ₹${filters.priceRange[1]}`,
        key: 'priceRange'
      });
    }
    if (filters.ratings > 0) badges.push({ label: `${filters.ratings}★ & above`, key: 'ratings' });
    if (filters.dietPreference.length > 0) {
      filters.dietPreference.forEach(diet =>
        badges.push({ label: diet, key: 'dietPreference', value: diet })
      );
    }
    if (filters.cookingPurpose.length > 0) {
      filters.cookingPurpose.forEach(purpose =>
        badges.push({ label: purpose, key: 'cookingPurpose', value: purpose })
      );
    }
    if (filters.stockAvailability) badges.push({ label: filters.stockAvailability, key: 'stockAvailability' });

    return badges;
  }, [filters]);

  return (
    <Box sx={{ pb: 8 }}>
      {/* ── STICKY SEARCH & SORT BAR ── */}
      <Paper
        elevation={0}
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: zIndex.sticky,
          bgcolor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderBottom: `1px solid ${colors.neutral[100]}`,
          py: 2,
          px: { xs: 2, md: 0 },
          mx: { xs: -2, md: 0 },
          mb: 4
        }}
      >
        <Container maxWidth="xl">
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={7}>
              <TextField
                fullWidth
                placeholder="Search premium rice, brands, or collections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: colors.primary.main }} />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setSearchQuery('')}>
                        <CloseIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                  sx: {
                    borderRadius: radius.pill,
                    bgcolor: colors.neutral[50],
                    '& fieldset': { borderColor: 'transparent' },
                    '&:hover fieldset': { borderColor: colors.primary.light },
                    '&.Mui-focused fieldset': { borderColor: colors.primary.main },
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={5}>
              <Stack direction="row" spacing={2} justifyContent={{ xs: 'space-between', md: 'flex-end' }}>
                <Button
                  variant="outlined"
                  startIcon={<FilterListIcon />}
                  onClick={() => setOpenDrawer(true)}
                  sx={{
                    borderRadius: radius.pill,
                    px: 3,
                    py: 1,
                    borderColor: colors.neutral[200],
                    color: colors.neutral[700],
                    fontWeight: 600,
                    '&:hover': { borderColor: colors.primary.main, color: colors.primary.main }
                  }}
                >
                  Filters {activeFilterBadges.length > 0 && `(${activeFilterBadges.length})`}
                </Button>
                <FormControl sx={{ minWidth: 160 }}>
                  <Select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    displayEmpty
                    startAdornment={<SortIcon sx={{ mr: 1, color: colors.neutral[500] }} />}
                    sx={{
                      borderRadius: radius.pill,
                      bgcolor: colors.neutral[50],
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: 'transparent' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: colors.primary.light },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: colors.primary.main },
                      fontWeight: 600
                    }}
                  >
                    {sortOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
            </Grid>
          </Grid>

          {/* Active Filter Badges */}
          {(activeFilterBadges.length > 0 || searchQuery) && (
            <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: colors.neutral[500], mr: 1 }}>
                ACTIVE FILTERS:
              </Typography>
              {searchQuery && (
                <Chip
                  label={`"${searchQuery}"`}
                  onDelete={() => setSearchQuery('')}
                  sx={{ bgcolor: colors.primary.main, color: '#fff', fontWeight: 600 }}
                  size="small"
                />
              )}
              {activeFilterBadges.map((badge, index) => (
                <Chip
                  key={`${badge.key}-${badge.value || index}`}
                  label={badge.label}
                  onDelete={() => handleRemoveFilter(badge.key, badge.value)}
                  variant="outlined"
                  sx={{ borderColor: colors.primary.light, color: colors.primary.main, fontWeight: 600 }}
                  size="small"
                />
              ))}
              <Button
                size="small"
                startIcon={<ClearAllIcon />}
                onClick={handleClearAllFilters}
                sx={{ color: colors.error, fontWeight: 700, textTransform: 'none' }}
              >
                Clear All
              </Button>
            </Box>
          )}
        </Container>
      </Paper>

      <Container maxWidth="xl">
        {/* Result Header */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <SectionHeader
            title={searchQuery ? `Search Results for "${searchQuery}"` : filters.category || "All Products"}
            subtitle={`${sortedProducts.length} premium products found`}
          />
        </Box>

        {/* Products Grid */}
        {productLoading ? (
          <Grid container spacing={3}>
            {[...Array(8)].map((_, item) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={item}>
                <LoadingSkeleton type="product" />
              </Grid>
            ))}
          </Grid>
        ) : productError ? (
          <EmptyState
            icon="⚠️"
            title="Something went wrong"
            description={productError}
            action={{ label: "Try Again", onClick: () => dispatch(listProducts()) }}
          />
        ) : sortedProducts.length === 0 ? (
          <EmptyState
              icon="🔍"
              title="No products found"
              description="We couldn't find any products matching your current filters. Try broadening your search!"
              action={{ label: "Clear All Filters", onClick: handleClearAllFilters }}
          />
        ) : (
          <Grid container spacing={3}>
            {sortedProducts.map((product) => {
              const hasOffer = typeof product.offerPrice === 'number' && product.offerPrice > 0 && product.offerPrice < product.price;
              const displayPrice = hasOffer ? product.offerPrice : product.price;
              const discount = hasOffer ? Math.round(((product.price - product.offerPrice) / product.price) * 100) : 0;

              return (
                <Grid item xs={12} sm={6} md={4} lg={3} key={product._id}>
                  <ProductCard
                    product={{
                        _id: product._id,
                        name: product.name,
                        image: getImageUrl(product.images?.[0]),
                        price: displayPrice || 0,
                        mrp: hasOffer ? product.price : null,
                        discount: discount,
                        rating: Number(product.rating || (Math.random() * 1 + 4).toFixed(1)),
                        countInStock: product.countInStock
                    }}
                    wishlisted={isWishlisted(product._id)}
                    onAddToCart={() => handleAddToCart(product._id)}
                    onToggleWishlist={() => handleAddToWishlist(product._id)}
                    onClick={() => navigate(`/products/${product._id}`)}
                  />
                </Grid>
              );
            })}
          </Grid>
        )}
      </Container>

      {/* ── FILTER DRAWER ── */}
      <Drawer
        anchor="right"
        open={openDrawer}
        onClose={() => setOpenDrawer(false)}
        PaperProps={{
          sx: { width: { xs: '100%', sm: 380 }, p: 0, borderRadius: { xs: 0, sm: '24px 0 0 24px' } }
        }}
      >
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Drawer Header */}
          <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${colors.neutral[100]}` }}>
            <Typography variant="h6" fontWeight={800}>Filter Products</Typography>
            <IconButton onClick={() => setOpenDrawer(false)} sx={{ bgcolor: colors.neutral[50] }}>
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Drawer Content */}
          <Box sx={{ p: 3, flex: 1, overflowY: 'auto' }}>
            <Stack spacing={4}>
              {/* Category Filter */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700, color: colors.neutral[900] }}>CATEGORY</Typography>
                <FormControl fullWidth>
                  <Select
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    displayEmpty
                    sx={{ borderRadius: radius.md, bgcolor: colors.neutral[50] }}
                  >
                    <MenuItem value="">All Categories</MenuItem>
                    {categories.map((cat) => (
                      <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              {/* Brand Filter */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700, color: colors.neutral[900] }}>BRANDS</Typography>
                <Autocomplete
                  multiple
                  options={brands}
                  value={filters.brand}
                  onChange={(e, newValue) => handleFilterChange('brand', newValue)}
                  renderInput={(params) => (
                    <TextField {...params} placeholder="Select brands" sx={{ '& .MuiOutlinedInput-root': { borderRadius: radius.md, bgcolor: colors.neutral[50] } }} />
                  )}
                />
              </Box>

              {/* Type Filter */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700, color: colors.neutral[900] }}>RICE TYPE</Typography>
                <FormControl fullWidth>
                  <Select
                    value={filters.type}
                    onChange={(e) => handleFilterChange('type', e.target.value)}
                    displayEmpty
                    sx={{ borderRadius: radius.md, bgcolor: colors.neutral[50] }}
                  >
                    <MenuItem value="">All Types</MenuItem>
                    <MenuItem value="Basmati">Basmati</MenuItem>
                    <MenuItem value="Sona Masuri">Sona Masuri</MenuItem>
                    <MenuItem value="Brown Rice">Brown Rice</MenuItem>
                    <MenuItem value="Parboiled Rice">Parboiled Rice</MenuItem>
                    <MenuItem value="Kollam">Kollam</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {/* Diet Preference Filter */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700, color: colors.neutral[900] }}>DIET PREFERENCE</Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {['Vegetarian', 'Gluten Free', 'Organic', 'Low GI'].map((diet) => (
                    <Chip
                      key={diet}
                      label={diet}
                      onClick={() => {
                        const newValues = filters.dietPreference.includes(diet)
                          ? filters.dietPreference.filter(v => v !== diet)
                          : [...filters.dietPreference, diet];
                        handleFilterChange('dietPreference', newValues);
                      }}
                      sx={{
                        borderRadius: radius.pill,
                        fontWeight: 600,
                        bgcolor: filters.dietPreference.includes(diet) ? colors.primary.main : colors.neutral[50],
                        color: filters.dietPreference.includes(diet) ? '#fff' : colors.neutral[700],
                        '&:hover': { bgcolor: filters.dietPreference.includes(diet) ? colors.primary.dark : colors.neutral[100] }
                      }}
                    />
                  ))}
                </Stack>
              </Box>

              {/* Cooking Purpose Filter */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700, color: colors.neutral[900] }}>COOKING PURPOSE</Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {['Daily Use', 'Biryani', 'Pulao', 'Idli/Dosa', 'Kheer'].map((purpose) => (
                    <Chip
                      key={purpose}
                      label={purpose}
                      onClick={() => {
                        const newValues = filters.cookingPurpose.includes(purpose)
                          ? filters.cookingPurpose.filter(v => v !== purpose)
                          : [...filters.cookingPurpose, purpose];
                        handleFilterChange('cookingPurpose', newValues);
                      }}
                      sx={{
                        borderRadius: radius.pill,
                        fontWeight: 600,
                        bgcolor: filters.cookingPurpose.includes(purpose) ? colors.primary.main : colors.neutral[50],
                        color: filters.cookingPurpose.includes(purpose) ? '#fff' : colors.neutral[700],
                        '&:hover': { bgcolor: filters.cookingPurpose.includes(purpose) ? colors.primary.dark : colors.neutral[100] }
                      }}
                    />
                  ))}
                </Stack>
              </Box>

              {/* Quality Filter */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700, color: colors.neutral[900] }}>QUALITY</Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {['Premium', 'Standard', 'Broken Rice'].map((q) => (
                    <Chip
                      key={q}
                      label={q}
                      onClick={() => handleFilterChange('quality', filters.quality === q ? '' : q)}
                      sx={{
                        borderRadius: radius.pill,
                        fontWeight: 600,
                        bgcolor: filters.quality === q ? colors.primary.main : colors.neutral[50],
                        color: filters.quality === q ? '#fff' : colors.neutral[700],
                        '&:hover': { bgcolor: filters.quality === q ? colors.primary.dark : colors.neutral[100] }
                      }}
                    />
                  ))}
                </Stack>
              </Box>

              {/* Price Filter */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700, color: colors.neutral[900] }}>PRICE RANGE</Typography>
                <Box sx={{ px: 1 }}>
                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                    <Typography variant="body2" fontWeight={700}>₹{filters.priceRange[0]}</Typography>
                    <Typography variant="body2" fontWeight={700}>₹{filters.priceRange[1]}</Typography>
                  </Stack>
                  <Slider
                    value={filters.priceRange}
                    onChange={(e, newValue) => handleFilterChange('priceRange', newValue)}
                    valueLabelDisplay="auto"
                    min={0}
                    max={5000}
                    step={100}
                    sx={{
                      color: colors.primary.main,
                      '& .MuiSlider-thumb': {
                        bgcolor: '#fff',
                        border: `2px solid ${colors.primary.main}`,
                      }
                    }}
                  />
                </Box>
              </Box>

              {/* Rating Filter */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700, color: colors.neutral[900] }}>MINIMUM RATING</Typography>
                <Stack direction="row" spacing={1}>
                  {[4, 3, 2, 1].map((r) => (
                    <Button
                      key={r}
                      variant={filters.ratings === r ? "contained" : "outlined"}
                      onClick={() => handleFilterChange('ratings', filters.ratings === r ? 0 : r)}
                      sx={{
                        borderRadius: radius.pill,
                        minWidth: 60,
                        borderColor: colors.neutral[200],
                        color: filters.ratings === r ? '#fff' : colors.neutral[700]
                      }}
                    >
                      {r}★
                    </Button>
                  ))}
                </Stack>
              </Box>
            </Stack>
          </Box>

          {/* Drawer Footer */}
          <Box sx={{ p: 3, borderTop: `1px solid ${colors.neutral[100]}`, display: 'flex', gap: 2 }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={handleClearAllFilters}
              sx={{ borderRadius: radius.pill, py: 1.5, fontWeight: 700, borderColor: colors.neutral[200], color: colors.neutral[700] }}
            >
              Reset
            </Button>
            <Button
              fullWidth
              variant="contained"
              onClick={() => setOpenDrawer(false)}
              sx={{ borderRadius: radius.pill, py: 1.5, fontWeight: 700, bgcolor: colors.primary.main, '&:hover': { bgcolor: colors.primary.dark } }}
            >
              Apply
            </Button>
          </Box>
        </Box>
      </Drawer>
<<<<<<< HEAD
    </Box>
=======

      {/* Products Grid */}
      {productLoading ? (
        <Grid container spacing={3}>
          {[...Array(8)].map((_, item) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={item}>
              <LoadingSkeleton type="product" />
            </Grid>
          ))}
        </Grid>
      ) : productError ? (
        <Alert severity="error">{productError}</Alert>
      ) : sortedProducts.length === 0 ? (
        <EmptyState 
            icon="🔍"
            title="No products found"
            description="Try adjusting your filters or search query"
            action={{ label: "Clear All Filters", onClick: handleClearAllFilters }}
        />
      ) : (
        <Grid container spacing={3}>
          {sortedProducts.map((product) => {
            const hasOffer =
              typeof product.offerPrice === 'number' &&
              product.offerPrice > 0 &&
              product.offerPrice < product.price;
            const displayPrice = hasOffer ? product.offerPrice : product.price;
            const discount = hasOffer ? Math.round(((product.price - product.offerPrice) / product.price) * 100) : 0;
            const isWishlisted = false; // Add wishlist check if available in state

            return (
              <Grid item xs={12} sm={6} md={4} lg={3} key={product._id}>
                <ProductCard
                  product={{
                      _id: product._id,
                      name: product.name,
                      image: product.images?.[0] || null,
                      price: displayPrice || 0,
                      mrp: hasOffer ? product.price : null,
                      discount: discount,
                      rating: Number(product.rating || 0),
                      countInStock: product.countInStock
                  }}
                  wishlisted={isWishlisted}
                  onAddToCart={() => {
                    handleAddToCart(product._id);
                  }}
                  onToggleWishlist={() => {
                    // Dispatch wishlist toggle if applicable
                  }}
                  onClick={() => navigate(`/products/${product._id}`)}
                />
              </Grid>
            );
          })}
        </Grid>
      )}
    </Container>
>>>>>>> a66af4ba90d62021e80410263e806adc23403bd9
  );
};

export default ProductFilter;
