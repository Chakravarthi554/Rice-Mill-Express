import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { MaterialIcons } from '@expo/vector-icons';
import { apiService } from '../../services/api';

const NotificationsScreen = ({ navigation }) => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadNotifications();
    }, []);

    const loadNotifications = async () => {
        try {
            const response = await apiService.getNotifications();
            // Ensure we handle the array correctly
            const data = Array.isArray(response.data) ? response.data : response.data.notifications || [];
            setNotifications(data);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        loadNotifications();
    };

    const handleMarkAsRead = async (id, read) => {
        if (read) return;
        try {
            await apiService.markNotificationRead(id);
            // Optimistic update
            setNotifications(prev =>
                prev.map(n => n._id === id ? { ...n, read: true } : n)
            );
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const handleNotificationClick = async (notification) => {
        if (!notification.read) {
            await handleMarkAsRead(notification._id, notification.read);
        }

        if (notification.actionUrl) {
            // Handle internal navigation if actionUrl is defined
            // Common internal routes: /orders/:id, /forum/post/:id, etc.
            // ActionUrls might look like "/orders/123" or "OrderDetails"

            if (notification.actionUrl.includes('orders/')) {
                const orderId = notification.actionUrl.split('/').pop();
                navigation.navigate('OrderDetail', { orderId });
            } else if (notification.actionUrl.includes('forum/post/')) {
                const postId = notification.actionUrl.split('/').pop();
                navigation.navigate('ForumPostDetail', { postId });
            } else if (notification.actionUrl.includes('tickets/')) {
                navigation.navigate('SupportChat');
            } else {
                // Fallback navigation or external link
                console.log('🔗 Action URL:', notification.actionUrl);
            }
        }
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={[styles.notificationItem, !item.read && styles.unreadItem]}
            onPress={() => handleNotificationClick(item)}
        >
            <View style={styles.iconContainer}>
                <MaterialIcons
                    name={
                        item.type === 'ORDER_UPDATE' || item.type === 'ORDER' ? 'local-shipping' :
                            item.type === 'SYSTEM' ? 'info' :
                                item.type === 'SUPPORT_TICKET' ? 'support-agent' :
                                    item.type === 'NEW_CHAT_MESSAGE' ? 'chat' :
                                        'notifications'
                    }
                    size={24}
                    color={item.read ? '#999' : '#4CAF50'}
                />
            </View>
            <View style={styles.content}>
                <Text style={[styles.title, !item.read && styles.unreadText]}>{item.title || 'Notification'}</Text>
                <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
                <Text style={styles.time}>{new Date(item.createdAt).toLocaleDateString()}</Text>
            </View>
            {!item.read && <View style={styles.dot} />}
        </TouchableOpacity>
    );

    if (loading && !refreshing) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#4CAF50" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {notifications.length === 0 ? (
                <View style={[styles.center, { opacity: 0.7 }]}>
                    <MaterialIcons name="notifications-none" size={80} color="#ccc" />
                    <Text style={styles.emptyText}>No notifications yet</Text>
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    renderItem={renderItem}
                    keyExtractor={item => item._id}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#4CAF50']} />
                    }
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
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    list: {
        padding: 16,
    },
    notificationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        marginBottom: 12,
        borderRadius: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    unreadItem: {
        backgroundColor: '#fff',
        borderLeftWidth: 4,
        borderLeftColor: '#4CAF50',
    },
    iconContainer: {
        marginRight: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    unreadText: {
        fontWeight: 'bold',
        color: '#000',
    },
    message: {
        fontSize: 14,
        color: '#666',
        marginBottom: 6,
        lineHeight: 20,
    },
    time: {
        fontSize: 12,
        color: '#999',
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#4CAF50',
        marginLeft: 8,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '500',
        color: '#999',
        marginTop: 16,
    },
});

export default NotificationsScreen;
