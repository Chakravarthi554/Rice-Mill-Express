import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
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