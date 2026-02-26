import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Card, Title, RadioButton, Divider, Button } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { updatePreferences, resetSettingsStatus } from '../../redux/slices/settingsSlice';
import io from 'socket.io-client';
import { API_URL } from '../../config/env';

const LanguageScreen = () => {
    const { t, i18n } = useTranslation();
    const dispatch = useDispatch();
    const { preferences = {}, loading, success, error } = useSelector((state) => state.settings);
    const { user } = useSelector((state) => state.auth);

    const [localLang, setLocalLang] = useState(i18n.language || 'english');

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
                if (data.preferences?.language) {
                    i18n.changeLanguage(data.preferences.language);
                }

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
    }, [user?._id, user?.token, dispatch, i18n]);

    const handleSave = () => {
        i18n.changeLanguage(localLang);
        dispatch(updatePreferences({
            ...preferences,
            language: localLang
        }));
    };

    const languages = [
        { label: 'English', value: 'english' },
        { label: 'Hindi', value: 'hindi' },
        { label: 'Telugu', value: 'telugu' },
        { label: 'Tamil', value: 'tamil' },
    ];

    // Task List:
    // - [x] Planning & Research
    //     - [x] Analyze existing mobile settings and navigation
    //     - [x] Create implementation plan and walkthrough summary
    //     - [x] Get user approval
    // - [x] Cleanup & Removals
    //     - [x] Mobile: Remove "My Subscriptions" feature (Screen, Route, Navigation, Logic)
    //     - [x] Mobile: Remove "Region & Localization" and "Preferred Currency" blocks
    //     - [x] Desktop: Remove "Subscription" feature (Component, Side Nav, Route)
    //     - [x] Desktop: Remove "Region" block from settings
    //     - [x] Clean up related state and unused imports on both platforms
    // - [x] i18n Implementation (Common)
    //     - [x] Set up i18next and react-i18next in both projects
    //     - [x] Create shared translation files or platform-specific ones (en.json, hi.json, te.json, ta.json)
    //     - [x] Move static strings into translation files
    //     - [x] Implement persistent language storage (AsyncStorage/localStorage)
    //     - [x] Refactor Language switcher components in both apps
    // - [x] Verification & Bug Fixes
    //     - [x] Fixed `ReferenceError: useDispatch` in `LanguageScreen.js`
    //     - [x] Verified instant language switching on all screens
    //     - [x] Verify persistence across restarts
    //     - [x] Ensure no regressions in auth, payments, or rewards


    return (
        <ScrollView style={styles.container}>
            <Card style={styles.card}>
                <Card.Content>
                    <Title>{t('appLanguage')}</Title>
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


            <View style={{ padding: 16 }}>
                <Button
                    mode="contained"
                    onPress={handleSave}
                    loading={loading}
                    style={{ backgroundColor: '#4CAF50' }}
                >
                    {t('applyChanges')}
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
