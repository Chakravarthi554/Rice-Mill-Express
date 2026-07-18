import React, { useEffect, useMemo, useState, useRef } from 'react';
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
    numReviews: product.numReviews || 0,
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
  const productsSectionRef = useRef(null);

  const { loading: productLoading, error: productError, products = [] } = useSelector((state) => state.productList || {});
  const { wishlistItems = [] } = useSelector((state) => state.userWishlist || {});
  const { user: profile } = useSelector((state) => state.userDetails || {});

  const handleCategoryClick = (categoryId) => {
    setActiveCategory(categoryId);
    setTimeout(() => {
      productsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  useEffect(() => {
    dispatch(listProducts('', ''));
  }, [dispatch]);

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft((prev) => (prev > 0 ? prev - 1 : 7942)), 1000);
    return () => clearInterval(timer);
  }, []);

  const liveOrFallback = products;

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
        {/* ── ZEPTO-STYLE HORIZONTAL CATEGORIES SUB-NAV ── */}
        <Box sx={{ borderBottom: '1px solid #E5E7EB', bgcolor: '#fff', mb: 3, mt: -4, mx: -6, px: 6 }}>
          <Stack direction="row" spacing={4} sx={{ overflowX: 'auto', py: 1.5 }}>
            {categories.map((cat) => {
              const active = activeCategory === cat.id;
              return (
                <Box
                  key={cat.name}
                  onClick={() => handleCategoryClick(cat.id)}
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer', pb: 1,
                    borderBottom: '3px solid', borderColor: active ? '#3C006F' : 'transparent',
                    opacity: active ? 1 : 0.7, '&:hover': { opacity: 1 }
                  }}
                >
                  <Typography sx={{ fontSize: '1.25rem' }}>{cat.icon}</Typography>
                  <Typography sx={{ fontSize: '0.85rem', fontWeight: 800, color: active ? '#3C006F' : '#374151', whiteSpace: 'nowrap' }}>
                    {cat.name}
                  </Typography>
                </Box>
              );
            })}
          </Stack>
        </Box>

      <Container maxWidth="xl" sx={{ pt: 1 }}>
        {/* ── ZEPTO-STYLE HERO BANNERS ── */}
        <Grid container spacing={3} sx={{ mb: 5 }}>
          <Grid item xs={12} md={6}>
            <MotionPaper
              whileHover={{ scale: 1.01 }}
              elevation={0}
              sx={{
                p: 4, borderRadius: 5, overflow: 'hidden', height: 210,
                background: 'linear-gradient(135deg, #F3E8FF 0%, #E9D5FF 100%)',
                border: '1px solid #E9D5FF', display: 'flex', flexDirection: 'column', justifyContent: 'center'
              }}
            >
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 900, color: '#6B21A8', letterSpacing: '0.08em', mb: 1, textTransform: 'uppercase' }}>
                ALL NEW RICEMILL EXPERIENCE
              </Typography>
              <Typography sx={{ fontSize: '1.8rem', fontWeight: 900, color: '#3C006F', mb: 1 }}>
                ₹0 Delivery Fees
              </Typography>
              <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: '#6B21A8' }}>
                Everyday Low Prices • No handling fee
              </Typography>
            </MotionPaper>
          </Grid>
          <Grid item xs={12} md={6}>
            <MotionPaper
              whileHover={{ scale: 1.01 }}
              elevation={0}
              sx={{
                p: 4, borderRadius: 5, overflow: 'hidden', height: 210,
                background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
                border: '1px solid #A7F3D0', display: 'flex', flexDirection: 'column', justifyContent: 'center'
              }}
            >
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 900, color: '#065F46', letterSpacing: '0.08em', mb: 1, textTransform: 'uppercase' }}>
                SUPER SAVER ZONE
              </Typography>
              <Typography sx={{ fontSize: '1.8rem', fontWeight: 900, color: '#065F46', mb: 1.5 }}>
                Up to 25% Off Grains
              </Typography>
              <Button
                variant="contained"
                onClick={() => navigate('/products?sale=true')}
                sx={{
                  bgcolor: '#065F46', color: '#fff', fontWeight: 900, borderRadius: 2,
                  px: 3, py: 1, width: 'fit-content', textTransform: 'none',
                  '&:hover': { bgcolor: '#047857' }
                }}
              >
                Order now &gt;
              </Button>
            </MotionPaper>
          </Grid>
        </Grid>

        {/* ── ROUNDED CATEGORY CARDS GRID ── */}
        <SectionTitle eyebrow="Shop by category" title="Explore categories" action="Browse all" onAction={() => navigate('/products')} />
        <Grid container spacing={3} sx={{ mb: 6 }}>
          {categories.map((category) => (
            <Grid item xs={6} sm={4} md={2} key={category.name}>
              <MotionPaper
                whileHover={{ y: -6 }}
                elevation={0}
                onClick={() => handleCategoryClick(category.id)}
                sx={{
                  p: 2, borderRadius: 4, cursor: 'pointer', textAlign: 'center',
                  bgcolor: '#fff', border: activeCategory === category.id ? '2.5px solid #3C006F' : '1px solid #E5E7EB',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', alignItems: 'center'
                }}
              >
                <Box sx={{
                  width: 72, height: 72, borderRadius: '50%', bgcolor: category.tint || '#F3F4F6',
                  display: 'grid', placeItems: 'center', fontSize: 32, mb: 1.5
                }}>
                  {category.icon}
                </Box>
                <Typography sx={{ fontWeight: 850, fontSize: '0.88rem', color: '#1F2937', mb: 0.5 }}>{category.name}</Typography>
                <Typography sx={{ color: '#9CA3AF', fontSize: '0.72rem', fontWeight: 600 }}>{category.subtitle}</Typography>
              </MotionPaper>
            </Grid>
          ))}
        </Grid>

        <Box ref={productsSectionRef}>
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
        </Box>
      </Container>
    </Box>
  );
};

export default Dashboard;
