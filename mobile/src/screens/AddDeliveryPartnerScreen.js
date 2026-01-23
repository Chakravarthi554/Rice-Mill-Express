import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Button, TextInput, Card, HelperText } from 'react-native-paper';
import { useSelector } from 'react-redux';
import axios from 'axios';

const AddDeliveryPartnerScreen = ({ navigation }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        vehicle_type: '',
        vehicle_number: '',
        license_number: ''
    });
    const [loading, setLoading] = useState(false);

    const { userInfo } = useSelector(state => state.userLogin);

    const handleInputChange = (name, value) => {
        setFormData({ ...formData, [name]: value });
    };

    const validateEmail = (email) => {
        return String(email)
            .toLowerCase()
            .match(
                /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
            );
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
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${userInfo.token}`,
                },
            };

            await axios.post('/api/delivery-partners/partners', formData, config);

            Alert.alert('Success', 'Delivery Partner registered successfully! They can now login using their email and password.', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            console.error('Registration error:', error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to register delivery partner');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <Card style={styles.card}>
                <Card.Title title="Register New Partner" subtitle="Create login credentials for your delivery staff" />
                <Card.Content>
                    <Text style={styles.sectionHeader}>Personal & Login Info</Text>
                    <TextInput
                        label="Full Name *"
                        value={formData.name}
                        onChangeText={(text) => handleInputChange('name', text)}
                        mode="outlined"
                        style={styles.input}
                    />
                    <TextInput
                        label="Email Address *"
                        value={formData.email}
                        onChangeText={(text) => handleInputChange('email', text)}
                        mode="outlined"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        style={styles.input}
                        placeholder="Used for login"
                    />
                    <TextInput
                        label="Phone Number *"
                        value={formData.phone}
                        onChangeText={(text) => handleInputChange('phone', text)}
                        mode="outlined"
                        keyboardType="phone-pad"
                        style={styles.input}
                        maxLength={10}
                    />
                    <TextInput
                        label="Password *"
                        value={formData.password}
                        onChangeText={(text) => handleInputChange('password', text)}
                        mode="outlined"
                        secureTextEntry
                        style={styles.input}
                        placeholder="Min 8 characters"
                    />
                    <HelperText type="info">
                        The partner will use this email and password to log in.
                    </HelperText>

                    <Text style={styles.sectionHeader}>Vehicle Details</Text>
                    <TextInput
                        label="Vehicle Type *"
                        value={formData.vehicle_type}
                        onChangeText={(text) => handleInputChange('vehicle_type', text)}
                        mode="outlined"
                        style={styles.input}
                        placeholder="e.g. Scooter, Mini Truck"
                    />
                    <TextInput
                        label="Vehicle Number *"
                        value={formData.vehicle_number}
                        onChangeText={(text) => handleInputChange('vehicle_number', text)}
                        mode="outlined"
                        style={styles.input}
                        autoCapitalize="characters"
                    />
                    <TextInput
                        label="Driving License *"
                        value={formData.license_number}
                        onChangeText={(text) => handleInputChange('license_number', text)}
                        mode="outlined"
                        style={styles.input}
                        autoCapitalize="characters"
                    />

                    <Button
                        mode="contained"
                        onPress={handleSubmit}
                        loading={loading}
                        disabled={loading}
                        style={styles.button}
                    >
                        REGISTER PARTNER
                    </Button>
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
    card: {
        borderRadius: 12,
        elevation: 4,
        marginBottom: 20,
    },
    sectionHeader: {
        fontSize: 16,
        fontWeight: '700',
        color: '#4CAF50',
        marginTop: 15,
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 5,
    },
    input: {
        marginBottom: 10,
        backgroundColor: '#fff',
    },
    button: {
        marginTop: 20,
        paddingVertical: 8,
        backgroundColor: '#4CAF50',
    },
});

export default AddDeliveryPartnerScreen;
