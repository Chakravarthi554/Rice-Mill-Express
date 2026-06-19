// [Premium Figma-level Redesign — Customer Dashboard (Web)]
// Refactored to use premium UI components from the design system
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Box, Container, Grid } from '@mui/material';
import { useTranslation } from 'react-i18next';

// Redux Actions
import { listProducts } from '../../redux/actions/productActions';
import { addToCart } from '../../redux/actions/cartActions';
import { addToWishlist } from '../../redux/actions/userActions';

// Premium UI Components
import HeroBanner from '../ui/HeroBanner';
import CategoryCard from '../ui/CategoryCard';
import ProductCard from '../ui/ProductCard';
import SectionHeader from '../ui/SectionHeader';
import LoadingSkeleton from '../ui/LoadingSkeleton';
import EmptyState from '../ui/EmptyState';

// Utils
import { getImageUrl } from '../../utils/urlHelper';

// Theme & Tokens
import { spacing, colors, tints } from '../../theme/designTokens';

const CATEGORIES = [
    { id: 'basmati', name: 'Basmati Rice', emoji: '🍚', bg: tints.orange, color: '#EA580C' },
    { id: 'sona', name: 'Sona Masoori', emoji: '🌾', bg: tints.green, color: '#16A34A' },
    { id: 'kolam', name: 'Kolam Rice', emoji: '🥣', bg: tints.blue, color: '#3B82F6' },
    { id: 'brown', name: 'Brown Rice', emoji: '🌿', bg: tints.purple, color: '#7C3AED' },
    { id: 'organic', name: 'Organic', emoji: '🍃', bg: tints.green, color: '#16A34A' },
    { id: 'bulk', name: 'Wholesale', emoji: '📦', bg: tints.yellow, color: '#CA8A04' },
];

const BANNERS = [
    { 
      id: 1, 
      title: 'Festival Special', 
      subtitle: '20% OFF on Bulk Basmati Orders!', 
      ctaText: 'Shop Now', 
      bgGradient: 'linear-gradient(135deg, #F97316 0%, #FB923C 100%)', 
      emoji: '🎉',
      onClick: () => {} 
    },
    { 
      id: 2, 
      title: 'New Harvest Season', 
      subtitle: 'Fresh Sona Masoori just arrived!', 
      ctaText: 'Explore Now', 
      bgGradient: 'linear-gradient(135deg, #16A34A 0%, #22C55E 100%)', 
      emoji: '🌾',
      onClick: () => {} 
    },
    { 
      id: 3, 
      title: 'Free Delivery', 
      subtitle: 'On all orders above ₹500!', 
      ctaText: 'Order Now', 
      bgGradient: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)', 
      emoji: '🚚',
      onClick: () => {} 
    },
];

const Dashboard = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { t } = useTranslation();
    
    const [activeCategory, setActiveCategory] = useState('');

    const { loading: productLoading, error: productError, products = [] } = useSelector((state) => state.productList || {});
    const { wishlistItems = [] } = useSelector(state => state.wishlist || {});

    // Recently Viewed (Mocked with local storage for now)
    const [recentlyViewed, setRecentlyViewed] = useState([]);

    useEffect(() => {
        dispatch(listProducts({ limit: 40 }));
        const viewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
        setRecentlyViewed(viewed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dispatch]);

    const handleAddToCart = async (productId) => {
        try { await dispatch(addToCart(productId, 1)); }
        catch (err) { alert(err.message || 'Failed to add to cart'); }
    };

    const handleAddToWishlist = async (productId) => {
        try { await dispatch(addToWishlist(productId)); }
        catch (err) { alert(err.message || 'Failed to add to wishlist'); }
    };

    const isWishlisted = (id) => wishlistItems.some(x => (x._id || x) === id);

    const filteredProducts = activeCategory
        ? products.filter(p => p.category?.toLowerCase().includes(activeCategory) || p.name?.toLowerCase().includes(activeCategory))
        : products;

    // derived collections
    const bestSellers = useMemo(() => [...products].sort((a, b) => (b.numReviews || 0) - (a.numReviews || 0)).slice(0, 8), [products]);
    const trendingProducts = useMemo(() => [...products].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 8), [products]);
    const organicRice = useMemo(() => products.filter(p => p.category?.toLowerCase().includes('organic') || p.name?.toLowerCase().includes('organic')).slice(0, 8), [products]);
    const wholesaleRice = useMemo(() => products.filter(p => p.category?.toLowerCase().includes('bulk') || p.category?.toLowerCase().includes('wholesale') || (p.minQty && p.minQty > 10)).slice(0, 8), [products]);
    const todaysOffers = useMemo(() => products.filter(p => p.offerPrice && p.offerPrice < p.price).slice(0, 8), [products]);
    const seasonalPromotions = useMemo(() => products.slice(10, 18), [products]); // Fallback mock
    const recommendedProducts = useMemo(() => [...products].sort(() => 0.5 - Math.random()).slice(0, 8), [products]);

    const renderProductRow = (title, subtitle, items, viewAllPath = '/products') => {
        if (items.length === 0) return null;
        return (
            <Box sx={{ mb: spacing.section }}>
                <SectionHeader
                    title={title}
                    subtitle={subtitle}
                    action={{ label: "View All", onClick: () => navigate(viewAllPath) }}
                />
                <Box sx={{ display: 'flex', gap: 3, overflowX: 'auto', pb: 2, px: 1, mx: -1, '&::-webkit-scrollbar': { display: 'none' } }}>
                    {items.map(product => {
                        const hasOffer = typeof product.offerPrice === 'number' && product.offerPrice > 0 && product.offerPrice < product.price;
                        const displayPrice = hasOffer ? product.offerPrice : product.price;
                        const discount = hasOffer ? Math.round((1 - product.offerPrice / product.price) * 100) : 0;
                        const rating = product.rating || (Math.random() * 1 + 4).toFixed(1);
                        return (
                            <Box key={product._id} sx={{ minWidth: 260, flexShrink: 0 }}>
                                <ProductCard
                                    product={{
                                        _id: product._id,
                                        name: product.name,
                                        image: getImageUrl(product.images?.[0]),
                                        price: displayPrice || 0,
                                        mrp: hasOffer ? product.price : null,
                                        discount: discount,
                                        rating: Number(rating),
                                        countInStock: product.countInStock
                                    }}
                                    wishlisted={isWishlisted(product._id)}
                                    onAddToCart={() => handleAddToCart(product._id)}
                                    onToggleWishlist={() => handleAddToWishlist(product._id)}
                                    onClick={() => navigate(`/products/${product._id}`)}
                                />
                            </Box>
                        );
                    })}
                </Box>
            </Box>
        );
    };

    return (
        <Box sx={{ bgcolor: colors.surface.default, minHeight: '100vh', pb: 8 }}>
            <Container maxWidth="xl" sx={{ pt: 4 }}>
                
                {/* ── HERO CAROUSEL ── */}
                <Box sx={{ mb: spacing.xl }}>
                    <HeroBanner banners={BANNERS} autoPlayInterval={5000} />
                </Box>

                {/* ── FEATURED CATEGORIES ── */}
                <Box sx={{ mb: spacing.xl }}>
                    <SectionHeader title="Featured Categories" subtitle="Explore rice by variety" />
                    <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 1, '&::-webkit-scrollbar': { display: 'none' }, msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
                        <CategoryCard
                            name="All"
                            emoji="🛒"
                            active={!activeCategory}
                            onClick={() => setActiveCategory('')}
                            color={colors.primary.main}
                            bg={tints.green}
                        />
                        {CATEGORIES.map(cat => (
                            <CategoryCard
                                key={cat.id}
                                name={cat.name}
                                emoji={cat.emoji}
                                active={activeCategory === cat.id}
                                onClick={() => setActiveCategory(activeCategory === cat.id ? '' : cat.id)}
                                color={cat.color}
                                bg={cat.bg}
                            />
                        ))}
                    </Box>
                </Box>

                {productLoading ? (
                    <Box sx={{ mb: spacing.section }}>
                        <Grid container spacing={3}>
                            {[...Array(8)].map((_, i) => (
                                <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
                                    <LoadingSkeleton type="product" />
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                ) : productError ? (
                    <Box sx={{ p: 3, textAlign: 'center', color: colors.error, bgcolor: tints.red, borderRadius: 4, mb: spacing.section }}>
                        {productError}
                    </Box>
                ) : (
                    <>
                        {/* ── TODAY'S OFFERS ── */}
                        {renderProductRow("Today's Offers", "Best prices, grab before they are gone", todaysOffers)}

                        {/* ── BEST SELLERS ── */}
                        {renderProductRow("Best Sellers", "Most loved by our customers", bestSellers)}

                        {/* ── REFER BANNER ── */}
                        <Box sx={{ mb: spacing.section }}>
                            <Box sx={{
                                background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
                                borderRadius: 6, p: { xs: 3, md: 5 },
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                border: '1px solid #D1FAE5',
                                boxShadow: '0 10px 30px rgba(22,163,74,0.05)'
                            }}>
                                <Box>
                                    <Box sx={{ fontSize: 14, fontWeight: 700, color: colors.primary.main, mb: 1, textTransform: 'uppercase', letterSpacing: 1 }}>🎁 Refer & Earn</Box>
                                    <Box sx={{ fontSize: { xs: 24, md: 32 }, fontWeight: 800, color: colors.neutral[900], lineHeight: 1.2, mb: 2 }}>
                                        Invite friends,<br />get ₹50 in your wallet!
                                    </Box>
                                    <Box
                                        component="button"
                                        onClick={() => navigate('/settings/rewards')}
                                        sx={{
                                            background: colors.primary.main, color: '#fff', fontSize: 16, fontWeight: 700,
                                            py: 1.5, px: 4, borderRadius: 99, border: 'none', cursor: 'pointer',
                                            boxShadow: '0 4px 12px rgba(22,163,74,0.25)',
                                            transition: 'transform 0.2s',
                                            '&:hover': { transform: 'translateY(-2px)' }
                                        }}
                                    >
                                        Invite Friends Now →
                                    </Box>
                                </Box>
                                <Box sx={{ fontSize: { xs: 60, md: 100 }, display: { xs: 'none', sm: 'block' } }}>🤝</Box>
                            </Box>
                        </Box>

                        {/* ── TRENDING PRODUCTS ── */}
                        {renderProductRow("Trending Now", "What's popular this week", trendingProducts)}

                        {/* ── ORGANIC RICE COLLECTION ── */}
                        {renderProductRow("Organic Rice Collection", "Pure, pesticide-free & healthy", organicRice)}

                        {/* ── WHOLESALE SECTION ── */}
                        {renderProductRow("Wholesale & Bulk", "Save big on large orders", wholesaleRice)}

                        {/* ── SEASONAL PROMOTIONS ── */}
                        {renderProductRow("Seasonal Promotions", "Exclusive picks for the season", seasonalPromotions)}

                        {/* ── RECOMMENDED PRODUCTS ── */}
                        {renderProductRow("Recommended Products", "Handpicked for you", recommendedProducts)}

                        {/* ── RECENTLY VIEWED ── */}
                        {renderProductRow("Recently Viewed", "Jump back into your interests", recentlyViewed)}
                    </>
                )}

                {/* Empty State Fallback */}
                {!productLoading && products.length === 0 && (
                    <EmptyState
                        icon="🔍"
                        title="No products available"
                        description="Check back later for fresh harvest!"
                    />
                )}
            </Container>
        </Box>
    );
};

export default Dashboard;
