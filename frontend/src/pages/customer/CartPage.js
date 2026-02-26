import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Container, Typography, Card, CardContent, CardMedia, Button,
  IconButton, Select, MenuItem, Divider, Box, Grid
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Delete as DeleteIcon, AddShoppingCart } from '@mui/icons-material';
import { addToCart, removeFromCart, listMyCart } from '../../redux/actions/cartActions';
import { listProducts } from '../../redux/actions/productActions';
import Message from '../../components/common/Message';
import Price from '../../components/common/Price';

const CartPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { cartItems = [] } = useSelector(s => s.cart);
  const { products = [] } = useSelector(s => s.productList);

  useEffect(() => {
    dispatch(listMyCart());
    dispatch(listProducts()); // ✅ Fetch all products for recommendations
  }, [dispatch]);

  const handleQtyChange = (id, qty) => dispatch(addToCart(id, Number(qty)));
  const handleRemove = (id) => dispatch(removeFromCart(id));
  const proceedToCheckout = () => navigate('/checkout');

  const total = cartItems.reduce((s, i) => s + (i.product?.price || 0) * (i.qty || 0), 0).toFixed(2);

  // ✅ Get recommended products (exclude items already in cart)
  const cartProductIds = cartItems.map(item => item.product._id);
  const recommendedProducts = products.filter(p => !cartProductIds.includes(p._id));

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>{t('cart')}</Typography>
      {cartItems.length === 0 ? (
        <Message severity="info">{t('emptyCart')}</Message>
      ) : (
        <>
          {cartItems.map(item => (
            <Card
              key={item.product._id}
              sx={{
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                '&:hover': { boxShadow: 3 }
              }}
              onClick={() => navigate(`/products/${item.product._id}`)}
            >
              <CardMedia
                component="img"
                image={item.product.images?.[0] || item.product.image || '/uploads/default.jpg'}
                alt={item.product.name}
                sx={{ width: 100, height: 100, objectFit: 'cover', m: 2 }}
              />
              <CardContent sx={{ flexGrow: 1 }} onClick={(e) => e.stopPropagation()}>
                <Typography variant="h6">{item.product.name}</Typography>
                <Typography>
                  <Price amount={item.product.price} />
                </Typography>
                <Select
                  value={item.qty || 1}
                  onChange={e => handleQtyChange(item.product._id, e.target.value)}
                  sx={{ mt: 1, minWidth: 80 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* ✅ FIXED: Ensure valid stock count before creating array */}
                  {[...Array(Math.max(1, Math.min(item.product.countInStock || 10, 10))).keys()].map(x => (
                    <MenuItem key={x + 1} value={x + 1}>{x + 1}</MenuItem>
                  ))}
                </Select>
              </CardContent>
              <IconButton onClick={(e) => { e.stopPropagation(); handleRemove(item.product._id); }} sx={{ m: 2 }}>
                <DeleteIcon />
              </IconButton>
            </Card>
          ))}
          <Card sx={{ p: 2 }}>
            <Typography variant="h6">
              {t('total')}: <Price amount={total} />
            </Typography>
            <Button fullWidth variant="contained" onClick={proceedToCheckout} sx={{ mt: 2 }}>
              {t('checkout')}
            </Button>
          </Card>

          {/* ✅ Recommended Products Section */}
          {recommendedProducts.length > 0 && (
            <>
              <Divider sx={{ my: 4 }} />
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
                {t('youMayAlsoLike')}
              </Typography>
              <Grid container spacing={2}>
                {recommendedProducts.slice(0, 8).map(product => (
                  <Grid item xs={12} sm={6} md={3} key={product._id}>
                    <Card
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        cursor: 'pointer',
                        '&:hover': { boxShadow: 4 }
                      }}
                      onClick={() => navigate(`/products/${product._id}`)}
                    >
                      <CardMedia
                        component="img"
                        image={product.images?.[0] || product.image || '/uploads/default.jpg'}
                        alt={product.name}
                        sx={{ height: 150, objectFit: 'contain', backgroundColor: '#f5f5f5', p: 1 }}
                      />
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Typography variant="subtitle1" noWrap>{product.name}</Typography>
                        <Typography variant="h6" color="primary">
                          <Price amount={product.price} />
                        </Typography>
                      </CardContent>
                      <Box sx={{ p: 2, pt: 0 }}>
                        <Button
                          fullWidth
                          variant="outlined"
                          startIcon={<AddShoppingCart />}
                          onClick={(e) => {
                            e.stopPropagation();
                            dispatch(addToCart(product._id, 1));
                          }}
                          disabled={product.countInStock === 0}
                        >
                          {t('addToCart')}
                        </Button>
                      </Box>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </>
          )}
        </>
      )}
    </Container>
  );
};

export default CartPage;