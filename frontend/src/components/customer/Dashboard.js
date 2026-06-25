import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Box, Grid, Typography, Chip, Button } from '@mui/material';
import {
  ArrowForwardIos, LocalFireDepartment, Star, FlashOn, Spa, Savings,
  TrendingUp, History, EmojiEvents, AutoAwesome, LocalOffer
} from '@mui/icons-material';

// Redux Actions
import { listProducts } from '../../redux/actions/productActions';
import { addToCart } from '../../redux/actions/cartActions';
import { addToWishlist } from '../../redux/actions/userActions';
import { listMyCart } from '../../redux/actions/cartActions';

// Premium UI Components
import HeroBanner from '../ui/HeroBanner';
import ProductCard from '../ui/ProductCard';
import LoadingSkeleton from '../ui/LoadingSkeleton';
import SectionHeader from '../ui/SectionHeader';
import CategoryCard from '../ui/CategoryCard';

// Utils
import { getImageUrl } from '../../utils/urlHelper';

const CATEGORIES = [
  { id: 'basmati', name: 'Basmati', emoji: '🍚', bg: '#FFF7ED', color: '#E65100' },
  { id: 'sona', name: 'Sona Masoori', emoji: '🌾', bg: '#F0FDF4', color: '#2E7D32' },
  { id: 'organic', name: 'Organic', emoji: '🌿', bg: '#E0F2FE', color: '#0284C7' },
  { id: 'brown', name: 'Brown Rice', emoji: '🌰', bg: '#FEF3C7', color: '#D97706' },
  { id: 'premium', name: 'Premium', emoji: '⭐', bg: '#FCE7F3', color: '#DB2777' },
  { id: 'wholesale', name: 'Wholesale', emoji: '📦', bg: '#F3E8FF', color: '#7C3AED' },
  { id: 'idli', name: 'Idli Rice', emoji: '🍥', bg: '#FCE7F3', color: '#BE185D' },
  { id: 'pulao', name: 'Pulao', emoji: '🍛', bg: '#FFF7ED', color: '#EA580C' },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [activeCategory, setActiveCategory] = useState('');
  const [timeLeft, setTimeLeft] = useState(7942);

  const { loading: productLoading, products = [] } = useSelector((state) => state.productList || {});
  const { wishlistItems = [] } = useSelector(state => state.wishlist || {});

  useEffect(() => {
    dispatch(listProducts({ limit: 40 }));
    dispatch(listMyCart());
  }, [dispatch]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => prev > 0 ? prev - 1 : 7942);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return [
      hrs.toString().padStart(2, '0'),
      mins.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0')
    ].join(':');
  };

  const handleAddToCart = async (productId) => {
    try { await dispatch(addToCart(productId, 1)); } catch (err) { alert(err.message || 'Failed to add to cart'); }
  };

  const handleAddToWishlist = async (productId) => {
    try { await dispatch(addToWishlist(productId)); } catch (err) { alert(err.message || 'Failed to add to wishlist'); }
  };

  const isWishlisted = (id) => wishlistItems.some(x => (x._id || x) === id);

  // Recently viewed from localStorage
  const recentlyViewed = useMemo(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
      return stored.slice(0, 6);
    } catch { return []; }
  }, [products]);

  const flashSaleProducts = useMemo(() => {
    return products.filter(p => p.offerPrice && p.offerPrice < p.price).slice(0, 6);
  }, [products]);

  const bestSellerProducts = useMemo(() => {
    return [...products].sort((a, b) => (b.numReviews || 0) - (a.numReviews || 0)).slice(0, 6);
  }, [products]);

  const organicProducts = useMemo(() => {
    return products.filter(p => p.category?.toLowerCase().includes('organic')).slice(0, 6);
  }, [products]);

  const wholesaleProducts = useMemo(() => {
    return products.filter(p => p.category?.toLowerCase().includes('wholesale') || p.name?.toLowerCase().includes('bulk')).slice(0, 6);
  }, [products]);

  const trendingProducts = useMemo(() => {
    return [...products].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 6);
  }, [products]);

  const offersProducts = useMemo(() => {
    return products.filter(p => p.offerPrice && p.offerPrice < p.price).slice(0, 6);
  }, [products]);

  const recommendedProducts = useMemo(() => {
    return [...products].sort((a, b) => ((b.rating || 0) + (b.numReviews || 0)) - ((a.rating || 0) + (a.numReviews || 0))).slice(0, 6);
  }, [products]);

  // Mock products fallback
  const mockProducts = [
    { _id: 'm-1', name: 'Sona Masoori 25kg', price: 1200, mrp: 1500, discount: 20, rating: 4.5, countInStock: 10, image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=150&q=80', category: 'sona' },
    { _id: 'm-2', name: 'Basmati Gold Premium 10kg', price: 950, mrp: 1100, discount: 15, rating: 4.8, countInStock: 5, image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=150&q=80', category: 'basmati' },
    { _id: 'm-3', name: 'Organic Brown Rice 5kg', price: 900, rating: 4.5, countInStock: 8, image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=150&q=80', category: 'organic' },
    { _id: 'm-4', name: 'Ponni Rice 10kg', price: 1100, rating: 4.5, countInStock: 12, image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=150&q=80', category: 'premium' },
    { _id: 'm-5', name: 'Idli Rice 5kg', price: 550, mrp: 650, discount: 15, rating: 4.3, countInStock: 15, image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=150&q=80', category: 'idli' },
    { _id: 'm-6', name: 'Royal Basmati 1kg', price: 220, mrp: 280, discount: 21, rating: 4.6, countInStock: 20, image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=150&q=80', category: 'basmati' },
  ];

  const getFinalProducts = (realProducts) => realProducts.length > 0 ? realProducts : mockProducts;

  const ProductRow = ({ title, icon, subtitle, products: prods, layout = 'vertical', bgcolor, columns = { xs: 6, sm: 4, md: 3 } }) => (
    <Box sx={{ mb: 2.5, bgcolor: bgcolor || 'transparent', borderRadius: '16px', p: bgcolor ? 2.5 : 0 }}>
      <SectionHeader title={title} subtitle={subtitle} icon={icon} />
      <Grid container spacing={1.5}>
        {getFinalProducts(prods).slice(0, 6).map((prod) => (
          <Grid item {...columns} key={prod._id}>
            <ProductCard
              product={{
                _id: prod._id,
                name: prod.name,
                image: getImageUrl(prod.images?.[0] || prod.image),
                price: prod.offerPrice || prod.price,
                mrp: prod.offerPrice ? prod.price : (prod.mrp || null),
                discount: prod.offerPrice ? Math.round((1 - prod.offerPrice / prod.price) * 100) : (prod.discount || 0),
                rating: Number(prod.rating || 4.5),
                countInStock: prod.countInStock
              }}
              layout={layout}
              wishlisted={isWishlisted(prod._id)}
              onAddToCart={() => handleAddToCart(prod._id)}
              onToggleWishlist={() => handleAddToWishlist(prod._id)}
              onClick={() => navigate(`/products/${prod._id}`)}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const HorizontalRow = ({ title, icon, subtitle, products: prods }) => (
    <Box sx={{ mb: 2.5, bgcolor: '#fff', borderRadius: '16px', p: 2.5, border: '1px solid #F3F4F6', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
      <SectionHeader title={title} subtitle={subtitle} icon={icon} />
      <Box sx={{ display: 'flex', gap: 1.5, overflowX: 'auto', pb: 1, '&::-webkit-scrollbar': { display: 'none' }, mx: -0.5, px: 0.5 }}>
        {getFinalProducts(prods).slice(0, 8).map((prod) => (
          <Box key={prod._id} sx={{ minWidth: 260, maxWidth: 280, flexShrink: 0 }}>
            <ProductCard
              product={{
                _id: prod._id,
                name: prod.name,
                image: getImageUrl(prod.images?.[0] || prod.image),
                price: prod.offerPrice || prod.price,
                mrp: prod.offerPrice ? prod.price : (prod.mrp || null),
                discount: prod.offerPrice ? Math.round((1 - prod.offerPrice / prod.price) * 100) : (prod.discount || 0),
                rating: Number(prod.rating || 4.5),
                countInStock: prod.countInStock
              }}
              layout="horizontal"
              wishlisted={isWishlisted(prod._id)}
              onAddToCart={() => handleAddToCart(prod._id)}
              onToggleWishlist={() => handleAddToWishlist(prod._id)}
              onClick={() => navigate(`/products/${prod._id}`)}
            />
          </Box>
        ))}
      </Box>
    </Box>
  );

  return (
    <Box sx={{ bgcolor: '#F9FAFB', minHeight: '100vh', pb: 8 }}>

      {/* ── CATEGORIES STRIP ── */}
      <Box sx={{ bgcolor: '#fff', borderRadius: '16px', p: 2.5, mb: 2, border: '1px solid #E5E7EB', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <SectionHeader title="Shop by Category" />
        <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'space-between', flexWrap: 'wrap' }}>
          {CATEGORIES.map(cat => (
            <CategoryCard
              key={cat.id}
              name={cat.name}
              emoji={cat.emoji}
              tint={cat.bg}
              color={cat.color}
              active={activeCategory === cat.id}
              onClick={() => {
                setActiveCategory(activeCategory === cat.id ? '' : cat.id);
                navigate(`/products?category=${cat.name}`);
              }}
            />
          ))}
        </Box>
      </Box>

      {/* ── HERO BANNERS ── */}
      <Box sx={{ mb: 2.5 }}>
        <Grid container spacing={1.5}>
          <Grid item xs={12} md={8}>
            <HeroBanner
              badge="New Arrivals"
              title={<span>Premium Basmati<br /><span style={{ color: '#FBBF24' }}>Up to 30% Off</span></span>}
              subtitle="Directly sourced from the finest mills. Experience the rich aroma and long grains."
              cta="Shop Basmati"
              onCta={() => navigate('/products?category=Basmati')}
              gradient="linear-gradient(135deg, #1B5E20 0%, #2E7D32 50%, #388E3C 100%)"
              height={{ xs: 200, md: 320 }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Grid container spacing={1.5} direction="column" sx={{ height: '100%' }}>
              <Grid item xs={6}>
                <HeroBanner
                  badge="Organic"
                  title={<span style={{ fontSize: '1.4rem' }}>100% Organic<br />Certified Rice</span>}
                  cta="Explore"
                  onCta={() => navigate('/products?category=Organic')}
                  gradient="linear-gradient(135deg, #065F46 0%, #059669 100%)"
                  height={{ xs: 120, md: 152 }}
                />
              </Grid>
              <Grid item xs={6}>
                <HeroBanner
                  badge="Wholesale"
                  title={<span style={{ fontSize: '1.4rem' }}>Bulk Orders<br /><span style={{ color: '#FCD34D' }}>Extra 10% Off</span></span>}
                  cta="Order Now"
                  onCta={() => navigate('/bulk-order')}
                  gradient="linear-gradient(135deg, #92400E 0%, #D97706 100%)"
                  height={{ xs: 120, md: 152 }}
                />
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Box>

      {/* ── FLASH SALE HORIZONTAL ROW ── */}
      <Box sx={{ mb: 2.5, bgcolor: '#fff', borderRadius: '16px', p: 2.5, border: '1px solid #E5E7EB', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <Box display="flex" alignItems="center" gap={1.5} mb={1.5}>
          <LocalFireDepartment sx={{ color: '#E65100', fontSize: 28 }} />
          <Typography sx={{ fontSize: '1.2rem', fontWeight: 800, color: '#1F2937' }}>
            Flash Sale
          </Typography>
          <Box sx={{
            bgcolor: '#DC2626', color: '#fff', px: 1.5, py: 0.25,
            borderRadius: '8px', fontSize: '0.9rem', fontWeight: 800,
            fontFamily: 'monospace', letterSpacing: 1
          }}>
            {formatTime(timeLeft)}
          </Box>
          <Box sx={{ flex: 1 }} />
          <Button
            variant="contained"
            size="small"
            onClick={() => navigate('/products?sale=true')}
            endIcon={<ArrowForwardIos sx={{ fontSize: '0.7rem' }} />}
            sx={{ borderRadius: '20px', bgcolor: '#E65100', fontWeight: 700, textTransform: 'none', px: 2, '&:hover': { bgcolor: '#C24100' } }}
          >
            View All
          </Button>
        </Box>
        <HorizontalRow title="" products={flashSaleProducts} />
      </Box>

      {productLoading ? (
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={1.5}>
            {[...Array(6)].map((_, i) => (
              <Grid item xs={6} sm={4} md={2} key={i}>
                <LoadingSkeleton type="card" />
              </Grid>
            ))}
          </Grid>
        </Box>
      ) : (
        <>
          {/* ── BEST SELLERS ── */}
          <ProductRow
            title="Best Sellers"
            subtitle="Most loved by our customers"
            icon={<EmojiEvents sx={{ color: '#F59E0B' }} />}
            products={bestSellerProducts}
            bgcolor="#FFFBEB"
          />

          {/* ── TRENDING PRODUCTS ── */}
          <ProductRow
            title="Trending Now"
            subtitle="Popular picks this week"
            icon={<TrendingUp sx={{ color: '#2E7D32' }} />}
            products={trendingProducts}
            bgcolor="#F0FDF4"
          />

          {/* ── ORGANIC RICE SECTION ── */}
          <ProductRow
            title="Organic Rice"
            subtitle="Naturally grown, chemical-free"
            icon={<Spa sx={{ color: '#059669' }} />}
            products={organicProducts}
            bgcolor="#ECFDF5"
          />

          {/* ── WHOLESALE RICE SECTION ── */}
          {wholesaleProducts.length > 0 && (
            <ProductRow
              title="Wholesale Rice"
              subtitle="Bulk orders at best prices"
              icon={<Savings sx={{ color: '#D97706' }} />}
              products={wholesaleProducts}
              bgcolor="#FFF7ED"
            />
          )}

          {/* ── OFFERS / DISCOUNTED ── */}
          {offersProducts.length > 0 && (
            <ProductRow
              title="Today's Offers"
              subtitle="Limited time deals"
              icon={<LocalOffer sx={{ color: '#DC2626' }} />}
              products={offersProducts}
              bgcolor="#FEF2F2"
            />
          )}

          {/* ── RECOMMENDED FOR YOU ── */}
          <ProductRow
            title="Recommended for You"
            subtitle="Based on your preferences"
            icon={<AutoAwesome sx={{ color: '#7C3AED' }} />}
            products={recommendedProducts}
            bgcolor="#F5F3FF"
          />

          {/* ── RECENTLY VIEWED ── */}
          {recentlyViewed.length > 0 && (
            <ProductRow
            title="Recently Viewed"
            subtitle="Pick up where you left off"
            icon={<History sx={{ color: '#6B7280' }} />}
            products={recentlyViewed}
            bgcolor="#F9FAFB"
          />
          )}

          {/* ── BROWSE ALL CTA ── */}
          <Box sx={{ textAlign: 'center', mt: 1 }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/products')}
              endIcon={<AutoAwesome sx={{ fontSize: 18 }} />}
              sx={{ borderRadius: '24px', px: 5, py: 1.2, fontWeight: 700, borderColor: '#2E7D32', color: '#2E7D32', '&:hover': { borderColor: '#1B5E20', bgcolor: '#F0FDF4' } }}
            >
              Browse All Products
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
};

export default Dashboard;
