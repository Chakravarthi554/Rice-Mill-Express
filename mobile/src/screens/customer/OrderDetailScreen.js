import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Alert, TouchableOpacity, Linking, Image } from 'react-native';
import { Card, Divider, Button } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { apiService } from '../../services/api';
import { API_URL } from '../../config/env';

const OrderDetailScreen = ({ route, navigation }) => {
    const { id } = route.params;
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);

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

    const handleDownloadInvoice = async () => {
        try {
            setDownloading(true);
            const auth = await apiService.getAuthToken(); // If I can get it
            // Construct authenticated URL
            const invoiceUrl = `${process.env.EXPO_PUBLIC_API_URL}/api/orders/${id}/invoice?token=${auth}`;
            await Linking.openURL(invoiceUrl);
        } catch (error) {
            console.error('Error downloading invoice:', error);
            Alert.alert('Error', 'Could not download invoice. Please try again later.');
        } finally {
            setDownloading(false);
        }
    };

    const handleRefundRequest = () => {
        navigation.navigate('Refunds', { orderId: id });
    };

    const handleTrackOrder = () => {
        // Navigate to a dedicated tracking screen or map if implemented
        Alert.alert('Tracking', 'Order tracking feature coming soon!');
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
                    <View style={styles.headerRow}>
                        <View>
                            <Text style={styles.orderId}>Order #{order._id.slice(-6).toUpperCase()}</Text>
                            <Text style={styles.date}>Placed on {new Date(order.createdAt).toLocaleDateString()}</Text>
                            <Text style={styles.itemCountText}>{order.orderItems?.length || 0} items in this order</Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.orderStatus) }]}>
                            <Text style={styles.statusText}>{order.orderStatus.toUpperCase()}</Text>
                        </View>
                    </View>

                    {order.orderStatus === 'delivered' && (
                        <Button
                            mode="outlined"
                            onPress={handleRefundRequest}
                            style={styles.refundButton}
                            icon="undo"
                        >
                            Request Refund / Return
                        </Button>
                    )}
                </Card.Content>
            </Card>

            {/* Delivery Partner Details */}
            {order.deliveryPartner && (
                <Card style={styles.card}>
                    <Card.Title
                        title="Delivery Partner"
                        left={(props) => <MaterialIcons {...props} name="delivery-dining" />}
                    />
                    <Card.Content>
                        <View style={styles.partnerRow}>
                            <MaterialIcons name="person" size={40} color="#666" />
                            <View style={styles.partnerInfo}>
                                <Text style={styles.partnerName}>{order.deliveryPartner.name}</Text>
                                <Text style={styles.partnerPhone}>Phone: {order.deliveryPartner.phone}</Text>
                            </View>
                            <TouchableOpacity onPress={() => Linking.openURL(`tel:${order.deliveryPartner.phone}`)}>
                                <MaterialIcons name="call" size={30} color="#4CAF50" />
                            </TouchableOpacity>
                        </View>
                        {order.orderStatus === 'out_for_delivery' && (
                            <Button
                                mode="contained"
                                onPress={handleTrackOrder}
                                style={styles.trackButton}
                                icon="map"
                            >
                                Track Current Location
                            </Button>
                        )}
                    </Card.Content>
                </Card>
            )}

            <Card style={styles.card}>
                <Card.Title title="Items" left={(props) => <MaterialIcons {...props} name="shopping-bag" />} />
                <Card.Content>
                    {order.orderItems.map((item, index) => (
                        <View key={index} style={styles.itemRow}>
                            <Image
                                source={{
                                    uri: item.image?.startsWith('http')
                                        ? item.image
                                        : `${API_URL}${item.image}`
                                }}
                                style={styles.itemImage}
                            />
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={styles.itemName}>{item.name}</Text>
                                <Text style={styles.itemQty}>{item.qty} x ₹{item.price}</Text>
                            </View>
                            <Text style={styles.itemTotal}>₹{item.subtotal || (item.qty * item.price)}</Text>
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
                    <Text style={styles.addressText}>{order.shippingAddress.street}</Text>
                    <Text style={styles.addressText}>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pinCode}</Text>
                    <Text style={styles.addressText}>Phone: {order.shippingAddress.phone}</Text>
                </Card.Content>
            </Card>

            <Card style={styles.card}>
                <Card.Title title="Order Timeline" left={(props) => <MaterialIcons {...props} name="history" />} />
                <Card.Content>
                    <Timeline order={order} />
                </Card.Content>
            </Card>

            <View style={styles.actionContainer}>
                <Button
                    mode="contained"
                    onPress={handleDownloadInvoice}
                    loading={downloading}
                    disabled={downloading}
                    style={styles.invoiceButton}
                    icon="file-download"
                >
                    Download Invoice
                </Button>
            </View>

        </ScrollView>
    );
};

const Timeline = ({ order }) => {
    const statuses = [
        { key: 'placed', label: 'Order Placed', icon: 'check-circle' },
        { key: 'processing', label: 'Processing', icon: 'settings' },
        { key: 'shipped', label: 'Shipped', icon: 'local-shipping' },
        { key: 'out_for_delivery', label: 'Out for Delivery', icon: 'delivery-dining' },
        { key: 'delivered', label: 'Delivered', icon: 'home' },
    ];

    const currentStatusIndex = statuses.findIndex(s => s.key === order.orderStatus.toLowerCase());

    return (
        <View style={styles.timelineContainer}>
            {statuses.map((status, index) => (
                <View key={status.key} style={styles.timelineItem}>
                    <View style={styles.timelineLeft}>
                        <MaterialIcons
                            name={status.icon}
                            size={24}
                            color={index <= currentStatusIndex ? '#4CAF50' : '#ccc'}
                        />
                        {index < statuses.length - 1 && (
                            <View style={[styles.timelineLine, { backgroundColor: index < currentStatusIndex ? '#4CAF50' : '#ccc' }]} />
                        )}
                    </View>
                    <Text style={[styles.timelineText, { color: index <= currentStatusIndex ? '#333' : '#999' }]}>
                        {status.label}
                    </Text>
                </View>
            ))}
        </View>
    );
};

const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
        case 'delivered': return '#4CAF50';
        case 'out_for_delivery': return '#FFC107';
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
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    card: {
        margin: 16,
        marginBottom: 0,
        elevation: 2,
    },
    orderId: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    date: {
        color: '#666',
        fontSize: 14,
    },
    itemCountText: {
        color: '#4CAF50',
        fontSize: 12,
        fontWeight: 'bold',
        marginTop: 4,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 4,
    },
    statusText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    refundButton: {
        marginTop: 16,
        borderColor: '#F44336',
    },
    partnerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    partnerInfo: {
        flex: 1,
        marginLeft: 16,
    },
    partnerName: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    partnerPhone: {
        color: '#666',
    },
    trackButton: {
        backgroundColor: '#2196F3',
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    itemImage: {
        width: 60,
        height: 60,
        borderRadius: 8,
        backgroundColor: '#f0f0f0',
    },
    itemName: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#333',
    },
    itemQty: {
        color: '#666',
    },
    itemTotal: {
        fontWeight: 'bold',
        fontSize: 16,
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
    addressText: {
        fontSize: 14,
        color: '#333',
        marginBottom: 4,
    },
    actionContainer: {
        padding: 16,
        paddingBottom: 32,
    },
    invoiceButton: {
        backgroundColor: '#4CAF50',
    },
    timelineContainer: {
        marginTop: 8,
    },
    timelineItem: {
        flexDirection: 'row',
        height: 50,
        alignItems: 'flex-start',
    },
    timelineLeft: {
        alignItems: 'center',
        width: 30,
        marginRight: 16,
    },
    timelineLine: {
        width: 2,
        flex: 1,
        marginVertical: 4,
    },
    timelineText: {
        fontSize: 14,
        fontWeight: '500',
    },
});

export default OrderDetailScreen;

