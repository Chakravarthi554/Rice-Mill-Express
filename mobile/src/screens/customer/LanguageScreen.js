import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Card, Title, RadioButton, Divider, Button } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { updatePreferences, resetSettingsStatus } from '../../redux/slices/settingsSlice';
import io from 'socket.io-client';
import { API_URL } from '../../config/env';

const LanguageScreen = () => {
    const dispatch = useDispatch();
    const { preferences = {}, loading, success, error } = useSelector((state) => state.settings);
    const { user } = useSelector((state) => state.auth);

    const [localLang, setLocalLang] = useState(preferences?.language || 'english');
    const [localCurrency, setLocalCurrency] = useState(preferences?.currency || 'INR');
    const [localRegion, setLocalRegion] = useState(preferences?.region || 'IN');

    useEffect(() => {
        if (success) {
            // Success feedback if needed
            dispatch(resetSettingsStatus());
        }
    }, [success, dispatch]);

    // ✅ Listen for real-time preference updates from other devices
    useEffect(() => {
        const handlePreferenceUpdate = (data) => {
            if (data.userId === user?._id) {
                // Update local state to match backend
                setLocalLang(data.preferences?.language || localLang);
                setLocalCurrency(data.preferences?.currency || localCurrency);
                setLocalRegion(data.preferences?.region || localRegion);
                
                // Update Redux store
                dispatch({
                    type: 'SETTINGS_UPDATE_RECEIVED',
                    payload: data.preferences
                });
            }
        };

        // Listen for preference updates
        const socket = io(API_URL, {
            transports: ['websocket'],
            auth: {
                token: user?.token
            }
        });

        socket.on('PREFERENCES_UPDATED', handlePreferenceUpdate);
        socket.on('GLOBAL_PREFERENCES_UPDATE', handlePreferenceUpdate);

        return () => {
            socket.off('PREFERENCES_UPDATED', handlePreferenceUpdate);
            socket.off('GLOBAL_PREFERENCES_UPDATE', handlePreferenceUpdate);
            socket.disconnect();
        };
    }, [user?._id, user?.token, localLang, localCurrency, localRegion, dispatch]);

    const handleSave = () => {
        dispatch(updatePreferences({
            ...preferences,
            language: localLang,
            currency: localCurrency,
            region: localRegion
        }));
    };

    const languages = [
        { label: 'English', value: 'english' },
        { label: 'Hindi', value: 'hindi' },
        { label: 'Telugu', value: 'telugu' },
        { label: 'Tamil', value: 'tamil' },
    ];

    const regions = [
        { label: 'India 🇮🇳', value: 'IN' },
        { label: 'United States 🇺🇸', value: 'US' },
        { label: 'United Kingdom 🇬🇧', value: 'GB' },
        { label: 'Australia 🇦🇺', value: 'AU' }
    ];

    const currencies = [
        { label: 'Indian Rupee (₹)', value: 'INR' },
        { label: 'US Dollar ($)', value: 'USD' },
        { label: 'British Pound (£)', value: 'GBP' },
        { label: 'Euro (€)', value: 'EUR' }
    ];

    return (
        <ScrollView style={styles.container}>
            <Card style={styles.card}>
                <Card.Content>
                    <Title>App Language</Title>
                    <Divider style={styles.divider} />
                    <RadioButton.Group onValueChange={setLocalLang} value={localLang}>
                        {languages.map((lang) => (
                            <View key={lang.value} style={styles.radioRow}>
                                <RadioButton value={lang.value} color="#4CAF50" />
                                <Text style={styles.radioLabel}>{lang.label}</Text>
                            </View>
                        ))}
                    </RadioButton.Group>
                </Card.Content>
            </Card>

            <Card style={styles.card}>
                <Card.Content>
                    <Title>Region & Localization</Title>
                    <Divider style={styles.divider} />
                    <RadioButton.Group onValueChange={setLocalRegion} value={localRegion}>
                        {regions.map((reg) => (
                            <View key={reg.value} style={styles.radioRow}>
                                <RadioButton value={reg.value} color="#4CAF50" />
                                <Text style={styles.radioLabel}>{reg.label}</Text>
                            </View>
                        ))}
                    </RadioButton.Group>
                </Card.Content>
            </Card>

            <Card style={styles.card}>
                <Card.Content>
                    <Title>Preferred Currency</Title>
                    <Divider style={styles.divider} />
                    <RadioButton.Group onValueChange={setLocalCurrency} value={localCurrency}>
                        {currencies.map((curr) => (
                            <View key={curr.value} style={styles.radioRow}>
                                <RadioButton value={curr.value} color="#4CAF50" />
                                <Text style={styles.radioLabel}>{curr.label}</Text>
                            </View>
                        ))}
                    </RadioButton.Group>
                </Card.Content>
            </Card>

            <View style={{ padding: 16 }}>
                <Button
                    mode="contained"
                    onPress={handleSave}
                    loading={loading}
                    style={{ backgroundColor: '#4CAF50' }}
                >
                    Apply Changes
                </Button>
            </View>
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
