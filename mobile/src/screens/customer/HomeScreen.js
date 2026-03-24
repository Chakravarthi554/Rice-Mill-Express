import React, { useEffect, useState, useRef } from 'react';
import {
    View, Text, FlatList, StyleSheet, TouchableOpacity, Image,
    ActivityIndicator, RefreshControl, TextInput, SafeAreaView,
    ScrollView, StatusBar,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { apiService } from '../../services/api';
import { addToWishlist, removeFromWishlist, getWishlist } from '../../redux/actions/wishlistActions';
import { addToCart, getCart } from '../../redux/actions/cartActions';
import { API_URL } from '../../config/env';

const CATEGORIES = [
    { id: 'basmati', name: 'Basmati', emoji: '🍚' },
    { id: 'sona', name: 'Sona', emoji: '🌾' },
    { id: 'kolam', name: 'Kolam Rice', emoji: '🥣' },
    { id: 'brown', name: 'Brown Rice', emoji: '🌿' },
    { id: 'organic', name: 'Organic', emoji: '🍃' },
    { id: 'bulk', name: 'Bulk Bu...', emoji: '📦' },
];

// Flash Sale Countdown Timer
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
    const [activeCategory, setActiveCategory] = useState('basmati');
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const flashTimer = useCountdown(2 * 3600 + 14 * 60 + 22);

    const wishlist = useSelector(state => state.wishlist);
    const { wishlistItems = [] } = wishlist || {};
    const cart = useSelector(state => state.cart);
    const cartCount = (cart?.cartItems || []).reduce((s, i) => s + (i.qty || 1), 0);
    const { userInfo } = useSelector(state => state.userLogin);

    useEffect(() => {
        fetchProducts();
        dispatch(getWishlist());
        dispatch(getCart());
    }, [dispatch]);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const response = await apiService.getProducts();
            setProducts(response.data.products || []);
        } catch (e) {
            console.error('Error fetching products:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => { setRefreshing(true); fetchProducts(); };

    const isWishlisted = (id) => wishlistItems.some(x => (x._id || x) === id);
    const toggleWishlist = (product) => {
        if (isWishlisted(product._id)) dispatch(removeFromWishlist(product._id));
        else dispatch(addToWishlist(product._id));
    };

    const handleAddToCart = (productId) => dispatch(addToCart(productId, 1));

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

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

        return (
            <TouchableOpacity
                key={item._id}
                style={compact ? styles.compactCard : styles.productCard}
                onPress={() => navigation.navigate('ProductDetail', { productId: item._id })}
                activeOpacity={0.92}>
                <View style={compact ? styles.compactImgWrap : styles.productImgWrap}>
                    {imageUri
                        ? <Image source={{ uri: imageUri }} style={compact ? styles.compactImg : styles.productImg} />
                        : <View style={[compact ? styles.compactImg : styles.productImg, { backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center' }]}><Text style={{ fontSize: 32 }}>🌾</Text></View>}
                    {discount > 0 && (
                        <View style={styles.discountBadge}><Text style={styles.discountText}>{discount}% OFF</Text></View>
                    )}
                    <TouchableOpacity style={styles.heartBtn} onPress={() => toggleWishlist(item)}>
                        <Ionicons name={isWishlisted(item._id) ? 'heart' : 'heart-outline'} size={16} color={isWishlisted(item._id) ? '#EF4444' : '#6B7280'} />
                    </TouchableOpacity>
                </View>
                <View style={compact ? styles.compactInfo : styles.productInfo}>
                    <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
                    {item.weight && <Text style={styles.productWeight}>{item.weight} {item.unit || 'kg'}</Text>}
                    <View style={styles.ratingRow}>
                        <Ionicons name="star" size={12} color="#F59E0B" />
                        <Text style={styles.ratingText}>{item.rating || '4.5'}</Text>
                    </View>
                    <View style={styles.priceAddRow}>
                        <View>
                            <Text style={styles.offerPrice}>₹{displayPrice}</Text>
                            {hasOffer && <Text style={styles.mrpPrice}>₹{item.price}</Text>}
                        </View>
                        <TouchableOpacity style={styles.addBtn} onPress={() => handleAddToCart(item._id)}>
                            <MaterialIcons name="add" size={18} color="#fff" />
                            <Text style={styles.addBtnText}>Add</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            {/* Top Header */}
            <View style={styles.topBar}>
                <View style={styles.locationRow}>
                    <Ionicons name="location" size={16} color="#16A34A" />
                    <Text style={styles.locationText}>Deliver to Home - 12B, Green Valley Apts...</Text>
                    <Ionicons name="chevron-down" size={14} color="#4B5563" />
                </View>
                <View style={styles.topIcons}>
                    <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Notifications')}>
                        <Ionicons name="notifications-outline" size={22} color="#374151" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Cart')}>
                        <Ionicons name="cart-outline" size={22} color="#374151" />
                        {cartCount > 0 && (
                            <View style={styles.cartBadge}><Text style={styles.cartBadgeText}>{cartCount}</Text></View>
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            {/* Search */}
            <View style={styles.searchWrap}>
                <Ionicons name="search" size={16} color="#9CA3AF" />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search Basmati, Sona Masoori, or brands..."
                    placeholderTextColor="#9CA3AF"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Ionicons name="close-circle" size={16} color="#9CA3AF" />
                    </TouchableOpacity>
                )}
            </View>

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#16A34A" />
                </View>
            ) : (
                <ScrollView
                    style={styles.scroll}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#16A34A']} />}>

                    {/* Festival Banner */}
                    <View style={styles.bannerWrap}>
                        <View style={styles.bannerContent}>
                            <Text style={styles.bannerLabel}>Festival Special:</Text>
                            <Text style={styles.bannerTitle}>20% OFF on Bulk{'\n'}Basmati Orders!</Text>
                            <TouchableOpacity style={styles.shopNowBtn} onPress={() => navigation.navigate('BulkOrders')}>
                                <Text style={styles.shopNowText}>Shop Now</Text>
                            </TouchableOpacity>
                        </View>
                        <Image
                            source={{ uri: 'https://images.unsplash.com/photo-1586201375761-83865001e8ac?w=300' }}
                            style={styles.bannerImg}
                        />
                    </View>

                    {/* Category Circles */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesRow} contentContainerStyle={{ paddingHorizontal: 16 }}>
                        {CATEGORIES.map(cat => (
                            <TouchableOpacity key={cat.id} style={styles.catItem} onPress={() => setActiveCategory(cat.id)}>
                                <View style={[styles.catCircle, activeCategory === cat.id && styles.catCircleActive]}>
                                    <Text style={styles.catEmoji}>{cat.emoji}</Text>
                                </View>
                                <Text style={[styles.catLabel, activeCategory === cat.id && styles.catLabelActive]}>{cat.name}</Text>
                                {activeCategory === cat.id && <View style={styles.catUnderline} />}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Flash Sale */}
                    {filteredProducts.length > 0 && (
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <View style={styles.sectionTitleRow}>
                                    <Text style={styles.sectionTitle}>Flash Sale</Text>
                                    <View style={styles.timerPill}>
                                        <MaterialIcons name="timer" size={13} color="#EF4444" />
                                        <Text style={styles.timerText}>{flashTimer}</Text>
                                    </View>
                                </View>
                            </View>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
                                {filteredProducts.slice(0, 4).map(item => renderProductCard(item, true))}
                            </ScrollView>
                        </View>
                    )}

                    {/* Buy Again */}
                    {filteredProducts.length > 2 && (
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Buy Again</Text>
                            </View>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
                                {filteredProducts.slice(1, 5).map(item => renderProductCard(item, true))}
                            </ScrollView>
                        </View>
                    )}

                    {/* Recommended */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Recommended for You</Text>
                        </View>

                        {filteredProducts.length === 0 ? (
                            <View style={styles.emptyBox}>
                                <Text style={styles.emptyIcon}>🌾</Text>
                                <Text style={styles.emptyText}>No products found</Text>
                            </View>
                        ) : (
                            <View style={styles.grid}>
                                {filteredProducts.map(item => (
                                    <View key={item._id} style={styles.gridItem}>
                                        {renderProductCard(item, false)}
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>

                    <View style={{ height: 100 }} />
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    locationRow: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 4 },
    locationText: { fontSize: 12, color: '#374151', fontWeight: '600', flex: 1 },
    topIcons: { flexDirection: 'row', gap: 8 },
    iconBtn: { position: 'relative', padding: 4 },
    cartBadge: { position: 'absolute', top: -2, right: -4, width: 16, height: 16, borderRadius: 8, backgroundColor: '#F97316', justifyContent: 'center', alignItems: 'center' },
    cartBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
    searchWrap: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginVertical: 10, backgroundColor: '#F9FAFB', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, gap: 10, borderWidth: 1, borderColor: '#E5E7EB' },
    searchInput: { flex: 1, fontSize: 13, color: '#111827' },
    scroll: { flex: 1 },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    // Banner
    bannerWrap: { marginHorizontal: 16, marginBottom: 16, backgroundColor: '#1A6B38', borderRadius: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', overflow: 'hidden', minHeight: 120 },
    bannerContent: { flex: 1, padding: 16 },
    bannerLabel: { color: '#86EFAC', fontSize: 12, fontWeight: '600', marginBottom: 2 },
    bannerTitle: { color: '#fff', fontSize: 16, fontWeight: '800', lineHeight: 22, marginBottom: 12 },
    shopNowBtn: { backgroundColor: '#F97316', paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, alignSelf: 'flex-start' },
    shopNowText: { color: '#fff', fontSize: 12, fontWeight: '800' },
    bannerImg: { width: 130, height: 120, resizeMode: 'cover' },
    // Categories
    categoriesRow: { marginBottom: 16 },
    catItem: { alignItems: 'center', marginRight: 20, width: 68 },
    catCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginBottom: 6, borderWidth: 2, borderColor: '#F3F4F6' },
    catCircleActive: { borderColor: '#16A34A', backgroundColor: '#F0FDF4' },
    catEmoji: { fontSize: 24 },
    catLabel: { fontSize: 11, color: '#6B7280', fontWeight: '500', textAlign: 'center' },
    catLabelActive: { color: '#16A34A', fontWeight: '700' },
    catUnderline: { width: 20, height: 2, backgroundColor: '#16A34A', borderRadius: 1, marginTop: 4 },
    // Sections
    section: { marginBottom: 20 },
    sectionHeader: { paddingHorizontal: 16, marginBottom: 12 },
    sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    sectionTitle: { fontSize: 16, fontWeight: '800', color: '#111827' },
    timerPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, gap: 4 },
    timerText: { color: '#EF4444', fontSize: 12, fontWeight: '700', fontVariant: ['tabular-nums'] },
    // Compact cards (horizontal scroll)
    compactCard: { width: 150, backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#F3F4F6', elevation: 2 },
    compactImgWrap: { position: 'relative', height: 120 },
    compactImg: { width: '100%', height: '100%', resizeMode: 'cover' },
    compactInfo: { padding: 10 },
    // Grid product cards
    grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 12 },
    gridItem: { width: '47%' },
    productCard: { backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#F3F4F6', elevation: 2 },
    productImgWrap: { position: 'relative', height: 150 },
    productImg: { width: '100%', height: '100%', resizeMode: 'cover' },
    productInfo: { padding: 10 },
    discountBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: '#EF4444', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
    discountText: { color: '#fff', fontSize: 9, fontWeight: '800' },
    heartBtn: { position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.9)', justifyContent: 'center', alignItems: 'center' },
    productName: { fontSize: 12, fontWeight: '700', color: '#111827', lineHeight: 16, marginBottom: 2 },
    productWeight: { fontSize: 11, color: '#9CA3AF', marginBottom: 4 },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 6 },
    ratingText: { fontSize: 11, color: '#6B7280', fontWeight: '600' },
    priceAddRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
    offerPrice: { fontSize: 14, fontWeight: '800', color: '#111827' },
    mrpPrice: { fontSize: 11, color: '#9CA3AF', textDecorationLine: 'line-through' },
    addBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#16A34A', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, gap: 2 },
    addBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
    // Empty
    emptyBox: { alignItems: 'center', paddingVertical: 40 },
    emptyIcon: { fontSize: 48, marginBottom: 12 },
    emptyText: { fontSize: 16, color: '#6B7280', fontWeight: '600' },
});
