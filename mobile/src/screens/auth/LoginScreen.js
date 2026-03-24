// [AI: Premium Mobile Polish - Rounded inputs, pill buttons, high-contrast]
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { login } from '../../redux/slices/authSlice';

export default function LoginScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const dispatch = useDispatch();
    const { loading, error } = useSelector((state) => state.auth);

    const handleLogin = async () => {
        if (!email || !password) { Alert.alert('Error', 'Please fill in all fields'); return; }
        try {
            const result = await dispatch(login({ email, password })).unwrap();
            if (result && result.requires2FA) { navigation.navigate('TwoFactorVerify', { userId: result.userId }); return; }
        } catch (error) {
            Alert.alert('Login Failed', error || 'An error occurred during login');
        }
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                
                <View style={styles.header}>
                    <View style={styles.iconBox}>
                        <Text style={{ fontSize: 40 }}>🌾</Text>
                    </View>
                    <Text style={styles.title}>Welcome Back</Text>
                    <Text style={styles.subtitle}>Sign in to access your premium rice market</Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputContainer}>
                        <Feather name="mail" size={20} color="#9CA3AF" style={styles.icon} />
                        <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#9CA3AF" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
                    </View>

                    <View style={styles.inputContainer}>
                        <Feather name="lock" size={20} color="#9CA3AF" style={styles.icon} />
                        <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#9CA3AF" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
                            <Feather name={showPassword ? 'eye-off' : 'eye'} size={20} color="#9CA3AF" />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={styles.forgotButton}>
                        <Text style={styles.forgotText}>Forgot Password?</Text>
                    </TouchableOpacity>

                    {error && (
                        <View style={styles.errorContainer}>
                            <Feather name="alert-circle" size={18} color="#EF4444" />
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    )}

                    <TouchableOpacity style={[styles.mainButton, loading && styles.buttonDisabled]} onPress={handleLogin} disabled={loading}>
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Log In</Text>}
                    </TouchableOpacity>

                    <View style={styles.dividerContainer}>
                        <View style={styles.divider} />
                        <Text style={styles.dividerText}>OR</Text>
                        <View style={styles.divider} />
                    </View>

                    <TouchableOpacity style={styles.outlineButton}>
                        <Text style={styles.outlineButtonText}>Continue with Google</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.linkButton} onPress={() => navigation.navigate('Register')}>
                        <Text style={styles.linkText}>Don't have an account? <Text style={styles.linkTextBold}>Sign Up</Text></Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    scrollContent: { flexGrow: 1, padding: 24, justifyContent: 'center' },
    header: { alignItems: 'center', marginBottom: 40, marginTop: 20 },
    iconBox: { width: 80, height: 80, backgroundColor: '#F0FDF4', borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
    title: { fontSize: 28, fontWeight: '800', color: '#111827', marginBottom: 8 },
    subtitle: { fontSize: 16, color: '#6B7280', textAlign: 'center' },
    form: { width: '100%' },
    inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 16, paddingHorizontal: 16, marginBottom: 16, height: 56 },
    icon: { marginRight: 12 },
    input: { flex: 1, fontSize: 16, color: '#111827', height: '100%' },
    forgotButton: { alignSelf: 'flex-end', marginBottom: 24 },
    forgotText: { color: '#F97316', fontSize: 14, fontWeight: '600' },
    errorContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', padding: 12, borderRadius: 12, marginBottom: 20 },
    errorText: { color: '#EF4444', marginLeft: 8, flex: 1, fontSize: 14, fontWeight: '500' },
    mainButton: { backgroundColor: '#16A34A', height: 56, borderRadius: 50, alignItems: 'center', justifyContent: 'center', shadowColor: '#16A34A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
    buttonDisabled: { backgroundColor: '#86EFAC', shadowOpacity: 0 },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    dividerContainer: { flexDirection: 'row', alignItems: 'center', my: 24, marginVertical: 30 },
    divider: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
    dividerText: { marginHorizontal: 16, color: '#9CA3AF', fontSize: 14, fontWeight: '600' },
    outlineButton: { height: 56, borderRadius: 50, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
    outlineButtonText: { color: '#374151', fontSize: 16, fontWeight: '600' },
    linkButton: { marginTop: 32, alignItems: 'center' },
    linkText: { color: '#6B7280', fontSize: 15 },
    linkTextBold: { color: '#F97316', fontWeight: '700' },
});
