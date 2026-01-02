import React, { useState } from 'react';
import {
  AppBar, Toolbar, Typography, IconButton, Badge, Menu, MenuItem,
  InputBase, Box, Avatar, useTheme, useMediaQuery
} from '@mui/material';
import {
  Search as SearchIcon,
  ShoppingCart,
  Favorite,
  Notifications,
  AccountCircle,
  Menu as MenuIcon,
  Logout,
  Settings,
  Person,
  Home,
  LocalShipping,
  Book,
  Forum as ForumIcon
} from '@mui/icons-material';
import { styled, alpha } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../../redux/actions/userActions';
import { listFilteredProducts } from '../../redux/actions/productActions';

const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(3),
    width: 'auto',
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: '40ch',
    },
  },
}));

const Header = ({ onSearch }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [anchorEl, setAnchorEl] = useState(null);
  const [keyword, setKeyword] = useState('');

  const { cartItems } = useSelector(state => state.cart || {});
  const { wishlistItems } = useSelector(state => state.userWishlist || {});
  const { userInfo } = useSelector((state) => state.userLogin || {});
  const cartCount = cartItems?.length || 0;
  const wishlistCount = wishlistItems?.length || 0;

  const handleProfileMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleSearch = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(keyword);
    } else {
      dispatch(listFilteredProducts({ search: keyword }));
      navigate('/customer/dashboard'); // Ensure we are on dashboard
    }
  };

  const handleLogout = () => {
    dispatch(logoutUser());
    handleMenuClose();
    navigate('/login');
  };

  return (
    <AppBar position="sticky" sx={{ background: 'linear-gradient(45deg, #2E7D32 30%, #4CAF50 90%)' }}>
      <Toolbar>
        <Typography
          variant="h6"
          noWrap
          component="div"
          sx={{ display: { xs: 'none', sm: 'block' }, cursor: 'pointer', fontWeight: 'bold' }}
          onClick={() => navigate('/customer/dashboard')}
        >
          RiceMill Express
        </Typography>

        <Search>
          <SearchIconWrapper>
            <SearchIcon />
          </SearchIconWrapper>
          <form onSubmit={handleSearch}>
            <StyledInputBase
              placeholder="Search products..."
              inputProps={{ 'aria-label': 'search' }}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </form>
        </Search>

        <Box sx={{ flexGrow: 1 }} />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton color="inherit" onClick={() => navigate('/customer/dashboard')} title="Home">
            <Home />
          </IconButton>
          <IconButton color="inherit" onClick={() => navigate('/settings/order-history')} title="My Orders">
            <LocalShipping />
          </IconButton>
          <IconButton color="inherit" onClick={() => navigate('/recipes')} title="Recipes">
            <Book />
          </IconButton>
          <IconButton color="inherit" onClick={() => navigate('/forum')} title="Forum">
            <ForumIcon />
          </IconButton>

          <IconButton color="inherit" onClick={() => navigate('/cart')}>
            <Badge badgeContent={cartCount} color="error">
              <ShoppingCart />
            </Badge>
          </IconButton>
          <IconButton color="inherit" onClick={() => navigate('/wishlist')}>
            <Badge badgeContent={wishlistCount} color="error">
              <Favorite />
            </Badge>
          </IconButton>
          <IconButton color="inherit" onClick={() => navigate('/notifications')}>
            <Badge badgeContent={0} color="error"> {/* Connect to notification count later */}
              <Notifications />
            </Badge>
          </IconButton>

          <IconButton
            edge="end"
            aria-controls="primary-search-account-menu"
            aria-haspopup="true"
            onClick={handleProfileMenuOpen}
            color="inherit"
          >
            {userInfo?.profileImage ? (
              <Avatar src={userInfo.profileImage} sx={{ width: 32, height: 32 }} />
            ) : (
              <AccountCircle />
            )}
          </IconButton>
        </Box>

        <Menu
          anchorEl={anchorEl}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          keepMounted
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => { handleMenuClose(); navigate('/settings/profile'); }}>
            <Person sx={{ mr: 1 }} /> Profile
          </MenuItem>
          <MenuItem onClick={() => { handleMenuClose(); navigate('/settings'); }}>
            <Settings sx={{ mr: 1 }} /> Settings
          </MenuItem>
          <MenuItem onClick={handleLogout}>
            <Logout sx={{ mr: 1 }} /> Logout
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
