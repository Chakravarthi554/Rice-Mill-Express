// Enhanced Product Filter System with comprehensive filtering capabilities
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
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Grid,
  Card,
  CardContent,
  CardActions,
  CardMedia,
  Alert,
  Skeleton,
  Slider,
  IconButton,
  InputAdornment,
  Divider,
  Stack,
  Autocomplete,
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import StarIcon from '@mui/icons-material/Star';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import SortIcon from '@mui/icons-material/Sort';
import { listProducts, listFilteredProducts } from '../../redux/actions/productActions';
import { addToCart } from '../../redux/actions/cartActions';
import { addToWishlist } from '../../redux/actions/userActions';
import { useNavigate } from 'react-router-dom';
import Price from '../common/Price';
import ProductCard from '../ui/ProductCard';
import LoadingSkeleton from '../ui/LoadingSkeleton';
import EmptyState from '../ui/EmptyState';const ProductFilter = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { products = [], loading: productLoading, error: productError } =
    useSelector((state) => state.productList || {});

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [openDrawer, setOpenDrawer] = useState(false);
  const [imageLoading, setImageLoading] = useState({});
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

  const handleBuyNow = (productId) => {
    dispatch(addToCart(productId, 1)).then(() => {
      navigate('/checkout');
    }).catch((error) => {
      alert('Failed to buy now: ' + (error.message || 'Unknown error'));
    });
  };

  const handleAddToCart = (productId) => {
    dispatch(addToCart(productId, 1)).then(() => {
      navigate('/cart');
    }).catch((error) => {
      alert('Failed to add to cart: ' + (error.message || 'Unknown error'));
    });
  };

  const handleAddToWishlist = (productId) => {
    dispatch(addToWishlist(productId));
  };

  const handleImageLoad = (productId) => setImageLoading(prev => ({ ...prev, [productId]: false }));
  const handleImageError = (productId) => setImageLoading(prev => ({ ...prev, [productId]: false }));

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
    if (filters.dietPreference.length > 0) {
      filters.dietPreference.forEach(diet =>
        badges.push({ label: `Diet: ${diet}`, key: 'dietPreference', value: diet })
      );
    }
    if (filters.cookingPurpose.length > 0) {
      filters.cookingPurpose.forEach(purpose =>
        badges.push({ label: `Purpose: ${purpose}`, key: 'cookingPurpose', value: purpose })
      );
    }
    if (filters.ratings > 0) badges.push({ label: `${filters.ratings}★ & above`, key: 'ratings' });
    if (filters.stockAvailability) badges.push({ label: filters.stockAvailability, key: 'stockAvailability' });

    return badges;
  }, [filters]);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Search and Filter Bar */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          fullWidth
          label="Search by Product, Brand, or Description"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: searchQuery && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearchQuery('')}>
                  <CloseIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{ flex: 1, minWidth: '250px' }}
        />
        <Button
          variant="outlined"
          startIcon={<FilterListIcon />}
          onClick={() => setOpenDrawer(true)}
          sx={{ minWidth: '120px' }}
        >
          Filters
        </Button>
        <FormControl sx={{ minWidth: '180px' }}>
          <InputLabel>Sort By</InputLabel>
          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            label="Sort By"
            startAdornment={<SortIcon sx={{ mr: 1, color: 'action.active' }} />}
          >
            {sortOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Active Filter Badges */}
      {(activeFilterBadges.length > 0 || searchQuery) && (
        <Box sx={{ mb: 3 }}>
          <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center" sx={{ gap: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
              Active Filters:
            </Typography>
            {searchQuery && (
              <Chip
                label={`Search: "${searchQuery}"`}
                onDelete={() => setSearchQuery('')}
                color="primary"
                size="small"
              />
            )}
            {activeFilterBadges.map((badge, index) => (
              <Chip
                key={`${badge.key}-${badge.value || index}`}
                label={badge.label}
                onDelete={() => handleRemoveFilter(badge.key, badge.value)}
                color="primary"
                variant="outlined"
                size="small"
              />
            ))}
            <Button
              size="small"
              startIcon={<ClearAllIcon />}
              onClick={handleClearAllFilters}
              sx={{ ml: 1 }}
            >
              Clear All
            </Button>
          </Stack>
        </Box>
      )}

      {/* Result Count */}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {productLoading ? 'Loading...' : `${sortedProducts.length} product${sortedProducts.length !== 1 ? 's' : ''} found`}
      </Typography>

      {/* Filter Drawer */}
      <Drawer anchor="right" open={openDrawer} onClose={() => setOpenDrawer(false)}>
        <Box sx={{ width: 320, p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">Filter Products</Typography>
            <IconButton onClick={() => setOpenDrawer(false)}>
              <CloseIcon />
            </IconButton>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* Category Filter */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              label="Category"
            >
              <MenuItem value="">All Categories</MenuItem>
              {categories.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Brand Filter */}
          <Autocomplete
            multiple
            options={brands}
            value={filters.brand}
            onChange={(e, newValue) => handleFilterChange('brand', newValue)}
            renderInput={(params) => (
              <TextField {...params} label="Brand" placeholder="Select brands" />
            )}
            sx={{ mb: 2 }}
          />

          {/* Type Filter */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Type</InputLabel>
            <Select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              label="Type"
            >
              <MenuItem value="">All Types</MenuItem>
              <MenuItem value="Sona Masuri">Sona Masuri</MenuItem>
              <MenuItem value="Samba Masuri (BPT 5204)">Samba Masuri (BPT 5204)</MenuItem>
              <MenuItem value="Telangana Sona (RNR 15048)">Telangana Sona (RNR 15048)</MenuItem>
              <MenuItem value="Swarna (MTU 7029)">Swarna (MTU 7029)</MenuItem>
              <MenuItem value="Basmati">Basmati</MenuItem>
              <MenuItem value="Brown Rice">Brown Rice</MenuItem>
              <MenuItem value="Parboiled Rice">Parboiled Rice</MenuItem>
            </Select>
          </FormControl>

          {/* Quality Filter */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Quality</InputLabel>
            <Select
              value={filters.quality}
              onChange={(e) => handleFilterChange('quality', e.target.value)}
              label="Quality"
            >
              <MenuItem value="">All Qualities</MenuItem>
              <MenuItem value="Premium (export grade, organic certified)">Premium</MenuItem>
              <MenuItem value="Standard (fine rice for daily use)">Standard</MenuItem>
              <MenuItem value="Broken rice (budget-friendly)">Broken Rice</MenuItem>
            </Select>
          </FormControl>

          {/* Weight Filter */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Weight (kgs)</InputLabel>
            <Select
              value={filters.weight}
              onChange={(e) => handleFilterChange('weight', e.target.value)}
              label="Weight (kgs)"
            >
              <MenuItem value="">All Weights</MenuItem>
              <MenuItem value="1 kg">1 kg</MenuItem>
              <MenuItem value="5 kg">5 kg</MenuItem>
              <MenuItem value="10 kg">10 kg</MenuItem>
              <MenuItem value="25 kg">25 kg</MenuItem>
              <MenuItem value="50 kg">50 kg</MenuItem>
            </Select>
          </FormControl>

          {/* Price Range */}
          <Typography variant="body1" gutterBottom sx={{ mt: 3 }}>
            Price Range: ₹{filters.priceRange[0]} - ₹{filters.priceRange[1]}
          </Typography>
          <Slider
            value={filters.priceRange}
            onChange={(e, newValue) => handleFilterChange('priceRange', newValue)}
            valueLabelDisplay="auto"
            min={0}
            max={5000}
            step={100}
            sx={{ mb: 3 }}
          />

          {/* Rating Filter */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Ratings & Reviews</InputLabel>
            <Select
              value={filters.ratings}
              onChange={(e) => handleFilterChange('ratings', e.target.value)}
              label="Ratings & Reviews"
            >
              <MenuItem value={0}>All Ratings</MenuItem>
              <MenuItem value={4}>4★ & above</MenuItem>
              <MenuItem value={3}>3★ & above</MenuItem>
              <MenuItem value={2}>2★ & above</MenuItem>
              <MenuItem value={1}>1★ & above</MenuItem>
            </Select>
          </FormControl>

          {/* Stock Availability */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Stock Availability</InputLabel>
            <Select
              value={filters.stockAvailability}
              onChange={(e) => handleFilterChange('stockAvailability', e.target.value)}
              label="Stock Availability"
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="In-stock">In-stock</MenuItem>
              <MenuItem value="Pre-order">Pre-order</MenuItem>
            </Select>
          </FormControl>

          <Divider sx={{ my: 3 }} />

          {/* Action Buttons */}
          <Stack spacing={2}>
            <Button
              variant="contained"
              fullWidth
              onClick={() => setOpenDrawer(false)}
            >
              Apply Filters
            </Button>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<ClearAllIcon />}
              onClick={handleClearAllFilters}
            >
              Clear All Filters
            </Button>
          </Stack>
        </Box>
      </Drawer>

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
  );
};

export default ProductFilter;