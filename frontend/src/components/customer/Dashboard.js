// [Premium Figma-level Redesign — Customer Dashboard (Web)]
// Design: Amazon/Zepto premium product grid with green brand identity
import React, { useState, useEffect } from 'react';
import { listProducts } from '../../redux/actions/productActions';
import { useNavigate } from 'react-router-dom';
import Loader from '../common/Loader';
import { useSelector, useDispatch } from 'react-redux';
import { addToCart } from '../../redux/actions/cartActions';
import { addToWishlist } from '../../redux/actions/userActions';
import Price from '../common/Price';
import { useTranslation } from 'react-i18next';

const CATEGORIES = [
    { id: 'basmati', name: 'Basmati Rice', emoji: '🍚', bg: '#FFF7ED', color: '#EA580C' },
    { id: 'sona', name: 'Sona Masoori', emoji: '🌾', bg: '#F0FDF4', color: '#16A34A' },
    { id: 'kolam', name: 'Kolam Rice', emoji: '🥣', bg: '#EFF6FF', color: '#3B82F6' },
    { id: 'brown', name: 'Brown Rice', emoji: '🌿', bg: '#F5F3FF', color: '#7C3AED' },
    { id: 'organic', name: 'Organic', emoji: '🍃', bg: '#F0FDF4', color: '#16A34A' },
    { id: 'bulk', name: 'Wholesale', emoji: '📦', bg: '#FEFCE8', color: '#CA8A04' },
];

const BANNERS = [
    { id: 1, title: 'Festival Special', sub: '20% OFF on Bulk Basmati Orders!', cta: 'Shop Now', bg: 'linear-gradient(135deg, #F97316 0%, #FB923C 100%)', emoji: '🎉' },
    { id: 2, title: 'New Harvest Season', sub: 'Fresh Sona Masoori just arrived!', cta: 'Explore Now', bg: 'linear-gradient(135deg, #16A34A 0%, #22C55E 100%)', emoji: '🌾' },
    { id: 3, title: 'Free Delivery', sub: 'On all orders above ₹500!', cta: 'Order Now', bg: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)', emoji: '🚚' },
];

function useCountdown(seconds) {
    const [timeLeft, setTimeLeft] = useState(seconds);
    useEffect(() => {
        const interval = setInterval(() => setTimeLeft(t => t > 0 ? t - 1 : 0), 1000);
        return () => clearInterval(interval);
    }, []);
    const h = String(Math.floor(timeLeft / 3600)).padStart(2, '0');
    const m = String(Math.floor((timeLeft % 3600) / 60)).padStart(2, '0');
    const s = String(timeLeft % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
}

const Dashboard = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const [activeCategory, setActiveCategory] = useState('');
    const [activeBanner, setActiveBanner] = useState(0);
    const flashTimer = useCountdown(2 * 3600 + 14 * 60 + 22);

    const { loading: productLoading, error: productError, products = [] } = useSelector((state) => state.productList || {});
    const { wishlistItems = [] } = useSelector(state => state.wishlist || {});

    useEffect(() => {
        if (!products || products.length === 0) dispatch(listProducts());
    }, [dispatch, products]);

    useEffect(() => {
        const interval = setInterval(() => setActiveBanner(p => (p + 1) % BANNERS.length), 4000);
        return () => clearInterval(interval);
    }, []);

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

    const styles = {
        wrapper: { padding: '0' },

        // Banner
        bannerSection: { marginBottom: 32 },
        bannerTrack: { display: 'flex', gap: 16, overflow: 'hidden' },
        banner: {
            flex: 1, minHeight: 220, borderRadius: 24, padding: '32px 36px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            position: 'relative', overflow: 'hidden', cursor: 'pointer',
        },
        bannerLeft: { flex: 1 },
        bannerSmallBanners: { display: 'flex', flexDirection: 'column', gap: 16, width: 260 },
        smBanner: {
            flex: 1, borderRadius: 20, padding: '18px 22px',
            display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer',
        },
        bannerBadge: { display: 'inline-block', background: 'rgba(255,255,255,0.25)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 12px', borderRadius: 99, marginBottom: 10 },
        bannerTitle: { fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.85)', marginBottom: 6 },
        bannerSubtitle: { fontSize: 26, fontWeight: 800, color: '#fff', lineHeight: 1.3, marginBottom: 18 },
        bannerCta: { display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff', color: '#111827', fontSize: 14, fontWeight: 800, padding: '10px 22px', borderRadius: 99, border: 'none', cursor: 'pointer' },
        bannerEmoji: { fontSize: 80, lineHeight: 1 },

        // Categories
        catSection: { marginBottom: 28 },
        catRow: { display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8 },
        catItem: (active, color, bg) => ({
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
            cursor: 'pointer', flexShrink: 0, minWidth: 88,
        }),
        catCircle: (active, color, bg) => ({
            width: 72, height: 72, borderRadius: '50%', background: active ? bg : '#F9FAFB',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
            border: `2px solid ${active ? color : 'transparent'}`,
            transition: 'all 0.2s ease',
            boxShadow: active ? `0 4px 12px ${color}30` : 'none',
        }),
        catLabel: (active) => ({ fontSize: 12, fontWeight: active ? 700 : 500, color: active ? '#111827' : '#6B7280', textAlign: 'center', whiteSpace: 'nowrap' }),

        // Section
        section: { marginBottom: 32 },
        sectionHeader: { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 20 },
        sectionTitle: { fontSize: 22, fontWeight: 800, color: '#111827', letterSpacing: -0.5 },
        sectionSub: { fontSize: 13, color: '#9CA3AF', marginTop: 4 },
        timerPill: { display: 'flex', alignItems: 'center', gap: 6, background: '#FEF2F2', padding: '6px 14px', borderRadius: 99 },
        timerText: { fontSize: 14, fontWeight: 800, color: '#EF4444', fontVariantNumeric: 'tabular-nums' },

        // Product grid
        productGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 },
        horizontalScroll: { display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 8 },

        // Product card
        productCard: {
            background: '#fff', borderRadius: 20, border: '1px solid #F3F4F6',
            overflow: 'hidden', cursor: 'pointer', transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        },
        imgWrap: { position: 'relative', height: 200, background: '#F0FDF4', overflow: 'hidden' },
        img: { width: '100%', height: '100%', objectFit: 'cover' },
        imgFallback: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', fontSize: 48 },
        discountBadge: { position: 'absolute', top: 12, left: 12, background: '#F97316', color: '#fff', fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 8 },
        heartBtn: { position: 'absolute', top: 10, right: 10, width: 32, height: 32, borderRadius: 16, background: 'rgba(255,255,255,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
        ratingPill: { position: 'absolute', bottom: 10, left: 10, background: 'rgba(255,255,255,0.96)', padding: '3px 8px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 3, boxShadow: '0 2px 6px rgba(0,0,0,0.08)', fontSize: 11, fontWeight: 800, color: '#111827' },
        cardBody: { padding: '14px 14px 14px' },
        productName: { fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 4, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
        productWeight: { fontSize: 12, color: '#9CA3AF', marginBottom: 12, fontWeight: 500 },
        priceRow: { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' },
        priceBlock: {},
        offerPrice: { fontSize: 17, fontWeight: 800, color: '#111827' },
        mrpPrice: { fontSize: 12, color: '#D1D5DB', textDecoration: 'line-through', marginTop: 2 },
        addBtn: {
            display: 'flex', alignItems: 'center', gap: 4, background: '#16A34A',
            color: '#fff', fontSize: 13, fontWeight: 800, padding: '8px 14px', borderRadius: 99,
            border: 'none', cursor: 'pointer', boxShadow: '0 3px 8px rgba(22,163,74,0.25)',
            transition: 'all 0.2s',
        },

        // Mid banner
        midBanner: { background: '#F0FDF4', borderRadius: 24, padding: '28px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, border: '1px solid #D1FAE5' },
        midBannerLeft: {},
        midBannerTag: { fontSize: 13, fontWeight: 700, color: '#16A34A', marginBottom: 8 },
        midBannerTitle: { fontSize: 26, fontWeight: 800, color: '#111827', lineHeight: 1.3, marginBottom: 16 },
        midBannerBtn: { background: '#16A34A', color: '#fff', fontSize: 14, fontWeight: 700, padding: '12px 24px', borderRadius: 99, border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(22,163,74,0.25)' },

        // Dot indicators
        dots: { display: 'flex', gap: 6, justifyContent: 'center', marginTop: 12 },
        dot: (active) => ({ width: active ? 20 : 6, height: 6, borderRadius: 3, background: active ? '#16A34A' : '#D1D5DB', transition: 'all 0.3s' }),

        // Empty state
        emptyState: { textAlign: 'center', padding: '60px 24px', background: '#fff', borderRadius: 20, border: '1px dashed #E5E7EB' },
    };

    return (
        <div style={styles.wrapper}>

            {/* ── HERO BANNERS ── */}
            <div style={styles.bannerSection}>
                <div style={{ display: 'flex', gap: 16 }}>
                    {/* Main banner */}
                    <div
                        style={{ ...styles.banner, background: BANNERS[activeBanner].bg, flex: 2 }}
                    >
                        <div style={styles.bannerLeft}>
                            <div style={styles.bannerBadge}>Limited Offer</div>
                            <div style={styles.bannerTitle}>{BANNERS[activeBanner].title}</div>
                            <div style={styles.bannerSubtitle}>{BANNERS[activeBanner].sub}</div>
                            <button style={styles.bannerCta}>{BANNERS[activeBanner].cta} →</button>
                        </div>
                        <div style={styles.bannerEmoji}>{BANNERS[activeBanner].emoji}</div>
                    </div>

                    {/* Side banners */}
                    <div style={styles.bannerSmallBanners}>
                        <div style={{ ...styles.smBanner, background: 'linear-gradient(135deg, #FEFCE8, #FEF3C7)', flex: 1 }}>
                            <span style={{ fontSize: 36 }}>⭐</span>
                            <div>
                                <div style={{ fontSize: 14, fontWeight: 800, color: '#92400E' }}>Reward Points</div>
                                <div style={{ fontSize: 12, color: '#B45309', marginTop: 4 }}>Earn on every order</div>
                            </div>
                        </div>
                        <div style={{ ...styles.smBanner, background: 'linear-gradient(135deg, #F0FDF4, #D1FAE5)', flex: 1 }}>
                            <span style={{ fontSize: 36 }}>🎁</span>
                            <div>
                                <div style={{ fontSize: 14, fontWeight: 800, color: '#166534' }}>Refer & Earn</div>
                                <div style={{ fontSize: 12, color: '#16A34A', marginTop: 4 }}>₹50 per friend</div>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Dots */}
                <div style={styles.dots}>
                    {BANNERS.map((_, i) => <div key={i} style={styles.dot(activeBanner === i)} onClick={() => setActiveBanner(i)} />)}
                </div>
            </div>

            {/* ── CATEGORIES ── */}
            <div style={styles.catSection}>
                <div style={styles.catRow}>
                    <div
                        style={{ ...styles.catItem(), cursor: 'pointer' }}
                        onClick={() => setActiveCategory('')}
                    >
                        <div style={{ ...styles.catCircle(!activeCategory, '#16A34A', '#F0FDF4') }}>
                            <span style={{ fontSize: 28 }}>🛒</span>
                        </div>
                        <span style={styles.catLabel(!activeCategory)}>All</span>
                    </div>
                    {CATEGORIES.map(cat => (
                        <div
                            key={cat.id}
                            style={styles.catItem(activeCategory === cat.id, cat.color, cat.bg)}
                            onClick={() => setActiveCategory(activeCategory === cat.id ? '' : cat.id)}
                        >
                            <div style={styles.catCircle(activeCategory === cat.id, cat.color, cat.bg)}>
                                <span style={{ fontSize: 28 }}>{cat.emoji}</span>
                            </div>
                            <span style={styles.catLabel(activeCategory === cat.id)}>{cat.name}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── DEALS OF THE DAY ── */}
            {!productLoading && !productError && filteredProducts.length > 0 && (
                <div style={styles.section}>
                    <div style={styles.sectionHeader}>
                        <div>
                            <div style={styles.sectionTitle}>Deals of the Day</div>
                            <div style={styles.sectionSub}>Best prices, grab before time runs out</div>
                        </div>
                        <div style={styles.timerPill}>
                            <span>⏱</span>
                            <span style={styles.timerText}>{flashTimer}</span>
                        </div>
                    </div>
                    <div style={styles.horizontalScroll}>
                        {filteredProducts.slice(0, 6).map(product => {
                            const hasOffer = typeof product.offerPrice === 'number' && product.offerPrice > 0 && product.offerPrice < product.price;
                            const displayPrice = hasOffer ? product.offerPrice : product.price;
                            const discount = hasOffer ? Math.round((1 - product.offerPrice / product.price) * 100) : 0;
                            const rating = product.rating || (Math.random() * 1 + 4).toFixed(1);
                            return (
                                <div
                                    key={product._id}
                                    style={{ ...styles.productCard, minWidth: 200 }}
                                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,0.08)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'; }}
                                    onClick={() => navigate(`/products/${product._id}`)}
                                >
                                    <div style={{ ...styles.imgWrap, height: 160 }}>
                                        {product.images?.[0]
                                            ? <img src={product.images[0]} alt={product.name} style={styles.img} />
                                            : <div style={styles.imgFallback}>🌾</div>
                                        }
                                        {discount > 0 && <div style={styles.discountBadge}>{discount}% OFF</div>}
                                        <div style={styles.ratingPill}><span>⭐</span> {Number(rating).toFixed(1)}</div>
                                    </div>
                                    <div style={styles.cardBody}>
                                        <div style={styles.productName}>{product.name}</div>
                                        <div style={styles.productWeight}>{product.weight || 1} {product.unit || 'kg'}</div>
                                        <div style={styles.priceRow}>
                                            <div>
                                                <div style={styles.offerPrice}><Price amount={displayPrice || 0} /></div>
                                                {hasOffer && <div style={styles.mrpPrice}><Price amount={product.price || 0} /></div>}
                                            </div>
                                            <button
                                                style={styles.addBtn}
                                                onClick={e => { e.stopPropagation(); handleAddToCart(product._id); }}
                                                onMouseEnter={e => e.currentTarget.style.background = '#15803D'}
                                                onMouseLeave={e => e.currentTarget.style.background = '#16A34A'}
                                            >
                                                + Add
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── REFER BANNER ── */}
            <div style={styles.midBanner}>
                <div style={styles.midBannerLeft}>
                    <div style={styles.midBannerTag}>🎁 Refer & Earn Program</div>
                    <div style={styles.midBannerTitle}>Invite friends,<br />earn ₹50 rewards each!</div>
                    <button style={styles.midBannerBtn} onClick={() => navigate('/settings/rewards')}>
                        Invite Friends →
                    </button>
                </div>
                <span style={{ fontSize: 80 }}>🤝</span>
            </div>

            {/* ── ALL PRODUCTS ── */}
            <div style={styles.section}>
                <div style={styles.sectionHeader}>
                    <div>
                        <div style={styles.sectionTitle}>
                            {activeCategory ? `${CATEGORIES.find(c => c.id === activeCategory)?.name || 'Results'}` : 'Recommended For You'}
                        </div>
                        <div style={styles.sectionSub}>{filteredProducts.length} products available</div>
                    </div>
                </div>

                {productLoading ? (
                    <Loader />
                ) : productError ? (
                    <div style={{ padding: 24, textAlign: 'center', color: '#EF4444', background: '#FEF2F2', borderRadius: 16 }}>{productError}</div>
                ) : filteredProducts.length > 0 ? (
                    <div style={styles.productGrid}>
                        {filteredProducts.map(product => {
                            const hasOffer = typeof product.offerPrice === 'number' && product.offerPrice > 0 && product.offerPrice < product.price;
                            const displayPrice = hasOffer ? product.offerPrice : product.price;
                            const discount = hasOffer ? Math.round((1 - product.offerPrice / product.price) * 100) : 0;
                            const rating = product.rating || (Math.random() * 1 + 4).toFixed(1);
                            const wishlisted = isWishlisted(product._id);
                            return (
                                <div
                                    key={product._id}
                                    style={styles.productCard}
                                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,0.08)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'; }}
                                    onClick={() => navigate(`/products/${product._id}`)}
                                >
                                    <div style={styles.imgWrap}>
                                        {product.images?.[0]
                                            ? <img src={product.images[0]} alt={product.name} style={styles.img} />
                                            : <div style={styles.imgFallback}>🌾</div>
                                        }
                                        {discount > 0 && <div style={styles.discountBadge}>{discount}% OFF</div>}
                                        <button
                                            style={{ ...styles.heartBtn, color: wishlisted ? '#EF4444' : '#9CA3AF' }}
                                            onClick={e => { e.stopPropagation(); handleAddToWishlist(product._id); }}
                                        >
                                            {wishlisted ? '❤️' : '🤍'}
                                        </button>
                                        <div style={styles.ratingPill}><span>⭐</span> {Number(rating).toFixed(1)}</div>
                                    </div>
                                    <div style={styles.cardBody}>
                                        <div style={styles.productName}>{product.name}</div>
                                        <div style={styles.productWeight}>{product.weight || 1} {product.unit || 'kg'} • Standard Delivery</div>
                                        <div style={styles.priceRow}>
                                            <div>
                                                <div style={styles.offerPrice}><Price amount={displayPrice || 0} /></div>
                                                {hasOffer && <div style={styles.mrpPrice}><Price amount={product.price || 0} /></div>}
                                            </div>
                                            <button
                                                style={styles.addBtn}
                                                onClick={e => { e.stopPropagation(); handleAddToCart(product._id); }}
                                                onMouseEnter={e => e.currentTarget.style.background = '#15803D'}
                                                onMouseLeave={e => e.currentTarget.style.background = '#16A34A'}
                                            >
                                                + Add
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div style={styles.emptyState}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 8 }}>No products found</div>
                        <div style={{ fontSize: 14, color: '#9CA3AF' }}>Try browsing a different category</div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;