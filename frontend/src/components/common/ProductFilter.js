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
    'Basmati Rice',
    'Sona Masoori',
    'Kolam Rice',
    'Brown Rice',
    'Organic Products',
    'Wholesale',
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
          top: 70, // Below header
          zIndex: 100,
          bgcolor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid #F3F4F6',
          py: 2,
          mb: 4
        }}
      >
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
                    <SearchIcon sx={{ color: '#2E7D32' }} />
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
                  borderRadius: '24px',
                  bgcolor: '#F3F4F6',
                  '& fieldset': { borderColor: 'transparent' },
                  '&:hover fieldset': { borderColor: '#4CAF50' },
                  '&.Mui-focused fieldset': { borderColor: '#2E7D32' }
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
                  borderRadius: '24px',
                  px: 3,
                  py: 1,
                  borderColor: '#E5E7EB',
                  color: '#374151',
                  fontWeight: 700,
                  textTransform: 'none',
                  '&:hover': { borderColor: '#2E7D32', color: '#2E7D32' }
                }}
              >
                Filters {activeFilterBadges.length > 0 && `(${activeFilterBadges.length})`}
              </Button>
              <FormControl sx={{ minWidth: 160 }}>
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  displayEmpty
                  startAdornment={<SortIcon sx={{ mr: 1, color: '#9CA3AF' }} />}
                  sx={{
                    borderRadius: '24px',
                    bgcolor: '#F3F4F6',
                    height: 44,
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'transparent' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#4CAF50' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#2E7D32' },
                    fontWeight: 700,
                    fontSize: '0.85rem'
                  }}
                >
                  {sortOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value} sx={{ fontWeight: 600 }}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* ── QUICK CATEGORY TABS ── */}
      <Box sx={{ display: 'flex', gap: 1.5, overflowX: 'auto', pb: 2, mb: 3, '&::-webkit-scrollbar': { display: 'none' } }}>
        <Chip
          label="All Products"
          onClick={() => handleFilterChange('category', '')}
          sx={{
            bgcolor: !filters.category ? '#2E7D32' : '#F3F4F6',
            color: !filters.category ? '#fff' : '#4B5563',
            fontWeight: 700,
            fontSize: '0.8rem',
            '&:hover': { bgcolor: !filters.category ? '#1B5E20' : '#E5E7EB' }
          }}
        />
        {categories.map(cat => (
          <Chip
            key={cat}
            label={cat}
            onClick={() => handleFilterChange('category', cat)}
            sx={{
              bgcolor: filters.category === cat ? '#2E7D32' : '#F3F4F6',
              color: filters.category === cat ? '#fff' : '#4B5563',
              fontWeight: 700,
              fontSize: '0.8rem',
              '&:hover': { bgcolor: filters.category === cat ? '#1B5E20' : '#E5E7EB' }
            }}
          />
        ))}
      </Box>

      {/* Active Filter Badges */}
      {(activeFilterBadges.length > 0 || searchQuery) && (
        <Box sx={{ mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          <Typography variant="caption" sx={{ fontWeight: 800, color: '#9CA3AF', mr: 1, textTransform: 'uppercase' }}>
            Active Filters:
          </Typography>
          {searchQuery && (
            <Chip
              label={`"${searchQuery}"`}
              onDelete={() => setSearchQuery('')}
              sx={{ bgcolor: '#2E7D32', color: '#fff', fontWeight: 700 }}
              size="small"
            />
          )}
          {activeFilterBadges.map((badge, index) => (
            <Chip
              key={`${badge.key}-${badge.value || index}`}
              label={badge.label}
              onDelete={() => handleRemoveFilter(badge.key, badge.value)}
              variant="outlined"
              sx={{ borderColor: '#4CAF50', color: '#2E7D32', fontWeight: 700 }}
              size="small"
            />
          ))}
          <Button
            size="small"
            startIcon={<ClearAllIcon />}
            onClick={handleClearAllFilters}
            sx={{ color: '#DC2626', fontWeight: 700, textTransform: 'none' }}
          >
            Clear All
          </Button>
        </Box>
      )}

      {/* Products Grid */}
      {productLoading ? (
        <Grid container spacing={2}>
          {[...Array(12)].map((_, item) => (
            <Grid item xs={6} sm={4} md={2} key={item}>
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
            description="Try adjusting your filters or search query"
            action={{ label: "Clear All Filters", onClick: handleClearAllFilters }}
        />
      ) : (
        <Grid container spacing={2}>
          {sortedProducts.map((product) => {
            const hasOffer =
              typeof product.offerPrice === 'number' &&
              product.offerPrice > 0 &&
              product.offerPrice < product.price;
            const displayPrice = hasOffer ? product.offerPrice : product.price;
            const discount = hasOffer ? Math.round(((product.price - product.offerPrice) / product.price) * 100) : 0;
            const isProdWishlisted = isWishlisted(product._id);
            const deliveryEta = `${15 + (product.name?.length % 15)} mins`;

            return (
              <Grid item xs={6} sm={4} md={2} key={product._id}>
                <ProductCard
                  product={{
                      _id: product._id,
                      name: product.name,
                      image: getImageUrl(product.images?.[0] || product.image),
                      price: displayPrice || 0,
                      mrp: hasOffer ? product.price : null,
                      discount: discount,
                      rating: Number(product.rating || 0),
                      countInStock: product.countInStock,
                      deliveryEta: deliveryEta
                  }}
                  wishlisted={isProdWishlisted}
                  onAddToCart={() => {
                    handleAddToCart(product._id);
                  }}
                  onToggleWishlist={() => {
                    handleAddToWishlist(product._id);
                  }}
                  onClick={() => navigate(`/products/${product._id}`)}
                />
              </Grid>
            );
          })}
        </Grid>
      )}

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
          <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F3F4F6' }}>
            <Typography variant="h6" fontWeight={800}>Filter Products</Typography>
            <IconButton onClick={() => setOpenDrawer(false)} sx={{ bgcolor: '#F3F4F6' }}>
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Drawer Content */}
          <Box sx={{ p: 3, flex: 1, overflowY: 'auto' }}>
            <Stack spacing={4}>
              {/* Category Filter */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700, color: '#1F2937' }}>CATEGORY</Typography>
                <FormControl fullWidth>
                  <Select
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    displayEmpty
                    sx={{ borderRadius: '12px', bgcolor: '#F3F4F6' }}
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
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700, color: '#1F2937' }}>BRANDS</Typography>
                <Autocomplete
                  multiple
                  options={brands}
                  value={filters.brand}
                  onChange={(e, newValue) => handleFilterChange('brand', newValue)}
                  renderInput={(params) => (
                    <TextField {...params} placeholder="Select brands" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: '#F3F4F6' } }} />
                  )}
                />
              </Box>

              {/* Price Range Slider */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700, color: '#1F2937' }}>PRICE RANGE (₹)</Typography>
                <Box sx={{ px: 1 }}>
                  <Slider
                    value={filters.priceRange}
                    onChange={(e, newValue) => handleFilterChange('priceRange', newValue)}
                    valueLabelDisplay="auto"
                    min={0}
                    max={5000}
                    sx={{ color: '#2E7D32' }}
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                    <Typography variant="caption" fontWeight={700}>₹{filters.priceRange[0]}</Typography>
                    <Typography variant="caption" fontWeight={700}>₹{filters.priceRange[1]}</Typography>
                  </Box>
                </Box>
              </Box>
            </Stack>
          </Box>

          {/* Drawer Footer */}
          <Box sx={{ p: 3, borderTop: '1px solid #F3F4F6', display: 'flex', gap: 2 }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={handleClearAllFilters}
              sx={{ borderRadius: '24px', py: 1.5, fontWeight: 700, borderColor: '#E5E7EB', color: '#374151' }}
            >
              Reset
            </Button>
            <Button
              fullWidth
              variant="contained"
              onClick={() => setOpenDrawer(false)}
              sx={{ borderRadius: '24px', py: 1.5, fontWeight: 700, bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1B5E20' } }}
            >
              Apply
            </Button>
          </Box>
        </Box>
      </Drawer>
    </Box>
  );
};

export default ProductFilter;
