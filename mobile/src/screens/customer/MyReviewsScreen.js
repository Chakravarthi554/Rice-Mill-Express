import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { Card, Title, Paragraph, Divider, IconButton } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { getUserReviews, deleteReview } from '../../redux/actions/reviewActions';

const MyReviewsScreen = ({ navigation }) => {
    const dispatch = useDispatch();

    const userReviews = useSelector((state) => state.userReviews);
    const { loading, error, reviews } = userReviews;

    const deleteReviewState = useSelector((state) => state.deleteReview);
    const { success: deleteSuccess, error: deleteError } = deleteReviewState;

    useEffect(() => {
        dispatch(getUserReviews());
    }, [dispatch]);

    useEffect(() => {
        if (deleteSuccess) {
            Alert.alert('Success', 'Review deleted successfully');
        }
        if (deleteError) {
            Alert.alert('Error', deleteError);
        }
    }, [deleteSuccess, deleteError]);

    const handleDelete = (productId) => {
        Alert.alert(
            'Delete Review',
            'Are you sure you want to delete this review?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', onPress: () => dispatch(deleteReview(productId)), style: 'destructive' }
            ]
        );
    };

    const handleEdit = (review) => {
        // Navigate to product detail where they can edit the review
        navigation.navigate('ProductDetail', { productId: review.product, editReview: true });
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

    const renderReview = ({ item }) => (
        <Card style={styles.reviewCard}>
            <Card.Content>
                <View style={styles.reviewHeader}>
                    <View style={{ flex: 1 }}>
                        <Title style={styles.productName}>{item.productName || 'Product'}</Title>
                        {renderStars(item.rating)}
                    </View>
                    <View style={styles.actionButtons}>
                        <IconButton
                            icon="pencil"
                            size={20}
                            onPress={() => handleEdit(item)}
                        />
                        <IconButton
                            icon="delete"
                            size={20}
                            iconColor="#F44336"
                            onPress={() => handleDelete(item.product)}
                        />
                    </View>
                </View>
                <Paragraph style={styles.reviewText}>{item.comment}</Paragraph>
                <Text style={styles.reviewDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
            </Card.Content>
        </Card>
    );

    if (loading && reviews.length === 0) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#4CAF50" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={reviews}
                keyExtractor={(item) => item._id}
                renderItem={renderReview}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <MaterialIcons name="rate-review" size={64} color="#ccc" />
                        <Text style={styles.emptyText}>You haven't reviewed any products yet</Text>
                    </View>
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
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 16,
    },
    reviewCard: {
        marginBottom: 16,
        elevation: 2,
    },
    reviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    productName: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    starsContainer: {
        flexDirection: 'row',
        marginTop: 4,
    },
    actionButtons: {
        flexDirection: 'row',
    },
    reviewText: {
        fontSize: 14,
        color: '#444',
        fontStyle: 'italic',
        marginTop: 8,
    },
    reviewDate: {
        fontSize: 12,
        color: '#999',
        marginTop: 12,
        textAlign: 'right',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 100,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        color: '#999',
    },
});

export default MyReviewsScreen;
