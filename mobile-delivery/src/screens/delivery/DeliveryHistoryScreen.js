import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../../services/api';

const DeliveryHistoryScreen = ({ navigation }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    const PRIMARY_ACCENT = '#FC8019'; // Swiggy Orange

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const response = await apiService.getDeliveryHistory();
            setHistory(response.data?.history || []);
        } catch (error) {
            console.error('Error fetching history:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderHistoryItem = ({ item }) => (
        <TouchableOpacity 
            style={styles.historyCard}
            onPress={() => navigation.navigate('OrderDetails', { orderId: item._id })}
        >
            <View style={styles.cardHeader}>
                <Text style={styles.orderId}>#{item._id?.substring(18).toUpperCase()}</Text>
                <View style={[styles.statusBadge, { backgroundColor: item.orderStatus === 'delivered' ? '#16A34A' : '#EF4444' }]}>
                    <Text style={styles.statusText}>{item.orderStatus.toUpperCase()}</Text>
                </View>
            </View>
            <View style={styles.cardBody}>
                <View style={styles.locationRow}>
                    <Ionicons name="home" size={20} color="#9CA3AF" />
                    <Text style={styles.addressText} numberOfLines={1}>{item.shippingAddress?.houseNumber}, {item.shippingAddress?.street}</Text>
                </View>
                <View style={styles.earningsRow}>
                    <Text style={styles.dateText}>{new Date(item.createdAt).toDateString()}</Text>
                    <Text style={styles.earningsText}>Earned: ₹{item.deliveryPartnerAmount || 0}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={PRIMARY_ACCENT} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Delivery History</Text>
            </View>

            <FlatList
                data={history}
                keyExtractor={(item) => item._id}
                renderItem={renderHistoryItem}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="time" size={64} color="#4B5563" />
                        <Text style={styles.emptyStateText}>No past deliveries found.</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#111827' },
    loadingContainer: { flex: 1, backgroundColor: '#111827', justifyContent: 'center', alignItems: 'center' },
    header: { padding: 20, backgroundColor: '#1F2937', borderBottomWidth: 1, borderBottomColor: '#374151' },
    headerTitle: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
    listContent: { padding: 20 },
    historyCard: { backgroundColor: '#1F2937', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#374151' },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    orderId: { color: '#F3F4F6', fontSize: 18, fontWeight: 'bold' },
    statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
    statusText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
    cardBody: {},
    locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    addressText: { color: '#9CA3AF', fontSize: 14, marginLeft: 8 },
    earningsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#374151' },
    dateText: { color: '#6B7280', fontSize: 14 },
    earningsText: { color: '#34D399', fontSize: 16, fontWeight: 'bold' },
    emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
    emptyStateText: { color: '#9CA3AF', fontSize: 18, marginTop: 16 }
});

export default DeliveryHistoryScreen;
