import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Card, Button, ActivityIndicator, Badge } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';

const DeliveryPartnerDashboard = ({ navigation }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('assigned');

    const { userInfo } = useSelector(state => state.userLogin);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const config = {
                headers: {
                    Authorization: `Bearer ${userInfo.token}`,
                },
            };
            // Fetch assigned orders from the backend
            const { data } = await axios.get('/api/orders/assigned', config);
            setOrders(data.orders || []);
        } catch (error) {
            console.error('Error fetching assigned orders:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [userInfo]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchOrders();
    };

    const filteredOrders = orders.filter(order => {
        if (activeTab === 'assigned') {
            return order.orderStatus === 'shipped';
        } else if (activeTab === 'pending') {
            return order.orderStatus === 'out_for_delivery';
        } else if (activeTab === 'delivered') {
            return order.orderStatus === 'delivered';
        }
        return true;
    });

    const getStatusColor = (status) => {
        switch (status) {
            case 'shipped': return '#2196F3';
            case 'out_for_delivery': return '#FFA500';
            case 'delivered': return '#4CAF50';
            default: return '#9E9E9E';
        }
    };

    const renderOrderCard = (order) => (
        <Card
            key={order._id}
            style={styles.card}
            onPress={() => navigation.navigate('DeliveryConfirmation', { orderId: order._id })}
        >
            <Card.Content>
                <View style={styles.cardHeader}>
                    <Text style={styles.orderNumber}>Order #{order._id.substring(18).toUpperCase()}</Text>
                    <Badge style={{ backgroundColor: getStatusColor(order.orderStatus), color: 'white' }}>
                        {order.orderStatus.replace(/_/g, ' ').toUpperCase()}
                    </Badge>
                </View>

                <View style={styles.infoRow}>
                    <Icon name="person" size={18} color="#666" />
                    <Text style={styles.infoText}>{order.shippingAddress.name}</Text>
                </View>

                <View style={styles.infoRow}>
                    <Icon name="location-on" size={18} color="#666" />
                    <Text style={styles.infoText} numberOfLines={2}>
                        {order.shippingAddress.street}, {order.shippingAddress.city}
                    </Text>
                </View>

                <View style={styles.infoRow}>
                    <Icon name="phone" size={18} color="#666" />
                    <Text style={styles.infoText}>{order.shippingAddress.phone}</Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.cardFooter}>
                    <Text style={styles.amountText}>₹{order.totalAmount}</Text>
                    {order.orderStatus === 'delivered' ? (
                        <Button
                            mode="outlined"
                            onPress={() => Alert.alert('Photo Proof', 'URL: ' + order.deliveryConfirmation?.photoProofUrl)}
                            style={styles.proofButton}
                            labelStyle={styles.proofButtonLabel}
                            icon="image"
                        >
                            View Proof
                        </Button>
                    ) : (
                        <Button
                            mode="contained"
                            onPress={() => navigation.navigate('DeliveryConfirmation', { orderId: order._id })}
                            style={styles.confirmButton}
                            labelStyle={styles.confirmButtonLabel}
                        >
                            Confirm Delivery
                        </Button>
                    )}
                </View>
            </Card.Content>
        </Card>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerStats}>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{orders.filter(o => o.orderStatus === 'delivered').length}</Text>
                        <Text style={styles.statLabel}>Total</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{orders.filter(o => o.orderStatus === 'delivered' && new Date(o.deliveredAt).toDateString() === new Date().toDateString()).length}</Text>
                        <Text style={styles.statLabel}>Today</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{orders.filter(o => o.orderStatus === 'shipped' || o.orderStatus === 'out_for_delivery').length}</Text>
                        <Text style={styles.statLabel}>Active</Text>
                    </View>
                </View>
            </View>

            <View style={styles.tabContainer}>
                {['assigned', 'pending', 'delivered'].map((tab) => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tab, activeTab === tab && styles.activeTab]}
                        onPress={() => setActiveTab(tab)}
                    >
                        <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <ScrollView
                style={styles.scrollContainer}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {loading && !refreshing ? (
                    <ActivityIndicator animating={true} style={styles.loader} />
                ) : filteredOrders.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Icon name="local-shipping" size={64} color="#ccc" />
                        <Text style={styles.emptyText}>No {activeTab} orders found</Text>
                    </View>
                ) : (
                    filteredOrders.map(renderOrderCard)
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
    header: {
        backgroundColor: '#4CAF50',
        padding: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        elevation: 8,
    },
    headerStats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    statLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 4,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        paddingTop: 8,
        marginTop: -10,
        marginHorizontal: 20,
        borderRadius: 12,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderBottomWidth: 3,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: '#4CAF50',
    },
    tabText: {
        fontWeight: '600',
        color: '#666',
        fontSize: 14,
    },
    activeTabText: {
        color: '#4CAF50',
    },
    scrollContainer: {
        padding: 16,
    },
    card: {
        marginBottom: 16,
        borderRadius: 12,
        elevation: 3,
        backgroundColor: '#fff',
        borderLeftWidth: 5,
        borderLeftColor: '#4CAF50',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    orderNumber: {
        fontSize: 16,
        fontWeight: '700',
        color: '#333',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    infoText: {
        marginLeft: 8,
        color: '#555',
        fontSize: 14,
        flex: 1,
    },
    divider: {
        height: 1,
        backgroundColor: '#EEE',
        marginVertical: 12,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    amountText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2E7D32',
    },
    confirmButton: {
        backgroundColor: '#4CAF50',
        borderRadius: 8,
    },
    confirmButtonLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#fff',
    },
    proofButton: {
        borderColor: '#4CAF50',
        borderRadius: 8,
        borderWidth: 1,
    },
    proofButtonLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#4CAF50',
    },
    loader: {
        marginTop: 40,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 100,
    },
    emptyText: {
        marginTop: 16,
        color: '#999',
        fontSize: 16,
    },
});

export default DeliveryPartnerDashboard;
