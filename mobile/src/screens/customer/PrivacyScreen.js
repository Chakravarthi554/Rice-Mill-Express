import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Card, Title, List, Switch, Divider, Button, Paragraph } from 'react-native-paper';

const PrivacyScreen = () => {
    const [profileVisible, setProfileVisible] = useState(true);
    const [showActivity, setShowActivity] = useState(true);
    const [marketingEmails, setMarketingEmails] = useState(false);

    const handleDeleteAccount = () => {
        Alert.alert(
            'Delete Account',
            'Are you sure you want to permanently delete your account? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => Alert.alert('Request Sent', 'Your account deletion request has been submitted for verification.') }
            ]
        );
    };

    return (
        <ScrollView style={styles.container}>
            <Card style={styles.card}>
                <List.Section>
                    <List.Subheader>Visibility</List.Subheader>
                    <List.Item
                        title="Public Profile"
                        description="Allow others to see your name in forum"
                        right={() => <Switch value={profileVisible} onValueChange={setProfileVisible} color="#4CAF50" />}
                    />
                    <Divider />
                    <List.Item
                        title="Show Activity"
                        description="Let friends see what you're buying"
                        right={() => <Switch value={showActivity} onValueChange={setShowActivity} color="#4CAF50" />}
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
                        onPress={() => Alert.alert('Coming Soon', 'Data export feature is coming soon.')}
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
