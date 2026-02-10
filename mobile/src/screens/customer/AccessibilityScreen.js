import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Card, Title, List, Switch, Divider, Slider } from 'react-native-paper';

const AccessibilityScreen = () => {
    const [screenReader, setScreenReader] = useState(false);
    const [highContrast, setHighContrast] = useState(false);
    const [fontSize, setFontSize] = useState(1);

    return (
        <ScrollView style={styles.container}>
            <Card style={styles.card}>
                <List.Section>
                    <List.Subheader>Visual</List.Subheader>
                    <List.Item
                        title="High Contrast"
                        description="Increase visibility of text and icons"
                        right={() => <Switch value={highContrast} onValueChange={setHighContrast} color="#4CAF50" />}
                    />
                    <Divider />
                    <View style={styles.sliderContainer}>
                        <Text style={styles.label}>Font Size: {fontSize.toFixed(1)}x</Text>
                        <Slider
                            value={fontSize}
                            onValueChange={setFontSize}
                            minimumValue={0.8}
                            maximumValue={1.5}
                            step={0.1}
                            thumbTintColor="#4CAF50"
                            minimumTrackTintColor="#4CAF50"
                        />
                    </View>
                </List.Section>
            </Card>

            <Card style={styles.card}>
                <List.Section>
                    <List.Subheader>Assistive Technology</List.Subheader>
                    <List.Item
                        title="Screen Reader Support"
                        description="Optimize UI for screen readers"
                        right={() => <Switch value={screenReader} onValueChange={setScreenReader} color="#4CAF50" />}
                    />
                </List.Section>
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
    sliderContainer: {
        padding: 16,
    },
    label: {
        fontSize: 16,
        marginBottom: 10,
    },
});

export default AccessibilityScreen;
