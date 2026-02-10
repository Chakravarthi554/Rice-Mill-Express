import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const SettingsScreen = ({ navigation }) => {
    const settingsOptions = [
        {
            title: 'Account',
            icon: 'person',
            description: 'Manage your account settings',
            onPress: () => navigation.navigate('EditProfile'),
        },
        {
            title: 'Addresses',
            icon: 'location-on',
            description: 'Manage delivery addresses',
            onPress: () => navigation.navigate('Addresses'),
        },
        {
            title: 'Notifications',
            icon: 'notifications',
            description: 'Notification preferences',
            onPress: () => navigation.navigate('Notifications'),
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
            title: 'Security',
            icon: 'security',
            description: 'Password and 2FA settings',
            onPress: () => navigation.navigate('Security'),
        },
        {
            title: 'Privacy',
            icon: 'lock',
            description: 'Privacy and data settings',
            onPress: () => navigation.navigate('Privacy'),
        },
        {
            title: 'Language',
            icon: 'language',
            description: 'Change app language and currency',
            onPress: () => navigation.navigate('Language'),
        },
        {
            title: 'Accessibility',
            icon: 'accessibility',
            description: 'Visual and assistive settings',
            onPress: () => navigation.navigate('Accessibility'),
        },
        {
            title: 'Personalization',
            icon: 'dashboard-customize',
            description: 'Customize your dashboard',
            onPress: () => navigation.navigate('Personalization'),
        },
        {
            title: 'Theme',
            icon: 'palette',
            description: 'Light, dark, or system theme',
            onPress: () => navigation.navigate('Theme'),
        },
        {
            title: 'Help Center',
            icon: 'help',
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
            icon: 'info',
            description: 'About this app',
            onPress: () => navigation.navigate('About'),
        },
    ];

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <MaterialIcons name="settings" size={48} color="#4CAF50" />
                <Text style={styles.headerTitle}>Settings</Text>
                <Text style={styles.headerSubtitle}>Manage your app preferences</Text>
            </View>

            <View style={styles.section}>
                {settingsOptions.map((option, index) => (
                    <TouchableOpacity
                        key={index}
                        style={styles.optionCard}
                        onPress={option.onPress}
                    >
                        <View style={styles.optionIcon}>
                            <MaterialIcons name={option.icon} size={24} color="#4CAF50" />
                        </View>
                        <View style={styles.optionContent}>
                            <Text style={styles.optionTitle}>{option.title}</Text>
                            <Text style={styles.optionDescription}>{option.description}</Text>
                        </View>
                        <MaterialIcons name="chevron-right" size={24} color="#ccc" />
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
        backgroundColor: '#f5f5f5',
    },
    header: {
        backgroundColor: '#fff',
        padding: 24,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 12,
        color: '#333',
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#999',
        marginTop: 4,
    },
    section: {
        marginTop: 16,
        backgroundColor: '#fff',
    },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    optionIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#E8F5E9',
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
        color: '#333',
        marginBottom: 4,
    },
    optionDescription: {
        fontSize: 14,
        color: '#999',
    },
    footer: {
        padding: 24,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 14,
        color: '#999',
    },
});

export default SettingsScreen;
