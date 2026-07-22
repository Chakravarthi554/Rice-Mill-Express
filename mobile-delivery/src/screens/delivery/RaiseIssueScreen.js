import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
    SafeAreaView, Alert, ActivityIndicator, Image
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { apiService } from '../../services/api';

const ISSUE_TYPES = [
    { key: 'wrong_address', label: 'Wrong Address', icon: 'map-marker-remove', desc: 'Customer address is incorrect or incomplete' },
    { key: 'customer_unavailable', label: 'Customer Unavailable', icon: 'account-off', desc: 'Customer is not reachable or at given location' },
    { key: 'package_damaged', label: 'Package Damaged', icon: 'package-variant-closed-remove', desc: 'Product packaging is damaged or leaking' },
    { key: 'wrong_items', label: 'Wrong Items', icon: 'swap-horizontal-bold', desc: 'Items don\'t match the order' },
    { key: 'safety_concern', label: 'Safety Concern', icon: 'shield-alert', desc: 'Feel unsafe at delivery location' },
    { key: 'vehicle_issue', label: 'Vehicle Breakdown', icon: 'motorbike', desc: 'Vehicle has broken down during delivery' },
    { key: 'other', label: 'Other Issue', icon: 'help-circle', desc: 'Something else not listed above' },
];

const RaiseIssueScreen = ({ route, navigation }) => {
    const { orderId } = route?.params || {};
    const [selectedType, setSelectedType] = useState(null);
    const [description, setDescription] = useState('');
    const [photo, setPhoto] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const PRIMARY_ACCENT = '#FC8019';

    const takePhoto = async () => {
        try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission needed', 'Camera permission is required to take photos.');
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 0.5,
                allowsEditing: true,
                aspect: [4, 3],
            });

            if (!result.canceled && result.assets?.length > 0) {
                setPhoto(result.assets[0]);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to open camera');
        }
    };

    const pickFromGallery = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 0.5,
                allowsEditing: true,
                aspect: [4, 3],
            });

            if (!result.canceled && result.assets?.length > 0) {
                setPhoto(result.assets[0]);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to open gallery');
        }
    };

    const handleSubmit = async () => {
        if (!selectedType) {
            Alert.alert('Required', 'Please select an issue type.');
            return;
        }
        if (!description.trim() && selectedType === 'other') {
            Alert.alert('Required', 'Please describe the issue.');
            return;
        }

        try {
            setSubmitting(true);

            const issueData = {
                issueType: selectedType,
                description: description.trim() || ISSUE_TYPES.find(t => t.key === selectedType)?.desc || '',
            };

            await apiService.raiseIssue(orderId, issueData);

            Alert.alert(
                'Issue Reported ✅',
                'Support has been notified. They will contact you shortly.',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
            );
        } catch (error) {
            console.error('Raise issue error:', error);
            Alert.alert('Error', 'Could not submit issue. Please try again or call support directly.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={28} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Report an Issue</Text>
                <View style={{ width: 28 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {orderId && (
                    <View style={styles.orderBadge}>
                        <Ionicons name="receipt" size={18} color={PRIMARY_ACCENT} />
                        <Text style={styles.orderBadgeText}>Order #{orderId.substring(18).toUpperCase()}</Text>
                    </View>
                )}

                <Text style={styles.sectionTitle}>What's the problem?</Text>

                {/* Issue Type Selection */}
                <View style={styles.issueGrid}>
                    {ISSUE_TYPES.map((type) => {
                        const isSelected = selectedType === type.key;
                        return (
                            <TouchableOpacity
                                key={type.key}
                                style={[styles.issueCard, isSelected && styles.issueCardSelected]}
                                onPress={() => setSelectedType(type.key)}
                            >
                                <View style={[styles.issueIconWrap, isSelected && styles.issueIconWrapSelected]}>
                                    <MaterialCommunityIcons 
                                        name={type.icon} 
                                        size={28} 
                                        color={isSelected ? '#FFF' : '#9CA3AF'} 
                                    />
                                </View>
                                <Text style={[styles.issueLabel, isSelected && styles.issueLabelSelected]}>{type.label}</Text>
                                <Text style={styles.issueDesc} numberOfLines={2}>{type.desc}</Text>
                                {isSelected && (
                                    <View style={styles.checkMark}>
                                        <Ionicons name="checkmark-circle" size={22} color="#16A34A" />
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Description */}
                <Text style={styles.sectionTitle}>Additional Details</Text>
                <TextInput
                    style={styles.descInput}
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Describe the issue in detail (optional)..."
                    placeholderTextColor="#6B7280"
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    maxLength={500}
                />
                <Text style={styles.charCount}>{description.length}/500</Text>

                {/* Photo Attachment */}
                <Text style={styles.sectionTitle}>Attach Photo (Optional)</Text>
                {photo ? (
                    <View style={styles.photoPreview}>
                        <Image source={{ uri: photo.uri }} style={styles.previewImage} />
                        <TouchableOpacity style={styles.removePhotoBtn} onPress={() => setPhoto(null)}>
                            <Ionicons name="close-circle" size={28} color="#EF4444" />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.photoActions}>
                        <TouchableOpacity style={styles.photoBtn} onPress={takePhoto}>
                            <Ionicons name="camera" size={28} color="#9CA3AF" />
                            <Text style={styles.photoBtnText}>Take Photo</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.photoBtn} onPress={pickFromGallery}>
                            <Ionicons name="images" size={28} color="#9CA3AF" />
                            <Text style={styles.photoBtnText}>From Gallery</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Emergency Note */}
                <View style={styles.emergencyNote}>
                    <Ionicons name="information-circle" size={20} color="#60A5FA" />
                    <Text style={styles.emergencyNoteText}>
                        For emergencies, use the SOS button on the dashboard. It will immediately notify the support team.
                    </Text>
                </View>
            </ScrollView>

            {/* Submit Button */}
            <View style={styles.bottomBar}>
                <TouchableOpacity
                    style={[styles.submitBtn, (!selectedType || submitting) && styles.submitBtnDisabled]}
                    onPress={handleSubmit}
                    disabled={!selectedType || submitting}
                >
                    {submitting ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <>
                            <Text style={styles.submitBtnText}>SUBMIT ISSUE</Text>
                            <Ionicons name="paper-plane" size={24} color="#FFF" />
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#111827' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#1F2937' },
    headerTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
    content: { padding: 20, paddingBottom: 40 },

    orderBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1F2937', alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginBottom: 20, borderWidth: 1, borderColor: '#374151' },
    orderBadgeText: { color: '#D1D5DB', fontSize: 14, fontWeight: '600', marginLeft: 8 },

    sectionTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginBottom: 16, marginTop: 4 },

    issueGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
    issueCard: {
        width: '47%', backgroundColor: '#1F2937', borderRadius: 16, padding: 16,
        borderWidth: 1, borderColor: '#374151', position: 'relative',
    },
    issueCardSelected: { borderColor: '#FC8019', backgroundColor: '#1a1a2e' },
    issueIconWrap: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#374151', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    issueIconWrapSelected: { backgroundColor: '#FC8019' },
    issueLabel: { color: '#D1D5DB', fontSize: 14, fontWeight: 'bold', marginBottom: 4 },
    issueLabelSelected: { color: '#FFF' },
    issueDesc: { color: '#6B7280', fontSize: 11, lineHeight: 16 },
    checkMark: { position: 'absolute', top: 10, right: 10 },

    descInput: {
        backgroundColor: '#1F2937', color: '#FFF', borderRadius: 12, padding: 16,
        fontSize: 15, minHeight: 100, borderWidth: 1, borderColor: '#374151',
        marginBottom: 4,
    },
    charCount: { color: '#6B7280', fontSize: 12, textAlign: 'right', marginBottom: 20 },

    photoActions: { flexDirection: 'row', gap: 12, marginBottom: 24 },
    photoBtn: { flex: 1, height: 100, backgroundColor: '#1F2937', borderRadius: 12, borderWidth: 1, borderColor: '#374151', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' },
    photoBtnText: { color: '#9CA3AF', fontSize: 13, marginTop: 8 },
    photoPreview: { borderRadius: 16, overflow: 'hidden', marginBottom: 24, position: 'relative' },
    previewImage: { width: '100%', height: 200, resizeMode: 'cover' },
    removePhotoBtn: { position: 'absolute', top: 10, right: 10 },

    emergencyNote: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#1e293b', borderRadius: 12, padding: 14, gap: 10, marginBottom: 20 },
    emergencyNoteText: { color: '#94A3B8', fontSize: 13, flex: 1, lineHeight: 18 },

    bottomBar: { padding: 20, backgroundColor: '#1F2937', borderTopWidth: 1, borderTopColor: '#374151' },
    submitBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#EF4444', height: 60, borderRadius: 16, paddingHorizontal: 24 },
    submitBtnDisabled: { backgroundColor: '#374151' },
    submitBtnText: { color: '#FFF', fontSize: 18, fontWeight: '900', letterSpacing: 1 },
});

export default RaiseIssueScreen;
