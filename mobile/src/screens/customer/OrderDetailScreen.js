import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Alert, Button } from 'react-native';
import { Card, Divider } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { apiService } from '../../services/api';

const OrderDetailScreen = ({ route, navigation }) => {
    const { id } = route.params;
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrderDetails();
    }, []);

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

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#4CAF50" />
            </View>
        );
    }

    if (!order) return null;

    return (
        <ScrollView style={styles.container}>
            <Card style={styles.card}>
                <Card.Content>
                    <Text style={styles.orderId}>Order #{order._id.slice(-6).toUpperCase()}</Text>
                    <Text style={styles.date}>Placed on {new Date(order.createdAt).toLocaleDateString()}</Text>

                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.orderStatus) }]}>
                        <Text style={styles.statusText}>{order.orderStatus.toUpperCase()}</Text>
                    </View>
                </Card.Content>
            </Card>

            <Card style={styles.card}>
                <Card.Title title="Items" left={(props) => <MaterialIcons {...props} name="shopping-bag" />} />
                <Card.Content>
                    {order.orderItems.map((item, index) => (
                        <View key={index} style={styles.itemRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.itemName}>{item.name}</Text>
                                <Text style={styles.itemQty}>Qty: {item.qty} x ₹{item.price}</Text>
                            </View>
                            <Text style={styles.itemTotal}>₹{item.qty * item.price}</Text>
                        </View>
                    ))}
                    <Divider style={{ marginVertical: 10 }} />
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Total Amount</Text>
                        <Text style={styles.totalAmount}>₹{order.totalPrice}</Text>
                    </View>
                </Card.Content>
            </Card>

            <Card style={styles.card}>
                <Card.Title title="Shipping Address" left={(props) => <MaterialIcons {...props} name="location-on" />} />
                <Card.Content>
                    <Text>{order.shippingAddress.street}</Text>
                    <Text>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pinCode}</Text>
                    <Text>Phone: {order.shippingAddress.phone}</Text>
                </Card.Content>
            </Card>

            <Card style={styles.card}>
                <Card.Title title="Payment" left={(props) => <MaterialIcons {...props} name="payment" />} />
                <Card.Content>
                    <Text>Method: {order.paymentMethod}</Text>
                    <Text>Status: {order.isPaid ? 'Paid' : 'Pending'}</Text>
                </Card.Content>
            </Card>

            {/* Assuming invoice download is a web feature mostly, but could add button here if URL available */}
            {/* <Button title="Download Invoice" onPress={() => ...} /> */}

        </ScrollView>
    );
};

const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
        case 'delivered': return '#4CAF50';
        case 'shipped': return '#2196F3';
        case 'processing': return '#FF9800';
        case 'cancelled': return '#F44336';
        default: return '#757575';
    }
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        padding: 16,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        marginBottom: 16,
    },
    orderId: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    date: {
        color: '#666',
        marginBottom: 10,
    },
    statusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 4,
        marginTop: 8,
    },
    statusText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    itemName: {
        fontSize: 16,
        fontWeight: '500',
    },
    itemQty: {
        color: '#666',
    },
    itemTotal: {
        fontWeight: 'bold',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    totalAmount: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#4CAF50',
    },
});

export default OrderDetailScreen;
