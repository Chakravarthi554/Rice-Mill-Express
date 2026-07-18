import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const SupportScreen = () => (
    <View style={styles.container}>
        <Text style={styles.text}>Support Feature Coming Soon</Text>
        <Text>For help, email support@ricemill.com</Text>
    </View>
);

const AboutScreen = () => (
    <View style={styles.container}>
        <Text style={styles.text}>Rice Mill Express</Text>
        <Text>Version 1.0.0</Text>
        <Text style={{ marginTop: 10, textAlign: 'center' }}>Providing quality rice products directly to your doorstep.</Text>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    text: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10
    }
});

export { SupportScreen, AboutScreen };
