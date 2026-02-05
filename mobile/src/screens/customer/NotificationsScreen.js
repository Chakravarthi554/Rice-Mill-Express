import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { apiService } from '../../services/api';

const NotificationsScreen = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const response = await apiService.getNotifications();
            // Assuming response.data is array or { notifications: [] }
            setNotifications(response.data.notifications || response.data || []);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id) => {
        try {
            await apiService.markNotificationRead(id);
            setNotifications(notifications.map(n =>
                n._id === id ? { ...n, read: true } : n
            ));
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const deleteNotification = async (id) => {
        try {
            await apiService.deleteNotification(id);
            setNotifications(notifications.filter(n => n._id !== id));
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await apiService.markAllNotificationsRead();
            setNotifications(notifications.map(n => ({ ...n, read: true })));
        } catch (error) {
            Alert.alert('Error', 'Failed to mark all as read');
        }
    };

    const renderItem = ({ item }) => (
        <View style={[styles.card, !item.read && styles.unreadCard]}>
            <View style={styles.content}>
                <Text style={[styles.message, !item.read && styles.unreadText]}>{item.message}</Text>
                <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
            </View>
            <View style={styles.actions}>
                {!item.read && (
                    <TouchableOpacity onPress={() => markAsRead(item._id)} style={styles.actionButton}>
                        <MaterialIcons name="done" size={24} color="#4CAF50" />
                    </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => deleteNotification(item._id)} style={styles.actionButton}>
                    <MaterialIcons name="delete" size={24} color="#F44336" />
                </TouchableOpacity>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#4CAF50" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>{notifications.length} Notifications</Text>
                {notifications.length > 0 && (
                    <TouchableOpacity onPress={markAllAsRead}>
                        <Text style={styles.markAll}>Mark all as read</Text>
                    </TouchableOpacity>
                )}
            </View>

            {notifications.length === 0 ? (
                <View style={styles.centerContainer}>
                    <MaterialIcons name="notifications-none" size={64} color="#ccc" />
                    <Text style={styles.emptyText}>No notifications</Text>
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    renderItem={renderItem}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.list}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'white',
        elevation: 2,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    markAll: {
        color: '#4CAF50',
        fontWeight: '600',
    },
    list: {
        padding: 16,
    },
    card: {
        flexDirection: 'row',
        backgroundColor: 'white',
        borderRadius: 8,
        marginBottom: 12,
        padding: 16,
        elevation: 1,
    },
    unreadCard: {
        backgroundColor: '#E8F5E9', // Light green
        borderLeftWidth: 4,
        borderLeftColor: '#4CAF50',
    },
    content: {
        flex: 1,
    },
    message: {
        fontSize: 16,
        color: '#333',
        marginBottom: 4,
    },
    unreadText: {
        fontWeight: 'bold',
    },
    date: {
        fontSize: 12,
        color: '#888',
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 8,
    },
    actionButton: {
        padding: 4,
        marginLeft: 8,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        color: '#888',
    },
});

export default NotificationsScreen;
