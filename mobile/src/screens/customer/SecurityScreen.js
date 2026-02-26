import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TextInput } from 'react-native';
import { Card, Button, Title, List, Switch, Divider } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { apiService } from '../../services/api';
import { logout } from '../../redux/slices/authSlice';

const SecurityScreen = () => {
    const dispatch = useDispatch();
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [twoFactor, setTwoFactor] = useState(false);
    const [loginHistory, setLoginHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    const { user: userInfo } = useSelector(state => state.auth);

    React.useEffect(() => {
        const fetchSecuritySettings = async () => {
            try {
                const [historyRes, profileRes] = await Promise.all([
                    apiService.getLoginHistory(),
                    apiService.getUserProfile()
                ]);
                setLoginHistory(historyRes.data);
                setTwoFactor(profileRes.data.twoFactorEnabled);
            } catch (err) {
                console.error('Failed to fetch security settings:', err);
            } finally {
                setInitialLoading(false);
            }
        };

        fetchSecuritySettings();
    }, []);

    const handleToggle2FA = async (value) => {
        try {
            setTwoFactor(value);
            await apiService.toggleTwoFactor(value);
        } catch (err) {
            setTwoFactor(!value);
            Alert.alert('Error', 'Failed to update 2FA settings');
        }
    };

    const handleChangePassword = async () => {
        if (!oldPassword || !newPassword || !confirmPassword) {
            Alert.alert('Error', 'Please fill all password fields');
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'New passwords do not match');
            return;
        }
        if (newPassword.length < 8) {
            Alert.alert('Error', 'New password must be at least 8 characters long');
            return;
        }

        setLoading(true);
        try {
            const response = await apiService.changePassword({ currentPassword: oldPassword, newPassword });

            Alert.alert(
                'Success',
                response.data.message || 'Password changed successfully. You need to login again with your new password.',
                [{
                    text: 'OK',
                    onPress: () => {
                        dispatch(logout()); // Force logout on mobile
                    }
                }]
            );

            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            Alert.alert('Error', err.response?.data?.message || 'Failed to change password');
        } finally {
            setLoading(false);
        }
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
                        right={() => <Switch value={twoFactor} onValueChange={handleToggle2FA} color="#4CAF50" />}
                    />
                    <Divider />
                    <List.Accordion
                        title="Recent Login Activity"
                        description="View where you're logged in"
                        left={props => <List.Icon {...props} icon="history" />}
                    >
                        {loginHistory.length === 0 ? (
                            <List.Item title="No recent activity" />
                        ) : (
                            loginHistory.map((login, index) => (
                                <List.Item
                                    key={index}
                                    title={`${login.status === 'success' ? '✅' : '❌'} ${new Date(login.timestamp).toLocaleString()}`}
                                    description={`Device: ${login.device}\nIP: ${login.ip}`}
                                    descriptionNumberOfLines={3}
                                />
                            ))
                        )}
                    </List.Accordion>
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
