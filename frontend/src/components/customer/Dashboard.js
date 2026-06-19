// [Premium Figma-level Redesign — Customer Dashboard (Web)]
// Refactored to use premium UI components from the design system
import React, { useState, useEffect } from 'react';
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

// Theme & Tokens
import { spacing, colors } from '../../theme/designTokens';

const CATEGORIES = [
    { id: 'basmati', name: 'Basmati Rice', emoji: '🍚', bg: '#FFF7ED', color: '#EA580C' },
    { id: 'sona', name: 'Sona Masoori', emoji: '🌾', bg: '#F0FDF4', color: '#16A34A' },
    { id: 'kolam', name: 'Kolam Rice', emoji: '🥣', bg: '#EFF6FF', color: '#3B82F6' },
    { id: 'brown', name: 'Brown Rice', emoji: '🌿', bg: '#F5F3FF', color: '#7C3AED' },
    { id: 'organic', name: 'Organic', emoji: '🍃', bg: '#F0FDF4', color: '#16A34A' },
    { id: 'bulk', name: 'Wholesale', emoji: '📦', bg: '#FEFCE8', color: '#CA8A04' },
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

const BACKEND_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5001').replace('/api', '');

const Dashboard = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { t } = useTranslation();
    
    const [activeCategory, setActiveCategory] = useState('');

    const { loading: productLoading, error: productError, products = [] } = useSelector((state) => state.productList || {});
    const { wishlistItems = [] } = useSelector(state => state.wishlist || {});

    useEffect(() => {
      dispatch(listProducts());
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

    return (
        <Box sx={{ bgcolor: colors.surface.default, minHeight: '100vh', pb: 8 }}>
            <Container maxWidth="xl" sx={{ pt: 4 }}>
                
                {/* ── HERO BANNERS ── */}
                <Box sx={{ mb: spacing.xl }}>
                    <HeroBanner banners={BANNERS} autoPlayInterval={5000} />
                </Box>

                {/* ── CATEGORIES ── */}
                <Box sx={{ mb: spacing.xl }}>
                    <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 1, '&::-webkit-scrollbar': { display: 'none' }, msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
                        <CategoryCard
                            name="All"
                            emoji="🛒"
                            active={!activeCategory}
                            onClick={() => setActiveCategory('')}
                            color="#16A34A"
                            bg="#F0FDF4"
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

                {/* ── DEALS OF THE DAY ── */}
                {!productLoading && !productError && filteredProducts.length > 0 && (
                    <Box sx={{ mb: spacing.section }}>
                        <SectionHeader 
                            title="Deals of the Day" 
                            subtitle="Best prices, grab before time runs out"
                            action={{ label: "View All", onClick: () => navigate('/products') }}
                        />
                        <Box sx={{ display: 'flex', gap: 3, overflowX: 'auto', pb: 2, '&::-webkit-scrollbar': { display: 'none' } }}>
                            {filteredProducts.slice(0, 6).map(product => {
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
                                                image: product.images?.[0] ? (product.images[0].startsWith('http') ? product.images[0] : BACKEND_URL + product.images[0]) : null,
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
                )}

                {/* ── REFER BANNER ── */}
                <Box sx={{ mb: spacing.section }}>
                    <Box sx={{ 
                        background: '#F0FDF4', borderRadius: 6, p: 4, 
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        border: '1px solid #D1FAE5'
                    }}>
                        <Box>
                            <Box sx={{ fontSize: 13, fontWeight: 700, color: '#16A34A', mb: 1 }}>🎁 Refer & Earn Program</Box>
                            <Box sx={{ fontSize: 26, fontWeight: 800, color: '#111827', lineHeight: 1.3, mb: 2 }}>
                                Invite friends,<br />earn ₹50 rewards each!
                            </Box>
                            <Box 
                                component="button" 
                                onClick={() => navigate('/settings/rewards')}
                                sx={{ 
                                    background: '#16A34A', color: '#fff', fontSize: 14, fontWeight: 700, 
                                    py: 1.5, px: 3, borderRadius: 99, border: 'none', cursor: 'pointer', 
                                    boxShadow: '0 4px 12px rgba(22,163,74,0.25)' 
                                }}
                            >
                                Invite Friends →
                            </Box>
                        </Box>
                        <Box sx={{ fontSize: 80 }}>🤝</Box>
                    </Box>
                </Box>

                {/* ── ALL PRODUCTS ── */}
                <Box sx={{ mb: spacing.section }}>
                    <SectionHeader 
                        title={activeCategory ? `${CATEGORIES.find(c => c.id === activeCategory)?.name || 'Results'}` : 'Recommended For You'} 
                        subtitle={`${filteredProducts.length} products available`}
                    />

                    {productLoading ? (
                        <Grid container spacing={3}>
                            {[...Array(8)].map((_, i) => (
                                <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
                                    <LoadingSkeleton type="product" />
                                </Grid>
                            ))}
                        </Grid>
                    ) : productError ? (
                        <Box sx={{ p: 3, textAlign: 'center', color: '#EF4444', bgcolor: '#FEF2F2', borderRadius: 4 }}>
                            {productError}
                        </Box>
                    ) : filteredProducts.length > 0 ? (
                        <Grid container spacing={3}>
                            {filteredProducts.map(product => {
                                const hasOffer = typeof product.offerPrice === 'number' && product.offerPrice > 0 && product.offerPrice < product.price;
                                const displayPrice = hasOffer ? product.offerPrice : product.price;
                                const discount = hasOffer ? Math.round((1 - product.offerPrice / product.price) * 100) : 0;
                                const rating = product.rating || (Math.random() * 1 + 4).toFixed(1);
                                return (
                                    <Grid item xs={12} sm={6} md={4} lg={3} key={product._id}>
                                        <ProductCard
                                            product={{
                                                _id: product._id,
                                                name: product.name,
                                                image: product.images?.[0] ? (product.images[0].startsWith('http') ? product.images[0] : BACKEND_URL + product.images[0]) : null,
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
                                    </Grid>
                                );
                            })}
                        </Grid>
                    ) : (
                        <EmptyState 
                            icon="🔍"
                            title="No products found"
                            description="Try browsing a different category"
                        />
                    )}
                </Box>
            </Container>
        </Box>
    );
};

export default Dashboard;