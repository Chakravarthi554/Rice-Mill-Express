import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    Image,
    TouchableOpacity,
} from 'react-native';
import { Card, ActivityIndicator, Chip } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useSelector } from 'react-redux'; // Added useSelector
import { apiService } from '../../services/api';
import { auth } from '../../config/firebase'; // Added auth import

const DeliveryHistoryScreen = ({ navigation }) => {
    const [deliveries, setDeliveries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Get auth state to listen for updates
    const { user, token } = useSelector(state => state.auth);

    useEffect(() => {
        if (user && auth.currentUser) {
            fetchDeliveryHistory();
        }
    }, [user, token]); // Re-fetch when token refreshes

    const fetchDeliveryHistory = async () => {
        try {
            setLoading(true);
            const response = await apiService.getAssignedOrders();

            // Handle response structure { orders: [...] }
            let ordersData = [];
            if (response.data && Array.isArray(response.data.orders)) {
                ordersData = response.data.orders;
            } else if (Array.isArray(response.data)) {
                ordersData = response.data;
            }

            // Filter only delivered orders
            const deliveredOrders = ordersData.filter(
                order => order.orderStatus === 'delivered'
            );
            setDeliveries(deliveredOrders);
        } catch (error) {
            console.error('Error fetching delivery history:', error);
            // Don't show error for auth issues
            if (error.response?.status !== 401) {
                console.error('Failed to fetch delivery history');
            }
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

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const renderDeliveryCard = (delivery) => (
        <Card
            key={delivery._id}
            style={styles.card}
            onPress={() => navigation.navigate('OrderDetails', { orderId: delivery._id })}
        >
            <Card.Content>
                <View style={styles.cardHeader}>
                    <View>
                        <Text style={styles.orderNumber}>
                            Order #{delivery._id.substring(18).toUpperCase()}
                        </Text>
                        <Text style={styles.dateText}>
                            {formatDate(delivery.deliveredAt || delivery.updatedAt)}
                        </Text>
                    </View>
                    <Chip icon="check-circle" style={styles.deliveredChip} textStyle={styles.chipText}>
                        Delivered
                    </Chip>
                </View>

                <View style={styles.divider} />

                <View style={styles.infoRow}>
                    <MaterialIcons name="person" size={18} color="#666" />
                    <Text style={styles.infoText}>{delivery.shippingAddress.name}</Text>
                </View>

                <View style={styles.infoRow}>
                    <MaterialIcons name="location-on" size={18} color="#666" />
                    <Text style={styles.infoText} numberOfLines={1}>
                        {delivery.shippingAddress.city}
                    </Text>
                </View>

                <View style={styles.infoRow}>
                    <MaterialIcons name="access-time" size={18} color="#666" />
                    <Text style={styles.infoText}>
                        {formatTime(delivery.deliveredAt || delivery.updatedAt)}
                    </Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.footer}>
                    <Text style={styles.amountText}>Earnt: ₹{delivery.deliveryPartnerAmount || 0}</Text>
                    {delivery.deliveryConfirmation?.photoProofUrl && (
                        <TouchableOpacity style={styles.proofButton}>
                            <MaterialIcons name="image" size={18} color="#4CAF50" />
                            <Text style={styles.proofButtonText}>View Proof</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </Card.Content>
        </Card>
    );

    if (loading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4CAF50" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.statsHeader}>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>{deliveries.length}</Text>
                    <Text style={styles.statLabel}>Total Deliveries</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>
                        {deliveries.filter(d => {
                            const deliveryDate = new Date(d.deliveredAt || d.updatedAt);
                            const today = new Date();
                            return deliveryDate.toDateString() === today.toDateString();
                        }).length}
                    </Text>
                    <Text style={styles.statLabel}>Today</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>
                        ₹{deliveries.reduce((sum, d) => sum + (d.deliveryPartnerAmount || 0), 0).toFixed(0)}
                    </Text>
                    <Text style={styles.statLabel}>Total Earned</Text>
                </View>
            </View>

            <ScrollView
                style={styles.scrollContainer}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {deliveries.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <MaterialIcons name="history" size={64} color="#ccc" />
                        <Text style={styles.emptyText}>No delivery history yet</Text>
                        <Text style={styles.emptySubtext}>
                            Completed deliveries will appear here
                        </Text>
                    </View>
                ) : (
                    deliveries.map(renderDeliveryCard)
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F7F9FC',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F7F9FC',
    },
    statsHeader: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: '#fff',
        elevation: 2,
    },
    statCard: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 12,
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#4CAF50',
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    scrollContainer: {
        flex: 1,
        padding: 16,
    },
    card: {
        marginBottom: 12,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    orderNumber: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    dateText: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    deliveredChip: {
        backgroundColor: '#E8F5E9',
    },
    chipText: {
        color: '#4CAF50',
        fontSize: 12,
    },
    divider: {
        height: 1,
        backgroundColor: '#E0E0E0',
        marginVertical: 12,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    infoText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#333',
        flex: 1,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    amountText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    proofButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    proofButtonText: {
        marginLeft: 4,
        color: '#4CAF50',
        fontSize: 12,
        fontWeight: 'bold',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 18,
        fontWeight: 'bold',
        color: '#666',
    },
    emptySubtext: {
        marginTop: 8,
        fontSize: 14,
        color: '#999',
    },
});

export default DeliveryHistoryScreen;
