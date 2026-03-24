import React, { useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    SafeAreaView,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { fetchSettings } from '../../redux/slices/settingsSlice';
import { logoutUser } from '../../redux/actions/userActions';

const SettingsScreen = ({ navigation }) => {
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const { userInfo } = useSelector(state => state.userLogin);
    const user = userInfo?.user || {};

    useEffect(() => {
        dispatch(fetchSettings());
    }, [dispatch]);

    const handleLogout = () => {
        Alert.alert('Logout', 'Are you sure you want to logout?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Logout', style: 'destructive', onPress: () => dispatch(logoutUser()) }
        ]);
    };

    const settingGroups = [
        {
            title: 'Account',
            items: [
                { title: 'Personal Information', icon: 'person-outline', iconBg: '#EEF2FF', iconColor: '#4F46E5', onPress: () => navigation.navigate('EditProfile') },
                { title: 'Addresses', icon: 'location-on', iconBg: '#F0FDF4', iconColor: '#16A34A', onPress: () => navigation.navigate('Addresses') },
                { title: 'Security', icon: 'security', iconBg: '#FFF7ED', iconColor: '#EA580C', onPress: () => navigation.navigate('Security') },
                { title: 'Privacy', icon: 'lock-outline', iconBg: '#FDF2F8', iconColor: '#9333EA', onPress: () => navigation.navigate('Privacy') },
            ]
        },
        {
            title: 'Orders & Rewards',
            items: [
                { title: 'My Orders', icon: 'receipt-long', iconBg: '#F0FDF4', iconColor: '#16A34A', onPress: () => navigation.navigate('Orders') },
                { title: 'Rewards & Points', icon: 'stars', iconBg: '#FEFCE8', iconColor: '#CA8A04', onPress: () => navigation.navigate('Rewards') },
                { title: 'Refer & Earn', icon: 'card-giftcard', iconBg: '#FFF0F5', iconColor: '#DB2777', onPress: () => navigation.navigate('Referral') },
                { title: 'My Reviews', icon: 'rate-review', iconBg: '#F0F9FF', iconColor: '#0284C7', onPress: () => navigation.navigate('MyReviews') },
            ]
        },
        {
            title: 'Preferences',
            items: [
                { title: 'Notifications', icon: 'notifications-none', iconBg: '#FFF7ED', iconColor: '#EA580C', onPress: () => navigation.navigate('Notifications') },
                { title: 'Language', icon: 'language', iconBg: '#F5F3FF', iconColor: '#7C3AED', onPress: () => navigation.navigate('Language') },
                { title: 'Theme', icon: 'palette', iconBg: '#F0FDFA', iconColor: '#0D9488', onPress: () => navigation.navigate('Theme') },
                { title: 'Accessibility', icon: 'accessibility', iconBg: '#FFF0F5', iconColor: '#DB2777', onPress: () => navigation.navigate('Accessibility') },
            ]
        },
        {
            title: 'Support',
            items: [
                { title: 'Help Center', icon: 'help-outline', iconBg: '#F0FDF4', iconColor: '#16A34A', onPress: () => navigation.navigate('HelpCenter') },
                { title: 'Legal & Policies', icon: 'policy', iconBg: '#EEF2FF', iconColor: '#4F46E5', onPress: () => navigation.navigate('Legal') },
            ]
        }
    ];

    return (
        <SafeAreaView style={styles.container}>
            {/* Hero Profile Header */}
            <View style={styles.heroHeader}>
                <View style={styles.avatarContainer}>
                    <View style={styles.avatarCircle}>
                        <Ionicons name="person" size={44} color="#fff" />
                    </View>
                    <TouchableOpacity style={styles.editAvatarBtn} onPress={() => navigation.navigate('EditProfile')}>
                        <Ionicons name="camera" size={12} color="#fff" />
                    </TouchableOpacity>
                </View>
                <Text style={styles.heroName}>{user.name || 'Customer'}</Text>
                <Text style={styles.heroRole}>Rice Mill Express Member</Text>
                <View style={styles.heroBadgeRow}>
                    <View style={styles.heroBadge}>
                        <Ionicons name="mail-outline" size={13} color="#A7F3D0" />
                        <Text style={styles.heroBadgeText}>{user.email || 'email@example.com'}</Text>
                    </View>
                    {user.phone && (
                        <View style={styles.heroBadge}>
                            <Ionicons name="call-outline" size={13} color="#A7F3D0" />
                            <Text style={styles.heroBadgeText}>{user.phone}</Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Quick Stats */}
            <View style={styles.statsBar}>
                <TouchableOpacity style={styles.statItem} onPress={() => navigation.navigate('Orders')}>
                    <Text style={styles.statValue}>0</Text>
                    <Text style={styles.statLabel}>Orders</Text>
                </TouchableOpacity>
                <View style={styles.statDivider} />
                <TouchableOpacity style={styles.statItem} onPress={() => navigation.navigate('Rewards')}>
                    <Text style={styles.statValue}>0</Text>
                    <Text style={styles.statLabel}>Points</Text>
                </TouchableOpacity>
                <View style={styles.statDivider} />
                <TouchableOpacity style={styles.statItem} onPress={() => navigation.navigate('WishList')}>
                    <Text style={styles.statValue}>0</Text>
                    <Text style={styles.statLabel}>Wishlist</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                {settingGroups.map((group, gi) => (
                    <View key={gi} style={styles.section}>
                        <Text style={styles.sectionTitle}>{group.title}</Text>
                        <View style={styles.sectionCard}>
                            {group.items.map((item, idx) => (
                                <TouchableOpacity key={idx} style={[styles.menuRow, idx < group.items.length - 1 && styles.menuRowBorder]} onPress={item.onPress}>
                                    <View style={[styles.menuIcon, { backgroundColor: item.iconBg }]}>
                                        <MaterialIcons name={item.icon} size={22} color={item.iconColor} />
                                    </View>
                                    <Text style={styles.menuTitle}>{item.title}</Text>
                                    <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                ))}

                {/* Logout */}
                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                    <MaterialIcons name="logout" size={20} color="#EF4444" />
                    <Text style={styles.logoutText}>Log Out</Text>
                </TouchableOpacity>

                <Text style={styles.version}>Rice Mill Express v1.0.0</Text>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    heroHeader: {
        backgroundColor: '#16A34A',
        paddingTop: 24,
        paddingBottom: 28,
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    avatarContainer: { position: 'relative', marginBottom: 12 },
    avatarCircle: {
        width: 88, height: 88, borderRadius: 44,
        backgroundColor: 'rgba(255,255,255,0.25)',
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 3, borderColor: 'rgba(255,255,255,0.5)',
    },
    editAvatarBtn: {
        position: 'absolute', bottom: 2, right: 2,
        width: 24, height: 24, borderRadius: 12,
        backgroundColor: '#0F9547', justifyContent: 'center', alignItems: 'center',
        borderWidth: 2, borderColor: '#fff',
    },
    heroName: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 4 },
    heroRole: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 12 },
    heroBadgeRow: { gap: 8 },
    heroBadge: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.15)',
        paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20,
    },
    heroBadgeText: { color: '#fff', fontSize: 12, marginLeft: 6, fontWeight: '500' },
    statsBar: {
        flexDirection: 'row', backgroundColor: '#fff',
        marginHorizontal: 16, borderRadius: 16,
        paddingVertical: 16,
        marginTop: -24, elevation: 6,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8,
    },
    statItem: { flex: 1, alignItems: 'center' },
    statValue: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 2 },
    statLabel: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
    statDivider: { width: 1, backgroundColor: '#F3F4F6' },
    scroll: { marginTop: 16 },
    section: { marginHorizontal: 16, marginBottom: 20 },
    sectionTitle: { fontSize: 13, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginLeft: 4 },
    sectionCard: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#F3F4F6' },
    menuRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
    menuRowBorder: { borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
    menuIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
    menuTitle: { flex: 1, fontSize: 15, fontWeight: '500', color: '#111827' },
    logoutBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        marginHorizontal: 16, marginBottom: 16, paddingVertical: 14,
        backgroundColor: '#FEF2F2', borderRadius: 14, borderWidth: 1, borderColor: '#FECACA',
    },
    logoutText: { fontSize: 15, fontWeight: '700', color: '#EF4444', marginLeft: 8 },
    version: { textAlign: 'center', color: '#9CA3AF', fontSize: 12, marginBottom: 8 },
});

export default SettingsScreen;
