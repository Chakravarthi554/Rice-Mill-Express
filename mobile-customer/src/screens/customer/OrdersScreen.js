// [Premium Figma-level Redesign — OrdersScreen]
import React, { useEffect, useState } from 'react';
import {
    View, Text, FlatList, StyleSheet, TouchableOpacity,
    ActivityIndicator, RefreshControl, Image, SafeAreaView, StatusBar,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { apiService } from '../../services/api';
import { API_URL } from '../../config/env';
import { connectSocket, subscribeToOrderUpdates, disconnectSocket } from '../../services/socket';

const STATUS_CONFIG = {
    pending: { label: 'Pending', color: '#FEF3C7', textColor: '#92400E', dotColor: '#F59E0B', icon: 'time-outline' },
    placed: { label: 'Placed', color: '#EEF2FF', textColor: '#3730A3', dotColor: '#6366F1', icon: 'checkmark-circle-outline' },
    processing: { label: 'Processing', color: '#EFF6FF', textColor: '#1D4ED8', dotColor: '#3B82F6', icon: 'sync-outline' },
    packed: { label: 'Packed', color: '#F5F3FF', textColor: '#6D28D9', dotColor: '#7C3AED', icon: 'cube-outline' },
    shipped: { label: 'Shipped', color: '#FFF7ED', textColor: '#B45309', dotColor: '#F97316', icon: 'car-outline' },
    out_for_delivery: { label: 'On The Way', color: '#FFF3E0', textColor: '#C2410C', dotColor: '#EF4444', icon: 'bicycle-outline' },
    delivered: { label: 'Delivered', color: '#F0FDF4', textColor: '#166534', dotColor: '#16A34A', icon: 'checkmark-done-circle-outline' },
    cancelled: { label: 'Cancelled', color: '#FEF2F2', textColor: '#B91C1C', dotColor: '#EF4444', icon: 'close-circle-outline' },
};

const FILTERS = [
    { key: 'all', label: 'All' },
    { key: 'processing', label: 'Processing' },
    { key: 'shipped', label: 'Shipped' },
    { key: 'delivered', label: 'Delivered' },
    { key: 'cancelled', label: 'Cancelled' },
];

export default function OrdersScreen({ navigation }) {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState('all');
    const { t } = useTranslation();

    useEffect(() => {
        fetchOrders();
        setupRealtimeUpdates();
        return () => disconnectSocket();
    }, []);

    const setupRealtimeUpdates = async () => {
        await connectSocket();
        subscribeToOrderUpdates((updatedOrder) => {
            setOrders((prev) => prev.map((o) => o._id === updatedOrder._id ? updatedOrder : o));
        });
    };

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const response = await apiService.getOrders();
            setOrders(response.data);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => { setRefreshing(true); fetchOrders(); };

    const filteredOrders = filter === 'all' ? orders : orders.filter(o => o.orderStatus === filter);

    const formatDate = (ds) => {
        try {
            if (!ds) return 'N/A';
            const d = new Date(ds);
            if (isNaN(d.getTime())) return String(ds).substring(0, 10);
            return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        } catch (e) {
            return String(ds).substring(0, 10);
        }
    };

    const renderOrder = ({ item }) => {
        const status = STATUS_CONFIG[item.orderStatus] || STATUS_CONFIG['pending'];
        const firstItem = item.orderItems?.[0];
        const imageUri = firstItem?.image?.startsWith('http') ? firstItem.image : firstItem?.image ? `${API_URL}${firstItem.image}` : null;
        const isLive = item.orderStatus === 'out_for_delivery';

        return (
            <TouchableOpacity
                style={styles.orderCard}
                onPress={() => navigation.navigate('OrderDetail', { id: item._id })}
                activeOpacity={0.92}
            >
                {/* Left status accent */}
                <View style={[styles.statusAccent, { backgroundColor: status.dotColor }]} />

                <View style={styles.cardContent}>
                    {/* Top Row */}
                    <View style={styles.orderHeader}>
                        <View>
                            <Text style={styles.orderId}>#{item._id.slice(-10).toUpperCase()}</Text>
                            <Text style={styles.orderDate}>{formatDate(item.createdAt)}</Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: status.color }]}>
                            {isLive && <View style={styles.liveDot} />}
                            <Ionicons name={status.icon} size={13} color={status.textColor} />
                            <Text style={[styles.statusText, { color: status.textColor }]}>{status.label}</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    {/* Item Preview */}
                    <View style={styles.itemPreview}>
                        <View style={styles.previewImgWrap}>
                            {imageUri
                                ? <Image source={{ uri: imageUri }} style={styles.previewImage} />
                                : <View style={[styles.previewImage, styles.imgPlaceholder]}>
                                    <Text style={{ fontSize: 22 }}>🌾</Text>
                                </View>
                            }
                        </View>
                        <View style={styles.previewInfo}>
                            <Text style={styles.previewName} numberOfLines={1}>{firstItem?.name || 'Item'}</Text>
                            {item.orderItems?.length > 1 && (
                                <Text style={styles.moreItems}>+{item.orderItems.length - 1} more item{item.orderItems.length - 1 > 1 ? 's' : ''}</Text>
                            )}
                            <Text style={styles.itemCount}>{item.orderItems?.length || 1} item{item.orderItems?.length !== 1 ? 's' : ''}</Text>
                        </View>
                        <View style={styles.totalBlock}>
                            <Text style={styles.orderTotal}>₹{item.finalPaidAmount || item.totalPrice}</Text>
                            <Text style={styles.paymentMethod}>{item.paymentMethod === 'cod' ? 'COD' : 'Paid'}</Text>
                        </View>
                    </View>

                    {/* Footer */}
                    <View style={styles.orderFooter}>
                        {isLive ? (
                            <View style={styles.liveTag}>
                                <View style={styles.livePulseDot} />
                                <Text style={styles.liveText}>Live Tracking Available</Text>
                            </View>
                        ) : (
                            <Text style={styles.deliveryExpect}>
                                {item.orderStatus === 'delivered' ? '✓ Delivered successfully' : `📦 ${item.orderStatus === 'processing' ? 'Being prepared' : 'On its way'}`}
                            </Text>
                        )}
                        <View style={styles.viewBtn}>
                            <Text style={styles.viewBtnText}>Details</Text>
                            <Feather name="chevron-right" size={14} color="#16A34A" />
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>My Orders</Text>
                    <Text style={styles.headerSub}>{orders.length} total order{orders.length !== 1 ? 's' : ''}</Text>
                </View>
                <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
                    <Feather name="refresh-cw" size={16} color="#16A34A" />
                </TouchableOpacity>
            </View>

            {/* Filter Pills */}
            <View style={styles.filtersContainer}>
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={FILTERS}
                    keyExtractor={i => i.key}
                    contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
                    renderItem={({ item: f }) => (
                        <TouchableOpacity
                            style={[styles.filterPill, filter === f.key && styles.filterPillActive]}
                            onPress={() => setFilter(f.key)}
                        >
                            {filter === f.key && <View style={styles.filterDot} />}
                            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
                                {f.label}
                            </Text>
                        </TouchableOpacity>
                    )}
                />
            </View>

            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#16A34A" />
                    <Text style={styles.loadingText}>Loading your orders...</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredOrders}
                    renderItem={renderOrder}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.orderList}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#16A34A']} />}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <View style={styles.emptyIcon}>
                                <Text style={{ fontSize: 52 }}>📦</Text>
                            </View>
                            <Text style={styles.emptyTitle}>No orders yet</Text>
                            <Text style={styles.emptySubtitle}>Your order history will appear here</Text>
                            <TouchableOpacity style={styles.shopButton} onPress={() => navigation.navigate('Home')}>
                                <Text style={styles.shopButtonText}>Start Shopping</Text>
                            </TouchableOpacity>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },

    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
        paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#fff',
        borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
    },
    headerTitle: { fontSize: 24, fontWeight: '800', color: '#111827', letterSpacing: -0.5 },
    headerSub: { fontSize: 13, color: '#9CA3AF', marginTop: 2 },
    refreshBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center' },

    filtersContainer: { backgroundColor: '#fff', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    filterPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 50, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB', gap: 6 },
    filterPillActive: { backgroundColor: '#F0FDF4', borderColor: '#16A34A' },
    filterDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#16A34A' },
    filterText: { fontSize: 13, fontWeight: '600', color: '#4B5563' },
    filterTextActive: { color: '#16A34A', fontWeight: '700' },

    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
    loadingText: { marginTop: 8, color: '#6B7280', fontSize: 14 },

    orderList: { padding: 16, paddingBottom: 40 },
    orderCard: {
        backgroundColor: '#fff', borderRadius: 18, marginBottom: 14,
        flexDirection: 'row', overflow: 'hidden',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    },
    statusAccent: { width: 4 },
    cardContent: { flex: 1, padding: 16 },

    orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
    orderId: { fontSize: 14, fontWeight: '800', color: '#111827' },
    orderDate: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
    statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 50, gap: 5 },
    statusText: { fontSize: 12, fontWeight: '700' },
    liveDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#EF4444' },

    divider: { height: 1, backgroundColor: '#F9FAFB', marginBottom: 12 },

    itemPreview: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    previewImgWrap: { width: 56, height: 56, borderRadius: 12, overflow: 'hidden', marginRight: 12 },
    previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    imgPlaceholder: { backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center' },
    previewInfo: { flex: 1 },
    previewName: { fontSize: 14, fontWeight: '700', color: '#111827' },
    moreItems: { fontSize: 12, color: '#16A34A', fontWeight: '600', marginTop: 2 },
    itemCount: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
    totalBlock: { alignItems: 'flex-end' },
    orderTotal: { fontSize: 17, fontWeight: '800', color: '#111827' },
    paymentMethod: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },

    orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    liveTag: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    livePulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444' },
    liveText: { fontSize: 12, fontWeight: '700', color: '#EF4444' },
    deliveryExpect: { fontSize: 12, color: '#6B7280' },
    viewBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    viewBtnText: { fontSize: 13, fontWeight: '700', color: '#16A34A' },

    emptyContainer: { alignItems: 'center', marginTop: 60, padding: 40, gap: 12 },
    emptyIcon: { width: 110, height: 110, borderRadius: 55, backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    emptyTitle: { fontSize: 22, fontWeight: '800', color: '#111827' },
    emptySubtitle: { fontSize: 14, color: '#9CA3AF', textAlign: 'center' },
    shopButton: { backgroundColor: '#16A34A', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 50, marginTop: 8, shadowColor: '#16A34A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 4 },
    shopButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
