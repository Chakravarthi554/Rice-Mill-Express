import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../config/firebase';
import store from '../redux/store';
import { logout } from '../redux/slices/authSlice';

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

                } else {
                    console.warn('⛔ Session expired and no Firebase user to refresh. Logging out.');
                    store.dispatch(logout());
                }
            } catch (refreshError) {
                console.error('❌ Failed to refresh token:', refreshError);
                // Permanent failure, layout to prevent infinite 401s
                store.dispatch(logout());
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
    getProductComments: (id) => api.get(`/api/products/${id}/comments`),
    getProductComments: (id) => api.get(`/api/products/${id}/comments`),
    getProductReviews: (id) => api.get(`/api/products/${id}/reviews`),
    createProductComment: (id, comment) => api.post(`/api/products/${id}/comment`, { text: comment }),
    searchProducts: (query) => api.get('/api/products/search', { params: { q: query } }),

    // ============ Orders ============
    // Customer orders endpoint (not admin)
    getOrders: () => api.get('/api/orders/myorders'),
    createOrder: (orderData) => api.post('/api/orders', orderData),
    getOrderById: (id) => api.get(`/api/orders/${id}`),
    updateOrderStatus: (id, status) => api.put(`/api/orders/${id}/status`, { status }),

    // ============ Cart ============
    getCart: () => api.get('/api/cart'),
    addToCart: (productId, quantity) => api.post('/api/cart', { product: productId, qty: quantity }),
    updateCartItem: (productId, quantity) => api.post('/api/cart', { product: productId, qty: quantity }),
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

    // ============ Utils ============
    getAuthToken: async () => {
        try {
            const user = auth.currentUser;
            if (user) return await user.getIdToken();
            return await AsyncStorage.getItem('userToken');
        } catch (e) {
            console.error('Error getting auth token', e);
            return null;
        }
    },

    // ============ Bookmarks ============
    getBookmarks: () => api.get('/api/users/bookmarks'),
    bookmarkPost: (postId) => api.post('/api/users/bookmarks', { postId }),
    unbookmarkPost: (postId) => api.delete(`/api/users/bookmarks/${postId}`),

    // ============ Addresses ============
    getAddresses: () => api.get('/api/users/addresses'),
    createAddress: (addressData) => api.post('/api/users/addresses', addressData),
    updateAddress: (id, addressData) => api.put(`/api/users/addresses/${id}`, addressData),
    deleteAddress: (id) => api.delete(`/api/users/addresses/${id}`),

    // ============ Bulk Orders ============
    getBulkOrders: () => api.get('/api/bulk-orders'),
    createBulkOrder: (orderData) => api.post('/api/bulk-orders', orderData),
    getBulkOrderById: (id) => api.get(`/api/bulk-orders/${id}`),
    updateBulkOrder: (id, updateData) => api.put(`/api/bulk-orders/${id}`, updateData),

    // ============ Recipes ============
    getRecipes: (params = {}) => api.get('/api/recipes', { params }),
    getRecipeById: (id) => api.get(`/api/recipes/${id}`),
    rateRecipe: (id, rating) => api.post(`/api/social/recipes/${id}/rate`, { rating }),
    commentOnRecipe: (id, comment) => api.post(`/api/social/recipes/${id}/comment`, { content: comment }),

    // ============ Forum ============
    getForumPosts: (params = {}) => api.get('/api/forum', { params }),
    getForumPostById: (id) => api.get(`/api/forum/${id}`),
    createForumPost: (postData) => api.post('/api/forum', postData),
    likeForumPost: (id) => api.post(`/api/forum/${id}/like`),
    commentOnForumPost: (id, comment) => api.post(`/api/forum/${id}/reply`, { content: comment }),

    // ============ Rewards & Wallet ============
    getRewards: () => api.get('/api/users/rewards'),
    getRewardTransactions: () => api.get('/api/users/rewards/transactions'),
    redeemReward: (points) => api.post('/api/users/rewards/redeem', { points }),

    // ============ Reviews Management ============
    getUserReviews: () => api.get('/api/users/reviews'),
    createProductReview: (productId, reviewData) => api.post(`/api/products/${productId}/reviews`, reviewData),
    deleteReview: (productId) => api.delete(`/api/products/${productId}/reviews`),
    updateReview: (productId, reviewData) => api.put(`/api/products/${productId}/reviews`, reviewData),

    // ============ Refunds & Returns ============
    createRefundRequest: (orderId, refundData) => api.post(`/api/orders/${orderId}/refund`, refundData),
    getRefunds: () => api.get('/api/users/refunds'),
    getRefundById: (refundId) => api.get(`/api/refunds/${refundId}`),

    // ============ Referrals ============
    getReferrals: () => api.get('/api/users/referrals'),
    getReferralCode: () => api.get('/api/users/referral-code'),

    // ============ Subscriptions ============
    getSubscriptions: () => api.get('/api/users/subscriptions'),
    createSubscription: (subscriptionData) => api.post('/api/subscriptions', subscriptionData),
    cancelSubscription: (subscriptionId) => api.delete(`/api/subscriptions/${subscriptionId}`),

    // ============ Payments ============
    createRazorpayOrder: (paymentData) => api.post('/api/payments/razorpay/order', paymentData),
    verifyRazorpayPayment: (paymentData) => api.post('/api/payments/razorpay/verify', paymentData),

    // ============ Order Tracking ============
    trackOrder: (orderId) => api.get(`/api/orders/${orderId}/track`),
    getDeliveryLocation: (orderId) => api.get(`/api/orders/${orderId}/delivery-location`),

    // ============ Invoices ============
    downloadInvoice: (orderId) => api.get(`/api/orders/${orderId}/invoice`, { responseType: 'blob' }),
    getAuthToken: async () => {
        const user = auth.currentUser;
        if (user) return await user.getIdToken();
        return await AsyncStorage.getItem('userToken');
    }
};

export default api;
