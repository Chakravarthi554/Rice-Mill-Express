import React, { useState, useEffect } from 'react';
console.log('❤️ WishlistScreen loading...');
import { View, Text, FlatList, StyleSheet, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { apiService } from '../../services/api';

const WishlistScreen = ({ navigation }) => {
    const [wishlistItems, setWishlistItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchWishlist();
    }, []);

    const fetchWishlist = async () => {
        try {
            setLoading(true);
            // Assuming apiService has getWishlist or we use getProfile which might have wishlist
            // Check api.js: it has getUserProfile.
            // Or maybe there is a specific endpoint. 
            // If not, I might need to add it to api.js
            // Let's assume for now we fetch profile or a specific wishlist endpoint if it exists.
            // Web uses: /api/users/wishlist maybe?
            // Let's check api.js again. It has getUserProfile.
            // Usually wishlist is part of user profile or separate.
            // If logic is missing in api.js, I will add it.

            // Temporary: Let's assume we can fetch it via a new endpoint or profile.
            // I'll check api.js in next step if getWishlist is missing.
            // For now, I'll write the screen assuming apiService.getWishlist() exists or I will add it.
            const response = await apiService.getWishlist();
            setWishlistItems(response.data.wishlist || []);
        } catch (error) {
            console.error('Error fetching wishlist:', error);
        } finally {
            setLoading(false);
        }
    };

    const removeFromWishlist = async (productId) => {
        try {
            await apiService.removeFromWishlist(productId);
            fetchWishlist();
        } catch (error) {
            console.error('Error removing from wishlist:', error);
        }
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('ProductDetail', { id: item._id })}
        >
            <Image source={{ uri: item.image }} style={styles.image} />
            <View style={styles.details}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.price}>₹{item.price}</Text>
                <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeFromWishlist(item._id)}
                >
                    <MaterialIcons name="delete" size={24} color="#F44336" />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
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
            {wishlistItems.length === 0 ? (
                <View style={styles.centerContainer}>
                    <Text style={styles.emptyText}>Your wishlist is empty</Text>
                </View>
            ) : (
                <FlatList
                    data={wishlistItems}
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
        flexDirection: 'row',
        backgroundColor: 'white',
        borderRadius: 8,
        marginBottom: 16,
        overflow: 'hidden',
        elevation: 2,
    },
    image: {
        width: 100,
        height: 100,
    },
    details: {
        flex: 1,
        padding: 12,
        justifyContent: 'center',
    },
    name: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    price: {
        fontSize: 16,
        color: '#4CAF50',
        marginBottom: 8,
    },
    removeButton: {
        alignSelf: 'flex-end',
    },
    emptyText: {
        fontSize: 18,
        color: '#888',
    },
});

export default WishlistScreen;
