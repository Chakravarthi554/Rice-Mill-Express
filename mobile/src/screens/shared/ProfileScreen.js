import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';
import { logout, setUser } from '../../redux/slices/authSlice';
import { useFocusEffect } from '@react-navigation/native';
import { apiService } from '../../services/api';

export default function ProfileScreen({ navigation }) {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const { colors } = useTheme();

    useFocusEffect(
        React.useCallback(() => {
            const fetchProfile = async () => {
                try {
                    const { data } = await apiService.getUserProfile();
                    dispatch(setUser(data));
                } catch (error) {
                    console.error('Failed to sync profile:', error);
                }
            };
            if (user) {
                fetchProfile();
            }
        }, [dispatch, user?.token]) // Dependency on token or just dispatch
    );

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: () => dispatch(logout()),
                },
            ]
        );
    };

    const menuItems = [
        { icon: 'restaurant-menu', label: 'Recipes', screen: 'Recipes' },
        { icon: 'forum', label: 'Forum', screen: 'Forum' },
        { icon: 'stars', label: 'My Rewards', screen: 'Rewards' },
        { icon: 'rate-review', label: 'My Reviews', screen: 'MyReviews' },
        { icon: 'settings', label: 'Settings', screen: 'Settings' },
        { icon: 'person', label: 'Edit Profile', screen: 'EditProfile' },
        { icon: 'location-on', label: 'Addresses', screen: 'Addresses' },
        { icon: 'notifications', label: 'Notifications', screen: 'Notifications' },
        { icon: 'help', label: 'Help & Support', screen: 'HelpCenter' },
        { icon: 'info', label: 'About', screen: 'About' },
    ];

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.surface }]}>
                <View style={styles.avatarContainer}>
                    <MaterialIcons name="account-circle" size={100} color={colors.primary} />
                </View>
                <Text style={[styles.name, { color: colors.onSurface }]}>{user?.name || 'User'}</Text>
                <Text style={[styles.email, { color: colors.onSurfaceVariant }]}>{user?.email}</Text>
                <View style={[styles.roleBadge, { backgroundColor: colors.primary }]}>
                    <Text style={styles.roleText}>{user?.role || 'customer'}</Text>
                </View>
            </View>

            <View style={[styles.menuContainer, { backgroundColor: colors.surface }]}>
                {menuItems.map((item, index) => (
                    <TouchableOpacity
                        key={index}
                        style={[styles.menuItem, { borderBottomColor: colors.outlineVariant }]}
                        onPress={() => navigation.navigate(item.screen)}
                    >
                        <View style={styles.menuItemLeft}>
                            <MaterialIcons name={item.icon} size={24} color={colors.onSurfaceVariant} />
                            <Text style={[styles.menuItemText, { color: colors.onSurface }]}>{item.label}</Text>
                        </View>
                        <MaterialIcons name="chevron-right" size={24} color={colors.onSurfaceVariant} />
                    </TouchableOpacity>
                ))}
            </View>

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <MaterialIcons name="logout" size={24} color="#fff" />
                <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>

            <Text style={styles.version}>Version 1.0.0</Text>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        alignItems: 'center',
        paddingVertical: 30,
        marginBottom: 20,
    },
    avatarContainer: {
        marginBottom: 15,
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    email: {
        fontSize: 16,
        marginBottom: 10,
    },
    roleBadge: {
        paddingHorizontal: 15,
        paddingVertical: 5,
        borderRadius: 12,
    },
    roleText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    menuContainer: {
        marginBottom: 20,
    },
    menuItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    menuItemText: {
        fontSize: 16,
        marginLeft: 15,
    },
    logoutButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f44336',
        marginHorizontal: 20,
        padding: 15,
        borderRadius: 8,
        marginBottom: 20,
    },
    logoutText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    version: {
        textAlign: 'center',
        color: '#999',
        marginBottom: 30,
    },
});
