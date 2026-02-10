import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Card, Title, List, Divider } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';

const ThemeScreen = () => {
    const [theme, setTheme] = useState('system');

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
                            style={[styles.themeOption, theme === t.id && styles.selectedOption]}
                            onPress={() => setTheme(t.id)}
                        >
                            <MaterialIcons name={t.icon} size={24} color={theme === t.id ? '#4CAF50' : '#666'} />
                            <Text style={[styles.themeLabel, theme === t.id && styles.selectedLabel]}>{t.label}</Text>
                            {theme === t.id && <MaterialIcons name="check" size={24} color="#4CAF50" />}
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
