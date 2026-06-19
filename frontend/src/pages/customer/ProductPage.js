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
  Paper,
  useMediaQuery,
  Chip,
  IconButton,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { ShoppingCart, FavoriteBorder, Remove, Add, Verified, LocalShipping, Replay, ChevronRight } from "@mui/icons-material";

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
import ProductCard from "../../components/ui/ProductCard";
import SectionHeader from "../../components/ui/SectionHeader";
import LoadingSkeleton from "../../components/ui/LoadingSkeleton";
import EmptyState from "../../components/ui/EmptyState";

// Common Components
import Message from "../../components/common/Message";
import CommentSystem from "../../components/social/CommentSystem";
import RatingSystem from "../../components/social/RatingSystem";

// Utils
import { getImageUrl } from "../../utils/urlHelper";

// Theme
import { spacing, colors, radius, shadows, zIndex, tints } from "../../theme/designTokens";

const ProductPage = () => {
  const { id } = useParams();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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
  }, [dispatch, userInfo]);

  useEffect(() => {
    if (product && product.riceType) {
      dispatch(listRecipes({ riceType: product.riceType }));
    }
    // Track recently viewed
    if (product && product._id) {
        const viewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
        const updated = [product, ...viewed.filter(p => p._id !== product._id)].slice(0, 10);
        localStorage.setItem('recentlyViewed', JSON.stringify(updated));
    }
  }, [dispatch, product]);

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

  if (loading) return (
    <Container maxWidth="xl" sx={{ pt: 10 }}>
        <Grid container spacing={6}>
            <Grid item xs={12} md={5}><LoadingSkeleton type="product" /></Grid>
            <Grid item xs={12} md={7}><LoadingSkeleton type="text" /></Grid>
        </Grid>
    </Container>
  );
  if (error) return <Message variant="error">{error}</Message>;
  if (!product._id) return <EmptyState title="Product Not Found" description="The product you are looking for does not exist." />;

  const mainImageUrl = getImageUrl(product.images?.[selectedImage] || product.image || product.images?.[0]);
  const hasOffer = product.offerPrice && product.offerPrice < product.price;
  const discountPercentage = hasOffer ? Math.round(((product.price - product.offerPrice) / product.price) * 100) : 0;

  return (
    <Box sx={{ bgcolor: colors.surface.default, minHeight: '100vh', pb: isMobile ? 12 : 8 }}>
      <Container maxWidth="xl" sx={{ pt: 4 }}>
        
        {/* Navigation / Breadcrumb */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1 }}>
            <Typography variant="caption" sx={{ cursor: 'pointer', color: colors.neutral[500], '&:hover': { color: colors.primary.main } }} onClick={() => navigate('/customer/dashboard')}>Home</Typography>
            <ChevronRight sx={{ fontSize: 14, color: colors.neutral[300] }} />
            <Typography variant="caption" sx={{ cursor: 'pointer', color: colors.neutral[500], '&:hover': { color: colors.primary.main } }} onClick={() => navigate('/products')}>Products</Typography>
            <ChevronRight sx={{ fontSize: 14, color: colors.neutral[300] }} />
            <Typography variant="caption" sx={{ fontWeight: 700, color: colors.neutral[900] }}>{product.name}</Typography>
        </Box>

        <Grid container spacing={6}>
          {/* ── LEFT COLUMN: PREMIUM GALLERY ── */}
          <Grid item xs={12} md={5}>
            <Box sx={{ position: 'sticky', top: 100 }}>
                <Paper
                    elevation={0}
                    sx={{ 
                    position: 'relative',
                    bgcolor: '#fff',
                    borderRadius: radius.xl,
                    overflow: 'hidden',
                    border: `1px solid ${colors.neutral[100]}`,
                    boxShadow: shadows.md,
                    mb: 2
                    }}
                >
                    {hasOffer && (
                        <Box sx={{ position: 'absolute', top: 20, left: 20, zIndex: 10 }}>
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
                        <Box sx={{ width: '100%', aspectRatio: '1/1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64, bgcolor: colors.neutral[50] }}>
                        🌾
                        </Box>
                    )}
                </Paper>

                {/* Thumbnails */}
                {product.images && product.images.length > 1 && (
                <Stack direction="row" spacing={2} sx={{ overflowX: 'auto', pb: 1, '&::-webkit-scrollbar': { display: 'none' } }}>
                    {product.images.map((img, idx) => (
                    <Box
                        key={idx}
                        onClick={() => setSelectedImage(idx)}
                        sx={{
                        minWidth: 80, height: 80, borderRadius: radius.md, cursor: 'pointer',
                        border: selectedImage === idx ? `2px solid ${colors.primary.main}` : `1px solid ${colors.neutral[200]}`,
                        overflow: 'hidden', opacity: selectedImage === idx ? 1 : 0.6,
                        transition: 'all 0.2s',
                        '&:hover': { opacity: 1, borderColor: colors.primary.light }
                        }}
                    >
                        <img src={getImageUrl(img)} alt={`Thumbnail ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </Box>
                    ))}
                </Stack>
                )}
            </Box>
          </Grid>

          {/* ── RIGHT COLUMN: PRODUCT DETAILS ── */}
          <Grid item xs={12} md={7}>
            <Box sx={{ bgcolor: '#fff', p: { xs: 3, md: 5 }, borderRadius: radius.xl, border: `1px solid ${colors.neutral[100]}`, boxShadow: shadows.sm }}>
              
              <Box sx={{ mb: 2 }}>
                <Chip
                    label={product.category || "Premium Rice"}
                    size="small"
                    sx={{ bgcolor: tints.green, color: colors.primary.main, fontWeight: 700, borderRadius: radius.xs, mb: 1 }}
                />
                <Typography variant="h2" sx={{ fontWeight: 800, mb: 1, color: colors.neutral[900], lineHeight: 1.2 }}>
                    {product.name}
                </Typography>
                <Stack direction="row" spacing={2} alignItems="center">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography sx={{ fontWeight: 700, color: colors.accent.alt }}>★</Typography>
                        <Typography sx={{ fontWeight: 700 }}>{product.rating || (Math.random()*1+4).toFixed(1)}</Typography>
                        <Typography sx={{ color: colors.neutral[500], fontSize: 14 }}>({product.numReviews || 0} reviews)</Typography>
                    </Box>
                    <Divider orientation="vertical" flexItem />
                    <Typography variant="body2" sx={{ fontWeight: 600, color: colors.neutral[700] }}>
                        {product.brand || 'Rice Mill Select'}
                    </Typography>
                </Stack>
              </Box>

              <Box sx={{ my: 4, p: 3, bgcolor: tints.orange, borderRadius: radius.lg, border: `1px dashed ${colors.accent.main}` }}>
                <PriceDisplay
                    amount={hasOffer ? product.offerPrice : product.price} 
                    originalAmount={hasOffer ? product.price : null}
                    size="large"
                />
                <Typography variant="caption" sx={{ color: colors.neutral[700], fontWeight: 600, mt: 1, display: 'block' }}>
                    Inclusive of all taxes • {product.weight || 1} {product.unit || 'kg'} Pack
                </Typography>
              </Box>

              {/* Quantity Selector & Desktop Actions */}
              {!isMobile && (
                <Box sx={{ mb: 5 }}>
                    <Typography sx={{ fontWeight: 700, mb: 2, fontSize: 14, color: colors.neutral[500], textTransform: 'uppercase' }}>Select Quantity</Typography>
                    <Stack direction="row" spacing={3} alignItems="center">

                        <Box sx={{ display: 'flex', alignItems: 'center', border: `1px solid ${colors.neutral[200]}`, borderRadius: radius.pill, bgcolor: colors.neutral[50] }}>
                            <IconButton onClick={decreaseQty} disabled={qty <= 1} sx={{ color: colors.neutral[700] }}><Remove /></IconButton>
                            <Typography sx={{ width: 40, textAlign: 'center', fontWeight: 800 }}>{qty}</Typography>
                            <IconButton onClick={increaseQty} disabled={qty >= (product.countInStock || 10)} sx={{ color: colors.neutral[700] }}><Add /></IconButton>
                        </Box>

                        {product.countInStock > 0 ? (
                            <Box sx={{ display: 'flex', gap: 2, flex: 1 }}>
                            <Button
                                variant="contained"
                                fullWidth
                                startIcon={<ShoppingCart />}
                                onClick={addToCartHandler}
                                sx={{ bgcolor: colors.primary.main, '&:hover': { bgcolor: colors.primary.dark }, py: 1.8, borderRadius: radius.pill, fontWeight: 700, boxShadow: shadows.greenGlow }}
                            >
                                Add to Cart
                            </Button>
                            <Button
                                variant="contained"
                                fullWidth
                                onClick={buyNowHandler}
                                sx={{ bgcolor: colors.accent.main, color: colors.neutral[900], '&:hover': { bgcolor: colors.accent.dark }, py: 1.8, borderRadius: radius.pill, fontWeight: 700 }}
                            >
                                Buy Now
                            </Button>
                            </Box>
                        ) : (
                            <Typography color="error" sx={{ fontWeight: 800, fontSize: 18 }}>Out of Stock</Typography>
                        )}

                        <IconButton
                            onClick={addToWishlistHandler}
                            sx={{ border: `1px solid ${colors.neutral[200]}`, color: isWishlisted(product._id) ? colors.error : colors.neutral[400], '&:hover': { borderColor: colors.error, color: colors.error } }}
                        >
                            <FavoriteBorder />
                        </IconButton>
                    </Stack>
                </Box>
              )}

              {/* ── TRUST & FEATURES ── */}
              <Grid container spacing={2} sx={{ mb: 4 }}>
                {[
                    { icon: <Verified sx={{ color: colors.info }} />, title: "Quality Assured", desc: "100% Authentic Rice" },
                    { icon: <LocalShipping sx={{ color: colors.success }} />, title: "Fast Delivery", desc: "Express 24h Shipping" },
                    { icon: <Replay sx={{ color: colors.accent.main }} />, title: "Easy Returns", desc: "7 Days Return Policy" }
                ].map((item, i) => (
                    <Grid item xs={4} key={i}>
                        <Box sx={{ textAlign: 'center', p: 2, bgcolor: colors.neutral[50], borderRadius: radius.md }}>
                            {item.icon}
                            <Typography sx={{ fontSize: 12, fontWeight: 700, mt: 1, color: colors.neutral[900] }}>{item.title}</Typography>
                            <Typography sx={{ fontSize: 10, color: colors.neutral[500] }}>{item.desc}</Typography>
                        </Box>
                    </Grid>
                ))}
              </Grid>

              <Divider sx={{ my: 4 }} />

              {/* ── SELLER SECTION ── */}
              <Box sx={{ mb: 4 }}>
                <Typography sx={{ fontWeight: 700, mb: 2, fontSize: 14, color: colors.neutral[500], textTransform: 'uppercase' }}>Sold By</Typography>
                <SellerBadge
                    sellerName={product.seller?.name || 'Authorized Rice Mill Partner'}
                    rating={4.9}
                    verified={true}
                />
              </Box>

              {/* ── SPECIFICATIONS & NUTRITION ── */}
              <Box sx={{ mb: 4 }}>
                <Typography sx={{ fontWeight: 800, mb: 2, fontSize: 18 }}>Product Specifications</Typography>
                <Grid container spacing={2}>
                    {[
                        { label: "Rice Type", value: product.riceType || "Long Grain Basmati" },
                        { label: "Origin", value: product.origin || "Direct from Farm" },
                        { label: "Shelf Life", value: "24 Months" },
                        { label: "Diet Type", value: "Vegetarian" }
                    ].map((spec, i) => (
                        <Grid item xs={6} key={i}>
                            <Typography variant="caption" sx={{ color: colors.neutral[500], display: 'block' }}>{spec.label}</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>{spec.value}</Typography>
                        </Grid>
                    ))}
                </Grid>
              </Box>

              <Box sx={{ mb: 4, p: 3, bgcolor: colors.neutral[50], borderRadius: radius.lg }}>
                <Typography sx={{ fontWeight: 800, mb: 2, fontSize: 16 }}>Nutrition Information (per 100g)</Typography>
                <Stack direction="row" spacing={3} sx={{ overflowX: 'auto', pb: 1 }}>
                    {[
                        { label: "Energy", val: "350 kcal" },
                        { label: "Protein", val: "7.5 g" },
                        { label: "Carbs", val: "78 g" },
                        { label: "Fat", val: "0.5 g" },
                        { label: "Fiber", val: "1.2 g" }
                    ].map((n, i) => (
                        <Box key={i} sx={{ minWidth: 60, textAlign: 'center' }}>
                            <Typography sx={{ fontSize: 14, fontWeight: 800, color: colors.primary.main }}>{n.val}</Typography>
                            <Typography variant="caption" sx={{ color: colors.neutral[500] }}>{n.label}</Typography>
                        </Box>
                    ))}
                </Stack>
              </Box>

              {/* Description */}
              <Box>
                <Typography sx={{ fontWeight: 800, mb: 1.5, fontSize: 18 }}>About this item</Typography>
                <Typography sx={{ color: colors.neutral[700], lineHeight: 1.8 }}>
                  {product.description || 'Experience the essence of tradition with our premium quality rice. Sourced directly from verified farmers in the fertile regions, our rice undergoes a multi-stage cleaning and aging process to ensure that every grain you cook is perfect. It is naturally aromatic, gluten-free, and rich in essential nutrients, making it the ideal choice for health-conscious families.'}
                </Typography>
              </Box>

            </Box>
          </Grid>
        </Grid>

        {/* ── RELATED PRODUCTS ── */}
        {recommendedProducts.length > 0 && (
          <Box sx={{ mt: spacing.section, mb: spacing.section }}>
            <SectionHeader title="Frequently Bought Together" subtitle="Complete your kitchen pantry" />
            <Box sx={{ display: 'flex', gap: 3, overflowX: 'auto', pb: 2, px: 1, mx: -1, '&::-webkit-scrollbar': { display: 'none' } }}>
              {recommendedProducts.filter(p => p._id !== id).slice(0, 6).map(prod => {
                const pOffer = prod.offerPrice && prod.offerPrice < prod.price;
                return (
                  <Box key={prod._id} sx={{ minWidth: 260, flexShrink: 0 }}>
                    <ProductCard
                      product={{
                        _id: prod._id,
                        name: prod.name,
<<<<<<< HEAD
                        image: getImageUrl(prod.images?.[0] || prod.image),
=======
                        image: getImageUrl(prod.images?.[0]),
>>>>>>> a66af4ba90d62021e80410263e806adc23403bd9
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
          <SectionHeader title="Customer Feedback" subtitle={`What ${product.numReviews || 0} people are saying`} />
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
                <Box sx={{ p: 4, bgcolor: '#fff', borderRadius: radius.xl, border: `1px solid ${colors.neutral[100]}`, textAlign: 'center' }}>
                    <Typography variant="h1" sx={{ color: colors.neutral[900], mb: 1 }}>{product.rating || "4.5"}</Typography>
                    <RatingSystem productId={id} readOnly />
                    <Typography variant="body2" sx={{ mt: 2, color: colors.neutral[500], fontWeight: 600 }}>Based on {product.numReviews || 0} verified ratings</Typography>
                </Box>
            </Grid>
            <Grid item xs={12} md={8}>
                <CommentSystem productId={id} />
            </Grid>
          </Grid>
        </Box>

      </Container>

      {/* ── MOBILE STICKY ACTIONS ── */}
      {isMobile && (
        <Paper
            elevation={10}
            sx={{
                position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: zIndex.appBar,
                p: 2, display: 'flex', gap: 2, bgcolor: '#fff', borderTop: `1px solid ${colors.neutral[100]}`,
                borderRadius: '24px 24px 0 0'
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', border: `1px solid ${colors.neutral[200]}`, borderRadius: radius.pill, bgcolor: colors.neutral[50], px: 1 }}>
                <IconButton size="small" onClick={decreaseQty} disabled={qty <= 1}><Remove fontSize="small" /></IconButton>
                <Typography sx={{ width: 24, textAlign: 'center', fontWeight: 800, fontSize: 14 }}>{qty}</Typography>
                <IconButton size="small" onClick={increaseQty} disabled={qty >= (product.countInStock || 10)}><Add fontSize="small" /></IconButton>
            </Box>
            <Button
                variant="contained"
                fullWidth
                onClick={addToCartHandler}
                sx={{ bgcolor: colors.neutral[900], color: '#fff', py: 1.5, borderRadius: radius.pill, fontWeight: 700 }}
            >
                Add to Cart
            </Button>
            <Button
                variant="contained"
                fullWidth
                onClick={buyNowHandler}
                sx={{ bgcolor: colors.accent.main, color: colors.neutral[900], py: 1.5, borderRadius: radius.pill, fontWeight: 700 }}
            >
                Buy Now
            </Button>
        </Paper>
      )}

      <Snackbar open={cartSnackbar} autoHideDuration={3000} onClose={() => setCartSnackbar(false)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert onClose={() => setCartSnackbar(false)} severity="success" sx={{ width: '100%', borderRadius: radius.pill, fontWeight: 700, boxShadow: shadows.lg }}>
          {t('addedToCart')}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProductPage;
