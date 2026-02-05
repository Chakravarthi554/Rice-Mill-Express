import React, { useState, useEffect } from 'react';
console.log('🛍️ ProductScreen loading...');
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  Button,
  TouchableOpacity,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { addToCart } from '../redux/actions/cartActions';
import { listProductDetails } from '../redux/actions/productActions';
import Loader from '../components/Loader';
import Message from '../components/Message';
import { MaterialIcons } from '@expo/vector-icons';

const ProductScreen = ({ route, navigation }) => {
  const [qty, setQty] = useState(1);
  const { id } = route.params;
  const dispatch = useDispatch();

  const productDetails = useSelector((state) => state.productDetails);
  const { loading, error, product } = productDetails;

  useEffect(() => {
    dispatch(listProductDetails(id));
  }, [dispatch, id]);

  const addToCartHandler = () => {
    dispatch(addToCart(product._id, qty));
    navigation.navigate('CustomerTabs', { screen: 'Cart' });
  };

  const renderRating = (value) => {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <MaterialIcons
            key={i}
            name={
              value >= i
                ? 'star'
                : value >= i - 0.5
                  ? 'star-half'
                  : 'star-border'
            }
            size={20}
            color="#FFC107"
          />
        ))}
      </View>
    );
  };

  return (
    <ScrollView>
      {loading ? (
        <Loader />
      ) : error ? (
        <Message>{error}</Message>
      ) : (
        <View style={styles.container}>
          <Image
            source={{ uri: product.image }}
            style={styles.image}
            resizeMode="contain"
          />
          <View style={styles.details}>
            <Text style={styles.name}>{product.name}</Text>

            <View style={styles.rating}>
              {renderRating(product.rating)}
            </View>

            <Text style={styles.price}>₹{product.price}</Text>
            <Text style={styles.description}>{product.description}</Text>

            {product.countInStock > 0 && (
              <>
                <View style={styles.qtyContainer}>
                  <Text style={styles.qtyText}>Quantity:</Text>

                  <View style={styles.qtyControl}>
                    <TouchableOpacity
                      onPress={() => setQty(Math.max(1, qty - 1))}
                      style={[styles.qtyBtn, { backgroundColor: '#FF5252' }]}
                    >
                      <MaterialIcons name="remove" size={20} color="white" />
                    </TouchableOpacity>

                    <Text style={styles.qtyValue}>{qty}</Text>

                    <TouchableOpacity
                      onPress={() => setQty(Math.min(product.countInStock, qty + 1))}
                      style={[styles.qtyBtn, { backgroundColor: '#4CAF50' }]}
                    >
                      <MaterialIcons name="add" size={20} color="white" />
                    </TouchableOpacity>
                  </View>
                </View>
                <Button
                  title="Add to Cart"
                  onPress={addToCartHandler}
                  color="#4CAF50"
                />
              </>
            )}
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  image: {
    width: '100%',
    height: 300,
  },
  details: {
    marginTop: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  price: {
    fontSize: 20,
    color: '#4CAF50',
    marginVertical: 10,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  qtyText: {
    marginRight: 10,
    fontSize: 16,
  },
  rating: {
    marginVertical: 10,
  },
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 25,
  },
  qtyBtn: {
    padding: 8,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyValue: {
    fontSize: 18,
    fontWeight: 'bold',
    paddingHorizontal: 15,
    minWidth: 40,
    textAlign: 'center',
  },
});

export default ProductScreen;