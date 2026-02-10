import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Card, Title, RadioButton, Divider } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LanguageScreen = () => {
    const [language, setLanguage] = useState('en');
    const [currency, setCurrency] = useState('INR');

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const savedLang = await AsyncStorage.getItem('appLanguage');
            const savedCurr = await AsyncStorage.getItem('appCurrency');
            if (savedLang) setLanguage(savedLang);
            if (savedCurr) setCurrency(savedCurr);
        } catch (e) {
            console.error('Failed to load settings.');
        }
    };

    const updateLanguage = async (value) => {
        setLanguage(value);
        await AsyncStorage.setItem('appLanguage', value);
    };

    const updateCurrency = async (value) => {
        setCurrency(value);
        await AsyncStorage.setItem('appCurrency', value);
    };

    const languages = [
        { label: 'English', value: 'en' },
        { label: 'Hindi (coming soon)', value: 'hi', disabled: true },
        { label: 'Telugu (coming soon)', value: 'te', disabled: true },
        { label: 'Tamil (coming soon)', value: 'ta', disabled: true },
    ];

    const currencies = [
        { label: 'Indian Rupee (₹)', value: 'INR' },
        { label: 'US Dollar ($)', value: 'USD' },
    ];

    return (
        <ScrollView style={styles.container}>
            <Card style={styles.card}>
                <Card.Content>
                    <Title>App Language</Title>
                    <Divider style={styles.divider} />
                    <RadioButton.Group onValueChange={updateLanguage} value={language}>
                        {languages.map((lang) => (
                            <View key={lang.value} style={styles.radioRow}>
                                <RadioButton value={lang.value} color="#4CAF50" disabled={lang.disabled} />
                                <Text style={[styles.radioLabel, lang.disabled && { color: '#ccc' }]}>{lang.label}</Text>
                            </View>
                        ))}
                    </RadioButton.Group>
                </Card.Content>
            </Card>

            <Card style={styles.card}>
                <Card.Content>
                    <Title>Preferred Currency</Title>
                    <Divider style={styles.divider} />
                    <RadioButton.Group onValueChange={updateCurrency} value={currency}>
                        {currencies.map((curr) => (
                            <View key={curr.value} style={styles.radioRow}>
                                <RadioButton value={curr.value} color="#4CAF50" />
                                <Text style={styles.radioLabel}>{curr.label}</Text>
                            </View>
                        ))}
                    </RadioButton.Group>
                </Card.Content>
            </Card>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    card: {
        margin: 16,
        elevation: 2,
    },
    divider: {
        marginBottom: 16,
    },
    radioRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    radioLabel: {
        fontSize: 16,
        marginLeft: 10,
    },
});

export default LanguageScreen;
