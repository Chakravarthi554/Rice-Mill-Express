import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Box, Container, Grid, Typography, IconButton, InputBase, Paper, Chip } from '@mui/material';
import { 
  PinDrop, Notifications, Search, ShoppingBag, 
  Favorite, LocalOffer, Person, ChevronRight 
} from '@mui/icons-material';

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
    { id: 'basmati', name: 'Basmati', emoji: '🍚', bg: tints.orange, color: '#E65100' },
    { id: 'sona', name: 'Sona Masuri', emoji: '🌾', bg: tints.green, color: '#2E7D32' },
    { id: 'kolam', name: 'Kolam', emoji: '🥣', bg: tints.blue, color: '#1565C0' },
    { id: 'brown', name: 'Brown Rice', emoji: '🌿', bg: tints.purple, color: '#7C3AED' },
    { id: 'organic', name: 'Organic', emoji: '🍃', bg: tints.green, color: '#2E7D32' },
    { id: 'bulk', name: 'Wholesale', emoji: '📦', bg: tints.yellow, color: '#CA8A04' },
];

const BANNERS = [
    { 
      id: 1, 
      title: 'FESTIVAL OFFER', 
      subtitle: '20% OFF on all premium rice varieties', 
      ctaText: 'Shop Now', 
      bgGradient: 'linear-gradient(135deg, #FF6D00 0%, #FF9100 100%)', 
      emoji: '🎉',
      onClick: () => {} 
    },
    { 
      id: 2, 
      title: 'New Harvest Season', 
      subtitle: 'Fresh Sona Masoori just arrived!', 
      ctaText: 'Explore Now', 
      bgGradient: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)', 
      emoji: '🌾',
      onClick: () => {} 
    },
    { 
      id: 3, 
      title: 'Free Delivery', 
      subtitle: 'On all orders above ₹500!', 
      ctaText: 'Order Now', 
      bgGradient: 'linear-gradient(135deg, #1565C0 0%, #1976D2 100%)', 
      emoji: '🚚',
      onClick: () => {} 
    },
];

const Dashboard = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    
    const [activeCategory, setActiveCategory] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [timeLeft, setTimeLeft] = useState(9930); // 2h 45m 30s countdown

    const { loading: productLoading, error: productError, products = [] } = useSelector((state) => state.productList || {});
    const { wishlistItems = [] } = useSelector(state => state.wishlist || {});

    // Recently Viewed
    const [recentlyViewed, setRecentlyViewed] = useState([]);

    useEffect(() => {
        dispatch(listProducts({ limit: 40 }));
        const viewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
        setRecentlyViewed(viewed);
    }, [dispatch]);

    // Flash Sale Timer countdown
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => prev > 0 ? prev - 1 : 9930);
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

    const isWishlisted = (id) => wishlistItems.some(x => (x._id || x) === id);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/products?search=${searchQuery}`);
        }
    };

    // Filter products
    const filteredProducts = activeCategory
        ? products.filter(p => p.category?.toLowerCase().includes(activeCategory) || p.name?.toLowerCase().includes(activeCategory))
        : products;

    const bestSellers = useMemo(() => [...products].sort((a, b) => (b.numReviews || 0) - (a.numReviews || 0)).slice(0, 8), [products]);
    const trendingProducts = useMemo(() => [...products].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 8), [products]);
    const organicRice = useMemo(() => products.filter(p => p.category?.toLowerCase().includes('organic') || p.name?.toLowerCase().includes('organic')).slice(0, 8), [products]);
    const wholesaleRice = useMemo(() => products.filter(p => p.category?.toLowerCase().includes('bulk') || p.category?.toLowerCase().includes('wholesale') || (p.minQty && p.minQty > 10)).slice(0, 8), [products]);
    const todaysOffers = useMemo(() => products.filter(p => p.offerPrice && p.offerPrice < p.price).slice(0, 8), [products]);

    const renderProductRow = (title, subtitle, items, isFlashSale = false) => {
        if (items.length === 0) return null;
        return (
            <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="h5" fontWeight={800} color="#1F2937" sx={{ letterSpacing: '-0.02em' }}>
                            {title}
                        </Typography>
                        {isFlashSale && (
                            <Box sx={{ 
                                bgcolor: '#E65100', color: '#fff', px: 1.5, py: 0.5, 
                                borderRadius: '6px', fontSize: '0.85rem', fontWeight: 800,
                                fontFamily: 'monospace', letterSpacing: 0.5
                            }}>
                                {formatTime(timeLeft)}
                            </Box>
                        )}
                    </Box>
                    <IconButton size="small" onClick={() => navigate('/products')} sx={{ color: '#2E7D32' }}>
                        <ChevronRight />
                    </IconButton>
                </Box>

                <Box sx={{ 
                    display: 'flex', 
                    gap: 2, 
                    overflowX: 'auto', 
                    pb: 1.5, 
                    px: 0.5,
                    mx: -0.5,
                    '&::-webkit-scrollbar': { display: 'none' } 
                }}>
                    {items.map(product => {
                        const hasOffer = typeof product.offerPrice === 'number' && product.offerPrice > 0 && product.offerPrice < product.price;
                        const displayPrice = hasOffer ? product.offerPrice : product.price;
                        const discount = hasOffer ? Math.round((1 - product.offerPrice / product.price) * 100) : 0;
                        return (
                            <Box key={product._id} sx={{ width: 170, flexShrink: 0 }}>
                                <ProductCard
                                    product={{
                                        _id: product._id,
                                        name: product.name,
                                        image: getImageUrl(product.images?.[0] || product.image),
                                        price: displayPrice || 0,
                                        mrp: hasOffer ? product.price : null,
                                        discount: discount,
                                        rating: Number(product.rating || 0),
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
        <Box sx={{ bgcolor: '#F9FAFB', minHeight: '100vh', pb: 8 }}>
            
            {/* ── TOP BAR (Location & Notification) ── */}
            <Box sx={{ bgcolor: '#fff', px: 2, py: 1.5, borderBottom: '1px solid #F3F4F6' }}>
                <Container maxWidth="xl" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: '0 !important' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PinDrop sx={{ color: '#2E7D32' }} />
                        <Box>
                            <Typography sx={{ fontSize: '0.72rem', color: '#9CA3AF', fontWeight: 600 }}>DELIVER TO</Typography>
                            <Typography sx={{ fontSize: '0.9rem', fontWeight: 800, color: '#1F2937', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                Home <span style={{ fontSize: '0.6rem', color: '#2E7D32' }}>▼</span>
                            </Typography>
                        </Box>
                    </Box>
                    <IconButton onClick={() => navigate('/notifications')} sx={{ bgcolor: '#F9FAFB' }}>
                        <Notifications sx={{ color: '#1F2937' }} />
                    </IconButton>
                </Container>
            </Box>

            {/* ── SEARCH BAR ── */}
            <Box sx={{ bgcolor: '#fff', px: 2, py: 1.5, mb: 2 }}>
                <Container maxWidth="xl" sx={{ p: '0 !important' }}>
                    <form onSubmit={handleSearchSubmit}>
                        <Box sx={{ 
                            display: 'flex', alignItems: 'center', bgcolor: '#F3F4F6', 
                            height: 48, borderRadius: '24px', px: 2 
                        }}>
                            <Search sx={{ color: '#9CA3AF', mr: 1 }} />
                            <InputBase 
                                fullWidth
                                placeholder="Search basmati rice, organic grains, bulk packs..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                sx={{ fontSize: '0.9rem', fontWeight: 600 }}
                            />
                        </Box>
                    </form>
                </Container>
            </Box>

            <Container maxWidth="xl" sx={{ px: 2 }}>
                
                {/* ── HERO CAROUSEL ── */}
                <Box sx={{ mb: 4, borderRadius: '16px', overflow: 'hidden' }}>
                    <HeroBanner banners={BANNERS} autoPlayInterval={5000} />
                </Box>

                {/* ── CATEGORY SCROLL (80px Circular Icons) ── */}
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h6" fontWeight={800} color="#1F2937" sx={{ mb: 2, letterSpacing: '-0.02em' }}>
                        Shop by Category
                    </Typography>
                    <Box sx={{ 
                        display: 'flex', 
                        gap: 3, 
                        overflowX: 'auto', 
                        pb: 1, 
                        '&::-webkit-scrollbar': { display: 'none' }
                    }}>
                        <Box onClick={() => setActiveCategory('')} sx={{ textAlign: 'center', cursor: 'pointer', flexShrink: 0 }}>
                            <Box sx={{ 
                                width: 80, height: 80, borderRadius: '50%', bgcolor: '#E2E8F0',
                                display: 'flex', alignItems: 'center', justifyContext: 'center', justifyContent: 'center',
                                border: !activeCategory ? '3px solid #2E7D32' : '3px solid transparent',
                                transition: 'all 0.2s', mb: 1
                            }}>
                                <Typography fontSize={32}>🛒</Typography>
                            </Box>
                            <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: '#4B5563' }}>All Rice</Typography>
                        </Box>

                        {CATEGORIES.map(cat => (
                            <Box 
                                key={cat.id} 
                                onClick={() => setActiveCategory(activeCategory === cat.id ? '' : cat.id)} 
                                sx={{ textAlign: 'center', cursor: 'pointer', flexShrink: 0 }}
                            >
                                <Box sx={{ 
                                    width: 80, height: 80, borderRadius: '50%', bgcolor: cat.bg,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    border: activeCategory === cat.id ? `3px solid ${cat.color}` : '3px solid transparent',
                                    transition: 'all 0.2s', mb: 1
                                }}>
                                    <Typography fontSize={32}>{cat.emoji}</Typography>
                                </Box>
                                <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: '#4B5563' }}>{cat.name}</Typography>
                            </Box>
                        ))}
                    </Box>
                </Box>

                {/* Loading skeleton */}
                {productLoading ? (
                    <Box sx={{ mb: 4 }}>
                        <Grid container spacing={2}>
                            {[...Array(6)].map((_, i) => (
                                <Grid item xs={6} sm={4} md={3} lg={2} key={i}>
                                    <LoadingSkeleton type="product" />
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                ) : productError ? (
                    <Box sx={{ mb: 4 }}>
                        <EmptyState icon="⚠️" title="Oops!" description={productError} />
                    </Box>
                ) : (
                    <>
                        {/* ── FLASH SALE ROW ── */}
                        {renderProductRow("Flash Sale", "Grab offers before they close!", todaysOffers, true)}

                        {/* ── ACTIVE FILTER PRODUCTS IF CATEGORY SELECT ── */}
                        {activeCategory && (
                            <Box sx={{ mb: 4 }}>
                                <Typography variant="h5" fontWeight={800} color="#1F2937" sx={{ mb: 2 }}>
                                    Selected Collection
                                </Typography>
                                <Grid container spacing={2}>
                                    {filteredProducts.map(prod => (
                                        <Grid item xs={6} sm={4} md={3} key={prod._id}>
                                            <ProductCard
                                                product={{
                                                    _id: prod._id,
                                                    name: prod.name,
                                                    image: getImageUrl(prod.images?.[0] || prod.image),
                                                    price: prod.offerPrice || prod.price,
                                                    mrp: prod.offerPrice ? prod.price : null,
                                                    discount: prod.offerPrice ? Math.round((1 - prod.offerPrice / prod.price) * 100) : 0,
                                                    rating: Number(prod.rating || 0),
                                                    countInStock: prod.countInStock
                                                }}
                                                wishlisted={isWishlisted(prod._id)}
                                                onAddToCart={() => handleAddToCart(prod._id)}
                                                onToggleWishlist={() => handleAddToWishlist(prod._id)}
                                                onClick={() => navigate(`/products/${prod._id}`)}
                                            />
                                        </Grid>
                                    ))}
                                </Grid>
                            </Box>
                        )}

                        {/* ── BEST SELLERS ── */}
                        {renderProductRow("Best Sellers", "Most loved by our customers", bestSellers)}

                        {/* ── REFER BANNER ── */}
                        <Box sx={{ mb: 4 }}>
                            <Box sx={{
                                background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
                                borderRadius: '16px', p: 3,
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                border: '1px solid #D1FAE5',
                                boxShadow: '0 4px 16px rgba(46,125,50,0.04)'
                            }}>
                                <Box>
                                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: '#2E7D32', mb: 0.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>🎁 REFER & EARN</Typography>
                                    <Typography sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' }, fontWeight: 800, color: '#1F2937', lineHeight: 1.2, mb: 1.5 }}>
                                        Invite friends, get ₹100 inside your wallet!
                                    </Typography>
                                    <Box
                                        component="button"
                                        onClick={() => navigate('/settings/rewards')}
                                        sx={{
                                            background: '#2E7D32', color: '#fff', fontSize: '0.85rem', fontWeight: 700,
                                            py: 1, px: 3, borderRadius: 99, border: 'none', cursor: 'pointer',
                                            transition: 'transform 0.2s',
                                            '&:hover': { transform: 'translateY(-1px)' }
                                        }}
                                    >
                                        Invite Now
                                    </Box>
                                </Box>
                                <Typography sx={{ fontSize: { xs: 50, md: 80 }, display: { xs: 'none', sm: 'block' } }}>🤝</Typography>
                            </Box>
                        </Box>

                        {/* ── TRENDING PRODUCTS (2-column mobile, multi-column desktop) ── */}
                        {renderProductRow("Trending Products", "What's popular this week", trendingProducts)}

                        {/* ── ORGANIC COLLECTION ── */}
                        {renderProductRow("Organic Collection", "Pesticide-free grains", organicRice)}

                        {/* ── WHOLESALE / BULK ── */}
                        {renderProductRow("Wholesale Collection", "Save big on bulk orders", wholesaleRice)}

                        {/* ── RECENTLY VIEWED ── */}
                        {recentlyViewed.length > 0 && renderProductRow("Recently Viewed", "Based on your activity", recentlyViewed)}
                    </>
                )}
            </Container>
        </Box>
    );
};

export default Dashboard;
