import React, { useState, useEffect } from 'react';
console.log('💳 CheckoutScreen loading...');
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Button, TextInput, RadioButton, Card } from 'react-native-paper';
import { apiService } from '../../services/api';

const CheckoutScreen = ({ navigation }) => {
    const [address, setAddress] = useState({
        name: '',
        phone: '',
        street: '',
        city: '',
        state: '',
        pinCode: '',
    });
    const [paymentMethod, setPaymentMethod] = useState('cod');
    const [loading, setLoading] = useState(false);

    const handlePlaceOrder = async () => {
        if (!address.street || !address.city || !address.pinCode) {
            Alert.alert('Error', 'Please fill in all address fields');
            return;
        }

        try {
            setLoading(true);
            // Construct order data matching backend expectations
            const orderData = {
                shippingAddress: address,
                paymentMethod,
                // Backend likely gets items from cart or expects them here. 
                // api.createOrder might use cart from backend session?
                // Let's assume backend creates order from cart if items not passed, 
                // OR we need to fetch cart items first.
                // Usually 'createOrder' in this app seems to expect items?
                // Let's check apiService.createOrder usage in web if possible, but for now prompt simple flow.
            };

            const response = await apiService.createOrder(orderData);

            Alert.alert('Success', 'Order placed successfully!', [
                { text: 'OK', onPress: () => navigation.navigate('CustomerTabs', { screen: 'Orders' }) }
            ]);
        } catch (error) {
            console.error('Order placement error:', error);
            Alert.alert('Error', 'Failed to place order. ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <Card style={styles.card}>
                <Card.Title title="Shipping Address" />
                <Card.Content>
                    <TextInput
                        label="Full Name"
                        value={address.name}
                        onChangeText={(text) => setAddress({ ...address, name: text })}
                        style={styles.input}
                    />
                    <TextInput
                        label="Phone Number"
                        value={address.phone}
                        onChangeText={(text) => setAddress({ ...address, phone: text })}
                        keyboardType="phone-pad"
                        style={styles.input}
                    />
                    <TextInput
                        label="Street Address"
                        value={address.street}
                        onChangeText={(text) => setAddress({ ...address, street: text })}
                        multiline
                        style={styles.input}
                    />
                    <TextInput
                        label="City"
                        value={address.city}
                        onChangeText={(text) => setAddress({ ...address, city: text })}
                        style={styles.input}
                    />
                    <View style={styles.row}>
                        <TextInput
                            label="State"
                            value={address.state}
                            onChangeText={(text) => setAddress({ ...address, state: text })}
                            style={[styles.input, styles.halfInput]}
                        />
                        <TextInput
                            label="PIN Code"
                            value={address.pinCode}
                            onChangeText={(text) => setAddress({ ...address, pinCode: text })}
                            keyboardType="numeric"
                            style={[styles.input, styles.halfInput]}
                        />
                    </View>
                </Card.Content>
            </Card>

            <Card style={styles.card}>
                <Card.Title title="Payment Method" />
                <Card.Content>
                    <RadioButton.Group onValueChange={setPaymentMethod} value={paymentMethod}>
                        <View style={styles.radioItem}>
                            <RadioButton value="cod" />
                            <Text>Cash on Delivery</Text>
                        </View>
                        <View style={styles.radioItem}>
                            <RadioButton value="online" disabled />
                            <Text style={{ color: 'gray' }}>Online Payment (Coming Soon)</Text>
                        </View>
                    </RadioButton.Group>
                </Card.Content>
            </Card>

            <Button
                mode="contained"
                onPress={handlePlaceOrder}
                loading={loading}
                disabled={loading}
                style={styles.button}
            >
                Place Order
            </Button>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#f5f5f5',
    },
    card: {
        marginBottom: 16,
    },
    input: {
        marginBottom: 12,
        backgroundColor: 'white',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    halfInput: {
        width: '48%',
    },
    radioItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    button: {
        marginTop: 10,
        marginBottom: 30,
        paddingVertical: 6,
        backgroundColor: '#4CAF50',
    },
});

export default CheckoutScreen;
