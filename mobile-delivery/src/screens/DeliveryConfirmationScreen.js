import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, Alert, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../services/api';

const DeliveryConfirmationScreen = ({ route, navigation }) => {
    const { orderId } = route.params;
    const [photo, setPhoto] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    const PRIMARY_ACCENT = '#FC8019'; // Swiggy Orange

    useEffect(() => {
        fetchOrderDetails();
        requestPermissions();
    }, []);

    const fetchOrderDetails = async () => {
        try {
            setLoading(true);
            const response = await apiService.getDeliveryOrderById(orderId);
            setOrder(response.data?.order || response.data);
        } catch (error) {
            Alert.alert('Error', 'Failed to fetch order details');
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

    const requestPermissions = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'We need camera permission to take delivery proof.');
        }
    };

    const takePhoto = async () => {
        try {
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 0.5,
                allowsEditing: true,
                aspect: [4, 3],
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                setPhoto(result.assets[0]);
            }
        } catch (error) {
            console.error("Camera Error: ", error);
            Alert.alert('Error', 'Failed to open camera');
        }
    };

    const confirmDelivery = async () => {
        if (!photo) {
            Alert.alert('Error', 'Please take a photo as proof of delivery');
            return;
        }

        try {
            setUploading(true);

            // Create form data for the photo
            const formData = new FormData();
            formData.append('deliveryPhoto', {
                uri: photo.uri,
                type: 'image/jpeg',
                name: `delivery_${orderId}.jpg`,
            });
            formData.append('codCollected', order.totalPrice.toString());

            // Post to backend
            await apiService.uploadDeliveryPhoto(orderId, formData);
            
            Alert.alert(
                'Delivery Successful! 🎉',
                `You have successfully collected ₹${order.totalPrice}.`,
                [{ text: 'Great!', onPress: () => navigation.navigate('Dashboard') }]
            );
        } catch (error) {
            console.error('Delivery Confirm Error:', error);
            Alert.alert('Error', 'Failed to confirm delivery. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    if (loading || !order) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={PRIMARY_ACCENT} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={28} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Confirm Delivery</Text>
                <View style={{ width: 28 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                
                {/* Cash Collection Card */}
                <View style={styles.cashCard}>
                    <Ionicons name="cash" size={48} color={PRIMARY_ACCENT} />
                    <Text style={styles.cashTitle}>Collect Cash on Delivery</Text>
                    <Text style={styles.cashAmount}>₹{order.totalPrice}</Text>
                    <Text style={styles.cashWarning}>Make sure to collect the exact amount before handing over the package.</Text>
                </View>

                {/* Photo Proof Section */}
                <View style={styles.photoSection}>
                    <Text style={styles.photoSectionTitle}>Delivery Proof</Text>
                    
                    {photo ? (
                        <View style={styles.photoPreviewContainer}>
                            <Image source={{ uri: photo.uri }} style={styles.previewImage} />
                            <TouchableOpacity style={styles.retakeBtn} onPress={takePhoto}>
                                <Ionicons name="refresh" size={20} color="#FFF" />
                                <Text style={styles.retakeText}>Retake Photo</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity style={styles.takePhotoBtn} onPress={takePhoto}>
                            <Ionicons name="camera" size={48} color="#9CA3AF" />
                            <Text style={styles.takePhotoText}>Tap to take a photo of the package at the customer's door</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </ScrollView>

            <View style={styles.bottomSafeArea}>
                <TouchableOpacity 
                    style={[
                        styles.massiveCompleteBtn, 
                        (!photo || uploading) ? { backgroundColor: '#374151' } : { backgroundColor: '#16A34A' }
                    ]}
                    onPress={confirmDelivery}
                    disabled={!photo || uploading}
                >
                    {uploading ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <>
                            <Text style={styles.massiveCompleteText}>CONFIRM DELIVERY</Text>
                            <Ionicons name="checkmark-circle" size={32} color="#FFF" />
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#111827' },
    loadingContainer: { flex: 1, backgroundColor: '#111827', justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#1F2937' },
    headerTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
    content: { padding: 20 },
    cashCard: { backgroundColor: '#1F2937', padding: 32, borderRadius: 16, alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: '#374151' },
    cashTitle: { color: '#D1D5DB', fontSize: 18, marginTop: 16, marginBottom: 8 },
    cashAmount: { color: '#FFF', fontSize: 48, fontWeight: '900', marginBottom: 16 },
    cashWarning: { color: '#F87171', fontSize: 14, textAlign: 'center', paddingHorizontal: 20 },
    photoSection: { marginBottom: 40 },
    photoSectionTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
    takePhotoBtn: { height: 200, backgroundColor: '#1F2937', borderRadius: 16, borderWidth: 2, borderColor: '#374151', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', padding: 20 },
    takePhotoText: { color: '#9CA3AF', fontSize: 16, textAlign: 'center', marginTop: 16 },
    photoPreviewContainer: { borderRadius: 16, overflow: 'hidden', position: 'relative' },
    previewImage: { width: '100%', height: 300, resizeMode: 'cover' },
    retakeBtn: { position: 'absolute', bottom: 16, right: 16, backgroundColor: 'rgba(0,0,0,0.7)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
    retakeText: { color: '#FFF', marginLeft: 8, fontWeight: 'bold' },
    bottomSafeArea: { padding: 20, backgroundColor: '#1F2937', borderTopWidth: 1, borderTopColor: '#374151' },
    massiveCompleteBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 72, borderRadius: 16, paddingHorizontal: 24 },
    massiveCompleteText: { color: '#FFF', fontSize: 18, fontWeight: '900', letterSpacing: 1 }
});

export default DeliveryConfirmationScreen;
