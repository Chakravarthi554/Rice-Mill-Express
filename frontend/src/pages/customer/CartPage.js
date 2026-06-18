// [Phase 2 Premium Redesign — Cart Page]
// Uses design system tokens + UI components for a Zepto/BigBasket-grade cart experience.
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box, Container, Typography, Grid, IconButton,
  Button, Divider, Chip, Alert, Stack, Paper
} from '@mui/material';
import {
  Delete as DeleteIcon, Add, Remove, LocalShipping,
  ArrowForward, ShoppingCartOutlined
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

// Redux
import { addToCart, removeFromCart, listMyCart } from '../../redux/actions/cartActions';
import { listProducts as listAllProducts } from '../../redux/actions/productActions';

// UI Components
import ProductCard from '../../components/ui/ProductCard';
import SectionHeader from '../../components/ui/SectionHeader';
import EmptyState from '../../components/ui/EmptyState';
import PriceDisplay from '../../components/ui/PriceDisplay';

// Theme
import { colors, spacing, radius, shadows, tints } from '../../theme/designTokens';

const MotionBox = motion(Box);

const BACKEND_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5001').replace('/api', '');
const getImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return BACKEND_URL + url;
};

const CartPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { cartItems = [] } = useSelector(s => s.cart);
  const { products = [] } = useSelector(s => s.productList);

  useEffect(() => {
    dispatch(listMyCart());
    dispatch(listAllProducts());
  }, [dispatch]);

  const handleQtyChange = (id, qty) => dispatch(addToCart(id, Number(qty)));
  const handleRemove = (id) => dispatch(removeFromCart(id));
  const proceedToCheckout = () => navigate('/checkout');

  const subtotal = cartItems.reduce((s, i) => s + ((i.product?.offerPrice || i.product?.price) || 0) * (i.qty || 0), 0);
  const deliveryFee = subtotal > 500 ? 0 : 50;
  const grandTotal = subtotal + deliveryFee;
  const freeDeliveryThreshold = 500;
  const amountToFreeDelivery = Math.max(0, freeDeliveryThreshold - subtotal + 1);

  const cartProductIds = cartItems.map(item => item.product._id);
  const recommendedProducts = products.filter(p => !cartProductIds.includes(p._id)).slice(0, 4);

  // ── Empty Cart ──
  if (cartItems.length === 0) {
    return (
      <Box sx={{ bgcolor: colors.surface.default, minHeight: '100vh' }}>
        <Container maxWidth="md" sx={{ py: 10 }}>
          <EmptyState
            icon="🛒"
            title="Your cart is empty"
            description="Looks like you haven't added any products yet. Browse our collection of premium rice and grains."
            action={{ label: 'Browse Products', onClick: () => navigate('/products') }}
          />
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: colors.surface.default, minHeight: '100vh', pb: 8 }}>
      <Container maxWidth="xl" sx={{ pt: 4 }}>

        {/* ── Header ── */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, color: colors.neutral[900] }}>
            My Cart
          </Typography>
          <Chip
            label={`${cartItems.length} item${cartItems.length > 1 ? 's' : ''}`}
            sx={{ bgcolor: tints.green, color: colors.success, fontWeight: 700, fontSize: '0.85rem' }}
          />
        </Box>

        {/* ── Free Delivery Progress ── */}
        {subtotal <= freeDeliveryThreshold && (
          <MotionBox
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            sx={{
              mb: 3, p: 2.5, borderRadius: `${radius.lg}px`,
              bgcolor: tints.blue, border: '1px solid #BFDBFE',
              display: 'flex', alignItems: 'center', gap: 2
            }}
          >
            <LocalShipping sx={{ color: colors.info, fontSize: 28 }} />
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontWeight: 700, color: colors.info, fontSize: '0.95rem' }}>
                Add <strong>₹{amountToFreeDelivery.toFixed(0)}</strong> more for <strong>FREE delivery!</strong>
              </Typography>
              <Box sx={{ mt: 1, height: 6, borderRadius: 99, bgcolor: '#DBEAFE', overflow: 'hidden' }}>
                <Box sx={{ height: '100%', borderRadius: 99, bgcolor: colors.info, width: `${Math.min(100, (subtotal / freeDeliveryThreshold) * 100)}%`, transition: 'width 0.5s ease' }} />
              </Box>
            </Box>
          </MotionBox>
        )}

        <Grid container spacing={4}>
          {/* ── Cart Items ── */}
          <Grid item xs={12} md={8}>
            <AnimatePresence>
              <Stack spacing={2}>
                {cartItems.map((item, index) => {
                  const product = item.product || {};
                  const imageUrl = getImageUrl(product.images?.[0] || product.image);
                  const price = product.offerPrice || product.price || 0;
                  const qty = item.qty || 1;
                  const hasOffer = product.offerPrice && product.offerPrice < product.price;
                  const discount = hasOffer ? Math.round((1 - product.offerPrice / product.price) * 100) : 0;

                  return (
                    <MotionBox
                      key={product._id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                      sx={{
                        bgcolor: colors.surface.paper, borderRadius: `${radius.lg}px`, p: 2.5,
                        display: 'flex', alignItems: 'center', gap: 2.5,
                        border: '1px solid', borderColor: colors.neutral[200],
                        boxShadow: shadows.xs,
                        '&:hover': { borderColor: colors.primary.lighter, boxShadow: shadows.sm },
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {/* Image */}
                      <Box
                        sx={{
                          width: 110, height: 110, borderRadius: `${radius.md}px`, overflow: 'hidden',
                          flexShrink: 0, cursor: 'pointer', bgcolor: colors.neutral[50],
                        }}
                        onClick={() => navigate(`/products/${product._id}`)}
                      >
                        {imageUrl ? (
                          <img src={imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>🌾</Box>
                        )}
                      </Box>

                      {/* Info */}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Typography
                            sx={{ fontWeight: 700, fontSize: '1rem', cursor: 'pointer', maxWidth: '70%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                            onClick={() => navigate(`/products/${product._id}`)}
                          >
                            {product.name}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => handleRemove(product._id)}
                            sx={{ color: colors.neutral[500], '&:hover': { color: colors.error, bgcolor: tints.red } }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>

                        {product.weight && (
                          <Typography sx={{ fontSize: '0.85rem', color: colors.neutral[500], mt: 0.5 }}>
                            {product.weight} {product.unit || 'kg'}
                          </Typography>
                        )}

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                          {/* Quantity Controls */}
                          <Box sx={{ display: 'flex', alignItems: 'center', border: `1px solid ${colors.neutral[200]}`, borderRadius: `${radius.sm}px`, overflow: 'hidden' }}>
                            <IconButton size="small" onClick={() => handleQtyChange(product._id, qty - 1)} disabled={qty <= 1} sx={{ borderRadius: 0 }}>
                              <Remove fontSize="small" />
                            </IconButton>
                            <Typography sx={{ px: 2, fontWeight: 700, minWidth: 36, textAlign: 'center', fontSize: '0.95rem' }}>{qty}</Typography>
                            <IconButton
                              size="small"
                              onClick={() => handleQtyChange(product._id, qty + 1)}
                              disabled={qty >= (product.countInStock || 10)}
                              sx={{ borderRadius: 0, bgcolor: colors.primary.main, color: '#fff', '&:hover': { bgcolor: colors.primary.dark }, '&.Mui-disabled': { bgcolor: colors.neutral[200] } }}
                            >
                              <Add fontSize="small" />
                            </IconButton>
                          </Box>

                          {/* Price */}
                          <Box sx={{ textAlign: 'right' }}>
                            <Typography sx={{ fontWeight: 800, fontSize: '1.15rem', color: colors.primary.dark }}>
                              ₹{(price * qty).toFixed(0)}
                            </Typography>
                            {hasOffer && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'flex-end' }}>
                                <Typography sx={{ fontSize: '0.8rem', color: colors.neutral[500], textDecoration: 'line-through' }}>
                                  ₹{(product.price * qty).toFixed(0)}
                                </Typography>
                                <Chip
                                  label={`${discount}% off`}
                                  size="small"
                                  sx={{ bgcolor: tints.amber, color: colors.accent.contrast, fontSize: '0.68rem', height: 20, fontWeight: 700 }}
                                />
                              </Box>
                            )}
                          </Box>
                        </Box>
                      </Box>
                    </MotionBox>
                  );
                })}
              </Stack>
            </AnimatePresence>
          </Grid>

          {/* ── Order Summary ── */}
          <Grid item xs={12} md={4}>
            <Paper
              sx={{
                borderRadius: `${radius.xl}px`, p: 3.5,
                border: `1px solid ${colors.neutral[200]}`,
                position: 'sticky', top: 80,
                boxShadow: shadows.sm,
              }}
            >
              <Typography sx={{ fontWeight: 800, fontSize: '1.2rem', mb: 2.5 }}>Order Summary</Typography>
              <Divider sx={{ mb: 2.5 }} />

              <Stack spacing={2}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography sx={{ color: colors.neutral[500] }}>Item Total ({cartItems.length} items)</Typography>
                  <Typography sx={{ fontWeight: 600 }}>₹{subtotal.toFixed(0)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography sx={{ color: colors.neutral[500] }}>Delivery Fee</Typography>
                  <Typography sx={{ fontWeight: 600, color: deliveryFee === 0 ? colors.success : 'inherit' }}>
                    {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                  </Typography>
                </Box>
                {deliveryFee === 0 && (
                  <Box sx={{ bgcolor: tints.green, borderRadius: `${radius.sm}px`, px: 2, py: 1 }}>
                    <Typography sx={{ fontSize: '0.82rem', color: colors.success, fontWeight: 700 }}>🎉 You got free delivery!</Typography>
                  </Box>
                )}
              </Stack>

              <Divider sx={{ my: 2.5 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography sx={{ fontWeight: 700, fontSize: '1.15rem' }}>Grand Total</Typography>
                <Typography sx={{ fontWeight: 800, fontSize: '1.25rem', color: colors.primary.dark }}>₹{grandTotal.toFixed(0)}</Typography>
              </Box>

              <Button
                component={motion.button}
                whileTap={{ scale: 0.97 }}
                fullWidth
                variant="contained"
                size="large"
                endIcon={<ArrowForward />}
                onClick={proceedToCheckout}
                sx={{
                  bgcolor: colors.primary.main, '&:hover': { bgcolor: colors.primary.dark },
                  borderRadius: `${radius.md}px`, py: 1.5, fontWeight: 800, fontSize: '1rem',
                  boxShadow: shadows.greenGlow,
                }}
              >
                Proceed to Checkout
              </Button>

              <Typography sx={{ fontSize: '0.78rem', color: colors.neutral[500], textAlign: 'center', mt: 2 }}>
                🔒 Secure & encrypted checkout
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* ── Recommendations ── */}
        {recommendedProducts.length > 0 && (
          <Box sx={{ mt: spacing.section }}>
            <Divider sx={{ mb: 4 }} />
            <SectionHeader title="You may also like" subtitle="Handpicked recommendations" />
            <Grid container spacing={3}>
              {recommendedProducts.map(product => (
                <Grid item xs={12} sm={6} md={3} key={product._id}>
                  <ProductCard
                    product={{
                      name: product.name,
                      image: getImageUrl(product.images?.[0] || product.image),
                      price: product.offerPrice || product.price,
                      mrp: product.offerPrice && product.offerPrice < product.price ? product.price : undefined,
                      discount: product.offerPrice && product.offerPrice < product.price ? Math.round((1 - product.offerPrice / product.price) * 100) : 0,
                      rating: product.rating || 0,
                      numReviews: product.numReviews || 0,
                      countInStock: product.countInStock,
                    }}
                    onAddToCart={() => dispatch(addToCart(product._id, 1))}
                    onClick={() => navigate(`/products/${product._id}`)}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default CartPage;