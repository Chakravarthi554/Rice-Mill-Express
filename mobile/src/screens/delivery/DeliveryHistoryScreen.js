import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { apiService } from '../../services/api';
import { auth } from '../../config/firebase';

const DeliveryHistoryScreen = ({ navigation }) => {
    const [deliveries, setDeliveries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const { user, token } = useSelector(state => state.auth);

    useEffect(() => {
        if (user && auth.currentUser) {
            fetchDeliveryHistory();
        }
    }, [user, token]);

    const fetchDeliveryHistory = async () => {
        try {
            setLoading(true);
            const response = await apiService.getAssignedOrders();

            let ordersData = [];
            if (response.data && Array.isArray(response.data.orders)) ordersData = response.data.orders;
            else if (Array.isArray(response.data)) ordersData = response.data;

            setDeliveries(ordersData.filter(o => o.orderStatus === 'delivered'));
        } catch (error) {
            if (error.response?.status !== 401) console.error('Failed to fetch delivery history');
            setDeliveries([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchDeliveryHistory();
    };

    const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const formatTime = (dateString) => new Date(dateString).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    const renderDeliveryCard = (delivery) => (
        <TouchableOpacity key={delivery._id} style={styles.card} onPress={() => navigation.navigate('OrderDetails', { orderId: delivery._id })}>
            <View style={styles.cardHeader}>
                <View>
                    <Text style={styles.orderNumber}>#{delivery._id.substring(18).toUpperCase()}</Text>
                    <Text style={styles.dateText}>{formatDate(delivery.deliveredAt || delivery.updatedAt)}</Text>
                </View>
                <View style={styles.deliveredChip}>
                    <Ionicons name="checkmark-circle" size={14} color="#16A34A" />
                    <Text style={styles.chipText}>Delivered</Text>
                </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
                <Ionicons name="person-outline" size={16} color="#6B7280" />
                <Text style={styles.infoText}>{delivery.shippingAddress.name}</Text>
            </View>
            <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={16} color="#6B7280" />
                <Text style={styles.infoText} numberOfLines={1}>{delivery.shippingAddress.city}</Text>
            </View>
            <View style={styles.infoRow}>
                <Ionicons name="time-outline" size={16} color="#6B7280" />
                <Text style={styles.infoText}>{formatTime(delivery.deliveredAt || delivery.updatedAt)}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.footer}>
                <Text style={styles.amountLabel}>Earned</Text>
                <Text style={styles.amountText}>+ ₹{delivery.deliveryPartnerAmount || 60}</Text>
            </View>
        </TouchableOpacity>
    );

    if (loading && !refreshing) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <View style={styles.spinnerPlaceholder} />
                <Text style={styles.loadingText}>Loading history...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Delivery History</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.statsHeader}>
                <View style={styles.statCard}>
                    <Text style={styles.statLabel}>Total</Text>
                    <Text style={styles.statValue}>{deliveries.length}</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statLabel}>Today</Text>
                    <Text style={styles.statValue}>
                        {deliveries.filter(d => new Date(d.deliveredAt || d.updatedAt).toDateString() === new Date().toDateString()).length}
                    </Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statLabel}>Earned</Text>
                    <Text style={styles.statValueGreen}>₹{deliveries.reduce((sum, d) => sum + (d.deliveryPartnerAmount || 60), 0).toFixed(0)}</Text>
                </View>
            </View>

            <ScrollView style={styles.scrollContainer} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
                {deliveries.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="receipt-outline" size={64} color="#D1D5DB" />
                        <Text style={styles.emptyText}>No delivery history yet</Text>
                        <Text style={styles.emptySubtext}>Completed deliveries will appear here</Text>
                    </View>
                ) : (
                    deliveries.map(renderDeliveryCard)
                )}
                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
    spinnerPlaceholder: { width: 40, height: 40, borderRadius: 20, borderWidth: 3, borderColor: '#16A34A', borderTopColor: 'transparent' },
    loadingText: { marginTop: 16, color: '#6B7280', fontSize: 14 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
    statsHeader: { flexDirection: 'row', padding: 16, backgroundColor: '#111827', marginHorizontal: 16, marginTop: 16, borderRadius: 12 },
    statCard: { flex: 1, alignItems: 'center' },
    statLabel: { fontSize: 12, color: '#9CA3AF', marginBottom: 4, fontWeight: '600' },
    statValue: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
    statValueGreen: { fontSize: 20, fontWeight: 'bold', color: '#10B981' },
    scrollContainer: { flex: 1, padding: 16 },
    card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#F3F4F6', elevation: 2 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    orderNumber: { fontSize: 16, fontWeight: '700', color: '#111827' },
    dateText: { fontSize: 13, color: '#6B7280', marginTop: 4 },
    deliveredChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FDF4', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: '#DCFCE7' },
    chipText: { color: '#166534', fontSize: 12, fontWeight: '600', marginLeft: 4 },
    divider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 12 },
    infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    infoText: { marginLeft: 8, fontSize: 14, color: '#4B5563', flex: 1 },
    footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    amountLabel: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
    amountText: { fontSize: 16, fontWeight: '700', color: '#16A34A' },
    emptyContainer: { alignItems: 'center', marginTop: 80 },
    emptyText: { marginTop: 16, fontSize: 18, fontWeight: '700', color: '#4B5563' },
    emptySubtext: { marginTop: 8, fontSize: 14, color: '#9CA3AF' },
});

export default DeliveryHistoryScreen;
