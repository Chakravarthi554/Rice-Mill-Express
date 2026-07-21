// [Premium Figma-level Redesign — OrderDetailScreen]
// Replaces react-native-paper Cards with native premium design
import React, { useEffect, useState } from 'react';
import {
    View, Text, ScrollView, StyleSheet, ActivityIndicator,
    Alert, TouchableOpacity, Linking, Image, SafeAreaView, StatusBar, Share,
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { apiService } from '../../services/api';
import { API_URL } from '../../config/env';

const STATUS_CONFIG = {
    pending: { label: 'Pending', color: '#FEF3C7', textColor: '#92400E', icon: 'time-outline' },
    placed: { label: 'Placed', color: '#EEF2FF', textColor: '#3730A3', icon: 'checkmark-circle-outline' },
    processing: { label: 'Processing', color: '#EFF6FF', textColor: '#1D4ED8', icon: 'sync-outline' },
    packed: { label: 'Packed', color: '#F5F3FF', textColor: '#6D28D9', icon: 'cube-outline' },
    shipped: { label: 'Shipped', color: '#FFF7ED', textColor: '#B45309', icon: 'car-outline' },
    out_for_delivery: { label: 'On The Way', color: '#FFF3E0', textColor: '#C2410C', icon: 'bicycle-outline' },
    delivered: { label: 'Delivered', color: '#F0FDF4', textColor: '#166534', icon: 'checkmark-done-circle-outline' },
    cancelled: { label: 'Cancelled', color: '#FEF2F2', textColor: '#B91C1C', icon: 'close-circle-outline' },
};

const TIMELINE_STEPS = [
    { key: 'placed', label: 'Order Placed', icon: 'clipboard-check', sub: 'Your order was confirmed' },
    { key: 'processing', label: 'Processing', icon: 'cog', sub: 'Being prepared at the mill' },
    { key: 'shipped', label: 'Shipped', icon: 'truck', sub: 'On its way to you' },
    { key: 'out_for_delivery', label: 'Out for Delivery', icon: 'bike', sub: 'Arriving soon' },
    { key: 'delivered', label: 'Delivered', icon: 'home', sub: 'Package delivered' },
];

function SectionCard({ children, style }) {
    return <View style={[styles.sectionCard, style]}>{children}</View>;
}

function SectionHeader({ icon, title, color = '#16A34A' }) {
    return (
        <View style={styles.sectionHeaderRow}>
            <View style={[styles.sectionIconBox, { backgroundColor: color + '15' }]}>
                <Feather name={icon} size={18} color={color} />
            </View>
            <Text style={styles.sectionHeaderTitle}>{title}</Text>
        </View>
    );
}

const OrderDetailScreen = ({ route, navigation }) => {
    const { id } = route.params;
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);

    // Share handler — share a clean link to the order
    const handleShare = async () => {
        try {
            if (!order) return;
            const orderNum = order._id.slice(-10).toUpperCase();
            // Deep link for app users; web fallback for others
            const link = `ricemillapp://orders/${order._id}`;
            await Share.share({
                message: `Check my order #${orderNum} on Rice Mill App:\n${link}`,
                title: `Order #${orderNum}`,
            });
        } catch (e) {
            Alert.alert('Error', 'Unable to share order details.');
        }
    };

    useEffect(() => { fetchOrderDetails(); }, []);

    const fetchOrderDetails = async () => {
        try {
            setLoading(true);
            const response = await apiService.getOrderById(id);
            setOrder(response.data);
        } catch (error) {
            console.error('Error fetching order details:', error);
            Alert.alert('Error', 'Failed to load order details');
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadInvoice = async () => {
        try {
            setDownloading(true);

            // 1. Request invoice generation (uses correct /api/v1 base URL with auth)
            const enqueueRes = await apiService.generateInvoice(id);
            const initialStatus = enqueueRes?.data?.status;

            // 2. If not already completed, poll until PDF is ready (max 60s)
            if (initialStatus !== 'completed') {
                let isReady = false;
                let attempts = 0;
                const maxAttempts = 30;
                while (!isReady && attempts < maxAttempts) {
                    const statusRes = await apiService.checkInvoiceStatus(id);
                    if (statusRes?.data?.status === 'completed') {
                        isReady = true;
                    } else {
                        attempts++;
                        await new Promise(resolve => setTimeout(resolve, 2000));
                    }
                }
                if (!isReady) {
                    throw new Error('Invoice generation timed out. Please try again.');
                }
            }

            // 3. Download the PDF using FileSystem with auth header
            const token = await apiService.getAuthToken();
            const fileUri = FileSystem.documentDirectory + `invoice_${id.slice(-8).toUpperCase()}.pdf`;
            const downloadRes = await FileSystem.downloadAsync(
                `${API_URL}/api/v1/orders/${id}/invoice/download`,
                fileUri,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (downloadRes.status !== 200) {
                throw new Error('Failed to download the invoice PDF.');
            }

            // 4. Open the native share / open-with sheet
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(downloadRes.uri, {
                    mimeType: 'application/pdf',
                    dialogTitle: `Invoice for Order #${id.slice(-10).toUpperCase()}`,
                    UTI: 'com.adobe.pdf',
                });
            } else {
                Alert.alert('Downloaded', 'Invoice saved to your device.');
            }
        } catch (error) {
            console.error('Invoice download error:', error);
            Alert.alert('Error', error.message || 'Could not download invoice. Please try again.');
        } finally {
            setDownloading(false);
        }
    };

    const handleRefundRequest = () => navigation.navigate('Refunds', { orderId: id });

    const handleCancelOrder = () => {
        Alert.alert(
            'Cancel Order',
            'Are you sure you want to cancel this order? This action cannot be undone.',
            [
                { text: 'No, Keep Order', style: 'cancel' },
                {
                    text: 'Yes, Cancel',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await apiService.updateOrderStatus(id, 'cancelled', 'Cancelled by customer');
                            Alert.alert('Order Cancelled', 'Your order has been cancelled successfully.');
                            fetchOrderDetails();
                        } catch (error) {
                            Alert.alert('Error', error?.response?.data?.message || 'Failed to cancel order. Please try again.');
                        }
                    }
                }
            ]
        );
    };

    const handleTrackOrder = () => Alert.alert('Live Tracking', 'Live map tracking is coming soon!');

    const formatDate = (ds) => {
        try {
            const d = new Date(ds);
            return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        } catch { return String(ds).substring(0, 10); }
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#16A34A" />
                <Text style={styles.loadingText}>Loading order details...</Text>
            </View>
        );
    }

    if (!order) return null;

    const status = STATUS_CONFIG[order.orderStatus] || STATUS_CONFIG['pending'];
    const currentStepIndex = TIMELINE_STEPS.findIndex(s => s.key === order.orderStatus);

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Feather name="arrow-left" size={20} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Order Details</Text>
                <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
                    <Feather name="share-2" size={18} color="#6B7280" />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

                {/* ── ORDER SUMMARY CARD ── */}
                <SectionCard>
                    <View style={styles.orderTopRow}>
                        <View>
                            <Text style={styles.orderIdLabel}>Order ID</Text>
                            <Text style={styles.orderId}>#{order._id.slice(-10).toUpperCase()}</Text>
                            <Text style={styles.orderDate}>Placed on {formatDate(order.createdAt)}</Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: status.color }]}>
                            <Ionicons name={status.icon} size={14} color={status.textColor} />
                            <Text style={[styles.statusText, { color: status.textColor }]}>{status.label}</Text>
                        </View>
                    </View>

                    {order.orderStatus === 'delivered' && (
                        <TouchableOpacity style={styles.refundBtn} onPress={handleRefundRequest}>
                            <Feather name="rotate-ccw" size={16} color="#EF4444" />
                            <Text style={styles.refundBtnText}>Request Refund / Return</Text>
                        </TouchableOpacity>
                    )}
                </SectionCard>

                {/* ── ORDER TIMELINE ── */}
                <SectionCard>
                    <SectionHeader icon="activity" title="Order Timeline" color="#16A34A" />
                    <View style={styles.timeline}>
                        {TIMELINE_STEPS.map((step, index) => {
                            const isDone = index <= currentStepIndex;
                            const isCurrent = index === currentStepIndex;
                            return (
                                <View key={step.key} style={styles.timelineItem}>
                                    <View style={styles.timelineLeft}>
                                        <View style={[
                                            styles.timelineDot,
                                            isDone && styles.timelineDotActive,
                                            isCurrent && styles.timelineDotCurrent,
                                        ]}>
                                            {isDone
                                                ? <Ionicons name="checkmark" size={12} color="#fff" />
                                                : <View style={styles.timelineDotInner} />
                                            }
                                        </View>
                                        {index < TIMELINE_STEPS.length - 1 && (
                                            <View style={[styles.timelineLine, isDone && index < currentStepIndex && styles.timelineLineActive]} />
                                        )}
                                    </View>
                                    <View style={styles.timelineContent}>
                                        <Text style={[styles.timelineLabel, isDone && styles.timelineLabelActive]}>{step.label}</Text>
                                        <Text style={styles.timelineSub}>{step.sub}</Text>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                </SectionCard>

                {/* ── DELIVERY PARTNER ── */}
                {order.deliveryPartner && (
                    <SectionCard>
                        <SectionHeader icon="user" title="Delivery Partner" color="#4F46E5" />
                        <View style={styles.partnerRow}>
                            <View style={styles.partnerAvatar}>
                                <Text style={styles.partnerAvatarText}>{order.deliveryPartner.name?.charAt(0) || 'D'}</Text>
                            </View>
                            <View style={styles.partnerInfo}>
                                <Text style={styles.partnerName}>{order.deliveryPartner.name}</Text>
                                <Text style={styles.partnerPhone}>{order.deliveryPartner.phone}</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.callBtn}
                                onPress={() => Linking.openURL(`tel:${order.deliveryPartner.phone}`)}
                            >
                                <Feather name="phone" size={18} color="#fff" />
                            </TouchableOpacity>
                        </View>
                        {order.orderStatus === 'out_for_delivery' && (
                            <TouchableOpacity style={styles.trackBtn} onPress={handleTrackOrder}>
                                <Feather name="map-pin" size={16} color="#fff" />
                                <Text style={styles.trackBtnText}>Track Live Location</Text>
                            </TouchableOpacity>
                        )}
                    </SectionCard>
                )}

                {/* ── ORDER ITEMS ── */}
                <SectionCard>
                    <SectionHeader icon="shopping-bag" title="Order Items" color="#F97316" />
                    {order.orderItems.map((item, index) => {
                        const imageUri = item.image?.startsWith('http') ? item.image : `${API_URL}${item.image}`;
                        return (
                            <View key={index} style={[styles.itemRow, index < order.orderItems.length - 1 && styles.itemRowBorder]}>
                                <Image source={{ uri: imageUri }} style={styles.itemImage} />
                                <View style={styles.itemInfo}>
                                    <Text style={styles.itemName}>{item.name}</Text>
                                    <Text style={styles.itemQty}>{item.qty} × ₹{item.price}</Text>
                                </View>
                                <Text style={styles.itemTotal}>₹{item.subtotal || (item.qty * item.price)}</Text>
                            </View>
                        );
                    })}

                    <View style={styles.priceDivider} />

                    <View style={styles.priceRow}><Text style={styles.priceLabel}>Subtotal</Text><Text style={styles.priceValue}>₹{order.productAmount || (order.totalPrice - (order.deliveryFee || 0) + (order.discountAmount || 0))}</Text></View>
                    <View style={styles.priceRow}><Text style={styles.priceLabel}>Delivery Fee</Text><Text style={styles.priceValue}>{order.deliveryFee === 0 ? 'FREE' : `₹${order.deliveryFee || 0}`}</Text></View>
                    {order.discountAmount > 0 && (
                        <View style={styles.priceRow}><Text style={styles.priceLabel}>Discount</Text><Text style={[styles.priceValue, { color: '#EF4444' }]}>- ₹{order.discountAmount}</Text></View>
                    )}
                    {order.walletUsedAmount > 0 && (
                        <View style={styles.priceRow}><Text style={styles.priceLabel}>Wallet Used</Text><Text style={[styles.priceValue, { color: '#3B82F6' }]}>- ₹{order.walletUsedAmount}</Text></View>
                    )}
                    <View style={styles.priceDivider} />
                    <View style={styles.priceRow}>
                        <Text style={styles.grandTotalLabel}>Total Paid</Text>
                        <Text style={styles.grandTotalValue}>₹{order.finalPaidAmount || order.totalPrice}</Text>
                    </View>
                    {order.paymentMethod === 'cod' && order.isAdvancePaid && (
                        <>
                            <View style={styles.priceRow}><Text style={styles.priceLabel}>Advance Paid</Text><Text style={styles.priceValue}>₹{order.advanceAmountPaid}</Text></View>
                            <View style={[styles.priceRow, styles.remainingRow]}>
                                <Text style={styles.priceLabel}>To Pay at Delivery</Text>
                                <Text style={[styles.priceValue, { color: '#EF4444', fontWeight: '800' }]}>₹{order.remainingCodAmount}</Text>
                            </View>
                        </>
                    )}
                </SectionCard>

                {/* ── SHIPPING ADDRESS ── */}
                <SectionCard>
                    <SectionHeader icon="map-pin" title="Shipping Address" color="#7C3AED" />
                    <View style={styles.addressCard}>
                        <View style={styles.addressIconRow}>
                            <View style={styles.addressHomeIcon}>
                                <Feather name="home" size={16} color="#7C3AED" />
                            </View>
                            <View>
                                <Text style={styles.addressStreet}>{order.shippingAddress.street}</Text>
                                <Text style={styles.addressCity}>{order.shippingAddress.city}, {order.shippingAddress.state} — {order.shippingAddress.pinCode}</Text>
                                <Text style={styles.addressPhone}>📱 {order.shippingAddress.phone}</Text>
                            </View>
                        </View>
                    </View>
                </SectionCard>

                {/* Bottom padding */}
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* ── STICKY FOOTER ── */}
            <View style={styles.stickyFooter}>
                {!['delivered', 'cancelled'].includes(order.orderStatus) && (
                    <TouchableOpacity
                        style={styles.cancelBtn}
                        onPress={handleCancelOrder}
                    >
                        <Feather name="x-circle" size={18} color="#EF4444" />
                        <Text style={styles.cancelBtnText}>Cancel Order</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity
                    style={[styles.invoiceBtn, downloading && { opacity: 0.7 }, !['delivered', 'cancelled'].includes(order.orderStatus) && { flex: 1 }]}
                    onPress={handleDownloadInvoice}
                    disabled={downloading}
                >
                    {downloading
                        ? <ActivityIndicator size="small" color="#fff" />
                        : <Feather name="download" size={18} color="#fff" />
                    }
                    <Text style={styles.invoiceBtnText}>{downloading ? 'Preparing...' : 'Invoice'}</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
    loadingText: { color: '#6B7280', fontSize: 14 },

    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff',
        borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
    },
    backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F9FAFB', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
    shareBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F9FAFB', alignItems: 'center', justifyContent: 'center' },

    scroll: { flex: 1 },

    sectionCard: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 16, borderRadius: 20, padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: '#F3F4F6' },
    sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 10 },
    sectionIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    sectionHeaderTitle: { fontSize: 16, fontWeight: '800', color: '#111827' },

    // Order top
    orderTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
    orderIdLabel: { fontSize: 11, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
    orderId: { fontSize: 20, fontWeight: '800', color: '#111827' },
    orderDate: { fontSize: 13, color: '#6B7280', marginTop: 2 },
    statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 50, gap: 6 },
    statusText: { fontSize: 12, fontWeight: '700' },
    refundBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', padding: 12, borderRadius: 12, gap: 8 },
    refundBtnText: { color: '#EF4444', fontWeight: '700', fontSize: 14 },

    // Timeline
    timeline: { paddingLeft: 4 },
    timelineItem: { flexDirection: 'row', marginBottom: 4 },
    timelineLeft: { alignItems: 'center', width: 30, marginRight: 14 },
    timelineDot: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#F3F4F6', borderWidth: 2, borderColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' },
    timelineDotActive: { backgroundColor: '#16A34A', borderColor: '#16A34A' },
    timelineDotCurrent: { backgroundColor: '#16A34A', borderColor: '#16A34A', shadowColor: '#16A34A', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 4 },
    timelineDotInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#D1D5DB' },
    timelineLine: { width: 2, flex: 1, backgroundColor: '#E5E7EB', marginVertical: 3, minHeight: 28 },
    timelineLineActive: { backgroundColor: '#16A34A' },
    timelineContent: { flex: 1, paddingBottom: 20 },
    timelineLabel: { fontSize: 14, fontWeight: '600', color: '#9CA3AF' },
    timelineLabelActive: { color: '#111827', fontWeight: '800' },
    timelineSub: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },

    // Partner
    partnerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
    partnerAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#4F46E5', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
    partnerAvatarText: { fontSize: 22, fontWeight: '800', color: '#fff' },
    partnerInfo: { flex: 1 },
    partnerName: { fontSize: 16, fontWeight: '700', color: '#111827' },
    partnerPhone: { fontSize: 13, color: '#6B7280', marginTop: 2 },
    callBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#16A34A', alignItems: 'center', justifyContent: 'center', shadowColor: '#16A34A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
    trackBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3B82F6', borderRadius: 12, padding: 12, gap: 8, justifyContent: 'center' },
    trackBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

    // Items
    itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
    itemRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
    itemImage: { width: 60, height: 60, borderRadius: 12, backgroundColor: '#F0FDF4', marginRight: 14 },
    itemInfo: { flex: 1 },
    itemName: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 3 },
    itemQty: { fontSize: 13, color: '#6B7280' },
    itemTotal: { fontSize: 15, fontWeight: '800', color: '#111827' },

    // Pricing
    priceDivider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 10 },
    priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    priceLabel: { fontSize: 14, color: '#6B7280' },
    priceValue: { fontSize: 14, fontWeight: '600', color: '#111827' },
    remainingRow: { backgroundColor: '#FEF2F2', padding: 8, borderRadius: 8, marginTop: 4 },
    grandTotalLabel: { fontSize: 17, fontWeight: '800', color: '#111827' },
    grandTotalValue: { fontSize: 20, fontWeight: '800', color: '#16A34A' },

    // Address
    addressCard: { backgroundColor: '#F9FAFB', borderRadius: 12, padding: 14 },
    addressIconRow: { flexDirection: 'row', gap: 12 },
    addressHomeIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F5F3FF', alignItems: 'center', justifyContent: 'center' },
    addressStreet: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 3 },
    addressCity: { fontSize: 13, color: '#6B7280', marginBottom: 3 },
    addressPhone: { fontSize: 13, color: '#6B7280' },

    // Sticky footer
    stickyFooter: { backgroundColor: '#fff', padding: 16, borderTopWidth: 1, borderTopColor: '#F3F4F6', elevation: 10, flexDirection: 'row', gap: 10 },
    cancelBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#FEF2F2', borderRadius: 16, paddingVertical: 16, paddingHorizontal: 18, gap: 8,
        borderWidth: 1, borderColor: '#FECACA',
    },
    cancelBtnText: { color: '#EF4444', fontSize: 14, fontWeight: '700' },
    invoiceBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#111827', borderRadius: 16, paddingVertical: 16, gap: 10, flex: 1,
    },
    invoiceBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});

export default OrderDetailScreen;
