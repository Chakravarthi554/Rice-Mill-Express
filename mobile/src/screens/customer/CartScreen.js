// [Premium Figma-level Redesign — CartScreen]
import React, { useEffect } from 'react';
import {
    View, Text, FlatList, StyleSheet, TouchableOpacity,
    ActivityIndicator, Alert, Image, SafeAreaView, StatusBar,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { getCart, removeFromCart, updateCartItem } from '../../redux/actions/cartActions';
import { API_URL } from '../../config/env';

export default function CartScreen({ navigation }) {
    const dispatch = useDispatch();
    const cart = useSelector((state) => state.cart);
    const { loading, error } = cart || {};
    const cartItems = Array.isArray(cart?.cartItems) ? cart.cartItems : [];
    const { t } = useTranslation();

    useEffect(() => { dispatch(getCart()); }, [dispatch]);

    const handleUpdateQuantity = (productId, newQuantity) => {
        if (newQuantity < 1) { handleRemoveItem(productId); return; }
        dispatch(updateCartItem(productId, newQuantity));
    };

    const handleRemoveItem = (productId) => {
        Alert.alert('Remove Item', 'Remove this item from your cart?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Remove', style: 'destructive', onPress: () => dispatch(removeFromCart(productId)) },
        ]);
    };

    const calculateTotal = () => cartItems.reduce((total, item) => {
        const price = item.product?.offerPrice || item.product?.price || 0;
        return total + price * (item.quantity || 1);
    }, 0);

    const deliveryFee = calculateTotal() > 500 ? 0 : 50;
    const grandTotal = calculateTotal() + deliveryFee;
    const savings = cartItems.reduce((s, item) => {
        const diff = (item.product?.price - (item.product?.offerPrice || item.product?.price)) * (item.quantity || 1);
        return s + Math.max(0, diff);
    }, 0);

    const freeDeliveryProgress = Math.min((calculateTotal() / 500) * 100, 100);

    const handleCheckout = () => {
        if (cartItems.length === 0) { Alert.alert(t('cart'), t('emptyCartMessage')); return; }
        navigation.navigate('Checkout');
    };

    const renderCartItem = ({ item }) => {
        const product = item.product || {};
        const firstImage = product.images?.[0];
        const imageUri = firstImage?.startsWith('http') ? firstImage : firstImage ? `${API_URL}${firstImage}` : null;
        const price = product.offerPrice || product.price || 0;
        const subtotal = price * (item.quantity || 1);
        const hasDiscount = product.offerPrice && product.offerPrice < product.price;

        return (
            <View style={styles.cartItem}>
                <TouchableOpacity
                    style={styles.itemImgWrap}
                    onPress={() => navigation.navigate('ProductDetail', { productId: product._id })}
                >
                    {imageUri
                        ? <Image source={{ uri: imageUri }} style={styles.itemImage} resizeMode="cover" />
                        : <View style={[styles.itemImage, styles.imgPlaceholder]}>
                            <Text style={{ fontSize: 28 }}>🌾</Text>
                        </View>
                    }
                    {hasDiscount && (
                        <View style={styles.itemDiscount}>
                            <Text style={styles.itemDiscountText}>
                                {Math.round((1 - product.offerPrice / product.price) * 100)}%
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>

                <View style={styles.itemDetails}>
                    <View style={styles.itemTopRow}>
                        <Text style={styles.itemName} numberOfLines={2}>{product.name || 'Product'}</Text>
                        <TouchableOpacity onPress={() => handleRemoveItem(product._id)} style={styles.removeBtn}>
                            <Feather name="trash-2" size={15} color="#EF4444" />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.itemUnit}>{product.weight || '1 kg'} • Standard Delivery</Text>

                    <View style={styles.qtyPriceRow}>
                        <View style={styles.qtyControl}>
                            <TouchableOpacity
                                style={styles.qtyBtn}
                                onPress={() => handleUpdateQuantity(product._id, (item.quantity || 1) - 1)}
                            >
                                <Feather name="minus" size={14} color="#16A34A" />
                            </TouchableOpacity>
                            <Text style={styles.qtyText}>{item.quantity || 1}</Text>
                            <TouchableOpacity
                                style={[styles.qtyBtn, styles.qtyBtnPlus]}
                                onPress={() => handleUpdateQuantity(product._id, (item.quantity || 1) + 1)}
                            >
                                <Feather name="plus" size={14} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.priceBlock}>
                            <Text style={styles.itemSubtotal}>₹{subtotal.toFixed(0)}</Text>
                            {hasDiscount && (
                                <Text style={styles.itemOriginal}>₹{(product.price * (item.quantity || 1)).toFixed(0)}</Text>
                            )}
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    if (loading && cartItems.length === 0) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#16A34A" />
                <Text style={styles.loadingText}>Loading your cart...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centerContainer}>
                <View style={styles.errorIcon}>
                    <Ionicons name="alert-circle-outline" size={36} color="#EF4444" />
                </View>
                <Text style={styles.errorTitle}>Something went wrong</Text>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={() => dispatch(getCart())}>
                    <Text style={styles.retryText}>Try Again</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Feather name="arrow-left" size={20} color="#111827" />
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>My Cart</Text>
                    {cartItems.length > 0 && (
                        <Text style={styles.headerSub}>{cartItems.length} item{cartItems.length !== 1 ? 's' : ''}</Text>
                    )}
                </View>
                <View style={{ width: 40 }} />
            </View>

            {cartItems.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <View style={styles.emptyIconWrap}>
                        <Text style={{ fontSize: 56 }}>🛒</Text>
                    </View>
                    <Text style={styles.emptyTitle}>Your cart is empty</Text>
                    <Text style={styles.emptySubtitle}>Add products you want to order</Text>
                    <TouchableOpacity style={styles.shopButton} onPress={() => navigation.navigate('Home')}>
                        <Feather name="shopping-bag" size={16} color="#fff" />
                        <Text style={styles.shopButtonText}>Browse Products</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <>
                    {/* Free delivery progress */}
                    {calculateTotal() < 500 && (
                        <View style={styles.deliveryProgress}>
                            <View style={styles.deliveryProgressHeader}>
                                <Feather name="truck" size={14} color="#16A34A" />
                                <Text style={styles.deliveryProgressText}>
                                    Add <Text style={{ fontWeight: '800', color: '#16A34A' }}>₹{500 - Math.floor(calculateTotal())}</Text> more for free delivery
                                </Text>
                            </View>
                            <View style={styles.progressBar}>
                                <View style={[styles.progressFill, { width: `${freeDeliveryProgress}%` }]} />
                            </View>
                        </View>
                    )}

                    <FlatList
                        data={cartItems}
                        renderItem={renderCartItem}
                        keyExtractor={(item) => item.product?._id || Math.random().toString()}
                        contentContainerStyle={styles.cartList}
                        refreshing={loading}
                        onRefresh={() => dispatch(getCart())}
                        showsVerticalScrollIndicator={false}
                        ListFooterComponent={
                            calculateTotal() >= 500 ? (
                                <View style={styles.freeDeliveryBadge}>
                                    <Ionicons name="checkmark-circle" size={18} color="#16A34A" />
                                    <Text style={styles.freeDeliveryText}>🎉 Free delivery unlocked on this order!</Text>
                                </View>
                            ) : null
                        }
                    />

                    {/* Price Summary Footer */}
                    <View style={styles.footer}>
                        {savings > 0 && (
                            <View style={styles.savingsRow}>
                                <Text style={styles.savingsEmoji}>🎉</Text>
                                <Text style={styles.savingsText}>You're saving <Text style={{ fontWeight: '800' }}>₹{savings.toFixed(0)}</Text> on this order!</Text>
                            </View>
                        )}

                        <View style={styles.summaryBlock}>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Item Total ({cartItems.length} items)</Text>
                                <Text style={styles.summaryValue}>₹{calculateTotal().toFixed(0)}</Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Delivery Fee</Text>
                                <Text style={[styles.summaryValue, deliveryFee === 0 && styles.freeText]}>
                                    {deliveryFee === 0 ? '✓ FREE' : `₹${deliveryFee}`}
                                </Text>
                            </View>
                            <View style={styles.divider} />
                            <View style={styles.summaryRow}>
                                <Text style={styles.totalLabel}>Total Payable</Text>
                                <Text style={styles.totalValue}>₹{grandTotal.toFixed(0)}</Text>
                            </View>
                        </View>

                        <TouchableOpacity style={styles.checkoutButton} onPress={handleCheckout}>
                            <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
                            <View style={styles.checkoutArrow}>
                                <Feather name="arrow-right" size={18} color="#16A34A" />
                            </View>
                        </TouchableOpacity>
                    </View>
                </>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },

    // Header
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff',
        borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
    },
    backBtn: {
        width: 40, height: 40, borderRadius: 12, backgroundColor: '#F9FAFB',
        alignItems: 'center', justifyContent: 'center',
    },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#111827', textAlign: 'center' },
    headerSub: { fontSize: 12, color: '#9CA3AF', textAlign: 'center', marginTop: 2 },

    // States
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 12 },
    loadingText: { color: '#6B7280', fontSize: 14 },
    errorIcon: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center' },
    errorTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
    errorText: { fontSize: 14, color: '#9CA3AF', textAlign: 'center' },
    retryButton: { backgroundColor: '#16A34A', paddingHorizontal: 28, paddingVertical: 12, borderRadius: 50, marginTop: 8 },
    retryText: { color: '#fff', fontWeight: '700' },

    // Empty state
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, gap: 12 },
    emptyIconWrap: { width: 110, height: 110, borderRadius: 55, backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    emptyTitle: { fontSize: 22, fontWeight: '800', color: '#111827' },
    emptySubtitle: { fontSize: 14, color: '#9CA3AF', textAlign: 'center' },
    shopButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#16A34A', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 50, gap: 8, marginTop: 8, shadowColor: '#16A34A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 4 },
    shopButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },

    // Free delivery progress
    deliveryProgress: { backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    deliveryProgressHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    deliveryProgressText: { fontSize: 13, color: '#374151', flex: 1 },
    progressBar: { height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: '#16A34A', borderRadius: 2 },

    // Cart items
    cartList: { padding: 16, paddingBottom: 8 },
    cartItem: {
        backgroundColor: '#fff', borderRadius: 18, marginBottom: 12,
        flexDirection: 'row', padding: 14,
        borderWidth: 1, borderColor: '#F3F4F6',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
    },
    itemImgWrap: { width: 82, height: 82, borderRadius: 14, overflow: 'hidden', marginRight: 14, position: 'relative' },
    itemImage: { width: '100%', height: '100%' },
    imgPlaceholder: { backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center' },
    itemDiscount: { position: 'absolute', bottom: 4, left: 4, backgroundColor: '#F97316', borderRadius: 6, paddingHorizontal: 5, paddingVertical: 2 },
    itemDiscountText: { color: '#fff', fontSize: 9, fontWeight: '800' },
    itemDetails: { flex: 1, justifyContent: 'space-between' },
    itemTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    itemName: { fontSize: 14, fontWeight: '700', color: '#111827', flex: 1, marginRight: 8, lineHeight: 20 },
    removeBtn: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center' },
    itemUnit: { fontSize: 12, color: '#9CA3AF', marginTop: 4, marginBottom: 8 },
    qtyPriceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    qtyControl: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden', backgroundColor: '#F9FAFB' },
    qtyBtn: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
    qtyBtnPlus: { backgroundColor: '#16A34A' },
    qtyText: { fontSize: 14, fontWeight: '800', color: '#111827', paddingHorizontal: 12 },
    priceBlock: { alignItems: 'flex-end' },
    itemSubtotal: { fontSize: 16, fontWeight: '800', color: '#111827' },
    itemOriginal: { fontSize: 11, color: '#D1D5DB', textDecorationLine: 'line-through', marginTop: 2 },

    // Free delivery badge
    freeDeliveryBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FDF4', padding: 12, borderRadius: 12, gap: 8, marginTop: 4 },
    freeDeliveryText: { fontSize: 13, color: '#166534', fontWeight: '600', flex: 1 },

    // Footer
    footer: { backgroundColor: '#fff', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24, borderTopWidth: 1, borderTopColor: '#F3F4F6', elevation: 12, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.06, shadowRadius: 12 },
    savingsRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FDF4', padding: 10, borderRadius: 12, gap: 8, marginBottom: 14 },
    savingsEmoji: { fontSize: 16 },
    savingsText: { fontSize: 13, color: '#166534', flex: 1 },
    summaryBlock: { marginBottom: 16 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    summaryLabel: { fontSize: 14, color: '#6B7280' },
    summaryValue: { fontSize: 14, fontWeight: '600', color: '#111827' },
    freeText: { color: '#16A34A', fontWeight: '700' },
    divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 10 },
    totalLabel: { fontSize: 16, fontWeight: '700', color: '#111827' },
    totalValue: { fontSize: 22, fontWeight: '800', color: '#16A34A' },
    checkoutButton: {
        backgroundColor: '#16A34A', flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', paddingVertical: 16, paddingHorizontal: 20, borderRadius: 18,
        shadowColor: '#16A34A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
    },
    checkoutButtonText: { color: '#fff', fontSize: 17, fontWeight: '800' },
    checkoutArrow: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
});
