import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Container, Typography, Card, CardContent, CardMedia, Button,
  IconButton, Select, MenuItem, Divider, Box
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { addToCart, removeFromCart, listMyCart } from '../../redux/actions/cartActions';
import Message from '../../components/common/Message';

const CartPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { cartItems = [] } = useSelector(s => s.cart);

  useEffect(() => {
    dispatch(listMyCart());
  }, [dispatch]);

  const handleQtyChange = (id, qty) => dispatch(addToCart(id, Number(qty)));
  const handleRemove = (id) => dispatch(removeFromCart(id));
  const proceedToCheckout = () => navigate('/checkout');

  const total = cartItems.reduce((s, i) => s + (i.product?.price || 0) * (i.qty || 0), 0).toFixed(2);

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>Shopping Cart</Typography>
      {cartItems.length === 0 ? (
        <Message severity="info">Your cart is empty.</Message>
      ) : (
        <>
          {cartItems.map(item => (
            <Card key={item.product._id} sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <CardMedia
                component="img"
                image={item.product.image || '/uploads/default.jpg'}
                alt={item.product.name}
                sx={{ width: 100, height: 100, objectFit: 'cover', m: 2 }}
              />
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6">{item.product.name}</Typography>
                <Typography>₹{item.product.price}</Typography>
                <Select
                  value={item.qty}
                  onChange={e => handleQtyChange(item.product._id, e.target.value)}
                  sx={{ mt: 1, minWidth: 80 }}
                >
                  {[...Array(item.product.countInStock).keys()].map(x => (
                    <MenuItem key={x + 1} value={x + 1}>{x + 1}</MenuItem>
                  ))}
                </Select>
              </CardContent>
              <IconButton onClick={() => handleRemove(item.product._id)} sx={{ m: 2 }}>
                <DeleteIcon />
              </IconButton>
            </Card>
          ))}
          <Card sx={{ p: 2 }}>
            <Typography variant="h6">Total: ₹{total}</Typography>
            <Button fullWidth variant="contained" onClick={proceedToCheckout} sx={{ mt: 2 }}>
              Proceed to Checkout
            </Button>
          </Card>
        </>
      )}
    </Container>
  );
};

export default CartPage;