// [Premium Figma-level Redesign — WishlistScreen]
import React, { useEffect } from 'react';
import {
    View, Text, FlatList, StyleSheet, Image, TouchableOpacity,
    ActivityIndicator, SafeAreaView, StatusBar,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { getWishlist, removeFromWishlist } from '../../redux/actions/wishlistActions';
import { addToCart } from '../../redux/actions/cartActions';
import { API_URL } from '../../config/env';

const WishlistScreen = ({ navigation }) => {
    const dispatch = useDispatch();
    const wishlist = useSelector((state) => state.wishlist);
    const { wishlistItems = [], loading, error } = wishlist || {};

    useEffect(() => { dispatch(getWishlist()); }, [dispatch]);

    const handleRemove = (productId) => dispatch(removeFromWishlist(productId));

    const handleAddToCart = (item) => {
        dispatch(addToCart(item._id, 1));
    };

    const renderItem = ({ item }) => {
        const firstImage = item.images?.[0] || item.image;
        const imageUri = firstImage?.startsWith('http') ? firstImage : firstImage ? `${API_URL}${firstImage}` : null;
        const hasOffer = typeof item.offerPrice === 'number' && item.offerPrice > 0 && item.offerPrice < item.price;
        const displayPrice = hasOffer ? item.offerPrice : item.price;
        const discount = hasOffer ? Math.round((1 - item.offerPrice / item.price) * 100) : 0;
        const rating = item.rating || (Math.random() * (5.0 - 4.0) + 4.0).toFixed(1);

        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => navigation.navigate('ProductDetail', { productId: item._id })}
                activeOpacity={0.92}
            >
                <View style={styles.imgWrap}>
                    {imageUri
                        ? <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
                        : <View style={styles.imgPlaceholder}><Text style={{ fontSize: 32 }}>🌾</Text></View>
                    }
                    {discount > 0 && (
                        <View style={styles.discountBadge}>
                            <Text style={styles.discountText}>{discount}% OFF</Text>
                        </View>
                    )}
                    <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemove(item._id)}>
                        <Ionicons name="heart" size={16} color="#EF4444" />
                    </TouchableOpacity>
                </View>

                <View style={styles.cardBody}>
                    <View style={styles.ratingRow}>
                        <Ionicons name="star" size={11} color="#F59E0B" />
                        <Text style={styles.ratingText}>{Number(rating).toFixed(1)}</Text>
                    </View>
                    <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                    <Text style={styles.itemWeight}>{item.weight} {item.unit || 'kg'}</Text>

                    <View style={styles.priceRow}>
                        <View>
                            <Text style={styles.itemPrice}>₹{displayPrice}</Text>
                            {hasOffer && <Text style={styles.originalPrice}>₹{item.price}</Text>}
                        </View>
                        <TouchableOpacity
                            style={styles.addCartBtn}
                            onPress={() => handleAddToCart(item)}
                        >
                            <Feather name="shopping-cart" size={14} color="#fff" />
                            <Text style={styles.addCartText}>Add</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading && wishlistItems.length === 0) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#16A34A" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Wishlist</Text>
                {wishlistItems.length > 0 && (
                    <View style={styles.headerBadge}>
                        <Text style={styles.headerBadgeText}>{wishlistItems.length}</Text>
                    </View>
                )}
            </View>

            {wishlistItems.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <View style={styles.emptyIconWrap}>
                        <Text style={{ fontSize: 52 }}>❤️</Text>
                    </View>
                    <Text style={styles.emptyTitle}>Your wishlist is empty</Text>
                    <Text style={styles.emptySubtitle}>Save products you love for later</Text>
                    <TouchableOpacity style={styles.shopButton} onPress={() => navigation.navigate('Home')}>
                        <Text style={styles.shopButtonText}>Explore Products</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={wishlistItems}
                    renderItem={renderItem}
                    keyExtractor={(item) => item._id}
                    numColumns={2}
                    contentContainerStyle={styles.list}
                    columnWrapperStyle={styles.row}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6', gap: 10 },
    headerTitle: { fontSize: 24, fontWeight: '800', color: '#111827', letterSpacing: -0.5 },
    headerBadge: { backgroundColor: '#F0FDF4', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 50 },
    headerBadgeText: { fontSize: 13, fontWeight: '800', color: '#16A34A' },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    list: { padding: 16, paddingBottom: 40 },
    row: { gap: 14 },

    card: {
        flex: 1, backgroundColor: '#fff', borderRadius: 20,
        marginBottom: 14, borderWidth: 1, borderColor: '#F3F4F6',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, overflow: 'hidden',
    },
    imgWrap: { position: 'relative', height: 150 },
    image: { width: '100%', height: '100%', resizeMode: 'cover' },
    imgPlaceholder: { width: '100%', height: '100%', backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center' },
    discountBadge: { position: 'absolute', top: 10, left: 10, backgroundColor: '#F97316', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    discountText: { color: '#fff', fontSize: 9, fontWeight: '800' },
    removeBtn: { position: 'absolute', top: 8, right: 8, width: 30, height: 30, borderRadius: 15, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center' },

    cardBody: { padding: 12 },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 4 },
    ratingText: { fontSize: 11, fontWeight: '700', color: '#374151' },
    itemName: { fontSize: 13, fontWeight: '700', color: '#111827', lineHeight: 18, marginBottom: 3 },
    itemWeight: { fontSize: 11, color: '#9CA3AF', marginBottom: 10 },
    priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
    itemPrice: { fontSize: 15, fontWeight: '800', color: '#111827' },
    originalPrice: { fontSize: 11, color: '#D1D5DB', textDecorationLine: 'line-through' },
    addCartBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#16A34A', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 50, gap: 4, shadowColor: '#16A34A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 5, elevation: 3 },
    addCartText: { color: '#fff', fontSize: 11, fontWeight: '800' },

    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, gap: 12 },
    emptyIconWrap: { width: 110, height: 110, borderRadius: 55, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    emptyTitle: { fontSize: 22, fontWeight: '800', color: '#111827' },
    emptySubtitle: { fontSize: 14, color: '#9CA3AF', textAlign: 'center' },
    shopButton: { backgroundColor: '#16A34A', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 50, marginTop: 8, shadowColor: '#16A34A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 4 },
    shopButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});

export default WishlistScreen;
