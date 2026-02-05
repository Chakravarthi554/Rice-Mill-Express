import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const OrderSuccessScreen = ({ navigation, route }) => {
    // Can pass order details via params if needed
    return (
        <View style={styles.container}>
            <MaterialIcons name="check-circle" size={100} color="#4CAF50" />
            <Text style={styles.title}>Order Placed Successfully!</Text>
            <Text style={styles.subtitle}>Your order has been received and will be processed shortly.</Text>

            <TouchableOpacity
                style={styles.button}
                onPress={() => navigation.navigate('CustomerTabs', { screen: 'Orders' })}
            >
                <Text style={styles.buttonText}>View My Orders</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={() => navigation.navigate('CustomerTabs', { screen: 'Home' })}
            >
                <Text style={[styles.buttonText, styles.secondaryButtonText]}>Continue Shopping</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginVertical: 20,
        color: '#333',
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 40,
    },
    button: {
        backgroundColor: '#4CAF50',
        paddingVertical: 15,
        paddingHorizontal: 40,
        borderRadius: 25,
        marginBottom: 15,
        width: '100%',
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: '#4CAF50',
    },
    secondaryButtonText: {
        color: '#4CAF50',
    },
});

export default OrderSuccessScreen;
