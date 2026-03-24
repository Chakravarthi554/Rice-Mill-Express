// [AI: Premium Mobile Polish - Pill-shaped buttons, Floating Badges, Squircle Categories]
import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Image,
    ActivityIndicator, RefreshControl, TextInput, SafeAreaView,
    ScrollView, StatusBar,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { apiService } from '../../services/api';
import { addToWishlist, removeFromWishlist, getWishlist } from '../../redux/actions/wishlistActions';
import { addToCart, getCart } from '../../redux/actions/cartActions';
import { API_URL } from '../../config/env';

const CATEGORIES = [
    { id: 'basmati', name: 'Basmati', emoji: '🍚' },
    { id: 'sona', name: 'Sona', emoji: '🌾' },
    { id: 'kolam', name: 'Kolam', emoji: '🥣' },
    { id: 'brown', name: 'Brown', emoji: '🌿' },
    { id: 'organic', name: 'Organic', emoji: '🍃' },
    { id: 'bulk', name: 'Wholesale', emoji: '📦' },
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
    const [activeCategory, setActiveCategory] = useState('basmati');
    const dispatch = useDispatch();
    const flashTimer = useCountdown(2 * 3600 + 14 * 60 + 22);

    const wishlist = useSelector(state => state.wishlist);
    const { wishlistItems = [] } = wishlist || {};
    const cart = useSelector(state => state.cart);
    const cartCount = (cart?.cartItems || []).reduce((s, i) => s + (i.qty || 1), 0);


    useEffect(() => { fetchProducts(); dispatch(getWishlist()); dispatch(getCart()); }, [dispatch]);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const response = await apiService.getProducts();
            setProducts(response.data.products || []);
        } catch (e) {
            console.error('Error fetching products:', e);
        } finally { setLoading(false); setRefreshing(false); }
    };

    const onRefresh = () => { setRefreshing(true); fetchProducts(); };

    const isWishlisted = (id) => wishlistItems.some(x => (x._id || x) === id);
    const toggleWishlist = (product) => {
        if (isWishlisted(product._id)) dispatch(removeFromWishlist(product._id));
        else dispatch(addToWishlist(product._id));
    };

    const handleAddToCart = (productId) => dispatch(addToCart(productId, 1));
    const handleNavigation = (id) => navigation.navigate('ProductDetail', { productId: id });

    const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

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

        // Custom local cart state simulation (in a real app, bind this to actual cart items)
        const inCartQuantity = 0; // Simulated
        const rating = item.rating || (Math.random() * (5.0 - 4.0) + 4.0).toFixed(1);

        return (
            <TouchableOpacity key={item._id} style={compact ? styles.compactCard : styles.productCard} onPress={() => handleNavigation(item._id)} activeOpacity={0.9}>
                <View style={compact ? styles.compactImgWrap : styles.productImgWrap}>
                    {imageUri ? <Image source={{ uri: imageUri }} style={styles.img} /> : <View style={styles.fallbackImg}><Text style={{ fontSize: 40 }}>🌾</Text></View>}
                    
                    {discount > 0 && <View style={styles.discountBadge}><Text style={styles.discountText}>{discount}% OFF</Text></View>}
                    
                    {/* Floating Heart Button */}
                    <TouchableOpacity style={styles.heartBtn} onPress={() => toggleWishlist(item)}>
                        <Ionicons name={isWishlisted(item._id) ? 'heart' : 'heart-outline'} size={18} color={isWishlisted(item._id) ? '#EF4444' : '#6B7280'} />
                    </TouchableOpacity>

                    {/* Floating Rating Pill (Phase 3 Spec) */}
                    <View style={styles.ratingPill}>
                        <Text style={styles.ratingPillText}>{rating}</Text>
                        <Ionicons name="star" size={12} color="#F59E0B" />
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
                        
                        {/* Pill Quantity Selector / Add Button (Phase 3 Spec) */}
                        {inCartQuantity > 0 ? (
                             <View style={styles.qtyPill}>
                                <TouchableOpacity style={styles.qtyBtn}><Feather name="minus" size={14} color="#FFF" /></TouchableOpacity>
                                <Text style={styles.qtyText}>{inCartQuantity}</Text>
                                <TouchableOpacity style={styles.qtyBtn}><Feather name="plus" size={14} color="#FFF" /></TouchableOpacity>
                             </View>
                        ) : (
                            <TouchableOpacity style={styles.addPill} onPress={() => handleAddToCart(item._id)}>
                                <Feather name="plus" size={16} color="#fff" />
                                <Text style={styles.addPillText}>Add</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            <View style={styles.topBar}>
                <View style={styles.locationContainer}>
                    <View style={styles.locationIconBox}>
                        <Feather name="map-pin" size={16} color="#16A34A" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.deliveryLabel}>Delivering to</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={styles.locationText} numberOfLines={1}>Home - 12B, Green Valley Apts...</Text>
                            <Feather name="chevron-down" size={14} color="#111827" style={{ marginLeft: 4 }} />
                        </View>
                    </View>
                </View>
                <TouchableOpacity style={styles.mainCartBtn} onPress={() => navigation.navigate('Cart')}>
                    <Feather name="shopping-bag" size={22} color="#111827" />
                    {cartCount > 0 && <View style={styles.cartBadge}><Text style={styles.cartBadgeText}>{cartCount}</Text></View>}
                </TouchableOpacity>
            </View>

            {/* Pill Search Bar */}
            <View style={styles.searchPill}>
                <Feather name="search" size={18} color="#9CA3AF" />
                <TextInput style={styles.searchInput} placeholder="Search basmati, brown rice..." placeholderTextColor="#9CA3AF" value={searchQuery} onChangeText={setSearchQuery} />
                {searchQuery.length > 0 && <TouchableOpacity onPress={() => setSearchQuery('')}><Feather name="x-circle" size={18} color="#9CA3AF" /></TouchableOpacity>}
            </View>

            {loading ? (
                <View style={styles.centerContainer}><ActivityIndicator size="large" color="#16A34A" /></View>
            ) : (
                <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#16A34A']} />}>
                    
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesRow} contentContainerStyle={{ paddingHorizontal: 16 }}>
                        {CATEGORIES.map(cat => (
                            <TouchableOpacity key={cat.id} style={styles.catItem} onPress={() => setActiveCategory(cat.id)}>
                                <View style={[styles.catSquircle, activeCategory === cat.id && styles.catSquircleActive]}>
                                    <Text style={styles.catEmoji}>{cat.emoji}</Text>
                                </View>
                                <Text style={[styles.catLabel, activeCategory === cat.id && styles.catLabelActive]}>{cat.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {filteredProducts.length > 0 && (
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Flash Sale</Text>
                                <View style={styles.timerPill}>
                                    <Feather name="clock" size={12} color="#EF4444" />
                                    <Text style={styles.timerText}>{flashTimer}</Text>
                                </View>
                            </View>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 16 }}>
                                {filteredProducts.slice(0, 4).map(item => renderProductCard(item, true))}
                            </ScrollView>
                        </View>
                    )}

                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { marginLeft: 16, marginBottom: 16 }]}>Recommended For You</Text>
                        <View style={styles.grid}>
                            {filteredProducts.map(item => (
                                <View key={item._id} style={styles.gridItem}>
                                    {renderProductCard(item, false)}
                                </View>
                            ))}
                        </View>
                    </View>

                    <View style={{ height: 100 }} />
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
    locationContainer: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    locationIconBox: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center' },
    deliveryLabel: { fontSize: 11, color: '#6B7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
    locationText: { fontSize: 14, color: '#111827', fontWeight: '800', flexShrink: 1 },
    mainCartBtn: { position: 'relative', padding: 8, backgroundColor: '#F9FAFB', borderRadius: 20 },
    cartBadge: { position: 'absolute', top: 0, right: 0, width: 18, height: 18, borderRadius: 9, backgroundColor: '#F97316', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
    cartBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
    searchPill: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 16, backgroundColor: '#F9FAFB', borderRadius: 30, paddingHorizontal: 16, paddingVertical: 12, gap: 10, borderWidth: 1, borderColor: '#F3F4F6' },
    searchInput: { flex: 1, fontSize: 15, color: '#111827', fontWeight: '500' },
    scroll: { flex: 1 },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    categoriesRow: { marginBottom: 24, paddingTop: 8 },
    catItem: { alignItems: 'center', marginRight: 20, width: 68 },
    catSquircle: { width: 64, height: 64, borderRadius: 20, backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center', marginBottom: 8, borderWidth: 2, borderColor: 'transparent' },
    catSquircleActive: { backgroundColor: '#F0FDF4', borderColor: '#16A34A' },
    catEmoji: { fontSize: 28 },
    catLabel: { fontSize: 12, color: '#6B7280', fontWeight: '600', textAlign: 'center' },
    catLabelActive: { color: '#111827', fontWeight: '800' },
    section: { marginBottom: 32 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 16 },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: '#111827', letterSpacing: -0.5 },
    timerPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, gap: 6 },
    timerText: { color: '#EF4444', fontSize: 13, fontWeight: '800', fontVariant: ['tabular-nums'] },
    compactCard: { width: 160, backgroundColor: '#fff', borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3, marginBottom: 10 },
    productCard: { backgroundColor: '#fff', borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3, marginBottom: 4 },
    compactImgWrap: { position: 'relative', height: 140, borderRadius: 20, overflow: 'hidden' },
    productImgWrap: { position: 'relative', height: 160, borderRadius: 20, overflow: 'hidden' },
    img: { width: '100%', height: '100%', resizeMode: 'cover' },
    fallbackImg: { width: '100%', height: '100%', backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center' },
    productInfo: { padding: 12 },
    discountBadge: { position: 'absolute', top: 12, left: 12, backgroundColor: '#F97316', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    discountText: { color: '#fff', fontSize: 10, fontWeight: '800' },
    heartBtn: { position: 'absolute', top: 10, right: 10, width: 32, height: 32, borderRadius: 16, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
    ratingPill: { position: 'absolute', bottom: 8, left: 8, backgroundColor: 'rgba(255,255,255,0.95)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
    ratingPillText: { fontSize: 11, fontWeight: '800', color: '#111827' },
    productName: { fontSize: 14, fontWeight: '700', color: '#111827', lineHeight: 18, marginBottom: 4 },
    productWeight: { fontSize: 12, color: '#6B7280', marginBottom: 12, fontWeight: '500' },
    priceAddRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
    offerPrice: { fontSize: 16, fontWeight: '800', color: '#111827' },
    mrpPrice: { fontSize: 12, color: '#9CA3AF', textDecorationLine: 'line-through', marginTop: 2 },
    addPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#16A34A', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, gap: 4 },
    addPillText: { color: '#fff', fontSize: 13, fontWeight: '800' },
    qtyPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F97316', paddingHorizontal: 4, paddingVertical: 4, borderRadius: 20, gap: 12 },
    qtyBtn: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
    qtyText: { color: '#fff', fontSize: 14, fontWeight: '800' },
    grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 16 },
    gridItem: { width: '47%' },
});
