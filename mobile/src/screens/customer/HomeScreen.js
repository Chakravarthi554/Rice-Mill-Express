import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    RefreshControl,
    TextInput,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { apiService } from '../../services/api';
import { addToWishlist, removeFromWishlist, getWishlist } from '../../redux/actions/wishlistActions';

export default function HomeScreen({ navigation }) {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchProducts();
        dispatch(getWishlist());
    }, [dispatch]);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const response = await apiService.getProducts();
            setProducts(response.data.products || []);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchProducts();
    };

    const filteredProducts = products.filter((product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const wishlist = useSelector((state) => state.wishlist);
    const { wishlistItems = [] } = wishlist || {};
    const dispatch = useDispatch();

    const isWishlisted = (id) => wishlistItems.some((x) => (x._id || x) === id);

    const toggleWishlist = (product) => {
        if (isWishlisted(product._id)) {
            dispatch(removeFromWishlist(product._id));
        } else {
            dispatch(addToWishlist(product._id));
        }
    };

    const renderProduct = ({ item }) => {
        const imageUri = item.images?.[0]?.startsWith('http')
            ? item.images[0]
            : item.images?.[0]
                ? `${process.env.EXPO_PUBLIC_API_URL}${item.images[0]}`
                : 'https://via.placeholder.com/150';

        const favorited = isWishlisted(item._id);
        const hasOffer = typeof item.offerPrice === 'number' && item.offerPrice > 0 && item.offerPrice < item.price;
        const displayPrice = hasOffer ? item.offerPrice : item.price;

        return (
            <TouchableOpacity
                style={styles.productCard}
                onPress={() => navigation.navigate('ProductDetail', { productId: item._id })}
            >
                <View style={styles.imageContainer}>
                    <Image
                        source={{ uri: imageUri }}
                        style={styles.productImage}
                    />
                    {hasOffer && (
                        <View style={styles.offerBadge}>
                            <Text style={styles.offerText}>OFFER</Text>
                        </View>
                    )}
                    <TouchableOpacity
                        style={styles.wishlistIcon}
                        onPress={() => toggleWishlist(item)}
                    >
                        <MaterialIcons
                            name={favorited ? 'favorite' : 'favorite-border'}
                            size={24}
                            color={favorited ? '#f44336' : '#666'}
                        />
                    </TouchableOpacity>
                </View>
                <View style={styles.productInfo}>
                    <Text style={styles.productName} numberOfLines={2}>
                        {item.name}
                    </Text>
                    <View style={styles.priceRow}>
                        <Text style={styles.productPrice}>₹{displayPrice}</Text>
                        {hasOffer && (
                            <Text style={styles.originalPrice}>₹{item.price}</Text>
                        )}
                    </View>
                    <View style={styles.productFooter}>
                        <View style={styles.ratingContainer}>
                            <MaterialIcons name="star" size={16} color="#FFC107" />
                            <Text style={styles.ratingText}>{item.rating || '4.5'}</Text>
                        </View>
                        {item.stock > 0 || item.countInStock > 0 ? (
                            <Text style={styles.inStock}>In Stock</Text>
                        ) : (
                            <Text style={styles.outOfStock}>Out of Stock</Text>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#4CAF50" />
                <Text style={styles.loadingText}>Loading products...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.searchContainer}>
                <MaterialIcons name="search" size={24} color="#666" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search products..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            <FlatList
                data={filteredProducts}
                renderItem={renderProduct}
                keyExtractor={(item) => item._id}
                numColumns={2}
                contentContainerStyle={styles.productList}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4CAF50']} />
                }
                ListHeaderComponent={
                    <View>
                        <View style={styles.quickActions}>
                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={() => navigation.navigate('BulkOrders')}
                            >
                                <MaterialIcons name="shopping-bag" size={24} color="#fff" />
                                <Text style={styles.actionButtonText}>Bulk Order</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.actionButton, { backgroundColor: '#FF9800' }]}
                                onPress={() => navigation.navigate('Cart')}
                            >
                                <MaterialIcons name="shopping-cart" size={24} color="#fff" />
                                <Text style={styles.actionButtonText}>My Cart</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Recommended For You</Text>
                        </View>
                        <FlatList
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            data={products.slice(0, 5)}
                            keyExtractor={(item) => `rec-${item._id}`}
                            renderItem={renderProduct}
                            contentContainerStyle={{ paddingBottom: 15 }}
                        />
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>All Products</Text>
                        </View>
                    </View>
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <MaterialIcons name="shopping-bag" size={80} color="#ccc" />
                        <Text style={styles.emptyText}>No products found</Text>
                    </View>
                }
            />
        </View>
    );
}

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
    loadingText: {
        marginTop: 10,
        color: '#666',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        margin: 15,
        paddingHorizontal: 15,
        borderRadius: 8,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 16,
    },
    productList: {
        padding: 8,
    },
    productCard: {
        flex: 1,
        backgroundColor: '#fff',
        margin: 7,
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    productImage: {
        width: '100%',
        height: 150,
        resizeMode: 'cover',
    },
    imageContainer: {
        position: 'relative',
    },
    wishlistIcon: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'rgba(255,255,255,0.7)',
        padding: 5,
        borderRadius: 20,
    },
    productInfo: {
        padding: 12,
    },
    productName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 5,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    productPrice: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#4CAF50',
    },
    originalPrice: {
        fontSize: 14,
        color: '#999',
        textDecorationLine: 'line-through',
        marginLeft: 8,
    },
    offerBadge: {
        position: 'absolute',
        top: 10,
        left: 10,
        backgroundColor: '#f44336',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    offerText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    quickActions: {
        flexDirection: 'row',
        padding: 15,
        justifyContent: 'space-between',
    },
    actionButton: {
        flex: 1,
        backgroundColor: '#4CAF50',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 10,
        marginHorizontal: 5,
        elevation: 2,
    },
    actionButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        marginLeft: 8,
    },
    productFooter: {
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
        color: '#666',
        fontSize: 14,
    },
    inStock: {
        color: '#4CAF50',
        fontSize: 12,
        fontWeight: '600',
    },
    outOfStock: {
        color: '#f44336',
        fontSize: 12,
        fontWeight: '600',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: 100,
    },
    emptyText: {
        marginTop: 15,
        fontSize: 18,
        color: '#999',
    },
    sectionHeader: {
        paddingHorizontal: 15,
        paddingVertical: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
});
