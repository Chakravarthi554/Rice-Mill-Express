import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Alert,
    Share,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { MaterialIcons } from '@expo/vector-icons';
import {
    getRecipeDetails,
    rateRecipe,
    commentOnRecipe,
    likeRecipe,
    shareRecipe,
    likeRecipeComment,
    replyToRecipeComment,
} from '../redux/actions/recipeActions';
import { addToCart } from '../redux/actions/cartActions';
import { getImageUrl } from '../utils/url';
import {
    subscribeToSocialUpdates,
    unsubscribeFromSocialUpdates,
    joinRoom,
    leaveRoom
} from '../services/socket';
import { API_URL } from '../config/env';

const RecipeDetailScreen = ({ route, navigation }) => {
    const { recipeId } = route.params;
    const dispatch = useDispatch();
    const { recipe, loading, error } = useSelector((state) => state.recipeDetails);
    const [comment, setComment] = useState('');
    const [userRating, setUserRating] = useState(0);
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyText, setReplyText] = useState('');

    useEffect(() => {
        dispatch(getRecipeDetails(recipeId));

        // Join the recipe room for real-time updates
        const roomName = `recipe_${recipeId}`;
        joinRoom(roomName);

        // Subscribe to real-time updates
        subscribeToSocialUpdates((data) => {
            console.log('📡 Socket SOCIAL_UPDATE received:', data.type, 'for ID:', data.itemId);
            if (data.itemId && data.itemId.toString() === recipeId.toString()) {
                console.log('🔥 Recipe Match! Refreshing details...');
                dispatch(getRecipeDetails(recipeId));
            }
        });

        return () => {
            unsubscribeFromSocialUpdates();
            leaveRoom(roomName);
        };
    }, [dispatch, recipeId]);

    const handleRate = (rating) => {
        setUserRating(rating);
        dispatch(rateRecipe(recipeId, rating));
        Alert.alert('Success', 'Thank you for rating this recipe!');
    };

    const handleComment = () => {
        if (!comment.trim()) {
            Alert.alert('Error', 'Please enter a comment');
            return;
        }
        dispatch(commentOnRecipe(recipeId, comment));
        setComment('');
        Alert.alert('Success', 'Comment added successfully!');
    };

    const handleLike = () => {
        dispatch(likeRecipe(recipeId));
    };

    const handleShare = async () => {
        try {
            // Include link in message for Android since Android ignores the 'url' property
            const appUrl = `${API_URL}/recipes/${recipeId}`;
            const message = `Check out this delicious recipe: ${recipe.title}\n\nView here: ${appUrl}\n\nDownload the Rice Mill App to see more!`;

            const result = await Share.share({
                title: recipe.title,
                message,
                url: appUrl, // iOS only
            });
            if (result.action === Share.sharedAction) {
                dispatch(shareRecipe(recipeId));
            }
        } catch (error) {
            console.error('Error sharing recipe:', error);
        }
    };

    const handleLikeComment = (commentId) => {
        dispatch(likeRecipeComment(recipeId, commentId));
    };

    const handleReplyToComment = (commentId) => {
        if (!replyText.trim()) return;
        dispatch(replyToRecipeComment(recipeId, commentId, replyText));
        setReplyText('');
        setReplyingTo(null);
    };

    if (loading && !recipe?._id) {
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
            <View style={styles.headerContainer}>
                {recipe.image && (
                    <Image source={{ uri: getImageUrl(recipe.image) }} style={styles.headerImage} />
                )}
                <View style={styles.headerOverlay}>
                    <Text style={styles.title}>{recipe.title}</Text>
                    <View style={styles.headerMeta}>
                        <View style={[styles.badge, { backgroundColor: '#4CAF50' }]}>
                            <Text style={styles.badgeText}>{recipe.riceType}</Text>
                        </View>
                        <Text style={styles.authorText}>By {recipe.sellerId?.name || 'Unknown'}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.socialBar}>
                <TouchableOpacity style={styles.socialItem} onPress={handleLike}>
                    <MaterialIcons
                        name={recipe.userLiked ? "favorite" : "favorite-border"}
                        size={24}
                        color={recipe.userLiked ? "#f44336" : "#666"}
                    />
                    <Text style={[styles.socialText, recipe.userLiked && { color: "#f44336" }]}>
                        {recipe.likesCount || 0} Likes
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.socialItem}>
                    <MaterialIcons name="comment" size={24} color="#666" />
                    <Text style={styles.socialText}>{recipe.commentsCount || 0} Comments</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.socialItem} onPress={handleShare}>
                    <MaterialIcons name="share" size={24} color="#666" />
                    <Text style={styles.socialText}>{recipe.sharesCount || 0} Shares</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Ingredients</Text>
                    <View style={styles.ingredientsCard}>
                        {recipe.ingredients?.map((ingredient, index) => (
                            <View key={index} style={styles.listItem}>
                                <MaterialIcons name="check-circle" size={18} color="#4CAF50" />
                                <Text style={styles.listItemText}>{ingredient}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Instructions</Text>
                    {recipe.steps?.map((step, index) => (
                        <View key={index} style={styles.stepItem}>
                            <View style={styles.stepNumberBadge}>
                                <Text style={styles.stepNumberText}>{index + 1}</Text>
                            </View>
                            <Text style={styles.listItemText}>{step}</Text>
                        </View>
                    ))}
                </View>

                {/* Shop Ingredients */}
                {recipe.linkedProducts?.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Shop Ingredients</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.productsScroll}>
                            {recipe.linkedProducts.map((product) => (
                                <View key={product._id} style={styles.productCard}>
                                    <Image
                                        source={{ uri: getImageUrl(product.images?.[0]) || 'https://via.placeholder.com/100' }}
                                        style={styles.productImage}
                                    />
                                    <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
                                    <Text style={styles.productPrice}>₹{product.price}</Text>
                                    <TouchableOpacity
                                        style={styles.addToCartButton}
                                        onPress={() => {
                                            dispatch(addToCart(product._id, 1));
                                            Alert.alert('Success', 'Added to cart!');
                                        }}
                                    >
                                        <Text style={styles.addToCartText}>Add to Cart</Text>
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* Rating Breakdown */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Ratings & Reviews</Text>
                    <View style={styles.ratingOverview}>
                        <View style={styles.ratingBig}>
                            <Text style={styles.ratingNumber}>{(recipe.averageRating || recipe.rating || 0).toFixed(1)}</Text>
                            <View style={styles.starsRow}>
                                {[1, 2, 3, 4, 5].map(s => (
                                    <MaterialIcons
                                        key={s}
                                        name={s <= (recipe.averageRating || 0) ? 'star' : 'star-border'}
                                        size={16}
                                        color="#FFD700"
                                    />
                                ))}
                            </View>
                            <Text style={styles.ratingCount}>Based on {recipe.numReviews || 0} ratings</Text>
                        </View>
                        <View style={styles.breakdown}>
                            {[5, 4, 3, 2, 1].map((star) => {
                                const count = recipe.ratingDistribution?.[star] || 0;
                                const percentage = recipe.numReviews > 0 ? (count / recipe.numReviews) * 100 : 0;
                                return (
                                    <View key={star} style={styles.breakdownRow}>
                                        <Text style={styles.starLabel}>{star} ★</Text>
                                        <View style={styles.progressContainer}>
                                            <View style={[styles.progressBar, { width: `${percentage}%` }]} />
                                        </View>
                                        <Text style={styles.starCount}>{count}</Text>
                                    </View>
                                );
                            })}
                        </View>
                    </View>

                    <Text style={styles.subSectionTitle}>Rate this Recipe</Text>
                    <View style={styles.starsContainer}>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <TouchableOpacity key={star} onPress={() => handleRate(star)}>
                                <MaterialIcons
                                    name={star <= userRating ? 'star' : 'star-border'}
                                    size={40}
                                    color="#FFD700"
                                />
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Comments List */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Comments ({recipe.comments?.length || 0})</Text>
                    <View style={styles.commentInputContainer}>
                        <TextInput
                            style={styles.commentInput}
                            placeholder="Share your thoughts..."
                            value={comment}
                            onChangeText={setComment}
                            multiline
                        />
                        <TouchableOpacity style={styles.sendButton} onPress={handleComment}>
                            <MaterialIcons name="send" size={24} color="#4CAF50" />
                        </TouchableOpacity>
                    </View>

                    {recipe.comments?.map((comment, index) => (
                        <View key={comment._id || index} style={styles.commentCard}>
                            <View style={styles.commentMain}>
                                <Image
                                    source={{ uri: getImageUrl(comment.userId?.profilePic) || 'https://via.placeholder.com/40' }}
                                    style={styles.commentAvatar}
                                />
                                <View style={styles.commentContentContainer}>
                                    <View style={styles.commentHeader}>
                                        <Text style={styles.commentAuthor}>{comment.userId?.name || 'Anonymous'}</Text>
                                        <Text style={styles.commentDate}>
                                            {new Date(comment.createdAt).toLocaleDateString()}
                                        </Text>
                                    </View>
                                    <Text style={styles.commentText}>{comment.content}</Text>

                                    <View style={styles.commentActions}>
                                        <TouchableOpacity
                                            style={styles.commentActionItem}
                                            onPress={() => handleLikeComment(comment._id)}
                                        >
                                            <MaterialIcons
                                                name={comment.userLiked ? "favorite" : "favorite-border"}
                                                size={18}
                                                color={comment.userLiked ? "#f44336" : "#666"}
                                            />
                                            <Text style={[styles.commentActionText, comment.userLiked && { color: "#f44336" }]}>
                                                {comment.likesCount || 0}
                                            </Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={styles.commentActionItem}
                                            onPress={() => setReplyingTo(replyingTo === comment._id ? null : comment._id)}
                                        >
                                            <MaterialIcons name="reply" size={18} color="#666" />
                                            <Text style={styles.commentActionText}>Reply</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>

                            {/* Reply Input */}
                            {replyingTo === comment._id && (
                                <View style={styles.replyInputContainer}>
                                    <TextInput
                                        style={styles.replyInput}
                                        placeholder="Write a reply..."
                                        value={replyText}
                                        onChangeText={setReplyText}
                                        multiline
                                    />
                                    <TouchableOpacity
                                        style={styles.replySendButton}
                                        onPress={() => handleReplyToComment(comment._id)}
                                    >
                                        <MaterialIcons name="send" size={20} color="#4CAF50" />
                                    </TouchableOpacity>
                                </View>
                            )}

                            {/* Nested Replies */}
                            {comment.replies && comment.replies.length > 0 && (
                                <View style={styles.repliesContainer}>
                                    {comment.replies.map((reply, rIndex) => (
                                        <View key={reply._id || rIndex} style={styles.replyCard}>
                                            <Image
                                                source={{ uri: getImageUrl(reply.userId?.profilePic) || 'https://via.placeholder.com/30' }}
                                                style={styles.replyAvatar}
                                            />
                                            <View style={styles.replyContent}>
                                                <View style={styles.commentHeader}>
                                                    <Text style={styles.replyAuthor}>{reply.userId?.name || 'Anonymous'}</Text>
                                                    <Text style={styles.commentDate}>
                                                        {new Date(reply.createdAt).toLocaleDateString()}
                                                    </Text>
                                                </View>
                                                <Text style={styles.commentText}>{reply.content}</Text>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    ))}
                </View>
            </View>
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
    headerContainer: {
        position: 'relative',
        height: 300,
    },
    headerImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    headerOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
    },
    headerMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    badge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 4,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#fff',
    },
    authorText: {
        fontSize: 14,
        color: '#eee',
    },
    socialBar: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        backgroundColor: '#fff',
    },
    socialItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    socialText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    content: {
        padding: 16,
    },
    section: {
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
        color: '#333',
    },
    subSectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 20,
        marginBottom: 12,
        color: '#444',
    },
    ingredientsCard: {
        backgroundColor: '#F9F9F9',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#EEE',
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    listItemText: {
        flex: 1,
        marginLeft: 12,
        fontSize: 16,
        color: '#444',
        lineHeight: 22,
    },
    stepItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    stepNumberBadge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#4CAF50',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 2,
    },
    stepNumberText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    productsScroll: {
        marginHorizontal: -16,
        paddingHorizontal: 16,
    },
    productCard: {
        width: 150,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        marginRight: 16,
        borderWidth: 1,
        borderColor: '#eee',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    productImage: {
        width: '100%',
        height: 100,
        borderRadius: 8,
        marginBottom: 8,
    },
    productName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    productPrice: {
        fontSize: 14,
        color: '#4CAF50',
        fontWeight: 'bold',
        marginBottom: 8,
    },
    addToCartButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 6,
        borderRadius: 6,
        alignItems: 'center',
    },
    addToCartText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    ratingOverview: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#eee',
    },
    ratingBig: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingRight: 20,
        borderRightWidth: 1,
        borderRightColor: '#eee',
    },
    ratingNumber: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#333',
    },
    starsRow: {
        flexDirection: 'row',
        marginVertical: 4,
    },
    ratingCount: {
        fontSize: 12,
        color: '#999',
    },
    breakdown: {
        flex: 1,
        paddingLeft: 20,
        justifyContent: 'center',
    },
    breakdownRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    starLabel: {
        width: 30,
        fontSize: 12,
        color: '#666',
    },
    progressContainer: {
        flex: 1,
        height: 8,
        backgroundColor: '#f0f0f0',
        borderRadius: 4,
        marginHorizontal: 8,
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#4CAF50',
        borderRadius: 4,
    },
    starCount: {
        width: 20,
        fontSize: 12,
        color: '#999',
        textAlign: 'right',
    },
    starsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
        paddingVertical: 10,
    },
    commentInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 25,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginBottom: 20,
    },
    commentInput: {
        flex: 1,
        fontSize: 16,
        maxHeight: 100,
        color: '#333',
    },
    sendButton: {
        marginLeft: 10,
    },
    commentCard: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    commentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
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
        color: '#444',
        lineHeight: 20,
        marginTop: 4,
    },
    commentMain: {
        flexDirection: 'row',
    },
    commentAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
        backgroundColor: '#eee',
    },
    commentContentContainer: {
        flex: 1,
    },
    commentActions: {
        flexDirection: 'row',
        marginTop: 8,
        gap: 16,
    },
    commentActionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    commentActionText: {
        fontSize: 12,
        color: '#666',
    },
    replyInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        marginLeft: 52,
        backgroundColor: '#f5f5f5',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 4,
    },
    replyInput: {
        flex: 1,
        fontSize: 13,
        paddingVertical: 4,
        maxHeight: 80,
    },
    replySendButton: {
        padding: 4,
    },
    repliesContainer: {
        marginLeft: 52,
        marginTop: 12,
        borderLeftWidth: 1,
        borderLeftColor: '#eee',
        paddingLeft: 12,
    },
    replyCard: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    replyAvatar: {
        width: 30,
        height: 30,
        borderRadius: 15,
        marginRight: 10,
        backgroundColor: '#eee',
    },
    replyContent: {
        flex: 1,
    },
    replyAuthor: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#333',
    },
    errorText: {
        color: '#c62828',
        fontSize: 16,
    },
});

export default RecipeDetailScreen;
