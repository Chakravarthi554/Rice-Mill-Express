// [AI: Premium Mobile Polish - Luxury grouped settings, Feather icons, Squircles]
import React, { useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, SafeAreaView, Platform
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSettings } from '../../redux/slices/settingsSlice';
import { logout } from '../../redux/slices/authSlice';

const SettingsScreen = ({ navigation }) => {
    const dispatch = useDispatch();
    const { user } = useSelector(state => state.auth);

    useEffect(() => { dispatch(fetchSettings()); }, [dispatch]);

    const handleLogout = () => {
        Alert.alert('Logout', 'Are you sure you want to log out?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Logout', style: 'destructive', onPress: () => dispatch(logout()) }
        ]);
    };

    const settingGroups = [
        {
            title: 'Account & Security',
            items: [
                { title: 'Personal Information', icon: 'user', iconBg: '#EEF2FF', iconColor: '#4F46E5', onPress: () => navigation.navigate('EditProfile') },
                { title: 'Saved Addresses', icon: 'map-pin', iconBg: '#F0FDF4', iconColor: '#16A34A', onPress: () => navigation.navigate('Addresses') },
                { title: 'Security & Passwords', icon: 'shield', iconBg: '#FFF7ED', iconColor: '#EA580C', onPress: () => navigation.navigate('Security') },
                { title: 'Privacy Preferences', icon: 'lock', iconBg: '#FDF2F8', iconColor: '#9333EA', onPress: () => navigation.navigate('Privacy') },
            ]
        },
        {
            title: 'Orders & Rewards',
            items: [
                { title: 'Order History', icon: 'package', iconBg: '#F0FDF4', iconColor: '#16A34A', onPress: () => navigation.navigate('Orders') },
                { title: 'Rewards & Points', icon: 'star', iconBg: '#FEFCE8', iconColor: '#CA8A04', onPress: () => navigation.navigate('Rewards') },
                { title: 'Refer & Earn', icon: 'gift', iconBg: '#FFF7ED', iconColor: '#F97316', onPress: () => navigation.navigate('Referral') },
                { title: 'My Reviews', icon: 'edit-3', iconBg: '#F0F9FF', iconColor: '#0284C7', onPress: () => navigation.navigate('MyReviews') },
            ]
        },
        {
            title: 'Preferences',
            items: [
                { title: 'Notifications', icon: 'bell', iconBg: '#FFF7ED', iconColor: '#EA580C', onPress: () => navigation.navigate('Notifications') },
                { title: 'Language', icon: 'globe', iconBg: '#F5F3FF', iconColor: '#7C3AED', onPress: () => navigation.navigate('Language') },
                { title: 'Theme', icon: 'moon', iconBg: '#F0FDFA', iconColor: '#0D9488', onPress: () => navigation.navigate('Theme') },
            ]
        },
        {
            title: 'Support',
            items: [
                { title: 'Help Center', icon: 'help-circle', iconBg: '#F1F5F9', iconColor: '#475569', onPress: () => navigation.navigate('HelpCenter') },
                { title: 'Legal & Policies', icon: 'file-text', iconBg: '#F8FAFC', iconColor: '#64748B', onPress: () => navigation.navigate('Legal') },
            ]
        }
    ];

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                {/* Profile Header */}
                <View style={styles.header}>
                    <View style={styles.avatarWrap}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{user?.name ? user.name.charAt(0).toUpperCase() : 'C'}</Text>
                        </View>
                        <TouchableOpacity style={styles.editBadge} onPress={() => navigation.navigate('EditProfile')}>
                            <Feather name="camera" size={12} color="#fff" />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.headerInfo}>
                        <Text style={styles.name}>{user?.name || 'Customer'}</Text>
                        <Text style={styles.email}>{user?.email || 'customer@ricemill.com'}</Text>
                    </View>
                </View>

                {/* Settings Groups */}
                {settingGroups.map((group, gIndex) => (
                    <View key={gIndex} style={styles.groupContainer}>
                        <Text style={styles.groupTitle}>{group.title}</Text>
                        <View style={styles.card}>
                            {group.items.map((item, iIndex) => (
                                <View key={iIndex}>
                                    <TouchableOpacity style={styles.itemRow} onPress={item.onPress} activeOpacity={0.7}>
                                        <View style={[styles.iconBox, { backgroundColor: item.iconBg }]}>
                                            <Feather name={item.icon} size={20} color={item.iconColor} />
                                        </View>
                                        <Text style={styles.itemTitle}>{item.title}</Text>
                                        <Feather name="chevron-right" size={20} color="#D1D5DB" />
                                    </TouchableOpacity>
                                    {iIndex < group.items.length - 1 && <View style={styles.divider} />}
                                </View>
                            ))}
                        </View>
                    </View>
                ))}

                {/* Logout Button */}
                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                    <Feather name="log-out" size={20} color="#EF4444" />
                    <Text style={styles.logoutText}>Log Out</Text>
                </TouchableOpacity>

                <Text style={styles.version}>App Version 2.0.0</Text>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    scrollContent: { padding: 20, paddingBottom: 40 },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 32, backgroundColor: '#fff', padding: 20, borderRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    avatarWrap: { position: 'relative', marginRight: 16 },
    avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#16A34A', alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontSize: 28, fontWeight: '800', color: '#fff' },
    editBadge: { position: 'absolute', bottom: -4, right: -4, backgroundColor: '#F97316', width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
    headerInfo: { flex: 1 },
    name: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 4 },
    email: { fontSize: 14, color: '#6B7280' },
    groupContainer: { marginBottom: 24 },
    groupTitle: { fontSize: 14, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12, marginLeft: 8 },
    card: { backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 1 },
    itemRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
    iconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
    itemTitle: { flex: 1, fontSize: 16, fontWeight: '500', color: '#111827' },
    divider: { height: 1, backgroundColor: '#F3F4F6', marginLeft: 72 },
    logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: '#FEF2F2', borderRadius: 50, marginTop: 12 },
    logoutText: { marginLeft: 8, fontSize: 16, fontWeight: '700', color: '#EF4444' },
    version: { textAlign: 'center', marginTop: 32, fontSize: 13, color: '#9CA3AF', fontWeight: '500' }
});

export default SettingsScreen;
