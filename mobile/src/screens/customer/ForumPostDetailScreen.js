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
    likeForumComment,
    replyToForumComment,
} from '../../redux/actions/forumActions';
import {
    getSocket,
    connectSocket,
    joinRoom,
    leaveRoom,
    subscribeToSocialUpdates,
    unsubscribeFromSocialUpdates
} from '../../services/socket';

const ForumPostDetailScreen = ({ route, navigation }) => {
    const { postId } = route.params;
    const dispatch = useDispatch();
    const { post, loading, error } = useSelector((state) => state.forumPostDetails);
    const { userInfo } = useSelector((state) => state.auth);
    const [comment, setComment] = useState('');
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyText, setReplyText] = useState('');

    useEffect(() => {
        dispatch(getForumPostDetails(postId));

        const roomName = `forum_${postId}`;
        joinRoom(roomName);

        // Listen for specific post updates
        subscribeToSocialUpdates((data) => {
            if (userInfo && data.userId === userInfo._id) return;
            if (data.itemId === postId) {
                dispatch(getForumPostDetails(postId));
            }
        });

        const socket = getSocket();
        if (socket) {
            socket.on('COMMENT_ADDED', (data) => {
                if (userInfo && data.userId === userInfo._id) return;
                if (data.itemId === postId) {
                    dispatch(getForumPostDetails(postId));
                }
            });

            socket.on('POST_DELETED', (data) => {
                if (data.postId === postId) {
                    Alert.alert('Post Deleted', 'This post has been deleted.', [
                        { text: 'OK', onPress: () => navigation.goBack() }
                    ]);
                }
            });
        }

        return () => {
            unsubscribeFromSocialUpdates();
            leaveRoom(roomName);
            const s = getSocket();
            if (s) {
                s.off('COMMENT_ADDED');
                s.off('POST_DELETED');
            }
        };
    }, [dispatch, postId, navigation, userInfo]);

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
        Alert.alert('Success', 'Comment added!');
    };

    const handleLikeComment = (commentId) => {
        dispatch(likeForumComment(postId, commentId));
    };

    const handleReplyToComment = (commentId) => {
        if (!replyText.trim()) {
            Alert.alert('Error', 'Please enter a reply');
            return;
        }
        dispatch(replyToForumComment(postId, commentId, replyText));
        setReplyText('');
        setReplyingTo(null);
        Alert.alert('Success', 'Reply added!');
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
                        name={post.userLiked ? 'thumb-up' : 'thumb-up-off-alt'}
                        size={24}
                        color={post.userLiked ? '#4CAF50' : '#666'}
                    />
                    <Text style={[styles.actionText, post.userLiked && { color: '#4CAF50', fontWeight: 'bold' }]}>
                        {post.likesCount || 0}
                    </Text>
                </TouchableOpacity>
                <View style={styles.actionButton}>
                    <MaterialIcons name="comment" size={24} color="#666" />
                    <Text style={styles.actionText}>{post.replies?.length || post.commentsCount || 0}</Text>
                </View>
                <View style={styles.actionButton}>
                    <MaterialIcons name="share" size={24} color="#666" />
                    <Text style={styles.actionText}>{post.sharesCount || 0}</Text>
                </View>
                <View style={styles.actionButton}>
                    <MaterialIcons name="visibility" size={24} color="#666" />
                    <Text style={styles.actionText}>{post.viewCount || 0}</Text>
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
                        <View key={reply._id || index} style={styles.commentCard}>
                            <View style={styles.commentHeader}>
                                <MaterialIcons name="account-circle" size={32} color="#4CAF50" />
                                <View style={styles.commentAuthorInfo}>
                                    <View style={styles.commentAuthorContainer}>
                                        <Text style={styles.commentAuthor}>{reply.userId?.name || reply.user?.name || 'Anonymous'}</Text>
                                        <Text style={styles.commentDate}>
                                            • {new Date(reply.createdAt).toLocaleDateString()}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                            <Text style={styles.commentText}>{reply.content || reply.text}</Text>

                            {/* Comment Actions: Like & Reply */}
                            <View style={styles.commentActions}>
                                <TouchableOpacity
                                    style={styles.commentActionBtn}
                                    onPress={() => handleLikeComment(reply._id)}
                                >
                                    <MaterialIcons
                                        name={reply.hasLiked ? "favorite" : "favorite-border"}
                                        size={20}
                                        color={reply.hasLiked ? "#F44336" : "#666"}
                                    />
                                    <Text style={[styles.commentActionText, reply.hasLiked && { color: '#F44336' }]}>
                                        {reply.likesCount || 0}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.commentActionBtn}
                                    onPress={() => setReplyingTo(replyingTo === reply._id ? null : reply._id)}
                                >
                                    <MaterialIcons name="reply" size={20} color="#666" />
                                    <Text style={styles.commentActionText}>REPLY</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Reply Input Box */}
                            {replyingTo === reply._id && (
                                <View style={styles.replyInputContainer}>
                                    <TextInput
                                        style={styles.replyInput}
                                        placeholder="Write a reply..."
                                        value={replyText}
                                        onChangeText={setReplyText}
                                        multiline
                                    />
                                    <TouchableOpacity
                                        style={styles.replySendBtn}
                                        onPress={() => handleReplyToComment(reply._id)}
                                    >
                                        <MaterialIcons name="send" size={20} color="#fff" />
                                    </TouchableOpacity>
                                </View>
                            )}

                            {/* Nested Replies */}
                            {reply.nestedReplies && reply.nestedReplies.length > 0 && (
                                <View style={styles.nestedRepliesContainer}>
                                    {reply.nestedReplies.map((nReply) => (
                                        <View key={nReply._id} style={styles.nestedReplyCard}>
                                            <View style={styles.commentHeader}>
                                                <MaterialIcons name="account-circle" size={24} color="#666" />
                                                <View style={styles.commentAuthorInfo}>
                                                    <Text style={styles.nestedAuthor}>{nReply.userId?.name || nReply.user?.name || 'Anonymous'}</Text>
                                                </View>
                                            </View>
                                            <Text style={styles.nestedCommentText}>{nReply.content || nReply.text}</Text>
                                        </View>
                                    ))}
                                </View>
                            )}
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
    commentActions: {
        flexDirection: 'row',
        marginTop: 12,
        gap: 20,
        alignItems: 'center',
    },
    commentActionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    commentActionText: {
        marginLeft: 4,
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    commentAuthorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    replyInputContainer: {
        flexDirection: 'row',
        marginTop: 12,
        backgroundColor: '#fff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#eee',
        padding: 4,
        alignItems: 'flex-end',
    },
    replyInput: {
        flex: 1,
        maxHeight: 100,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 14,
    },
    replySendBtn: {
        backgroundColor: '#4CAF50',
        padding: 8,
        borderRadius: 6,
        marginLeft: 4,
    },
    nestedRepliesContainer: {
        marginTop: 12,
        borderLeftWidth: 2,
        borderLeftColor: '#eee',
        paddingLeft: 12,
    },
    nestedReplyCard: {
        marginBottom: 12,
    },
    nestedAuthor: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#555',
    },
    nestedCommentText: {
        fontSize: 13,
        color: '#777',
        marginTop: 2,
    },
});

export default ForumPostDetailScreen;
