import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { Card, Paragraph } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { apiService } from '../../services/api';

const BookmarksScreen = () => {
    const [bookmarks, setBookmarks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBookmarks();
    }, []);

    const fetchBookmarks = async () => {
        try {
            setLoading(true);
            const response = await apiService.getBookmarks();
            // Adjust according to actual API response structure { posts: [], pages: 1 }
            setBookmarks(response.data.posts || []);
        } catch (error) {
            console.error('Error fetching bookmarks:', error);
            Alert.alert('Error', 'Failed to load bookmarks');
        } finally {
            setLoading(false);
        }
    };

    const removeBookmark = async (id) => {
        try {
            await apiService.unbookmarkPost(id);
            setBookmarks(bookmarks.filter(post => post._id !== id));
        } catch (error) {
            console.error('Error removing bookmark:', error);
            Alert.alert('Error', 'Failed to remove bookmark');
        }
    };

    const renderItem = ({ item }) => (
        <Card style={styles.card}>
            <Card.Title
                title={item.title}
                subtitle={`By ${item.userId?.name || 'Unknown'}`}
                left={(props) => <MaterialIcons {...props} name="forum" />}
                right={(props) => (
                    <TouchableOpacity onPress={() => removeBookmark(item._id)} style={{ padding: 10 }}>
                        <MaterialIcons name="bookmark-remove" size={24} color="#F44336" />
                    </TouchableOpacity>
                )}
            />
            <Card.Content>
                <Paragraph numberOfLines={3}>{item.content}</Paragraph>
            </Card.Content>
        </Card>
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
            {bookmarks.length === 0 ? (
                <View style={styles.centerContainer}>
                    <MaterialIcons name="bookmark-border" size={60} color="#ccc" />
                    <Text style={styles.emptyText}>No bookmarks yet</Text>
                </View>
            ) : (
                <FlatList
                    data={bookmarks}
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
    list: {
        padding: 16,
    },
    card: {
        marginBottom: 12,
    },
    emptyText: {
        fontSize: 16,
        color: '#888',
        marginTop: 10,
    },
});

export default BookmarksScreen;
