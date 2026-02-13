import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Card, Title, List, Divider } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';

import { useDispatch, useSelector } from 'react-redux';
import { updatePreferences, resetSettingsStatus } from '../../redux/slices/settingsSlice';

const ThemeScreen = () => {
    const dispatch = useDispatch();
    const { preferences = {}, loading, success } = useSelector((state) => state.settings);
    const [localTheme, setLocalTheme] = useState(preferences?.theme || 'system');

    useEffect(() => {
        if (success) {
            dispatch(resetSettingsStatus());
        }
    }, [success, dispatch]);

    const handleThemeChange = (themeId) => {
        setLocalTheme(themeId);
        dispatch(updatePreferences({
            ...preferences,
            theme: themeId
        }));
    };

    const themes = [
        { id: 'light', label: 'Light Mode', icon: 'light-mode' },
        { id: 'dark', label: 'Dark Mode', icon: 'dark-mode' },
        { id: 'system', label: 'System Default', icon: 'settings-brightness' },
    ];

    return (
        <ScrollView style={styles.container}>
            <Card style={styles.card}>
                <Card.Content>
                    <Title>Choose Theme</Title>
                    <Divider style={styles.divider} />

                    {themes.map((t) => (
                        <TouchableOpacity
                            key={t.id}
                            style={[styles.themeOption, localTheme === t.id && styles.selectedOption]}
                            onPress={() => handleThemeChange(t.id)}
                        >
                            <MaterialIcons name={t.icon} size={24} color={localTheme === t.id ? '#4CAF50' : '#666'} />
                            <Text style={[styles.themeLabel, localTheme === t.id && styles.selectedLabel]}>{t.label}</Text>
                            {localTheme === t.id && <MaterialIcons name="check" size={24} color="#4CAF50" />}
                        </TouchableOpacity>
                    ))}
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
        marginBottom: 10,
    },
    themeOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 10,
        borderRadius: 8,
        marginVertical: 4,
    },
    selectedOption: {
        backgroundColor: '#E8F5E9',
    },
    themeLabel: {
        flex: 1,
        fontSize: 16,
        marginLeft: 15,
        color: '#666',
    },
    selectedLabel: {
        color: '#4CAF50',
        fontWeight: 'bold',
    },
});

export default ThemeScreen;
