import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box, Container, Typography, Grid, Card, CardMedia, IconButton,
  Button, Divider, Chip, Alert, Stack, Paper
} from '@mui/material';
import {
  Delete as DeleteIcon, AddShoppingCart, Add, Remove,
  LocalShipping, ArrowForward, ShoppingCartOutlined
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { addToCart, removeFromCart, listMyCart, listProducts } from '../../redux/actions/cartActions';
import { listProducts as listAllProducts } from '../../redux/actions/productActions';

const CartPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { cartItems = [] } = useSelector(s => s.cart);
  const { products = [] } = useSelector(s => s.productList);

  useEffect(() => {
    dispatch(listMyCart());
    dispatch(listAllProducts());
  }, [dispatch]);

  const handleQtyChange = (id, qty) => dispatch(addToCart(id, Number(qty)));
  const handleRemove = (id) => dispatch(removeFromCart(id));
  const proceedToCheckout = () => navigate('/checkout');

  const subtotal = cartItems.reduce((s, i) => s + ((i.product?.offerPrice || i.product?.price) || 0) * (i.qty || 0), 0);
  const deliveryFee = subtotal > 500 ? 0 : 50;
  const grandTotal = subtotal + deliveryFee;

  const cartProductIds = cartItems.map(item => item.product._id);
  const recommendedProducts = products.filter(p => !cartProductIds.includes(p._id)).slice(0, 4);

  if (cartItems.length === 0) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Box textAlign="center">
          <Box sx={{ width: 120, height: 120, borderRadius: '50%', bgcolor: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3 }}>
            <ShoppingCartOutlined sx={{ fontSize: 56, color: '#16A34A' }} />
          </Box>
          <Typography variant="h5" fontWeight={700} gutterBottom>Your cart is empty</Typography>
          <Typography color="text.secondary" sx={{ mb: 4 }}>Add items to get started</Typography>
          <Button variant="contained" size="large" onClick={() => navigate('/products')}
            sx={{ bgcolor: '#16A34A', '&:hover': { bgcolor: '#15803D' }, borderRadius: 2, px: 4, py: 1.5, fontWeight: 700 }}>
            Browse Products
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight={800} gutterBottom>
        My Cart <Chip label={`${cartItems.length} items`} size="small" sx={{ ml: 1, bgcolor: '#F0FDF4', color: '#16A34A', fontWeight: 700 }} />
      </Typography>

      {subtotal <= 500 && (
        <Alert
          icon={<LocalShipping />}
          severity="info"
          sx={{ mb: 3, borderRadius: 2, bgcolor: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1D4ED8' }}>
          Add <strong> ₹{(500 - subtotal + 1).toFixed(0)} </strong> more for <strong>FREE delivery!</strong>
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Cart Items */}
        <Grid item xs={12} md={8}>
          <Stack spacing={2}>
            {cartItems.map(item => {
              const product = item.product || {};
              const imageUrl = product.images?.[0] || product.image || '/uploads/default.jpg';
              const price = product.offerPrice || product.price || 0;
              const qty = item.qty || 1;
              const hasOffer = product.offerPrice && product.offerPrice < product.price;
              const discount = hasOffer ? Math.round((1 - product.offerPrice / product.price) * 100) : 0;

              return (
                <Card key={product._id} variant="outlined" sx={{ borderRadius: 3, p: 2, display: 'flex', alignItems: 'center', gap: 2, border: '1px solid #F3F4F6', '&:hover': { borderColor: '#D1FAE5', boxShadow: '0 4px 16px rgba(22,163,74,0.08)' }, transition: 'all 0.2s' }}>
                  <Box
                    sx={{ width: 100, height: 100, borderRadius: 2, overflow: 'hidden', flexShrink: 0, cursor: 'pointer', bgcolor: '#F9FAFB' }}
                    onClick={() => navigate(`/products/${product._id}`)}>
                    <img src={imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.src = '/uploads/default.jpg'; }} />
                  </Box>

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Typography variant="subtitle1" fontWeight={700} noWrap sx={{ maxWidth: '70%', cursor: 'pointer' }} onClick={() => navigate(`/products/${product._id}`)}>
                        {product.name}
                      </Typography>
                      <IconButton size="small" onClick={() => handleRemove(product._id)} sx={{ color: '#9CA3AF', '&:hover': { color: '#EF4444', bgcolor: '#FEF2F2' } }}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>

                    {product.weight && <Typography variant="body2" color="text.secondary">{product.weight} {product.unit || 'kg'}</Typography>}

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1.5 }}>
                      {/* Quantity Controls */}
                      <Box sx={{ display: 'flex', alignItems: 'center', border: '1px solid #E5E7EB', borderRadius: 2, overflow: 'hidden' }}>
                        <IconButton size="small" onClick={() => handleQtyChange(product._id, qty - 1)} disabled={qty <= 1} sx={{ borderRadius: 0, '&:hover': { bgcolor: '#F3F4F6' } }}>
                          <Remove fontSize="small" />
                        </IconButton>
                        <Typography sx={{ px: 2, fontWeight: 700, minWidth: 36, textAlign: 'center' }}>{qty}</Typography>
                        <IconButton size="small" onClick={() => handleQtyChange(product._id, qty + 1)} disabled={qty >= (product.countInStock || 10)} sx={{ borderRadius: 0, bgcolor: '#16A34A', color: '#fff', '&:hover': { bgcolor: '#15803D' } }}>
                          <Add fontSize="small" />
                        </IconButton>
                      </Box>

                      {/* Price */}
                      <Box textAlign="right">
                        <Typography variant="h6" fontWeight={800} color="#16A34A">₹{(price * qty).toFixed(0)}</Typography>
                        {hasOffer && <Typography variant="caption" color="text.secondary" sx={{ textDecoration: 'line-through' }}>₹{(product.price * qty).toFixed(0)}</Typography>}
                        {hasOffer && <Chip label={`${discount}% off`} size="small" sx={{ ml: 1, bgcolor: '#FEF3C7', color: '#92400E', fontSize: '10px', height: 20 }} />}
                      </Box>
                    </Box>
                  </Box>
                </Card>
              );
            })}
          </Stack>
        </Grid>

        {/* Order Summary */}
        <Grid item xs={12} md={4}>
          <Paper variant="outlined" sx={{ borderRadius: 3, p: 3, border: '1px solid #F3F4F6', position: 'sticky', top: 80 }}>
            <Typography variant="h6" fontWeight={800} gutterBottom>Order Summary</Typography>
            <Divider sx={{ mb: 2 }} />

            <Stack spacing={1.5}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography color="text.secondary">Item Total ({cartItems.length} items)</Typography>
                <Typography fontWeight={600}>₹{subtotal.toFixed(0)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography color="text.secondary">Delivery Fee</Typography>
                <Typography fontWeight={600} color={deliveryFee === 0 ? '#16A34A' : 'inherit'}>
                  {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                </Typography>
              </Box>
              {deliveryFee === 0 && (
                <Box sx={{ bgcolor: '#F0FDF4', borderRadius: 1.5, px: 1.5, py: 1 }}>
                  <Typography variant="caption" color="#16A34A" fontWeight={700}>🎉 You got free delivery!</Typography>
                </Box>
              )}
            </Stack>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6" fontWeight={700}>Grand Total</Typography>
              <Typography variant="h6" fontWeight={800} color="#16A34A">₹{grandTotal.toFixed(0)}</Typography>
            </Box>

            <Button
              fullWidth
              variant="contained"
              size="large"
              endIcon={<ArrowForward />}
              onClick={proceedToCheckout}
              sx={{ bgcolor: '#16A34A', '&:hover': { bgcolor: '#15803D' }, borderRadius: 2.5, py: 1.5, fontWeight: 800, fontSize: '1rem' }}>
              Proceed to Checkout
            </Button>

            <Typography variant="caption" color="text.secondary" display="block" textAlign="center" mt={2}>
              🔒 Secure & encrypted checkout
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Recommendations */}
      {recommendedProducts.length > 0 && (
        <Box mt={6}>
          <Divider sx={{ mb: 4 }} />
          <Typography variant="h5" fontWeight={800} gutterBottom>You may also like</Typography>
          <Grid container spacing={2}>
            {recommendedProducts.map(product => {
              const imgUrl = product.images?.[0] || product.image || '/uploads/default.jpg';
              const hasOffer = product.offerPrice && product.offerPrice < product.price;
              const discount = hasOffer ? Math.round((1 - product.offerPrice / product.price) * 100) : 0;

              return (
                <Grid item xs={12} sm={6} md={3} key={product._id}>
                  <Card variant="outlined" sx={{ borderRadius: 3, cursor: 'pointer', border: '1px solid #F3F4F6', '&:hover': { boxShadow: '0 8px 24px rgba(0,0,0,0.08)', transform: 'translateY(-2px)' }, transition: 'all 0.2s' }} onClick={() => navigate(`/products/${product._id}`)}>
                    <Box sx={{ position: 'relative', height: 160, bgcolor: '#F9FAFB' }}>
                      <img src={imgUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.src = '/uploads/default.jpg'} />
                      {discount > 0 && <Chip label={`${discount}% OFF`} size="small" sx={{ position: 'absolute', top: 8, left: 8, bgcolor: '#EF4444', color: '#fff', fontWeight: 700, fontSize: '10px' }} />}
                    </Box>
                    <Box sx={{ p: 2 }}>
                      <Typography variant="subtitle2" fontWeight={700} noWrap>{product.name}</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        <Typography fontWeight={800} color="#16A34A">₹{product.offerPrice || product.price}</Typography>
                        {hasOffer && <Typography variant="caption" sx={{ textDecoration: 'line-through', color: '#9CA3AF' }}>₹{product.price}</Typography>}
                      </Box>
                      <Button
                        fullWidth size="small" variant="outlined"
                        startIcon={<AddShoppingCart fontSize="small" />}
                        sx={{ mt: 1.5, borderColor: '#16A34A', color: '#16A34A', borderRadius: 1.5, fontWeight: 700, '&:hover': { bgcolor: '#F0FDF4', borderColor: '#16A34A' } }}
                        onClick={e => { e.stopPropagation(); dispatch(addToCart(product._id, 1)); }}
                        disabled={product.countInStock === 0}>
                        Add to Cart
                      </Button>
                    </Box>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      )}
    </Container>
  );
};

export default CartPage;