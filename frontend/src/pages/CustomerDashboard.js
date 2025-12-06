// src/pages/CustomerDashboard.js
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  Tabs,
  Tab,
  IconButton,
  Badge,
  TextField,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  ShoppingCart,
  Favorite,
  Notifications,
  Person,
  Home,
  LocalShipping,
  Book,
  Forum as ForumIcon,
  RateReview,
  Settings,
  Logout,
  FilterList as FilterListIcon,
} from '@mui/icons-material';

import { useDispatch, useSelector } from 'react-redux';
import {
  listProducts,
  listFilteredProducts,
} from '../redux/actions/productActions';
import { addToCart, listMyCart } from '../redux/actions/cartActions';
import { listMyOrders } from '../redux/actions/orderActions';
import { getWishlist, addToWishlist } from '../redux/actions/userActions';

import riceFieldBg from '../assets/rice-field-bg.jpg';
import { OrderTrackingSocket } from '../utils/socket';

import ChatWindow from '../components/common/ChatWindow';
import Dashboard from '../components/customer/Dashboard';
import MyOrders from '../components/customer/MyOrders';
import Wishlist from '../components/customer/Wishlist';
import Reviews from '../components/customer/Reviews';
import Recipes from '../components/customer/Recipes';
import Forum from '../components/common/Forum';

const CustomerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [tabValue, setTabValue] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);
  const [loadingBuy, setLoadingBuy] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    priceRange: [0, 5000],
    ratings: 0,
    category: '',
    type: '',
    quality: '',
    weight: '',
    dietPreference: [],
    cookingPurpose: [],
    sellerLocation: '',
    deliveryOptions: [],
    discounts: '',
    stockAvailability: '',
  });

  const [chatOpen, setChatOpen] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState(null);

  // === SAFE REDUX STATE EXTRACTION ===
  const productListState = useSelector((state) => state.productList || {});
  const productFilterState = useSelector((state) => state.productFilter || {});
  const cartState = useSelector((state) => state.cart || {});
  const orderState = useSelector((state) => state.orderListMy || {});
  const wishlistState = useSelector((state) => state.userWishlist || {});

  // Normalize products — always arrays
  const baseProducts = Array.isArray(productListState.products)
    ? productListState.products
    : productListState.products?.products || [];

  const filteredProductsRaw = productFilterState.filteredProducts || [];
  const filteredProducts = Array.isArray(filteredProductsRaw)
    ? filteredProductsRaw
    : [];

  const { cartItems = [] } = cartState;
  const { orders = [] } = orderState;
  const { wishlistItems = [] } = wishlistState;

  const loading = productListState.loading || productFilterState.loading;

  // === SMART PRODUCT DISPLAY (Filtered + Fallback) ===
  const displayedProducts = useMemo(() => {
    const hasActiveFilter =
      searchQuery.trim() ||
      filters.priceRange[1] < 5000 ||
      filters.ratings > 0 ||
      Object.values(filters).some((v) => Array.isArray(v) ? v.length > 0 : v);

    if (!hasActiveFilter || filteredProducts.length === 0) {
      return baseProducts;
    }

    // Remove duplicates (filtered results take priority)
    const seen = new Set(filteredProducts.map((p) => p._id));
    const extras = baseProducts.filter((p) => !seen.has(p._id));
    return [...filteredProducts, ...extras];
  }, [baseProducts, filteredProducts, searchQuery, filters]);

  // === INITIAL DATA FETCH ===
  const initFetched = useRef(false);
  useEffect(() => {
    if (initFetched.current) return;
    initFetched.current = true;

    dispatch(listProducts());
    dispatch(listMyOrders());
    dispatch(getWishlist());
    dispatch(listMyCart());
  }, [dispatch]);

  // === REAL-TIME ORDER TRACKING ===
  const socketRef = useRef(null);
  useEffect(() => {
    if (!user?._id) return;

    socketRef.current = new OrderTrackingSocket(user._id, user.role, (msg) => {
      if (msg.type === 'ORDER_UPDATE') {
        dispatch(listMyOrders());
        setNotificationCount((c) => c + 1);
      }
    });

    return () => socketRef.current?.disconnect();
  }, [user, dispatch]);

  useEffect(() => {
    if (socketRef.current && orders.length > 0) {
      orders.forEach((o) => socketRef.current.joinOrderRoom(o._id));
    }
  }, [orders]);

  // === FILTERING (Debounced) ===
  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(
        listFilteredProducts({
          ...filters,
          search: searchQuery.trim(),
          priceMin: filters.priceRange[0],
          priceMax: filters.priceRange[1],
        })
      );
    }, 600);

    return () => clearTimeout(timer);
  }, [searchQuery, filters, dispatch]);

  // === HANDLERS ===
  const handleTabChange = (e, newValue) => {
    if (newValue === 4) navigate('/settings/profile');
    else if (newValue === 5) navigate('/settings');
    else setTabValue(newValue);
  };

  const handleBuyNow = async (productId) => {
    setLoadingBuy(true);
    try {
      await dispatch(addToCart(productId, 1));
      navigate('/checkout');
    } catch (err) {
      alert('Buy Now failed');
    } finally {
      setLoadingBuy(false);
    }
  };

  return (
    <Box
      sx={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.92), rgba(255,255,255,0.8)), url(${riceFieldBg})`,
        backgroundSize: 'cover',
        backgroundAttachment: 'fixed',
        minHeight: '100vh',
        pb: 8,
      }}
    >
      <Container maxWidth="xl">
        {/* === HEADER === */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 3 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 'bold',
              background: 'linear-gradient(45deg, #4CAF50 30%, #8BC34A 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            RiceMill Express
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <IconButton onClick={() => navigate('/cart')}>
              <Badge badgeContent={cartItems.length} color="error">
                <ShoppingCart />
              </Badge>
            </IconButton>
            <IconButton onClick={() => navigate('/wishlist')}>
              <Badge badgeContent={wishlistItems.length} color="error">
                <Favorite />
              </Badge>
            </IconButton>
            <IconButton onClick={() => navigate('/notifications')}>
              <Badge badgeContent={notificationCount} color="error">
                <Notifications />
              </Badge>
            </IconButton>
            <IconButton onClick={() => setTabValue(4)}>
              <Person />
            </IconButton>
            <IconButton onClick={() => navigate('/settings/logout')}>
              <Logout />
            </IconButton>
          </Box>
        </Box>

        {/* === SEARCH BAR === */}
        <Box sx={{ mt: 2, mb: 4, display: 'flex', gap: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search products, sellers, cities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && dispatch(listFilteredProducts({ search: searchQuery }))}
          />
          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={20} /> : <FilterListIcon />}
            onClick={() => dispatch(listFilteredProducts({ ...filters, search: searchQuery }))}
          >
            Filter
          </Button>
        </Box>

        {loading && (
          <Box sx={{ textAlign: 'center', my: 5 }}>
            <CircularProgress />
          </Box>
        )}

        {/* === MAIN LAYOUT === */}
        <Box sx={{ display: 'flex', gap: 4 }}>
          {/* Sidebar */}
          <Paper elevation={4} sx={{ width: 270, p: 3, borderRadius: 3, bgcolor: '#fafafa' }}>
            <Tabs
              orientation="vertical"
              value={tabValue}
              onChange={handleTabChange}
              sx={{ borderRight: 1, borderColor: 'divider' }}
            >
              <Tab label="Dashboard" icon={<Home />} iconPosition="start" />
              <Tab label="My Orders" icon={<LocalShipping />} iconPosition="start" />
              <Tab label="Wishlist" icon={<Favorite />} iconPosition="start" />
              <Tab label="Reviews" icon={<RateReview />} iconPosition="start" />
              <Tab label="Profile" icon={<Person />} iconPosition="start" />
              <Tab label="Settings" icon={<Settings />} iconPosition="start" />
              <Tab label="Recipes" icon={<Book />} iconPosition="start" />
              <Tab label="Forum" icon={<ForumIcon />} iconPosition="start" />
            </Tabs>
          </Paper>

          {/* Content Area */}
          <Box sx={{ flex: 1 }}>
            {tabValue === 0 && (
              <Dashboard
                products={displayedProducts}
                loadingBuy={loadingBuy}
                handleAddToCart={(id) => dispatch(addToCart(id, 1))}
                handleAddToWishlist={(id) => dispatch(addToWishlist(id))}
                handleBuyNow={handleBuyNow}
                setSelectedSeller={setSelectedSeller}
                setChatOpen={setChatOpen}
              />
            )}
            {tabValue === 1 && <MyOrders setSelectedSeller={setSelectedSeller} setChatOpen={setChatOpen} />}
            {tabValue === 2 && (
              <Wishlist
                handleAddToCart={(id) => dispatch(addToCart(id, 1))}
                handleRemoveFromWishlist={(id) => dispatch(addToWishlist(id, true))}
                handleBuyNow={handleBuyNow}
                setSelectedSeller={setSelectedSeller}
                setChatOpen={setChatOpen}
              />
            )}
            {tabValue === 3 && <Reviews />}
            {tabValue === 6 && <Recipes />}
            {tabValue === 7 && <Forum />}
          </Box>
        </Box>
      </Container>

      {/* Chat Window */}
      {chatOpen && selectedSeller && (
        <ChatWindow receiverId={selectedSeller} onClose={() => setChatOpen(false)} />
      )}
    </Box>
  );
};

export default CustomerDashboard;