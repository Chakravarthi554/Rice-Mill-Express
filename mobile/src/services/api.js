import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../config/firebase';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000, // 10 second timeout
});

// Add auth token to every request
api.interceptors.request.use(
    async (config) => {
        try {
            // Get user from Firebase
            const user = auth.currentUser;
            let token = null;

            if (user) {
                console.log('🔑 API Request: Using Firebase auth for token');
                // getIdToken() returns a fresh token if the current one is expired
                token = await user.getIdToken();
                console.log(`✅ Got token from Firebase (length: ${token?.length || 0})`);
            } else {
                console.log('⚠️ API Request: Firebase user not available, falling back to AsyncStorage');
                // Fallback to AsyncStorage
                token = await AsyncStorage.getItem('userToken');
                console.log(`📦 Got token from AsyncStorage (length: ${token?.length || 0})`);
            }

            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            } else {
                console.warn('⛔ No token available for request');
            }
        } catch (error) {
            console.error('❌ Error getting auth token:', error);
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for error handling and automatic retry
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If error is 401 and we haven't retried yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const user = auth.currentUser;
                if (user) {
                    // Force refresh the token
                    console.log('🔄 Token expired, attempting to refresh...');
                    const newToken = await user.getIdToken(true);

                    // Update AsyncStorage
                    await AsyncStorage.setItem('userToken', newToken);

                    // Update the header and retry
                    originalRequest.headers.Authorization = `Bearer ${newToken}`;
                    console.log('✅ Token refreshed, retrying request...');
                    return api(originalRequest);
                }
            } catch (refreshError) {
                console.error('❌ Failed to refresh token:', refreshError);
            }
        }

        if (error.response) {
            console.error('API Error:', error.response.status, error.response.data);
        } else if (error.request) {
            console.error('Network Error:', error.message);
        } else {
            console.error('Error:', error.message);
        }
        return Promise.reject(error);
    }
);

// API service methods
export const apiService = {
    // ============ Products ============
    getProducts: (params = {}) => api.get('/api/products', { params }),
    getProductById: (id) => api.get(`/api/products/${id}`),
    searchProducts: (query) => api.get('/api/products/search', { params: { q: query } }),

    // ============ Orders ============
    getOrders: () => api.get('/api/orders'),
    createOrder: (orderData) => api.post('/api/orders', orderData),
    getOrderById: (id) => api.get(`/api/orders/${id}`),
    updateOrderStatus: (id, status) => api.put(`/api/orders/${id}/status`, { status }),

    // ============ Cart ============
    getCart: () => api.get('/api/cart'),
    addToCart: (productId, quantity) => api.post('/api/cart', { productId, quantity }),
    updateCartItem: (productId, quantity) => api.put('/api/cart', { productId, quantity }),
    removeFromCart: (productId) => api.delete(`/api/cart/${productId}`),
    clearCart: () => api.delete('/api/cart'),

    // ============ Delivery Partner ============
    getAssignedOrders: () => api.get('/api/delivery-partners/my-deliveries'),
    getDeliveryOrderById: (id) => api.get(`/api/delivery-partners/orders/${id}`),
    updateDeliveryStatus: (orderId, status, location) =>
        api.put(`/api/delivery-partners/orders/${orderId}/status`, { status, location }),
    uploadDeliveryPhoto: (orderId, formData) =>
        api.post(`/api/delivery-partners/orders/${orderId}/confirm`, formData),
    startDelivery: (orderId) => api.post(`/api/delivery-partners/orders/${orderId}/start`, {}),
    completeDelivery: (orderId, data) => api.post(`/api/delivery-partners/orders/${orderId}/complete`, data),
    requestReplacement: (orderId, formData) =>
        api.post(`/api/delivery-partners/orders/${orderId}/replacement`, formData),


    // ============ Seller ============
    getSellerOrders: () => api.get('/api/seller/orders'),
    getSellerProducts: () => api.get('/api/seller/products'),
    createProduct: (productData) => api.post('/api/seller/products', productData),
    updateProduct: (id, productData) => api.put(`/api/seller/products/${id}`, productData),
    deleteProduct: (id) => api.delete(`/api/seller/products/${id}`),
    assignDeliveryPartner: (orderId, partnerId) =>
        api.put(`/api/delivery-partners/orders/${orderId}`, { partnerId }),
    getSellerStats: () => api.get('/api/seller/stats'),
    submitKyc: (formData) => api.post('/api/kyc', formData),

    // ============ User Profile ============
    getUserProfile: () => api.get('/api/users/profile'),
    updateUserProfile: (data) => api.put('/api/users/profile', data),

    // ============ Wishlist ============
    getWishlist: () => api.get('/api/users/wishlist'),
    addToWishlist: (productId) => api.post('/api/users/wishlist', { productId }),
    removeFromWishlist: (productId) => api.delete(`/api/users/wishlist/${productId}`),

    // ============ Notifications ============
    getNotifications: () => api.get('/api/notifications'),
    markNotificationRead: (id) => api.put(`/api/notifications/${id}/read`),
    markAllNotificationsRead: () => api.put('/api/notifications/read-all'),
    deleteNotification: (id) => api.delete(`/api/notifications/${id}`),

    // ============ Bookmarks ============
    getBookmarks: () => api.get('/api/users/bookmarks'),
    bookmarkPost: (postId) => api.post('/api/users/bookmarks', { postId }),
    unbookmarkPost: (postId) => api.delete(`/api/users/bookmarks/${postId}`),

    // ============ Addresses ============
    getAddresses: () => api.get('/api/addresses'),
    createAddress: (addressData) => api.post('/api/addresses', addressData),
    updateAddress: (id, addressData) => api.put(`/api/addresses/${id}`, addressData),
    deleteAddress: (id) => api.delete(`/api/addresses/${id}`),

    // ============ Bulk Orders ============
    getBulkOrders: () => api.get('/api/bulk-orders'),
    createBulkOrder: (orderData) => api.post('/api/bulk-orders', orderData),
    getBulkOrderById: (id) => api.get(`/api/bulk-orders/${id}`),
};

export default api;
