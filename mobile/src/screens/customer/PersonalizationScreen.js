import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Card, Title, List, Switch, Divider, RadioButton, TextInput, Button as PaperButton } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { updatePersonalization, resetSettingsStatus } from '../../redux/slices/settingsSlice';

const PersonalizationScreen = () => {
    const dispatch = useDispatch();
    const { personalization = {}, loading, success } = useSelector((state) => state.settings);

    const [dashboardLayout, setDashboardLayout] = useState('grid');
    const [bio, setBio] = useState(personalization?.bio || '');
    const [tagline, setTagline] = useState(personalization?.tagline || '');

    useEffect(() => {
        if (success) {
            dispatch(resetSettingsStatus());
        }
    }, [success, dispatch]);

    const handleSave = () => {
        dispatch(updatePersonalization({
            bio,
            tagline
        }));
    };

    return (
        <ScrollView style={styles.container}>
            <Card style={styles.card}>
                <Card.Content>
                    <Title>Bio & Tagline</Title>
                    <Divider style={styles.divider} />
                    <TextInput
                        label="Tagline"
                        value={tagline}
                        onChangeText={setTagline}
                        mode="outlined"
                        placeholder="A short tagline about yourself"
                        style={{ marginBottom: 16 }}
                    />
                    <TextInput
                        label="Bio"
                        value={bio}
                        onChangeText={setBio}
                        mode="outlined"
                        multiline
                        numberOfLines={4}
                        placeholder="Tell us a bit about yourself"
                    />
                </Card.Content>
            </Card>

            <Card style={styles.card}>
                <Card.Content>
                    <Title>Dashboard Layout</Title>
                    <Divider style={styles.divider} />
                    <RadioButton.Group onValueChange={setDashboardLayout} value={dashboardLayout}>
                        <View style={styles.radioRow}>
                            <RadioButton value="grid" color="#4CAF50" />
                            <Text>Grid View (Compact)</Text>
                        </View>
                        <View style={styles.radioRow}>
                            <RadioButton value="list" color="#4CAF50" />
                            <Text>List View (Detailed)</Text>
                        </View>
                    </RadioButton.Group>
                </Card.Content>
            </Card>

            <View style={{ padding: 16 }}>
                <PaperButton
                    mode="contained"
                    onPress={handleSave}
                    loading={loading}
                    style={{ backgroundColor: '#4CAF50' }}
                >
                    Save Personalization
                </PaperButton>
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
        marginBottom: 10,
    },
    radioRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
});

export default PersonalizationScreen;
