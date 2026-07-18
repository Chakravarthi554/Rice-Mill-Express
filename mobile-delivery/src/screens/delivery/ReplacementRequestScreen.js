import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Alert, TouchableOpacity, SafeAreaView, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { apiService } from '../../services/api';

const ReplacementRequestScreen = ({ route, navigation }) => {
    const { orderId, orderDetails } = route.params;
    const [photoUri, setPhotoUri] = useState(null);
    const [description, setDescription] = useState('');
    const [selectedReason, setSelectedReason] = useState('damaged_product');
    const [loading, setLoading] = useState(false);

    const REASONS = [
        { label: 'Damaged Product', value: 'damaged_product' },
        { label: 'Wrong Product', value: 'wrong_product' },
        { label: 'Quality Issue', value: 'quality_issue' },
        { label: 'Incomplete Order', value: 'incomplete_order' },
        { label: 'Other', value: 'other' },
    ];

    const handleCapturePhoto = async () => {
        try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Required', 'Camera permission is required');
                return;
            }
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [4, 3], quality: 0.8,
            });
            if (!result.canceled && result.assets[0]) {
                setPhotoUri(result.assets[0].uri);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to capture photo');
        }
    };

    const handleSelectFromGallery = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Required', 'Gallery permission is required');
                return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [4, 3], quality: 0.8,
            });
            if (!result.canceled && result.assets[0]) {
                setPhotoUri(result.assets[0].uri);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to select photo');
        }
    };

    const handleSubmitRequest = async () => {
        if (!photoUri) {
            Alert.alert('Photo Required', 'Please capture or select a photo of the damaged item');
            return;
        }
        if (!description.trim()) {
            Alert.alert('Description Required', 'Please provide details about the issue');
            return;
        }

        try {
            setLoading(true);
            const formData = new FormData();
            formData.append('replacementPhoto', { uri: photoUri, name: 'replacement-proof.jpg', type: 'image/jpeg' });
            formData.append('reason', selectedReason);
            formData.append('description', description.trim());

            await (apiService.requestReplacement?.(orderId, formData) || fetch(`${apiService.baseURL}/api/delivery-partners/orders/${orderId}/replacement`, {
                method: 'POST', headers: { 'Authorization': `Bearer ${apiService.token}` }, body: formData,
            }));

            Alert.alert('Success', 'Replacement request submitted successfully', [{ text: 'OK', onPress: () => navigation.goBack() }]);
        } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to submit replacement request');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Report Issue</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 100 }}>
                {/* Order Info */}
                <View style={styles.infoCard}>
                    <Text style={styles.orderLabel}>ORDER ID</Text>
                    <Text style={styles.orderNumber}>#{orderId.substring(18).toUpperCase()}</Text>
                    {orderDetails && (
                        <>
                            <Text style={styles.customerName}>{orderDetails.shippingAddress?.name}</Text>
                            <Text style={styles.amount}>₹{orderDetails.totalAmount}</Text>
                        </>
                    )}
                </View>

                {/* Instructions */}
                <View style={styles.instructionBox}>
                    <Ionicons name="information-circle-outline" size={24} color="#EA580C" />
                    <Text style={styles.instructionText}>
                        Select a reason, describe the issue, and provide photo proof.
                    </Text>
                </View>

                {/* Reason Selection */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Why are you reporting this?</Text>
                    <View style={styles.chipContainer}>
                        {REASONS.map((item) => (
                            <TouchableOpacity
                                key={item.value}
                                style={[styles.chip, selectedReason === item.value && styles.chipSelected]}
                                onPress={() => setSelectedReason(item.value)}>
                                <Text style={[styles.chipText, selectedReason === item.value && styles.chipTextSelected]}>
                                    {item.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Photo Capture */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Photo Evidence</Text>
                    {photoUri ? (
                        <View style={styles.previewContainer}>
                            <Image source={{ uri: photoUri }} style={styles.previewImage} />
                            <TouchableOpacity onPress={() => setPhotoUri(null)} style={styles.removePhotoBtn}>
                                <Ionicons name="close-circle" size={24} color="#EF4444" />
                                <Text style={styles.removePhotoTxt}>Remove</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.photoButtonsContainer}>
                            <TouchableOpacity style={styles.photoButton} onPress={handleCapturePhoto}>
                                <Ionicons name="camera" size={32} color="#16A34A" />
                                <Text style={styles.photoButtonText}>Camera</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.photoButton} onPress={handleSelectFromGallery}>
                                <Ionicons name="images" size={32} color="#4F46E5" />
                                <Text style={styles.photoButtonText}>Gallery</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* Description Input */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Detailed Description</Text>
                    <TextInput
                        style={styles.reasonInput}
                        placeholder="Describe the issue in detail..."
                        placeholderTextColor="#9CA3AF"
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                    />
                    <Text style={styles.characterCount}>{description.length}/500 chars</Text>
                </View>
            </ScrollView>

            <View style={styles.bottomBar}>
                <TouchableOpacity 
                    style={[styles.submitButton, (loading || !photoUri || !description.trim()) && { opacity: 0.5 }]} 
                    onPress={handleSubmitRequest}
                    disabled={loading || !photoUri || !description.trim()}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Submit Request</Text>}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
    content: { padding: 16 },
    infoCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#F3F4F6' },
    orderLabel: { fontSize: 11, color: '#6B7280', fontWeight: '600', marginBottom: 4 },
    orderNumber: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 8 },
    customerName: { fontSize: 14, color: '#4B5563' },
    amount: { fontSize: 16, fontWeight: '700', color: '#16A34A', marginTop: 4 },
    instructionBox: { flexDirection: 'row', backgroundColor: '#FFF7ED', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: '#FFEDD5' },
    instructionText: { flex: 1, fontSize: 14, color: '#9A3412', lineHeight: 20, marginLeft: 12 },
    card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#F3F4F6' },
    cardTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 12 },
    chipContainer: { flexDirection: 'row', flexWrap: 'wrap' },
    chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: '#F3F4F6', marginRight: 8, marginBottom: 8, borderWidth: 1, borderColor: '#E5E7EB' },
    chipSelected: { backgroundColor: '#FEFCE8', borderColor: '#EAB308' },
    chipText: { color: '#4B5563', fontSize: 14, fontWeight: '500' },
    chipTextSelected: { color: '#CA8A04', fontWeight: '700' },
    photoButtonsContainer: { flexDirection: 'row', gap: 12 },
    photoButton: { flex: 1, alignItems: 'center', padding: 20, backgroundColor: '#F9FAFB', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', borderStyle: 'dashed' },
    photoButtonText: { marginTop: 8, fontSize: 14, color: '#4B5563', fontWeight: '500' },
    previewContainer: { alignItems: 'center' },
    previewImage: { width: '100%', height: 200, borderRadius: 8, marginBottom: 12 },
    removePhotoBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20 },
    removePhotoTxt: { color: '#EF4444', fontWeight: '600', marginLeft: 4 },
    reasonInput: { backgroundColor: '#F9FAFB', borderRadius: 8, padding: 12, fontSize: 14, color: '#111827', borderWidth: 1, borderColor: '#E5E7EB', minHeight: 100 },
    characterCount: { fontSize: 12, color: '#9CA3AF', textAlign: 'right', marginTop: 8 },
    bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', padding: 16, paddingBottom: 24, borderTopWidth: 1, borderTopColor: '#F3F4F6', elevation: 10 },
    submitButton: { backgroundColor: '#EA580C', paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
    submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' }
});

export default ReplacementRequestScreen;
