import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Chip,
  Button,
  Card,
  CardContent,
  CardMedia,
  Divider,
  IconButton,
  Stack,
  Rating as MuiRating,
  Snackbar,
  Alert,
  Avatar,
  Pagination
} from "@mui/material";
import {
  AddShoppingCart,
  FlashOn,
  Remove,
  Add,
  LocalOffer,
  Star,
  Visibility,
  Favorite,
  Chat,
  ShoppingCart,
  LocalShipping
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import Loader from "../../components/common/Loader";
import Message from "../../components/common/Message";
import { listProductDetails } from "../../redux/actions/productActions";
import { addToCart } from "../../redux/actions/cartActions";
import { addToWishlist } from "../../redux/actions/userActions";
import { listRecipes } from "../../redux/actions/recipeActions";
import { listProducts } from "../../redux/actions/productActions"; // ✅ For recommendations
import { listMyOrders } from "../../redux/actions/orderActions"; // ✅ For verified purchase check
import Price from "../../components/common/Price";


const ProductImage = styled('img')({
  width: '100%',
  height: '400px',
  objectFit: 'cover',
  borderRadius: '16px',
  transition: 'transform 0.3s ease',
  '&:hover': {
    transform: 'scale(1.02)'
  }
});

const ThumbnailImage = styled('img')(({ selected }) => ({
  width: '80px',
  height: '80px',
  objectFit: 'cover',
  borderRadius: '12px',
  cursor: 'pointer',
  border: selected ? '3px solid #4CAF50' : '2px solid #e0e0e0',
  transition: 'all 0.2s ease',
  '&:hover': {
    borderColor: '#4CAF50',
    transform: 'scale(1.05)'
  }
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: '20px',
  background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
  border: `1px solid ${theme.palette.divider}`,
  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
  backdropFilter: 'blur(10px)'
}));

const ActionButton = styled(Button)(({ theme, varianttype }) => ({
  padding: '12px 24px',
  borderRadius: '12px',
  fontWeight: 'bold',
  fontSize: '1rem',
  textTransform: 'none',
  transition: 'all 0.3s ease',
  ...(varianttype === 'primary' && {
    background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
    color: 'white',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 20px rgba(76, 175, 80, 0.3)'
    }
  }),
  ...(varianttype === 'secondary' && {
    background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
    color: 'white',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 20px rgba(33, 150, 243, 0.3)'
    }
  })
}));

const ProductPage = () => {
  const { id } = useParams();
  const [qty, setQty] = useState(1);
  const [cartSnackbar, setCartSnackbar] = useState(false); // ✅ Cart confirmation

  const [selectedImage, setSelectedImage] = useState(0);
  const [socialStats, setSocialStats] = useState({ likes: 0, comments: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  // ✅ FIXED: Review filtering and pagination state
  const [reviewFilter, setReviewFilter] = useState('all');
  const [reviewPage, setReviewPage] = useState(1);
  const reviewsPerPage = 5;

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const productDetails = useSelector((state) => state.productDetails || {});
  const { loading, error, product = {} } = productDetails;
  const { recipes = [] } = useSelector((state) => state.recipeSuggestion || {});
  const socialCommentsList = useSelector((state) => state.socialCommentsList || {});
  const { userInfo } = useSelector((state) => state.userLogin);
  const { products = [] } = useSelector(s => s.productList); // ✅ For recommendations
  const { orders: userOrders = [] } = useSelector((state) => state.orderListMy || {}); // ✅ For verified purchase check

  const getImageUrl = (imagePath) => {
    if (!imagePath) return "https://via.placeholder.com/600x400/4CAF50/ffffff?text=Product+Image";
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) return imagePath;
    const base = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    return imagePath.startsWith('/uploads/') ? `${base}${imagePath}` : `${base}/uploads/${imagePath}`;
  };

  useEffect(() => {
    dispatch(listProductDetails(id));
    dispatch(listProducts()); // ✅ Fetch all products for recommendations
    // ✅ FIXED: Fetch user orders for verified purchase check
    if (userInfo) {
      dispatch(listMyOrders());
    }
  }, [dispatch, id, userInfo]); // Only depend on id to reload when navigating to different product

  useEffect(() => {
    if (product && product.riceType) {
      dispatch(listRecipes({ riceType: product.riceType }));
    }
  }, [dispatch, product?.riceType]); // Separate effect for recipes



  useEffect(() => {
    if (product) {
      setSocialStats({
        likes: product.likes?.length || 0,
        comments: socialCommentsList.comments?.length || 0
      });
    }
  }, [product, socialCommentsList]);

  // ✅ FIXED: Filter reviews based on selected filter
  const filteredReviews = React.useMemo(() => {
    if (!product.reviews || product.reviews.length === 0) return [];
    
    let filtered = product.reviews.filter(review => review.approved !== false);
    
    if (reviewFilter === 'all') {
      return filtered;
    } else if (reviewFilter === 'verified') {
      // Filter verified purchases (users who have purchased this product)
      return filtered.filter(review => {
        if (!userInfo || !userOrders) return false;
        return userOrders.some(order => 
          order.orderItems?.some(item => 
            item.product?._id === product._id && order.isPaid
          ) && order.user?._id === review.user?._id
        );
      });
    } else if (typeof reviewFilter === 'number') {
      return filtered.filter(review => review.rating === reviewFilter);
    }
    
    return filtered;
  }, [product.reviews, reviewFilter, userInfo, userOrders, product._id]);

  const addToCartHandler = async () => {
    try {
      await dispatch(addToCart(id, qty));
      setCartSnackbar(true); // ✅ Show confirmation instead of navigating
    } catch (err) {
      alert(err.message || 'Failed to add to cart');
    }
  };

  const buyNowHandler = async () => {
    try {
      await dispatch(addToCart(id, 1));
      navigate('/checkout');
    } catch (err) {
      alert(err.message || 'Failed to proceed');
    }
  };

  const addToWishlistHandler = async () => {
    if (!userInfo) { navigate('/login'); return; }
    try {
      await dispatch(addToWishlist(id));
    } catch (err) {
      alert(err.message || "Failed to add to wishlist");
    }
  };

  // Fixed: Properly increment/decrement with stock limit
  const increaseQty = () => setQty(prev => Math.min(prev + 1, product.countInStock || 1));
  const decreaseQty = () => setQty(prev => Math.max(prev - 1, 1));

  const getMainImage = () => {
    const imageSource = product.images?.[selectedImage] || product.image || product.images?.[0] || '/uploads/default_avatar.jpg';
    return getImageUrl(imageSource);
  };

  const mainImageUrl = getMainImage();
  const hasOffer = product.offerPrice && product.offerPrice < product.price;
  const discountPercentage = hasOffer ? Math.round(((product.price - product.offerPrice) / product.price) * 100) : 0;

  const handleImageLoad = () => { setImageLoaded(true); setImageError(false); };
  const handleImageError = (e) => {
    setImageError(true); setImageLoaded(true);
    e.target.src = "https://via.placeholder.com/600x400/4CAF50/ffffff?text=Image+Not+Found";
  };

  if (loading) return <Loader />;
  if (error) return <Message variant="error">{error}</Message>;
  if (!product._id) return <Message variant="warning">Invalid product data.</Message>;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box>
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <StyledPaper>
              <Box sx={{ position: 'relative' }}>
                <Box sx={{ position: 'relative', minHeight: '400px' }}>
                  {!imageLoaded && !imageError && (
                    <Box sx={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.100', borderRadius: '16px' }}>
                      <Loader />
                      <Typography variant="body2" sx={{ ml: 2 }}>Loading image...</Typography>
                    </Box>
                  )}
                  {imageError && (
                    <Box sx={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.100', borderRadius: '16px', flexDirection: 'column' }}>
                      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>Image Not Available</Typography>
                      <Typography variant="body2" color="text.secondary">Product image could not be loaded</Typography>
                    </Box>
                  )}
                  <ProductImage
                    src={mainImageUrl}
                    alt={product.name}
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                    style={{ display: imageLoaded && !imageError ? 'block' : 'none' }}
                  />
                  <Stack direction="row" spacing={1} sx={{ position: 'absolute', top: 16, right: 16 }}>
                    <Chip icon={<Favorite sx={{ fontSize: 16 }} />} label={socialStats.likes} size="small" color="error" variant="filled" sx={{ background: 'linear-gradient(135deg, #FF6B6B 0%, #FF5252 100%)' }} />
                    <Chip icon={<Chat sx={{ fontSize: 16 }} />} label={socialStats.comments} size="small" color="primary" variant="filled" sx={{ background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)' }} />
                  </Stack>
                  {hasOffer && (
                    <Chip icon={<LocalOffer />} label={`${discountPercentage}% OFF`} color="success" variant="filled" sx={{ position: 'absolute', top: 16, left: 16, fontWeight: 'bold', background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)' }} />
                  )}
                  <Chip label={product.countInStock > 0 ? "In Stock" : "Out of Stock"} color={product.countInStock > 0 ? "success" : "error"} variant="filled" sx={{ position: 'absolute', bottom: 16, left: 16, fontWeight: 'bold' }} />
                </Box>
              </Box>
              {product.images && product.images.length > 1 && (
                <Stack direction="row" spacing={1} sx={{ mt: 2, overflowX: 'auto', py: 1, px: 0.5 }}>
                  {product.images.map((img, index) => (
                    <Box key={index} sx={{ position: 'relative' }}>
                      <ThumbnailImage
                        src={getImageUrl(img)}
                        alt={`${product.name} ${index + 1}`}
                        selected={selectedImage === index}
                        onClick={() => { setSelectedImage(index); setImageLoaded(false); setImageError(false); }}
                        onError={(e) => { e.target.src = "https://via.placeholder.com/80x80/4CAF50/ffffff?text=Img"; }}
                      />
                    </Box>
                  ))}
                </Stack>
              )}
            </StyledPaper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Stack spacing={3}>
              <StyledPaper>
                <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold', color: 'text.primary', mb: 2, background: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)', backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {product.name}
                </Typography>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <MuiRating value={product.rating || 0} precision={0.1} readOnly sx={{ color: '#FFD700' }} />
                    <Typography variant="body1" sx={{ ml: 1, fontWeight: 'medium' }}>{product.rating || 0}</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">({product.numReviews || 0} reviews)</Typography>
                </Stack>
                <Stack direction="row" spacing={3} alignItems="center">
                  {product.seller?.name && <Chip label={`Seller: ${product.seller.name}`} variant="outlined" color="primary" />}
                  {product.brand && <Chip label={`Brand: ${product.brand}`} variant="outlined" color="secondary" />}
                </Stack>
              </StyledPaper>

              <StyledPaper>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: 'text.primary' }}>Price Details</Typography>
                <Stack direction="row" alignItems="center" spacing={2}>
                  {hasOffer ? (
                    <>
                      <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'success.main', background: 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)', backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        <Price amount={product.offerPrice} />
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
                          <Price amount={product.price} />
                        </Typography>
                        {product.price >= 1000 && (
                          <Chip
                            label="Free Delivery"
                            color="success"
                            size="small"
                            icon={<LocalShipping />}
                            sx={{ fontWeight: 'bold' }}
                          />
                        )}
                      </Box>
                      <Chip label={`Save`} color="success" variant="filled" sx={{ fontWeight: 'bold' }} />
                    </>
                  ) : (
                    <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'success.main', background: 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)', backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                      <Price amount={product.price || 0} />
                    </Typography>
                  )}
                </Stack>
              </StyledPaper>

              <StyledPaper>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: 'text.primary' }}>Description</Typography>
                <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8, fontSize: '1.1rem' }}>
                  {product.description || "No description available for this product."}
                </Typography>
              </StyledPaper>

              {product.countInStock > 0 && (
                <StyledPaper>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>Quantity</Typography>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <IconButton onClick={decreaseQty} disabled={qty <= 1} sx={{ bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' } }}>
                      <Remove />
                    </IconButton>
                    <Typography variant="h4" sx={{ minWidth: '60px', textAlign: 'center' }}>{qty}</Typography>
                    <IconButton onClick={increaseQty} disabled={qty >= product.countInStock} sx={{ bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' } }}>
                      <Add />
                    </IconButton>
                    <Typography variant="body2" color="text.secondary">{product.countInStock} available</Typography>
                  </Stack>
                </StyledPaper>
              )}

              <StyledPaper>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>Quick Actions</Typography>
                <Stack spacing={2}>
                  <ActionButton varianttype="primary" onClick={buyNowHandler} disabled={product.countInStock === 0} startIcon={<FlashOn />}>
                    Buy Now
                  </ActionButton>
                  <ActionButton varianttype="secondary" onClick={addToCartHandler} disabled={product.countInStock === 0} startIcon={<AddShoppingCart />}>
                    Add to Cart
                  </ActionButton>
                  <Stack direction="row" spacing={2}>
                    <Button variant="outlined" color="error" onClick={addToWishlistHandler} startIcon={<Favorite />} sx={{ flex: 1, py: 1.5, borderRadius: '12px', fontWeight: 'bold' }}>
                      Wishlist
                    </Button>

                  </Stack>
                </Stack>
              </StyledPaper>


            </Stack>
          </Grid>
        </Grid>

        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} md={6}>
            <StyledPaper>
              <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', color: 'primary.main' }}>Product Specifications</Typography>
              <Grid container spacing={2}>
                {[
                  { label: 'Brand', value: product.brand },
                  { label: 'Category', value: product.category },
                  { label: 'Type', value: product.type },
                  { label: 'Quality', value: product.quality },
                  { label: 'Weight', value: `${product.weight} ${product.unit}` },
                  { label: 'Stock', value: product.countInStock }
                ].map((item, index) => (
                  <Grid item xs={6} key={index}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.primary' }}>{item.label}:</Typography>
                    <Typography variant="body2" color="text.secondary">{item.value || 'N/A'}</Typography>
                  </Grid>
                ))}
              </Grid>
            </StyledPaper>
          </Grid>

          {recipes.length > 0 && (
            <Grid item xs={12} md={6}>
              <StyledPaper>
                <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', color: 'secondary.main' }}>Related Recipes</Typography>
                <Stack spacing={2}>
                  {recipes.slice(0, 3).map((recipe) => (
                    <Card key={recipe._id} sx={{ borderRadius: '12px', background: 'linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%)', transition: 'all 0.3s ease', '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 25px rgba(255, 152, 0, 0.3)' } }}>
                      <CardContent>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>{recipe.title}</Typography>
                        <Button component={Link} to={`/recipes/${recipe._id}`} variant="contained" color="warning" size="small" endIcon={<Visibility />} sx={{ borderRadius: '8px', fontWeight: 'bold' }}>
                          View Recipe
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              </StyledPaper>
            </Grid>
          )}
        </Grid>
      </Box>

      {/* ✅ FIXED: Reviews Section with Filtering, Pagination, and Verified Purchase */}
      {product.reviews && product.reviews.length > 0 && (
        <Box sx={{ mt: 6 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
            Customer Reviews ({product.numReviews || product.reviews.length})
          </Typography>
          
          {/* ✅ FIXED: Review Filters */}
          <Box sx={{ mb: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip 
              label="All" 
              onClick={() => setReviewFilter('all')} 
              color={reviewFilter === 'all' ? 'primary' : 'default'}
              clickable
            />
            <Chip 
              label="5 Stars" 
              onClick={() => setReviewFilter(5)} 
              color={reviewFilter === 5 ? 'primary' : 'default'}
              clickable
            />
            <Chip 
              label="4 Stars" 
              onClick={() => setReviewFilter(4)} 
              color={reviewFilter === 4 ? 'primary' : 'default'}
              clickable
            />
            <Chip 
              label="3 Stars" 
              onClick={() => setReviewFilter(3)} 
              color={reviewFilter === 3 ? 'primary' : 'default'}
              clickable
            />
            <Chip 
              label="Verified Purchase" 
              onClick={() => setReviewFilter('verified')} 
              color={reviewFilter === 'verified' ? 'primary' : 'default'}
              clickable
            />
          </Box>

          {/* ✅ FIXED: Filtered Reviews */}
          <Grid container spacing={2}>
            {filteredReviews
              .slice((reviewPage - 1) * reviewsPerPage, reviewPage * reviewsPerPage)
              .map((review, idx) => {
                // Check if user has purchased this product (verified purchase)
                const isVerified = userInfo && userOrders?.some(order => 
                  order.orderItems?.some(item => 
                    item.product?._id === product._id && order.isPaid
                  )
                );
                
                return (
                  <Grid item xs={12} key={review._id || idx}>
                    <Card sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                          {review.name?.charAt(0).toUpperCase() || review.user?.name?.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box sx={{ flexGrow: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle1" fontWeight="bold">
                              {review.name || review.user?.name || 'Anonymous'}
                            </Typography>
                            {isVerified && (
                              <Chip 
                                label="Verified Purchase" 
                                size="small" 
                                color="success" 
                                sx={{ height: 20, fontSize: '0.7rem' }}
                              />
                            )}
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                            <MuiRating value={review.rating} readOnly size="small" />
                            <Typography variant="caption" color="text.secondary">
                              {new Date(review.createdAt || Date.now()).toLocaleDateString()}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {review.comment}
                      </Typography>
                    </Card>
                  </Grid>
                );
              })}
          </Grid>

          {/* ✅ FIXED: Pagination */}
          {filteredReviews.length > reviewsPerPage && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination 
                count={Math.ceil(filteredReviews.length / reviewsPerPage)} 
                page={reviewPage} 
                onChange={(e, value) => setReviewPage(value)}
                color="primary"
              />
            </Box>
          )}
        </Box>
      )}

      {/* ✅ Recommended Products Section */}
      {products.length > 0 && (
        <Box sx={{ mt: 6 }}>
          <Divider sx={{ mb: 4 }} />
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
            You May Also Like
          </Typography>
          <Grid container spacing={3}>
            {products
              .filter(p => p._id !== id)
              .map(recommendedProduct => (
                <Grid item xs={12} sm={6} md={3} key={recommendedProduct._id}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      cursor: 'pointer',
                      transition: 'transform 0.2s',
                      '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 }
                    }}
                    onClick={() => navigate(`/products/${recommendedProduct._id}`)}
                  >
                    <CardMedia
                      component="img"
                      image={getImageUrl(recommendedProduct.images?.[0] || recommendedProduct.image)}
                      alt={recommendedProduct.name}
                      sx={{ height: 180, objectFit: 'contain', backgroundColor: '#f5f5f5', p: 1 }}
                    />
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle1" noWrap fontWeight="bold">
                        {recommendedProduct.name}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, my: 1 }}>
                        <MuiRating value={recommendedProduct.rating} readOnly size="small" />
                        <Typography variant="caption" color="text.secondary">
                          ({recommendedProduct.numReviews})
                        </Typography>
                      </Box>
                      <Typography variant="h6" color="primary" fontWeight="bold">
                        <Price amount={recommendedProduct.price} />
                      </Typography>
                    </CardContent>
                    <Box sx={{ p: 2, pt: 0 }}>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<AddShoppingCart />}
                        onClick={(e) => {
                          e.stopPropagation();
                          dispatch(addToCart(recommendedProduct._id, 1));
                          setCartSnackbar(true);
                        }}
                        disabled={recommendedProduct.countInStock === 0}
                      >
                        Add to Cart
                      </Button>
                    </Box>
                  </Card>
                </Grid>
              ))}
          </Grid>
        </Box>
      )}

      {/* ✅ Cart Confirmation Snackbar */}
      <Snackbar
        open={cartSnackbar}
        autoHideDuration={6000}
        onClose={() => setCartSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setCartSnackbar(false)}
          severity="success"
          sx={{ width: '100%', alignItems: 'center' }}
          action={
            <Button
              color="inherit"
              size="small"
              startIcon={<ShoppingCart />}
              onClick={() => navigate('/cart')}
              sx={{ fontWeight: 'bold' }}
            >
              Go to Cart
            </Button>
          }
        >
          Product added to cart!
        </Alert>
      </Snackbar>

    </Container>
  );
};

export default ProductPage;