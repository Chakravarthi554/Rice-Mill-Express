import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Box, Container, Grid, Typography, IconButton, InputBase, Paper, Chip, Button, Badge } from '@mui/material';
import { 
  PinDrop, Notifications, Search, ShoppingBag, 
  Favorite, LocalOffer, Person, ChevronRight, Home, ListAlt, ShoppingCart
} from '@mui/icons-material';

// Redux Actions
import { listProducts } from '../../redux/actions/productActions';
import { addToCart } from '../../redux/actions/cartActions';
import { addToWishlist } from '../../redux/actions/userActions';
import { listMyCart } from '../../redux/actions/cartActions';

// Premium UI Components
import HeroBanner from '../ui/HeroBanner';
import ProductCard from '../ui/ProductCard';
import EmptyState from '../ui/EmptyState';
import LoadingSkeleton from '../ui/LoadingSkeleton';

// Utils
import { getImageUrl } from '../../utils/urlHelper';

// Theme & Tokens
import { spacing, colors, tints } from '../../theme/designTokens';

const CATEGORIES = [
    { id: 'basmati', name: 'Basmati', emoji: '🍚', bg: '#FFF7ED', color: '#E65100' },
    { id: 'sona', name: 'Sona', emoji: '🌾', bg: '#F0FDF4', color: '#2E7D32' },
    { id: 'organic', name: 'Organic', emoji: '🍃', bg: '#E0F2FE', status: 'new' },
    { id: 'bulk', name: 'Bulk', emoji: '📦', bg: '#FEF3C7' },
    { id: 'premium', name: 'Premium', emoji: '⭐', bg: '#FCE7F3' },
];

const Dashboard = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    
    const [activeCategory, setActiveCategory] = useState('sona');
    const [searchQuery, setSearchQuery] = useState('');
    const [timeLeft, setTimeLeft] = useState(7942); // 2h 12m 22s as in the new mockup

    const { loading: productLoading, error: productError, products = [] } = useSelector((state) => state.productList || {});
    const { wishlistItems = [] } = useSelector(state => state.wishlist || {});
    const { cartItems = [] } = useSelector(state => state.cart || {});

    useEffect(() => {
        dispatch(listProducts({ limit: 40 }));
        dispatch(listMyCart());
    }, [dispatch]);

    // Flash Sale countdown
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

    // Derived collections mapped to mockup lists
    const flashSaleProducts = useMemo(() => {
        return products.filter(p => p.offerPrice && p.offerPrice < p.price).slice(0, 4);
    }, [products]);

    const buyAgainProducts = useMemo(() => {
        return [...products].sort((a, b) => (b.numReviews || 0) - (a.numReviews || 0)).slice(0, 4);
    }, [products]);

    const recommendedProducts = useMemo(() => {
        return [...products].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 6);
    }, [products]);

    // Mock products fallback matching Image 1
    const mockFlashSale = [
        { _id: 'fs-1', name: 'Sona Masoori 25kg', price: 1200, mrp: 1500, discount: 20, rating: 4.5, countInStock: 10, image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=150&q=80' },
        { _id: 'fs-2', name: 'Basmati Gold Premium 10kg', price: 950, mrp: 1100, discount: 15, rating: 4.8, countInStock: 5, image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=150&q=80' }
    ];

    const mockBuyAgain = [
        { _id: 'ba-1', name: 'Royal Basmati Rice 5kg', price: 850, rating: 4.7, countInStock: 20, image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=150&q=80' },
        { _id: 'ba-2', name: 'Idli Rice 10kg', price: 620, rating: 4.3, countInStock: 15, image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=150&q=80' }
    ];

    const mockRecommended = [
        { _id: 'rc-1', name: 'Organic Brown Rice', price: 900, rating: 4.5, countInStock: 8, image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=150&q=80' },
        { _id: 'rc-2', name: 'Ponni Rice 10kg', price: 1100, rating: 4.5, countInStock: 12, image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=150&q=80' }
    ];

    const finalFlashSale = flashSaleProducts.length > 0 ? flashSaleProducts : mockFlashSale;
    const finalBuyAgain = buyAgainProducts.length > 0 ? buyAgainProducts : mockBuyAgain;
    const finalRecommended = recommendedProducts.length > 0 ? recommendedProducts : mockRecommended;

    return (
        <Box sx={{ bgcolor: '#F9FAFB', minHeight: '100vh', pb: 12 }}>
            
            {/* ── TOP BAR (Vijayawada location) ── */}
            <Box sx={{ bgcolor: '#fff', px: 2.5, py: 2, borderBottom: '1px solid #F3F4F6' }}>
                <Container maxWidth="xl" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: '0 !important' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PinDrop sx={{ color: '#16A34A', fontSize: 24 }} />
                        <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: '#1F2937', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            Vijayawada <span style={{ fontSize: '0.65rem', color: '#6B7280' }}>▼</span>
                        </Typography>
                    </Box>
                    <IconButton onClick={() => navigate('/notifications')} sx={{ bgcolor: '#F3F4F6', p: 1 }}>
                        <Notifications sx={{ color: '#1F2937', fontSize: 20 }} />
                    </IconButton>
                </Container>
            </Box>

            {/* ── SEARCH BAR ── */}
            <Box sx={{ bgcolor: '#fff', px: 2.5, py: 1.5, mb: 2 }}>
                <Container maxWidth="xl" sx={{ p: '0 !important' }}>
                    <form onSubmit={handleSearchSubmit}>
                        <Box sx={{ 
                            display: 'flex', alignItems: 'center', bgcolor: '#F3F4F6', 
                            height: 48, borderRadius: '12px', px: 2 
                        }}>
                            <Search sx={{ color: '#9CA3AF', mr: 1 }} />
                            <InputBase 
                                fullWidth
                                placeholder="Search rice, brands, 25kg..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                sx={{ fontSize: '0.9rem', fontWeight: 600, color: '#1F2937' }}
                            />
                        </Box>
                    </form>
                </Container>
            </Box>

            <Container maxWidth="xl" sx={{ px: 2 }}>
                
                {/* ── CATEGORY SCROLL (Circular category badges) ── */}
                <Box sx={{ mb: 3 }}>
                    <Box sx={{ 
                        display: 'flex', 
                        gap: 2.5, 
                        overflowX: 'auto', 
                        pb: 1.5, 
                        '&::-webkit-scrollbar': { display: 'none' }
                    }}>
                        {CATEGORIES.map(cat => (
                            <Box 
                                key={cat.id} 
                                onClick={() => setActiveCategory(activeCategory === cat.id ? '' : cat.id)} 
                                sx={{ textAlign: 'center', cursor: 'pointer', flexShrink: 0 }}
                            >
                                <Box sx={{ 
                                    width: 72, height: 72, borderRadius: '50%', bgcolor: cat.bg,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    border: activeCategory === cat.id ? '2.5px solid #16A34A' : '2.5px solid transparent',
                                    transition: 'all 0.2s', mb: 1,
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                                }}>
                                    <Typography fontSize={32}>{cat.emoji}</Typography>
                                </Box>
                                <Typography sx={{ 
                                    fontSize: '0.78rem', 
                                    fontWeight: activeCategory === cat.id ? 800 : 600, 
                                    color: activeCategory === cat.id ? '#16A34A' : '#4B5563' 
                                }}>
                                    {cat.name}
                                </Typography>
                                {activeCategory === cat.id && (
                                    <Box sx={{ width: 16, height: 3, bgcolor: '#16A34A', mx: 'auto', mt: 0.5, borderRadius: 1 }} />
                                )}
                            </Box>
                        ))}
                    </Box>
                </Box>

                {/* ── PROMO BANNER ── */}
                <Box sx={{ mb: 4 }}>
                    <Box sx={{
                        background: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 50%, #4CAF50 100%)',
                        borderRadius: '16px', p: 2.5,
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        border: '1px solid rgba(255,255,255,0.1)',
                        boxShadow: '0 8px 24px rgba(46,125,50,0.15)',
                        color: '#fff',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <Box sx={{ zIndex: 2 }}>
                            <Typography sx={{ fontSize: '1.625rem', fontWeight: 900, lineHeight: 1.1 }}>
                                <span style={{ color: '#FBBF24' }}>20% OFF</span> ON BULK ORDERS
                            </Typography>
                            <Button 
                                variant="contained" 
                                size="small"
                                onClick={() => navigate('/products')}
                                sx={{ 
                                    mt: 2, bgcolor: '#FBBF24', color: '#1B5E20', fontWeight: 800,
                                    borderRadius: '20px', textTransform: 'none', px: 2, py: 0.6,
                                    '&:hover': { bgcolor: '#F59E0B' }, fontSize: '0.75rem'
                                }}
                            >
                                Shop Now &gt;
                            </Button>
                        </Box>
                        
                        {/* Rice bag mock art */}
                        <Box sx={{ fontSize: 72, display: 'flex', alignItems: 'center', opacity: 0.85, zIndex: 1 }}>
                            🌾
                        </Box>
                    </Box>
                </Box>

                {/* Loading states */}
                {productLoading ? (
                    <Box sx={{ mb: 4 }}>
                        <Grid container spacing={2}>
                            {[...Array(4)].map((_, i) => (
                                <Grid item xs={6} key={i}>
                                    <LoadingSkeleton type="product" />
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                ) : (
                    <>
                        {/* ── FLASH SALE ROW (Horizontal Cards) ── */}
                        <Box sx={{ mb: 4 }}>
                            <Box display="flex" alignItems="center" gap={1.5} mb={2}>
                                <Typography variant="h6" fontWeight={800} color="#1F2937" sx={{ letterSpacing: '-0.02em' }}>
                                    Flash Sale
                                </Typography>
                                <Box sx={{ 
                                    bgcolor: '#E65100', color: '#fff', px: 1, py: 0.25, 
                                    borderRadius: '6px', fontSize: '0.8rem', fontWeight: 800,
                                    display: 'flex', alignItems: 'center', gap: 0.5, fontFamily: 'monospace'
                                }}>
                                    ⏰ {formatTime(timeLeft)}
                                </Box>
                            </Box>

                            <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 1, '&::-webkit-scrollbar': { display: 'none' } }}>
                                {finalFlashSale.map((prod) => (
                                    <Box key={prod._id} sx={{ minWidth: 260, width: 280, flexShrink: 0 }}>
                                        <ProductCard
                                            product={{
                                                _id: prod._id,
                                                name: prod.name,
                                                image: getImageUrl(prod.images?.[0] || prod.image),
                                                price: prod.offerPrice || prod.price,
                                                mrp: prod.offerPrice ? prod.price : null,
                                                discount: prod.offerPrice ? Math.round((1 - prod.offerPrice / prod.price) * 100) : prod.discount,
                                                rating: Number(prod.rating || 0),
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

                        {/* ── BUY AGAIN ROW (Horizontal Cards) ── */}
                        <Box sx={{ mb: 4 }}>
                            <Typography variant="h6" fontWeight={800} color="#1F2937" sx={{ mb: 2, letterSpacing: '-0.02em' }}>
                                Buy Again
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 1, '&::-webkit-scrollbar': { display: 'none' } }}>
                                {finalBuyAgain.map((prod) => (
                                    <Box key={prod._id} sx={{ minWidth: 260, width: 280, flexShrink: 0 }}>
                                        <ProductCard
                                            product={{
                                                _id: prod._id,
                                                name: prod.name,
                                                image: getImageUrl(prod.images?.[0] || prod.image),
                                                price: prod.price,
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

                        {/* ── RECOMMENDED FOR YOU (2-Column Vertical Cards) ── */}
                        <Box sx={{ mb: 4 }}>
                            <Typography variant="h6" fontWeight={800} color="#1F2937" sx={{ mb: 2, letterSpacing: '-0.02em' }}>
                                Recommended for You
                            </Typography>
                            <Grid container spacing={2}>
                                {finalRecommended.map((prod) => (
                                    <Grid item xs={6} sm={4} md={2} key={prod._id}>
                                        <ProductCard
                                            product={{
                                                _id: prod._id,
                                                name: prod.name,
                                                image: getImageUrl(prod.images?.[0] || prod.image),
                                                price: prod.offerPrice || prod.price,
                                                mrp: prod.offerPrice ? prod.price : null,
                                                discount: prod.offerPrice ? Math.round((1 - prod.offerPrice / prod.price) * 100) : prod.discount,
                                                rating: Number(prod.rating || 0),
                                                countInStock: prod.countInStock
                                            }}
                                            layout="vertical"
                                            wishlisted={isWishlisted(prod._id)}
                                            onAddToCart={() => handleAddToCart(prod._id)}
                                            onToggleWishlist={() => handleAddToWishlist(prod._id)}
                                            onClick={() => navigate(`/products/${prod._id}`)}
                                        />
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>
                    </>
                )}
            </Container>

            {/* ── STICKY BOTTOM NAVIGATION BAR (Image 1 replica) ── */}
            <Paper 
                elevation={10} 
                sx={{ 
                    position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000,
                    height: 64, borderTop: '1px solid #E5E7EB', display: 'flex', 
                    justifyContent: 'space-around', alignItems: 'center', bgcolor: '#fff'
                }}
            >
                <IconButton onClick={() => navigate('/customer/dashboard')} sx={{ display: 'flex', flexDirection: 'column', color: '#16A34A', py: 0.5 }}>
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

export default Dashboard;
