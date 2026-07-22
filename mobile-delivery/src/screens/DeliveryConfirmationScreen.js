import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, Alert, TouchableOpacity, SafeAreaView, ActivityIndicator, TextInput, Animated, Vibration } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { apiService } from '../services/api';

const DeliveryConfirmationScreen = ({ route, navigation }) => {
    const { orderId } = route.params;
    const [photo, setPhoto] = useState(null);
    const [otp, setOtp] = useState(['', '', '', '']);
    const [otpVerified, setOtpVerified] = useState(false);
    const [otpVerifying, setOtpVerifying] = useState(false);
    const [otpError, setOtpError] = useState('');
    const [uploading, setUploading] = useState(false);
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    const otpRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];
    const shakeAnim = useRef(new Animated.Value(0)).current;

    const PRIMARY_ACCENT = '#FC8019';
    const GREEN = '#16A34A';

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

    const handleOtpChange = (text, index) => {
        const newOtp = [...otp];
        // Allow only single digit
        newOtp[index] = text.replace(/[^0-9]/g, '').slice(-1);
        setOtp(newOtp);
        setOtpError('');

        // Auto-advance to next input
        if (text && index < 3) {
            otpRefs[index + 1].current?.focus();
        }

        // Auto-verify when all 4 digits entered
        const fullOtp = newOtp.join('');
        if (fullOtp.length === 4) {
            verifyOtp(fullOtp);
        }
    };

    const handleOtpKeyPress = (e, index) => {
        if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
            otpRefs[index - 1].current?.focus();
        }
    };

    const triggerShake = () => {
        Vibration.vibrate(200);
        Animated.sequence([
            Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]).start();
    };

    const verifyOtp = async (otpCode) => {
        try {
            setOtpVerifying(true);
            setOtpError('');
            await apiService.verifyDeliveryOtp(orderId, otpCode);
            setOtpVerified(true);
        } catch (error) {
            const msg = error?.response?.data?.message || 'Invalid OTP. Please try again.';
            setOtpError(msg);
            triggerShake();
            setOtp(['', '', '', '']);
            setTimeout(() => otpRefs[0].current?.focus(), 300);
        } finally {
            setOtpVerifying(false);
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

            const formData = new FormData();
            formData.append('deliveryPhoto', {
                uri: photo.uri,
                type: 'image/jpeg',
                name: `delivery_${orderId}.jpg`,
            });
            formData.append('codCollected', order.totalPrice.toString());

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
                
                {/* Step Indicator */}
                <View style={styles.stepIndicator}>
                    <View style={[styles.step, styles.stepActive]}>
                        <View style={[styles.stepCircle, otpVerified ? styles.stepCircleCompleted : styles.stepCircleActive]}>
                            {otpVerified ? <Ionicons name="checkmark" size={18} color="#FFF" /> : <Text style={styles.stepCircleText}>1</Text>}
                        </View>
                        <Text style={[styles.stepLabel, styles.stepLabelActive]}>Verify OTP</Text>
                    </View>
                    <View style={[styles.stepLine, otpVerified && styles.stepLineActive]} />
                    <View style={styles.step}>
                        <View style={[styles.stepCircle, otpVerified ? styles.stepCircleActive : styles.stepCircleInactive]}>
                            {photo ? <Ionicons name="checkmark" size={18} color="#FFF" /> : <Text style={[styles.stepCircleText, !otpVerified && { color: '#6B7280' }]}>2</Text>}
                        </View>
                        <Text style={[styles.stepLabel, otpVerified && styles.stepLabelActive]}>Take Photo</Text>
                    </View>
                    <View style={[styles.stepLine, photo && styles.stepLineActive]} />
                    <View style={styles.step}>
                        <View style={[styles.stepCircle, photo ? styles.stepCircleActive : styles.stepCircleInactive]}>
                            <Text style={[styles.stepCircleText, !photo && { color: '#6B7280' }]}>3</Text>
                        </View>
                        <Text style={[styles.stepLabel, photo && styles.stepLabelActive]}>Confirm</Text>
                    </View>
                </View>

                {/* Cash Collection Card */}
                <View style={styles.cashCard}>
                    <Ionicons name="cash" size={40} color={PRIMARY_ACCENT} />
                    <Text style={styles.cashTitle}>Collect Cash on Delivery</Text>
                    <Text style={styles.cashAmount}>₹{order.totalPrice}</Text>
                    <Text style={styles.cashWarning}>Collect the exact amount before handing over the package.</Text>
                </View>

                {/* STEP 1: OTP Verification */}
                {!otpVerified ? (
                    <View style={styles.otpSection}>
                        <View style={styles.otpHeaderRow}>
                            <MaterialCommunityIcons name="shield-lock" size={28} color={PRIMARY_ACCENT} />
                            <Text style={styles.otpTitle}>Enter Customer OTP</Text>
                        </View>
                        <Text style={styles.otpSubtext}>
                            Ask the customer for the 4-digit code sent to their phone.
                        </Text>

                        <Animated.View style={[styles.otpInputRow, { transform: [{ translateX: shakeAnim }] }]}>
                            {otp.map((digit, i) => (
                                <TextInput
                                    key={i}
                                    ref={otpRefs[i]}
                                    style={[
                                        styles.otpInput,
                                        digit ? styles.otpInputFilled : {},
                                        otpError ? styles.otpInputError : {},
                                    ]}
                                    value={digit}
                                    onChangeText={(text) => handleOtpChange(text, i)}
                                    onKeyPress={(e) => handleOtpKeyPress(e, i)}
                                    keyboardType="number-pad"
                                    maxLength={1}
                                    textContentType="oneTimeCode"
                                    selectionColor={PRIMARY_ACCENT}
                                />
                            ))}
                        </Animated.View>

                        {otpVerifying && (
                            <View style={styles.otpVerifyingRow}>
                                <ActivityIndicator size="small" color={PRIMARY_ACCENT} />
                                <Text style={styles.otpVerifyingText}>Verifying...</Text>
                            </View>
                        )}

                        {otpError ? (
                            <View style={styles.otpErrorRow}>
                                <Ionicons name="alert-circle" size={18} color="#EF4444" />
                                <Text style={styles.otpErrorText}>{otpError}</Text>
                            </View>
                        ) : null}
                    </View>
                ) : (
                    /* OTP Verified Success */
                    <View style={styles.otpSuccessCard}>
                        <Ionicons name="checkmark-circle" size={48} color={GREEN} />
                        <Text style={styles.otpSuccessText}>OTP Verified Successfully!</Text>
                    </View>
                )}

                {/* STEP 2: Photo Proof Section (only after OTP verified) */}
                {otpVerified && (
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
                )}
            </ScrollView>

            {/* BOTTOM ACTION BUTTON */}
            {otpVerified && (
                <View style={styles.bottomSafeArea}>
                    <TouchableOpacity 
                        style={[
                            styles.massiveCompleteBtn, 
                            (!photo || uploading) ? { backgroundColor: '#374151' } : { backgroundColor: GREEN }
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
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#111827' },
    loadingContainer: { flex: 1, backgroundColor: '#111827', justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#1F2937' },
    headerTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
    content: { padding: 20, paddingBottom: 40 },
    
    // Step indicator
    stepIndicator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 24, paddingHorizontal: 10 },
    step: { alignItems: 'center' },
    stepCircle: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
    stepCircleActive: { backgroundColor: '#FC8019' },
    stepCircleCompleted: { backgroundColor: '#16A34A' },
    stepCircleInactive: { backgroundColor: '#374151' },
    stepCircleText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
    stepLine: { width: 40, height: 3, backgroundColor: '#374151', marginHorizontal: 4, marginBottom: 20 },
    stepLineActive: { backgroundColor: '#16A34A' },
    stepLabel: { color: '#6B7280', fontSize: 11, fontWeight: '600' },
    stepLabelActive: { color: '#FFF' },
    
    // Cash card
    cashCard: { backgroundColor: '#1F2937', padding: 24, borderRadius: 16, alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: '#374151' },
    cashTitle: { color: '#D1D5DB', fontSize: 16, marginTop: 12, marginBottom: 8 },
    cashAmount: { color: '#FFF', fontSize: 44, fontWeight: '900', marginBottom: 12 },
    cashWarning: { color: '#F87171', fontSize: 13, textAlign: 'center', paddingHorizontal: 20 },
    
    // OTP
    otpSection: { backgroundColor: '#1F2937', borderRadius: 16, padding: 24, marginBottom: 24, borderWidth: 1, borderColor: '#374151' },
    otpHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    otpTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold', marginLeft: 12 },
    otpSubtext: { color: '#9CA3AF', fontSize: 14, marginBottom: 24, lineHeight: 20 },
    otpInputRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 16 },
    otpInput: {
        width: 60, height: 68, borderRadius: 12, borderWidth: 2, borderColor: '#374151',
        backgroundColor: '#111827', color: '#FFF', fontSize: 28, fontWeight: '900',
        textAlign: 'center',
    },
    otpInputFilled: { borderColor: '#FC8019', backgroundColor: '#1a1a2e' },
    otpInputError: { borderColor: '#EF4444' },
    otpVerifyingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8 },
    otpVerifyingText: { color: '#FC8019', marginLeft: 8, fontSize: 14, fontWeight: '600' },
    otpErrorRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8 },
    otpErrorText: { color: '#EF4444', marginLeft: 6, fontSize: 13, fontWeight: '500' },
    
    // OTP success
    otpSuccessCard: { backgroundColor: '#064e3b', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: '#16A34A' },
    otpSuccessText: { color: '#34D399', fontSize: 18, fontWeight: 'bold', marginTop: 8 },
    
    // Photo
    photoSection: { marginBottom: 40 },
    photoSectionTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
    takePhotoBtn: { height: 200, backgroundColor: '#1F2937', borderRadius: 16, borderWidth: 2, borderColor: '#374151', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', padding: 20 },
    takePhotoText: { color: '#9CA3AF', fontSize: 16, textAlign: 'center', marginTop: 16 },
    photoPreviewContainer: { borderRadius: 16, overflow: 'hidden', position: 'relative' },
    previewImage: { width: '100%', height: 300, resizeMode: 'cover' },
    retakeBtn: { position: 'absolute', bottom: 16, right: 16, backgroundColor: 'rgba(0,0,0,0.7)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
    retakeText: { color: '#FFF', marginLeft: 8, fontWeight: 'bold' },
    
    // Bottom
    bottomSafeArea: { padding: 20, backgroundColor: '#1F2937', borderTopWidth: 1, borderTopColor: '#374151' },
    massiveCompleteBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 72, borderRadius: 16, paddingHorizontal: 24 },
    massiveCompleteText: { color: '#FFF', fontSize: 18, fontWeight: '900', letterSpacing: 1 }
});

export default DeliveryConfirmationScreen;
