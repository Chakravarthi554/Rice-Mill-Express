import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import * as Location from 'expo-location';
import { apiService } from '../../services/api';

const AddEditAddressScreen = ({ navigation, route }) => {
    const addressToEdit = route.params?.address;
    const isEdit = !!addressToEdit;

    const [name, setName] = useState(addressToEdit?.name || '');
    const [houseNumber, setHouseNumber] = useState(addressToEdit?.houseNumber || '');
    const [colony, setColony] = useState(addressToEdit?.colony || '');
    const [street, setStreet] = useState(addressToEdit?.street || '');
    const [landmark, setLandmark] = useState(addressToEdit?.landmark || '');
    const [city, setCity] = useState(addressToEdit?.city || '');
    const [state, setState] = useState(addressToEdit?.state || '');
    const [pinCode, setPinCode] = useState(addressToEdit?.pinCode || '');
    const [phone, setPhone] = useState(addressToEdit?.phone || '');
    const [alternativePhone, setAlternativePhone] = useState(addressToEdit?.alternativePhone || '');
    const [location, setLocation] = useState(addressToEdit?.location || null);
    const [loading, setLoading] = useState(false);
    const [locationLoading, setLocationLoading] = useState(false);

    const handleDetectLocation = async () => {
        try {
            setLocationLoading(true);
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Please enable location permissions to use this feature.');
                return;
            }

            const currentPosition = await Location.getCurrentPositionAsync({});
            const { latitude, longitude } = currentPosition.coords;

            // ✅ Reverse Geocoding using Nominatim (Free/OSM)
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
                {
                    headers: {
                        'User-Agent': 'RiceMillApp/1.0 (contact@ricemill.com)'
                    }
                }
            );
            const data = await response.json();

            if (data && data.address) {
                const addr = data.address;
                setStreet(addr.road || addr.suburb || '');
                setCity(addr.city || addr.town || addr.village || '');
                setState(addr.state || '');
                setPinCode(addr.postcode || '');
                setLocation({ type: 'Point', coordinates: [longitude, latitude] });

                Alert.alert('Location Detected', 'Address fields have been pre-filled. Please verify and complete mandatory details.');
            }
        } catch (error) {
            console.error('Location detection error:', error);
            Alert.alert('Error', 'Failed to detect location. Please enter manually.');
        } finally {
            setLocationLoading(false);
        }
    };

    const handleSubmit = async () => {
        // Validation: Mandatory structured fields
        if (!name || !phone || !houseNumber || !street || !city || !state || !pinCode) {
            Alert.alert('Error', 'Please fill all mandatory fields (marked with *)');
            return;
        }

        try {
            setLoading(true);
            const addressData = {
                name,
                phone,
                houseNumber,
                colony,
                street,
                landmark,
                city,
                state,
                pinCode,
                alternativePhone,
                location,
                type: addressToEdit?.type || 'home'
            };

            if (isEdit) {
                await apiService.updateAddress(addressToEdit._id, addressData);
                Alert.alert('Success', 'Address updated successfully');
            } else {
                await apiService.createAddress(addressData);
                Alert.alert('Success', 'Address added successfully');
            }
            navigation.goBack();
        } catch (error) {
            console.error('Address save error:', error);
            Alert.alert('Error', 'Failed to save address');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Button
                mode="outlined"
                onPress={handleDetectLocation}
                loading={locationLoading}
                icon="crosshairs-gps"
                style={styles.detectButton}
                textColor="#4CAF50"
            >
                Detect Current Location
            </Button>

            <TextInput
                label="Full Name *"
                value={name}
                onChangeText={setName}
                style={styles.input}
                mode="outlined"
            />
            <View style={styles.row}>
                <TextInput
                    label="House/Flat No *"
                    value={houseNumber}
                    onChangeText={setHouseNumber}
                    style={[styles.input, styles.halfInput]}
                    mode="outlined"
                />
                <TextInput
                    label="Colony/Area"
                    value={colony}
                    onChangeText={setColony}
                    style={[styles.input, styles.halfInput]}
                    mode="outlined"
                />
            </View>
            <TextInput
                label="Street Address *"
                value={street}
                onChangeText={setStreet}
                style={styles.input}
                mode="outlined"
                multiline
            />
            <TextInput
                label="Landmark (Optional)"
                value={landmark}
                onChangeText={setLandmark}
                style={styles.input}
                mode="outlined"
            />
            <TextInput
                label="City *"
                value={city}
                onChangeText={setCity}
                style={styles.input}
                mode="outlined"
            />
            <View style={styles.row}>
                <TextInput
                    label="State *"
                    value={state}
                    onChangeText={setState}
                    style={[styles.input, styles.halfInput]}
                    mode="outlined"
                />
                <TextInput
                    label="PIN Code *"
                    value={pinCode}
                    onChangeText={setPinCode}
                    style={[styles.input, styles.halfInput]}
                    mode="outlined"
                    keyboardType="numeric"
                />
            </View>
            <TextInput
                label="Phone Number *"
                value={phone}
                onChangeText={setPhone}
                style={styles.input}
                mode="outlined"
                keyboardType="phone-pad"
            />
            <TextInput
                label="Alt Phone (Optional)"
                value={alternativePhone}
                onChangeText={setAlternativePhone}
                style={styles.input}
                mode="outlined"
                keyboardType="phone-pad"
            />
            <Button
                mode="contained"
                onPress={handleSubmit}
                loading={loading}
                style={styles.button}
            >
                {isEdit ? 'Update Address' : 'Add Address'}
            </Button>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    content: {
        padding: 20,
        paddingBottom: 40,
    },
    detectButton: {
        marginBottom: 20,
        borderColor: '#4CAF50',
    },
    input: {
        marginBottom: 15,
        backgroundColor: 'white',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    halfInput: {
        width: '48%',
    },
    button: {
        marginTop: 10,
        backgroundColor: '#4CAF50',
        paddingVertical: 6,
    },
});

export default AddEditAddressScreen;
