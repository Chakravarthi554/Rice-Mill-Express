import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TextInput } from 'react-native';
import { Card, Button, Title, List, Switch, Divider } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';

const SecurityScreen = () => {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [twoFactor, setTwoFactor] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleChangePassword = () => {
        if (!oldPassword || !newPassword || !confirmPassword) {
            Alert.alert('Error', 'Please fill all password fields');
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'New passwords do not match');
            return;
        }

        setLoading(true);
        // Simulate API call
        setTimeout(() => {
            setLoading(false);
            Alert.alert('Success', 'Password changed successfully');
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
        }, 1500);
    };

    return (
        <ScrollView style={styles.container}>
            <Card style={styles.card}>
                <Card.Content>
                    <Title>Change Password</Title>
                    <Divider style={styles.divider} />

                    <Text style={styles.label}>Old Password</Text>
                    <TextInput
                        style={styles.input}
                        secureTextEntry
                        value={oldPassword}
                        onChangeText={setOldPassword}
                    />

                    <Text style={styles.label}>New Password</Text>
                    <TextInput
                        style={styles.input}
                        secureTextEntry
                        value={newPassword}
                        onChangeText={setNewPassword}
                    />

                    <Text style={styles.label}>Confirm New Password</Text>
                    <TextInput
                        style={styles.input}
                        secureTextEntry
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                    />

                    <Button
                        mode="contained"
                        onPress={handleChangePassword}
                        loading={loading}
                        style={styles.button}
                    >
                        Update Password
                    </Button>
                </Card.Content>
            </Card>

            <Card style={styles.card}>
                <List.Section>
                    <List.Subheader>Additional Security</List.Subheader>
                    <List.Item
                        title="Two-Factor Authentication"
                        description="Keep your account extra secure"
                        left={props => <List.Icon {...props} icon="shield-lock" />}
                        right={() => <Switch value={twoFactor} onValueChange={setTwoFactor} color="#4CAF50" />}
                    />
                    <Divider />
                    <List.Item
                        title="Login Activity"
                        description="View where you're logged in"
                        left={props => <List.Icon {...props} icon="history" />}
                        onPress={() => Alert.alert('Coming Soon', 'Login activity log is under development.')}
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
    divider: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#666',
        marginTop: 10,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 10,
        marginVertical: 8,
        backgroundColor: '#fff',
    },
    button: {
        marginTop: 10,
        backgroundColor: '#4CAF50',
    },
});

export default SecurityScreen;
