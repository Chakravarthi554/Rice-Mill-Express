import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  Button,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { addToCart } from '../redux/actions/cartActions';
import { listProductDetails } from '../redux/actions/productActions';
import Loader from '../components/Loader';
import Message from '../components/Message';
import NumericInput from 'react-native-numeric-input';
import { Rating } from 'react-native-ratings';

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
    navigation.navigate('Cart');
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
            <Rating
              type="star"
              ratingCount={5}
              imageSize={20}
              readonly
              startingValue={product.rating}
              style={styles.rating}
            />
            <Text style={styles.price}>₹{product.price}</Text>
            <Text style={styles.description}>{product.description}</Text>
            
            {product.countInStock > 0 && (
              <>
                <View style={styles.qtyContainer}>
                  <Text style={styles.qtyText}>Quantity:</Text>
                  <NumericInput
                    value={qty}
                    onChange={setQty}
                    minValue={1}
                    maxValue={product.countInStock}
                    totalWidth={120}
                    totalHeight={40}
                    iconSize={25}
                    step={1}
                    valueType="integer"
                    rounded
                    textColor="#000"
                    iconStyle={{ color: 'white' }}
                    rightButtonBackgroundColor="#4CAF50"
                    leftButtonBackgroundColor="#FF5252"
                  />
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
});

export default ProductScreen;