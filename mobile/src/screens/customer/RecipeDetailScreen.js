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
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { MaterialIcons } from '@expo/vector-icons';
import {
    getRecipeDetails,
    rateRecipe,
    commentOnRecipe,
} from '../../redux/actions/recipeActions';

const RecipeDetailScreen = ({ route, navigation }) => {
    const { recipeId } = route.params;
    const dispatch = useDispatch();
    const { recipe, loading, error } = useSelector((state) => state.recipeDetails);
    const [comment, setComment] = useState('');
    const [userRating, setUserRating] = useState(0);

    useEffect(() => {
        dispatch(getRecipeDetails(recipeId));
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
            {recipe.image && (
                <Image source={{ uri: recipe.image }} style={styles.headerImage} />
            )}

            <View style={styles.content}>
                <Text style={styles.title}>{recipe.title}</Text>

                <View style={styles.metaContainer}>
                    <View style={styles.ratingContainer}>
                        <MaterialIcons name="star" size={20} color="#FFD700" />
                        <Text style={styles.ratingText}>
                            {recipe.averageRating?.toFixed(1) || '0.0'} ({recipe.numReviews || 0} reviews)
                        </Text>
                    </View>
                    <View style={styles.authorContainer}>
                        <MaterialIcons name="person" size={20} color="#666" />
                        <Text style={styles.authorText}>{recipe.seller?.name || 'Unknown'}</Text>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Description</Text>
                    <Text style={styles.description}>{recipe.description}</Text>
                </View>

                {recipe.ingredients && recipe.ingredients.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Ingredients</Text>
                        {recipe.ingredients.map((ingredient, index) => (
                            <View key={index} style={styles.listItem}>
                                <MaterialIcons name="fiber-manual-record" size={8} color="#4CAF50" />
                                <Text style={styles.listItemText}>{ingredient}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {recipe.instructions && recipe.instructions.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Instructions</Text>
                        {recipe.instructions.map((instruction, index) => (
                            <View key={index} style={styles.listItem}>
                                <Text style={styles.stepNumber}>{index + 1}.</Text>
                                <Text style={styles.listItemText}>{instruction}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Rating Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Rate this Recipe</Text>
                    <View style={styles.starsContainer}>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <TouchableOpacity key={star} onPress={() => handleRate(star)}>
                                <MaterialIcons
                                    name={star <= userRating ? 'star' : 'star-border'}
                                    size={32}
                                    color="#FFD700"
                                />
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Comment Section */}
                <View style={styles.section}>
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
                {recipe.comments && recipe.comments.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Comments ({recipe.comments.length})</Text>
                        {recipe.comments.map((comment, index) => (
                            <View key={index} style={styles.commentCard}>
                                <Text style={styles.commentAuthor}>{comment.user?.name || 'Anonymous'}</Text>
                                <Text style={styles.commentText}>{comment.content}</Text>
                                <Text style={styles.commentDate}>
                                    {new Date(comment.createdAt).toLocaleDateString()}
                                </Text>
                            </View>
                        ))}
                    </View>
                )}
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
    headerImage: {
        width: '100%',
        height: 250,
        resizeMode: 'cover',
    },
    content: {
        padding: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
        color: '#333',
    },
    metaContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ratingText: {
        marginLeft: 8,
        fontSize: 16,
        color: '#666',
    },
    authorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    authorText: {
        marginLeft: 8,
        fontSize: 16,
        color: '#666',
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
        color: '#333',
    },
    description: {
        fontSize: 16,
        lineHeight: 24,
        color: '#666',
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    listItemText: {
        flex: 1,
        marginLeft: 8,
        fontSize: 16,
        color: '#666',
    },
    stepNumber: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#4CAF50',
        marginRight: 8,
    },
    starsContainer: {
        flexDirection: 'row',
        gap: 8,
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
    commentAuthor: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 4,
        color: '#333',
    },
    commentText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    commentDate: {
        fontSize: 12,
        color: '#999',
    },
    errorText: {
        color: '#c62828',
        fontSize: 16,
    },
});

export default RecipeDetailScreen;
