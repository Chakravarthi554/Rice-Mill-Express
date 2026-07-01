// [Premium Figma-level Redesign — LoginScreen]
import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
    ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
    StatusBar, SafeAreaView,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Feather, Ionicons } from '@expo/vector-icons';
import { login } from '../../redux/slices/authSlice';

export default function LoginScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [emailFocused, setEmailFocused] = useState(false);
    const [passFocused, setPassFocused] = useState(false);

    const dispatch = useDispatch();
    const { loading, error } = useSelector((state) => state.auth);

    const handleLogin = async () => {
        if (!email || !password) { Alert.alert('Missing Fields', 'Please fill in all fields'); return; }
        try {
            const result = await dispatch(login({ email, password })).unwrap();
            if (result && result.requires2FA) { navigation.navigate('TwoFactorVerify', { userId: result.userId }); return; }
        } catch (error) {
            Alert.alert('Login Failed', error || 'An error occurred during login');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    {/* ── BRAND HEADER ── */}
                    <View style={styles.brandHeader}>
                        <View style={styles.logoCircle}>
                            <Text style={{ fontSize: 36 }}>🌾</Text>
                        </View>
                        <Text style={styles.brandName}>Rice Mill Express</Text>
                        <Text style={styles.brandTagline}>Premium Rice, Delivered to Your Door</Text>
                    </View>

                    {/* ── FORM CARD ── */}
                    <View style={styles.formCard}>
                        <Text style={styles.formTitle}>Welcome Back 👋</Text>
                        <Text style={styles.formSubtitle}>Sign in to your account to continue</Text>

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

                        {/* Password Input */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Password</Text>
                            <View style={[styles.inputContainer, passFocused && styles.inputFocused]}>
                                <View style={styles.inputIcon}>
                                    <Feather name="lock" size={18} color={passFocused ? '#16A34A' : '#9CA3AF'} />
                                </View>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter your password"
                                    placeholderTextColor="#9CA3AF"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                    onFocus={() => setPassFocused(true)}
                                    onBlur={() => setPassFocused(false)}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                    <Feather name={showPassword ? 'eye-off' : 'eye'} size={18} color="#9CA3AF" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Forgot */}
                        <TouchableOpacity style={styles.forgotBtn} onPress={() => navigation.navigate('ForgotPassword')}>
                            <Text style={styles.forgotText}>Forgot Password?</Text>
                        </TouchableOpacity>

                        {/* Error */}
                        {error && (
                            <View style={styles.errorBox}>
                                <Ionicons name="alert-circle" size={18} color="#EF4444" />
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        )}

                        {/* Login Button */}
                        <TouchableOpacity
                            style={[styles.loginBtn, loading && styles.loginBtnLoading]}
                            onPress={handleLogin}
                            disabled={loading}
                        >
                            {loading
                                ? <ActivityIndicator color="#fff" />
                                : <Text style={styles.loginBtnText}>Sign In</Text>
                            }
                        </TouchableOpacity>

                        {/* Divider */}
                        <View style={styles.dividerRow}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>OR</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        {/* Google Login */}
                        <TouchableOpacity style={styles.googleBtn}>
                            <Text style={styles.googleIcon}>🇬</Text>
                            <Text style={styles.googleBtnText}>Continue with Google</Text>
                        </TouchableOpacity>
                    </View>

                    {/* ── REGISTER LINK ── */}
                    <TouchableOpacity style={styles.registerRow} onPress={() => navigation.navigate('Register')}>
                        <Text style={styles.registerPrompt}>Don't have an account? </Text>
                        <Text style={styles.registerLink}>Create Account</Text>
                    </TouchableOpacity>

                    {/* Trust Badges */}
                    <View style={styles.trustRow}>
                        <View style={styles.trustItem}>
                            <Feather name="shield" size={14} color="#16A34A" />
                            <Text style={styles.trustText}>Secure Login</Text>
                        </View>
                        <View style={styles.trustDot} />
                        <View style={styles.trustItem}>
                            <Feather name="lock" size={14} color="#16A34A" />
                            <Text style={styles.trustText}>Encrypted</Text>
                        </View>
                        <View style={styles.trustDot} />
                        <View style={styles.trustItem}>
                            <Feather name="award" size={14} color="#16A34A" />
                            <Text style={styles.trustText}>Privacy First</Text>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    scrollContent: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 32 },

    brandHeader: { alignItems: 'center', paddingTop: 48, paddingBottom: 32 },
    logoCircle: {
        width: 80, height: 80, borderRadius: 28, backgroundColor: '#F0FDF4',
        alignItems: 'center', justifyContent: 'center', marginBottom: 16,
        borderWidth: 1, borderColor: '#D1FAE5',
        shadowColor: '#16A34A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 4,
    },
    brandName: { fontSize: 24, fontWeight: '800', color: '#111827', letterSpacing: -0.5, marginBottom: 6 },
    brandTagline: { fontSize: 14, color: '#6B7280', textAlign: 'center' },

    formCard: {
        backgroundColor: '#fff', borderRadius: 24, padding: 24,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 4,
        borderWidth: 1, borderColor: '#F3F4F6',
    },
    formTitle: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 6, letterSpacing: -0.3 },
    formSubtitle: { fontSize: 14, color: '#9CA3AF', marginBottom: 24 },

    inputGroup: { marginBottom: 16 },
    inputLabel: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 8 },
    inputContainer: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB',
        borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 16,
        paddingHorizontal: 14, paddingVertical: 14, gap: 10,
    },
    inputFocused: { borderColor: '#16A34A', backgroundColor: '#F0FDF4' },
    inputIcon: { width: 24, alignItems: 'center' },
    input: { flex: 1, fontSize: 15, color: '#111827', fontWeight: '500' },

    forgotBtn: { alignSelf: 'flex-end', marginBottom: 20 },
    forgotText: { color: '#F97316', fontSize: 13, fontWeight: '700' },

    errorBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', padding: 12, borderRadius: 12, marginBottom: 16, gap: 8 },
    errorText: { color: '#EF4444', flex: 1, fontSize: 13, fontWeight: '500' },

    loginBtn: {
        backgroundColor: '#16A34A', borderRadius: 50, paddingVertical: 17,
        alignItems: 'center', marginBottom: 20,
        shadowColor: '#16A34A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
    },
    loginBtnLoading: { backgroundColor: '#86EFAC', shadowOpacity: 0 },
    loginBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },

    dividerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 12 },
    dividerLine: { flex: 1, height: 1, backgroundColor: '#F3F4F6' },
    dividerText: { fontSize: 13, fontWeight: '700', color: '#D1D5DB' },

    googleBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 50, paddingVertical: 15, gap: 10,
        backgroundColor: '#fff',
    },
    googleIcon: { fontSize: 20 },
    googleBtnText: { fontSize: 16, fontWeight: '600', color: '#374151' },

    registerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 28 },
    registerPrompt: { fontSize: 15, color: '#6B7280' },
    registerLink: { fontSize: 15, fontWeight: '800', color: '#16A34A' },

    trustRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 24, gap: 12 },
    trustItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    trustText: { fontSize: 11, color: '#9CA3AF', fontWeight: '600' },
    trustDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#D1D5DB' },
});
