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
    SafeAreaView,
    StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { useDispatch, useSelector } from 'react-redux';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { register } from '../../redux/slices/authSlice';
import { COLORS, COMPONENTS, RADIUS, SHADOW, SPACING, TYPOGRAPHY } from '../../styles/customerTheme';

const ROLE_OPTIONS = [
    { label: 'Customer', value: 'customer' },
    { label: 'Seller', value: 'seller' },
    { label: 'Delivery Partner', value: 'deliveryPartner' },
];

export default function RegisterScreen({ navigation }) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        role: 'customer',
        referralCode: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [focusedField, setFocusedField] = useState('');

    const dispatch = useDispatch();
    const { loading } = useSelector((state) => state.auth);

    const handleRegister = async () => {
        const { name, email, password, confirmPassword, phone, role, referralCode } = formData;
        if (!name || !email || !password || !phone) {
            Alert.alert('Missing Fields', 'Please complete all required details.');
            return;
        }
        if (password !== confirmPassword) {
            Alert.alert('Password Mismatch', 'Password and confirm password should match.');
            return;
        }
        if (password.length < 6) {
            Alert.alert('Weak Password', 'Password must be at least 6 characters long.');
            return;
        }

        try {
            let deviceId = await AsyncStorage.getItem('deviceFingerprint');
            if (!deviceId) {
                deviceId = `mobile-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
                await AsyncStorage.setItem('deviceFingerprint', deviceId);
            }

            await dispatch(register({ name, email, password, phone, role, referralCode, deviceId })).unwrap();
            Alert.alert('Account Created', 'Your account is ready. Please sign in to continue.', [
                { text: 'Go to Login', onPress: () => navigation.navigate('Login') },
            ]);
        } catch (error) {
            Alert.alert('Registration Failed', error || 'An error occurred during registration');
        }
    };

    const updateFormData = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }));

    const renderInput = ({
        field,
        placeholder,
        icon,
        keyboardType,
        autoCapitalize = 'none',
        secureTextEntry = false,
        rightAction,
        value,
    }) => (
        <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{placeholder}</Text>
            <View style={[styles.inputShell, focusedField === field && styles.inputShellFocused]}>
                <Feather name={icon} size={18} color={focusedField === field ? COLORS.greenPrimary : COLORS.textMuted} />
                <TextInput
                    style={styles.input}
                    placeholder={placeholder}
                    placeholderTextColor={COLORS.textMuted}
                    value={value}
                    onChangeText={(text) => updateFormData(field, text)}
                    keyboardType={keyboardType}
                    autoCapitalize={autoCapitalize}
                    secureTextEntry={secureTextEntry}
                    onFocus={() => setFocusedField(field)}
                    onBlur={() => setFocusedField('')}
                />
                {rightAction}
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.bgPage} />
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <View style={styles.hero}>
                        <View style={styles.heroBadge}>
                            <MaterialCommunityIcons name="rice" size={30} color={COLORS.greenPrimary} />
                        </View>
                        <Text style={styles.heroTitle}>Create your Rice Mill Express account</Text>
                        <Text style={styles.heroSubtitle}>
                            Save addresses, reorder faster, track rewards, and enjoy a premium shopping experience on every device.
                        </Text>
                    </View>

                    <View style={styles.formCard}>
                        <View style={styles.ribbonRow}>
                            <View style={styles.ribbon}>
                                <Feather name="shield" size={13} color={COLORS.greenPrimary} />
                                <Text style={styles.ribbonText}>Secure onboarding</Text>
                            </View>
                            <View style={[styles.ribbon, styles.ribbonAccent]}>
                                <Feather name="gift" size={13} color={COLORS.orangeDark} />
                                <Text style={[styles.ribbonText, { color: COLORS.orangeDark }]}>Referral ready</Text>
                            </View>
                        </View>

                        {renderInput({
                            field: 'name',
                            placeholder: 'Full Name',
                            icon: 'user',
                            autoCapitalize: 'words',
                            value: formData.name,
                        })}
                        {renderInput({
                            field: 'email',
                            placeholder: 'Email Address',
                            icon: 'mail',
                            keyboardType: 'email-address',
                            value: formData.email,
                        })}
                        {renderInput({
                            field: 'phone',
                            placeholder: 'Phone Number',
                            icon: 'phone',
                            keyboardType: 'phone-pad',
                            value: formData.phone,
                        })}
                        {renderInput({
                            field: 'password',
                            placeholder: 'Password',
                            icon: 'lock',
                            secureTextEntry: !showPassword,
                            value: formData.password,
                            rightAction: (
                                <TouchableOpacity onPress={() => setShowPassword((prev) => !prev)}>
                                    <Feather name={showPassword ? 'eye-off' : 'eye'} size={18} color={COLORS.textMuted} />
                                </TouchableOpacity>
                            ),
                        })}
                        {renderInput({
                            field: 'confirmPassword',
                            placeholder: 'Confirm Password',
                            icon: 'shield',
                            secureTextEntry: !showConfirmPassword,
                            value: formData.confirmPassword,
                            rightAction: (
                                <TouchableOpacity onPress={() => setShowConfirmPassword((prev) => !prev)}>
                                    <Feather name={showConfirmPassword ? 'eye-off' : 'eye'} size={18} color={COLORS.textMuted} />
                                </TouchableOpacity>
                            ),
                        })}

                        
                            

                        {renderInput({
                            field: 'referralCode',
                            placeholder: 'Referral Code (Optional)',
                            icon: 'gift',
                            autoCapitalize: 'characters',
                            value: formData.referralCode,
                        })}

                        <TouchableOpacity style={[styles.primaryButton, loading && styles.primaryButtonDisabled]} onPress={handleRegister} disabled={loading}>
                            {loading ? (
                                <ActivityIndicator color={COLORS.textInverse} />
                            ) : (
                                <>
                                    <Text style={styles.primaryButtonText}>Create Account</Text>
                                    <View style={styles.primaryButtonArrow}>
                                        <Feather name="arrow-right" size={16} color={COLORS.greenPrimary} />
                                    </View>
                                </>
                            )}
                        </TouchableOpacity>

                        <Text style={styles.helperText}>
                            By signing up, you agree to secure account verification and our standard privacy protections.
                        </Text>
                    </View>

                    <TouchableOpacity style={styles.linkRow} onPress={() => navigation.navigate('Login')}>
                        <Text style={styles.linkPrompt}>Already have an account? </Text>
                        <Text style={styles.linkText}>Log In</Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.bgPage,
    },
    flex: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.lg,
        paddingBottom: SPACING.xxxl,
    },
    hero: {
        marginBottom: SPACING.lg,
    },
    heroBadge: {
        width: 72,
        height: 72,
        borderRadius: 24,
        backgroundColor: COLORS.greenLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.md,
        borderWidth: 1,
        borderColor: COLORS.greenMid,
    },
    heroTitle: {
        ...TYPOGRAPHY.display,
        lineHeight: 34,
        marginBottom: SPACING.sm,
    },
    heroSubtitle: {
        ...TYPOGRAPHY.body,
        lineHeight: 21,
    },
    formCard: {
        ...COMPONENTS.card,
        padding: SPACING.lg,
    },
    ribbonRow: {
        flexDirection: 'row',
        gap: SPACING.sm,
        marginBottom: SPACING.lg,
    },
    ribbon: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: RADIUS.pill,
        backgroundColor: COLORS.greenLight,
    },
    ribbonAccent: {
        backgroundColor: COLORS.orangeLight,
    },
    ribbonText: {
        fontSize: 12,
        fontWeight: '700',
        color: COLORS.greenPrimary,
    },
    inputGroup: {
        marginBottom: SPACING.md,
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: COLORS.textSecondary,
        marginBottom: SPACING.sm,
    },
    inputShell: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm + 2,
        minHeight: 56,
        paddingHorizontal: SPACING.md,
        backgroundColor: COLORS.bgMuted,
        borderRadius: RADIUS.md,
        borderWidth: 1.5,
        borderColor: COLORS.borderStrong,
    },
    inputShellFocused: {
        borderColor: COLORS.greenPrimary,
        backgroundColor: COLORS.greenLight,
    },
    input: {
        flex: 1,
        color: COLORS.textPrimary,
        fontSize: 15,
        fontWeight: '600',
    },
    pickerShell: {
        paddingRight: 4,
    },
    picker: {
        flex: 1,
        height: 54,
        color: COLORS.textPrimary,
    },
    primaryButton: {
        ...COMPONENTS.pillBtnPrimary,
        minHeight: 56,
        marginTop: SPACING.sm,
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.lg,
    },
    primaryButtonDisabled: {
        backgroundColor: COLORS.greenGlow,
        shadowOpacity: 0,
    },
    primaryButtonText: {
        color: COLORS.textInverse,
        fontSize: 16,
        fontWeight: '800',
    },
    primaryButtonArrow: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.textInverse,
        alignItems: 'center',
        justifyContent: 'center',
    },
    helperText: {
        ...TYPOGRAPHY.caption,
        textAlign: 'center',
        marginTop: SPACING.md,
        lineHeight: 18,
    },
    linkRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: SPACING.lg,
    },
    linkPrompt: {
        fontSize: 15,
        color: COLORS.textSecondary,
    },
    linkText: {
        fontSize: 15,
        fontWeight: '800',
        color: COLORS.greenPrimary,
    },
});
