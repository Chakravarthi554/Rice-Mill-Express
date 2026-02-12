import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Dimensions,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { Button } from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { addToCart } from '../redux/actions/cartActions';
import { listProductDetails, listProducts, createProductReview } from '../redux/actions/productActions';
import { addToWishlist, removeFromWishlist } from '../redux/actions/wishlistActions';
import { PRODUCT_CREATE_REVIEW_RESET } from '../constants/productConstants';
import Loader from '../components/Loader';
import Message from '../components/Message';
import { MaterialIcons } from '@expo/vector-icons';
import { apiService } from '../services/api';
import { getImageUrl } from '../utils/url';
import {
  subscribeToSocialUpdates,
  unsubscribeFromSocialUpdates,
  joinRoom,
  leaveRoom
} from '../services/socket';

const { width } = Dimensions.get('window');

const ProductScreen = ({ route, navigation }) => {
  const { productId } = route.params;
  const dispatch = useDispatch();

  const [qty, setQty] = useState(1);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);

  const [reviews, setReviews] = useState([]);
  const [comments, setComments] = useState([]); // For Discussion/Questions
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [activeTab, setActiveTab] = useState('reviews'); // reviews | discussion

  // Selectors
  const productDetails = useSelector((state) => state.productDetails);
  const { loading, error, product } = productDetails;

  const productList = useSelector((state) => state.productList);
  const { products: relatedProducts } = productList;

  const userLogin = useSelector((state) => state.auth);
  const { user: userInfo } = userLogin;

  const productCreateReview = useSelector((state) => state.productCreateReview);
  const {
    success: successProductReview,
    loading: loadingProductReview,
    error: errorProductReview,
  } = productCreateReview || {};

  const wishlist = useSelector((state) => state.wishlist || {});
  const { wishlistItems = [] } = wishlist;

  // Effects
  useEffect(() => {
    if (successProductReview) {
      Alert.alert('Review Submitted!');
      setRating(0);
      setComment('');
      setModalVisible(false);
      dispatch({ type: PRODUCT_CREATE_REVIEW_RESET });
      fetchData();
      dispatch(listProductDetails(productId)); // Refresh to show new aggregates
    }
    dispatch(listProductDetails(productId));
    dispatch(listProducts()); // Fetch for "Related Products"
    fetchData();

    // Join the product room for real-time updates
    const roomName = `product_${productId}`;
    joinRoom(roomName);

    // Subscribe to real-time updates
    subscribeToSocialUpdates((data) => {
      if (data.itemId === productId) {
        console.log('🔥 Product Social Update Received:', data.type);
        // Refresh details to get latest stats
        dispatch(listProductDetails(productId));
        fetchData();
      }
    });

    return () => {
      unsubscribeFromSocialUpdates();
      leaveRoom(roomName);
    };
  }, [dispatch, productId, successProductReview]);

  const fetchData = async () => {
    setLoadingReviews(true);
    setLoadingComments(true);
    try {
      // Fetch Reviews (Ratings)
      const reviewsRes = await apiService.getProductReviews(productId);
      setReviews(reviewsRes.data.reviews || []);

      // Fetch Comments (Discussion)
      const commentsRes = await apiService.getProductComments(productId);
      setComments(commentsRes.data.comments || []);
    } catch (err) {
      console.error('Error fetching social data:', err);
    } finally {
      setLoadingReviews(false);
      setLoadingComments(false);
    }
  };

  const favorited = wishlistItems && wishlistItems.some(x => (x._id || x) === productId);
  const hasOffer = typeof product?.offerPrice === 'number' && product?.offerPrice > 0 && product?.offerPrice < product?.price;

  const toggleWishlist = () => {
    if (favorited) {
      dispatch(removeFromWishlist(productId));
    } else {
      dispatch(addToWishlist(productId));
    }
  };

  const addToCartHandler = async (shouldNavigate = true) => {
    console.log(`🛒 Adding to cart: Product ID=${product?._id}, Qty=${qty}`);
    if (!product?._id) {
      Alert.alert('Error', 'Product details not loaded yet');
      return;
    }
    setAddingToCart(true);
    try {
      await dispatch(addToCart(product._id, qty));
      if (shouldNavigate) {
        Alert.alert('Success', 'Item added to cart', [
          { text: 'Continue Shopping', style: 'cancel' },
          { text: 'Go to Cart', onPress: () => navigation.navigate('Cart') }
        ]);
      }
    } catch (e) {
      console.error('Add to Cart Error:', e);
      Alert.alert('Error', 'Failed to add to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  const buyNowHandler = async () => {
    await addToCartHandler(false);
    navigation.navigate('Cart');
  };

  const submitReviewHandler = () => {
    if (rating === 0) {
      Alert.alert('Error', 'Please select a rating');
      return;
    }
    dispatch(
      createProductReview(productId, {
        rating,
        comment,
      })
    );
  };

  const submitCommentHandler = async () => {
    if (!comment.trim()) {
      Alert.alert('Error', 'Please enter a comment');
      return;
    }
    try {
      await apiService.createProductComment(productId, comment);
      setComment('');
      Alert.alert('Success', 'Comment posted!');
      fetchData(); // Refresh list
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to post comment');
    }
  };

  const renderRating = (value) => {
    return (
      <View style={{ flexDirection: 'row' }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <MaterialIcons
            key={i}
            name={value >= i ? 'star' : value >= i - 0.5 ? 'star-half' : 'star-border'}
            size={18}
            color="#FFC107"
          />
        ))}
      </View>
    );
  };

  const renderImageItem = ({ item }) => (
    <Image
      source={{ uri: getImageUrl(item) }}
      style={styles.carouselImage}
      resizeMode="contain"
    />
  );

  const images = product?.images && product.images.length > 0 ? product.images : [product?.image];

  if (loading) return <Loader />;
  if (error) return <Message>{error}</Message>;
  if (!product?._id) return <Message>Product not found.</Message>;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container}>
        {/* Image Carousel */}
        <View style={styles.carouselContainer}>
          <FlatList
            data={images}
            renderItem={renderImageItem}
            keyExtractor={(item, index) => index.toString()}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
          />
          <TouchableOpacity style={styles.wishlistBtn} onPress={toggleWishlist}>
            <MaterialIcons
              name={favorited ? 'favorite' : 'favorite-border'}
              size={30}
              color={favorited ? '#f44336' : '#666'}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.detailsContainer}>
          <Text style={styles.name}>{product.name}</Text>

          <View style={styles.ratingRow}>
            {renderRating(product.rating)}
            <Text style={styles.reviewCount}>({product.numReviews} reviews)</Text>
          </View>

          <View style={styles.priceRow}>
            <View>
              <Text style={styles.price}>₹{hasOffer ? product.offerPrice : product.price}</Text>
              {hasOffer && (
                <View style={styles.offerRow}>
                  <Text style={styles.originalPriceText}>₹{product.price}</Text>
                  <View style={styles.offerBadge}>
                    <Text style={styles.offerBadgeText}>OFFER</Text>
                  </View>
                </View>
              )}
            </View>
            {product.countInStock > 0 ? (
              <Text style={styles.stockIn}>In Stock ({product.countInStock})</Text>
            ) : (
              <Text style={styles.stockOut}>Out of Stock</Text>
            )}
          </View>

          <Text style={styles.description}>{product.description}</Text>

          {/* Specifications Table */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Specifications</Text>
            <View style={styles.specRow}><Text style={styles.specLabel}>Brand</Text><Text style={styles.specValue}>{product.brand}</Text></View>
            <View style={styles.specRow}><Text style={styles.specLabel}>Category</Text><Text style={styles.specValue}>{product.category}</Text></View>
            <View style={styles.specRow}><Text style={styles.specLabel}>Type</Text><Text style={styles.specValue}>{product.type || 'N/A'}</Text></View>
            <View style={styles.specRow}><Text style={styles.specLabel}>Quality</Text><Text style={styles.specValue}>{product.quality || 'N/A'}</Text></View>
            <View style={styles.specRow}><Text style={styles.specLabel}>Origin</Text><Text style={styles.specValue}>{product.origin || 'India'}</Text></View>
            <View style={styles.specRow}><Text style={styles.specLabel}>Moisture</Text><Text style={styles.specValue}>{product.moisture || '12-14%'}</Text></View>
            <View style={styles.specRow}><Text style={styles.specLabel}>Grade</Text><Text style={styles.specValue}>{product.grade || 'A++'}</Text></View>
          </View>

          {/* Action Section */}
          {product.countInStock > 0 && (
            <View style={styles.actionSection}>
              <View style={styles.qtyContainer}>
                <Text style={styles.qtyLabel}>Qty:</Text>
                <View style={styles.qtyControl}>
                  <TouchableOpacity onPress={() => setQty(Math.max(1, qty - 1))} style={styles.qtyBtn}>
                    <MaterialIcons name="remove" size={20} color="#333" />
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{qty}</Text>
                  <TouchableOpacity onPress={() => setQty(Math.min(product.countInStock, qty + 1))} style={styles.qtyBtn}>
                    <MaterialIcons name="add" size={20} color="#333" />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.addToCartBtn, addingToCart && { opacity: 0.7 }]}
                  onPress={() => addToCartHandler()}
                  disabled={addingToCart}
                >
                  {addingToCart ? <ActivityIndicator color="#fff" /> : <Text style={styles.addToCartText}>Add to Cart</Text>}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.buyNowBtn, addingToCart && { opacity: 0.7 }]}
                  onPress={buyNowHandler}
                  disabled={addingToCart}
                >
                  <Text style={styles.buyNowText}>Buy Now</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Reviews Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Reviews ({comments.length})</Text>
              {userInfo && (
                <TouchableOpacity onPress={() => setModalVisible(true)}>
                  <Text style={styles.writeReviewLink}>Write a Review</Text>
                </TouchableOpacity>
              )}
            </View>
            {loadingComments ? (
              <ActivityIndicator color="#4CAF50" />
            ) : comments.length === 0 ? (
              <Text style={styles.noReviews}>No reviews yet</Text>
            ) : (
              comments.slice(0, 5).map((review) => (
                <View key={review._id} style={styles.reviewItem}>
                  <View style={styles.reviewHeader}>
                    <Text style={styles.reviewName}>{review.userId?.name || 'Anonymous'}</Text>
                    {renderRating(review.rating)}
                  </View>
                  <Text style={styles.reviewDate}>
                    {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : 'Recent'}
                  </Text>
                  <Text style={styles.reviewComment}>{review.content || review.comment}</Text>
                </View>
              ))
            )}
            {comments.length > 5 && (
              <TouchableOpacity onPress={() => navigation.navigate('AllReviews', { productId })}>
                <Text style={styles.viewAllReviews}>View all {comments.length} reviews</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Related Products */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>You May Also Like</Text>
            <FlatList
              data={relatedProducts?.filter(p => p._id !== productId).slice(0, 5)}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => {
                const hasRelatedOffer = typeof item.offerPrice === 'number' && item.offerPrice > 0 && item.offerPrice < item.price;
                const relatedDisplayPrice = hasRelatedOffer ? item.offerPrice : item.price;
                return (
                  <TouchableOpacity
                    style={styles.relatedProductCard}
                    onPress={() => navigation.push('ProductDetail', { productId: item._id })}
                  >
                    <Image source={{ uri: getImageUrl(item.images?.[0] || item.image) }} style={styles.relatedImage} />
                    <Text numberOfLines={1} style={styles.relatedName}>{item.name}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={styles.relatedPrice}>₹{relatedDisplayPrice}</Text>
                      {hasRelatedOffer && (
                        <Text style={styles.relatedOriginalPrice}>₹{item.price}</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          </View>

          {/* Social Tabs (Reviews & Discussion) */}
          <View style={styles.section}>
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'reviews' && styles.activeTab]}
                onPress={() => setActiveTab('reviews')}
              >
                <Text style={[styles.tabText, activeTab === 'reviews' && styles.activeTabText]}>Reviews</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'discussion' && styles.activeTab]}
                onPress={() => setActiveTab('discussion')}
              >
                <Text style={[styles.tabText, activeTab === 'discussion' && styles.activeTabText]}>Discussion</Text>
              </TouchableOpacity>
            </View>

            {activeTab === 'reviews' ? (
              <View>
                <View style={styles.ratingStats}>
                  <View style={styles.ratingBig}>
                    <Text style={styles.ratingBigText}>{product.rating || 0}</Text>
                    <MaterialIcons name="star" size={24} color="#FFC107" />
                  </View>
                  <Text style={styles.ratingCountText}>{product.numReviews || 0} Ratings</Text>
                  <Button
                    mode="outlined"
                    onPress={() => setModalVisible(true)}
                    style={{ marginTop: 10 }}
                  >
                    Write a Review
                  </Button>
                </View>

                {loadingReviews ? <ActivityIndicator size="small" color="#4CAF50" /> : (
                  reviews.length === 0 ? (
                    <Text style={styles.noReviews}>No reviews yet.</Text>
                  ) : (
                    reviews.map((review, index) => (
                      <View key={index} style={styles.reviewItem}>
                        <View style={styles.reviewHeader}>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={styles.reviewName}>{review.userId?.name || 'User'}</Text>
                          </View>
                          {renderRating(review.rating)}
                        </View>
                        {review.comment ? <Text style={styles.reviewComment}>{review.comment}</Text> : null}
                        <Text style={styles.reviewDate}>
                          {new Date(review.createdAt).toLocaleDateString()}
                        </Text>
                      </View>
                    ))
                  )
                )}
              </View>
            ) : (
              <View>
                <View style={styles.commentInputContainer}>
                  <TextInput
                    style={styles.commentInput}
                    placeholder="Ask a question or share thoughts..."
                    value={comment}
                    onChangeText={setComment}
                    multiline
                  />
                  <Button mode="contained" onPress={submitCommentHandler} disabled={!comment.trim()}>
                    Post
                  </Button>
                </View>

                {loadingComments ? <ActivityIndicator size="small" color="#4CAF50" /> : (
                  comments.length === 0 ? (
                    <Text style={styles.noReviews}>No discussions yet. Be the first!</Text>
                  ) : (
                    comments.map((item, index) => (
                      <View key={index} style={styles.reviewItem}>
                        <View style={styles.reviewHeader}>
                          <Text style={styles.reviewName}>{item.userId?.name || 'User'}</Text>
                          <Text style={styles.reviewDate}>
                            {new Date(item.createdAt).toLocaleDateString()}
                          </Text>
                        </View>
                        <Text style={styles.reviewComment}>{item.content}</Text>
                      </View>
                    ))
                  )
                )}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Review Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Write a Review</Text>
            {errorProductReview && <Message variant="danger">{errorProductReview}</Message>}

            <Text style={styles.label}>Rating</Text>
            <View style={styles.starRefSelect}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRating(star)}>
                  <MaterialIcons
                    name={rating >= star ? 'star' : 'star-border'}
                    size={32}
                    color="#FFC107"
                  />
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Comment</Text>
            <TextInput
              style={styles.textArea}
              multiline
              numberOfLines={4}
              value={comment}
              onChangeText={setComment}
              placeholder="Share your experience..."
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={submitReviewHandler}
                disabled={loadingProductReview}
              >
                {loadingProductReview ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Submit</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9' },
  carouselContainer: { height: 300, backgroundColor: '#fff', position: 'relative' },
  carouselImage: { width: width, height: 300 },
  wishlistBtn: { position: 'absolute', top: 15, right: 15, backgroundColor: 'rgba(255,255,255,0.9)', padding: 8, borderRadius: 20 },

  detailsContainer: { padding: 15 },
  name: { fontSize: 24, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  reviewCount: { marginLeft: 8, color: '#666' },

  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  price: { fontSize: 24, fontWeight: 'bold', color: '#4CAF50' },
  offerRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  originalPriceText: { fontSize: 16, color: '#999', textDecorationLine: 'line-through' },
  offerBadge: { backgroundColor: '#f44336', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 8 },
  offerBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  stockIn: { color: '#4CAF50', fontWeight: 'bold' },
  stockOut: { color: '#F44336', fontWeight: 'bold' },

  description: { fontSize: 16, color: '#555', lineHeight: 24, marginBottom: 20 },

  section: { marginTop: 20, marginBottom: 10 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  writeReviewLink: { color: '#2196F3', fontWeight: 'bold' },

  specRow: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
  specLabel: { flex: 1, fontWeight: 'bold', color: '#555' },
  specValue: { flex: 2, color: '#333' },

  actionSection: { marginTop: 10, marginBottom: 20 },
  qtyContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  qtyLabel: { marginRight: 10, fontWeight: 'bold' },
  qtyControl: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e0e0e0', borderRadius: 8 },
  qtyBtn: { padding: 10 },
  qtyText: { fontSize: 18, fontWeight: 'bold', paddingHorizontal: 15 },

  buttonRow: { flexDirection: 'row', justifyContent: 'space-between' },
  addToCartBtn: { flex: 1, backgroundColor: '#4CAF50', padding: 15, borderRadius: 8, alignItems: 'center', marginRight: 10 },
  addToCartText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  buyNowBtn: { flex: 1, backgroundColor: '#2196F3', padding: 15, borderRadius: 8, alignItems: 'center' },
  buyNowText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  reviewItem: { backgroundColor: '#fff', padding: 10, borderRadius: 8, marginBottom: 10, elevation: 1 },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  reviewName: { fontWeight: 'bold' },
  reviewDate: { fontSize: 12, color: '#999', marginBottom: 5 },
  reviewComment: { color: '#444' },
  noReviews: { color: '#888', fontStyle: 'italic' },

  relatedProductCard: { width: 140, marginRight: 15, backgroundColor: '#fff', borderRadius: 8, padding: 10, elevation: 2, marginBottom: 10, marginLeft: 2 },
  relatedImage: { width: '100%', height: 100, marginBottom: 5, resizeMode: 'contain' },
  relatedName: { fontSize: 14, fontWeight: 'bold', marginBottom: 2 },
  relatedPrice: { fontSize: 14, color: '#4CAF50', fontWeight: 'bold' },
  relatedOriginalPrice: { fontSize: 11, color: '#999', textDecorationLine: 'line-through', marginLeft: 4 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 10, padding: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  label: { fontSize: 16, fontWeight: 'bold', marginTop: 10, marginBottom: 5 },
  starRefSelect: { flexDirection: 'row', justifyContent: 'center', marginVertical: 10 },
  textArea: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, height: 100, textAlignVertical: 'top' },
  modalActions: { flexDirection: 'row', marginTop: 20, justifyContent: 'space-between' },
  cancelBtn: { padding: 12, flex: 1, alignItems: 'center' },
  cancelText: { color: '#F44336', fontWeight: 'bold' },
  submitBtn: { backgroundColor: '#2196F3', padding: 12, borderRadius: 8, flex: 1, alignItems: 'center', marginLeft: 10 },
  submitText: { color: '#fff', fontWeight: 'bold' },
});

export default ProductScreen;