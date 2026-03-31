// [Premium Figma-level Redesign — HomeScreen]
// Design: Zepto/Swiggy/Amazon eCommerce aesthetic
// Green brand: #16A34A | Orange accent: #F97316
import React, { useEffect, useState, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Image,
    ActivityIndicator, RefreshControl, TextInput, SafeAreaView,
    ScrollView, StatusBar, Animated, Dimensions,
} from 'react-native';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { apiService } from '../../services/api';
import { addToWishlist, removeFromWishlist, getWishlist } from '../../redux/actions/wishlistActions';
import { addToCart, getCart } from '../../redux/actions/cartActions';
import { API_URL } from '../../config/env';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CATEGORIES = [
    { id: 'basmati', name: 'Basmati\nRice', emoji: '🍚', bg: '#FFF7ED', color: '#EA580C' },
    { id: 'sona', name: 'Sona\nMasoori', emoji: '🌾', bg: '#F0FDF4', color: '#16A34A' },
    { id: 'kolam', name: 'Kolam\nRice', emoji: '🥣', bg: '#EFF6FF', color: '#3B82F6' },
    { id: 'brown', name: 'Brown\nRice', emoji: '🌿', bg: '#F5F3FF', color: '#7C3AED' },
    { id: 'organic', name: 'Organic', emoji: '🍃', bg: '#F0FDF4', color: '#16A34A' },
    { id: 'bulk', name: 'Bulk\nBuy', emoji: '📦', bg: '#FEFCE8', color: '#CA8A04' },
];

const BANNERS = [
    {
        id: 1,
        title: 'Festival Special',
        subtitle: '20% OFF on Bulk\nBasmati Orders!',
        cta: 'Shop Now',
        bg: ['#F97316', '#FB923C'],
        emoji: '🎉',
    },
    {
        id: 2,
        title: 'New Harvest',
        subtitle: 'Fresh Sona Masoori\njust arrived!',
        cta: 'Explore',
        bg: ['#16A34A', '#22C55E'],
        emoji: '🌾',
    },
    {
        id: 3,
        title: 'Free Delivery',
        subtitle: 'On orders above\n₹500!',
        cta: 'Order Now',
        bg: ['#4F46E5', '#6366F1'],
        emoji: '🚚',
    },
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

export default function HomeScreen({ navigation }) {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('');
    const [userAddress, setUserAddress] = useState(null);
    const [activeBanner, setActiveBanner] = useState(0);
    const dispatch = useDispatch();
    const flashTimer = useCountdown(2 * 3600 + 14 * 60 + 22);
    const bannerScrollRef = useRef(null);
    const bannerAnim = useRef(new Animated.Value(0)).current;

    const wishlist = useSelector(state => state.wishlist);
    const { wishlistItems = [] } = wishlist || {};
    const cart = useSelector(state => state.cart);
    const cartCount = (cart?.cartItems || []).reduce((s, i) => s + (i.qty || 1), 0);

    useEffect(() => { fetchEverything(); dispatch(getWishlist()); dispatch(getCart()); }, [dispatch]);

    // Auto-scroll banners
    useEffect(() => {
        const interval = setInterval(() => {
            setActiveBanner(prev => {
                const next = (prev + 1) % BANNERS.length;
                bannerScrollRef.current?.scrollTo({ x: next * (SCREEN_WIDTH - 32), animated: true });
                return next;
            });
        }, 3500);
        return () => clearInterval(interval);
    }, []);

    const fetchEverything = async () => {
        try {
            setLoading(true);
            const response = await apiService.getProducts();
            setProducts(response.data.products || []);
            const addrRes = await apiService.getAddresses();
            if (addrRes.data && addrRes.data.length > 0) {
                setUserAddress(addrRes.data[0]);
            }
        } catch (e) {
            console.error('Error fetching data:', e);
        } finally { setLoading(false); setRefreshing(false); }
    };

    const onRefresh = () => { setRefreshing(true); fetchEverything(); };

    const isWishlisted = (id) => wishlistItems.some(x => (x._id || x) === id);
    const toggleWishlist = (product) => {
        if (isWishlisted(product._id)) dispatch(removeFromWishlist(product._id));
        else dispatch(addToWishlist(product._id));
    };

    const handleAddToCart = (productId) => dispatch(addToCart(productId, 1));
    const handleNavigation = (id) => navigation.navigate('ProductDetail', { productId: id });

    const sortedProducts = [...products].sort((a, b) => {
        if (!activeCategory) return 0;
        const isACat = a.category?.toLowerCase() === activeCategory.toLowerCase() || a.name?.toLowerCase().includes(activeCategory.toLowerCase());
        const isBCat = b.category?.toLowerCase() === activeCategory.toLowerCase() || b.name?.toLowerCase().includes(activeCategory.toLowerCase());
        if (isACat && !isBCat) return -1;
        if (!isACat && isBCat) return 1;
        return 0;
    });

    const filteredProducts = sortedProducts.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const getImageUri = (item) => {
        const img = item.images?.[0];
        if (!img) return null;
        return img.startsWith('http') ? img : `${API_URL}${img}`;
    };

    const renderProductCard = (item, compact = false) => {
        const imageUri = getImageUri(item);
        const hasOffer = typeof item.offerPrice === 'number' && item.offerPrice > 0 && item.offerPrice < item.price;
        const displayPrice = hasOffer ? item.offerPrice : item.price;
        const discount = hasOffer ? Math.round((1 - item.offerPrice / item.price) * 100) : 0;
        const rating = item.rating || (Math.random() * (5.0 - 4.0) + 4.0).toFixed(1);
        const wishlisted = isWishlisted(item._id);

        return (
            <TouchableOpacity
                key={item._id}
                style={compact ? styles.compactCard : styles.productCard}
                onPress={() => handleNavigation(item._id)}
                activeOpacity={0.92}
            >
                <View style={compact ? styles.compactImgWrap : styles.productImgWrap}>
                    {imageUri
                        ? <Image source={{ uri: imageUri }} style={styles.img} />
                        : <View style={styles.fallbackImg}><Text style={{ fontSize: compact ? 32 : 40 }}>🌾</Text></View>
                    }

                    {/* Discount Badge */}
                    {discount > 0 && (
                        <View style={styles.discountBadge}>
                            <Text style={styles.discountText}>{discount}% OFF</Text>
                        </View>
                    )}

                    {/* Heart */}
                    <TouchableOpacity style={styles.heartBtn} onPress={() => toggleWishlist(item)}>
                        <Ionicons name={wishlisted ? 'heart' : 'heart-outline'} size={16} color={wishlisted ? '#EF4444' : '#9CA3AF'} />
                    </TouchableOpacity>

                    {/* Rating Pill */}
                    <View style={styles.ratingPill}>
                        <Text style={styles.ratingPillText}>{Number(rating).toFixed(1)}</Text>
                        <Ionicons name="star" size={10} color="#F59E0B" />
                    </View>
                </View>

                <View style={styles.productInfo}>
                    <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
                    <Text style={styles.productWeight}>{item.weight} {item.unit || 'kg'}</Text>

                    <View style={styles.priceAddRow}>
                        <View>
                            <Text style={styles.offerPrice}>₹{displayPrice}</Text>
                            {hasOffer && <Text style={styles.mrpPrice}>₹{item.price}</Text>}
                        </View>

                        <TouchableOpacity style={styles.addPill} onPress={() => handleAddToCart(item._id)}>
                            <Feather name="plus" size={14} color="#fff" />
                            <Text style={styles.addPillText}>Add</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            {/* ── TOP BAR ── */}
            <View style={styles.topBar}>
                <View style={styles.brandRow}>
                    <View style={styles.brandIcon}>
                        <Text style={{ fontSize: 20 }}>🌾</Text>
                    </View>
                    <View>
                        <Text style={styles.brandName}>Rice Mill Express</Text>
                        <TouchableOpacity style={styles.locationRow} onPress={() => navigation.navigate('Addresses')}>
                            <Feather name="map-pin" size={11} color="#16A34A" />
                            <Text style={styles.locationText} numberOfLines={1}>
                                {userAddress
                                    ? `${userAddress.houseNumber || ''} ${userAddress.street || ''}, ${userAddress.city || ''}`
                                    : 'Select Delivery Location'}
                            </Text>
                            <Feather name="chevron-down" size={11} color="#6B7280" />
                        </TouchableOpacity>
                    </View>
                </View>
                <View style={styles.topActions}>
                    <TouchableOpacity style={styles.topIconBtn} onPress={() => navigation.navigate('Notifications')}>
                        <Feather name="bell" size={20} color="#374151" />
                        <View style={styles.notifDot} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.topIconBtn} onPress={() => navigation.navigate('Cart')}>
                        <Feather name="shopping-bag" size={20} color="#374151" />
                        {cartCount > 0 && (
                            <View style={styles.cartBadge}>
                                <Text style={styles.cartBadgeText}>{cartCount > 9 ? '9+' : cartCount}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            {/* ── SEARCH BAR ── */}
            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <Feather name="search" size={17} color="#9CA3AF" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search Basmati, Sona Masoori, brands..."
                        placeholderTextColor="#9CA3AF"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Feather name="x" size={16} color="#9CA3AF" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#16A34A" />
                    <Text style={styles.loadingText}>Loading products...</Text>
                </View>
            ) : (
                <ScrollView
                    style={styles.scroll}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#16A34A']} />}
                >
                    {/* ── BANNER CAROUSEL ── */}
                    <View style={styles.bannerSection}>
                        <ScrollView
                            ref={bannerScrollRef}
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            onMomentumScrollEnd={(e) => {
                                const idx = Math.round(e.nativeEvent.contentOffset.x / (SCREEN_WIDTH - 32));
                                setActiveBanner(idx);
                            }}
                        >
                            {BANNERS.map((banner, i) => (
                                <View key={banner.id} style={[styles.banner, { backgroundColor: banner.bg[0] }]}>
                                    <View style={styles.bannerContent}>
                                        <View style={styles.bannerBadge}>
                                            <Text style={styles.bannerBadgeText}>Limited Offer</Text>
                                        </View>
                                        <Text style={styles.bannerTitle}>{banner.title}</Text>
                                        <Text style={styles.bannerSubtitle}>{banner.subtitle}</Text>
                                        <TouchableOpacity style={styles.bannerCta}>
                                            <Text style={styles.bannerCtaText}>{banner.cta} →</Text>
                                        </TouchableOpacity>
                                    </View>
                                    <View style={styles.bannerEmoji}>
                                        <Text style={{ fontSize: 64 }}>{banner.emoji}</Text>
                                    </View>
                                </View>
                            ))}
                        </ScrollView>
                        {/* Dots */}
                        <View style={styles.bannerDots}>
                            {BANNERS.map((_, i) => (
                                <View key={i} style={[styles.dot, activeBanner === i && styles.dotActive]} />
                            ))}
                        </View>
                    </View>

                    {/* ── CATEGORIES ── */}
                    <View style={styles.sectionBlock}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesRow}>
                            {CATEGORIES.map(cat => (
                                <TouchableOpacity
                                    key={cat.id}
                                    style={styles.catItem}
                                    onPress={() => setActiveCategory(activeCategory === cat.id ? '' : cat.id)}
                                >
                                    <View style={[
                                        styles.catCircle,
                                        { backgroundColor: cat.bg },
                                        activeCategory === cat.id && styles.catCircleActive
                                    ]}>
                                        <Text style={styles.catEmoji}>{cat.emoji}</Text>
                                    </View>
                                    <Text style={[
                                        styles.catLabel,
                                        activeCategory === cat.id && { color: '#111827', fontWeight: '700' }
                                    ]} numberOfLines={2}>{cat.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    {/* ── DEALS OF THE DAY ── */}
                    {filteredProducts.length > 0 && (
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <View>
                                    <Text style={styles.sectionTitle}>Deals of the Day</Text>
                                    <Text style={styles.sectionSub}>Best prices, limited time</Text>
                                </View>
                                <View style={styles.timerPill}>
                                    <Feather name="clock" size={12} color="#EF4444" />
                                    <Text style={styles.timerText}>{flashTimer}</Text>
                                </View>
                            </View>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 14 }}>
                                {filteredProducts.slice(0, 6).map(item => renderProductCard(item, true))}
                            </ScrollView>
                        </View>
                    )}

                    {/* ── FEATURED BANNER ── */}
                    <View style={styles.midBanner}>
                        <View style={styles.midBannerLeft}>
                            <Text style={styles.midBannerTag}>🎁 Refer & Earn</Text>
                            <Text style={styles.midBannerTitle}>Invite friends,{'\n'}earn ₹50 each!</Text>
                            <TouchableOpacity style={styles.midBannerBtn} onPress={() => navigation.navigate('Referral')}>
                                <Text style={styles.midBannerBtnText}>Invite Now</Text>
                            </TouchableOpacity>
                        </View>
                        <Text style={{ fontSize: 56 }}>🤝</Text>
                    </View>

                    {/* ── ALL PRODUCTS ── */}
                    {filteredProducts.length > 0 ? (
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <View>
                                    <Text style={styles.sectionTitle}>
                                        {activeCategory ? `${CATEGORIES.find(c => c.id === activeCategory)?.name.replace('\n', ' ') || 'Results'}` : 'Recommended For You'}
                                    </Text>
                                    <Text style={styles.sectionSub}>{filteredProducts.length} products available</Text>
                                </View>
                            </View>
                            <View style={styles.grid}>
                                {filteredProducts.map(item => (
                                    <View key={item._id} style={styles.gridItem}>
                                        {renderProductCard(item, false)}
                                    </View>
                                ))}
                            </View>
                        </View>
                    ) : (
                        <View style={styles.emptyState}>
                            <Text style={{ fontSize: 48 }}>🔍</Text>
                            <Text style={styles.emptyTitle}>No products found</Text>
                            <Text style={styles.emptySubtitle}>Try different search terms or browse categories</Text>
                            <TouchableOpacity style={styles.emptyBtn} onPress={() => { setSearchQuery(''); setActiveCategory(''); }}>
                                <Text style={styles.emptyBtnText}>Clear Filters</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    <View style={{ height: 100 }} />
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },

    // ── TOP BAR ──
    topBar: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff',
    },
    brandRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    brandIcon: {
        width: 40, height: 40, borderRadius: 12, backgroundColor: '#F0FDF4',
        alignItems: 'center', justifyContent: 'center', marginRight: 10,
    },
    brandName: { fontSize: 16, fontWeight: '800', color: '#111827', letterSpacing: -0.3 },
    locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
    locationText: { fontSize: 12, color: '#6B7280', fontWeight: '500', maxWidth: 160 },
    topActions: { flexDirection: 'row', gap: 8 },
    topIconBtn: {
        width: 40, height: 40, borderRadius: 12, backgroundColor: '#F9FAFB',
        alignItems: 'center', justifyContent: 'center', position: 'relative',
        borderWidth: 1, borderColor: '#F3F4F6',
    },
    notifDot: {
        position: 'absolute', top: 8, right: 8, width: 8, height: 8,
        borderRadius: 4, backgroundColor: '#EF4444', borderWidth: 1.5, borderColor: '#fff',
    },
    cartBadge: {
        position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18,
        borderRadius: 9, backgroundColor: '#F97316', justifyContent: 'center',
        alignItems: 'center', borderWidth: 2, borderColor: '#fff', paddingHorizontal: 2,
    },
    cartBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },

    // ── SEARCH ──
    searchContainer: { paddingHorizontal: 16, paddingBottom: 12 },
    searchBar: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB',
        borderRadius: 30, paddingHorizontal: 16, paddingVertical: 12,
        gap: 10, borderWidth: 1, borderColor: '#F3F4F6',
    },
    searchInput: { flex: 1, fontSize: 14, color: '#111827', fontWeight: '500' },

    // ── GENERAL ──
    scroll: { flex: 1 },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
    loadingText: { color: '#6B7280', fontSize: 14 },

    // ── BANNERS ──
    bannerSection: { paddingHorizontal: 16, marginBottom: 24 },
    banner: {
        width: SCREEN_WIDTH - 32, borderRadius: 20, height: 160,
        flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, overflow: 'hidden',
    },
    bannerContent: { flex: 1 },
    bannerBadge: {
        backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 20,
        paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start', marginBottom: 8,
    },
    bannerBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
    bannerTitle: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.85)', marginBottom: 4 },
    bannerSubtitle: { fontSize: 18, fontWeight: '800', color: '#fff', lineHeight: 24, marginBottom: 12 },
    bannerCta: {
        backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 8,
        borderRadius: 20, alignSelf: 'flex-start',
    },
    bannerCtaText: { fontSize: 13, fontWeight: '800', color: '#111827' },
    bannerEmoji: { marginLeft: 10 },
    bannerDots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 10 },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#CBD5E1' },
    dotActive: { width: 18, backgroundColor: '#16A34A' },

    // ── CATEGORIES ──
    sectionBlock: { marginBottom: 24 },
    categoriesRow: { paddingHorizontal: 16, gap: 12 },
    catItem: { alignItems: 'center', width: 68 },
    catCircle: {
        width: 60, height: 60, borderRadius: 30, justifyContent: 'center',
        alignItems: 'center', marginBottom: 8, borderWidth: 2, borderColor: 'transparent',
    },
    catCircleActive: { borderColor: '#16A34A', shadowColor: '#16A34A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 3 },
    catEmoji: { fontSize: 26 },
    catLabel: { fontSize: 11, color: '#6B7280', fontWeight: '600', textAlign: 'center', lineHeight: 15 },

    // ── SECTIONS ──
    section: { marginBottom: 28 },
    sectionHeader: {
        flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
        paddingHorizontal: 16, marginBottom: 16,
    },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: '#111827', letterSpacing: -0.3 },
    sectionSub: { fontSize: 12, color: '#9CA3AF', marginTop: 2, fontWeight: '500' },
    timerPill: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2',
        paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, gap: 5,
    },
    timerText: { color: '#EF4444', fontSize: 12, fontWeight: '800', fontVariant: ['tabular-nums'] },

    // ── MID BANNER ──
    midBanner: {
        marginHorizontal: 16, marginBottom: 28, backgroundColor: '#F0FDF4',
        borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'center',
        borderWidth: 1, borderColor: '#D1FAE5',
    },
    midBannerLeft: { flex: 1 },
    midBannerTag: { fontSize: 12, fontWeight: '700', color: '#16A34A', marginBottom: 6 },
    midBannerTitle: { fontSize: 20, fontWeight: '800', color: '#111827', lineHeight: 26, marginBottom: 14 },
    midBannerBtn: {
        backgroundColor: '#16A34A', paddingHorizontal: 20, paddingVertical: 10,
        borderRadius: 50, alignSelf: 'flex-start',
    },
    midBannerBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

    // ── PRODUCT CARDS ──
    compactCard: {
        width: 154, backgroundColor: '#fff', borderRadius: 20,
        shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06,
        shadowRadius: 10, elevation: 3, borderWidth: 1, borderColor: '#F3F4F6',
    },
    productCard: {
        backgroundColor: '#fff', borderRadius: 20,
        shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06,
        shadowRadius: 10, elevation: 3, borderWidth: 1, borderColor: '#F3F4F6',
    },
    compactImgWrap: { position: 'relative', height: 136, borderRadius: 20, overflow: 'hidden' },
    productImgWrap: { position: 'relative', height: 160, borderRadius: 20, overflow: 'hidden' },
    img: { width: '100%', height: '100%', resizeMode: 'cover' },
    fallbackImg: { width: '100%', height: '100%', backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center' },
    productInfo: { padding: 12 },
    discountBadge: {
        position: 'absolute', top: 10, left: 10, backgroundColor: '#F97316',
        paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
    },
    discountText: { color: '#fff', fontSize: 10, fontWeight: '800' },
    heartBtn: {
        position: 'absolute', top: 8, right: 8, width: 30, height: 30, borderRadius: 15,
        backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2,
    },
    ratingPill: {
        position: 'absolute', bottom: 8, left: 8, backgroundColor: 'rgba(255,255,255,0.96)',
        paddingHorizontal: 7, paddingVertical: 3, borderRadius: 10, flexDirection: 'row',
        alignItems: 'center', gap: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1, shadowRadius: 3, elevation: 2,
    },
    ratingPillText: { fontSize: 11, fontWeight: '800', color: '#111827' },
    productName: { fontSize: 13, fontWeight: '700', color: '#111827', lineHeight: 18, marginBottom: 3 },
    productWeight: { fontSize: 11, color: '#9CA3AF', marginBottom: 10, fontWeight: '500' },
    priceAddRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
    offerPrice: { fontSize: 15, fontWeight: '800', color: '#111827' },
    mrpPrice: { fontSize: 11, color: '#D1D5DB', textDecorationLine: 'line-through', marginTop: 1 },
    addPill: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#16A34A',
        paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, gap: 4,
        shadowColor: '#16A34A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 3,
    },
    addPillText: { color: '#fff', fontSize: 12, fontWeight: '800' },

    // ── GRID ──
    grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 14 },
    gridItem: { width: '47.5%' },

    // ── EMPTY ──
    emptyState: { alignItems: 'center', padding: 40, gap: 10 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
    emptySubtitle: { fontSize: 14, color: '#9CA3AF', textAlign: 'center' },
    emptyBtn: { backgroundColor: '#16A34A', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 50, marginTop: 8 },
    emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
