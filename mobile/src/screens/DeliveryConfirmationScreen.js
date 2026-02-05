import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, Alert } from 'react-native';
import { Button, Card, ActivityIndicator, HelperText } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useSelector } from 'react-redux';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';

const DeliveryConfirmationScreen = ({ route, navigation }) => {
    const { orderId } = route.params;
    const [photo, setPhoto] = useState(null);
    const [location, setLocation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [order, setOrder] = useState(null);

    const { userInfo } = useSelector(state => state.userLogin);

    useEffect(() => {
        fetchOrderDetails();
        requestPermissions();
    }, []);

    const requestPermissions = async () => {
        const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
        const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();

        if (cameraStatus !== 'granted' || locationStatus !== 'granted') {
            Alert.alert('Permissions Required', 'Camera and Location access are needed to confirm delivery.');
        }
    };

    const fetchOrderDetails = async () => {
        try {
            const config = {
                headers: { Authorization: `Bearer ${userInfo.token}` },
            };
            const { data } = await axios.get(`/api/orders/${orderId}`, config);
            setOrder(data);
        } catch (error) {
            console.error('Error fetching order:', error);
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

            // 1. In a real-world scenario, you'd upload this to Firebase Storage here
            // and get a URL. Since we don't have a direct Firebase config file, 
            // we'll assume a standard multipart upload or that the user will configure the storage bucket later.
            // For this implementation, we'll simulate the "photoUrl" being sent to the backend.

            const formData = new FormData();
            formData.append('image', {
                uri: photo.uri,
                name: `delivery_${orderId}.jpg`,
                type: 'image/jpeg',
            });

            // Simulation: We'll send the data to the backend confirm endpoint
            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${userInfo.token}`,
                },
            };

            // Path corresponds to the updated backend route
            const payload = {
                orderId,
                photoProofUrl: photo.uri,
                location: location ? {
                    lat: location.latitude,
                    lng: location.longitude
                } : null,
                notes: 'Delivered via Zepto-Style Photo Confirmation'
            };

            await axios.post('/api/delivery/confirm', payload, {
                headers: { Authorization: `Bearer ${userInfo.token}` }
            });

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
                        Capture a photo of the rice bags at the customer's doorstep to confirm delivery.
                    </Text>

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
});

export default DeliveryConfirmationScreen;
