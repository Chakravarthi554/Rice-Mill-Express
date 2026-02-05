import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    Alert,
    TouchableOpacity,
} from 'react-native';
import { Card, Button, TextInput, ActivityIndicator } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
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
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                setPhotoUri(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Error capturing photo:', error);
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
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                setPhotoUri(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Error selecting photo:', error);
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
            formData.append('replacementPhoto', {
                uri: photoUri,
                name: 'replacement-proof.jpg',
                type: 'image/jpeg',
            });
            formData.append('reason', selectedReason);
            formData.append('description', description.trim());

            // Check if the API method exists, if not use a generic approach
            const response = await apiService.requestReplacement?.(orderId, formData) ||
                await fetch(`${apiService.baseURL}/api/delivery-partners/orders/${orderId}/replacement`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${apiService.token}`,
                    },
                    body: formData,
                });

            Alert.alert(
                'Success',
                'Replacement request submitted successfully',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
            );
        } catch (error) {
            console.error('Error submitting replacement request:', error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to submit replacement request');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            {/* Order Info */}
            <Card style={styles.card}>
                <Card.Content>
                    <Text style={styles.orderNumber}>
                        Order #{orderId.substring(18).toUpperCase()}
                    </Text>
                    {orderDetails && (
                        <>
                            <Text style={styles.customerName}>{orderDetails.shippingAddress?.name}</Text>
                            <Text style={styles.amount}>₹{orderDetails.totalAmount}</Text>
                        </>
                    )}
                </Card.Content>
            </Card>

            {/* Instructions */}
            <Card style={styles.card}>
                <Card.Content>
                    <View style={styles.instructionHeader}>
                        <MaterialIcons name="info" size={24} color="#2196F3" />
                        <Text style={styles.instructionTitle}>Replacement Request</Text>
                    </View>
                    <Text style={styles.instructionText}>
                        Please select a reason, describe the issue, and provide photo proof.
                    </Text>
                </Card.Content>
            </Card>

            {/* Reason Selection */}
            <Card style={styles.card}>
                <Card.Title title="Select Reason" titleStyle={styles.cardTitle} />
                <Card.Content>
                    <View style={styles.chipContainer}>
                        {REASONS.map((item) => (
                            <TouchableOpacity
                                key={item.value}
                                style={[
                                    styles.chip,
                                    selectedReason === item.value && styles.chipSelected
                                ]}
                                onPress={() => setSelectedReason(item.value)}
                            >
                                <Text style={[
                                    styles.chipText,
                                    selectedReason === item.value && styles.chipTextSelected
                                ]}>
                                    {item.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </Card.Content>
            </Card>

            {/* Photo Capture */}
            <Card style={styles.card}>
                <Card.Title title="Photo Evidence" titleStyle={styles.cardTitle} />
                <Card.Content>
                    {photoUri ? (
                        <View>
                            <Image source={{ uri: photoUri }} style={styles.previewImage} />
                            <Button
                                mode="outlined"
                                onPress={() => setPhotoUri(null)}
                                style={styles.retakeButton}
                                icon="close"
                            >
                                Remove Photo
                            </Button>
                        </View>
                    ) : (
                        <View style={styles.photoButtonsContainer}>
                            <TouchableOpacity
                                style={styles.photoButton}
                                onPress={handleCapturePhoto}
                            >
                                <MaterialIcons name="camera-alt" size={40} color="#4CAF50" />
                                <Text style={styles.photoButtonText}>Take Photo</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.photoButton}
                                onPress={handleSelectFromGallery}
                            >
                                <MaterialIcons name="photo-library" size={40} color="#2196F3" />
                                <Text style={styles.photoButtonText}>Gallery</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </Card.Content>
            </Card>

            {/* Description Input */}
            <Card style={styles.card}>
                <Card.Title title="Detailed Description" titleStyle={styles.cardTitle} />
                <Card.Content>
                    <TextInput
                        mode="outlined"
                        placeholder="Describe the issue (e.g., damaged packaging, wrong item, expired product)"
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        numberOfLines={4}
                        style={styles.reasonInput}
                    />
                    <Text style={styles.characterCount}>{description.length}/500 chars</Text>
                </Card.Content>
            </Card>

            {/* Submit Button */}
            <View style={styles.submitContainer}>
                <Button
                    mode="contained"
                    onPress={handleSubmitRequest}
                    loading={loading}
                    disabled={loading || !photoUri || !description.trim()}
                    style={styles.submitButton}
                    icon="send"
                >
                    Submit Replacement Request
                </Button>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F7F9FC',
    },
    card: {
        margin: 16,
        marginBottom: 8,
        elevation: 2,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    orderNumber: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    customerName: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    amount: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#4CAF50',
        marginTop: 4,
    },
    instructionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    instructionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginLeft: 8,
    },
    instructionText: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    photoButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 16,
    },
    photoButton: {
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#E0E0E0',
        borderStyle: 'dashed',
        width: '45%',
    },
    photoButtonText: {
        marginTop: 8,
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
    },
    previewImage: {
        width: '100%',
        height: 200,
        borderRadius: 8,
        marginBottom: 12,
    },
    retakeButton: {
        marginTop: 8,
    },
    reasonInput: {
        backgroundColor: '#fff',
        fontSize: 14,
    },
    characterCount: {
        fontSize: 12,
        color: '#999',
        textAlign: 'right',
        marginTop: 4,
    },
    submitContainer: {
        padding: 16,
        paddingBottom: 32,
    },
    submitButton: {
        paddingVertical: 8,
        backgroundColor: '#FF9800',
    },
    chipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginVertical: 8,
    },
    chip: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F5F5F5',
        marginRight: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    chipSelected: {
        backgroundColor: '#FFF3E0',
        borderColor: '#FF9800',
    },
    chipText: {
        color: '#666',
        fontSize: 14,
    },
    chipTextSelected: {
        color: '#E65100',
        fontWeight: 'bold',
    },
});

export default ReplacementRequestScreen;
