import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert, SafeAreaView, ActivityIndicator, Platform } from 'react-native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { apiService } from '../../services/api';
import { emitDeliveryStatusUpdate } from '../../services/socket';

const OrderDetailsScreen = ({ route, navigation }) => {
    const { orderId } = route.params;
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    const PRIMARY_ACCENT = '#FC8019';
    const GREEN = '#16A34A';

    useEffect(() => {
        fetchOrderDetails();
    }, [orderId]);

    const fetchOrderDetails = async () => {
        try {
            setLoading(true);
            const response = await apiService.getDeliveryOrderById(orderId);
            const orderData = response.data?.order || response.data;
            setOrder(orderData);
        } catch (error) {
            console.error('Error fetching order:', error);
            Alert.alert('Error', 'Failed to load order');
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

    const handleCall = (phone) => {
        if (phone) Linking.openURL(`tel:${phone}`);
        else Alert.alert('Info', 'Phone number not available');
    };

    const handleNavigate = (address) => {
        if (address) {
            const query = encodeURIComponent(`${address.houseNumber || ''} ${address.street || ''} ${address.city || ''}`);
            const url = Platform.OS === 'ios'
                ? `maps:?daddr=${query}`
                : `google.navigation:q=${query}`;
            Linking.openURL(url).catch(() => {
                Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
            });
        }
    };

    const handleAction = async (actionType) => {
        try {
            setActionLoading(true);
            if (actionType === 'start') {
                await apiService.startNavigation(orderId);
                emitDeliveryStatusUpdate({ orderId, status: 'in_transit' });
            } else if (actionType === 'pickup') {
                await apiService.confirmPickup(orderId);
                emitDeliveryStatusUpdate({ orderId, status: 'picked_up' });
            }
            fetchOrderDetails();
        } catch (error) {
            Alert.alert('Error', 'Action failed. Please try again.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleRaiseIssue = () => {
        navigation.navigate('RaiseIssue', { orderId, order });
    };

    if (loading || !order) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={PRIMARY_ACCENT} />
            </SafeAreaView>
        );
    }

    const isPickedUp = ['picked_up', 'in_transit', 'out_for_delivery'].includes(order.deliveryPartnerStatus);
    const isAccepted = order.deliveryPartnerStatus === 'accepted';

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={28} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Order #{order._id?.substring(18).toUpperCase()}</Text>
                <TouchableOpacity onPress={handleRaiseIssue}>
                    <Ionicons name="warning" size={28} color="#F59E0B" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                
                {/* Status Progress Bar */}
                <View style={styles.statusCard}>
                    <Text style={styles.statusCardTitle}>Delivery Status</Text>
                    <View style={styles.statusStepsRow}>
                        {[
                            { key: 'accepted', label: 'Accepted', icon: 'checkmark-circle' },
                            { key: 'picked_up', label: 'Picked Up', icon: 'cube' },
                            { key: 'in_transit', label: 'On Way', icon: 'bicycle' },
                            { key: 'delivered', label: 'Delivered', icon: 'flag' },
                        ].map((step, i, arr) => {
                            const stages = ['accepted', 'picked_up', 'in_transit', 'delivered'];
                            const currentIdx = stages.indexOf(order.deliveryPartnerStatus);
                            const stepIdx = stages.indexOf(step.key);
                            const isCompleted = stepIdx < currentIdx;
                            const isCurrent = stepIdx === currentIdx;

                            return (
                                <React.Fragment key={step.key}>
                                    <View style={styles.progressStep}>
                                        <View style={[
                                            styles.progressCircle,
                                            isCompleted && styles.progressCompleted,
                                            isCurrent && styles.progressCurrent,
                                        ]}>
                                            <Ionicons name={step.icon} size={18} color={isCompleted || isCurrent ? '#FFF' : '#6B7280'} />
                                        </View>
                                        <Text style={[styles.progressLabel, (isCompleted || isCurrent) && { color: '#FFF' }]}>{step.label}</Text>
                                    </View>
                                    {i < arr.length - 1 && (
                                        <View style={[styles.progressLine, isCompleted && styles.progressLineActive]} />
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </View>
                </View>
                
                {/* STEP 1: PICKUP */}
                <View style={[styles.stepCard, isPickedUp && styles.stepCompleted]}>
                    <View style={styles.stepHeader}>
                        <View style={[styles.stepBadge, isPickedUp && { backgroundColor: GREEN }]}>
                            {isPickedUp ? <Ionicons name="checkmark" size={18} color="#FFF" /> : <Text style={styles.stepBadgeText}>1</Text>}
                        </View>
                        <Text style={styles.stepTitle}>Pick up from Store</Text>
                    </View>
                    <Text style={styles.entityName}>{order.seller?.businessDetails?.businessName || 'Seller'}</Text>
                    <Text style={styles.addressText}>
                        {order.seller?.address?.street || order.seller?.address?.city || 'Address not available'}
                    </Text>
                    
                    {!isPickedUp && (
                        <View style={styles.actionRow}>
                            <TouchableOpacity style={styles.circleBtn} onPress={() => handleCall(order.seller?.phone)}>
                                <Ionicons name="call" size={24} color="#FFF" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.circleBtn} onPress={() => handleNavigate(order.seller?.address)}>
                                <Ionicons name="navigate" size={24} color="#FFF" />
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.mainActionBtn, { backgroundColor: PRIMARY_ACCENT }]}
                                onPress={() => handleAction('pickup')}
                                disabled={actionLoading}
                            >
                                {actionLoading ? <ActivityIndicator color="#FFF"/> : <Text style={styles.mainActionText}>MARK PICKED UP</Text>}
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* STEP 2: DELIVER */}
                <View style={[styles.stepCard, !isPickedUp && styles.stepDisabled]}>
                    <View style={styles.stepHeader}>
                        <View style={[styles.stepBadge, !isPickedUp && {backgroundColor: '#374151'}]}><Text style={styles.stepBadgeText}>2</Text></View>
                        <Text style={styles.stepTitle}>Deliver to Customer</Text>
                    </View>
                    <Text style={styles.entityName}>{order.shippingAddress?.name}</Text>
                    <Text style={styles.addressText}>{order.shippingAddress?.houseNumber}, {order.shippingAddress?.street}</Text>
                    
                    {isPickedUp && (
                        <View style={styles.actionRow}>
                            <TouchableOpacity style={styles.circleBtn} onPress={() => handleCall(order.shippingAddress?.phone)}>
                                <Ionicons name="call" size={24} color="#FFF" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.circleBtn} onPress={() => handleNavigate(order.shippingAddress)}>
                                <Ionicons name="navigate" size={24} color="#FFF" />
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={styles.chatBtn}
                                onPress={() => navigation.navigate('SupportChat', { orderId: order._id })}
                            >
                                <Ionicons name="chatbubbles" size={22} color="#FFF" />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* ORDER ITEMS */}
                <View style={styles.itemsCard}>
                    <Text style={styles.sectionTitle}>Order Items</Text>
                    {order.orderItems && order.orderItems.length > 0 ? (
                        order.orderItems.map((item, idx) => (
                            <View key={idx} style={styles.itemRow}>
                                <View style={styles.itemQtyBadge}>
                                    <Text style={styles.itemQtyText}>{item.qty || item.quantity || 1}x</Text>
                                </View>
                                <View style={styles.itemInfo}>
                                    <Text style={styles.itemName} numberOfLines={1}>{item.name || item.product?.name || 'Item'}</Text>
                                    <Text style={styles.itemVariant}>{item.variant || item.weight || ''}</Text>
                                </View>
                                <Text style={styles.itemPrice}>₹{item.price || 0}</Text>
                            </View>
                        ))
                    ) : (
                        <Text style={styles.noItemsText}>No items available</Text>
                    )}
                </View>

                {/* PAYMENT INFO */}
                <View style={styles.paymentCard}>
                    <View style={styles.paymentHeader}>
                        <MaterialCommunityIcons name="cash-multiple" size={24} color={PRIMARY_ACCENT} />
                        <Text style={styles.paymentTitle}>Payment Summary</Text>
                    </View>
                    <View style={styles.paymentLine}>
                        <Text style={styles.paymentLineLabel}>Subtotal</Text>
                        <Text style={styles.paymentLineValue}>₹{order.itemsPrice || order.totalPrice}</Text>
                    </View>
                    {order.deliveryFee ? (
                        <View style={styles.paymentLine}>
                            <Text style={styles.paymentLineLabel}>Delivery Fee</Text>
                            <Text style={styles.paymentLineValue}>₹{order.deliveryFee}</Text>
                        </View>
                    ) : null}
                    <View style={styles.paymentDivider} />
                    <View style={styles.paymentLine}>
                        <Text style={styles.paymentTotalLabel}>Total (COD)</Text>
                        <Text style={styles.paymentTotalValue}>₹{order.totalPrice}</Text>
                    </View>
                </View>

            </ScrollView>

            {/* MASSIVE BOTTOM BUTTON FOR COMPLETION */}
            {isPickedUp && (
                <View style={styles.bottomSafeArea}>
                    <TouchableOpacity 
                        style={[styles.massiveCompleteBtn, { backgroundColor: GREEN }]}
                        onPress={() => navigation.navigate('DeliveryConfirmation', { orderId: order._id })}
                    >
                        <Text style={styles.massiveCompleteText}>COLLECT CASH & VERIFY OTP</Text>
                        <Ionicons name="shield-checkmark" size={32} color="#FFF" />
                    </TouchableOpacity>
                </View>
            )}

            {/* Start Navigation button after pickup */}
            {isAccepted && (
                <View style={styles.bottomSafeArea}>
                    <TouchableOpacity 
                        style={[styles.massiveCompleteBtn, { backgroundColor: '#2563EB' }]}
                        onPress={() => handleNavigate(order.seller?.address)}
                    >
                        <Text style={styles.massiveCompleteText}>NAVIGATE TO STORE</Text>
                        <Ionicons name="navigate" size={32} color="#FFF" />
                    </TouchableOpacity>
                </View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#111827' },
    loadingContainer: { flex: 1, backgroundColor: '#111827', justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#1F2937' },
    headerTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
    content: { padding: 20, paddingBottom: 40 },

    // Status card
    statusCard: { backgroundColor: '#1F2937', borderRadius: 16, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: '#374151' },
    statusCardTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginBottom: 16 },
    statusStepsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    progressStep: { alignItems: 'center' },
    progressCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#374151', justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
    progressCompleted: { backgroundColor: '#16A34A' },
    progressCurrent: { backgroundColor: '#FC8019' },
    progressLabel: { color: '#6B7280', fontSize: 10, fontWeight: '600' },
    progressLine: { width: 24, height: 3, backgroundColor: '#374151', marginBottom: 20, marginHorizontal: 2 },
    progressLineActive: { backgroundColor: '#16A34A' },

    // Step cards
    stepCard: { backgroundColor: '#1F2937', borderRadius: 16, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: '#374151' },
    stepDisabled: { opacity: 0.5 },
    stepCompleted: { borderColor: '#34D399' },
    stepHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    stepBadge: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#FC8019', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    stepBadgeText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
    stepTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold', flex: 1 },
    entityName: { color: '#FFF', fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
    addressText: { color: '#9CA3AF', fontSize: 16, lineHeight: 24, marginBottom: 20 },
    actionRow: { flexDirection: 'row', alignItems: 'center' },
    circleBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#374151', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    chatBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#7C3AED', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    mainActionBtn: { flex: 1, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
    mainActionText: { color: '#FFF', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },

    // Items
    itemsCard: { backgroundColor: '#1F2937', borderRadius: 16, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: '#374151' },
    sectionTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
    itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#374151' },
    itemQtyBadge: { backgroundColor: '#374151', width: 36, height: 36, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    itemQtyText: { color: '#FC8019', fontWeight: 'bold', fontSize: 14 },
    itemInfo: { flex: 1 },
    itemName: { color: '#FFF', fontSize: 16, fontWeight: '600' },
    itemVariant: { color: '#9CA3AF', fontSize: 13, marginTop: 2 },
    itemPrice: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
    noItemsText: { color: '#6B7280', fontSize: 14 },

    // Payment
    paymentCard: { backgroundColor: '#1F2937', borderRadius: 16, padding: 20, marginBottom: 40, borderWidth: 1, borderColor: '#374151' },
    paymentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    paymentTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginLeft: 10 },
    paymentLine: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    paymentLineLabel: { color: '#9CA3AF', fontSize: 15 },
    paymentLineValue: { color: '#D1D5DB', fontSize: 15 },
    paymentDivider: { height: 1, backgroundColor: '#374151', marginVertical: 12 },
    paymentTotalLabel: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
    paymentTotalValue: { color: '#FFF', fontSize: 24, fontWeight: '900' },

    // Bottom
    bottomSafeArea: { padding: 20, backgroundColor: '#1F2937', borderTopWidth: 1, borderTopColor: '#374151' },
    massiveCompleteBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 72, borderRadius: 16, paddingHorizontal: 24 },
    massiveCompleteText: { color: '#FFF', fontSize: 18, fontWeight: '900', letterSpacing: 1 }
});

export default OrderDetailsScreen;
