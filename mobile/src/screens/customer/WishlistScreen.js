import React, { useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Image, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { getWishlist, removeFromWishlist } from '../../redux/actions/wishlistActions';
import { addToCart } from '../../redux/actions/cartActions';

const WishlistScreen = ({ navigation }) => {
    const dispatch = useDispatch();
    const wishlist = useSelector((state) => state.wishlist);
    const { wishlistItems = [], loading, error } = wishlist || {};

    useEffect(() => {
        dispatch(getWishlist());
    }, [dispatch]);

    const handleRemove = (productId) => {
        dispatch(removeFromWishlist(productId));
    };

    const handleAddToCart = (item) => {
        dispatch(addToCart(item._id, 1));
        Alert.alert('Success', 'Added to cart!');
    };

    const renderItem = ({ item }) => {
        const firstImage = item.images?.[0] || item.image;
        const imageUri = firstImage?.startsWith('http')
            ? firstImage
            : firstImage
                ? `${process.env.EXPO_PUBLIC_API_URL}${firstImage}`
                : 'https://via.placeholder.com/150';

        const hasOffer = typeof item.offerPrice === 'number' && item.offerPrice > 0 && item.offerPrice < item.price;
        const displayPrice = hasOffer ? item.offerPrice : item.price;

        return (
            <View style={styles.card}>
                <TouchableOpacity
                    style={styles.clickableArea}
                    onPress={() => navigation.navigate('ProductDetail', { productId: item._id })}
                >
                    <Image source={{ uri: imageUri }} style={styles.image} />
                    <View style={styles.details}>
                        <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={styles.price}>₹{displayPrice}</Text>
                            {hasOffer && (
                                <Text style={styles.originalPrice}>₹{item.price}</Text>
                            )}
                        </View>
                        <View style={styles.actionRow}>
                            <TouchableOpacity
                                style={styles.addToCartButton}
                                onPress={() => handleAddToCart(item)}
                            >
                                <MaterialIcons name="add-shopping-cart" size={20} color="#fff" />
                                <Text style={styles.addToCartText}>Add to Cart</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.removeButton}
                                onPress={() => handleRemove(item._id)}
                            >
                                <MaterialIcons name="delete-outline" size={24} color="#F44336" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </View>
        );
    };

    if (loading && wishlistItems.length === 0) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#4CAF50" />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centerContainer}>
                <MaterialIcons name="error-outline" size={48} color="#f44336" />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={() => dispatch(getWishlist())}>
                    <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {wishlistItems.length === 0 ? (
                <View style={styles.centerContainer}>
                    <MaterialIcons name="favorite-border" size={100} color="#ccc" />
                    <Text style={styles.emptyText}>Your wishlist is empty</Text>
                    <TouchableOpacity
                        style={styles.shopButton}
                        onPress={() => navigation.navigate('Home')}
                    >
                        <Text style={styles.shopButtonText}>Explore Products</Text>
                    </TouchableOpacity>
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
        padding: 20,
    },
    list: {
        padding: 16,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 12,
        marginBottom: 16,
        overflow: 'hidden',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    clickableArea: {
        flexDirection: 'row',
    },
    image: {
        width: 120,
        height: 120,
        resizeMode: 'cover',
    },
    details: {
        flex: 1,
        padding: 12,
        justifyContent: 'space-between',
    },
    name: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    price: {
        fontSize: 18,
        color: '#4CAF50',
        fontWeight: 'bold',
    },
    originalPrice: {
        fontSize: 14,
        color: '#999',
        textDecorationLine: 'line-through',
        marginLeft: 8,
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    addToCartButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4CAF50',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    addToCartText: {
        color: '#fff',
        marginLeft: 4,
        fontSize: 12,
        fontWeight: 'bold',
    },
    removeButton: {
        padding: 4,
    },
    emptyText: {
        fontSize: 18,
        color: '#888',
        marginTop: 10,
        marginBottom: 20,
    },
    shopButton: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    shopButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    errorText: {
        color: '#f44336',
        marginTop: 10,
        textAlign: 'center',
    },
    retryButton: {
        marginTop: 20,
        padding: 10,
        backgroundColor: '#4CAF50',
        borderRadius: 5,
    },
    retryText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});

export default WishlistScreen;
