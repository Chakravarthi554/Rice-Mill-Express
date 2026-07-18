import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
    ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
    StatusBar, SafeAreaView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
// Try importing Firebase auth
import { auth } from '../../config/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';

export default function ForgotPasswordScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [emailFocused, setEmailFocused] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleResetPassword = async () => {
        if (!email) { 
            Alert.alert('Missing Field', 'Please enter your email address'); 
            return; 
        }

        try {
            setLoading(true);
            if (auth) {
                // Call Firebase password reset
                await sendPasswordResetEmail(auth, email);
                Alert.alert('Success', 'If this email is registered, a password reset link has been sent to your inbox.');
                navigation.navigate('Login');
            } else {
                Alert.alert('TODO', 'Connect to password reset API endpoint');
            }
        } catch (error) {
            if (error.code === 'auth/user-not-found') {
                // Prevent user enumeration by showing the same generic success message
                Alert.alert('Success', 'If this email is registered, a password reset link has been sent to your inbox.');
                navigation.navigate('Login');
            } else if (error.code === 'auth/invalid-email') {
                Alert.alert('Invalid Email', 'Please enter a valid email address format.');
            } else {
                Alert.alert('Request Failed', 'An error occurred while requesting password reset. Please try again later.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    {/* ── HEADER ── */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                            <Feather name="arrow-left" size={24} color="#1F2937" />
                        </TouchableOpacity>
                    </View>

                    {/* ── BRAND LOGO ── */}
                    <View style={styles.brandHeader}>
                        <View style={styles.logoCircle}>
                            <Feather name="key" size={32} color="#16A34A" />
                        </View>
                    </View>

                    {/* ── FORM CARD ── */}
                    <View style={styles.formCard}>
                        <Text style={styles.formTitle}>Forgot Password?</Text>
                        <Text style={styles.formSubtitle}>Enter your email address and we'll send you a link to reset your password.</Text>

                        {/* Email Input */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Email Address</Text>
                            <View style={[styles.inputContainer, emailFocused && styles.inputFocused]}>
                                <View style={styles.inputIcon}>
                                    <Feather name="mail" size={18} color={emailFocused ? '#16A34A' : '#9CA3AF'} />
                                </View>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter your email"
                                    placeholderTextColor="#9CA3AF"
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                    onFocus={() => setEmailFocused(true)}
                                    onBlur={() => setEmailFocused(false)}
                                />
                                {email.length > 0 && (
                                    <TouchableOpacity onPress={() => setEmail('')}>
                                        <Feather name="x-circle" size={16} color="#9CA3AF" />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>

                        {/* Submit Button */}
                        <TouchableOpacity
                            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                            onPress={handleResetPassword}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.loginButtonText}>Send Reset Link</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollContent: {
        flexGrow: 1,
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    brandHeader: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 30,
    },
    logoCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#F0FDF4',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#DCFCE7',
    },
    formCard: {
        backgroundColor: '#fff',
        paddingHorizontal: 24,
        paddingTop: 10,
        flex: 1,
    },
    formTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#1F2937',
        marginBottom: 8,
    },
    formSubtitle: {
        fontSize: 15,
        color: '#6B7280',
        lineHeight: 22,
        marginBottom: 32,
    },
    inputGroup: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        height: 56,
        paddingHorizontal: 16,
    },
    inputFocused: {
        borderColor: '#16A34A',
        backgroundColor: '#fff',
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        height: '100%',
        fontSize: 16,
        color: '#1F2937',
    },
    loginButton: {
        backgroundColor: '#16A34A',
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        shadowColor: '#16A34A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    loginButtonDisabled: {
        backgroundColor: '#9CA3AF',
        shadowOpacity: 0,
        elevation: 0,
    },
    loginButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    }
});
