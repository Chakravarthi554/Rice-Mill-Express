import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    Image,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { MaterialIcons } from '@expo/vector-icons';
import { getRecipes } from '../../redux/actions/recipeActions';

const RecipesScreen = ({ navigation }) => {
    const dispatch = useDispatch();
    const { recipes, loading, error } = useSelector((state) => state.recipeList);
    const [searchQuery, setSearchQuery] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        dispatch(getRecipes());
    }, [dispatch]);

    const handleRefresh = () => {
        setRefreshing(true);
        dispatch(getRecipes(searchQuery)).finally(() => setRefreshing(false));
    };

    const handleSearch = () => {
        dispatch(getRecipes(searchQuery));
    };

    const renderRecipeCard = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('RecipeDetail', { recipeId: item._id })}
        >
            {item.image && (
                <Image source={{ uri: item.image }} style={styles.recipeImage} />
            )}
            <View style={styles.cardContent}>
                <Text style={styles.recipeTitle}>{item.title}</Text>
                <Text style={styles.recipeDescription} numberOfLines={2}>
                    {item.description}
                </Text>
                <View style={styles.recipeFooter}>
                    <View style={styles.ratingContainer}>
                        <MaterialIcons name="star" size={16} color="#FFD700" />
                        <Text style={styles.ratingText}>
                            {item.averageRating?.toFixed(1) || '0.0'} ({item.numReviews || 0})
                        </Text>
                    </View>
                    <View style={styles.authorContainer}>
                        <MaterialIcons name="person" size={16} color="#666" />
                        <Text style={styles.authorText}>{item.seller?.name || 'Unknown'}</Text>
                    </View>
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
            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search recipes..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onSubmitEditing={handleSearch}
                />
                <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
                    <MaterialIcons name="search" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            {error && (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            )}

            <FlatList
                data={recipes}
                renderItem={renderRecipeCard}
                keyExtractor={(item) => item._id}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                }
                ListEmptyComponent={
                    !loading && (
                        <View style={styles.emptyContainer}>
                            <MaterialIcons name="restaurant-menu" size={64} color="#ccc" />
                            <Text style={styles.emptyText}>No recipes found</Text>
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
    searchContainer: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
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
        marginBottom: 16,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    recipeImage: {
        width: '100%',
        height: 200,
        resizeMode: 'cover',
    },
    cardContent: {
        padding: 16,
    },
    recipeTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#333',
    },
    recipeDescription: {
        fontSize: 14,
        color: '#666',
        marginBottom: 12,
    },
    recipeFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ratingText: {
        marginLeft: 4,
        fontSize: 14,
        color: '#666',
    },
    authorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    authorText: {
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

export default RecipesScreen;
