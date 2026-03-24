// [AI: Premium Mobile Polish - Rounded inputs, pill buttons, high-contrast]
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { useDispatch, useSelector } from 'react-redux';
import { Feather } from '@expo/vector-icons';
import { register } from '../../redux/slices/authSlice';

export default function RegisterScreen({ navigation }) {
    const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '', phone: '', role: 'customer', referralCode: '' });
    const [showPassword, setShowPassword] = useState(false);

    const dispatch = useDispatch();
    const { loading } = useSelector((state) => state.auth);

    const handleRegister = async () => {
        const { name, email, password, confirmPassword, phone, role, referralCode } = formData;
        if (!name || !email || !password || !phone) { Alert.alert('Error', 'Please fill in all fields'); return; }
        if (password !== confirmPassword) { Alert.alert('Error', 'Passwords do not match'); return; }
        if (password.length < 6) { Alert.alert('Error', 'Password must be at least 6 characters'); return; }

        try {
            let deviceId = await AsyncStorage.getItem('deviceFingerprint');
            if (!deviceId) {
                deviceId = `mobile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                await AsyncStorage.setItem('deviceFingerprint', deviceId);
            }
            await dispatch(register({ name, email, password, phone, role, referralCode, deviceId })).unwrap();
            Alert.alert('Success', 'Account created successfully! Please login.', [{ text: 'OK', onPress: () => navigation.navigate('Login') }]);
        } catch (error) {
            Alert.alert('Registration Failed', error || 'An error occurred during registration');
        }
    };

    const updateFormData = (field, value) => setFormData({ ...formData, [field]: value });

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                
                <View style={styles.header}>
                    <View style={styles.iconBox}>
                        <Text style={{ fontSize: 36 }}>✨</Text>
                    </View>
                    <Text style={styles.title}>Join Us</Text>
                    <Text style={styles.subtitle}>Create your Rice Mill account</Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputContainer}>
                        <Feather name="user" size={20} color="#9CA3AF" style={styles.icon} />
                        <TextInput style={styles.input} placeholder="Full Name" placeholderTextColor="#9CA3AF" value={formData.name} onChangeText={(v) => updateFormData('name', v)} autoCapitalize="words" />
                    </View>

                    <View style={styles.inputContainer}>
                        <Feather name="mail" size={20} color="#9CA3AF" style={styles.icon} />
                        <TextInput style={styles.input} placeholder="Email Address" placeholderTextColor="#9CA3AF" value={formData.email} onChangeText={(v) => updateFormData('email', v)} autoCapitalize="none" keyboardType="email-address" />
                    </View>

                    <View style={styles.inputContainer}>
                        <Feather name="phone" size={20} color="#9CA3AF" style={styles.icon} />
                        <TextInput style={styles.input} placeholder="Phone Number" placeholderTextColor="#9CA3AF" value={formData.phone} onChangeText={(v) => updateFormData('phone', v)} keyboardType="phone-pad" />
                    </View>

                    <View style={styles.inputContainer}>
                        <Feather name="lock" size={20} color="#9CA3AF" style={styles.icon} />
                        <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#9CA3AF" value={formData.password} onChangeText={(v) => updateFormData('password', v)} secureTextEntry={!showPassword} />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
                            <Feather name={showPassword ? 'eye-off' : 'eye'} size={20} color="#9CA3AF" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.inputContainer}>
                        <Feather name="shield" size={20} color="#9CA3AF" style={styles.icon} />
                        <TextInput style={styles.input} placeholder="Confirm Password" placeholderTextColor="#9CA3AF" value={formData.confirmPassword} onChangeText={(v) => updateFormData('confirmPassword', v)} secureTextEntry={!showPassword} />
                    </View>

                    <View style={styles.pickerContainer}>
                        <Feather name="briefcase" size={20} color="#9CA3AF" style={styles.icon} />
                        <Picker selectedValue={formData.role} style={styles.picker} onValueChange={(v) => updateFormData('role', v)}>
                            <Picker.Item label="Customer" value="customer" color="#111827" />
                            <Picker.Item label="Seller" value="seller" color="#111827" />
                            <Picker.Item label="Delivery Partner" value="deliveryPartner" color="#111827" />
                        </Picker>
                    </View>

                    <View style={styles.inputContainer}>
                        <Feather name="gift" size={20} color="#F97316" style={styles.icon} />
                        <TextInput style={styles.input} placeholder="Referral Code (Optional)" placeholderTextColor="#9CA3AF" value={formData.referralCode} onChangeText={(v) => updateFormData('referralCode', v)} autoCapitalize="characters" />
                    </View>

                    <TouchableOpacity style={[styles.mainButton, loading && styles.buttonDisabled]} onPress={handleRegister} disabled={loading}>
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create Account</Text>}
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.linkButton} onPress={() => navigation.navigate('Login')}>
                        <Text style={styles.linkText}>Already have an account? <Text style={styles.linkTextBold}>Log In</Text></Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    scrollContent: { flexGrow: 1, padding: 24, paddingTop: 40, paddingBottom: 60 },
    header: { alignItems: 'center', marginBottom: 32 },
    iconBox: { width: 72, height: 72, backgroundColor: '#FFF7ED', borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
    title: { fontSize: 28, fontWeight: '800', color: '#111827', marginBottom: 6 },
    subtitle: { fontSize: 16, color: '#6B7280' },
    form: { width: '100%' },
    inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 16, paddingHorizontal: 16, marginBottom: 16, height: 56 },
    pickerContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 16, paddingHorizontal: 16, marginBottom: 16, height: 56, overflow: 'hidden' },
    icon: { marginRight: 12 },
    input: { flex: 1, fontSize: 16, color: '#111827', height: '100%' },
    picker: { flex: 1, height: 50 },
    mainButton: { backgroundColor: '#16A34A', height: 56, borderRadius: 50, alignItems: 'center', justifyContent: 'center', shadowColor: '#16A34A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4, marginTop: 12 },
    buttonDisabled: { backgroundColor: '#86EFAC', shadowOpacity: 0 },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    linkButton: { marginTop: 24, alignItems: 'center' },
    linkText: { color: '#6B7280', fontSize: 15 },
    linkTextBold: { color: '#16A34A', fontWeight: '700' },
});
