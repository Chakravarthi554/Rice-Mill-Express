import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Card, Title, List, Switch, Divider, Button } from 'react-native-paper';
import Slider from '@react-native-community/slider';

import { useDispatch, useSelector } from 'react-redux';
import { updateAccessibility, resetSettingsStatus } from '../../redux/slices/settingsSlice';

const AccessibilityScreen = () => {
    const dispatch = useDispatch();
    const { accessibility = {}, loading, success } = useSelector((state) => state.settings);
    const { colors } = useTheme();

    const [highContrast, setHighContrast] = useState(accessibility?.highContrast || 0);
    const [textSize, setTextSize] = useState(accessibility?.textSize || 16);
    const [screenReader, setScreenReader] = useState(accessibility?.screenReader || false);

    useEffect(() => {
        if (success) {
            Alert.alert('Success', 'Accessibility settings saved successfully');
            dispatch(resetSettingsStatus());
        }
    }, [success, dispatch]);

    const handleSave = () => {
        dispatch(updateAccessibility({
            highContrast,
            textSize,
            screenReader
        }));
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            <Card style={[styles.card, { backgroundColor: colors.surface }]}>
                <Card.Content>
                    <Title style={{ color: colors.onSurface }}>Visual Settings</Title>
                    <View style={styles.settingRow}>
                        <Text style={[styles.label, { color: colors.onSurface }]}>High Contrast</Text>
                        <Text style={{ color: colors.primary, fontWeight: 'bold' }}>{Math.round(highContrast)}%</Text>
                    </View>
                    <Slider
                        style={styles.slider}
                        minimumValue={0}
                        maximumValue={100}
                        value={highContrast}
                        onValueChange={setHighContrast}
                        minimumTrackTintColor={colors.primary}
                        maximumTrackTintColor={colors.outlineVariant}
                        step={5}
                    />

                    <View style={styles.settingRow}>
                        <Text style={[styles.label, { color: colors.onSurface }]}>Text Size</Text>
                        <Text style={{ color: colors.primary, fontWeight: 'bold' }}>{Math.round(textSize)}px</Text>
                    </View>
                    <Slider
                        style={styles.slider}
                        minimumValue={12}
                        maximumValue={30}
                        value={textSize}
                        onValueChange={setTextSize}
                        minimumTrackTintColor={colors.primary}
                        maximumTrackTintColor={colors.outlineVariant}
                        step={1}
                    />
                </Card.Content>
            </Card>

            <Card style={[styles.card, { backgroundColor: colors.surface }]}>
                <Card.Content>
                    <Title style={{ color: colors.onSurface }}>Assistive Technology</Title>
                    <Divider style={[styles.divider, { backgroundColor: colors.outlineVariant }]} />

                    <List.Item
                        title="Screen Reader Support"
                        titleStyle={{ color: colors.onSurface }}
                        description="Optimize UI for screen readers"
                        descriptionStyle={{ color: colors.onSurfaceVariant }}
                        right={() => <Switch value={screenReader} onValueChange={setScreenReader} color={colors.primary} />}
                    />
                </Card.Content>
            </Card>

            <Button
                mode="contained"
                onPress={handleSave}
                loading={loading}
                style={[styles.saveButton, { backgroundColor: colors.primary }]}
                labelStyle={styles.saveButtonLabel}
            >
                Save Settings
            </Button>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    card: {
        margin: 16,
        elevation: 2,
    },
    sliderContainer: {
        padding: 16,
    },
    label: {
        fontSize: 16,
        marginBottom: 10,
    },
});

export default AccessibilityScreen;
