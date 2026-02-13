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
import { useDispatch } from 'react-redux';
import { fetchSettings } from '../../redux/slices/settingsSlice';

const SettingsScreen = ({ navigation }) => {
    const dispatch = useDispatch();
    const { colors } = useTheme();

    useEffect(() => {
        dispatch(fetchSettings());
    }, [dispatch]);

    const settingsOptions = [
        {
            title: 'Account Information',
            icon: 'person-outline',
            description: 'Edit your profile and details',
            onPress: () => navigation.navigate('EditProfile'),
        },
        {
            title: 'Addresses',
            icon: 'location-on',
            description: 'Manage delivery addresses',
            onPress: () => navigation.navigate('Addresses'),
        },
        {
            title: 'Orders & Invoices',
            icon: 'receipt-long',
            description: 'View orders and download invoices',
            onPress: () => navigation.navigate('Orders'),
        },
        {
            title: 'Security',
            icon: 'security',
            description: 'Password and account security',
            onPress: () => navigation.navigate('Security'),
        },
        {
            title: 'Privacy & Data',
            icon: 'lock-outline',
            description: 'Manage your data and visibility',
            onPress: () => navigation.navigate('Privacy'),
        },
        {
            title: 'Personalization',
            icon: 'dashboard-customize',
            description: 'Bio, tagline and dashboard layout',
            onPress: () => navigation.navigate('Personalization'),
        },
        {
            title: 'Language & Region',
            icon: 'language',
            description: 'Change app language and currency',
            onPress: () => navigation.navigate('Language'),
        },
        {
            title: 'Theme & Appearance',
            icon: 'palette',
            description: 'Light, dark, or system theme',
            onPress: () => navigation.navigate('Theme'),
        },
        {
            title: 'Accessibility',
            icon: 'accessibility',
            description: 'Visual and assistive settings',
            onPress: () => navigation.navigate('Accessibility'),
        },
        {
            title: 'My Rewards',
            icon: 'stars',
            description: 'Points and rewards history',
            onPress: () => navigation.navigate('Rewards'),
        },
        {
            title: 'My Reviews',
            icon: 'rate-review',
            description: 'Manage your product reviews',
            onPress: () => navigation.navigate('MyReviews'),
        },
        {
            title: 'Manage Subscriptions',
            icon: 'event-repeat',
            description: 'Manage recurring orders',
            onPress: () => navigation.navigate('Subscriptions'),
        },
        {
            title: 'Refer & Earn',
            icon: 'card-giftcard',
            description: 'Invite friends and get rewards',
            onPress: () => navigation.navigate('Referral'),
        },
        {
            title: 'Notifications',
            icon: 'notifications-none',
            description: 'Notification preferences',
            onPress: () => navigation.navigate('Notifications'),
        },
        {
            title: 'Clear Cache',
            icon: 'delete-sweep',
            description: 'Free up space and clear history',
            onPress: () => {
                Alert.alert(
                    'Clear Cache', 
                    'This will clear temporary data while preserving your account, profile, and rewards.',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        { 
                            text: 'Clear', 
                            onPress: async () => {
                                try {
                                    // ✅ Preserve critical user data
                                    const userData = await AsyncStorage.getItem('userInfo');
                                    const userToken = await AsyncStorage.getItem('userToken');
                                    const rewardsData = await AsyncStorage.getItem('rewards');
                                    
                                    // ✅ Clear only temporary/cache data
                                    const cacheKeys = [
                                        'recentSearches',
                                        'browseHistory',
                                        'tempImages', 
                                        'cachedRecipes',
                                        'tempFormData',
                                        'uiPreferences_temp'
                                    ];
                                    
                                    await Promise.all(
                                        cacheKeys.map(key => AsyncStorage.removeItem(key))
                                    );
                                    
                                    // ✅ Restore preserved data
                                    if (userData) await AsyncStorage.setItem('userInfo', userData);
                                    if (userToken) await AsyncStorage.setItem('userToken', userToken);
                                    if (rewardsData) await AsyncStorage.setItem('rewards', rewardsData);
                                    
                                    Alert.alert('Success', 'Temporary cache cleared. Your account data is preserved.');
                                } catch (error) {
                                    Alert.alert('Error', 'Failed to clear cache.');
                                }
                            }
                        }
                    ]
                );
            },
        },
        {
            title: 'Help Center',
            icon: 'help-outline',
            description: 'FAQ and contact support',
            onPress: () => navigation.navigate('HelpCenter'),
        },
        {
            title: 'Legal & Policies',
            icon: 'policy',
            description: 'Terms, privacy, and policies',
            onPress: () => navigation.navigate('Legal'),
        },
        {
            title: 'About',
            icon: 'info-outline',
            description: 'About this app',
            onPress: () => navigation.navigate('About'),
        },
    ];

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.outlineVariant }]}>
                <MaterialIcons name="settings" size={48} color={colors.primary} />
                <Text style={[styles.headerTitle, { color: colors.onSurface }]}>Settings</Text>
                <Text style={[styles.headerSubtitle, { color: colors.onSurfaceVariant }]}>Manage your app preferences</Text>
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
                <Text style={styles.footerText}>Version 1.0.0</Text>
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
