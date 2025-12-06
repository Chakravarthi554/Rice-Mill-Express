// src/redux/actions/cartActions.js
import axios from 'axios';
import {
  CART_ADD_ITEM,
  CART_REMOVE_ITEM,
  CART_CLEAR_ITEMS,
  CART_REPLACE_ITEMS,
  CART_SAVE_SHIPPING_ADDRESS,
  CART_SAVE_PAYMENT_METHOD,
} from '../constants/cartConstants';

// Add or update item in cart (server-synced)
export const addToCart = (productId, qty) => async (dispatch, getState) => {
  try {
    const { userLogin: { userInfo } } = getState();
    if (!userInfo?.token) throw new Error('Login required');
    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userInfo.token}`,
      },
    };
    const { data } = await axios.post('/api/cart', { product: productId, qty }, config);
    // data = array of { product: { _id, name, price, ... }, qty }
    dispatch({ type: CART_REPLACE_ITEMS, payload: data });
    localStorage.setItem('cartItems', JSON.stringify(data));
    return Promise.resolve();
  } catch (error) {
    console.error('Error adding to cart:', error.message);
    return Promise.reject(error);
  }
};

// Remove item from cart (server-synced)
export const removeFromCart = (productId) => async (dispatch, getState) => {
  try {
    const { userLogin: { userInfo } } = getState();
    if (!userInfo?.token) return;
    const config = {
      headers: { Authorization: `Bearer ${userInfo.token}` },
    };
    await axios.delete(`/api/cart/${productId}`, config);
    const { data } = await axios.get('/api/cart', config); // Refresh cart
    dispatch({ type: CART_REPLACE_ITEMS, payload: data });
    localStorage.setItem('cartItems', JSON.stringify(data));
  } catch (error) {
    console.error('Error removing from cart:', error);
  }
};

// Fetch entire cart from server
export const listMyCart = () => async (dispatch, getState) => {
  try {
    const { userLogin: { userInfo } } = getState();
    if (!userInfo?.token) return;
    const config = {
      headers: { Authorization: `Bearer ${userInfo.token}` },
    };
    const { data } = await axios.get('/api/cart', config);
    dispatch({ type: CART_REPLACE_ITEMS, payload: data });
    localStorage.setItem('cartItems', JSON.stringify(data));
  } catch (error) {
    console.error('Error listing cart:', error);
  }
};

// Clear cart (server-synced)
export const clearCart = () => async (dispatch, getState) => {
  try {
    const { userLogin: { userInfo } } = getState();
    if (!userInfo?.token) return;
    const config = {
      headers: { Authorization: `Bearer ${userInfo.token}` },
    };
    await axios.delete('/api/cart', config);
    dispatch({ type: CART_CLEAR_ITEMS });
    localStorage.removeItem('cartItems');
  } catch (error) {
    console.error('Error clearing cart:', error);
  }
};

// Save shipping address
export const saveShippingAddress = (data) => (dispatch) => {
  dispatch({ type: CART_SAVE_SHIPPING_ADDRESS, payload: data });
  localStorage.setItem('shippingAddress', JSON.stringify(data));
};

// Save payment method
export const savePaymentMethod = (data) => (dispatch) => {
  dispatch({ type: CART_SAVE_PAYMENT_METHOD, payload: data });
  localStorage.setItem('paymentMethod', JSON.stringify(data));
};