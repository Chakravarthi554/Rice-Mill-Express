import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { MaterialIcons } from '@expo/vector-icons';
import {
    getForumPostDetails,
    likeForumPost,
    commentOnForumPost,
} from '../../redux/actions/forumActions';

const ForumPostDetailScreen = ({ route, navigation }) => {
    const { postId } = route.params;
    const dispatch = useDispatch();
    const { post, loading, error } = useSelector((state) => state.forumPostDetails);
    const [comment, setComment] = useState('');

    useEffect(() => {
        dispatch(getForumPostDetails(postId));
    }, [dispatch, postId]);

    const handleLike = () => {
        dispatch(likeForumPost(postId));
    };

    const handleComment = () => {
        if (!comment.trim()) {
            Alert.alert('Error', 'Please enter a comment');
            return;
        }
        dispatch(commentOnForumPost(postId, comment));
        setComment('');
        Alert.alert('Success', 'Comment added successfully!');
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#4CAF50" />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>{error}</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.authorInfo}>
                    <MaterialIcons name="account-circle" size={48} color="#4CAF50" />
                    <View style={styles.authorDetails}>
                        <Text style={styles.authorName}>{post.user?.name || 'Anonymous'}</Text>
                        <Text style={styles.postDate}>
                            {new Date(post.createdAt).toLocaleDateString()}
                        </Text>
                    </View>
                </View>
                {post.isPinned && (
                    <View style={styles.pinnedBadge}>
                        <MaterialIcons name="push-pin" size={16} color="#FF9800" />
                        <Text style={styles.pinnedText}>Pinned</Text>
                    </View>
                )}
            </View>

            <Text style={styles.title}>{post.title}</Text>

            {post.category && (
                <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{post.category}</Text>
                </View>
            )}

            <Text style={styles.content}>{post.content}</Text>

            <View style={styles.actions}>
                <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
                    <MaterialIcons
                        name={post.likes?.includes('currentUserId') ? 'thumb-up' : 'thumb-up-off-alt'}
                        size={24}
                        color="#4CAF50"
                    />
                    <Text style={styles.actionText}>{post.likes?.length || 0} Likes</Text>
                </TouchableOpacity>
                <View style={styles.actionButton}>
                    <MaterialIcons name="comment" size={24} color="#666" />
                    <Text style={styles.actionText}>{post.replies?.length || 0} Comments</Text>
                </View>
            </View>

            <View style={styles.divider} />

            {/* Add Comment */}
            <View style={styles.commentSection}>
                <Text style={styles.sectionTitle}>Add a Comment</Text>
                <TextInput
                    style={styles.commentInput}
                    placeholder="Share your thoughts..."
                    value={comment}
                    onChangeText={setComment}
                    multiline
                    numberOfLines={4}
                />
                <TouchableOpacity style={styles.commentButton} onPress={handleComment}>
                    <Text style={styles.commentButtonText}>Post Comment</Text>
                </TouchableOpacity>
            </View>

            {/* Comments List */}
            {post.replies && post.replies.length > 0 && (
                <View style={styles.commentsSection}>
                    <Text style={styles.sectionTitle}>Comments ({post.replies.length})</Text>
                    {post.replies.map((reply, index) => (
                        <View key={index} style={styles.commentCard}>
                            <View style={styles.commentHeader}>
                                <MaterialIcons name="account-circle" size={32} color="#4CAF50" />
                                <View style={styles.commentAuthorInfo}>
                                    <Text style={styles.commentAuthor}>{reply.user?.name || 'Anonymous'}</Text>
                                    <Text style={styles.commentDate}>
                                        {new Date(reply.createdAt).toLocaleDateString()}
                                    </Text>
                                </View>
                            </View>
                            <Text style={styles.commentText}>{reply.content}</Text>
                        </View>
                    ))}
                </View>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    authorInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    authorDetails: {
        marginLeft: 12,
    },
    authorName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    postDate: {
        fontSize: 14,
        color: '#999',
    },
    pinnedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF3E0',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    pinnedText: {
        marginLeft: 4,
        fontSize: 12,
        color: '#FF9800',
        fontWeight: 'bold',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        paddingHorizontal: 16,
        marginBottom: 12,
        color: '#333',
    },
    categoryBadge: {
        alignSelf: 'flex-start',
        backgroundColor: '#E3F2FD',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        marginHorizontal: 16,
        marginBottom: 16,
    },
    categoryText: {
        fontSize: 14,
        color: '#2196F3',
        fontWeight: 'bold',
    },
    content: {
        fontSize: 16,
        lineHeight: 24,
        paddingHorizontal: 16,
        marginBottom: 24,
        color: '#666',
    },
    actions: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        gap: 24,
        marginBottom: 16,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionText: {
        marginLeft: 8,
        fontSize: 16,
        color: '#666',
    },
    divider: {
        height: 1,
        backgroundColor: '#e0e0e0',
        marginVertical: 16,
    },
    commentSection: {
        padding: 16,
    },
    commentsSection: {
        padding: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
        color: '#333',
    },
    commentInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginBottom: 12,
        textAlignVertical: 'top',
    },
    commentButton: {
        backgroundColor: '#4CAF50',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    commentButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    commentCard: {
        backgroundColor: '#f5f5f5',
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
    },
    commentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    commentAuthorInfo: {
        marginLeft: 8,
    },
    commentAuthor: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
    },
    commentDate: {
        fontSize: 12,
        color: '#999',
    },
    commentText: {
        fontSize: 14,
        color: '#666',
    },
    errorText: {
        color: '#c62828',
        fontSize: 16,
    },
});

export default ForumPostDetailScreen;
