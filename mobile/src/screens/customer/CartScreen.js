import React, { useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Image,
    SafeAreaView,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { getCart, removeFromCart, updateCartItem } from '../../redux/actions/cartActions';
import { API_URL } from '../../config/env';

export default function CartScreen({ navigation }) {
    const dispatch = useDispatch();
    const cart = useSelector((state) => state.cart);
    const { cartItems = [], loading, error } = cart || {};
    const { t } = useTranslation();

    useEffect(() => { dispatch(getCart()); }, [dispatch]);

    const handleUpdateQuantity = (productId, newQuantity) => {
        if (newQuantity < 1) { handleRemoveItem(productId); return; }
        dispatch(updateCartItem(productId, newQuantity));
    };

    const handleRemoveItem = (productId) => dispatch(removeFromCart(productId));

    const calculateTotal = () => cartItems.reduce((total, item) => {
        const price = item.product?.offerPrice || item.product?.price || 0;
        return total + price * (item.quantity || 1);
    }, 0);

    const deliveryFee = calculateTotal() > 500 ? 0 : 50;
    const grandTotal = calculateTotal() + deliveryFee;

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

        return (
            <View style={styles.cartItem}>
                <View style={styles.itemImgWrap}>
                    {imageUri
                        ? <Image source={{ uri: imageUri }} style={styles.itemImage} resizeMode="cover" />
                        : <View style={[styles.itemImage, styles.imgPlaceholder]}><Ionicons name="image-outline" size={24} color="#D1D5DB" /></View>}
                </View>
                <View style={styles.itemDetails}>
                    <View style={styles.itemTopRow}>
                        <Text style={styles.itemName} numberOfLines={2}>{product.name || 'Product'}</Text>
                        <TouchableOpacity onPress={() => handleRemoveItem(product._id)} style={styles.removeBtn}>
                            <Ionicons name="trash-outline" size={16} color="#9CA3AF" />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.itemUnit}>{product.weight || '1 kg'}</Text>
                    <View style={styles.qtyPriceRow}>
                        <View style={styles.qtyControl}>
                            <TouchableOpacity style={styles.qtyBtn} onPress={() => handleUpdateQuantity(product._id, (item.quantity || 1) - 1)}>
                                <MaterialIcons name="remove" size={16} color="#4B5563" />
                            </TouchableOpacity>
                            <Text style={styles.qtyText}>{item.quantity || 1}</Text>
                            <TouchableOpacity style={[styles.qtyBtn, styles.qtyBtnPlus]} onPress={() => handleUpdateQuantity(product._id, (item.quantity || 1) + 1)}>
                                <MaterialIcons name="add" size={16} color="#fff" />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.itemSubtotal}>₹{subtotal.toFixed(0)}</Text>
                    </View>
                </View>
            </View>
        );
    };

    if (loading && cartItems.length === 0) {
        return <View style={styles.centerContainer}><ActivityIndicator size="large" color="#16A34A" /></View>;
    }

    if (error) {
        return (
            <View style={styles.centerContainer}>
                <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={() => dispatch(getCart())}>
                    <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Cart</Text>
                {cartItems.length > 0 && (
                    <Text style={styles.headerCount}>{cartItems.length} items</Text>
                )}
            </View>

            {cartItems.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <View style={styles.emptyIcon}>
                        <Ionicons name="cart-outline" size={56} color="#16A34A" />
                    </View>
                    <Text style={styles.emptyText}>Your cart is empty</Text>
                    <Text style={styles.emptySubText}>Add items to get started</Text>
                    <TouchableOpacity style={styles.shopButton} onPress={() => navigation.navigate('Home')}>
                        <Text style={styles.shopButtonText}>Browse Products</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <>
                    <FlatList
                        data={cartItems}
                        renderItem={renderCartItem}
                        keyExtractor={(item) => item.product?._id || Math.random().toString()}
                        contentContainerStyle={styles.cartList}
                        refreshing={loading}
                        onRefresh={() => dispatch(getCart())}
                        ListFooterComponent={
                            <View style={styles.deliveryNote}>
                                <Ionicons name="checkmark-circle" size={16} color="#16A34A" />
                                <Text style={styles.deliveryNoteText}>
                                    {calculateTotal() > 500 ? 'Free delivery on this order!' : `Add ₹${500 - calculateTotal()} more for free delivery`}
                                </Text>
                            </View>
                        }
                    />

                    {/* Price Summary */}
                    <View style={styles.footer}>
                        <View style={styles.summaryBlock}>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Item Total</Text>
                                <Text style={styles.summaryValue}>₹{calculateTotal().toFixed(0)}</Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Delivery Fee</Text>
                                <Text style={[styles.summaryValue, deliveryFee === 0 && { color: '#16A34A', fontWeight: '700' }]}>
                                    {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                                </Text>
                            </View>
                            <View style={styles.divider} />
                            <View style={styles.summaryRow}>
                                <Text style={styles.totalLabel}>Grand Total</Text>
                                <Text style={styles.totalValue}>₹{grandTotal.toFixed(0)}</Text>
                            </View>
                        </View>

                        <TouchableOpacity style={styles.checkoutButton} onPress={handleCheckout}>
                            <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
                            <Ionicons name="arrow-forward" size={20} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
    headerCount: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    emptyIcon: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    emptyText: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 8 },
    emptySubText: { fontSize: 14, color: '#6B7280', marginBottom: 28 },
    shopButton: { backgroundColor: '#16A34A', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14 },
    shopButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
    cartList: { padding: 16, paddingBottom: 8 },
    cartItem: {
        backgroundColor: '#fff', borderRadius: 16, marginBottom: 12,
        flexDirection: 'row', padding: 14,
        borderWidth: 1, borderColor: '#F3F4F6', elevation: 1,
    },
    itemImgWrap: { width: 80, height: 80, borderRadius: 12, overflow: 'hidden', marginRight: 14 },
    itemImage: { width: '100%', height: '100%' },
    imgPlaceholder: { backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
    itemDetails: { flex: 1, justifyContent: 'space-between' },
    itemTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    itemName: { fontSize: 14, fontWeight: '700', color: '#111827', flex: 1, marginRight: 8, lineHeight: 20 },
    removeBtn: { padding: 2 },
    itemUnit: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
    qtyPriceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
    qtyControl: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden' },
    qtyBtn: { width: 30, height: 30, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6' },
    qtyBtnPlus: { backgroundColor: '#16A34A' },
    qtyText: { fontSize: 14, fontWeight: '700', color: '#111827', paddingHorizontal: 14 },
    itemSubtotal: { fontSize: 16, fontWeight: '800', color: '#111827' },
    deliveryNote: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FDF4', marginHorizontal: 0, padding: 12, borderRadius: 10, gap: 8 },
    deliveryNoteText: { fontSize: 13, color: '#166534', fontWeight: '500', flex: 1 },
    footer: { backgroundColor: '#fff', padding: 20, borderTopWidth: 1, borderTopColor: '#F3F4F6', elevation: 10 },
    summaryBlock: { marginBottom: 16 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    summaryLabel: { fontSize: 14, color: '#6B7280' },
    summaryValue: { fontSize: 14, fontWeight: '600', color: '#111827' },
    divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 10 },
    totalLabel: { fontSize: 16, fontWeight: '700', color: '#111827' },
    totalValue: { fontSize: 20, fontWeight: '800', color: '#16A34A' },
    checkoutButton: { backgroundColor: '#16A34A', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 16, borderRadius: 14, gap: 10 },
    checkoutButtonText: { color: '#fff', fontSize: 16, fontWeight: '800' },
    errorText: { color: '#EF4444', marginTop: 10, textAlign: 'center' },
    retryButton: { marginTop: 20, padding: 12, backgroundColor: '#16A34A', borderRadius: 10, paddingHorizontal: 24 },
    retryText: { color: '#fff', fontWeight: '700' },
});
