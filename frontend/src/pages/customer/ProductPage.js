import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Grid,
  Box,
  Typography,
  Button,
  Divider,
  Stack,
  Paper,
  Chip,
  IconButton,
  Badge,
  CircularProgress,
  Alert,
  Rating,
  Avatar,
} from "@mui/material";
import {
  ArrowBack, Share, FavoriteBorder, Favorite,
  Home, ListAlt, ShoppingCart, ShoppingBag, Person,
  Star, Verified, LocalShipping, Replay, Security,
  Add, Remove, Storefront, ExpandMore, KeyboardArrowUp
} from "@mui/icons-material";

// Redux Actions
import { listProductDetails } from "../../redux/actions/productActions";
import { addToCart } from "../../redux/actions/cartActions";
import { addToWishlist } from "../../redux/actions/userActions";
import { listProducts } from "../../redux/actions/productActions";
import { listMyCart } from "../../redux/actions/cartActions";

// Utils
import { getImageUrl } from "../../utils/urlHelper";



// UI Components
import EmptyState from "../../components/ui/EmptyState";
import SocialInteraction from "../../components/common/SocialInteraction";
import ProductCard from "../../components/ui/ProductCard";
import TrustBadge from "../../components/ui/TrustBadge";

const ProductPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [qty, setQty] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showFullDesc, setShowFullDesc] = useState(false);

  const productDetails = useSelector((state) => state.productDetails || {});
  const { loading, error, product = {} } = productDetails;
  
  const productList = useSelector((state) => state.productList || {});
  const { products: allProducts = [] } = productList;

  const { userInfo } = useSelector((state) => state.userLogin || {});
  const { wishlistItems = [] } = useSelector(state => state.wishlist || {});
  const { cartItems = [] } = useSelector(state => state.cart || {});

  useEffect(() => {
    dispatch(listProductDetails(id));
    dispatch(listProducts({ limit: 10 }));
    dispatch(listMyCart());
  }, [dispatch, id]);

  useEffect(() => {
    if (product && product._id) {
        const viewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
        const updated = [product, ...viewed.filter(p => p._id !== product._id)].slice(0, 10);
        localStorage.setItem('recentlyViewed', JSON.stringify(updated));
    }
  }, [product]);

  const addToCartHandler = async () => {
    try {
      await dispatch(addToCart(id, qty));
      alert('✅ Item added to cart!');
    } catch (err) {
      alert(err.message || 'Failed to add to cart');
    }
  };

  const handleAddToCart = async (productId) => {
    try {
      await dispatch(addToCart(productId, 1));
    } catch (err) {
      alert(err.message || 'Failed to add to cart');
    }
  };

  const buyNowHandler = async () => {
    try {
      await dispatch(addToCart(id, qty));
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

  const handleAddToWishlist = async (productId) => {
    if (!userInfo) { navigate('/login'); return; }
    try {
      await dispatch(addToWishlist(productId));
    } catch (err) {
      alert(err.message || "Failed to add to wishlist");
    }
  };

  const increaseQty = () => setQty(prev => Math.min(prev + 1, product.countInStock || 10));
  const decreaseQty = () => setQty(prev => Math.max(prev - 1, 1));
  const isWishlisted = (productId) => wishlistItems.some(x => (x._id || x) === productId);

  if (loading) return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
      <CircularProgress sx={{ color: '#2E7D32' }} />
    </Box>
  );
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!product._id) return <EmptyState title="Product Not Found" description="The product you are looking for does not exist." />;

  const images = product.images?.filter(Boolean)?.length > 0 ? product.images : product.image ? [product.image] : [];
  const mainImageUrl = getImageUrl(images[selectedImage]);
  const hasOffer = product.offerPrice && product.offerPrice < product.price;
  const displayPrice = hasOffer ? product.offerPrice : product.price;
  const originalPrice = hasOffer ? product.price : null;
  const discountPercentage = hasOffer ? Math.round(((product.price - product.offerPrice) / product.price) * 100) : 0;
  const productRating = product.rating || 4.5;
  const productReviews = product.numReviews || 12450;
  const monthlySales = product.soldCount || 1200;
  const inStock = product.countInStock > 0;

  const relatedProducts = allProducts.filter(p => p._id !== id).slice(0, 6);

  // Mock reviews
  const mockReviews = [
    { name: "Priya S.", rating: 5, text: "Excellent quality rice! Very aromatic and long grains. My family loved it.", date: "2 weeks ago" },
    { name: "Ramesh K.", rating: 4, text: "Good value for money. Fresh stock delivered on time.", date: "1 month ago" },
    { name: "Anjali M.", rating: 5, text: "Regular customer. Consistent quality every time.", date: "3 weeks ago" },
  ];

  return (
    <Box sx={{ bgcolor: '#FFFDF9', minHeight: '100vh', pb: { xs: 12, md: 0 } }}>
      
      {/* ── DESKTOP TOP NAV ── */}
      <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', px: 6, py: 1.5, bgcolor: '#fff', borderBottom: '1px solid #F3F4F6', position: 'sticky', top: 0, zIndex: 100 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)} sx={{ color: '#4B5563', textTransform: 'none', fontWeight: 700, mr: 2 }}>
          Back
        </Button>
        <Typography sx={{ fontSize: '1.1rem', fontWeight: 800, color: '#2E7D32' }}>RiceMill</Typography>
        <Box sx={{ flex: 1 }} />
        <IconButton onClick={() => navigate('/wishlist')} sx={{ color: '#4B5563' }}>
          <FavoriteBorder sx={{ fontSize: 22 }} />
        </IconButton>
        <IconButton onClick={() => navigate('/cart')} sx={{ color: '#4B5563', ml: 0.5 }}>
          <Badge badgeContent={cartItems.length || 0} color="error" sx={{ '& .MuiBadge-badge': { bgcolor: '#2E7D32', fontWeight: 700 } }}>
            <ShoppingCart sx={{ fontSize: 22 }} />
          </Badge>
        </IconButton>
      </Box>

      {/* ── MOBILE HEADER ── */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', px: 2, py: 1.5, borderBottom: '1px solid #F3F4F6', bgcolor: '#fff' }}>
        <IconButton onClick={() => navigate(-1)} sx={{ mr: 1 }}><ArrowBack /></IconButton>
        <Typography variant="subtitle1" fontWeight={800} color="#1F2937">Product Details</Typography>
      </Box>

      <Container maxWidth={false} sx={{ px: { xs: 2, md: 6 }, pt: { xs: 2, md: 4 }, pb: { md: 8 } }}>
        <Grid container spacing={{ xs: 2, md: 5 }}>
          {/* ── LEFT COLUMN: IMAGE GALLERY ── */}
          <Grid item xs={12} md={6}>
            <Box sx={{ position: 'relative', bgcolor: '#fff', borderRadius: '20px', border: '1px solid #F3F4F6', overflow: 'hidden', p: 1.5, mb: 2 }}>
              {/* Action buttons */}
              <Stack direction="row" spacing={1} sx={{ position: 'absolute', top: 16, right: 16, zIndex: 2 }}>
                <IconButton size="small" sx={{ bgcolor: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                  <Share sx={{ color: '#2E7D32', fontSize: 20 }} />
                </IconButton>
                <IconButton size="small" onClick={addToWishlistHandler} sx={{ bgcolor: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                  {isWishlisted(product._id) ? (
                    <Favorite sx={{ color: '#DC2626', fontSize: 20 }} />
                  ) : (
                    <FavoriteBorder sx={{ color: '#2E7D32', fontSize: 20 }} />
                  )}
                </IconButton>
              </Stack>

              {/* Main Image */}
              <Box sx={{ width: '100%', aspectRatio: '1/1', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#F9FAFB', borderRadius: '12px', overflow: 'hidden' }}>
                {mainImageUrl ? (
                  <img src={mainImageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'contain', mixBlendMode: 'multiply' }} />
                ) : (
                  <Box sx={{ fontSize: 80, opacity: 0.3 }}>🌾</Box>
                )}
              </Box>

              {/* Discount badge overlay */}
              {hasOffer && (
                <Box sx={{ position: 'absolute', bottom: 24, left: 24, zIndex: 2 }}>
                  <Chip label={`${discountPercentage}% OFF`} sx={{ bgcolor: '#DC2626', color: '#fff', fontWeight: 900, fontSize: '0.9rem', px: 1, borderRadius: '8px' }} />
                </Box>
              )}
            </Box>

            {/* Thumbnail strip */}
            {images.length > 1 && (
              <Stack direction="row" spacing={1.5} sx={{ pb: 1, '&::-webkit-scrollbar': { display: 'none' }, overflowX: 'auto' }}>
                {images.map((img, idx) => (
                  <Box
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    sx={{
                      width: 68, height: 68, borderRadius: '10px', cursor: 'pointer', flexShrink: 0,
                      border: selectedImage === idx ? '2.5px solid #2E7D32' : '2px solid transparent',
                      overflow: 'hidden', opacity: selectedImage === idx ? 1 : 0.55,
                      transition: 'all 0.2s', bgcolor: '#F9FAFB'
                    }}
                  >
                    <img src={getImageUrl(img)} alt={`Thumb ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </Box>
                ))}
              </Stack>
            )}

            {/* Desktop Trust Badges */}
            <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1.5, mt: 3, flexWrap: 'wrap' }}>
              <TrustBadge icon="delivery" label="Free delivery over ₹500" />
              <TrustBadge icon="returns" label="10-day easy returns" />
              <TrustBadge icon="quality" label="FSSAI Certified" />
              <TrustBadge icon="secure" label="Secure Payment" />
            </Box>
          </Grid>

          {/* ── RIGHT COLUMN: DETAILS ── */}
          <Grid item xs={12} md={6}>
            <Box sx={{ position: { md: 'sticky' }, top: { md: 80 } }}>
              <Box sx={{ bgcolor: '#fff', borderRadius: '20px', p: { xs: 0, md: 3.5 }, border: { md: '1px solid #F3F4F6' } }}>
                {/* Category & Brand */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
                  <Chip label={product.category || "Premium Rice"} size="small" sx={{ bgcolor: '#F0FDF4', color: '#2E7D32', fontWeight: 800, borderRadius: '6px' }} />
                  {product.brand && (
                    <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 600 }}>{product.brand}</Typography>
                  )}
                </Box>

                {/* Product Name */}
                <Typography variant="h4" sx={{ fontWeight: 900, color: '#1F2937', mb: 1.5, lineHeight: 1.2, fontSize: { xs: '1.3rem', md: '1.6rem' } }}>
                  {product.name || 'Premium Basmati Rice'}
                </Typography>

                {/* Rating Row */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: '#F0FDF4', px: 1, py: 0.25, borderRadius: '6px' }}>
                    <Star sx={{ fontSize: 16, color: '#2E7D32' }} />
                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 800, color: '#2E7D32' }}>{productRating}</Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#6B7280' }}>
                    ({productReviews.toLocaleString()} reviews)
                  </Typography>
                  <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: '#D1D5DB' }} />
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#6B7280' }}>
                    {monthlySales.toLocaleString()} sold/month
                  </Typography>
                </Box>

                {/* Pricing */}
                <Box sx={{ bgcolor: '#F9FAFB', borderRadius: '12px', p: 2.5, mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, mb: 0.5 }}>
                    <Typography sx={{ fontSize: '2rem', fontWeight: 900, color: '#2E7D32', lineHeight: 1 }}>
                      ₹{displayPrice}
                    </Typography>
                    {originalPrice && (
                      <Typography sx={{ fontSize: '1.1rem', color: '#9CA3AF', textDecoration: 'line-through', fontWeight: 600 }}>
                        ₹{originalPrice}
                      </Typography>
                    )}
                    {hasOffer && (
                      <Chip label={`${discountPercentage}% OFF`} size="small" sx={{ bgcolor: '#FFF7ED', color: '#E65100', fontWeight: 900, fontSize: '0.78rem' }} />
                    )}
                  </Box>
                  <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 600 }}>MRP inclusive of all taxes</Typography>
                  {hasOffer && (
                    <Typography variant="caption" sx={{ color: '#16A34A', fontWeight: 700, display: 'block', mt: 0.5 }}>
                      You save ₹{originalPrice - displayPrice}
                    </Typography>
                  )}
                </Box>

                {/* Stock status */}
                {!inStock ? (
                  <Chip label="Out of Stock" sx={{ bgcolor: '#FEF2F2', color: '#DC2626', fontWeight: 800, mb: 2.5 }} />
                ) : product.countInStock <= 5 ? (
                  <Typography variant="body2" sx={{ color: '#DC2626', fontWeight: 800, mb: 2.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#DC2626', animation: 'pulse 1.5s infinite' }} />
                    Only {product.countInStock} left in stock
                  </Typography>
                ) : (
                  <Typography variant="body2" sx={{ color: '#16A34A', fontWeight: 700, mb: 2.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Verified sx={{ fontSize: 16 }} />
                    In Stock
                  </Typography>
                )}

                <Divider sx={{ mb: 3 }} />

                {/* Quantity Selector */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: '#374151' }}>Qty:</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', border: '1.5px solid #E5E7EB', borderRadius: '10px', bgcolor: '#fff', overflow: 'hidden' }}>
                    <IconButton size="small" onClick={decreaseQty} sx={{ borderRadius: 0, px: 1.5, color: '#1F2937', '&:hover': { bgcolor: '#F3F4F6' } }}>
                      <Remove sx={{ fontSize: 18 }} />
                    </IconButton>
                    <Typography sx={{ px: 2.5, fontWeight: 800, color: '#1F2937', minWidth: 24, textAlign: 'center' }}>{qty}</Typography>
                    <IconButton size="small" onClick={increaseQty} sx={{ borderRadius: 0, px: 1.5, color: '#1F2937', '&:hover': { bgcolor: '#F3F4F6' } }}>
                      <Add sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Box>
                </Box>

                {/* Desktop Buttons */}
                <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 2, mb: 3 }}>
                  <Button
                    variant="outlined"
                    onClick={addToCartHandler}
                    disabled={!inStock}
                    sx={{
                      flex: 1, height: 52, borderColor: '#2E7D32', color: '#2E7D32', borderWidth: 2,
                      borderRadius: '14px', fontWeight: 800, fontSize: '1rem', textTransform: 'none',
                      '&:hover': { borderColor: '#1B5E20', bgcolor: '#F0FDF4' },
                      '&.Mui-disabled': { borderColor: '#D1D5DB', color: '#D1D5DB' }
                    }}
                  >
                    <ShoppingCart sx={{ mr: 1, fontSize: 20 }} />
                    Add to Cart
                  </Button>
                  <Button
                    variant="contained"
                    onClick={buyNowHandler}
                    disabled={!inStock}
                    sx={{
                      flex: 1, height: 52, bgcolor: '#2E7D32', color: '#fff',
                      borderRadius: '14px', fontWeight: 800, fontSize: '1rem', textTransform: 'none',
                      boxShadow: '0 8px 24px rgba(46, 125, 50, 0.3)',
                      '&:hover': { bgcolor: '#1B5E20' },
                      '&.Mui-disabled': { bgcolor: '#D1D5DB' }
                    }}
                  >
                    Buy Now
                  </Button>
                </Box>

                {/* Seller Info */}
                <Box sx={{ bgcolor: '#F9FAFB', borderRadius: '12px', p: 2, mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                    <Storefront sx={{ color: '#2E7D32', fontSize: 22 }} />
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: '#1F2937' }}>
                        Sold by {product.seller?.name || 'RiceMill Direct'}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Verified sx={{ fontSize: 14, color: '#2563EB' }} />
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#2563EB' }}>Verified Seller</Typography>
                      </Box>
                    </Box>
                  </Box>
                  <Typography variant="caption" sx={{ color: '#6B7280', display: 'block' }}>
                    ✔ 100% Genuine Products • ✔ Easy Returns • ✔ 24/7 Customer Support
                  </Typography>
                </Box>

                {/* Delivery Details */}
                <Box sx={{ borderRadius: '12px', border: '1px solid #E5E7EB', p: 2, mb: 3 }}>
                  <Stack spacing={1.5}>
                    <Box display="flex" alignItems="center" gap={1.5}>
                      <LocalShipping sx={{ color: '#2E7D32', fontSize: 20 }} />
                      <Typography variant="body2" fontWeight={700} color="#1F2937">Free Delivery • Tomorrow before 7PM</Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1.5}>
                      <Replay sx={{ color: '#2E7D32', fontSize: 20 }} />
                      <Typography variant="body2" fontWeight={700} color="#1F2937">10-day easy return policy</Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1.5}>
                      <Security sx={{ color: '#2E7D32', fontSize: 20 }} />
                      <Typography variant="body2" fontWeight={700} color="#1F2937">Secure payment • Cash on delivery</Typography>
                    </Box>
                  </Stack>
                </Box>

                {/* Specifications */}
                <Box sx={{ mb: 3 }}>
                  <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', mb: 1.5, color: '#1F2937' }}>Product Specifications</Typography>
                  <Box sx={{ borderRadius: '12px', border: '1px solid #F3F4F6', overflow: 'hidden' }}>
                    {[
                      { label: "Origin", val: "Tamil Nadu, India" },
                      { label: "Weight", val: product.weight ? `${product.weight} ${product.unit || 'kg'}` : "5 kg" },
                      { label: "Shelf Life", val: "12 months from packaging" },
                      { label: "Certification", val: "FSSAI Certified" },
                      { label: "Storage", val: "Store in cool, dry place" },
                    ].map((spec, i) => (
                      <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, py: 1.2, bgcolor: i % 2 === 0 ? '#F9FAFB' : '#fff' }}>
                        <Typography variant="body2" sx={{ color: '#6B7280', fontWeight: 600 }}>{spec.label}</Typography>
                        <Typography variant="body2" fontWeight={700} color="#1F2937">{spec.val}</Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>

                {/* Description */}
                {product.description && (
                  <Box sx={{ mb: 3 }}>
                    <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', mb: 1, color: '#1F2937' }}>Description</Typography>
                    <Typography variant="body2" sx={{ color: '#6B7280', lineHeight: 1.7, ...(!showFullDesc ? { display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' } : {}) }}>
                      {product.description}
                    </Typography>
                    <Button size="small" onClick={() => setShowFullDesc(!showFullDesc)} sx={{ color: '#2E7D32', fontWeight: 700, textTransform: 'none', mt: 0.5 }}>
                      {showFullDesc ? 'Show less' : 'Read more'} {showFullDesc ? <KeyboardArrowUp sx={{ fontSize: 18 }} /> : <ExpandMore sx={{ fontSize: 18 }} />}
                    </Button>
                  </Box>
                )}
              </Box>
            </Box>
          </Grid>
        </Grid>

        {/* ── BOTTOM SECTIONS ── */}
        <Box sx={{ mt: { xs: 4, md: 8 } }}>
          
          {/* Customer Reviews */}
          <Box sx={{ mb: 6, bgcolor: '#fff', borderRadius: '20px', p: { xs: 2.5, md: 4 }, border: '1px solid #F3F4F6', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h5" fontWeight={800} color="#1F2937">Customer Reviews</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Rating value={productRating} precision={0.5} readOnly sx={{ color: '#F59E0B' }} />
                <Typography fontWeight={800} color="#1F2937">{productRating}</Typography>
              </Box>
            </Box>
            <Divider sx={{ mb: 3 }} />
            <Stack spacing={2.5}>
              {mockReviews.map((review, i) => (
                <Box key={i} sx={{ pb: 2.5, borderBottom: i < mockReviews.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                    <Avatar sx={{ width: 36, height: 36, bgcolor: '#2E7D32', fontSize: 14, fontWeight: 700 }}>
                      {review.name[0]}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight={800} color="#1F2937">{review.name}</Typography>
                      <Typography variant="caption" color="#9CA3AF">{review.date}</Typography>
                    </Box>
                    <Rating value={review.rating} size="small" readOnly sx={{ ml: 'auto', color: '#F59E0B' }} />
                  </Box>
                  <Typography variant="body2" sx={{ color: '#6B7280', lineHeight: 1.6, ml: 6.5 }}>{review.text}</Typography>
                </Box>
              ))}
            </Stack>
            <Button fullWidth variant="outlined" sx={{ mt: 2, borderRadius: '12px', py: 1.2, borderColor: '#E5E7EB', color: '#2E7D32', fontWeight: 700, textTransform: 'none' }}>
              View All Reviews
            </Button>
          </Box>

          {/* Community Discussion */}
          <Box sx={{ mb: 6, bgcolor: '#fff', borderRadius: '20px', p: { xs: 2.5, md: 4 }, border: '1px solid #F3F4F6', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
            <Typography variant="h5" fontWeight={800} color="#1F2937" mb={2}>Community Discussion</Typography>
            <Divider sx={{ mb: 3 }} />
            <SocialInteraction itemType="products" itemId={product._id} itemUserId={product.seller} />
          </Box>

          {/* Related Products */}
          <Box sx={{ mb: 8 }}>
            <Typography variant="h4" fontWeight={800} color="#1F2937" mb={4}>Related Products</Typography>
            <Grid container spacing={2.5}>
              {relatedProducts.map(rp => (
                <Grid item xs={6} sm={4} md={2} key={rp._id}>
                  <ProductCard
                    product={{
                      _id: rp._id,
                      name: rp.name,
                      image: getImageUrl(rp.images?.[0] || rp.image),
                      price: rp.offerPrice || rp.price,
                      mrp: rp.offerPrice ? rp.price : null,
                      discount: rp.offerPrice ? Math.round((1 - rp.offerPrice / rp.price) * 100) : 0,
                      rating: Number(rp.rating || 0),
                      countInStock: rp.countInStock
                    }}
                    layout="vertical"
                    wishlisted={isWishlisted(rp._id)}
                    onAddToCart={() => handleAddToCart(rp._id)}
                    onToggleWishlist={() => handleAddToWishlist(rp._id)}
                    onClick={() => navigate(`/products/${rp._id}`)}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        </Box>
      </Container>

      {/* ── MOBILE STICKY BOTTOM PURCHASE BAR ── */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000, bgcolor: '#fff', p: 1.5, gap: 1.5, borderTop: '1px solid #E5E7EB', alignItems: 'center' }}>
        <Box sx={{ flexShrink: 0 }}>
          <Typography sx={{ fontSize: '1.2rem', fontWeight: 900, color: '#2E7D32' }}>₹{displayPrice}</Typography>
          {originalPrice && (
            <Typography sx={{ fontSize: '0.72rem', color: '#9CA3AF', textDecoration: 'line-through', fontWeight: 600 }}>₹{originalPrice}</Typography>
          )}
        </Box>
        <Box sx={{ flex: 1 }} />
        <Box sx={{ display: 'flex', alignItems: 'center', border: '1.5px solid #E5E7EB', borderRadius: '8px', bgcolor: '#fff' }}>
          <IconButton size="small" onClick={decreaseQty} sx={{ px: 0.5, color: '#1F2937' }}><Remove sx={{ fontSize: 16 }} /></IconButton>
          <Typography sx={{ px: 1.5, fontWeight: 800, fontSize: '0.85rem' }}>{qty}</Typography>
          <IconButton size="small" onClick={increaseQty} sx={{ px: 0.5, color: '#1F2937' }}><Add sx={{ fontSize: 16 }} /></IconButton>
        </Box>
        <Button
          variant="contained"
          onClick={addToCartHandler}
          disabled={!inStock}
          sx={{ height: 44, px: 3, bgcolor: '#2E7D32', borderRadius: '10px', fontWeight: 800, fontSize: '0.85rem', textTransform: 'none', '&:hover': { bgcolor: '#1B5E20' } }}
        >
          + Add
        </Button>
      </Box>

      {/* ── MOBILE BOTTOM NAV (above purchase bar) ── */}
      <Paper
        elevation={10}
        sx={{
          display: { xs: 'flex', md: 'none' },
          position: 'fixed', bottom: 64, left: 0, right: 0, zIndex: 999,
          height: 56, borderTop: '1px solid #E5E7EB',
          justifyContent: 'space-around', alignItems: 'center', bgcolor: '#fff'
        }}
      >
        <IconButton onClick={() => navigate('/customer/dashboard')} sx={{ display: 'flex', flexDirection: 'column', color: '#9CA3AF', py: 0.3 }}>
          <Home sx={{ fontSize: 20 }} />
          <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, mt: 0.1 }}>Home</Typography>
        </IconButton>
        <IconButton onClick={() => navigate('/products')} sx={{ display: 'flex', flexDirection: 'column', color: '#9CA3AF', py: 0.3 }}>
          <ListAlt sx={{ fontSize: 20 }} />
          <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, mt: 0.1 }}>Categories</Typography>
        </IconButton>
        <IconButton onClick={() => navigate('/cart')} sx={{ display: 'flex', flexDirection: 'column', color: '#9CA3AF', py: 0.3 }}>
          <Badge badgeContent={cartItems.length || 0} color="error" sx={{ '& .MuiBadge-badge': { bgcolor: '#E65100', color: '#fff', fontWeight: 800, fontSize: '0.6rem' } }}>
            <ShoppingCart sx={{ fontSize: 20 }} />
          </Badge>
          <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, mt: 0.1 }}>Cart</Typography>
        </IconButton>
        <IconButton onClick={() => navigate('/settings/order-history')} sx={{ display: 'flex', flexDirection: 'column', color: '#9CA3AF', py: 0.3 }}>
          <ShoppingBag sx={{ fontSize: 20 }} />
          <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, mt: 0.1 }}>Orders</Typography>
        </IconButton>
        <IconButton onClick={() => navigate('/settings/profile')} sx={{ display: 'flex', flexDirection: 'column', color: '#9CA3AF', py: 0.3 }}>
          <Person sx={{ fontSize: 20 }} />
          <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, mt: 0.1 }}>Profile</Typography>
        </IconButton>
      </Paper>
    </Box>
  );
};

export default ProductPage;
