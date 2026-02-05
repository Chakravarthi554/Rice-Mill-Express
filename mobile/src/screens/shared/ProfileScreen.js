import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
} from 'react-native';
console.log('👤 ProfileScreen loading...');
import { useDispatch, useSelector } from 'react-redux';
import { MaterialIcons } from '@expo/vector-icons';
import { logout } from '../../redux/slices/authSlice';

export default function ProfileScreen({ navigation }) {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);

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
        { icon: 'person', label: 'Edit Profile', screen: 'EditProfile' },
        { icon: 'location-on', label: 'Addresses', screen: 'Addresses' },
        { icon: 'notifications', label: 'Notifications', screen: 'Notifications' },
        { icon: 'help', label: 'Help & Support', screen: 'Support' },
        { icon: 'info', label: 'About', screen: 'About' },
    ];

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.avatarContainer}>
                    <MaterialIcons name="account-circle" size={100} color="#4CAF50" />
                </View>
                <Text style={styles.name}>{user?.name || 'User'}</Text>
                <Text style={styles.email}>{user?.email}</Text>
                <View style={styles.roleBadge}>
                    <Text style={styles.roleText}>{user?.role || 'customer'}</Text>
                </View>
            </View>

            <View style={styles.menuContainer}>
                {menuItems.map((item, index) => (
                    <TouchableOpacity
                        key={index}
                        style={styles.menuItem}
                        onPress={() => navigation.navigate(item.screen)}
                    >
                        <View style={styles.menuItemLeft}>
                            <MaterialIcons name={item.icon} size={24} color="#666" />
                            <Text style={styles.menuItemText}>{item.label}</Text>
                        </View>
                        <MaterialIcons name="chevron-right" size={24} color="#ccc" />
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
        backgroundColor: '#f5f5f5',
    },
    header: {
        backgroundColor: '#fff',
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
        color: '#333',
        marginBottom: 5,
    },
    email: {
        fontSize: 16,
        color: '#666',
        marginBottom: 10,
    },
    roleBadge: {
        backgroundColor: '#4CAF50',
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
        backgroundColor: '#fff',
        marginBottom: 20,
    },
    menuItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    menuItemText: {
        fontSize: 16,
        color: '#333',
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
