import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Linking,
    Alert,
    Platform,
    Image,
    SafeAreaView
} from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { apiService } from '../../services/api';
import { API_URL } from '../../config/env';

const OrderDetailsScreen = ({ route, navigation }) => {
    const { orderId } = route.params;
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

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
            console.error('Error fetching order details:', error);
            Alert.alert('Error', 'Failed to load order details');
        } finally {
            setLoading(false);
        }
    };

    const handleCallCustomer = () => {
        if (order?.shippingAddress?.phone) {
            Linking.openURL(`tel:${order.shippingAddress.phone}`);
        }
    };

    const handleStartDelivery = async () => {
        try {
            setActionLoading(true);
            await apiService.startDelivery(orderId);
            Alert.alert('Success', 'Delivery started!');
            fetchOrderDetails();
        } catch (error) {
            console.error('Error starting delivery:', error);
            Alert.alert('Error', 'Failed to start delivery');
        } finally {
            setActionLoading(false);
        }
    };

    const handleCaptureAndComplete = async () => {
        // We will navigate to the dedicated DeliveryConfirmationScreen if it exists to handle both photo and payment
        // Or handle simple capture here if it's already paid. 
        // For consistency, let's navigate to DeliveryConfirmation for the full flow.
        navigation.navigate('DeliveryConfirmation', { orderId: order._id });
    };

    const getStatusBadgeColor = (status) => {
        switch (status) {
            case 'placed': return '#4F46E5';
            case 'processing': return '#EA580C';
            case 'packed': return '#6B7280';
            case 'shipped': return '#3B82F6';
            case 'out_for_delivery': return '#EA580C';
            case 'delivered': return '#16A34A';
            default: return '#9CA3AF';
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <View style={styles.spinnerPlaceholder} />
                <Text style={styles.loadingText}>Loading Order Details...</Text>
            </SafeAreaView>
        );
    }

    if (!order) {
        return (
            <SafeAreaView style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={64} color="#ccc" />
                <Text style={styles.errorText}>Order not found</Text>
                <TouchableOpacity style={styles.btnOutline} onPress={() => navigation.goBack()}>
                    <Text style={styles.btnOutlineText}>Go Back</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Order Details</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                
                {/* Status Card */}
                <View style={styles.statusCard}>
                    <View>
                        <Text style={styles.orderLabel}>ORDER ID</Text>
                        <Text style={styles.orderId}>#{order._id?.substring(18)?.toUpperCase() || 'N/A'}</Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: getStatusBadgeColor(order.orderStatus) }]}>
                        <Text style={styles.badgeText}>{order.orderStatus.replace(/_/g, ' ').toUpperCase()}</Text>
                    </View>
                </View>

                {/* Customer Information Card */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="person-circle-outline" size={20} color="#6B7280" />
                        <Text style={styles.cardTitle}>Customer Details</Text>
                    </View>
                    <View style={styles.divider} />
                    
                    <Text style={styles.customerName}>{order.shippingAddress?.name}</Text>
                    
                    <View style={styles.infoRow}>
                        <Ionicons name="call-outline" size={16} color="#6B7280" />
                        <Text style={styles.infoText} onPress={handleCallCustomer}>{order.shippingAddress?.phone}</Text>
                    </View>
                    
                    <View style={styles.infoRow}>
                        <Ionicons name="location-outline" size={16} color="#6B7280" />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.infoText}>
                                {order.shippingAddress?.houseNumber}, {order.shippingAddress?.street}
                            </Text>
                            {order.shippingAddress?.landmark && (
                                <Text style={styles.landmarkText}>Landmark: {order.shippingAddress?.landmark}</Text>
                            )}
                            <Text style={styles.infoText}>
                                {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pinCode}
                            </Text>
                        </View>
                    </View>

                    {order.shippingAddress && (
                        <TouchableOpacity style={styles.btnBlueOutline} onPress={() => {
                            const { houseNumber, street, city, state, pinCode, location } = order.shippingAddress;
                            const coordinates = location?.coordinates;
                            const [lng, lat] = Array.isArray(coordinates) && coordinates.length === 2 ? coordinates : [null, null];
                            const addressString = `${houseNumber || ''} ${street || ''}, ${city || ''}, ${state || ''} ${pinCode || ''}`.trim();

                            let url = '';
                            if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
                                url = Platform.select({ ios: `maps:0,0?q=${lat},${lng}`, android: `geo:0,0?q=${lat},${lng}` });
                            } else if (addressString) {
                                const encodedAddress = encodeURIComponent(addressString);
                                url = Platform.select({ ios: `maps:0,0?q=${encodedAddress}`, android: `geo:0,0?q=${encodedAddress}` });
                            }

                            if (url) {
                                Linking.openURL(url).catch(() => Alert.alert('Error', 'Could not open maps application'));
                            }
                        }}>
                            <Ionicons name="navigate" size={16} color="#4F46E5" />
                            <Text style={styles.btnBlueOutlineText}>Navigate to Customer</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Items Card */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="cube-outline" size={20} color="#6B7280" />
                        <Text style={styles.cardTitle}>Order Items</Text>
                    </View>
                    <View style={styles.divider} />
                    
                    {order.orderItems.map((item, index) => (
                        <View key={index} style={styles.itemRow}>
                            <View style={styles.itemImagePlaceholder}>
                                {item.image ? (
                                    <Image source={{ uri: item.image.startsWith('http') ? item.image : `${API_URL}${item.image}` }} style={styles.itemImage} />
                                ) : (
                                    <Ionicons name="image-outline" size={24} color="#ccc" />
                                )}
                            </View>
                            <View style={styles.itemDetails}>
                                <Text style={styles.itemName}>{item.name}</Text>
                                <Text style={styles.itemQty}>Qty: {item.qty || item.quantity}</Text>
                            </View>
                            <Text style={styles.itemPrice}>₹{(item.price * (item.qty || item.quantity)).toFixed(2)}</Text>
                        </View>
                    ))}
                </View>

                {/* Financial Summary */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="card-outline" size={20} color="#6B7280" />
                        <Text style={styles.cardTitle}>Payment Details</Text>
                    </View>
                    <View style={styles.divider} />
                    
                    <View style={styles.flexRowBetween}>
                        <Text style={styles.finLabel}>Payment Method</Text>
                        <Text style={[styles.finValue, { color: order.paymentMethod === 'cod' ? '#EA580C' : '#16A34A' }]}>
                            {order.paymentMethod === 'cod' ? 'COD' : order.paymentMethod.toUpperCase()}
                        </Text>
                    </View>
                    <View style={styles.flexRowBetween}>
                        <Text style={styles.finLabel}>Collected Amount</Text>
                        <Text style={styles.finValue}>₹{order.finalPaidAmount || order.totalAmount}</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.flexRowBetween}>
                        <Text style={styles.earningsLabel}>Your Earnings</Text>
                        <Text style={styles.earningsValue}>+ ₹{order.deliveryPartnerAmount || 60}</Text>
                    </View>
                </View>

                {/* Action Spacing */}
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Bottom Actions */}
            <View style={styles.bottomBar}>
                {['placed', 'processing', 'packed', 'shipped'].includes(order.orderStatus) && (
                    <TouchableOpacity style={styles.btnPrimary} onPress={handleStartDelivery} disabled={actionLoading}>
                        <Text style={styles.btnPrimaryText}>{actionLoading ? "Starting..." : "Start Delivery"}</Text>
                    </TouchableOpacity>
                )}

                {order.orderStatus === 'out_for_delivery' && (
                    <TouchableOpacity style={styles.btnGreen} onPress={handleCaptureAndComplete} disabled={actionLoading}>
                        <Ionicons name="camera" size={20} color="#fff" style={{ marginRight: 8 }} />
                        <Text style={styles.btnPrimaryText}>Capture Proof & Complete</Text>
                    </TouchableOpacity>
                )}

                {order.orderStatus === 'out_for_delivery' && order.replacementStatus === 'none' && (
                    <TouchableOpacity style={styles.btnOutlineAlert} onPress={() => navigation.navigate('ReplacementRequest', { orderId: order._id, orderDetails: order })}>
                        <Text style={styles.btnOutlineAlertText}>Report Issue / Replacement</Text>
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
    },
    spinnerPlaceholder: {
        width: 40, height: 40, borderRadius: 20, borderWidth: 3, borderColor: '#16A34A', borderTopColor: 'transparent',
    },
    loadingText: {
        marginTop: 16, color: '#6B7280', fontSize: 14,
    },
    errorContainer: {
        flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB',
    },
    errorText: {
        marginTop: 16, fontSize: 16, color: '#4B5563', marginBottom: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    backBtn: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
    },
    content: {
        padding: 16,
    },
    statusCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    orderLabel: {
        fontSize: 11, color: '#6B7280', fontWeight: '600', marginBottom: 4,
    },
    orderId: {
        fontSize: 16, fontWeight: '700', color: '#111827',
    },
    badge: {
        paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
    },
    badgeText: {
        color: '#fff', fontSize: 12, fontWeight: '700',
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    cardHeader: {
        flexDirection: 'row', alignItems: 'center',
    },
    cardTitle: {
        fontSize: 14, fontWeight: '700', color: '#111827', marginLeft: 8,
    },
    divider: {
        height: 1, backgroundColor: '#F3F4F6', marginVertical: 12,
    },
    customerName: {
        fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12,
    },
    infoRow: {
        flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12,
    },
    infoText: {
        fontSize: 14, color: '#4B5563', marginLeft: 12, lineHeight: 20,
    },
    landmarkText: {
        fontSize: 13, color: '#9CA3AF', marginLeft: 12, marginTop: 2,
    },
    btnBlueOutline: {
        flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
        borderWidth: 1, borderColor: '#4F46E5', borderRadius: 8, paddingVertical: 10, marginTop: 8,
    },
    btnBlueOutlineText: {
        color: '#4F46E5', fontWeight: '600', marginLeft: 6, fontSize: 14,
    },
    itemRow: {
        flexDirection: 'row', alignItems: 'center', marginBottom: 12,
    },
    itemImagePlaceholder: {
        width: 48, height: 48, borderRadius: 8, backgroundColor: '#F3F4F6',
        justifyContent: 'center', alignItems: 'center',
    },
    itemImage: {
        width: 48, height: 48, borderRadius: 8,
    },
    itemDetails: {
        flex: 1, marginLeft: 12,
    },
    itemName: {
        fontSize: 14, fontWeight: '600', color: '#111827',
    },
    itemQty: {
        fontSize: 13, color: '#6B7280', marginTop: 2,
    },
    itemPrice: {
        fontSize: 14, fontWeight: '700', color: '#111827',
    },
    flexRowBetween: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8,
    },
    finLabel: {
        fontSize: 14, color: '#6B7280',
    },
    finValue: {
        fontSize: 14, fontWeight: '600', color: '#111827',
    },
    earningsLabel: {
        fontSize: 14, fontWeight: '700', color: '#111827',
    },
    earningsValue: {
        fontSize: 16, fontWeight: '800', color: '#16A34A',
    },
    bottomBar: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: '#fff', padding: 16, paddingBottom: 24,
        borderTopWidth: 1, borderTopColor: '#F3F4F6', elevation: 10,
    },
    btnPrimary: {
        backgroundColor: '#4F46E5', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginBottom: 8,
    },
    btnGreen: {
        flexDirection: 'row', justifyContent: 'center',
        backgroundColor: '#16A34A', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginBottom: 8,
    },
    btnPrimaryText: {
        color: '#fff', fontSize: 15, fontWeight: '700',
    },
    btnOutlineAlert: {
        borderWidth: 1, borderColor: '#FCA5A5', paddingVertical: 12, borderRadius: 8, alignItems: 'center',
    },
    btnOutlineAlertText: {
        color: '#EF4444', fontSize: 14, fontWeight: '600',
    },
    btnOutline: {
        borderWidth: 1, borderColor: '#D1D5DB', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, marginTop: 16,
    },
    btnOutlineText: {
        color: '#4B5563', fontSize: 14, fontWeight: '600',
    }
});

export default OrderDetailsScreen;
