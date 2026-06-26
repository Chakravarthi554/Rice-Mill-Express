import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box,
  Button,
  Chip,
  Container,
  Grid,
  IconButton,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import {
  ArrowForward,
  CheckCircle,
  Favorite,
  LocalOffer,
  LocalShipping,
  Notifications,
  PinDrop,
  ShieldOutlined,
  Storefront,
  TrendingUp,
  WorkspacePremium,

} from '@mui/icons-material';
import { motion } from 'framer-motion';

import { listProducts } from '../../redux/actions/productActions';
import { addToCart, listMyCart } from '../../redux/actions/cartActions';
import { addToWishlist } from '../../redux/actions/userActions';
import ProductCard from '../ui/ProductCard';
import LoadingSkeleton from '../ui/LoadingSkeleton';
import EmptyState from '../ui/EmptyState';
import { getImageUrl } from '../../utils/urlHelper';
import { colors, shadows } from '../../theme/designTokens';

const MotionBox = motion(Box);
const MotionPaper = motion(Paper);

const categories = [
  { id: '', name: 'All Rice', subtitle: 'Daily staples', icon: '🌾', tint: '#F0FDF4' },
  { id: 'basmati', name: 'Basmati', subtitle: 'Aromatic long grain', icon: '🍚', tint: '#FFFBEB' },
  { id: 'sona', name: 'Sona Masoori', subtitle: 'South Indian favorite', icon: '🌿', tint: '#ECFDF5' },
  { id: 'organic', name: 'Organic', subtitle: 'Certified clean', icon: '🍃', tint: '#E0F2FE' },
  { id: 'brown', name: 'Brown Rice', subtitle: 'High fibre', icon: '🥣', tint: '#FFF7ED' },
  { id: 'wholesale', name: 'Wholesale', subtitle: 'Bulk savings', icon: '📦', tint: '#F5F3FF' },
];

const fallbackProducts = [
  { _id: 'mock-rme-1', name: 'Royal Sona Masoori Rice 25kg', price: 1199, mrp: 1499, discount: 20, rating: 4.7, countInStock: 20, image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80', category: 'sona' },
  { _id: 'mock-rme-2', name: 'Premium Aged Basmati Gold 10kg', price: 949, mrp: 1199, discount: 21, rating: 4.8, countInStock: 12, image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80', category: 'basmati' },
  { _id: 'mock-rme-3', name: 'Organic Brown Rice 5kg', price: 649, mrp: 799, discount: 19, rating: 4.6, countInStock: 16, image: 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?auto=format&fit=crop&w=600&q=80', category: 'organic' },
  { _id: 'mock-rme-4', name: 'Wholesale Idli Rice 50kg', price: 2199, mrp: 2599, discount: 15, rating: 4.4, countInStock: 9, image: 'https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&w=600&q=80', category: 'wholesale' },
  { _id: 'mock-rme-5', name: 'Kolam Daily Rice 25kg', price: 1099, mrp: 1299, discount: 15, rating: 4.5, countInStock: 25, image: 'https://images.unsplash.com/photo-1516684669134-de6f7c473a2a?auto=format&fit=crop&w=600&q=80', category: 'rice' },
  { _id: 'mock-rme-6', name: 'Ponni Boiled Rice 10kg', price: 799, mrp: 899, discount: 11, rating: 4.3, countInStock: 18, image: 'https://images.unsplash.com/photo-1604076913837-52ab5629fba9?auto=format&fit=crop&w=600&q=80', category: 'rice' },
];

const formatProduct = (product) => {
  const hasOffer = product.offerPrice && product.offerPrice < product.price;
  const displayPrice = hasOffer ? product.offerPrice : product.price;
  const discount = hasOffer ? Math.round(((product.price - product.offerPrice) / product.price) * 100) : product.discount;

  return {
    _id: product._id,
    name: product.name,
    image: getImageUrl(product.images?.[0] || product.image),
    price: displayPrice || 0,
    mrp: hasOffer ? product.price : product.mrp,
    discount: discount || 0,
    rating: Number(product.rating || 0),
    countInStock: product.countInStock ?? 1,
    brand: product.brand || 'Rice Mill Express',
    deliveryEta: `${12 + ((product.name || '').length % 16)} mins`,
  };
};

const SectionTitle = ({ eyebrow, title, action, onAction }) => (
  <Stack direction="row" justifyContent="space-between" alignItems="flex-end" sx={{ mb: 2.25 }}>
    <Box>
      {eyebrow && (
        <Typography sx={{ color: colors.primary.main, fontSize: 12, fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase', mb: 0.5 }}>
          {eyebrow}
        </Typography>
      )}
      <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: '-0.03em', color: '#111827' }}>
        {title}
      </Typography>
    </Box>
    {action && (
      <Button endIcon={<ArrowForward />} onClick={onAction} sx={{ color: colors.primary.main, fontWeight: 900, textTransform: 'none' }}>
        {action}
      </Button>
    )}
  </Stack>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [activeCategory, setActiveCategory] = useState('');
  const [timeLeft, setTimeLeft] = useState(7942);

  const { loading: productLoading, error: productError, products = [] } = useSelector((state) => state.productList || {});
  const { wishlistItems = [] } = useSelector((state) => state.wishlist || {});

  useEffect(() => {
    dispatch(listProducts('', ''));
    dispatch(listMyCart());
  }, [dispatch]);

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft((prev) => (prev > 0 ? prev - 1 : 7942)), 1000);
    return () => clearInterval(timer);
  }, []);

  const liveOrFallback = products.length > 0 ? products : fallbackProducts;

  const visibleProducts = useMemo(() => {
    if (!activeCategory) return liveOrFallback;
    const target = activeCategory.toLowerCase();
    return liveOrFallback.filter((product) => `${product.category || ''} ${product.name || ''}`.toLowerCase().includes(target));
  }, [activeCategory, liveOrFallback]);

  const flashSaleProducts = useMemo(() => liveOrFallback.filter((p) => (p.offerPrice && p.offerPrice < p.price) || p.discount).slice(0, 5), [liveOrFallback]);
  const bestSellers = useMemo(() => [...liveOrFallback].sort((a, b) => (b.numReviews || b.rating || 0) - (a.numReviews || a.rating || 0)).slice(0, 6), [liveOrFallback]);
  const organicCollection = useMemo(() => liveOrFallback.filter((p) => `${p.category || ''} ${p.name || ''}`.toLowerCase().includes('organic')).slice(0, 4), [liveOrFallback]);

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const mins = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
  };

  const handleAddToCart = async (productId) => {
    try {
      await dispatch(addToCart(productId, 1));
    } catch (err) {
      alert(err.message || 'Failed to add to cart');
    }
  };

  const handleAddToWishlist = async (productId) => {
    try {
      await dispatch(addToWishlist(productId));
    } catch (err) {
      alert(err.message || 'Failed to add to wishlist');
    }
  };

  const isWishlisted = (id) => wishlistItems.some((x) => (x._id || x) === id);

  const renderProduct = (product, layout = 'vertical') => (
    <ProductCard
      product={formatProduct(product)}
      layout={layout}
      wishlisted={isWishlisted(product._id)}
      onAddToCart={() => handleAddToCart(product._id)}
      onToggleWishlist={() => handleAddToWishlist(product._id)}
      onClick={() => navigate(`/products/${product._id}`)}
    />
  );

  return (
    <Box sx={{ bgcolor: '#F6F8F3', minHeight: '100vh', pb: 6 }}>
      <Paper
        elevation={0}
        sx={{
          position: 'sticky', top: 72, zIndex: 20, borderRadius: 0,
          borderBottom: '1px solid rgba(46, 125, 50, 0.10)',
          bgcolor: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(18px)',
        }}
      >
        <Container maxWidth="xl" sx={{ py: 1.5 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={1.25}>
              <Box sx={{ width: 36, height: 36, borderRadius: 2.5, display: 'grid', placeItems: 'center', bgcolor: '#E8F5E9', color: colors.primary.main }}>
                <PinDrop fontSize="small" />
              </Box>
              <Box>
                <Typography sx={{ fontSize: 11, color: '#6B7280', fontWeight: 800 }}>Delivering to</Typography>
                <Typography sx={{ fontSize: 14, color: '#111827', fontWeight: 900 }}>Vijayawada</Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip icon={<LocalShipping />} label="12-30 min delivery" sx={{ bgcolor: '#FFF7ED', color: '#9A3412', fontWeight: 900 }} />
              <IconButton onClick={() => navigate('/notifications')} sx={{ bgcolor: '#F3F7EF' }}><Notifications /></IconButton>
            </Stack>
          </Stack>
        </Container>
      </Paper>

      <Container maxWidth="xl" sx={{ pt: 4 }}>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item md={8.4}>
            <MotionPaper
              initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}
              elevation={0}
              sx={{
                minHeight: 360, p: { md: 5 }, borderRadius: 6, overflow: 'hidden', position: 'relative', color: '#fff',
                background: 'radial-gradient(circle at 80% 20%, rgba(255, 193, 7, 0.35), transparent 24%), linear-gradient(135deg, #0F3D1E 0%, #1B5E20 44%, #2E7D32 100%)',
                boxShadow: '0 28px 70px rgba(27, 94, 32, 0.28)',
              }}
            >
              <Box sx={{ position: 'absolute', right: 34, bottom: 18, fontSize: 156, opacity: 0.22 }}>🌾</Box>
              <Chip label="Premium rice marketplace" sx={{ bgcolor: 'rgba(255,255,255,0.16)', color: '#fff', fontWeight: 900, mb: 2, border: '1px solid rgba(255,255,255,0.22)' }} />
              <Typography sx={{ maxWidth: 650, fontSize: { md: 56 }, lineHeight: 0.98, letterSpacing: '-0.06em', fontWeight: 950, mb: 2 }}>
                Fresh mill-direct rice, delivered like quick commerce.
              </Typography>
              <Typography sx={{ maxWidth: 560, fontSize: 18, color: 'rgba(255,255,255,0.82)', mb: 3 }}>
                Shop verified sellers, compare wholesale packs, unlock wallet rewards, and reorder your household staples in minutes.
              </Typography>
              <Stack direction="row" spacing={1.5}>
                <Button variant="contained" size="large" onClick={() => navigate('/products')} sx={{ bgcolor: '#FBBF24', color: '#1F2937', borderRadius: 999, px: 4, fontWeight: 950, textTransform: 'none', '&:hover': { bgcolor: '#F59E0B' } }}>
                  Shop best sellers
                </Button>
                <Button variant="outlined" size="large" onClick={() => navigate('/recipes')} sx={{ borderColor: 'rgba(255,255,255,0.45)', color: '#fff', borderRadius: 999, px: 3.5, fontWeight: 900, textTransform: 'none' }}>
                  Explore recipes
                </Button>
              </Stack>
              <Stack direction="row" spacing={3} sx={{ mt: 4 }}>
                {[
                  ['2k+', 'families served'], ['100%', 'verified sellers'], ['COD', 'wallet ready'],
                ].map(([value, label]) => (
                  <Box key={label}><Typography sx={{ fontSize: 24, fontWeight: 950 }}>{value}</Typography><Typography sx={{ color: 'rgba(255,255,255,0.72)', fontWeight: 700 }}>{label}</Typography></Box>
                ))}
              </Stack>
            </MotionPaper>
          </Grid>
          <Grid item md={3.6}>
            <Stack spacing={2} sx={{ height: '100%' }}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: 5, bgcolor: '#fff', boxShadow: shadows.md, border: '1px solid #EEF2E8' }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Chip icon={<LocalOffer />} label="Flash sale" sx={{ bgcolor: '#FEF3C7', color: '#92400E', fontWeight: 900 }} />
                  <Typography sx={{ fontFamily: 'monospace', fontWeight: 950, color: '#DC2626' }}>{formatTime(timeLeft)}</Typography>
                </Stack>
                <Typography variant="h5" sx={{ fontWeight: 950, letterSpacing: '-0.03em' }}>Save up to 25% on bulk bags</Typography>
                <Typography sx={{ color: '#6B7280', my: 1.25 }}>Limited-time seller funded discounts on 10kg, 25kg and 50kg packs.</Typography>
                <Button fullWidth onClick={() => navigate('/products?sale=true')} variant="contained" sx={{ mt: 1, bgcolor: '#E65100', borderRadius: 999, fontWeight: 950, textTransform: 'none' }}>View deals</Button>
              </Paper>
              <Grid container spacing={2}>
                {[
                  [ShieldOutlined, 'Quality checked', '#EFF6FF'],
                  [WorkspacePremium, 'Premium grades', '#F5F3FF'],
                  [Storefront, 'Seller direct', '#ECFDF5'],
                  [TrendingUp, 'Wholesale rates', '#FFF7ED'],
                ].map(([Icon, label, bg]) => (
                  <Grid item xs={6} key={label}>
                    <Paper elevation={0} sx={{ p: 2, minHeight: 106, borderRadius: 4, bgcolor: bg, border: '1px solid rgba(17,24,39,0.05)' }}>
                      <Icon sx={{ color: colors.primary.main, mb: 1 }} />
                      <Typography sx={{ fontWeight: 900, color: '#111827', lineHeight: 1.15 }}>{label}</Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Stack>
          </Grid>
        </Grid>

        <SectionTitle eyebrow="Shop by need" title="Rice categories" action="Browse all" onAction={() => navigate('/products')} />
        <Grid container spacing={2.25} sx={{ mb: 5 }}>
          {categories.map((category) => (
            <Grid item md={2} key={category.name}>
              <MotionPaper
                whileHover={{ y: -8 }}
                elevation={0}
                onClick={() => setActiveCategory(category.id)}
                sx={{ p: 2.25, borderRadius: 5, cursor: 'pointer', bgcolor: category.tint, border: activeCategory === category.id ? `2px solid ${colors.primary.main}` : '1px solid rgba(17,24,39,0.06)', minHeight: 150 }}
              >
                <Typography sx={{ fontSize: 38, mb: 1 }}>{category.icon}</Typography>
                <Typography sx={{ fontWeight: 950, color: '#111827' }}>{category.name}</Typography>
                <Typography sx={{ color: '#6B7280', fontSize: 13, fontWeight: 700 }}>{category.subtitle}</Typography>
              </MotionPaper>
            </Grid>
          ))}
        </Grid>

        {productLoading ? (
          <Grid container spacing={2.25}>{[...Array(10)].map((_, i) => <Grid item md={2.4} key={i}><LoadingSkeleton type="product" /></Grid>)}</Grid>
        ) : productError ? (
          <EmptyState icon="⚠️" title="Something went wrong" description={productError} action={{ label: 'Try Again', onClick: () => dispatch(listProducts('', '')) }} />
        ) : (
          <>
            <SectionTitle eyebrow="Fast moving" title="Flash sales and best deals" action="See all deals" onAction={() => navigate('/products?sale=true')} />
            <Grid container spacing={2.25} sx={{ mb: 5 }}>
              {(flashSaleProducts.length ? flashSaleProducts : fallbackProducts).slice(0, 5).map((product) => <Grid item md={2.4} key={product._id}>{renderProduct(product)}</Grid>)}
            </Grid>

            <Grid container spacing={3} sx={{ mb: 5 }}>
              <Grid item md={8}>
                <SectionTitle eyebrow="Top rated" title={activeCategory ? 'Recommended in selected category' : 'Best sellers near you'} action="View products" onAction={() => navigate('/products')} />
                <Grid container spacing={2.25}>
                  {(visibleProducts.length ? visibleProducts : bestSellers).slice(0, 6).map((product) => <Grid item md={4} key={product._id}>{renderProduct(product)}</Grid>)}
                </Grid>
              </Grid>
              <Grid item md={4}>
                <Paper elevation={0} sx={{ p: 3, height: '100%', borderRadius: 6, bgcolor: '#111827', color: '#fff', position: 'relative', overflow: 'hidden' }}>
                  <Box sx={{ position: 'absolute', right: -24, bottom: -24, fontSize: 140, opacity: 0.16 }}>🍚</Box>
                  <Typography sx={{ color: '#FBBF24', fontWeight: 950, textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: 12 }}>Wholesale collection</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 950, letterSpacing: '-0.04em', mt: 1 }}>Buy for restaurants, hostels and retailers.</Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,0.72)', my: 2 }}>Transparent seller pricing, bulk packs, COD collection support and quick delivery assignment.</Typography>
                  <Stack spacing={1.25} sx={{ my: 3 }}>
                    {['50kg bags and recurring orders', 'Verified mills and seller ratings', 'Invoice-ready checkout'].map((item) => <Stack direction="row" spacing={1} alignItems="center" key={item}><CheckCircle sx={{ color: '#86EFAC' }} /><Typography sx={{ fontWeight: 800 }}>{item}</Typography></Stack>)}
                  </Stack>
                  <Button onClick={() => navigate('/products?category=wholesale')} variant="contained" sx={{ bgcolor: '#FBBF24', color: '#111827', borderRadius: 999, fontWeight: 950, textTransform: 'none' }}>Explore wholesale</Button>
                </Paper>
              </Grid>
            </Grid>

            <SectionTitle eyebrow="Clean eating" title="Organic and healthy picks" action="Explore organic" onAction={() => navigate('/products?category=organic')} />
            <Grid container spacing={2.25} sx={{ mb: 5 }}>
              {(organicCollection.length ? organicCollection : fallbackProducts.slice(0, 4)).map((product) => <Grid item md={3} key={product._id}>{renderProduct(product, 'horizontal')}</Grid>)}
            </Grid>

            <Grid container spacing={2.5}>
              {[
                ['Popular recipes', 'Turn rice into biryani, idli, pongal and daily meal inspiration.', '/recipes'],
                ['Community highlights', 'See seller stories, customer posts and local grain tips.', '/community'],
                ['Wallet rewards', 'Track cashback, referrals and payment savings in one place.', '/settings/wallet'],
              ].map(([title, desc, path]) => (
                <Grid item md={4} key={title}>
                  <MotionPaper whileHover={{ y: -6 }} elevation={0} onClick={() => navigate(path)} sx={{ p: 3, borderRadius: 5, bgcolor: '#fff', border: '1px solid #E5EEDC', cursor: 'pointer', boxShadow: shadows.sm }}>
                    <Typography sx={{ fontWeight: 950, fontSize: 21, letterSpacing: '-0.03em', mb: 1 }}>{title}</Typography>
                    <Typography sx={{ color: '#6B7280', fontWeight: 600 }}>{desc}</Typography>
                  </MotionPaper>
                </Grid>
              ))}
            </Grid>
          </>
        )}
      </Container>
    </Box>
  );
};

export default Dashboard;
