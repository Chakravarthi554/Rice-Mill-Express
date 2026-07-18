import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, TouchableOpacity, Image, ScrollView } from 'react-native';
import { Card, Title, Paragraph, Divider, IconButton } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { getUserReviews, deleteReview } from '../../redux/actions/reviewActions';
import { getImageUrl } from '../../utils/url';

const MyReviewsScreen = ({ navigation }) => {
    const dispatch = useDispatch();
    const { colors } = useTheme();

    const { reviews, loading, error } = useSelector((state) => state.userReviews); // Changed to state.userReviews based on original code

    const deleteReviewState = useSelector((state) => state.deleteReview);
    const { success: deleteSuccess, error: deleteError } = deleteReviewState;

    useEffect(() => {
        dispatch(getUserReviews());
    }, [dispatch, deleteSuccess]); // Added deleteSuccess to refetch reviews after deletion

    useEffect(() => {
        if (deleteSuccess) {
            Alert.alert('Success', 'Review deleted successfully');
            // No need to dispatch getUserReviews here, it's in the other useEffect
        }
        if (deleteError) {
            Alert.alert('Error', deleteError);
        }
    }, [deleteSuccess, deleteError]);

    const handleDelete = (reviewId) => { // Changed productId to reviewId for clarity
        Alert.alert(
            'Delete Review',
            'Are you sure you want to delete this review?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', onPress: () => dispatch(deleteReview(reviewId)), style: 'destructive' }
            ]
        );
    };

    const handleEdit = (review) => {
        // Navigate to the correct detail screen based on targetType
        if (review.targetType === 'Recipe') {
            navigation.navigate('RecipeDetail', {
                recipeId: review.targetId,
                editReview: true,
                initialRating: review.rating,
                initialComment: review.comment
            });
        } else if (review.targetType === 'ForumPost' || review.targetType === 'Forum') {
            navigation.navigate('ForumPostDetail', {
                postId: review.targetId,
                editReview: true,
                initialRating: review.rating,
                initialComment: review.comment
            });
        } else {
            // Default to ProductDetail
            navigation.navigate('ProductDetail', {
                productId: review.targetId || review.productId,
                editReview: true,
                initialRating: review.rating,
                initialComment: review.comment
            });
        }
    };

    const renderStars = (rating) => {
        return (
            <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <MaterialIcons
                        key={star}
                        name={star <= rating ? 'star' : 'star-border'}
                        size={18}
                        color="#FFC107"
                    />
                ))}
            </View>
        );
    };

    const renderReview = ({ item: review }) => { // Destructure item as review
        const productImage = review.productImage ? getImageUrl(review.productImage) : null;
        const productName = review.productName || 'Product Title Unavailable';

        return (
            <View key={review._id} style={[styles.reviewCard, { backgroundColor: colors.surface }]}>
                <View style={styles.header}>
                    {productImage ? (
                        <Image source={{ uri: productImage }} style={styles.productImage} />
                    ) : (
                        <View style={[styles.placeholderIcon, { backgroundColor: colors.background }]}>
                            <MaterialIcons name="image" size={30} color={colors.onSurfaceVariant} />
                        </View>
                    )}
                    <View style={styles.headerInfo}>
                        <Text style={[styles.productName, { color: colors.onSurface }]}>{productName}</Text>
                        <View style={styles.ratingRow}>
                            {renderStars(review.rating)}
                            <Text style={[styles.date, { color: colors.onSurfaceVariant }]}>
                                {new Date(review.createdAt).toLocaleDateString()}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.actionButtons}>
                        <IconButton
                            icon="pencil"
                            size={20}
                            iconColor={colors.primary}
                            onPress={() => handleEdit(review)}
                        />
                        <IconButton
                            icon="delete"
                            size={20}
                            iconColor={colors.error}
                            onPress={() => handleDelete(review._id)} // Pass review._id for deletion
                        />
                    </View>
                </View>
                <Text style={[styles.comment, { color: colors.onSurfaceVariant }]}>"{review.comment}"</Text>
            </View>
        );
    };

    if (loading && reviews.length === 0) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            {reviews && reviews.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <MaterialIcons name="rate-review" size={80} color={colors.onSurfaceVariant} />
                    <Text style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>You haven't written any reviews yet.</Text>
                </View>
            ) : (
                reviews && reviews.map((review) => renderReview({ item: review })) // Map reviews and pass as { item: review }
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    reviewCard: {
        margin: 15,
        padding: 15,
        borderRadius: 12,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    header: {
        flexDirection: 'row',
        marginBottom: 10,
        alignItems: 'flex-start', // Align items to start for proper layout
    },
    productImage: {
        width: 60,
        height: 60,
        borderRadius: 8,
        resizeMode: 'cover',
    },
    placeholderIcon: {
        width: 60,
        height: 60,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerInfo: {
        flex: 1,
        marginLeft: 15,
        justifyContent: 'center',
    },
    productName: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    starsContainer: {
        flexDirection: 'row',
        marginRight: 10,
    },
    date: {
        fontSize: 14,
    },
    actionButtons: {
        flexDirection: 'row',
        marginLeft: 'auto', // Push buttons to the right
    },
    comment: {
        fontSize: 16,
        lineHeight: 24,
        fontStyle: 'italic',
        marginTop: 5,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 100,
    },
    emptyText: {
        marginTop: 20,
        fontSize: 18,
        textAlign: 'center',
        paddingHorizontal: 40,
    },
});

export default MyReviewsScreen;
