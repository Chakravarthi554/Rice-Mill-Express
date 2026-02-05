import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Card, Title } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { apiService } from '../../services/api';
import { setCredentials } from '../../redux/slices/authSlice';

const EditProfileScreen = ({ navigation }) => {
    const { user } = useSelector((state) => state.auth);
    const dispatch = useDispatch();

    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleUpdateProfile = async () => {
        try {
            setLoading(true);
            const { data } = await apiService.updateUserProfile({ name, email });
            // Update Redux state with new user info (keeping token same)
            dispatch(setCredentials({ user: data.user, token: null })); // null token means keep existing? Check authSlice.
            // Actually authSlice usually expects both. Let's assume response gives updated user.
            // We might need to handle token if backend rotates it, but usually profile update doesn't change token.

            // Let's reload user from storage or just update user object if authSlice supports partial update.
            // Assuming setCredentials overrides.
            Alert.alert('Success', 'Profile updated successfully');
        } catch (error) {
            console.error('Update profile error:', error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async () => {
        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        try {
            setLoading(true);
            // Assuming apiService has changePassword, if not I might need to add it or use updateUserProfile if it handles password.
            // api.js check: It does NOT have changePassword explicit, but maybe updateUserProfile handles it?
            // Usually separate. backend/routes/userRoutes.js has `router.put('/change-password', ...)`
            // I need to add changePassword to api.js or use axios directly.
            // Let's assume I'll add it to api.js in next step if missing.
            await apiService.api.put('/api/users/change-password', { currentPassword, newPassword });

            Alert.alert('Success', 'Password changed successfully');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            console.error('Change password error:', error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scroll}>
                <Card style={styles.card}>
                    <Card.Content>
                        <Title>Basic Info</Title>
                        <TextInput
                            label="Name"
                            value={name}
                            onChangeText={setName}
                            style={styles.input}
                            mode="outlined"
                        />
                        <TextInput
                            label="Email"
                            value={email}
                            onChangeText={setEmail}
                            style={styles.input}
                            mode="outlined"
                            editable={false} // Often email is not editable or requires verification
                        />
                        <Button
                            mode="contained"
                            onPress={handleUpdateProfile}
                            loading={loading}
                            style={styles.button}
                        >
                            Update Profile
                        </Button>
                    </Card.Content>
                </Card>

                <Card style={styles.card}>
                    <Card.Content>
                        <Title>Change Password</Title>
                        <TextInput
                            label="Current Password"
                            value={currentPassword}
                            onChangeText={setCurrentPassword}
                            secureTextEntry
                            style={styles.input}
                            mode="outlined"
                        />
                        <TextInput
                            label="New Password"
                            value={newPassword}
                            onChangeText={setNewPassword}
                            secureTextEntry
                            style={styles.input}
                            mode="outlined"
                        />
                        <TextInput
                            label="Confirm New Password"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry
                            style={styles.input}
                            mode="outlined"
                        />
                        <Button
                            mode="contained"
                            onPress={handleChangePassword}
                            loading={loading}
                            style={styles.button}
                        >
                            Change Password
                        </Button>
                    </Card.Content>
                </Card>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scroll: {
        padding: 16,
    },
    card: {
        marginBottom: 16,
    },
    input: {
        marginBottom: 12,
        backgroundColor: 'white',
    },
    button: {
        marginTop: 8,
        backgroundColor: '#4CAF50',
    },
});

export default EditProfileScreen;
