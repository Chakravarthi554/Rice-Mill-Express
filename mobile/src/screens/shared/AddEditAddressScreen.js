import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { apiService } from '../../services/api';

const AddEditAddressScreen = ({ navigation, route }) => {
    const addressToEdit = route.params?.address;
    const isEdit = !!addressToEdit;

    const [name, setName] = useState(addressToEdit?.name || '');
    const [street, setStreet] = useState(addressToEdit?.street || '');
    const [city, setCity] = useState(addressToEdit?.city || '');
    const [state, setState] = useState(addressToEdit?.state || '');
    const [pinCode, setPinCode] = useState(addressToEdit?.pinCode || '');
    const [phone, setPhone] = useState(addressToEdit?.phone || '');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!name || !street || !city || !state || !pinCode || !phone) {
            Alert.alert('Error', 'Please fill all fields');
            return;
        }

        try {
            setLoading(true);
            const addressData = { name, street, city, state, pinCode, phone };

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
            <TextInput
                label="Full Name"
                value={name}
                onChangeText={setName}
                style={styles.input}
                mode="outlined"
            />
            <TextInput
                label="Street Address"
                value={street}
                onChangeText={setStreet}
                style={styles.input}
                mode="outlined"
                multiline
            />
            <TextInput
                label="City"
                value={city}
                onChangeText={setCity}
                style={styles.input}
                mode="outlined"
            />
            <View style={styles.row}>
                <TextInput
                    label="State"
                    value={state}
                    onChangeText={setState}
                    style={[styles.input, styles.halfInput]}
                    mode="outlined"
                />
                <TextInput
                    label="PIN Code"
                    value={pinCode}
                    onChangeText={setPinCode}
                    style={[styles.input, styles.halfInput]}
                    mode="outlined"
                    keyboardType="numeric"
                />
            </View>
            <TextInput
                label="Phone Number"
                value={phone}
                onChangeText={setPhone}
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
