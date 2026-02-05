import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import { productListReducer, productDetailsReducer } from './reducers/productReducers';
import { cartReducer } from './reducers/cartReducers';
import {
  bulkOrderListReducer,
  bulkOrderCreateReducer,
  bulkOrderUpdateReducer,
  bulkOrderDetailsReducer
} from './reducers/bulkOrderReducers';

const store = configureStore({
  reducer: {
    auth: authReducer,
    productList: productListReducer,
    productDetails: productDetailsReducer,
    cart: cartReducer,
    bulkOrderList: bulkOrderListReducer,
    bulkOrderCreate: bulkOrderCreateReducer,
    bulkOrderUpdate: bulkOrderUpdateReducer,
    bulkOrderDetails: bulkOrderDetailsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore Firebase auth objects in actions
        ignoredActions: ['auth/login/fulfilled', 'auth/loadFromStorage/fulfilled'],
        ignoredPaths: ['auth.user'],
      },
    }),
});

export default store;