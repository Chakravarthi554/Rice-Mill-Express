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
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { getCart, removeFromCart, updateCartItem } from '../../redux/actions/cartActions';
import { API_URL } from '../../config/env';

export default function CartScreen({ navigation }) {
    const dispatch = useDispatch();
    const cart = useSelector((state) => state.cart);
    const { cartItems = [], loading, error } = cart || {};
    const { t } = useTranslation();

    useEffect(() => {
        dispatch(getCart());
    }, [dispatch]);

    const handleUpdateQuantity = (productId, newQuantity) => {
        if (newQuantity < 1) {
            handleRemoveItem(productId);
            return;
        }
        dispatch(updateCartItem(productId, newQuantity));
    };

    const handleRemoveItem = (productId) => {
        dispatch(removeFromCart(productId));
    };

    const calculateTotal = () => {
        return cartItems.reduce((total, item) => {
            const price = item.product?.offerPrice || item.product?.price || 0;
            return total + price * (item.quantity || 1);
        }, 0);
    };

    const handleCheckout = () => {
        if (cartItems.length === 0) {
            Alert.alert(t('cart'), t('emptyCartMessage'));
            return;
        }
        navigation.navigate('Checkout');
    };

    const renderCartItem = ({ item }) => {
        const product = item.product || {};
        const firstImage = product.images?.[0];
        const imageUri = firstImage?.startsWith('http')
            ? firstImage
            : firstImage
                ? `${API_URL}${firstImage}`
                : 'https://via.placeholder.com/150';

        return (
            <View style={styles.cartItem}>
                <Image source={{ uri: imageUri }} style={styles.itemImage} resizeMode="cover" />
                <View style={styles.itemMainInfo}>
                    <View style={styles.itemHeader}>
                        <Text style={styles.itemName} numberOfLines={2}>{product.name || 'Product'}</Text>
                        <TouchableOpacity
                            onPress={() => handleRemoveItem(product._id)}
                            style={styles.deleteButton}
                        >
                            <MaterialIcons name="close" size={20} color="#999" />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.itemPrice}>₹{product.offerPrice || product.price || 0}</Text>

                    <View style={styles.quantityRow}>
                        <View style={styles.quantityControl}>
                            <TouchableOpacity
                                style={styles.qtyBtn}
                                onPress={() => handleUpdateQuantity(product._id, (item.quantity || 1) - 1)}
                            >
                                <MaterialIcons name="remove" size={16} color="#666" />
                            </TouchableOpacity>
                            <Text style={styles.quantityText}>{item.quantity || 1}</Text>
                            <TouchableOpacity
                                style={styles.qtyBtn}
                                onPress={() => handleUpdateQuantity(product._id, (item.quantity || 1) + 1)}
                            >
                                <MaterialIcons name="add" size={16} color="#4CAF50" />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.itemSubtotal}>₹{(product.offerPrice || product.price || 0) * (item.quantity || 1)}</Text>
                    </View>
                </View>
            </View>
        );
    };

    if (loading && cartItems.length === 0) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#4CAF50" />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centerContainer}>
                <MaterialIcons name="error-outline" size={48} color="#f44336" />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={() => dispatch(getCart())}>
                    <Text style={styles.retryText}>{t('retry')}</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {cartItems.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <MaterialIcons name="shopping-cart-checkout" size={100} color="#ccc" />
                    <Text style={styles.emptyText}>{t('emptyCart')}</Text>
                    <TouchableOpacity
                        style={styles.shopButton}
                        onPress={() => navigation.navigate('Home')}
                    >
                        <Text style={styles.shopButtonText}>{t('startShopping')}</Text>
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
                    />

                    <View style={styles.footer}>
                        <View style={styles.summaryContainer}>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>{t('subtotal')}</Text>
                                <Text style={styles.summaryValue}>₹{calculateTotal()}</Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>{t('delivery')}</Text>
                                <Text style={styles.summaryValue}>{t('calculatedAtCheckout') || 'Calculated at checkout'}</Text>
                            </View>
                            <View style={[styles.summaryRow, styles.totalRow]}>
                                <Text style={styles.totalLabel}>{t('grandTotal')}</Text>
                                <Text style={styles.totalValue}>₹{calculateTotal()}</Text>
                            </View>
                        </View>

                        <TouchableOpacity style={styles.checkoutButton} onPress={handleCheckout}>
                            <Text style={styles.checkoutButtonText}>{t('checkout')}</Text>
                            <MaterialIcons name="arrow-forward" size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyText: {
        fontSize: 18,
        color: '#999',
        marginTop: 20,
        marginBottom: 30,
    },
    shopButton: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 30,
        paddingVertical: 15,
        borderRadius: 8,
        elevation: 2,
    },
    shopButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    cartList: {
        padding: 15,
    },
    cartItem: {
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 15,
        flexDirection: 'row',
        padding: 12,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    itemImage: {
        width: 90,
        height: 90,
        borderRadius: 8,
        backgroundColor: '#f0f0f0',
    },
    itemMainInfo: {
        flex: 1,
        marginLeft: 12,
        justifyContent: 'space-between',
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    itemName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
        marginRight: 8,
    },
    itemPrice: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
    },
    quantityRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
    },
    quantityControl: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f1f3f5',
        borderRadius: 20,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    qtyBtn: {
        width: 28,
        height: 28,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 14,
        elevation: 1,
    },
    quantityText: {
        fontSize: 16,
        fontWeight: 'bold',
        marginHorizontal: 12,
        minWidth: 20,
        textAlign: 'center',
    },
    itemSubtotal: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#4CAF50',
    },
    footer: {
        backgroundColor: '#fff',
        padding: 20,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
    },
    summaryContainer: {
        marginBottom: 20,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    summaryLabel: {
        color: '#666',
        fontSize: 14,
    },
    summaryValue: {
        color: '#333',
        fontSize: 14,
        fontWeight: '500',
    },
    totalRow: {
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingTop: 12,
        marginTop: 4,
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    totalValue: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#4CAF50',
    },
    checkoutButton: {
        backgroundColor: '#4CAF50',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        elevation: 3,
    },
    checkoutButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginRight: 10,
    },
    errorText: {
        color: '#f44336',
        marginTop: 10,
        textAlign: 'center',
    },
    retryButton: {
        marginTop: 20,
        padding: 10,
        backgroundColor: '#4CAF50',
        borderRadius: 8,
    },
    retryText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});
