// [Premium Figma-level Redesign — Product Detail Page]
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
  Snackbar,
  Alert,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { ShoppingCart, FavoriteBorder, Remove, Add } from "@mui/icons-material";

// Redux Actions
import { listProductDetails } from "../../redux/actions/productActions";
import { addToCart } from "../../redux/actions/cartActions";
import { addToWishlist } from "../../redux/actions/userActions";
import { listRecipes } from "../../redux/actions/recipeActions";
import { listProducts } from "../../redux/actions/productActions";
import { listMyOrders } from "../../redux/actions/orderActions";

// Premium UI Components
import PriceDisplay from "../../components/ui/PriceDisplay";
import DiscountBadge from "../../components/ui/DiscountBadge";
import SellerBadge from "../../components/ui/SellerBadge";
import TrustBadge from "../../components/ui/TrustBadge";
import ProductCard from "../../components/ui/ProductCard";
import SectionHeader from "../../components/ui/SectionHeader";
import LoadingSkeleton from "../../components/ui/LoadingSkeleton";
import EmptyState from "../../components/ui/EmptyState";

// Common Components
import Loader from "../../components/common/Loader";
import Message from "../../components/common/Message";
import CommentSystem from "../../components/social/CommentSystem";
import RatingSystem from "../../components/social/RatingSystem";

// Theme
import { spacing, colors } from "../../theme/designTokens";

const BACKEND_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5001').replace('/api', '');
const getImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return BACKEND_URL + url;
};

const ProductPage = () => {
  const { id } = useParams();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [qty, setQty] = useState(1);
  const [cartSnackbar, setCartSnackbar] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);

  const productDetails = useSelector((state) => state.productDetails || {});
  const { loading, error, product = {} } = productDetails;
  
  const { userInfo } = useSelector((state) => state.userLogin || {});
  const { products: recommendedProducts = [] } = useSelector(s => s.productList || {}); 
  const { wishlistItems = [] } = useSelector(state => state.wishlist || {});

  useEffect(() => {
    dispatch(listProductDetails(id));
    dispatch(listProducts({ limit: 10 }));
  }, [dispatch, id]);

  useEffect(() => {
    if (userInfo) {
      dispatch(listMyOrders());
    }
  }, [dispatch, userInfo]); // ✅ Fixed missing dependency 'userInfo'

  useEffect(() => {
    if (product && product.riceType) {
      dispatch(listRecipes({ riceType: product.riceType }));
    }
  }, [dispatch, product?.riceType]);

  const addToCartHandler = async () => {
    try {
      await dispatch(addToCart(id, qty));
      setCartSnackbar(true);
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

  const increaseQty = () => setQty(prev => Math.min(prev + 1, product.countInStock || 1));
  const decreaseQty = () => setQty(prev => Math.max(prev - 1, 1));
  const isWishlisted = (productId) => wishlistItems.some(x => (x._id || x) === productId);

  if (loading) return <Loader />;
  if (error) return <Message variant="error">{error}</Message>;
  if (!product._id) return <EmptyState title="Product Not Found" description="The product you are looking for does not exist." />;

  const mainImageUrl = getImageUrl(product.images?.[selectedImage] || product.image || product.images?.[0]);
  const hasOffer = product.offerPrice && product.offerPrice < product.price;
  const discountPercentage = hasOffer ? Math.round(((product.price - product.offerPrice) / product.price) * 100) : 0;

  return (
    <Box sx={{ bgcolor: colors.surface.default, minHeight: '100vh', pb: 8 }}>
      <Container maxWidth="xl" sx={{ pt: 4 }}>
        
        {/* Breadcrumb or Back Button */}
        <Button onClick={() => navigate(-1)} sx={{ mb: 3, color: colors.neutral[500] }}>
          &larr; Back to Products
        </Button>

        <Grid container spacing={6}>
          {/* Left Column - Images */}
          <Grid item xs={12} md={5}>
            <Box sx={{ 
              position: 'relative', 
              bgcolor: colors.surface.paper, 
              borderRadius: 6, 
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
              mb: 2
            }}>
              {hasOffer && (
                <Box sx={{ position: 'absolute', top: 16, left: 16, zIndex: 10 }}>
                  <DiscountBadge discount={discountPercentage} />
                </Box>
              )}
              {mainImageUrl ? (
                <img 
                  src={mainImageUrl} 
                  alt={product.name} 
                  style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover' }} 
                />
              ) : (
                <Box sx={{ width: '100%', aspectRatio: '1/1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, bgcolor: colors.surface.default }}>
                  🌾
                </Box>
              )}
            </Box>
            
            {/* Thumbnails */}
            {product.images && product.images.length > 1 && (
              <Stack direction="row" spacing={2} sx={{ overflowX: 'auto', pb: 1 }}>
                {product.images.map((img, idx) => (
                  <Box 
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    sx={{ 
                      width: 80, height: 80, borderRadius: 3, cursor: 'pointer',
                      border: selectedImage === idx ? `2px solid ${colors.primary.main}` : '2px solid transparent',
                      overflow: 'hidden', opacity: selectedImage === idx ? 1 : 0.6,
                      transition: 'all 0.2s'
                    }}
                  >
                    <img src={getImageUrl(img)} alt={`Thumbnail ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </Box>
                ))}
              </Stack>
            )}
          </Grid>

          {/* Right Column - Product Info */}
          <Grid item xs={12} md={7}>
            <Box sx={{ bgcolor: colors.surface.paper, p: { xs: 3, md: 5 }, borderRadius: 6, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
              
              <Typography variant="h3" sx={{ fontWeight: 800, mb: 1, color: colors.neutral[900] }}>
                {product.name}
              </Typography>
              
              <Typography variant="body1" sx={{ color: colors.neutral[500], mb: 3 }}>
                {product.weight || 1} {product.unit || 'kg'} • {product.brand || 'Premium Brand'}
              </Typography>

              {/* Price & Rating */}
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 4 }}>
                <Box>
                  <PriceDisplay 
                    amount={hasOffer ? product.offerPrice : product.price} 
                    originalAmount={hasOffer ? product.price : null}
                    size="large"
                  />
                  <Typography variant="caption" sx={{ color: colors.success, fontWeight: 700, mt: 0.5, display: 'block' }}>
                    Inclusive of all taxes
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: colors.neutral[50], px: 2, py: 1, borderRadius: 99 }}>
                  <Typography sx={{ color: colors.accent.alt, fontSize: 18, mr: 1 }}>★</Typography>
                  <Typography sx={{ fontWeight: 700 }}>{product.rating || (Math.random()*1+4).toFixed(1)}</Typography>
                  <Typography sx={{ color: colors.neutral[500], ml: 1, fontSize: 13 }}>({product.numReviews || 0} reviews)</Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 4 }} />

              {/* Quantity & Actions */}
              <Box sx={{ mb: 5 }}>
                <Typography sx={{ fontWeight: 700, mb: 2 }}>Select Quantity</Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems={{ sm: 'center' }}>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', border: `1px solid ${colors.neutral[200]}`, borderRadius: 99, width: 'fit-content' }}>
                    <Button onClick={decreaseQty} disabled={qty <= 1} sx={{ minWidth: 48, borderRadius: '99px 0 0 99px', color: colors.neutral[700] }}><Remove /></Button>
                    <Typography sx={{ width: 40, textAlign: 'center', fontWeight: 700 }}>{qty}</Typography>
                    <Button onClick={increaseQty} disabled={qty >= product.countInStock} sx={{ minWidth: 48, borderRadius: '0 99px 99px 0', color: colors.neutral[700] }}><Add /></Button>
                  </Box>

                  {product.countInStock > 0 ? (
                    <Box sx={{ display: 'flex', gap: 2, flex: 1 }}>
                      <Button 
                        variant="contained" 
                        fullWidth 
                        startIcon={<ShoppingCart />}
                        onClick={addToCartHandler}
                        sx={{ bgcolor: colors.primary.main, '&:hover': { bgcolor: colors.primary.dark }, py: 1.5, borderRadius: 99, fontWeight: 700 }}
                      >
                        Add to Cart
                      </Button>
                      <Button 
                        variant="contained" 
                        fullWidth 
                        onClick={buyNowHandler}
                        sx={{ bgcolor: colors.accent.main, color: colors.neutral[900], '&:hover': { bgcolor: colors.accent.dark }, py: 1.5, borderRadius: 99, fontWeight: 700 }}
                      >
                        Buy Now
                      </Button>
                    </Box>
                  ) : (
                    <Typography color="error" sx={{ fontWeight: 700, fontSize: 18 }}>Out of Stock</Typography>
                  )}
                  
                  <Button 
                    variant="outlined" 
                    onClick={addToWishlistHandler}
                    sx={{ minWidth: 54, height: 54, borderRadius: '50%', borderColor: colors.neutral[200], color: isWishlisted(product._id) ? colors.error : colors.neutral[500] }}
                  >
                    <FavoriteBorder />
                  </Button>
                </Stack>
              </Box>

              {/* Trust Badges */}
              <Box sx={{ mb: 4 }}>
                <TrustBadge items={[
                  { icon: '🛡️', title: 'Quality Assured', subtitle: '100% Genuine' },
                  { icon: '🚚', title: 'Free Delivery', subtitle: 'On orders above ₹500' },
                  { icon: '↩️', title: 'Easy Returns', subtitle: 'No questions asked' },
                ]} />
              </Box>

              {/* Seller Info */}
              {product.seller && (
                <Box sx={{ mb: 4 }}>
                  <SellerBadge 
                    sellerName={product.seller.name || 'Rice Mill Partner'}
                    rating={4.8}
                    verified={true}
                  />
                </Box>
              )}

              {/* Description */}
              <Box>
                <Typography sx={{ fontWeight: 700, mb: 1.5, fontSize: 18 }}>Product Details</Typography>
                <Typography sx={{ color: colors.neutral[700], lineHeight: 1.7 }}>
                  {product.description || 'Premium quality rice sourced directly from verified farmers. Carefully processed and aged to perfection to ensure the best taste, aroma, and nutritional value for your daily meals.'}
                </Typography>
              </Box>

            </Box>
          </Grid>
        </Grid>

        {/* ── RECOMMENDED PRODUCTS ── */}
        {recommendedProducts.length > 0 && (
          <Box sx={{ mt: spacing.section, mb: spacing.section }}>
            <SectionHeader title="Frequently Bought Together" />
            <Box sx={{ display: 'flex', gap: 3, overflowX: 'auto', pb: 2, '&::-webkit-scrollbar': { display: 'none' } }}>
              {recommendedProducts.filter(p => p._id !== id).slice(0, 5).map(prod => {
                const pOffer = prod.offerPrice && prod.offerPrice < prod.price;
                return (
                  <Box key={prod._id} sx={{ minWidth: 260, flexShrink: 0 }}>
                    <ProductCard
                      product={{
                        _id: prod._id,
                        name: prod.name,
                        image: getImageUrl(prod.images?.[0]),
                        price: pOffer ? prod.offerPrice : prod.price,
                        mrp: pOffer ? prod.price : null,
                        discount: pOffer ? Math.round(((prod.price - prod.offerPrice) / prod.price) * 100) : 0,
                        rating: Number(prod.rating || 4.5),
                        countInStock: prod.countInStock
                      }}
                      wishlisted={isWishlisted(prod._id)}
                      onAddToCart={() => dispatch(addToCart(prod._id, 1))}
                      onToggleWishlist={() => dispatch(addToWishlist(prod._id))}
                      onClick={() => navigate(`/products/${prod._id}`)}
                    />
                  </Box>
                );
              })}
            </Box>
          </Box>
        )}

        {/* ── RATINGS & REVIEWS ── */}
        <Box sx={{ mt: spacing.section, mb: spacing.section }}>
          <SectionHeader title="Ratings & Reviews" />
          <RatingSystem productId={id} />
          <Box sx={{ mt: 4 }}>
            <CommentSystem productId={id} />
          </Box>
        </Box>

      </Container>

      <Snackbar open={cartSnackbar} autoHideDuration={3000} onClose={() => setCartSnackbar(false)}>
        <Alert onClose={() => setCartSnackbar(false)} severity="success" sx={{ width: '100%', borderRadius: 3, fontWeight: 600 }}>
          {t('addedToCart')}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProductPage;
