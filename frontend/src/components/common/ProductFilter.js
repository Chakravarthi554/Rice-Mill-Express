import React, { useState, useEffect } from 'react';
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
  FormControlLabel,
  Checkbox,
  Grid,
  Card,
  CardContent,
  CardActions,
  CardMedia,
  Alert,
  Skeleton,
  Slider,
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import StarIcon from '@mui/icons-material/Star';
import { listProducts, listFilteredProducts } from '../../redux/actions/productActions';
import { addToCart } from '../../redux/actions/cartActions';
import { addToWishlist } from '../../redux/actions/userActions';
import { useNavigate } from 'react-router-dom';

const ProductFilter = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { products = [], loading: productLoading, error: productError } = 
    useSelector((state) => state.productList || {});
  const { filteredProducts = [], loading: filteredLoading, error: filteredError } = 
    useSelector((state) => state.productFilter || {});
  const [searchQuery, setSearchQuery] = useState('');
  const [openDrawer, setOpenDrawer] = useState(false);
  const [imageLoading, setImageLoading] = useState({});
  const [filters, setFilters] = useState({
    category: '',
    type: '',
    quality: '',
    weight: '',
    priceRange: [0, 5000],
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

  useEffect(() => {
    dispatch(listProducts());
  }, [dispatch]);

  // ✅ FIXED: Real-time search - shows products as user types/deletes
  useEffect(() => {
    if (searchQuery.trim()) {
      dispatch(listFilteredProducts({ ...filters, search: searchQuery }));
    } else {
      // ✅ FIXED: When search is cleared, show all products (or filtered products without search)
      dispatch(listFilteredProducts({ ...filters, search: '' }));
    }
  }, [dispatch, filters, searchQuery]);

  const handleSearch = () => {
    dispatch(listFilteredProducts({ ...filters, search: searchQuery }));
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleApplyFilters = () => {
    dispatch(listFilteredProducts({ ...filters, search: searchQuery }));
    setOpenDrawer(false);
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

  const displayedProducts = searchQuery || Object.values(filters).some(val => 
    (Array.isArray(val) && val.length > 0) || (typeof val === 'string' && val) || 
    (Array.isArray(val) && val[0] !== 0 && val[1] !== 5000)
  )
    ? [...filteredProducts, ...products.filter(p => !filteredProducts.some(fp => fp._id === p._id))]
    : products;

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
        <TextField
          fullWidth
          label="Search by Product, City, or Pincode"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <Button
          variant="outlined"
          startIcon={<FilterListIcon />}
          onClick={() => setOpenDrawer(true)}
        >
          Filter
        </Button>
      </Box>

      <Drawer anchor="right" open={openDrawer} onClose={() => setOpenDrawer(false)}>
        <Box sx={{ width: 300, p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Filter Products
          </Typography>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              label="Category"
            >
              {categories.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Type</InputLabel>
            <Select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              label="Type"
            >
              <MenuItem value="Sona Masuri">Sona Masuri</MenuItem>
              <MenuItem value="Samba Masuri (BPT 5204)">Samba Masuri (BPT 5204)</MenuItem>
              <MenuItem value="Telangana Sona (RNR 15048)">Telangana Sona (RNR 15048)</MenuItem>
              <MenuItem value="Swarna (MTU 7029)">Swarna (MTU 7029)</MenuItem>
              <MenuItem value="Jagtial Sannalu (JGL 1798, JGL 3844)">Jagtial Sannalu (JGL 1798, JGL 3844)</MenuItem>
              <MenuItem value="Kunaram Sannalu (KNM 118, KNM 1189)">Kunaram Sannalu (KNM 118, KNM 1189)</MenuItem>
              <MenuItem value="Tellahamsa">Tellahamsa</MenuItem>
              <MenuItem value="Red Rice (Erramallelu, Champa)">Red Rice (Erramallelu, Champa)</MenuItem>
              <MenuItem value="Brown Rice">Brown Rice</MenuItem>
              <MenuItem value="Basmati">Basmati</MenuItem>
              <MenuItem value="Parboiled Rice">Parboiled Rice</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Quality</InputLabel>
            <Select
              value={filters.quality}
              onChange={(e) => handleFilterChange('quality', e.target.value)}
              label="Quality"
            >
              <MenuItem value="Premium (export grade, organic certified)">Premium (export grade, organic certified)</MenuItem>
              <MenuItem value="Standard (fine rice for daily use)">Standard (fine rice for daily use)</MenuItem>
              <MenuItem value="Broken rice (budget-friendly)">Broken rice (budget-friendly)</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Weight (kgs)</InputLabel>
            <Select
              value={filters.weight}
              onChange={(e) => handleFilterChange('weight', e.target.value)}
              label="Weight (kgs)"
            >
              <MenuItem value="1 kg">1 kg</MenuItem>
              <MenuItem value="5 kg">5 kg</MenuItem>
              <MenuItem value="10 kg">10 kg</MenuItem>
              <MenuItem value="25 kg">25 kg</MenuItem>
              <MenuItem value="50 kg">50 kg</MenuItem>
            </Select>
          </FormControl>
          <Typography variant="body1" gutterBottom>Price Range</Typography>
          <Slider
            value={filters.priceRange}
            onChange={(e, newValue) => handleFilterChange('priceRange', newValue)}
            valueLabelDisplay="auto"
            min={0}
            max={5000}
            step={100}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Diet Preference</InputLabel>
            <Select
              multiple
              value={filters.dietPreference}
              onChange={(e) => handleFilterChange('dietPreference', e.target.value)}
              label="Diet Preference"
            >
              <MenuItem value="Diabetic-friendly (low GI rice)">Diabetic-friendly (low GI rice)</MenuItem>
              <MenuItem value="Gluten-free">Gluten-free</MenuItem>
              <MenuItem value="Organic certified">Organic certified</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Cooking Purpose</InputLabel>
            <Select
              multiple
              value={filters.cookingPurpose}
              onChange={(e) => handleFilterChange('cookingPurpose', e.target.value)}
              label="Cooking Purpose"
            >
              <MenuItem value="Biryani rice">Biryani rice</MenuItem>
              <MenuItem value="Daily use">Daily use</MenuItem>
              <MenuItem value="Idly/Dosa rice">Idly/Dosa rice</MenuItem>
              <MenuItem value="Sweet rice">Sweet rice</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Seller Location"
            value={filters.sellerLocation}
            onChange={(e) => handleFilterChange('sellerLocation', e.target.value)}
            variant="outlined"
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Delivery Options</InputLabel>
            <Select
              multiple
              value={filters.deliveryOptions}
              onChange={(e) => handleFilterChange('deliveryOptions', e.target.value)}
              label="Delivery Options"
            >
              <MenuItem value="Express delivery">Express delivery</MenuItem>
              <MenuItem value="Standard delivery">Standard delivery</MenuItem>
              <MenuItem value="Bulk order supply">Bulk order supply</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Ratings & Reviews</InputLabel>
            <Select
              value={filters.ratings}
              onChange={(e) => handleFilterChange('ratings', e.target.value)}
              label="Ratings & Reviews"
            >
              <MenuItem value={0}>All</MenuItem>
              <MenuItem value={4}>4★ & above</MenuItem>
              <MenuItem value={3}>3★ & above</MenuItem>
              <MenuItem value={2}>2★ & above</MenuItem>
              <MenuItem value={1}>1★ & above</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Discounts & Offers</InputLabel>
            <Select
              value={filters.discounts}
              onChange={(e) => handleFilterChange('discounts', e.target.value)}
              label="Discounts & Offers"
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="Under ₹500">Under ₹500</MenuItem>
              <MenuItem value="Buy 1 Get 1">Buy 1 Get 1</MenuItem>
              <MenuItem value="Festive offers">Festive offers</MenuItem>
            </Select>
          </FormControl>
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
          <Button
            variant="contained"
            fullWidth
            sx={{ mt: 3 }}
            onClick={handleApplyFilters}
          >
            Apply Filters
          </Button>
        </Box>
      </Drawer>

      {productLoading || filteredLoading ? (
        <Typography>Loading...</Typography>
      ) : productError || filteredError ? (
        <Alert severity="error">{productError || filteredError}</Alert>
      ) : (
        <Grid container spacing={3}>
          {displayedProducts.map((product) => {
            const hasOffer =
              typeof product.offerPrice === 'number' &&
              product.offerPrice > 0 &&
              product.offerPrice < product.price;
            const displayPrice = hasOffer ? product.offerPrice : product.price;
            const isImageLoading = imageLoading[product._id] || true;

            return (
              <Grid item xs={12} sm={6} md={4} key={product._id}>
                <Card
                  onClick={() => navigate(`/products/${product._id}`)}
                  sx={{
                    cursor: 'pointer',
                    transition: 'transform 0.3s',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
                    },
                  }}
                >
                  {isImageLoading ? (
                    <Skeleton variant="rectangular" height={140} />
                  ) : (
                    <CardMedia
                      component="img"
                      height="140"
                      image={product.images?.[0] || '/default-image.jpg'}
                      alt={product.name}
                      onLoad={() => handleImageLoad(product._id)}
                      onError={() => handleImageError(product._id)}
                      sx={{ objectFit: 'cover' }}
                    />
                  )}
                  <CardContent>
                    <Typography variant="h6" noWrap>
                      {product.name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, gap: 1 }}>
                      <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#2E7D32' }}>
                        ₹{(displayPrice || 0).toFixed(2)}
                      </Typography>
                      {hasOffer && (
                        <Typography
                          variant="body2"
                          sx={{ textDecoration: 'line-through', color: '#757575' }}
                        >
                          ₹{(product.price || 0).toFixed(2)}
                        </Typography>
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <StarIcon color="warning" fontSize="small" />
                      <Typography variant="body2" sx={{ ml: 0.5 }}>
                        {product.rating || 0} ({product.numReviews || 0})
                      </Typography>
                    </Box>
                  </CardContent>
                  <CardActions>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBuyNow(product._id);
                      }}
                      sx={{ backgroundColor: '#8BC34A', '&:hover': { backgroundColor: '#7CB342' } }}
                    >
                      Buy Now
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(product._id);
                      }}
                      sx={{ color: '#4CAF50', borderColor: '#4CAF50', '&:hover': { borderColor: '#45A049', color: '#45A049' } }}
                    >
                      Add to Cart
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToWishlist(product._id);
                      }}
                      sx={{ color: '#4CAF50', borderColor: '#4CAF50', '&:hover': { borderColor: '#45A049', color: '#45A049' } }}
                    >
                      Add to Wishlist
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Container>
  );
};

export default ProductFilter;