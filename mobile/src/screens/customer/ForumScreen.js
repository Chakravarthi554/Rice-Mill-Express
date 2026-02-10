import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { MaterialIcons } from '@expo/vector-icons';
import { getForumPosts } from '../../redux/actions/forumActions';

const ForumScreen = ({ navigation }) => {
    const dispatch = useDispatch();
    const { posts, loading, error } = useSelector((state) => state.forumPostList);
    const [searchQuery, setSearchQuery] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        dispatch(getForumPosts());
    }, [dispatch]);

    const handleRefresh = () => {
        setRefreshing(true);
        dispatch(getForumPosts(searchQuery)).finally(() => setRefreshing(false));
    };

    const handleSearch = () => {
        dispatch(getForumPosts(searchQuery));
    };

    const renderPostCard = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('ForumPostDetail', { postId: item._id })}
        >
            <View style={styles.cardHeader}>
                <View style={styles.authorInfo}>
                    <MaterialIcons name="account-circle" size={40} color="#4CAF50" />
                    <View style={styles.authorDetails}>
                        <Text style={styles.authorName}>{item.user?.name || 'Anonymous'}</Text>
                        <Text style={styles.postDate}>
                            {new Date(item.createdAt).toLocaleDateString()}
                        </Text>
                    </View>
                </View>
                {item.isPinned && (
                    <MaterialIcons name="push-pin" size={20} color="#FF9800" />
                )}
            </View>

            <Text style={styles.postTitle}>{item.title}</Text>
            <Text style={styles.postContent} numberOfLines={3}>
                {item.content}
            </Text>

            {item.category && (
                <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{item.category}</Text>
                </View>
            )}

            <View style={styles.cardFooter}>
                <View style={styles.statItem}>
                    <MaterialIcons name="thumb-up" size={16} color="#666" />
                    <Text style={styles.statText}>{item.likes?.length || 0}</Text>
                </View>
                <View style={styles.statItem}>
                    <MaterialIcons name="comment" size={16} color="#666" />
                    <Text style={styles.statText}>{item.replies?.length || 0}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    if (loading && !refreshing) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#4CAF50" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header with Search and Create Button */}
            <View style={styles.header}>
                <View style={styles.searchContainer}>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search forum posts..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        onSubmitEditing={handleSearch}
                    />
                    <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
                        <MaterialIcons name="search" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>
                <TouchableOpacity
                    style={styles.createButton}
                    onPress={() => navigation.navigate('CreateForumPost')}
                >
                    <MaterialIcons name="add" size={24} color="#fff" />
                    <Text style={styles.createButtonText}>New Post</Text>
                </TouchableOpacity>
            </View>

            {error && (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            )}

            <FlatList
                data={posts}
                renderItem={renderPostCard}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                }
                ListEmptyComponent={
                    !loading && (
                        <View style={styles.emptyContainer}>
                            <MaterialIcons name="forum" size={64} color="#ccc" />
                            <Text style={styles.emptyText}>No posts found</Text>
                        </View>
                    )
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        backgroundColor: '#fff',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    searchContainer: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    searchInput: {
        flex: 1,
        height: 40,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 12,
        marginRight: 8,
    },
    searchButton: {
        width: 40,
        height: 40,
        backgroundColor: '#4CAF50',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    createButton: {
        flexDirection: 'row',
        backgroundColor: '#2196F3',
        padding: 12,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    createButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    errorContainer: {
        padding: 16,
        backgroundColor: '#ffebee',
    },
    errorText: {
        color: '#c62828',
        textAlign: 'center',
    },
    listContent: {
        padding: 16,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    authorInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    authorDetails: {
        marginLeft: 12,
    },
    authorName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    postDate: {
        fontSize: 12,
        color: '#999',
    },
    postTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#333',
    },
    postContent: {
        fontSize: 14,
        color: '#666',
        marginBottom: 12,
    },
    categoryBadge: {
        alignSelf: 'flex-start',
        backgroundColor: '#E3F2FD',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        marginBottom: 12,
    },
    categoryText: {
        fontSize: 12,
        color: '#2196F3',
        fontWeight: 'bold',
    },
    cardFooter: {
        flexDirection: 'row',
        gap: 16,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statText: {
        marginLeft: 4,
        fontSize: 14,
        color: '#666',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 64,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        color: '#999',
    },
});

export default ForumScreen;
