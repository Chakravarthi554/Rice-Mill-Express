import React, { useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { fetchSettings } from '../../redux/slices/settingsSlice';

const SettingsScreen = ({ navigation }) => {
    const dispatch = useDispatch();
    const { colors } = useTheme();
    const { t } = useTranslation();

    useEffect(() => {
        dispatch(fetchSettings());
    }, [dispatch]);

    const settingsOptions = [
        {
            title: t('accountInfo'),
            icon: 'person-outline',
            description: t('editProfile'),
            onPress: () => navigation.navigate('EditProfile'),
        },
        {
            title: t('addresses'),
            icon: 'location-on',
            description: t('addresses'),
            onPress: () => navigation.navigate('Addresses'),
        },
        {
            title: t('ordersInvoices'),
            icon: 'receipt-long',
            description: t('myOrders'),
            onPress: () => navigation.navigate('Orders'),
        },
        {
            title: t('security'),
            icon: 'security',
            description: t('security'),
            onPress: () => navigation.navigate('Security'),
        },
        {
            title: t('privacy'),
            icon: 'lock-outline',
            description: t('privacy'),
            onPress: () => navigation.navigate('Privacy'),
        },
        {
            title: t('language'),
            icon: 'language',
            description: t('appLanguage'),
            onPress: () => navigation.navigate('Language'),
        },
        {
            title: t('theme'),
            icon: 'palette',
            description: t('theme'),
            onPress: () => navigation.navigate('Theme'),
        },
        {
            title: t('accessibility'),
            icon: 'accessibility',
            description: t('accessibility'),
            onPress: () => navigation.navigate('Accessibility'),
        },
        {
            title: t('rewards'),
            icon: 'stars',
            description: t('rewards'),
            onPress: () => navigation.navigate('Rewards'),
        },
        {
            title: t('myReviews'),
            icon: 'rate-review',
            description: t('myReviews'),
            onPress: () => navigation.navigate('MyReviews'),
        },
        {
            title: t('referEarn'),
            icon: 'card-giftcard',
            description: t('referEarn'),
            onPress: () => navigation.navigate('Referral'),
        },
        {
            title: t('notifications'),
            icon: 'notifications-none',
            description: t('notifications'),
            onPress: () => navigation.navigate('Notifications'),
        },
        {
            title: t('clearCache'),
            icon: 'delete-sweep',
            description: t('clearCache'),
            onPress: () => {
                Alert.alert(
                    t('clearCache'),
                    'This will clear temporary data while preserving your account, profile, and rewards.',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        {
                            text: t('clearCache'),
                            onPress: async () => {
                                try {
                                    // ✅ 1. Clear Redux Transient State
                                    dispatch({ type: 'CLEAR_CACHE_STATE' });

                                    // ✅ 2. Preserve strictly required user data
                                    const userInfo = await AsyncStorage.getItem('userInfo');
                                    const userToken = await AsyncStorage.getItem('userToken');

                                    // ✅ 3. Clear everything in AsyncStorage
                                    await AsyncStorage.clear();

                                    // ✅ 4. Restore preserved data immediately
                                    if (userInfo) await AsyncStorage.setItem('userInfo', userInfo);
                                    if (userToken) await AsyncStorage.setItem('userToken', userToken);

                                    // Optional: Re-fetch some initial data if needed, but the Redux reset
                                    // will cause slices to revert to initial state anyway.

                                    Alert.alert('Success', 'Temporary cache cleared. Your account and rewards are preserved.');
                                } catch (error) {
                                    console.error('Mobile Clear Cache Error:', error);
                                    Alert.alert('Error', 'Failed to clear cache.');
                                }
                            }
                        }
                    ]
                );
            },
        },
        {
            title: t('helpCenter'),
            icon: 'help-outline',
            description: t('helpCenter'),
            onPress: () => navigation.navigate('HelpCenter'),
        },
        {
            title: t('legalPolicies'),
            icon: 'policy',
            description: t('legalPolicies'),
            onPress: () => navigation.navigate('Legal'),
        },
        {
            title: t('about'),
            icon: 'info-outline',
            description: t('about'),
            onPress: () => navigation.navigate('About'),
        },
    ];

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.outlineVariant }]}>
                <MaterialIcons name="settings" size={48} color={colors.primary} />
                <Text style={[styles.headerTitle, { color: colors.onSurface }]}>{t('settings')}</Text>
                <Text style={[styles.headerSubtitle, { color: colors.onSurfaceVariant }]}>{t('settings')}</Text>
            </View>

            <View style={[styles.section, { backgroundColor: colors.surface }]}>
                {settingsOptions.map((option, index) => (
                    <TouchableOpacity
                        key={index}
                        style={[styles.optionCard, { borderBottomColor: colors.outlineVariant }]}
                        onPress={option.onPress}
                    >
                        <View style={[styles.optionIcon, { backgroundColor: colors.primaryContainer }]}>
                            <MaterialIcons name={option.icon} size={24} color={colors.primary} />
                        </View>
                        <View style={styles.optionContent}>
                            <Text style={[styles.optionTitle, { color: colors.onSurface }]}>{option.title}</Text>
                            <Text style={[styles.optionDescription, { color: colors.onSurfaceVariant }]}>{option.description}</Text>
                        </View>
                        <MaterialIcons name="chevron-right" size={24} color={colors.onSurfaceVariant} />
                    </TouchableOpacity>
                ))}
            </View>

            <View style={styles.footer}>
                <Text style={styles.footerText}>{t('version')} 1.0.0</Text>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: 24,
        alignItems: 'center',
        borderBottomWidth: 1,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 12,
    },
    headerSubtitle: {
        fontSize: 14,
        marginTop: 4,
    },
    section: {
        marginTop: 16,
    },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
    },
    optionIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    optionContent: {
        flex: 1,
    },
    optionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    optionDescription: {
        fontSize: 14,
    },
    footer: {
        padding: 24,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 14,
    },
});

export default SettingsScreen;
