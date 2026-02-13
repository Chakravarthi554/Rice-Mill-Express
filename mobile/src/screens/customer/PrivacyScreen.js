import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Card, Title, List, Switch, Divider, Button, Paragraph } from 'react-native-paper';

import { useDispatch, useSelector } from 'react-redux';
import { updatePrivacy, resetSettingsStatus } from '../../redux/slices/settingsSlice';
import { apiService } from '../../services/api';
import { logout } from '../../redux/slices/authSlice';

const PrivacyScreen = ({ navigation }) => {
    const dispatch = useDispatch();
    const { privacy = {}, loading, success } = useSelector((state) => state.settings);

    const [profileVisible, setProfileVisible] = useState(privacy?.profileVisible ?? true);
    const [showActivity, setShowActivity] = useState(privacy?.showActivity ?? true);
    const [marketingEmails, setMarketingEmails] = useState(false);

    useEffect(() => {
        if (success) {
            dispatch(resetSettingsStatus());
        }
    }, [success, dispatch]);

    const handleToggle = (key, value) => {
        if (key === 'profileVisible') setProfileVisible(value);
        if (key === 'showActivity') setShowActivity(value);

        dispatch(updatePrivacy({
            ...privacy,
            [key]: value
        }));
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            'Delete Account',
            'Are you sure you want to permanently delete your account? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await apiService.deleteAccount();
                            Alert.alert('Success', 'Your account has been deleted.');
                            dispatch(logout());
                        } catch (err) {
                            Alert.alert('Error', 'Failed to delete account. Please try again.');
                        }
                    }
                }
            ]
        );
    };

    const handleDownloadData = async () => {
        Alert.alert('Request Received', 'A link to download your data will be sent to your email shortly.');
    };

    return (
        <ScrollView style={styles.container}>
            <Card style={styles.card}>
                <List.Section>
                    <List.Subheader>Visibility</List.Subheader>
                    <List.Item
                        title="Public Profile"
                        description="Allow others to see your name in forum"
                        right={() => <Switch value={profileVisible} onValueChange={(v) => handleToggle('profileVisible', v)} color="#4CAF50" />}
                    />
                    <Divider />
                    <List.Item
                        title="Show Activity"
                        description="Let friends see what you're buying"
                        right={() => <Switch value={showActivity} onValueChange={(v) => handleToggle('showActivity', v)} color="#4CAF50" />}
                    />
                </List.Section>
            </Card>

            <Card style={styles.card}>
                <List.Section>
                    <List.Subheader>Marketing & Data</List.Subheader>
                    <List.Item
                        title="Marketing Emails"
                        description="Receive offers and updates"
                        right={() => <Switch value={marketingEmails} onValueChange={setMarketingEmails} color="#4CAF50" />}
                    />
                    <Divider />
                    <List.Item
                        title="Download Data"
                        description="Access all your personal data"
                        onPress={handleDownloadData}
                    />
                </List.Section>
            </Card>

            <Card style={[styles.card, styles.dangerCard]}>
                <Card.Content>
                    <Title style={styles.dangerTitle}>Danger Zone</Title>
                    <Paragraph>Delete your account and all associated data permanently.</Paragraph>
                    <Button
                        mode="outlined"
                        textColor="#F44336"
                        onPress={handleDeleteAccount}
                        style={styles.deleteButton}
                        loading={loading}
                    >
                        Delete Account
                    </Button>
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
    dangerCard: {
        borderColor: '#FFEBEE',
        borderWidth: 1,
    },
    dangerTitle: {
        color: '#F44336',
    },
    deleteButton: {
        marginTop: 10,
        borderColor: '#F44336',
    },
});

export default PrivacyScreen;
