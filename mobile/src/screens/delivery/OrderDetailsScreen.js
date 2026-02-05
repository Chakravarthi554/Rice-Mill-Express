import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Linking,
    Alert,
    Image,
} from 'react-native';
import { Card, Button, ActivityIndicator, Divider } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { apiService } from '../../services/api';

const OrderDetailsScreen = ({ route, navigation }) => {
    const { orderId } = route.params;
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchOrderDetails();
    }, [orderId]);

    const fetchOrderDetails = async () => {
        try {
            setLoading(true);
            const response = await apiService.getDeliveryOrderById(orderId);
            // Handle response structure { success: true, order: {...} }
            const orderData = response.data?.order || response.data;
            setOrder(orderData);
        } catch (error) {
            console.error('Error fetching order details:', error);
            Alert.alert('Error', 'Failed to load order details');
        } finally {
            setLoading(false);
        }
    };

    const handleCallCustomer = () => {
        if (order?.shippingAddress?.phone) {
            Linking.openURL(`tel:${order.shippingAddress.phone}`);
        }
    };

    const handleStartDelivery = async () => {
        try {
            setActionLoading(true);
            await apiService.startDelivery(orderId);
            Alert.alert('Success', 'Delivery started!');
            fetchOrderDetails(); // Refresh order data
        } catch (error) {
            console.error('Error starting delivery:', error);
            Alert.alert('Error', 'Failed to start delivery');
        } finally {
            setActionLoading(false);
        }
    };

    const handleCaptureAndComplete = async () => {
        try {
            // Request camera permissions
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Required', 'Camera permission is required to capture delivery proof');
                return;
            }

            // Launch camera
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                await uploadDeliveryProof(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Error capturing photo:', error);
            Alert.alert('Error', 'Failed to capture photo');
        }
    };

    const uploadDeliveryProof = async (photoUri) => {
        try {
            setActionLoading(true);

            const formData = new FormData();
            formData.append('deliveryPhoto', {
                uri: photoUri,
                name: 'delivery-proof.jpg',
                type: 'image/jpeg',
            });

            await apiService.uploadDeliveryPhoto(orderId, formData);

            Alert.alert('Success', 'Delivery completed successfully!', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            console.error('Error uploading delivery proof:', error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to complete delivery');
        } finally {
            setActionLoading(false);
        }
    };

    const getStatusBadgeColor = (status) => {
        switch (status) {
            case 'shipped': return '#2196F3';
            case 'out_for_delivery': return '#FFA500';
            case 'delivered': return '#4CAF50';
            default: return '#9E9E9E';
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4CAF50" />
            </View>
        );
    }

    if (!order) {
        return (
            <View style={styles.errorContainer}>
                <MaterialIcons name="error-outline" size={64} color="#ccc" />
                <Text style={styles.errorText}>Order not found</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            {/* Order Status Header */}
            <Card style={styles.statusCard}>
                <Card.Content>
                    <View style={styles.statusHeader}>
                        <Text style={styles.orderNumber}>Order #{order._id?.substring(18)?.toUpperCase() || 'N/A'}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusBadgeColor(order.orderStatus) }]}>
                            <Text style={styles.statusText}>
                                {order.orderStatus.replace(/_/g, ' ').toUpperCase()}
                            </Text>
                        </View>
                    </View>
                </Card.Content>
            </Card>

            {/* Customer Information */}
            <Card style={styles.card}>
                <Card.Title title="Customer Information" titleStyle={styles.cardTitle} />
                <Card.Content>
                    <View style={styles.infoRow}>
                        <MaterialIcons name="person" size={20} color="#666" />
                        <Text style={styles.infoText}>{order.shippingAddress.name}</Text>
                    </View>

                    <View style={styles.infoRow}>
                        <MaterialIcons name="phone" size={20} color="#666" />
                        <Text style={styles.infoText}>{order.shippingAddress.phone}</Text>
                        <TouchableOpacity onPress={handleCallCustomer} style={styles.callButton}>
                            <MaterialIcons name="call" size={20} color="#4CAF50" />
                            <Text style={styles.callButtonText}>Call</Text>
                        </TouchableOpacity>
                    </View>

                    <Divider style={styles.divider} />

                    <View style={styles.addressContainer}>
                        <MaterialIcons name="location-on" size={20} color="#666" />
                        <View style={styles.addressTextContainer}>
                            <Text style={styles.addressLabel}>Delivery Address</Text>
                            <Text style={styles.addressText}>
                                {order.shippingAddress.street}
                            </Text>
                            <Text style={styles.addressText}>
                                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pinCode}
                            </Text>
                        </View>
                    </View>
                </Card.Content>
            </Card>

            {/* Order Items */}
            <Card style={styles.card}>
                <Card.Title title="Order Items" titleStyle={styles.cardTitle} />
                <Card.Content>
                    {order.orderItems.map((item, index) => (
                        <View key={index} style={styles.itemRow}>
                            <Text style={styles.itemName}>{item.name}</Text>
                            <Text style={styles.itemQuantity}>x{item.quantity}</Text>
                            <Text style={styles.itemPrice}>₹{item.price * item.quantity}</Text>
                        </View>
                    ))}
                </Card.Content>
            </Card>

            {/* Payment Information */}
            <Card style={styles.card}>
                <Card.Title title="Payment Information" titleStyle={styles.cardTitle} />
                <Card.Content>
                    <View style={styles.paymentRow}>
                        <Text style={styles.paymentLabel}>Payment Method</Text>
                        <Text style={styles.paymentValue}>
                            {order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod.toUpperCase()}
                        </Text>
                    </View>
                    <View style={styles.paymentRow}>
                        <Text style={styles.paymentLabel}>Total Amount</Text>
                        <Text style={styles.totalAmount}>₹{order.totalAmount}</Text>
                    </View>
                </Card.Content>
            </Card>

            {/* Delivery Proof (if delivered) */}
            {order.orderStatus === 'delivered' && order.deliveryConfirmation?.photoProofUrl && (
                <Card style={styles.card}>
                    <Card.Title title="Delivery Proof" titleStyle={styles.cardTitle} />
                    <Card.Content>
                        <Image
                            source={{ uri: order.deliveryConfirmation.photoProofUrl }}
                            style={styles.proofImage}
                            resizeMode="cover"
                        />
                    </Card.Content>
                </Card>
            )}

            {/* Action Buttons */}
            <View style={styles.actionContainer}>
                {order.orderStatus === 'shipped' && order.replacementStatus !== 'requested' && (
                    <Button
                        mode="contained"
                        onPress={handleStartDelivery}
                        loading={actionLoading}
                        disabled={actionLoading}
                        style={styles.actionButton}
                        icon="truck-fast"
                    >
                        Start Delivery
                    </Button>
                )}

                {/* Special case: Re-dispatch approved, show Start Delivery specifically for replacement */}
                {order.orderStatus === 'replacement_approved' && (
                    <Button
                        mode="contained"
                        onPress={handleStartDelivery}
                        loading={actionLoading}
                        disabled={actionLoading}
                        style={styles.actionButton}
                        icon="refresh"
                    >
                        Start Replacement Delivery
                    </Button>
                )}

                {(order.orderStatus === 'out_for_delivery' || order.orderStatus === 'delivered') && (
                    <>
                        {order.orderStatus !== 'delivered' && (
                            <Button
                                mode="contained"
                                onPress={handleCaptureAndComplete}
                                loading={actionLoading}
                                disabled={actionLoading}
                                style={styles.actionButton}
                                icon="camera"
                            >
                                Capture Proof & Complete
                            </Button>
                        )}

                        {order.replacementStatus === 'none' && order.orderStatus !== 'delivered' && (
                            <Button
                                mode="outlined"
                                onPress={() => navigation.navigate('ReplacementRequest', {
                                    orderId: order._id,
                                    orderDetails: order
                                })}
                                style={[styles.actionButton, styles.replacementButton]}
                                icon="swap-horizontal"
                            >
                                Request Replacement
                            </Button>
                        )}
                    </>
                )}
            </View>
        </ScrollView>
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
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F7F9FC',
    },
    errorText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
    },
    statusCard: {
        margin: 16,
        marginBottom: 8,
        elevation: 2,
    },
    statusHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    orderNumber: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    statusText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    card: {
        margin: 16,
        marginTop: 8,
        marginBottom: 8,
        elevation: 2,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    infoText: {
        marginLeft: 12,
        fontSize: 16,
        color: '#333',
        flex: 1,
    },
    callButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    callButtonText: {
        marginLeft: 4,
        color: '#4CAF50',
        fontWeight: 'bold',
    },
    divider: {
        marginVertical: 12,
    },
    addressContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    addressTextContainer: {
        marginLeft: 12,
        flex: 1,
    },
    addressLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    addressText: {
        fontSize: 16,
        color: '#333',
        marginBottom: 2,
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    itemName: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
    itemQuantity: {
        fontSize: 14,
        color: '#666',
        marginHorizontal: 12,
    },
    itemPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    paymentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    paymentLabel: {
        fontSize: 16,
        color: '#666',
    },
    paymentValue: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    totalAmount: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#4CAF50',
    },
    proofImage: {
        width: '100%',
        height: 200,
        borderRadius: 8,
    },
    actionContainer: {
        padding: 16,
        paddingBottom: 32,
    },
    actionButton: {
        paddingVertical: 8,
        backgroundColor: '#4CAF50',
        marginBottom: 12,
    },
    replacementButton: {
        backgroundColor: 'transparent',
        borderColor: '#FF9800',
        borderWidth: 2,
    },
    banner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        marginHorizontal: 16,
        marginBottom: 8,
        borderRadius: 8,
        borderWidth: 1,
    },
    bannerText: {
        marginLeft: 8,
        fontSize: 14,
        fontWeight: 'bold',
        flex: 1,
    },
    pendingBanner: {
        backgroundColor: '#FFF3E0',
        borderColor: '#FFB74D',
    },
    errorBanner: {
        backgroundColor: '#FFEBEE',
        borderColor: '#EF5350',
    },
    successBanner: {
        backgroundColor: '#E8F5E9',
        borderColor: '#66BB6A',
    },
});

export default OrderDetailsScreen;
