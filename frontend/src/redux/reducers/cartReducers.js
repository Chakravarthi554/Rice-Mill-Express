// src/redux/reducers/cartReducers.js
import {
  CART_ADD_ITEM,
  CART_REMOVE_ITEM,
  CART_CLEAR_ITEMS,
  CART_REPLACE_ITEMS,
  CART_SAVE_SHIPPING_ADDRESS,
  CART_SAVE_PAYMENT_METHOD,
} from '../constants/cartConstants';

const initialState = {
  cartItems: [],
  shippingAddress: {},
  paymentMethod: '',
};

export const cartReducer = (state = initialState, action) => {
  switch (action.type) {
    case CART_REPLACE_ITEMS:
      return { ...state, cartItems: action.payload || [] };

    case CART_ADD_ITEM:
      const item = action.payload;
      const existItem = state.cartItems.find((x) => x.product._id === item.product);
      if (existItem) {
        return {
          ...state,
          cartItems: state.cartItems.map((x) =>
            x.product._id === existItem.product._id ? item : x
          ),
        };
      } else {
        return {
          ...state,
          cartItems: [...state.cartItems, item],
        };
      }

    case CART_REMOVE_ITEM:
      return {
        ...state,
        cartItems: state.cartItems.filter((x) => x.product._id !== action.payload),
      };

    case CART_CLEAR_ITEMS:
      return { ...state, cartItems: [] };

    case CART_SAVE_SHIPPING_ADDRESS:
      return { ...state, shippingAddress: action.payload };

    case CART_SAVE_PAYMENT_METHOD:
      return { ...state, paymentMethod: action.payload };

    default:
      return state;
  }
};