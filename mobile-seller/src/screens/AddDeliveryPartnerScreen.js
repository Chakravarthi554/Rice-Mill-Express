import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, Image, Platform } from 'react-native';
import { Button, TextInput, Card, HelperText } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import api from '../services/api';

const AddDeliveryPartnerScreen = ({ navigation }) => {
    const [formData, setFormData] = useState({
        name: '', email: '', phone: '', password: '',
        vehicle_type: '', vehicle_number: '', license_number: ''
    });
    const [loading, setLoading] = useState(false);
    
    // Images state
    const [profileImage, setProfileImage] = useState(null);
    const [licenseImage, setLicenseImage] = useState(null);
    const [rcImage, setRcImage] = useState(null);

    const handleInputChange = (name, value) => {
        setFormData({ ...formData, [name]: value });
    };

    const pickImage = async (setImageFunc) => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Please allow photo access in settings.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 0.7,
        });
        if (!result.canceled && result.assets) {
            setImageFunc(result.assets[0].uri);
        }
    };

    const validateEmail = (email) => {
        return String(email).toLowerCase().match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
    };

    const handleSubmit = async () => {
        const { name, email, phone, password, vehicle_type, vehicle_number, license_number } = formData;

        if (!name || !email || !phone || !password || !vehicle_type || !vehicle_number || !license_number) {
            Alert.alert('Error', 'Please fill all required fields');
            return;
        }

        if (!validateEmail(email)) {
            Alert.alert('Error', 'Please enter a valid email address');
            return;
        }

        if (phone.length !== 10) {
            Alert.alert('Error', 'Phone number must be 10 digits');
            return;
        }

        if (password.length < 8) {
            Alert.alert('Error', 'Password must be at least 8 characters');
            return;
        }

        try {
            setLoading(true);
            
            // Build FormData
            const submitData = new FormData();
            Object.keys(formData).forEach(key => submitData.append(key, formData[key]));
            
            // Helper to append image
            const appendImage = (uri, fieldName) => {
                if (uri) {
                    const filename = uri.split('/').pop();
                    const ext = filename.split('.').pop();
                    submitData.append(fieldName, {
                        uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
                        type: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
                        name: filename,
                    });
                }
            };

            appendImage(profileImage, 'profileImage');
            appendImage(licenseImage, 'licenseImage');
            appendImage(rcImage, 'rcImage');

            await api.post('/api/v1/delivery-partners/partners', submitData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                timeout: 60000,
            });

            Alert.alert('Success', 'Delivery Partner registered successfully!', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            console.error('Registration error:', error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to register delivery partner');
        } finally {
            setLoading(false);
        }
    };

    const renderImagePicker = (title, imageUri, setImageFunc) => (
        <View style={styles.imagePickerContainer}>
            <Text style={styles.imagePickerTitle}>{title}</Text>
            {imageUri ? (
                <View style={styles.previewContainer}>
                    <Image source={{ uri: imageUri }} style={styles.previewImage} />
                    <TouchableOpacity style={styles.removeImageBtn} onPress={() => setImageFunc(null)}>
                        <MaterialIcons name="close" size={16} color="#fff" />
                    </TouchableOpacity>
                </View>
            ) : (
                <TouchableOpacity style={styles.uploadBtn} onPress={() => pickImage(setImageFunc)}>
                    <MaterialIcons name="add-a-photo" size={24} color="#6B7280" />
                    <Text style={styles.uploadBtnText}>Upload Photo</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    return (
        <ScrollView style={styles.container}>
            <Card style={styles.card}>
                <Card.Title title="Register New Partner" subtitle="Create login credentials for your delivery staff" />
                <Card.Content>
                    
                    {renderImagePicker('Profile Photo (Optional)', profileImage, setProfileImage)}

                    <Text style={styles.sectionHeader}>Personal & Login Info</Text>
                    <TextInput label="Full Name *" value={formData.name} onChangeText={(text) => handleInputChange('name', text)} mode="outlined" style={styles.input} />
                    <TextInput label="Email Address *" value={formData.email} onChangeText={(text) => handleInputChange('email', text)} mode="outlined" keyboardType="email-address" autoCapitalize="none" style={styles.input} placeholder="Used for login" />
                    <TextInput label="Phone Number *" value={formData.phone} onChangeText={(text) => handleInputChange('phone', text)} mode="outlined" keyboardType="phone-pad" style={styles.input} maxLength={10} />
                    <TextInput label="Password *" value={formData.password} onChangeText={(text) => handleInputChange('password', text)} mode="outlined" secureTextEntry style={styles.input} placeholder="Min 8 characters" />
                    <HelperText type="info">The partner will use this email and password to log in.</HelperText>

                    <Text style={styles.sectionHeader}>Vehicle Details & Documents</Text>
                    <TextInput label="Vehicle Type *" value={formData.vehicle_type} onChangeText={(text) => handleInputChange('vehicle_type', text)} mode="outlined" style={styles.input} placeholder="e.g. Scooter, Mini Truck" />
                    <TextInput label="Vehicle Number *" value={formData.vehicle_number} onChangeText={(text) => handleInputChange('vehicle_number', text)} mode="outlined" style={styles.input} autoCapitalize="characters" />
                    <TextInput label="Driving License *" value={formData.license_number} onChangeText={(text) => handleInputChange('license_number', text)} mode="outlined" style={styles.input} autoCapitalize="characters" />

                    <View style={styles.docsRow}>
                        {renderImagePicker('Driving License', licenseImage, setLicenseImage)}
                        <View style={{ width: 12 }} />
                        {renderImagePicker('RC Book', rcImage, setRcImage)}
                    </View>

                    <Button mode="contained" onPress={handleSubmit} loading={loading} disabled={loading} style={styles.button}>
                        REGISTER PARTNER
                    </Button>
                </Card.Content>
            </Card>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5', padding: 16 },
    card: { borderRadius: 12, elevation: 4, marginBottom: 40 },
    sectionHeader: { fontSize: 16, fontWeight: '700', color: '#4CAF50', marginTop: 15, marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 5 },
    input: { marginBottom: 10, backgroundColor: '#fff' },
    button: { marginTop: 20, paddingVertical: 8, backgroundColor: '#4CAF50', borderRadius: 8 },
    
    // Image Upload Styles
    imagePickerContainer: { flex: 1, marginBottom: 16, alignItems: 'flex-start' },
    imagePickerTitle: { fontSize: 13, fontWeight: '600', color: '#4B5563', marginBottom: 8 },
    uploadBtn: { width: '100%', height: 100, borderRadius: 12, borderWidth: 2, borderStyle: 'dashed', borderColor: '#D1D5DB', justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
    uploadBtnText: { fontSize: 12, color: '#6B7280', marginTop: 4, fontWeight: '600' },
    previewContainer: { width: '100%', height: 100, borderRadius: 12, position: 'relative' },
    previewImage: { width: '100%', height: '100%', borderRadius: 12 },
    removeImageBtn: { position: 'absolute', top: -6, right: -6, width: 24, height: 24, borderRadius: 12, backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'center', elevation: 2 },
    docsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }
});

export default AddDeliveryPartnerScreen;
