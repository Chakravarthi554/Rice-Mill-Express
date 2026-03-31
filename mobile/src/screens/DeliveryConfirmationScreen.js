import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, Alert, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
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

    if (!order || loading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <View style={styles.spinnerPlaceholder} />
                <Text style={styles.loadingText}>Loading Delivery Details...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Confirm Delivery</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.content}>
                
                {/* Order Meta info */}
                <View style={styles.mb}>
                    <Text style={styles.orderLabel}>ORDER ID</Text>
                    <Text style={styles.orderId}>#{order._id?.substring(18)?.toUpperCase() || 'N/A'}</Text>
                </View>

                {/* Customer Box */}
                <View style={styles.customerBox}>
                    <Ionicons name="person-circle" size={40} color="#16A34A" style={{ marginRight: 12 }} />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.customerName}>{order.shippingAddress?.name}</Text>
                        <Text style={styles.customerAddress}>{order.shippingAddress?.street}, {order.shippingAddress?.city}</Text>
                    </View>
                </View>

                {/* Main Instruction */}
                <View style={styles.instructionBox}>
                    <Ionicons name="information-circle-outline" size={24} color="#6B7280" />
                    <Text style={styles.instructionText}>
                        {order.paymentMethod === 'cod' && !order.isPaid
                            ? "Collect the remaining 80% ONLY via UPI scanning the QR code below. Cash is not accepted."
                            : "Capture a photo of the item at the destination to confirm completion."}
                    </Text>
                </View>

                {order.paymentMethod === 'cod' && !order.isPaid ? (
                    <View style={styles.qrContainer}>
                        {!qrLink ? (
                            <View style={styles.generateQRBox}>
                                <Text style={styles.qrDesc}>₹{order.remainingCodAmount > 0 ? order.remainingCodAmount : order.totalPrice}</Text>
                                <Text style={styles.qrSubDesc}>Collect this amount from the customer</Text>
                                
                                <TouchableOpacity 
                                    style={[styles.btnPrimary, { width: '100%' }]} 
                                    onPress={generatePaymentLink}
                                    disabled={generatingQR}>
                                    {generatingQR ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <Text style={styles.btnPrimaryText}>Generate Payment QR</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <View style={styles.activeQRBox}>
                                <View style={styles.qrCodeWrapper}>
                                    <QRCode value={qrLink} size={200} />
                                </View>
                                <View style={styles.waitRow}>
                                    <ActivityIndicator size="small" color="#EA580C" />
                                    <Text style={styles.waitText}>Waiting for UPI payment verification...</Text>
                                </View>
                            </View>
                        )}
                    </View>
                ) : (
                    <View style={styles.photoSection}>
                        <TouchableOpacity style={styles.photoContainer} onPress={takePhoto}>
                            {photo ? (
                                <Image source={{ uri: photo.uri }} style={styles.previewImage} />
                            ) : (
                                <View style={styles.placeholderBox}>
                                    <View style={styles.iconCircle}>
                                        <Ionicons name="camera" size={32} color="#4F46E5" />
                                    </View>
                                    <Text style={styles.placeholderText}>Tap to open camera</Text>
                                    <Text style={styles.placeholderSubText}>Required for Proof of Delivery (POD)</Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        {location && (
                            <View style={styles.locationTag}>
                                <Ionicons name="location" size={16} color="#16A34A" />
                                <Text style={styles.locationText}>Location Captured Perfectly</Text>
                            </View>
                        )}

                        <TouchableOpacity 
                            style={[styles.btnGreen, (!photo || uploading) && { opacity: 0.6 }]} 
                            onPress={handleConfirmDelivery}
                            disabled={!photo || uploading}>
                            {uploading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <Ionicons name="checkmark-circle-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                                    <Text style={styles.btnPrimaryText}>Confirm & Complete Delivery</Text>
                                </>
                            )}
                        </TouchableOpacity>
                        
                        <Text style={styles.noOtpText}>No customer OTP required for this delivery.</Text>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    loadingContainer: {
        flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB',
    },
    spinnerPlaceholder: {
        width: 40, height: 40, borderRadius: 20, borderWidth: 3, borderColor: '#16A34A', borderTopColor: 'transparent',
    },
    loadingText: {
        marginTop: 16, color: '#6B7280', fontSize: 14,
    },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff',
        borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
    },
    backBtn: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 16, fontWeight: '700', color: '#111827',
    },
    content: {
        padding: 16,
    },
    mb: {
        marginBottom: 16,
    },
    orderLabel: {
        fontSize: 11, color: '#6B7280', fontWeight: '600', marginBottom: 4,
    },
    orderId: {
        fontSize: 18, fontWeight: '700', color: '#111827',
    },
    customerBox: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FDF4',
        padding: 16, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#DCFCE7',
    },
    customerName: {
        fontWeight: '700', fontSize: 16, color: '#166534', marginBottom: 4,
    },
    customerAddress: {
        color: '#15803D', fontSize: 14, lineHeight: 20,
    },
    instructionBox: {
        flexDirection: 'row', backgroundColor: '#fff', padding: 16, borderRadius: 12,
        marginBottom: 20, borderWidth: 1, borderColor: '#F3F4F6', alignItems: 'center',
    },
    instructionText: {
        flex: 1, fontSize: 14, color: '#4B5563', lineHeight: 20, marginLeft: 12,
    },
    photoSection: {
        marginTop: 8,
    },
    photoContainer: {
        width: '100%', height: 260, borderRadius: 16, overflow: 'hidden',
        backgroundColor: '#F3F4F6', marginBottom: 20, borderWidth: 2, borderColor: '#E5E7EB',
        borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center',
    },
    previewImage: {
        width: '100%', height: '100%',
    },
    placeholderBox: {
        alignItems: 'center', padding: 20,
    },
    iconCircle: {
        width: 64, height: 64, borderRadius: 32, backgroundColor: '#EEF2FF',
        justifyContent: 'center', alignItems: 'center', marginBottom: 12,
    },
    placeholderText: {
        color: '#111827', fontWeight: '600', fontSize: 16, marginBottom: 4,
    },
    placeholderSubText: {
        color: '#6B7280', fontSize: 13,
    },
    locationTag: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#F0FDF4', paddingVertical: 8, paddingHorizontal: 16,
        borderRadius: 20, alignSelf: 'center', marginBottom: 20,
    },
    locationText: {
        marginLeft: 6, color: '#16A34A', fontWeight: '600', fontSize: 13,
    },
    qrContainer: {
        alignItems: 'center', backgroundColor: '#fff', borderRadius: 16,
        padding: 24, borderWidth: 1, borderColor: '#F3F4F6',
    },
    generateQRBox: {
        alignItems: 'center', width: '100%',
    },
    qrDesc: {
        fontSize: 32, fontWeight: '800', color: '#111827', marginBottom: 4,
    },
    qrSubDesc: {
        fontSize: 14, color: '#6B7280', marginBottom: 24,
    },
    activeQRBox: {
        alignItems: 'center',
    },
    qrCodeWrapper: {
        padding: 16, backgroundColor: '#fff', borderRadius: 12,
        borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 20,
    },
    waitRow: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF7ED',
        paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20,
    },
    waitText: {
        marginLeft: 8, fontSize: 14, fontWeight: '600', color: '#EA580C',
    },
    btnPrimary: {
        backgroundColor: '#4F46E5', paddingVertical: 14, borderRadius: 8, alignItems: 'center',
    },
    btnGreen: {
        flexDirection: 'row', justifyContent: 'center', backgroundColor: '#16A34A',
        paddingVertical: 16, borderRadius: 12, alignItems: 'center',
    },
    btnPrimaryText: {
        color: '#fff', fontSize: 15, fontWeight: '700',
    },
    noOtpText: {
        textAlign: 'center', color: '#9CA3AF', fontSize: 13, marginTop: 16,
    }
});

export default DeliveryConfirmationScreen;
