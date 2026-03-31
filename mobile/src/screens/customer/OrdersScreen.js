import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Image,
    SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { apiService } from '../../services/api';
import { API_URL } from '../../config/env';
import { connectSocket, subscribeToOrderUpdates, disconnectSocket } from '../../services/socket';

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

export default function OrdersScreen({ navigation }) {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState('all');
    const { t } = useTranslation();

    const FILTERS = ['all', 'processing', 'shipped', 'delivered', 'cancelled'];

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

        return (
            <TouchableOpacity
                style={styles.orderCard}
                onPress={() => navigation.navigate('OrderDetail', { id: item._id })}
                activeOpacity={0.9}>
                {/* Header */}
                <View style={styles.orderHeader}>
                    <View>
                        <Text style={styles.orderId}>#{item._id.slice(-10).toUpperCase()}</Text>
                        <Text style={styles.orderDate}>{formatDate(item.createdAt)}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: status.color }]}>
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
                            : <View style={[styles.previewImage, styles.imgPlaceholder]}><Ionicons name="image-outline" size={20} color="#D1D5DB" /></View>}
                    </View>
                    <View style={styles.previewInfo}>
                        <Text style={styles.previewName} numberOfLines={1}>{firstItem?.name || 'Item'}</Text>
                        {item.orderItems?.length > 1 && (
                            <Text style={styles.moreItems}>+{item.orderItems.length - 1} more items</Text>
                        )}
                        <Text style={styles.itemCount}>{item.orderItems?.length || 1} item{item.orderItems?.length !== 1 ? 's' : ''}</Text>
                    </View>
                    <Text style={styles.orderTotal}>₹{item.finalPaidAmount || item.totalPrice}</Text>
                </View>

                {/* Footer Action */}
                <View style={styles.orderFooter}>
                    {item.orderStatus === 'out_for_delivery' ? (
                        <View style={styles.liveTag}>
                            <View style={styles.liveDot} />
                            <Text style={styles.liveText}>Live Tracking</Text>
                        </View>
                    ) : (
                        <Text style={styles.paymentMethod}>{item.paymentMethod === 'cod' ? '💵 COD' : '💳 Paid Online'}</Text>
                    )}
                    <View style={styles.viewBtn}>
                        <Text style={styles.viewBtnText}>View Details</Text>
                        <Ionicons name="arrow-forward" size={14} color="#16A34A" />
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Orders</Text>
                <Text style={styles.headerCount}>{orders.length} orders</Text>
            </View>

            {/* Filters */}
            <View style={styles.filtersRow}>
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={FILTERS}
                    keyExtractor={i => i}
                    contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
                    renderItem={({ item: f }) => (
                        <TouchableOpacity
                            style={[styles.filterPill, filter === f && styles.filterPillActive]}
                            onPress={() => setFilter(f)}>
                            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                                {f === 'all' ? 'All' : STATUS_CONFIG[f]?.label || f}
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
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <View style={styles.emptyIcon}>
                                <Ionicons name="receipt-outline" size={56} color="#16A34A" />
                            </View>
                            <Text style={styles.emptyText}>No orders yet</Text>
                            <Text style={styles.emptySubText}>Order your favorite rice today!</Text>
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
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
    headerCount: { fontSize: 14, color: '#6B7280' },
    filtersRow: { backgroundColor: '#fff', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    filterPill: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
    filterPillActive: { backgroundColor: '#F0FDF4', borderColor: '#16A34A' },
    filterText: { fontSize: 13, fontWeight: '600', color: '#4B5563' },
    filterTextActive: { color: '#16A34A' },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 12, color: '#6B7280', fontSize: 14 },
    orderList: { padding: 16 },
    orderCard: {
        backgroundColor: '#fff', borderRadius: 16, marginBottom: 16,
        borderWidth: 1, borderColor: '#F3F4F6', overflow: 'hidden', elevation: 2,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6,
    },
    orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 16, paddingBottom: 12 },
    orderId: { fontSize: 14, fontWeight: '800', color: '#111827' },
    orderDate: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
    statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, gap: 5 },
    statusText: { fontSize: 12, fontWeight: '700' },
    divider: { height: 1, backgroundColor: '#F9FAFB' },
    itemPreview: { flexDirection: 'row', alignItems: 'center', padding: 14, paddingTop: 12 },
    previewImgWrap: { width: 52, height: 52, borderRadius: 10, overflow: 'hidden', marginRight: 12 },
    previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    imgPlaceholder: { backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
    previewInfo: { flex: 1 },
    previewName: { fontSize: 14, fontWeight: '700', color: '#111827' },
    moreItems: { fontSize: 12, color: '#16A34A', fontWeight: '600', marginTop: 2 },
    itemCount: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
    orderTotal: { fontSize: 16, fontWeight: '800', color: '#111827' },
    orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingBottom: 14 },
    liveTag: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444' },
    liveText: { fontSize: 12, fontWeight: '700', color: '#EF4444' },
    paymentMethod: { fontSize: 12, color: '#6B7280' },
    viewBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    viewBtnText: { fontSize: 13, fontWeight: '700', color: '#16A34A' },
    emptyContainer: { alignItems: 'center', marginTop: 60, padding: 40 },
    emptyIcon: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    emptyText: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 8 },
    emptySubText: { fontSize: 14, color: '#6B7280', marginBottom: 28 },
    shopButton: { backgroundColor: '#16A34A', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14 },
    shopButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
