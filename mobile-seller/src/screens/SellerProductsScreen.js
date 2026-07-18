import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Image, Alert, Switch } from 'react-native';
import { Card, FAB, ActivityIndicator } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { apiService } from '../services/api';
import { useIsFocused } from '@react-navigation/native';

const SellerProductsScreen = ({ navigation }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const isFocused = useIsFocused();

  const fetchProducts = async () => {
    try {
      const res = await apiService.getProducts();
      // Assume the backend returns the seller's products when authenticated
      setProducts(res.data?.products || res.data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isFocused) {
      fetchProducts();
    }
  }, [isFocused]);

  const handleDelete = (id) => {
    Alert.alert(
      "Delete Product",
      "Are you sure you want to delete this product?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              await apiService.deleteProduct(id);
              fetchProducts();
            } catch (error) {
              console.error('Error deleting product:', error);
              Alert.alert('Error', 'Failed to delete product');
            }
          }
        }
      ]
    );
  const handleToggleStock = async (product, newValue) => {
    try {
      // Opt-in UI update instantly
      setProducts(prev => prev.map(p => p._id === product._id ? { ...p, countInStock: newValue ? 100 : 0 } : p));
      
      const formData = new FormData();
      formData.append('name', product.name);
      formData.append('price', String(product.price));
      formData.append('countInStock', String(newValue ? 100 : 0));
      formData.append('brand', product.brand);
      formData.append('category', product.category);
      formData.append('description', product.description);
      formData.append('weight', String(product.weight));
      formData.append('unit', product.unit);
      
      await apiService.updateProduct(product._id, formData);
    } catch (error) {
      console.error('Error toggling stock:', error);
      fetchProducts(); // Revert on error
    }
  };

  const renderProduct = ({ item }) => {
    const isOutOfStock = item.countInStock <= 0;
    
    return (
    <Card style={[styles.card, isOutOfStock && { opacity: 0.6 }]} onPress={() => navigation.navigate('EditProduct', { product: item })}>
      <Card.Content style={styles.cardContent}>
        <Image 
          source={{ uri: item.images && item.images.length > 0 ? item.images[0] : (item.image || 'https://via.placeholder.com/150') }} 
          style={styles.productImage} 
        />
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
          <Text style={styles.productPrice}>₹{item.price}</Text>
          <Text style={[styles.productStock, isOutOfStock ? {color: '#EF4444'} : {color: '#10B981'}]}>
            {isOutOfStock ? 'Out of Stock' : `Stock: ${item.countInStock}`}
          </Text>
        </View>
        <View style={styles.actions}>
          <Switch 
            value={!isOutOfStock} 
            onValueChange={(val) => handleToggleStock(item, val)} 
            trackColor={{ false: "#D1D5DB", true: "#34D399" }}
            thumbColor={!isOutOfStock ? "#059669" : "#9CA3AF"}
            style={{ marginRight: 10 }}
          />
          <TouchableOpacity 
            style={styles.actionBtn}
            onPress={() => navigation.navigate('EditProduct', { product: item })}
          >
            <MaterialIcons name="edit" size={24} color="#3B82F6" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionBtn}
            onPress={() => handleDelete(item._id)}
          >
            <MaterialIcons name="delete" size={24} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </Card.Content>
    </Card>
  )};

  return (
    <View style={styles.container}>
      <FlatList
        data={products}
        keyExtractor={item => item._id}
        renderItem={renderProduct}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => {
            setRefreshing(true);
            fetchProducts();
          }} />
        }
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="inventory" size={64} color="#9CA3AF" />
              <Text style={styles.emptyText}>No products found. Add your first product!</Text>
            </View>
          )
        }
      />
      <FAB
        style={styles.fab}
        icon="plus"
        color="#fff"
        onPress={() => navigation.navigate('AddProduct')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  card: {
    marginBottom: 12,
    backgroundColor: '#fff',
    elevation: 2,
    borderRadius: 12,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  productPrice: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#10B981',
    marginTop: 4,
  },
  productStock: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    padding: 8,
    marginLeft: 4,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#10B981',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
    textAlign: 'center',
  }
});

export default SellerProductsScreen;
