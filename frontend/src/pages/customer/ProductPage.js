import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Grid,
  Box,
  Typography,
  Button,
  Divider,
  Stack,
  Paper,
  useMediaQuery,
  Chip,
  IconButton,
  Badge,
  CircularProgress,
  Alert
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { 
  ArrowBack, Share, FavoriteBorder, Favorite, 
  KeyboardArrowDown, Home, ListAlt, ShoppingCart, ShoppingBag, Person,
  Star
} from "@mui/icons-material";

// Redux Actions
import { listProductDetails } from "../../redux/actions/productActions";
import { addToCart } from "../../redux/actions/cartActions";
import { addToWishlist } from "../../redux/actions/userActions";
import { listProducts } from "../../redux/actions/productActions";
import { listMyCart } from "../../redux/actions/cartActions";

// Utils
import { getImageUrl } from "../../utils/urlHelper";

// Theme
import { colors, radius, shadows, tints } from "../../theme/designTokens";

// UI Components
import EmptyState from "../../components/ui/EmptyState";
import SocialInteraction from "../../components/common/SocialInteraction";
import ProductCard from "../../components/ui/ProductCard";

const ProductPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [qty, setQty] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  const productDetails = useSelector((state) => state.productDetails || {});
  const { loading, error, product = {} } = productDetails;
  
  const productList = useSelector((state) => state.productList || {});
  const { products: allProducts = [] } = productList;

  const { userInfo } = useSelector((state) => state.userLogin || {});
  const { wishlistItems = [] } = useSelector(state => state.wishlist || {});
  const { cartItems = [] } = useSelector(state => state.cart || {});

  useEffect(() => {
    dispatch(listProductDetails(id));
    dispatch(listProducts({ limit: 10 }));
    dispatch(listMyCart());
  }, [dispatch, id]);

  useEffect(() => {
    // Track recently viewed
    if (product && product._id) {
        const viewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
        const updated = [product, ...viewed.filter(p => p._id !== product._id)].slice(0, 10);
        localStorage.setItem('recentlyViewed', JSON.stringify(updated));
    }
  }, [product]);

  const addToCartHandler = async () => {
    try {
      await dispatch(addToCart(id, qty));
      alert('✅ Item added to cart!');
    } catch (err) {
      alert(err.message || 'Failed to add to cart');
    }
  };

  const buyNowHandler = async () => {
    try {
      await dispatch(addToCart(id, qty));
      navigate('/checkout');
    } catch (err) {
      alert(err.message || 'Failed to proceed');
    }
  };

  const addToWishlistHandler = async () => {
    if (!userInfo) { navigate('/login'); return; }
    try {
      await dispatch(addToWishlist(id));
    } catch (err) {
      alert(err.message || "Failed to add to wishlist");
    }
  };

  const increaseQty = () => setQty(prev => Math.min(prev + 1, product.countInStock || 10));
  const decreaseQty = () => setQty(prev => Math.max(prev - 1, 1));
  const isWishlisted = (productId) => wishlistItems.some(x => (x._id || x) === productId);

  if (loading) return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
      <CircularProgress sx={{ color: '#2E7D32' }} />
    </Box>
  );
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!product._id) return <EmptyState title="Product Not Found" description="The product you are looking for does not exist." />;

  const mainImageUrl = getImageUrl(product.images?.[selectedImage] || product.image || product.images?.[0]);
  const hasOffer = product.offerPrice && product.offerPrice < product.price;
  const displayPrice = hasOffer ? product.offerPrice : product.price;
  const originalPrice = hasOffer ? product.price : null;
  const discountPercentage = hasOffer ? Math.round(((product.price - product.offerPrice) / product.price) * 100) : 22; // default mock as page 2

  const relatedProducts = allProducts.filter(p => p._id !== id).slice(0, 6);

  return (
    <Box sx={{ bgcolor: '#FFFDF9', minHeight: '100vh', pb: { xs: 12, md: 8 } }}>
      
      {/* ── HEADER BANNER FLOW ── */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', px: 2, py: 1.5, borderBottom: '1px solid #F3F4F6', bgcolor: '#fff' }}>
        <IconButton onClick={() => navigate('/customer/dashboard')} sx={{ mr: 1 }}><ArrowBack /></IconButton>
        <Typography variant="subtitle1" fontWeight={800} color="#1F2937">Product Details</Typography>
      </Box>

      {/* ── DESKTOP HEADER BANNER ── */}
      <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', px: 6, py: 2, bgcolor: '#fff', mb: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)} sx={{ color: '#4B5563', textTransform: 'none', fontWeight: 700 }}>
          Back to Shopping
        </Button>
      </Box>

      <Container maxWidth={false} sx={{ px: { xs: 2, md: 6 }, pt: 2 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={5}>
        <Box sx={{ position: 'relative', bgcolor: '#fff', borderRadius: '16px', border: '1px solid #F3F4F6', overflow: 'hidden', p: 1, mb: 2 }}>
          {/* Float Action buttons */}
          <IconButton 
            onClick={() => navigate(-1)} 
            sx={{ position: 'absolute', top: 12, left: 12, bgcolor: '#fff', '&:hover': { bgcolor: '#F3F4F6' }, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
          >
            <ArrowBack sx={{ color: '#2E7D32' }} />
          </IconButton>

          <Stack direction="row" spacing={1} sx={{ position: 'absolute', top: 12, right: 12 }}>
            <IconButton sx={{ bgcolor: '#fff', '&:hover': { bgcolor: '#F3F4F6' }, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <Share sx={{ color: '#2E7D32', fontSize: 20 }} />
            </IconButton>
            <IconButton 
              onClick={addToWishlistHandler}
              sx={{ bgcolor: '#fff', '&:hover': { bgcolor: '#F3F4F6' }, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
            >
              {isWishlisted(product._id) ? (
                <Favorite sx={{ color: '#DC2626', fontSize: 20 }} />
              ) : (
                <FavoriteBorder sx={{ color: '#2E7D32', fontSize: 20 }} />
              )}
            </IconButton>
          </Stack>

          {mainImageUrl ? (
            <img
              src={mainImageUrl}
              alt={product.name}
              style={{ width: '100%', aspectRatio: '1.2/1', objectFit: 'cover', borderRadius: '12px' }}
            />
          ) : (
            <Box sx={{ width: '100%', aspectRatio: '1.2/1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 72, bgcolor: '#F0FDF4' }}>
              🌾
            </Box>
          )}
        </Box>

        {/* Thumbnail strips */}
        {product.images && product.images.length > 1 && (
          <Stack direction="row" spacing={1.5} sx={{ overflowX: 'auto', pb: 2, '&::-webkit-scrollbar': { display: 'none' } }}>
            {product.images.map((img, idx) => (
              <Box
                key={idx}
                onClick={() => setSelectedImage(idx)}
                sx={{
                  width: 60, height: 60, borderRadius: '8px', cursor: 'pointer',
                  border: selectedImage === idx ? '2px solid #2E7D32' : '1px solid #E5E7EB',
                  overflow: 'hidden', opacity: selectedImage === idx ? 1 : 0.65
                }}
              >
                <img src={getImageUrl(img)} alt={`Thumb ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </Box>
            ))}
          </Stack>
        )}

          </Grid>

          {/* ── RIGHT COLUMN: DETAILS ── */}
          <Grid item xs={12} md={7}>
            <Box sx={{ mt: { xs: 1, md: 0 }, bgcolor: { md: '#fff' }, p: { md: 4 }, borderRadius: { md: '20px' }, boxShadow: { md: '0 4px 20px rgba(0,0,0,0.03)' }, border: { md: '1px solid #F3F4F6' } }}>
              <Chip
            label={product.category || "Sona Masoori"}
            size="small"
            sx={{ bgcolor: '#F0FDF4', color: '#2E7D32', fontWeight: 800, borderRadius: '6px', mb: 1 }}
          />

          <Typography variant="h5" sx={{ fontWeight: 800, color: '#1F2937', mb: 0.5, lineHeight: 1.25 }}>
            {product.name || 'Aarav Basmati Premium 5kg Bag'}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
              {[...Array(4)].map((_, i) => <Star key={i} sx={{ fontSize: 16, color: '#F59E0B' }} />)}
              <Star sx={{ fontSize: 16, color: '#D1D5DB' }} />
            </Box>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#4B5563' }}>
              (12k reviews)
            </Typography>
            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#1F2937' }}>
              1.2k sold this month
            </Typography>
          </Box>

          {/* Pricing Box */}
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, mb: 2.5 }}>
            <Typography variant="h4" sx={{ fontWeight: 900, color: '#2E7D32' }}>
              ₹{displayPrice}
            </Typography>
            {originalPrice && (
              <Typography sx={{ fontSize: '1rem', color: '#9CA3AF', textDecoration: 'line-through', fontWeight: 600 }}>
                ₹{originalPrice}
              </Typography>
            )}
            <Chip 
              label={`${discountPercentage}% OFF`} 
              size="small" 
              sx={{ bgcolor: '#FFF7ED', color: '#E65100', fontWeight: 800, fontSize: '0.75rem' }} 
            />
          </Box>
          <Typography variant="caption" sx={{ color: '#6B7280', display: 'block', mt: -1.5, mb: 3, fontWeight: 600 }}>
            MRP inclusive of all taxes
          </Typography>

          {/* Stock Alert */}
          {product.countInStock <= 5 && product.countInStock > 0 && (
            <Typography variant="body2" color="error" sx={{ fontWeight: 800, mb: 2.5 }}>
              ⚠️ Only {product.countInStock} left!
            </Typography>
          )}

          {/* Quantity selector */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, gap: 2 }}>
            <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', color: '#4B5563' }}>Quantity:</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', border: '1.5px solid #E5E7EB', borderRadius: '8px', bgcolor: '#fff', overflow: 'hidden' }}>
              <Button size="small" onClick={decreaseQty} sx={{ minWidth: 36, color: '#1F2937', fontWeight: 800 }}>-</Button>
              <Typography sx={{ px: 2, fontWeight: 800, color: '#1F2937' }}>{qty}</Typography>
              <Button size="small" onClick={increaseQty} sx={{ minWidth: 36, color: '#1F2937', fontWeight: 800 }}>+</Button>
            </Box>
          </Box>

          {/* Specifications list (dropdown mocks as Image 2) */}
          <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>Specifications</Typography>
          
          <Box sx={{ bgcolor: '#fff', borderRadius: '12px', border: '1px solid #F3F4F6', p: 1.5, mb: 3.5 }}>
            {[
              { label: "Origin", val: "Tamil Nadu" },
              { label: "Weight", val: product.weight ? `${product.weight} ${product.unit || 'kg'}` : "5kg bag" },
              { label: "Shelf life", val: "12 months" },
              { label: "Certification", val: "FSSAI Certified", icon: true }
            ].map((spec, i) => (
              <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.2, borderBottom: i < 3 ? '1px solid #F3F4F6' : 'none' }}>
                <Typography variant="body2" sx={{ color: '#4B5563', fontWeight: 600 }}>{spec.label}</Typography>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <Typography variant="body2" fontWeight={800} color="#1F2937">{spec.val}</Typography>
                  {!spec.icon && <KeyboardArrowDown sx={{ fontSize: 16, color: '#9CA3AF' }} />}
                  {spec.icon && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, ml: 0.5 }}>
                      <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#16A34A' }} />
                    </Box>
                  )}
                </Box>
              </Box>
            ))}
          </Box>

          {/* Delivery section details */}
          <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>Delivery Details</Typography>
          
          <Box sx={{ bgcolor: '#fff', borderRadius: '12px', border: '1px solid #F3F4F6', p: 2, mb: 4, display: 'flex', flexDirection: 'column', gap: 1.5, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <Box display="flex" alignItems="center" gap={1.5}>
              <Typography fontSize={18}>📍</Typography>
              <Typography variant="body2" fontWeight={700} color="#1F2937">Tomorrow, 7PM</Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={1.5}>
              <Typography fontSize={18}>🚚</Typography>
              <Typography variant="body2" fontWeight={700} color="#1F2937">Free delivery &gt; ₹500</Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={1.5}>
              <Typography fontSize={18}>🔄</Typography>
              <Typography variant="body2" fontWeight={700} color="#1F2937">10-day return policy</Typography>
            </Box>
          </Box>

              {/* Desktop Action Buttons (Hidden on mobile) */}
              <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 2, mt: 4, mb: 2 }}>
                <Button 
                  variant="outlined" 
                  onClick={addToCartHandler}
                  sx={{ 
                    flex: 1, height: 56, borderColor: '#2E7D32', color: '#2E7D32', borderWidth: 2,
                    borderRadius: '16px', fontWeight: 800, fontSize: '1.1rem', textTransform: 'none',
                    '&:hover': { borderColor: '#1B5E20', borderWidth: 2, bgcolor: '#F0FDF4' }
                  }}
                >
                  Add to Cart
                </Button>
                <Button 
                  variant="contained" 
                  onClick={buyNowHandler}
                  sx={{ 
                    flex: 1, height: 56, bgcolor: '#2E7D32', color: '#fff',
                    borderRadius: '16px', fontWeight: 800, fontSize: '1.1rem', textTransform: 'none',
                    boxShadow: '0 8px 24px rgba(46, 125, 50, 0.25)',
                    '&:hover': { bgcolor: '#1B5E20' }
                  }}
                >
                  Buy Now
                </Button>
              </Box>
            </Box>
          </Grid>
        </Grid>

        {/* ── FULL WIDTH BOTTOM SECTION ── */}
        <Box sx={{ mt: 6 }}>
          {/* Social Interactions */}
          <Box sx={{ mb: 6, p: { xs: 2, md: 4 }, borderRadius: '20px', bgcolor: '#fff', boxShadow: '0 8px 30px rgba(0,0,0,0.04)', border: '1px solid #F3F4F6' }}>
             <Typography variant="h5" fontWeight={800} color="#1F2937" mb={2}>Community Discussion</Typography>
             <Divider sx={{ mb: 3 }} />
             <SocialInteraction itemType="products" itemId={product._id} itemUserId={product.seller} />
          </Box>

          {/* Related Products Grid */}
          <Box sx={{ mb: 8 }}>
            <Typography variant="h4" fontWeight={800} color="#1F2937" mb={4}>Related Products</Typography>
            <Grid container spacing={3}>
              {relatedProducts.map(rp => (
                <Grid item xs={6} sm={4} md={2} key={rp._id}>
                  <ProductCard 
                    product={rp}
                    layout="vertical"
                    wishlisted={isWishlisted(rp._id)}
                    onClick={() => navigate(`/products/${rp._id}`)}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        </Box>
      </Container>

      {/* ── MOBILE ACTION BAR BUTTONS (Hidden on Desktop) ── */}
      <Box sx={{ 
        display: { xs: 'flex', md: 'none' },
        position: 'fixed', bottom: 64, left: 0, right: 0, zIndex: 999,
        bgcolor: '#fff', p: 2, gap: 2, borderTop: '1px solid #E5E7EB'
      }}>
        <Button 
          variant="outlined" 
          onClick={addToCartHandler}
          sx={{ 
            flex: 1, height: 48, borderColor: '#2E7D32', color: '#2E7D32', 
            borderRadius: '24px', fontWeight: 800, textTransform: 'none',
            '&:hover': { borderColor: '#1B5E20', bgcolor: '#F0FDF4' }
          }}
        >
          Add to Cart
        </Button>
        <Button 
          variant="contained" 
          onClick={buyNowHandler}
          sx={{ 
            flex: 1, height: 48, bgcolor: '#2E7D32', color: '#fff',
            borderRadius: '24px', fontWeight: 800, textTransform: 'none',
            '&:hover': { bgcolor: '#1B5E20' }
          }}
        >
          Buy Now
        </Button>
      </Box>

      {/* ── MOBILE STICKY BOTTOM NAVIGATION BAR (Hidden on Desktop) ── */}
      <Paper 
        elevation={10} 
        sx={{ 
          display: { xs: 'flex', md: 'none' },
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000,
          height: 64, borderTop: '1px solid #E5E7EB', 
          justifyContent: 'space-around', alignItems: 'center', bgcolor: '#fff'
        }}
      >
        <IconButton onClick={() => navigate('/customer/dashboard')} sx={{ display: 'flex', flexDirection: 'column', color: '#9CA3AF', py: 0.5 }}>
          <Home sx={{ fontSize: 24 }} />
          <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, mt: 0.25 }}>Home</Typography>
        </IconButton>

        <IconButton onClick={() => navigate('/products')} sx={{ display: 'flex', flexDirection: 'column', color: '#9CA3AF', py: 0.5 }}>
          <ListAlt sx={{ fontSize: 24 }} />
          <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, mt: 0.25 }}>Categories</Typography>
        </IconButton>

        <IconButton onClick={() => navigate('/cart')} sx={{ display: 'flex', flexDirection: 'column', color: '#9CA3AF', py: 0.5, position: 'relative' }}>
          <Badge badgeContent={cartItems.length || 3} color="error" sx={{ '& .MuiBadge-badge': { bgcolor: '#E65100', color: '#fff', fontWeight: 800 } }}>
            <ShoppingCart sx={{ fontSize: 24 }} />
          </Badge>
          <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, mt: 0.25 }}>Cart</Typography>
        </IconButton>

        <IconButton onClick={() => navigate('/settings/order-history')} sx={{ display: 'flex', flexDirection: 'column', color: '#9CA3AF', py: 0.5 }}>
          <ShoppingBag sx={{ fontSize: 24 }} />
          <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, mt: 0.25 }}>Orders</Typography>
        </IconButton>

        <IconButton onClick={() => navigate('/settings/profile')} sx={{ display: 'flex', flexDirection: 'column', color: '#9CA3AF', py: 0.5 }}>
          <Person sx={{ fontSize: 24 }} />
          <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, mt: 0.25 }}>Profile</Typography>
        </IconButton>
      </Paper>
    </Box>
  );
};

export default ProductPage;
