import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { MaterialIcons } from '@expo/vector-icons';
import { apiService } from '../../services/api';
import { setCredentials } from '../../redux/slices/authSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function TwoFactorVerifyScreen({ route, navigation }) {
    const { userId } = route.params;
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();

    const handleVerify = async () => {
        if (otp.length !== 4) {
            Alert.alert('Error', 'Please enter a 4-digit OTP');
            return;
        }

        setLoading(true);
        try {
            const response = await apiService.verify2FA({ userId, otp });
            const data = response.data;

            // Save token
            await AsyncStorage.setItem('userToken', data.accessToken);

            // Update Redux
            dispatch(setCredentials(data));

            Alert.alert('Success', 'Login successful!');
            // App.js will handle navigation based on auth state
        } catch (error) {
            Alert.alert('Verification Failed', error.response?.data?.message || 'Invalid OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        try {
            await apiService.resendOtp({ userId });
            Alert.alert('Success', 'OTP has been resent to your contact.');
        } catch (error) {
            Alert.alert('Error', 'Failed to resend OTP');
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <MaterialIcons name="security" size={80} color="#4CAF50" />
                    <Text style={styles.title}>2FA Verification</Text>
                    <Text style={styles.subtitle}>Enter the 4-digit code sent to you</Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="0 0 0 0"
                            value={otp}
                            onChangeText={setOtp}
                            keyboardType="number-pad"
                            maxLength={4}
                            autoFocus
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleVerify}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Verify & Login</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.linkButton}
                        onPress={handleResend}
                    >
                        <Text style={styles.linkText}>
                            Didn't receive code? <Text style={styles.linkTextBold}>Resend</Text>
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.linkButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.linkText}>Back to Login</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#4CAF50',
        marginTop: 20,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginTop: 8,
        textAlign: 'center',
    },
    form: {
        width: '100%',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 15,
        marginBottom: 20,
        backgroundColor: '#f9f9f9',
    },
    input: {
        flex: 1,
        paddingVertical: 15,
        fontSize: 24,
        textAlign: 'center',
        letterSpacing: 20,
        fontWeight: 'bold',
    },
    button: {
        backgroundColor: '#4CAF50',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonDisabled: {
        backgroundColor: '#a5d6a7',
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    linkButton: {
        marginTop: 20,
        alignItems: 'center',
    },
    linkText: {
        color: '#666',
        fontSize: 16,
    },
    linkTextBold: {
        color: '#4CAF50',
        fontWeight: 'bold',
    },
});
