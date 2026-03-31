// [Premium Figma-level Redesign — CheckoutScreen]
// Replaces react-native-paper Card/RadioButton/Button with native premium design
import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator,
    TouchableOpacity, Image, Linking, SafeAreaView, StatusBar,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { apiService } from '../../services/api';
import { clearCart } from '../../redux/actions/cartActions';
import { getRewards } from '../../redux/actions/rewardsActions';
import { API_URL } from '../../config/env';

function SectionCard({ children, style }) {
    return <View style={[styles.sectionCard, style]}>{children}</View>;
}

function SectionHeader({ icon, iconBg, iconColor, title, action }) {
    return (
        <View style={styles.sectionHeaderRow}>
            <View style={[styles.sectionIconBox, { backgroundColor: iconBg }]}>
                <Feather name={icon} size={18} color={iconColor} />
            </View>
            <Text style={styles.sectionHeaderTitle}>{title}</Text>
            {action}
        </View>
    );
}

const CheckoutScreen = ({ navigation }) => {
    const dispatch = useDispatch();
    const cart = useSelector((state) => state.cart);
    const { cartItems } = cart;

    const [addresses, setAddresses] = useState([]);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('cod');
    const [loading, setLoading] = useState(false);
    const [fetchingAddresses, setFetchingAddresses] = useState(true);
    const [useRewards, setUseRewards] = useState(false);
    const [deliveryFee, setDeliveryFee] = useState(0);
    const [freeDelivery, setFreeDelivery] = useState(false);

    const rewardsState = useSelector((state) => state.rewards);
    const { rewards } = rewardsState;
    const rewardsBalance = rewards?.balance || 0;

    useFocusEffect(
        useCallback(() => {
            fetchAddresses();
            dispatch(getRewards());
        }, [])
    );

    const fetchAddresses = async () => {
        try {
            setFetchingAddresses(true);
            const response = await apiService.getAddresses();
            const addrList = response.data || [];
            setAddresses(addrList);
            if (addrList.length > 0) {
                setSelectedAddress(addrList[0]);
                fetchDeliveryFee(addrList[0]);
            }
        } catch (error) {
            console.error('Error fetching addresses:', error);
        } finally {
            setFetchingAddresses(false);
        }
    };

    const calculateSubtotal = () => cartItems.reduce((total, item) => {
        const price = item.product?.offerPrice || item.product?.price || 0;
        return total + price * (item.quantity || 1);
    }, 0);

    const calculateDiscount = () => {
        if (!useRewards) return 0;
        return Math.min(rewardsBalance, calculateSubtotal());
    };

    const calculateTotal = () => calculateSubtotal() + deliveryFee - calculateDiscount();

    const fetchDeliveryFee = async (address) => {
        if (!address) return;
        try {
            const subtotal = calculateSubtotal();
            const response = await apiService.getDeliveryFeePreview({ shippingAddressId: address._id, orderTotal: subtotal });
            const data = response.data;
            setDeliveryFee(data.deliveryFee || 0);
            setFreeDelivery(data.freeDelivery || false);
        } catch (error) {
            setDeliveryFee(0);
        }
    };

    useEffect(() => {
        const handleDeepLink = (event) => {
            if (event.url && event.url.includes('payment-success')) {
                const match = event.url.match(/orderId=([^&]+)/);
                const orderId = match ? match[1] : null;
                if (orderId) {
                    dispatch(clearCart());
                    navigation.navigate('OrderSuccess', { orderId });
                }
            }
        };
        const subscription = Linking.addEventListener('url', handleDeepLink);
        Linking.getInitialURL().then(url => { if (url) handleDeepLink({ url }); });
        return () => subscription.remove();
    }, [dispatch, navigation]);

    const handlePlaceOrder = async () => {
        if (!selectedAddress) {
            Alert.alert('Address Required', 'Please select or add a shipping address.');
            return;
        }
        const total = calculateTotal();
        if (paymentMethod === 'cod' && total < 1500) {
            Alert.alert('Minimum Order Required', 'Cash on Delivery requires orders above ₹1500. Add more items or use Online Payment.');
            return;
        }

        if (paymentMethod === 'online') {
            try {
                setLoading(true);
                const orderData = { shippingAddressId: selectedAddress._id, paymentMethod: 'online', orderItems: cartItems.map(item => ({ product: item.product?._id, qty: item.quantity || item.qty || 1 })), useRewards };
                const response = await apiService.createOrder(orderData);
                const order = Array.isArray(response.data.orders) ? response.data.orders[0] : (response.data.order || response.data);
                const token = await apiService.getAuthToken();
                const paymentUrl = `${API_URL}/api/payments/razorpay/pay/${order._id}?token=${token}`;
                Alert.alert('Proceeding to Payment', 'You will be redirected to our secure payment gateway.', [{ text: 'OK', onPress: async () => { await Linking.openURL(paymentUrl); setLoading(false); } }]);
                return;
            } catch (error) {
                Alert.alert('Payment Error', error.response?.data?.message || 'Failed to initiate payment.');
                setLoading(false);
            }
        }

        if (paymentMethod === 'cod') {
            if (total > 5000) {
                const advanceAmount = Math.round(total * 0.2);
                Alert.alert('Advance Payment Required', `COD orders over ₹5000 require a 20% advance (₹${advanceAmount}).`, [
                    { text: 'Cancel', style: 'cancel', onPress: () => setLoading(false) },
                    { text: 'Proceed', onPress: async () => {
                        try {
                            setLoading(true);
                            const orderData = { shippingAddressId: selectedAddress._id, paymentMethod: 'cod', orderItems: cartItems.map(item => ({ product: item.product?._id, qty: item.quantity || item.qty || 1 })), useRewards };
                            const response = await apiService.createOrder(orderData);
                            const order = Array.isArray(response.data.orders) ? response.data.orders[0] : (response.data.order || response.data);
                            const token = await apiService.getAuthToken();
                            await Linking.openURL(`${API_URL}/api/payments/razorpay/pay-advance/${order._id}?token=${token}`);
                            setLoading(false);
                        } catch (error) {
                            Alert.alert('Payment Error', error.response?.data?.message || 'Failed to initiate advance payment.');
                            setLoading(false);
                        }
                    }}
                ]);
                return;
            }
            try {
                setLoading(true);
                const orderData = { shippingAddressId: selectedAddress._id, paymentMethod, orderItems: cartItems.map(item => ({ product: item.product?._id, qty: item.quantity || item.qty || 1 })), useRewards };
                const response = await apiService.createOrder(orderData);
                dispatch(clearCart());
                const createdOrder = Array.isArray(response.data.orders) ? response.data.orders[0] : response.data;
                navigation.navigate('OrderSuccess', { orderId: createdOrder._id });
            } catch (error) {
                Alert.alert('Error', 'Failed to place order. ' + (error.response?.data?.message || error.message));
            } finally {
                setLoading(false);
            }
        }
    };

    if (cartItems.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={{ fontSize: 64 }}>🛒</Text>
                <Text style={styles.emptyTitle}>Cart is empty!</Text>
                <Text style={styles.emptySub}>Add some products before checkout</Text>
                <TouchableOpacity style={styles.goShopBtn} onPress={() => navigation.navigate('Home')}>
                    <Text style={styles.goShopBtnText}>Browse Products</Text>
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
                <Text style={styles.headerTitle}>Checkout</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

                {/* ── ORDER SUMMARY ── */}
                <SectionCard>
                    <SectionHeader icon="shopping-bag" iconBg="#FFF7ED" iconColor="#F97316" title="Order Summary" />
                    {cartItems.map((item, index) => {
                        const firstImage = item.product?.images?.[0];
                        const imageUri = firstImage?.startsWith('http') ? firstImage : firstImage ? `${API_URL}${firstImage}` : null;
                        const price = item.product?.offerPrice || item.product?.price || 0;
                        return (
                            <View key={index} style={[styles.summaryItem, index < cartItems.length - 1 && styles.summaryItemBorder]}>
                                <View style={styles.summaryImgWrap}>
                                    {imageUri
                                        ? <Image source={{ uri: imageUri }} style={styles.summaryImg} />
                                        : <View style={[styles.summaryImg, styles.summaryImgPlaceholder]}><Text style={{ fontSize: 20 }}>🌾</Text></View>
                                    }
                                </View>
                                <View style={styles.summaryItemInfo}>
                                    <Text style={styles.summaryItemName} numberOfLines={1}>{item.product?.name || 'Product'}</Text>
                                    <Text style={styles.summaryItemUnit}>{item.product?.weight || '1 kg'} × {item.quantity || 1}</Text>
                                </View>
                                <Text style={styles.summaryItemPrice}>₹{(price * (item.quantity || 1)).toFixed(0)}</Text>
                            </View>
                        );
                    })}

                    <View style={styles.priceDivider} />
                    <View style={styles.priceRow}><Text style={styles.priceLabel}>Subtotal</Text><Text style={styles.priceValue}>₹{calculateSubtotal()}</Text></View>
                    <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>Delivery Fee</Text>
                        <Text style={[styles.priceValue, freeDelivery && { color: '#16A34A' }]}>
                            {freeDelivery ? '✓ FREE' : `₹${deliveryFee}`}
                        </Text>
                    </View>
                    {useRewards && calculateDiscount() > 0 && (
                        <View style={styles.priceRow}>
                            <Text style={[styles.priceLabel, { color: '#16A34A' }]}>Rewards Discount</Text>
                            <Text style={[styles.priceValue, { color: '#16A34A' }]}>- ₹{calculateDiscount()}</Text>
                        </View>
                    )}
                    <View style={styles.priceDivider} />
                    <View style={styles.priceRow}>
                        <Text style={styles.totalLabel}>Total Payable</Text>
                        <Text style={styles.totalValue}>₹{calculateTotal()}</Text>
                    </View>
                </SectionCard>

                {/* ── REWARDS ── */}
                {rewardsBalance > 0 && (
                    <SectionCard>
                        <View style={styles.rewardsRow}>
                            <View style={styles.rewardsLeft}>
                                <View style={styles.rewardsIconBox}>
                                    <Text style={{ fontSize: 20 }}>⭐</Text>
                                </View>
                                <View>
                                    <Text style={styles.rewardsTitle}>Use Reward Points</Text>
                                    <Text style={styles.rewardsSub}>{rewardsBalance} pts = ₹{rewardsBalance} OFF</Text>
                                </View>
                            </View>
                            <TouchableOpacity
                                style={[styles.rewardsToggle, useRewards && styles.rewardsToggleActive]}
                                onPress={() => setUseRewards(!useRewards)}
                            >
                                <View style={[styles.rewardsToggleThumb, useRewards && styles.rewardsToggleThumbActive]} />
                            </TouchableOpacity>
                        </View>
                    </SectionCard>
                )}

                {/* ── SHIPPING ADDRESS ── */}
                <SectionCard>
                    <SectionHeader
                        icon="map-pin" iconBg="#F5F3FF" iconColor="#7C3AED" title="Shipping Address"
                        action={
                            <TouchableOpacity onPress={() => navigation.navigate('Addresses')} style={styles.manageBtn}>
                                <Text style={styles.manageBtnText}>Manage</Text>
                            </TouchableOpacity>
                        }
                    />

                    {fetchingAddresses ? (
                        <View style={styles.loadingRow}>
                            <ActivityIndicator color="#16A34A" size="small" />
                            <Text style={styles.loadingText}>Loading addresses...</Text>
                        </View>
                    ) : addresses.length === 0 ? (
                        <View style={styles.noAddressBlock}>
                            <Text style={styles.noAddressText}>No saved addresses found.</Text>
                            <TouchableOpacity style={styles.addAddressBtn} onPress={() => navigation.navigate('AddEditAddress')}>
                                <Feather name="plus" size={16} color="#16A34A" />
                                <Text style={styles.addAddressBtnText}>Add New Address</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        addresses.map((addr) => (
                            <TouchableOpacity
                                key={addr._id}
                                style={[styles.addressCard, selectedAddress?._id === addr._id && styles.addressCardActive]}
                                onPress={() => { setSelectedAddress(addr); fetchDeliveryFee(addr); }}
                            >
                                <View style={[styles.addressRadio, selectedAddress?._id === addr._id && styles.addressRadioActive]}>
                                    {selectedAddress?._id === addr._id && <View style={styles.addressRadioInner} />}
                                </View>
                                <View style={styles.addressInfo}>
                                    <View style={styles.addressNameRow}>
                                        <Text style={styles.addressName}>{addr.name}</Text>
                                        {addr.isDefault && <View style={styles.defaultBadge}><Text style={styles.defaultBadgeText}>Default</Text></View>}
                                    </View>
                                    <Text style={styles.addressLine}>{addr.houseNumber}, {addr.colony && `${addr.colony}, `}{addr.street}</Text>
                                    {addr.landmark && <Text style={styles.addressLine}>Near {addr.landmark}</Text>}
                                    <Text style={styles.addressLine}>{addr.city}, {addr.state} — {addr.pinCode}</Text>
                                    <Text style={styles.addressPhone}>📱 {addr.phone}</Text>
                                </View>
                            </TouchableOpacity>
                        ))
                    )}
                </SectionCard>

                {/* ── PAYMENT METHOD ── */}
                <SectionCard>
                    <SectionHeader icon="credit-card" iconBg="#F0FDF4" iconColor="#16A34A" title="Payment Method" />

                    <View style={styles.paymentOptions}>
                        <TouchableOpacity
                            style={[styles.paymentTile, paymentMethod === 'cod' && styles.paymentTileActive]}
                            onPress={() => setPaymentMethod('cod')}
                        >
                            <View style={styles.paymentTileIcon}>
                                <Text style={{ fontSize: 24 }}>💵</Text>
                            </View>
                            <View style={styles.paymentTileInfo}>
                                <Text style={[styles.paymentTileTitle, paymentMethod === 'cod' && { color: '#16A34A' }]}>Cash on Delivery</Text>
                                <Text style={styles.paymentTileSub}>Min order ₹1500</Text>
                            </View>
                            {paymentMethod === 'cod' && <Ionicons name="checkmark-circle" size={22} color="#16A34A" />}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.paymentTile, paymentMethod === 'online' && styles.paymentTileActive]}
                            onPress={() => setPaymentMethod('online')}
                        >
                            <View style={styles.paymentTileIcon}>
                                <Text style={{ fontSize: 24 }}>💳</Text>
                            </View>
                            <View style={styles.paymentTileInfo}>
                                <Text style={[styles.paymentTileTitle, paymentMethod === 'online' && { color: '#16A34A' }]}>Online Payment</Text>
                                <Text style={styles.paymentTileSub}>UPI, Cards, Netbanking</Text>
                            </View>
                            {paymentMethod === 'online' && <Ionicons name="checkmark-circle" size={22} color="#16A34A" />}
                        </TouchableOpacity>
                    </View>

                    <View style={styles.secureNote}>
                        <Feather name="shield" size={14} color="#16A34A" />
                        <Text style={styles.secureNoteText}>100% Secure & Encrypted Payments</Text>
                    </View>
                </SectionCard>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* ── STICKY PLACE ORDER BUTTON ── */}
            <View style={styles.stickyFooter}>
                <View style={styles.totalRow}>
                    <Text style={styles.footerTotalLabel}>Total</Text>
                    <Text style={styles.footerTotalValue}>₹{calculateTotal()}</Text>
                </View>
                <TouchableOpacity
                    style={[styles.placeOrderBtn, (loading || !selectedAddress) && styles.placeOrderBtnDisabled]}
                    onPress={handlePlaceOrder}
                    disabled={loading || !selectedAddress}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Text style={styles.placeOrderBtnText}>Place Order</Text>
                            <View style={styles.placeOrderArrow}>
                                <Feather name="arrow-right" size={18} color="#16A34A" />
                            </View>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, gap: 12 },
    emptyTitle: { fontSize: 22, fontWeight: '800', color: '#111827' },
    emptySub: { fontSize: 14, color: '#9CA3AF', textAlign: 'center' },
    goShopBtn: { backgroundColor: '#16A34A', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 50, marginTop: 8 },
    goShopBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F9FAFB', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },

    scroll: { flex: 1 },
    sectionCard: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 14, borderRadius: 20, padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: '#F3F4F6' },
    sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 10 },
    sectionIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    sectionHeaderTitle: { flex: 1, fontSize: 15, fontWeight: '800', color: '#111827' },
    manageBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#F0FDF4', borderRadius: 50 },
    manageBtnText: { fontSize: 13, fontWeight: '700', color: '#16A34A' },

    // Order summary
    summaryItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
    summaryItemBorder: { borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
    summaryImgWrap: { width: 44, height: 44, borderRadius: 10, overflow: 'hidden', marginRight: 12 },
    summaryImg: { width: '100%', height: '100%' },
    summaryImgPlaceholder: { backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center' },
    summaryItemInfo: { flex: 1 },
    summaryItemName: { fontSize: 13, fontWeight: '700', color: '#111827' },
    summaryItemUnit: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
    summaryItemPrice: { fontSize: 14, fontWeight: '800', color: '#111827' },

    priceDivider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 10 },
    priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    priceLabel: { fontSize: 14, color: '#6B7280' },
    priceValue: { fontSize: 14, fontWeight: '600', color: '#111827' },
    totalLabel: { fontSize: 16, fontWeight: '700', color: '#111827' },
    totalValue: { fontSize: 20, fontWeight: '800', color: '#16A34A' },

    // Rewards
    rewardsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    rewardsLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    rewardsIconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#FEFCE8', alignItems: 'center', justifyContent: 'center' },
    rewardsTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
    rewardsSub: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
    rewardsToggle: { width: 50, height: 28, borderRadius: 14, backgroundColor: '#E5E7EB', justifyContent: 'center', paddingHorizontal: 3 },
    rewardsToggleActive: { backgroundColor: '#16A34A' },
    rewardsToggleThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2, elevation: 2 },
    rewardsToggleThumbActive: { alignSelf: 'flex-end' },

    // Addresses
    loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
    loadingText: { color: '#6B7280', fontSize: 14 },
    noAddressBlock: { alignItems: 'center', padding: 16, gap: 12 },
    noAddressText: { color: '#9CA3AF', fontSize: 14 },
    addAddressBtn: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#16A34A', borderRadius: 50, paddingHorizontal: 20, paddingVertical: 10, gap: 6 },
    addAddressBtnText: { color: '#16A34A', fontWeight: '700', fontSize: 14 },
    addressCard: { flexDirection: 'row', padding: 14, borderRadius: 14, borderWidth: 1.5, borderColor: '#E5E7EB', marginBottom: 10, backgroundColor: '#F9FAFB' },
    addressCardActive: { borderColor: '#16A34A', backgroundColor: '#F0FDF4' },
    addressRadio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#D1D5DB', alignItems: 'center', justifyContent: 'center', marginRight: 12, marginTop: 2 },
    addressRadioActive: { borderColor: '#16A34A' },
    addressRadioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#16A34A' },
    addressInfo: { flex: 1 },
    addressNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    addressName: { fontSize: 14, fontWeight: '700', color: '#111827' },
    defaultBadge: { backgroundColor: '#F0FDF4', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 50 },
    defaultBadgeText: { fontSize: 10, fontWeight: '700', color: '#16A34A' },
    addressLine: { fontSize: 13, color: '#6B7280', marginBottom: 2 },
    addressPhone: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },

    // Payment
    paymentOptions: { gap: 10 },
    paymentTile: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB', gap: 12 },
    paymentTileActive: { borderColor: '#16A34A', backgroundColor: '#F0FDF4' },
    paymentTileIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#F3F4F6' },
    paymentTileInfo: { flex: 1 },
    paymentTileTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
    paymentTileSub: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
    secureNote: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14, backgroundColor: '#F0FDF4', padding: 10, borderRadius: 10 },
    secureNoteText: { fontSize: 12, color: '#166534', fontWeight: '600' },

    // Footer
    stickyFooter: { backgroundColor: '#fff', paddingHorizontal: 20, paddingTop: 14, paddingBottom: 24, borderTopWidth: 1, borderTopColor: '#F3F4F6', elevation: 12 },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    footerTotalLabel: { fontSize: 14, color: '#6B7280' },
    footerTotalValue: { fontSize: 22, fontWeight: '800', color: '#111827' },
    placeOrderBtn: { backgroundColor: '#16A34A', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 17, paddingHorizontal: 20, borderRadius: 18, shadowColor: '#16A34A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
    placeOrderBtnDisabled: { backgroundColor: '#86EFAC', shadowOpacity: 0 },
    placeOrderBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
    placeOrderArrow: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
});

export default CheckoutScreen;
