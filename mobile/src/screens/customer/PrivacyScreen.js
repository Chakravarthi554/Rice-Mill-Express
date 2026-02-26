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

    const [profileVisible, setProfileVisible] = useState(true);
    const [showActivity, setShowActivity] = useState(true);
    const [marketingEmails, setMarketingEmails] = useState(false);
    const [fetching, setFetching] = useState(true);

    useEffect(() => {
        const fetchPrivacy = async () => {
            try {
                const response = await apiService.getPrivacySettings();
                const settings = response.data;
                setProfileVisible(settings.profileVisible ?? true);
                setShowActivity(settings.showActivity ?? true);
                setMarketingEmails(settings.marketingEmails ?? false);
            } catch (err) {
                console.error('Failed to fetch privacy settings:', err);
            } finally {
                setFetching(false);
            }
        };
        fetchPrivacy();
    }, []);

    useEffect(() => {
        if (success) {
            dispatch(resetSettingsStatus());
        }
    }, [success, dispatch]);

    const handleToggle = async (key, value) => {
        // Optimistic update
        if (key === 'profileVisible') setProfileVisible(value);
        if (key === 'showActivity') setShowActivity(value);
        if (key === 'marketingEmails') setMarketingEmails(value);

        try {
            const response = await apiService.updatePrivacySettings({ [key]: value });

            // ✅ Permanently update auth user state and storage
            const userInfoStr = await AsyncStorage.getItem('userInfo');
            if (userInfoStr) {
                const userInfo = JSON.parse(userInfoStr);
                const newUserInfo = {
                    ...userInfo,
                    privacySettings: {
                        ...(userInfo.privacySettings || {}),
                        [key]: value
                    }
                };

                // Update Redux
                dispatch(setUser(newUserInfo));

                // Update Storage
                await AsyncStorage.setItem('userInfo', JSON.stringify(newUserInfo));
            }
        } catch (err) {
            // Revert on error
            if (key === 'profileVisible') setProfileVisible(!value);
            if (key === 'showActivity') setShowActivity(!value);
            if (key === 'marketingEmails') setMarketingEmails(!value);
            Alert.alert('Error', 'Failed to update privacy settings');
        }
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
                    onPress: () => {
                        // If it's a social user, we can delete directly. 
                        // If it's email user, we might need a password prompt.
                        // For simplicity in UI, we'll try to delete and handle potential 400 error.
                        const performDelete = async (pwd) => {
                            try {
                                await apiService.deleteAccount(pwd);
                                Alert.alert('Success', 'Your account has been deleted.');
                                dispatch(logout());
                            } catch (err) {
                                if (err.response?.status === 400 && !pwd) {
                                    // Password required
                                    Alert.prompt(
                                        'Password Required',
                                        'Please enter your password to confirm deletion',
                                        [
                                            { text: 'Cancel', style: 'cancel' },
                                            { text: 'Confirm', onPress: (val) => performDelete(val) }
                                        ],
                                        'secure-text'
                                    );
                                } else {
                                    Alert.alert('Error', err.response?.data?.message || 'Failed to delete account');
                                }
                            }
                        };
                        performDelete();
                    }
                }
            ]
        );
    };

    const handleDownloadData = async () => {
        try {
            await apiService.exportUserData();
            Alert.alert('Success', 'A summary of your data has been sent to your email.');
        } catch (err) {
            Alert.alert('Error', 'Failed to request data export');
        }
    };

    return (
        <ScrollView style={styles.container}>
            <Card style={styles.card}>
                <List.Section>
                    <List.Subheader>Visibility</List.Subheader>
                    <List.Item
                        title="Public Profile Visibility"
                        description="Visible in recipes, forum posts, and reviews"
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
                        right={() => <Switch value={marketingEmails} onValueChange={(v) => handleToggle('marketingEmails', v)} color="#4CAF50" />}
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
