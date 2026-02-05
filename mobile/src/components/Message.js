import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const Message = ({ children, variant = 'info' }) => {
    const getBackgroundColor = () => {
        switch (variant) {
            case 'error': return '#ffebee';
            case 'success': return '#e8f5e9';
            default: return '#e3f2fd';
        }
    };

    const getTextColor = () => {
        switch (variant) {
            case 'error': return '#c62828';
            case 'success': return '#2e7d32';
            default: return '#1565c0';
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: getBackgroundColor() }]}>
            <Text style={[styles.text, { color: getTextColor() }]}>{children}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 10,
        borderRadius: 5,
        marginVertical: 10,
    },
    text: {
        fontSize: 14,
    },
});

export default Message;
