import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { apiService } from '../../services/api';
import { connectSocket, subscribeToOrderUpdates, disconnectSocket } from '../../services/socket';

export default function OrdersScreen({ navigation }) {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchOrders();
        setupRealtimeUpdates();

        return () => {
            disconnectSocket();
        };
    }, []);

    const setupRealtimeUpdates = async () => {
        await connectSocket();
        subscribeToOrderUpdates((updatedOrder) => {
            setOrders((prevOrders) =>
                prevOrders.map((order) =>
                    order._id === updatedOrder._id ? updatedOrder : order
                )
            );
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

    const onRefresh = () => {
        setRefreshing(true);
        fetchOrders();
    };

    const getStatusColor = (status) => {
        const colors = {
            pending: '#FFC107',
            processing: '#2196F3',
            shipped: '#9C27B0',
            delivered: '#4CAF50',
            cancelled: '#f44336',
        };
        return colors[status] || '#666';
    };

    const getStatusIcon = (status) => {
        const icons = {
            pending: 'schedule',
            processing: 'autorenew',
            shipped: 'local-shipping',
            delivered: 'check-circle',
            cancelled: 'cancel',
        };
        return icons[status] || 'info';
    };

    const renderOrder = ({ item }) => (
        <TouchableOpacity
            style={styles.orderCard}
            onPress={() => navigation.navigate('OrderDetail', { orderId: item._id })}
        >
            <View style={styles.orderHeader}>
                <Text style={styles.orderId}>Order #{item._id.slice(-8)}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                    <MaterialIcons name={getStatusIcon(item.status)} size={16} color="#fff" />
                    <Text style={styles.statusText}>{item.status}</Text>
                </View>
            </View>

            <View style={styles.orderDetails}>
                <View style={styles.detailRow}>
                    <MaterialIcons name="calendar-today" size={16} color="#666" />
                    <Text style={styles.detailText}>
                        {new Date(item.createdAt).toLocaleDateString()}
                    </Text>
                </View>

                <View style={styles.detailRow}>
                    <MaterialIcons name="shopping-bag" size={16} color="#666" />
                    <Text style={styles.detailText}>{item.items?.length || 0} items</Text>
                </View>

                <View style={styles.detailRow}>
                    <MaterialIcons name="attach-money" size={16} color="#666" />
                    <Text style={styles.detailText}>₹{item.totalAmount}</Text>
                </View>
            </View>

            <View style={styles.orderFooter}>
                <Text style={styles.viewDetails}>View Details</Text>
                <MaterialIcons name="arrow-forward" size={20} color="#4CAF50" />
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#4CAF50" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={orders}
                renderItem={renderOrder}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.orderList}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4CAF50']} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <MaterialIcons name="receipt-long" size={80} color="#ccc" />
                        <Text style={styles.emptyText}>No orders yet</Text>
                        <TouchableOpacity
                            style={styles.shopButton}
                            onPress={() => navigation.navigate('Home')}
                        >
                            <Text style={styles.shopButtonText}>Start Shopping</Text>
                        </TouchableOpacity>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    orderList: {
        padding: 15,
    },
    orderCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginBottom: 15,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    orderId: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
    },
    statusText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 5,
        textTransform: 'capitalize',
    },
    orderDetails: {
        marginBottom: 15,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    detailText: {
        marginLeft: 10,
        color: '#666',
        fontSize: 14,
    },
    orderFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        paddingTop: 10,
    },
    viewDetails: {
        color: '#4CAF50',
        fontSize: 14,
        fontWeight: '600',
        marginRight: 5,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 100,
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
    },
    shopButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
