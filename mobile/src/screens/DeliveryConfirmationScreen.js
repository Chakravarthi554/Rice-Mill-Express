import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Button, Card, ActivityIndicator, HelperText } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { MaterialIcons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { apiService } from '../services/api';

const DeliveryConfirmationScreen = ({ route, navigation }) => {
    const { orderId } = route.params;
    const [photo, setPhoto] = useState(null);
    const [location, setLocation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [order, setOrder] = useState(null);
    const [qrLink, setQrLink] = useState(null);
    const [paymentLinkId, setPaymentLinkId] = useState(null);
    const [generatingQR, setGeneratingQR] = useState(false);

    useEffect(() => {
        fetchOrderDetails();
        requestPermissions();
    }, []);

    useEffect(() => {
        let interval;
        if (paymentLinkId && order && !order.isPaid) {
            interval = setInterval(() => {
                checkPaymentStatus();
            }, 5000); // Check every 5 seconds
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [paymentLinkId, order]);

    const checkPaymentStatus = async () => {
        if (!paymentLinkId || !orderId) return;
        try {
            const response = await apiService.checkDeliveryPaymentStatus(orderId, paymentLinkId);
            if (response.data.isPaid) {
                setOrder(prev => ({ ...prev, isPaid: true }));
                Alert.alert('Payment Verified', 'Customer payment successfully collected! You may now take the confirmation photo.');
            }
        } catch (error) {
            // Silently fail during polling
            console.log('Payment check error:', error);
        }
    };

    const generatePaymentLink = async () => {
        try {
            setGeneratingQR(true);
            const response = await apiService.generateDeliveryPaymentLink(orderId);
            setPaymentLinkId(response.data.paymentLinkId);
            setQrLink(response.data.paymentLinkUrl);
        } catch (error) {
            console.error('Error generating QR:', error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to generate payment QR');
        } finally {
            setGeneratingQR(false);
        }
    };

    const requestPermissions = async () => {
        const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
        const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();

        if (cameraStatus !== 'granted' || locationStatus !== 'granted') {
            Alert.alert('Permissions Required', 'Camera and Location access are needed to confirm delivery.');
        }
    };

    const fetchOrderDetails = async () => {
        try {
            setLoading(true);
            const response = await apiService.getDeliveryOrderById(orderId);
            const orderData = response.data?.order || response.data;
            setOrder(orderData);
        } catch (error) {
            console.error('Error fetching order:', error);
            Alert.alert('Error', 'Failed to load order details');
        } finally {
            setLoading(false);
        }
    };

    const takePhoto = async () => {
        try {
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: false,
                quality: 0.7,
            });

            if (!result.canceled) {
                setPhoto(result.assets[0]);
                // Capture location at the same time
                const currentLoc = await Location.getCurrentPositionAsync({});
                setLocation(currentLoc.coords);
            }
        } catch (error) {
            console.error('Error taking photo:', error);
            Alert.alert('Error', 'Could not open camera');
        }
    };

    const handleConfirmDelivery = async () => {
        if (!photo) {
            Alert.alert('Missing Proof', 'Please take a photo of the delivered item.');
            return;
        }

        try {
            setUploading(true);

            const formData = new FormData();
            formData.append('deliveryPhoto', {
                uri: photo.uri,
                name: `delivery_${orderId}.jpg`,
                type: 'image/jpeg',
            });

            if (location) {
                formData.append('latitude', location.latitude.toString());
                formData.append('longitude', location.longitude.toString());
            }

            formData.append('notes', 'Delivered via Photo Confirmation');

            await apiService.uploadDeliveryPhoto(orderId, formData);

            Alert.alert('Delivery Confirmed', 'The order has been marked as delivered and all dashboards updated.', [
                { text: 'Back to Dashboard', onPress: () => navigation.navigate('DeliveryDashboard') }
            ]);

        } catch (error) {
            console.error('Error confirming delivery:', error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to confirm delivery');
        } finally {
            setUploading(false);
        }
    };

    if (!order) return <ActivityIndicator style={{ flex: 1 }} />;

    return (
        <ScrollView style={styles.container}>
            <Card style={styles.orderCard}>
                <Card.Title title="Confirm Delivery" subtitle={`Order #${order._id.substring(18).toUpperCase()}`} />
                <Card.Content>
                    <View style={styles.customerBox}>
                        <Text style={styles.customerName}>{order.shippingAddress.name}</Text>
                        <Text style={styles.customerAddress}>{order.shippingAddress.street}, {order.shippingAddress.city}</Text>
                    </View>

                    <Text style={styles.instruction}>
                        {order.paymentMethod === 'cod' && !order.isPaid
                            ? "Collect the remaining cash on delivery amount by showing the QR code below."
                            : "Capture a photo of the rice bags at the customer's doorstep to confirm delivery."}
                    </Text>

                    {order.paymentMethod === 'cod' && !order.isPaid ? (
                        <View style={styles.qrContainer}>
                            {!qrLink ? (
                                <View style={styles.generateQRBox}>
                                    <Text style={styles.qrDesc}>₹{order.remainingCodAmount > 0 ? order.remainingCodAmount : order.totalPrice} to collect</Text>
                                    <Button
                                        mode="contained"
                                        onPress={generatePaymentLink}
                                        loading={generatingQR}
                                        disabled={generatingQR}
                                        style={styles.qrButton}
                                    >GENERATE PAYMENT QR</Button>
                                </View>
                            ) : (
                                <View style={styles.activeQRBox}>
                                    <View style={styles.qrCodeWrapper}>
                                        <QRCode
                                            value={qrLink}
                                            size={200}
                                        />
                                    </View>
                                    <Text style={styles.waitText}>Waiting for customer to pay...</Text>
                                    <ActivityIndicator size="small" color="#4CAF50" style={{ marginTop: 10 }} />
                                </View>
                            )}
                        </View>
                    ) : (
                        <>
                            <TouchableOpacity style={styles.photoContainer} onPress={takePhoto}>
                                {photo ? (
                                    <Image source={{ uri: photo.uri }} style={styles.previewImage} />
                                ) : (
                                    <View style={styles.placeholderBox}>
                                        <MaterialIcons name="camera-alt" size={48} color="#999" />
                                        <Text style={styles.placeholderText}>Tap to open camera</Text>
                                    </View>
                                )}
                            </TouchableOpacity>

                            {location && (
                                <View style={styles.locationTag}>
                                    <MaterialIcons name="location-searching" size={16} color="#4CAF50" />
                                    <Text style={styles.locationText}>Location Captured</Text>
                                </View>
                            )}

                            <Button
                                mode="contained"
                                onPress={handleConfirmDelivery}
                                loading={uploading}
                                disabled={!photo || uploading}
                                style={styles.mainButton}
                            >
                                CONFIRM & COMPLETE DELIVERY
                            </Button>
                        </>
                    )}

                    <HelperText type="info" center>
                        No customer OTP required for this delivery.
                    </HelperText>
                </Card.Content>
            </Card>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        padding: 16,
    },
    orderCard: {
        borderRadius: 12,
        elevation: 4,
    },
    customerBox: {
        backgroundColor: '#E8F5E9',
        padding: 12,
        borderRadius: 8,
        marginBottom: 20,
    },
    customerName: {
        fontWeight: 'bold',
        fontSize: 16,
        color: '#2E7D32',
    },
    customerAddress: {
        color: '#555',
        marginTop: 4,
    },
    instruction: {
        fontSize: 14,
        color: '#666',
        marginBottom: 16,
        lineHeight: 20,
    },
    photoContainer: {
        width: '100%',
        height: 250,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#EEE',
        marginBottom: 20,
        borderWidth: 2,
        borderColor: '#DDD',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
    },
    previewImage: {
        width: '100%',
        height: '100%',
    },
    placeholderBox: {
        alignItems: 'center',
    },
    placeholderText: {
        marginTop: 8,
        color: '#999',
        fontWeight: '600',
    },
    locationTag: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    locationText: {
        marginLeft: 6,
        color: '#4CAF50',
        fontWeight: '600',
    },
    mainButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 8,
        marginBottom: 8,
    },
    qrContainer: {
        alignItems: 'center',
        marginVertical: 10,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        elevation: 2,
    },
    generateQRBox: {
        alignItems: 'center',
        width: '100%',
    },
    qrDesc: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#333'
    },
    qrButton: {
        backgroundColor: '#4CAF50',
        width: '100%'
    },
    activeQRBox: {
        alignItems: 'center',
    },
    qrCodeWrapper: {
        padding: 10,
        backgroundColor: '#fff',
        borderRadius: 8,
        elevation: 1,
    },
    waitText: {
        marginTop: 15,
        fontSize: 16,
        fontWeight: 'bold',
        color: '#4CAF50'
    }
});

export default DeliveryConfirmationScreen;
