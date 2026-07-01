import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
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
  Slider,
  Divider,
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
import { useNavigate, useLocation } from 'react-router-dom';

// Premium UI Components
import ProductCard from '../ui/ProductCard';
import LoadingSkeleton from '../ui/LoadingSkeleton';
import EmptyState from '../ui/EmptyState';

// Utils
import { getImageUrl } from '../../utils/urlHelper';



const ProductFilter = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

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



  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const location = useLocation();
  
  // Track whether initial load has completed to prevent double-fetch
  const initialLoadDone = React.useRef(false);

  // Initial product load on mount and parse URL params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchParam = params.get('search');
    const categoryParam = params.get('category');
    const saleParam = params.get('sale');

    let initialFilters = { ...filters };
    let hasParams = false;

    if (searchParam) {
      setSearchQuery(searchParam);
      setDebouncedSearch(searchParam);
      hasParams = true;
    }
    
    if (categoryParam) {
      // Find matching category (case-insensitive)
      const matchedCat = categories.find(c => c.toLowerCase() === categoryParam.toLowerCase());
      if (matchedCat) {
        initialFilters.category = matchedCat;
        hasParams = true;
      }
    }
    
    if (saleParam === 'true') {
      initialFilters.discounts = 'true';
      hasParams = true;
    }

    if (hasParams) {
      setFilters(initialFilters);
      dispatch(listFilteredProducts({ ...initialFilters, search: searchParam || '' }));
    } else {
      dispatch(listProducts());
    }
    
    // Mark initial load as done after a tick so the filter-watcher skips its first run
    setTimeout(() => { initialLoadDone.current = true; }, 500);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, location.search]);

  // Apply filters when debounced search or filters change (skip initial mount)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const filtersKey = JSON.stringify(filters);
  useEffect(() => {
    // Skip if initial URL-param load hasn't settled yet
    if (!initialLoadDone.current) return;
    
    if (debouncedSearch.trim() || hasActiveFilters()) {
      dispatch(listFilteredProducts({ ...filters, search: debouncedSearch }));
    } else {
      dispatch(listProducts());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, filtersKey, dispatch]);

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
      badges.push({ label: `Price: ₹${filters.priceRange[0]} - ₹${filters.priceRange[1]}`, key: 'priceRange' });
    }
    if (filters.ratings > 0) badges.push({ label: `${filters.ratings} star & above`, key: 'ratings' });
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
    if (filters.discounts) badges.push({ label: 'On Sale', key: 'discounts' });
    return badges;
  }, [filters]);

  // ── SIDEBAR FILTER PANEL ──
  const FilterPanel = ({ inDrawer = false }) => (
    <Box sx={{
      ...(inDrawer ? {} : {
        position: 'sticky', top: 24, width: '100%',
        bgcolor: '#fff', borderRadius: '16px', p: 2.5,
        border: '1px solid #F3F4F6', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      })
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: '#1F2937' }}>
          Filters
        </Typography>
        {activeFilterBadges.length > 0 && (
          <Button size="small" onClick={handleClearAllFilters} sx={{ color: '#DC2626', fontWeight: 700, fontSize: '0.75rem', minWidth: 'auto', p: 0 }}>
            Clear All
          </Button>
        )}
      </Box>
      <Divider sx={{ mb: 2 }} />

      {/* Category */}
      <Box sx={{ mb: 2.5 }}>
        <Typography sx={{ fontWeight: 700, fontSize: '0.78rem', color: '#6B7280', mb: 1, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Category
        </Typography>
        <Stack spacing={0.5}>
          {['All', ...categories].map(cat => (
            <Chip
              key={cat}
              label={cat}
              size="small"
              onClick={() => handleFilterChange('category', cat === 'All' ? '' : cat)}
              sx={{
                justifyContent: 'flex-start',
                bgcolor: (cat === 'All' ? !filters.category : filters.category === cat) ? '#F0FDF4' : 'transparent',
                color: (cat === 'All' ? !filters.category : filters.category === cat) ? '#2E7D32' : '#4B5563',
                fontWeight: (cat === 'All' ? !filters.category : filters.category === cat) ? 800 : 600,
                borderRadius: '8px', py: 1.5, px: 1.5, height: 'auto',
                '&:hover': { bgcolor: '#F0FDF4' },
                width: '100%'
              }}
            />
          ))}
        </Stack>
      </Box>

      <Divider sx={{ mb: 2.5 }} />

      {/* Price Range */}
      <Box sx={{ mb: 2.5 }}>
        <Typography sx={{ fontWeight: 700, fontSize: '0.78rem', color: '#6B7280', mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Price Range
        </Typography>
        <Slider
          value={filters.priceRange}
          onChange={(e, newValue) => handleFilterChange('priceRange', newValue)}
          valueLabelDisplay="auto"
          min={0}
          max={5000}
          sx={{ color: '#2E7D32', mx: 0.5 }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="caption" fontWeight={700} color="#4B5563">₹{filters.priceRange[0]}</Typography>
          <Typography variant="caption" fontWeight={700} color="#4B5563">₹{filters.priceRange[1]}</Typography>
        </Box>
      </Box>

      <Divider sx={{ mb: 2.5 }} />

      {/* Brand */}
      <Box sx={{ mb: 2.5 }}>
        <Typography sx={{ fontWeight: 700, fontSize: '0.78rem', color: '#6B7280', mb: 1, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Brand
        </Typography>
        <Autocomplete
          multiple
          size="small"
          options={brands}
          value={filters.brand}
          onChange={(e, newValue) => handleFilterChange('brand', newValue)}
          renderInput={(params) => (
            <TextField {...params} placeholder="Select brands" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', fontSize: '0.85rem' } }} />
          )}
        />
      </Box>

      <Divider sx={{ mb: 2.5 }} />

      {/* Rating */}
      <Box sx={{ mb: 2.5 }}>
        <Typography sx={{ fontWeight: 700, fontSize: '0.78rem', color: '#6B7280', mb: 1, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Minimum Rating
        </Typography>
        <Stack direction="row" spacing={1}>
          {[4, 3, 2, 1].map(r => (
            <Chip
              key={r}
              label={`${r}★`}
              size="small"
              onClick={() => handleFilterChange('ratings', filters.ratings === r ? 0 : r)}
              sx={{
                bgcolor: filters.ratings === r ? '#FBBF24' : '#F3F4F6',
                color: filters.ratings === r ? '#1F2937' : '#6B7280',
                fontWeight: 700,
                '&:hover': { bgcolor: filters.ratings === r ? '#F59E0B' : '#E5E7EB' }
              }}
            />
          ))}
        </Stack>
      </Box>

      <Divider sx={{ mb: 2.5 }} />

      {/* Sale Items Toggle */}
      <Box sx={{ mb: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography sx={{ fontWeight: 700, fontSize: '0.78rem', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Sale Items Only
        </Typography>
        <Chip
          label="On Sale"
          size="small"
          onClick={() => handleFilterChange('discounts', filters.discounts ? '' : 'true')}
          sx={{
            bgcolor: filters.discounts ? '#FEE2E2' : '#F3F4F6',
            color: filters.discounts ? '#DC2626' : '#6B7280',
            fontWeight: 700,
            '&:hover': { bgcolor: filters.discounts ? '#FCA5A5' : '#E5E7EB' }
          }}
        />
      </Box>

      {!inDrawer && (
        <Button
          fullWidth
          variant="contained"
          onClick={() => setOpenDrawer(false)}
          sx={{ mt: 1, borderRadius: '12px', py: 1, fontWeight: 700, bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1B5E20' }, textTransform: 'none' }}
        >
          Apply Filters
        </Button>
      )}
    </Box>
  );

  return (
    <Box>
      {/* ── DESKTOP: Sidebar + Content Layout ── */}
      {isDesktop ? (
        <Box sx={{ display: 'flex', gap: 3 }}>
          {/* Left Sidebar */}
          <Box sx={{ width: 260, flexShrink: 0 }}>
            <FilterPanel />
          </Box>

          {/* Right Content */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {/* Search + Sort Bar */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
              <TextField
                fullWidth
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#9CA3AF' }} />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setSearchQuery('')}>
                        <CloseIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </InputAdornment>
                  ),
                  sx: {
                    borderRadius: '24px', bgcolor: '#fff', height: 44,
                    fontSize: '0.9rem',
                    border: '1px solid #E5E7EB',
                    '&:hover': { borderColor: '#2E7D32' },
                    '&.Mui-focused': { borderColor: '#2E7D32' },
                    '& fieldset': { border: 'none' },
                  }
                }}
              />
              <FormControl sx={{ minWidth: 160 }}>
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  displayEmpty
                  startAdornment={<SortIcon sx={{ mr: 1, color: '#9CA3AF', fontSize: 18 }} />}
                  sx={{
                    borderRadius: '24px', bgcolor: '#fff', height: 44, fontWeight: 600, fontSize: '0.85rem',
                    border: '1px solid #E5E7EB',
                    '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                    '&:hover': { borderColor: '#2E7D32' },
                  }}
                >
                  {sortOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value} sx={{ fontWeight: 600 }}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Active Filter Badges */}
            {(activeFilterBadges.length > 0 || searchQuery) && (
              <Box sx={{ mb: 2.5, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
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
              </Box>
            )}

            {/* Products Grid */}
            {productLoading ? (
              <Grid container spacing={2}>
                {[...Array(8)].map((_, item) => (
                  <Grid item xs={6} md={4} lg={3} key={item}>
                    <LoadingSkeleton type="card" />
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
                  const hasOffer = typeof product.offerPrice === 'number' && product.offerPrice > 0 && product.offerPrice < product.price;
                  const displayPrice = hasOffer ? product.offerPrice : product.price;
                  const discount = hasOffer ? Math.round(((product.price - product.offerPrice) / product.price) * 100) : 0;
                  const isProdWishlisted = isWishlisted(product._id);

                  return (
                    <Grid item xs={6} md={4} lg={3} key={product._id}>
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
                        }}
                        wishlisted={isProdWishlisted}
                        onAddToCart={() => handleAddToCart(product._id)}
                        onToggleWishlist={() => handleAddToWishlist(product._id)}
                        onClick={() => navigate(`/products/${product._id}`)}
                      />
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </Box>
        </Box>
      ) : (
        /* ── MOBILE: Stacked Layout ── */
        <Box>
          {/* Search + Filter Button */}
          <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
            <TextField
              fullWidth
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#9CA3AF' }} />
                  </InputAdornment>
                ),
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchQuery('')}>
                      <CloseIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </InputAdornment>
                ),
                sx: {
                  borderRadius: '24px', bgcolor: '#fff', height: 44, fontSize: '0.9rem',
                  border: '1px solid #E5E7EB', '& fieldset': { border: 'none' },
                }
              }}
            />
            <Button
              variant="outlined"
              onClick={() => setOpenDrawer(true)}
              sx={{ borderRadius: '24px', minWidth: 44, px: 2, borderColor: '#E5E7EB', color: '#374151', fontWeight: 700 }}
            >
              <FilterListIcon />
            </Button>
            <FormControl sx={{ minWidth: 120 }}>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                displayEmpty
                sx={{
                  borderRadius: '24px', bgcolor: '#fff', height: 44, fontWeight: 600, fontSize: '0.8rem',
                  border: '1px solid #E5E7EB', '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                }}
              >
                {sortOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value} sx={{ fontWeight: 600 }}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Active Filter Badges */}
          {(activeFilterBadges.length > 0 || searchQuery) && (
            <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
              {searchQuery && (
                <Chip label={`"${searchQuery}"`} onDelete={() => setSearchQuery('')} sx={{ bgcolor: '#2E7D32', color: '#fff', fontWeight: 700 }} size="small" />
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
              <Button size="small" startIcon={<ClearAllIcon />} onClick={handleClearAllFilters} sx={{ color: '#DC2626', fontWeight: 700, textTransform: 'none', fontSize: '0.75rem' }}>
                Clear
              </Button>
            </Box>
          )}

          {/* Products Grid */}
          {productLoading ? (
            <Grid container spacing={1.5}>
              {[...Array(6)].map((_, item) => (
                <Grid item xs={6} key={item}>
                  <LoadingSkeleton type="card" />
                </Grid>
              ))}
            </Grid>
          ) : productError ? (
            <EmptyState icon="⚠️" title="Something went wrong" description={productError} action={{ label: "Try Again", onClick: () => dispatch(listProducts()) }} />
          ) : sortedProducts.length === 0 ? (
            <EmptyState icon="🔍" title="No products found" description="Try adjusting your filters or search query" action={{ label: "Clear All Filters", onClick: handleClearAllFilters }} />
          ) : (
            <Grid container spacing={1.5}>
              {sortedProducts.map((product) => {
                const hasOffer = typeof product.offerPrice === 'number' && product.offerPrice > 0 && product.offerPrice < product.price;
                const displayPrice = hasOffer ? product.offerPrice : product.price;
                const discount = hasOffer ? Math.round(((product.price - product.offerPrice) / product.price) * 100) : 0;
                const isProdWishlisted = isWishlisted(product._id);

                return (
                  <Grid item xs={6} key={product._id}>
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
                      }}
                      wishlisted={isProdWishlisted}
                      onAddToCart={() => handleAddToCart(product._id)}
                      onToggleWishlist={() => handleAddToWishlist(product._id)}
                      onClick={() => navigate(`/products/${product._id}`)}
                    />
                  </Grid>
                );
              })}
            </Grid>
          )}

          {/* Mobile Filter Drawer */}
          <Drawer
            anchor="left"
            open={openDrawer}
            onClose={() => setOpenDrawer(false)}
            PaperProps={{
              sx: { width: '85%', maxWidth: 360, p: 0, borderRadius: '0 16px 16px 0' }
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2.5, borderBottom: '1px solid #F3F4F6' }}>
              <Typography variant="h6" fontWeight={800}>Filters</Typography>
              <IconButton onClick={() => setOpenDrawer(false)} sx={{ bgcolor: '#F3F4F6' }}>
                <CloseIcon />
              </IconButton>
            </Box>
            <Box sx={{ p: 2.5, overflowY: 'auto', flex: 1 }}>
              <FilterPanel inDrawer />
            </Box>
            <Box sx={{ p: 2.5, borderTop: '1px solid #F3F4F6' }}>
              <Button fullWidth variant="contained" onClick={() => setOpenDrawer(false)} sx={{ borderRadius: '12px', py: 1.5, fontWeight: 700, bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1B5E20' }, textTransform: 'none' }}>
                Show Results ({sortedProducts.length})
              </Button>
            </Box>
          </Drawer>
        </Box>
      )}
    </Box>
  );
};

export default ProductFilter;
