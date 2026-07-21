// [Premium Figma-level Redesign — SettingsScreen]
import React, { useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Alert, SafeAreaView, StatusBar, Image,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSettings } from '../../redux/slices/settingsSlice';
import { logout } from '../../redux/slices/authSlice';

const SETTING_GROUPS = [
    {
        title: 'Account & Security',
        items: [
            { title: 'Personal Information', sub: 'Name, photo, contact details', icon: 'user', iconBg: '#EEF2FF', iconColor: '#4F46E5', nav: 'EditProfile' },
            { title: 'Saved Addresses', sub: 'Home, work and other locations', icon: 'map-pin', iconBg: '#F0FDF4', iconColor: '#16A34A', nav: 'Addresses' },
            { title: 'Security & Passwords', sub: '2FA, password management', icon: 'shield', iconBg: '#FFF7ED', iconColor: '#EA580C', nav: 'Security' },
            { title: 'Privacy Preferences', sub: 'Data and ad preferences', icon: 'lock', iconBg: '#FDF2F8', iconColor: '#9333EA', nav: 'Privacy' },
        ]
    },
    {
        title: 'Business & Payments',
        items: [
            { title: 'Order Management', sub: 'Past and pending orders', icon: 'package', iconBg: '#F0FDF4', iconColor: '#16A34A', nav: 'SellerOrders' },
            { title: 'Products', sub: 'Manage your listings', icon: 'grid', iconBg: '#FEFCE8', iconColor: '#CA8A04', nav: 'SellerProducts' },
            { title: 'Payments & Withdrawals', sub: 'Track your earnings', icon: 'dollar-sign', iconBg: '#FFF7ED', iconColor: '#F97316', nav: 'SellerPayments' },
            { title: 'Analytics', sub: 'View your sales stats', icon: 'pie-chart', iconBg: '#F0F9FF', iconColor: '#0284C7', nav: 'SellerAnalytics' },
        ]
    },
    {
        title: 'Preferences',
        items: [
            { title: 'Notifications', sub: 'Order updates, offers, alerts', icon: 'bell', iconBg: '#FFF7ED', iconColor: '#EA580C', nav: 'Notifications' },
            { title: 'Language & Region', sub: 'App language settings', icon: 'globe', iconBg: '#F5F3FF', iconColor: '#7C3AED', nav: 'Language' },
            { title: 'Theme', sub: 'Light, dark or system', icon: 'moon', iconBg: '#F0FDFA', iconColor: '#0D9488', nav: 'Theme' },
        ]
    },
    {
        title: 'Support',
        items: [
            { title: 'Help Center', sub: 'FAQs and support resources', icon: 'help-circle', iconBg: '#F1F5F9', iconColor: '#475569', nav: 'HelpCenter' },
            { title: 'Legal & Policies', sub: 'Terms, privacy policy', icon: 'file-text', iconBg: '#F8FAFC', iconColor: '#64748B', nav: 'Legal' },
        ]
    }
];

const SettingsScreen = ({ navigation }) => {
    const dispatch = useDispatch();
    const { user } = useSelector(state => state.auth);

    useEffect(() => { dispatch(fetchSettings()); }, [dispatch]);

    const handleLogout = () => {
        Alert.alert('Log Out', 'Are you sure you want to log out?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Log Out', style: 'destructive', onPress: () => dispatch(logout()) }
        ]);
    };

    const initials = user?.name
        ? user.name.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
        : 'C';

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#fff" />

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Settings</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                {/* ── PROFILE HERO CARD ── */}
                <View style={styles.profileCard}>
                    <View style={styles.profileAvatarWrap}>
                        <View style={styles.profileAvatar}>
                            <Text style={styles.profileAvatarText}>{initials}</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.editBadge}
                            onPress={() => navigation.navigate('EditProfile')}
                        >
                            <Feather name="camera" size={12} color="#fff" />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.profileInfo}>
                        <Text style={styles.profileName}>{user?.name || 'Customer'}</Text>
                        <Text style={styles.profileEmail}>{user?.email || 'customer@ricemill.com'}</Text>
                        <TouchableOpacity style={styles.editProfileBtn} onPress={() => navigation.navigate('EditProfile')}>
                            <Text style={styles.editProfileBtnText}>Edit Profile</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* ── SELLER INFO ── */}
                {/* Quick Stats removed for Seller Role */}

                {/* ── SETTING GROUPS ── */}
                {SETTING_GROUPS.map((group, gIndex) => (
                    <View key={gIndex} style={styles.groupBlock}>
                        <Text style={styles.groupTitle}>{group.title}</Text>
                        <View style={styles.groupCard}>
                            {group.items.map((item, iIndex) => (
                                <View key={iIndex}>
                                    <TouchableOpacity
                                        style={styles.settingRow}
                                        onPress={() => navigation.navigate(item.nav)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={[styles.settingIconBox, { backgroundColor: item.iconBg }]}>
                                            <Feather name={item.icon} size={19} color={item.iconColor} />
                                        </View>
                                        <View style={styles.settingContent}>
                                            <Text style={styles.settingTitle}>{item.title}</Text>
                                            <Text style={styles.settingSub}>{item.sub}</Text>
                                        </View>
                                        <Feather name="chevron-right" size={18} color="#D1D5DB" />
                                    </TouchableOpacity>
                                    {iIndex < group.items.length - 1 && (
                                        <View style={styles.itemDivider} />
                                    )}
                                </View>
                            ))}
                        </View>
                    </View>
                ))}

                {/* ── LOGOUT ── */}
                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                    <View style={styles.logoutIconBox}>
                        <Feather name="log-out" size={18} color="#EF4444" />
                    </View>
                    <Text style={styles.logoutText}>Log Out</Text>
                    <Feather name="chevron-right" size={18} color="#EF4444" />
                </TouchableOpacity>

                <Text style={styles.versionText}>Rice Mill Express • Version 2.0.0</Text>
                <View style={{ height: 32 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    header: {
        paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#fff',
        borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
    },
    headerTitle: { fontSize: 24, fontWeight: '800', color: '#111827', letterSpacing: -0.5 },
    scrollContent: { padding: 16, paddingBottom: 32 },

    // Profile
    profileCard: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
        borderRadius: 24, padding: 20, marginBottom: 16,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
        borderWidth: 1, borderColor: '#F3F4F6',
    },
    profileAvatarWrap: { position: 'relative', marginRight: 16 },
    profileAvatar: {
        width: 70, height: 70, borderRadius: 35, backgroundColor: '#16A34A',
        alignItems: 'center', justifyContent: 'center',
        shadowColor: '#16A34A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4,
    },
    profileAvatarText: { fontSize: 26, fontWeight: '800', color: '#fff' },
    editBadge: {
        position: 'absolute', bottom: -2, right: -2, backgroundColor: '#F97316',
        width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center',
        borderWidth: 2, borderColor: '#fff',
    },
    profileInfo: { flex: 1 },
    profileName: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 3 },
    profileEmail: { fontSize: 13, color: '#9CA3AF', marginBottom: 10 },
    editProfileBtn: { backgroundColor: '#F0FDF4', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 50, alignSelf: 'flex-start' },
    editProfileBtnText: { fontSize: 13, fontWeight: '700', color: '#16A34A' },

    // Quick stats
    statsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
    statCard: {
        flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 14,
        alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#F3F4F6',
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
    },
    statValue: { fontSize: 24 },
    statLabel: { fontSize: 11, fontWeight: '700', color: '#6B7280', textAlign: 'center' },

    // Groups
    groupBlock: { marginBottom: 20 },
    groupTitle: { fontSize: 13, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, marginLeft: 4 },
    groupCard: {
        backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1,
        borderWidth: 1, borderColor: '#F3F4F6',
    },
    settingRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
    settingIconBox: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
    settingContent: { flex: 1 },
    settingTitle: { fontSize: 15, fontWeight: '600', color: '#111827', marginBottom: 2 },
    settingSub: { fontSize: 12, color: '#9CA3AF' },
    itemDivider: { height: 1, backgroundColor: '#F9FAFB', marginLeft: 74 },

    // Logout
    logoutBtn: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
        borderRadius: 20, padding: 16, marginBottom: 20, gap: 14,
        borderWidth: 1.5, borderColor: '#FEE2E2',
    },
    logoutIconBox: { width: 44, height: 44, borderRadius: 13, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center' },
    logoutText: { flex: 1, fontSize: 15, fontWeight: '700', color: '#EF4444' },

    versionText: { textAlign: 'center', fontSize: 12, color: '#D1D5DB', fontWeight: '500' },
});

export default SettingsScreen;
