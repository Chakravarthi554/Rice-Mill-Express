import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../config/firebase';

import { API_URL } from '../config/env';

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
        'Bypass-Tunnel-Reminder': 'true', // Case-sensitive professional headers
        'bypass-tunnel-reminder': 'true', // Lowercase fallback
        'ngrok-skip-browser-warning': 'true', // Support for Ngrok fallback
        'User-Agent': 'Rice-Mill-App-Mobile', // Professional identification
    },
    timeout: 30000, 
});

// Helper: waits up to `timeout` ms for Firebase to restore the signed-in user
const waitForFirebaseUser = (timeoutMs = 3000) => {
    return new Promise((resolve) => {
        // If already signed in, return immediately
        if (auth.currentUser) return resolve(auth.currentUser);

        // Subscribe to auth state changes
        let resolved = false;
        const unsub = auth.onAuthStateChanged((user) => {
            if (!resolved) {
                resolved = true;
                unsub();
                resolve(user);
            }
        });

        // Resolve with null after timeout (don't block indefinitely)
        setTimeout(() => {
            if (!resolved) {
                resolved = true;
                unsub();
                resolve(null);
            }
        }, timeoutMs);
    });
};

// Add auth token to every request
api.interceptors.request.use(
    async (config) => {
        console.log(`\n--- [API DEBUG] ---`);
        console.log(`Current API URL : ${API_URL}`);
        console.log(`Axios baseURL   : ${config.baseURL}`);
        console.log(`Request Method  : ${config.method?.toUpperCase()}`);
        console.log(`Request URL     : ${config.url}`);
        console.log(`-------------------\n`);
        try {
            // Always try to get a fresh token from Firebase first.
            // wait up to 3s for Firebase auth to restore the session on startup.
            const user = auth.currentUser || await waitForFirebaseUser(3000);

            if (user) {
                // getIdToken(false) returns cached token if valid, or refreshes automatically
                const token = await user.getIdToken(false);
                console.log(`✅ Got token from Firebase (length: ${token?.length || 0})`);
                config.headers.Authorization = `Bearer ${token}`;
            } else {
                // Fallback: legacy backend users (delivery partners with non-Firebase JWT)
                console.log('⚠️ API Request: Firebase user not available, falling back to AsyncStorage');
                const token = await AsyncStorage.getItem('userToken');
                if (token) {
                    console.log(`📦 Got token from AsyncStorage (length: ${token?.length || 0})`);
                    config.headers.Authorization = `Bearer ${token}`;
                } else {
                    console.warn('⛔ No token available for request');
                }
            }
        } catch (error) {
            console.error('❌ Error getting auth token:', error);
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Export a function to setup response interceptors with store access
export const setupInterceptors = (store, logoutAction) => {
    // Response interceptor for error handling and automatic retry
    api.interceptors.response.use(
        (response) => {
            // ✅ AUTO-UNWRAP RESPONSE ENVELOPE (Same as Web App)
            if (
                response.data &&
                typeof response.data === 'object' &&
                'success' in response.data &&
                'data' in response.data &&
                response.data.success === true
            ) {
                response.data = response.data.data;
            }
            return response;
        },
        async (error) => {
            console.error('🌐 [API Error] Detailed Diagnostic:');
            console.error(`  - URL: ${error?.config?.baseURL}${error?.config?.url}`);
            console.error(`  - Message: ${error?.message}`);
            console.error(`  - Code: ${error?.code}`);
            console.error(`  - Status: ${error?.response?.status || 'N/A'}`);

            if (error.message === 'Network Error') {
                console.error('  💡 TRACING: Request failed at OS level. Check Firewall or Tunnel SSL.');
            }

            const originalRequest = error.config;

            // If error is 401 and we haven't retried yet
            if (error.response?.status === 401 && !originalRequest._retry) {
                originalRequest._retry = true;

                try {
                    const isAuthReady = store.getState().auth.isAuthReady;
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
                        if (!isAuthReady) {
                            console.warn('⏳ Session expired but Firebase auth is still initializing. Skipping auto-logout.');
                            return Promise.reject(error);
                        }
                        console.warn('⛔ Session expired and no Firebase user to refresh. Logging out.');
                        store.dispatch(logoutAction());
                    }
                } catch (refreshError) {
                    console.error('❌ Failed to refresh token:', refreshError);
                    // Permanent failure, layout to prevent infinite 401s
                    store.dispatch(logoutAction());
                }
            }

            if (error.response) {
                // Don't log expected 403 role access errors to reduce console noise
                if (error.response.status !== 403 || error.response.data?.code !== 'ROLE_ACCESS_DENIED') {
                    console.error('API Error:', error.response.status, error.response.data);
                }
            } else if (error.request) {
                console.error(`Network Error to [${api.defaults.baseURL}]:`, error.message);
            } else {
                console.error('Error:', error.message);
            }
            return Promise.reject(error);
        }
    );
};

// API service methods
export const apiService = {
    // ============ Products ============
    getProducts: (params = {}) => api.get('/api/v1/products', { params }),
    getProductById: (id) => api.get(`/api/v1/products/${id}`),
    getProductComments: (id) => api.get(`/api/v1/products/${id}/comments`),
    getProductComments: (id) => api.get(`/api/v1/products/${id}/comments`),
    getProductReviews: (id) => api.get(`/api/v1/products/${id}/reviews`),
    createProductComment: (id, comment) => api.post(`/api/v1/products/${id}/comment`, { text: comment }),
    searchProducts: (query) => api.get('/api/v1/products/search', { params: { q: query } }),

    // ============ Orders ============
    // Customer orders endpoint (not admin)
    getOrders: () => api.get('/api/v1/orders/myorders'),
    createOrder: (orderData) => api.post('/api/v1/orders', orderData),
    getDeliveryFeePreview: (data) => api.post('/api/v1/orders/delivery-fee-preview', data),
    getOrderById: (id) => api.get(`/api/v1/orders/${id}`),
    updateOrderStatus: (id, status) => api.put(`/api/v1/orders/${id}/status`, { status }),
    generateInvoice: (id) => api.get(`/api/v1/orders/${id}/invoice`),
    checkInvoiceStatus: (id) => api.get(`/api/v1/orders/${id}/invoice/status`),

    // ============ Cart ============
    getCart: () => api.get('/api/v1/cart'),
    addToCart: (productId, quantity) => api.post('/api/v1/cart', { product: productId, qty: quantity }),
    updateCartItem: (productId, quantity) => api.post('/api/v1/cart', { product: productId, qty: quantity }),
    removeFromCart: (productId) => api.delete(`/api/v1/cart/${productId}`),
    clearCart: () => api.delete('/api/v1/cart'),

    // ============ Delivery Partner ============
    getAssignedOrders: () => api.get('/api/v1/delivery-partners/my-deliveries'),
    getDeliveryOrderById: (id) => api.get(`/api/v1/delivery-partners/orders/${id}`),
    updateDeliveryStatus: (orderId, status, location) =>
        api.put(`/api/v1/delivery-partners/orders/${orderId}/status`, { status, location }),
    uploadDeliveryPhoto: (orderId, formData) =>
        api.post(`/api/v1/delivery-partners/orders/${orderId}/confirm`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 30000, // 30s timeout for photo uploads
        }),
    startDelivery: (orderId) => api.post(`/api/v1/delivery-partners/orders/${orderId}/start`, {}),
    completeDelivery: (orderId, data) => api.post(`/api/v1/delivery-partners/orders/${orderId}/complete`, data),
    requestReplacement: (orderId, formData) =>
        api.post(`/api/v1/delivery-partners/orders/${orderId}/replacement`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 30000,
        }),
    getDPDashboard: () => api.get('/api/v1/dp/dashboard'),
    generateDeliveryPaymentLink: (orderId) => api.post(`/api/v1/delivery-partners/orders/${orderId}/generate-delivery-payment-link`),
    checkDeliveryPaymentStatus: (orderId, paymentLinkId) => api.get(`/api/v1/delivery-partners/orders/${orderId}/check-delivery-payment/${paymentLinkId}`),
    remitCash: () => api.post('/api/v1/dp/remit-cash'),
    raiseIssue: (orderId, data) => api.post(`/api/v1/dp/raise-issue/${orderId}`, data),
    getWalletData: () => api.get('/api/v1/dp/wallet'),
    requestWithdrawal: (data) => api.post('/api/v1/dp/withdraw', data),
    getWithdrawalHistory: () => api.get('/api/v1/dp/withdrawals'),
    saveBankAccount: (data) => api.post('/api/v1/dp/saved-banks', data),

    // ============ Seller ============
    getSellerOrders: () => api.get('/api/v1/seller/orders'),
    getSellerProducts: () => api.get('/api/v1/seller/products'),
    createProduct: (productData) => api.post('/api/v1/seller/products', productData),
    updateProduct: (id, productData) => api.put(`/api/v1/seller/products/${id}`, productData),
    deleteProduct: (id) => api.delete(`/api/v1/seller/products/${id}`),
    assignDeliveryPartner: (orderId, partnerId) =>
        api.put(`/api/v1/delivery-partners/orders/${orderId}`, { partnerId }),
    getSellerStats: () => api.get('/api/v1/seller/stats'),
    submitKyc: (formData) => api.post('/api/v1/kyc', formData),

    // ============ User Profile & Settings ============
    getUserProfile: () => api.get('/api/v1/users/profile'),
    updateUserProfile: (data) => api.put('/api/v1/users/profile', data),
    changePassword: (data) => api.put('/api/v1/users/change-password', data),
    updatePreferences: (data) => api.put('/api/v1/users/preferences', data),
    getPrivacySettings: () => api.get('/api/v1/users/privacy'),
    updatePrivacySettings: (data) => api.put('/api/v1/users/privacy', data),
    toggleTwoFactor: (enabled) => api.put('/api/v1/users/two-factor', { enabled }),
    getLoginHistory: () => api.get('/api/v1/users/login-history'),
    verify2FA: (data) => api.post('/api/v1/auth/verify-2fa', data),
    exportUserData: () => api.post('/api/v1/users/export-data'),
    deleteAccount: (password) => api.delete('/api/v1/users/me', { data: { password } }),
    getLegalPolicy: (type) => api.get(`/api/v1/legal/${type}`),

    // ============ Rewards & Referral ============
    // ============ Rewards & Referral ============
    getRewards: () => api.get('/api/v1/rewards'),
    getRewardTransactions: () => api.get('/api/v1/rewards'), // History is part of rewards response
    redeemReward: (points) => api.post('/api/v1/rewards/redeem', { points }),
    getReferralInfo: () => api.get('/api/v1/rewards/referral'),
    syncRewards: () => api.get('/api/v1/rewards/sync'),
    getWalletData: () => api.get('/api/v1/rewards/wallet'),
    getRewardsWallet: () => api.get('/api/v1/rewards/wallet'),
    requestWithdrawal: (data) => api.post('/api/v1/rewards/withdraw', data),
    getWithdrawalHistory: () => api.get('/api/v1/rewards/withdrawals'),
    getPublicSettings: () => api.get('/api/v1/settings/public'),

    // ============ Wishlist ============
    getWishlist: () => api.get('/api/v1/users/wishlist'),
    addToWishlist: (productId) => api.post('/api/v1/users/wishlist', { productId }),
    removeFromWishlist: (productId) => api.delete(`/api/v1/users/wishlist/${productId}`),

    // ============ Notifications ============
    getNotifications: () => api.get('/api/v1/notifications'),
    markNotificationRead: (id) => api.put(`/api/v1/notifications/${id}/read`),
    markAllNotificationsRead: () => api.put('/api/v1/notifications/read-all'),
    deleteNotification: (id) => api.delete(`/api/v1/notifications/${id}`),

    // ============ Bookmarks ============
    getBookmarks: () => api.get('/api/v1/users/bookmarks'),
    bookmarkPost: (postId) => api.post('/api/v1/users/bookmarks', { postId }),
    unbookmarkPost: (postId) => api.delete(`/api/v1/users/bookmarks/${postId}`),

    // ============ Addresses ============
    getAddresses: () => api.get('/api/v1/users/addresses'),
    createAddress: (addressData) => api.post('/api/v1/users/addresses', addressData),
    updateAddress: (id, addressData) => api.put(`/api/v1/users/addresses/${id}`, addressData),
    deleteAddress: (id) => api.delete(`/api/v1/users/addresses/${id}`),

    // ============ Bulk Orders ============
    getBulkOrders: () => api.get('/api/v1/bulk-orders'),
    createBulkOrder: (orderData) => api.post('/api/v1/bulk-orders', orderData),
    getBulkOrderById: (id) => api.get(`/api/v1/bulk-orders/${id}`),
    updateBulkOrder: (id, updateData) => api.put(`/api/v1/bulk-orders/${id}`, updateData),

    // ============ Recipes ============
    getRecipes: (params = {}) => api.get('/api/v1/recipes', { params }),
    getRecipeById: (id) => api.get(`/api/v1/recipes/${id}`),
    rateRecipe: (id, rating) => api.post(`/api/v1/social/recipes/${id}/rate`, { rating }),
    commentOnRecipe: (id, comment) => api.post(`/api/v1/social/recipes/${id}/comment`, { text: comment }),
    likeRecipe: (id) => api.post(`/api/v1/social/recipes/${id}/like`),
    shareRecipe: (id) => api.post(`/api/v1/social/recipes/${id}/share`, {}),
    likeRecipeComment: (recipeId, commentId) => api.post(`/api/v1/social/recipes/${recipeId}/comments/${commentId}/like`),
    replyToRecipeComment: (recipeId, commentId, comment) => api.post(`/api/v1/social/recipes/${recipeId}/comments/${commentId}/reply`, { text: comment }),

    // ============ Forum ============
    getForumPosts: (params = {}) => api.get('/api/v1/forum', { params }),
    getForumPostById: (id) => api.get(`/api/v1/forum/${id}`),
    createForumPost: (postData) => api.post('/api/v1/forum', postData),
    likeForumPost: (id) => api.post(`/api/v1/forum/${id}/like`),
    commentOnForumPost: (id, comment) => api.post(`/api/v1/forum/${id}/reply`, { content: comment }),
    likeForumComment: (postId, commentId) => api.post(`/api/v1/social/forum/${postId}/comments/${commentId}/like`),
    replyToForumComment: (postId, commentId, comment) => api.post(`/api/v1/social/forum/${postId}/comments/${commentId}/reply`, { text: comment }),
    getCommentReplies: (postId, commentId) => api.get(`/api/v1/social/forum/${postId}/comments/${commentId}/replies`),

    // ============ Active Campaigns ============
    getActiveCampaigns: () => api.get('/api/v1/campaigns/active'),

    // ============ Reviews Management ============
    getUserReviews: () => api.get('/api/v1/users/reviews'),
    createProductReview: (productId, reviewData) => api.post(`/api/v1/products/${productId}/reviews`, reviewData),
    deleteReview: (reviewId) => api.delete(`/api/v1/reviews/${reviewId}`),
    updateReview: (reviewId, reviewData) => api.put(`/api/v1/reviews/${reviewId}`, reviewData),

    // ============ Refunds & Returns ============
    createRefundRequest: (orderId, refundData) => api.post(`/api/v1/orders/${orderId}/refund`, refundData),
    getRefunds: () => api.get('/api/v1/users/refunds'),
    getRefundById: (refundId) => api.get(`/api/v1/refunds/${refundId}`),

    // ============ Referrals ============
    getReferrals: () => api.get('/api/v1/users/referrals'),
    getReferralCode: () => api.get('/api/v1/users/referral-code'),

    // ============ Subscriptions ============
    getSubscriptions: () => api.get('/api/v1/users/subscriptions'),
    createSubscription: (subscriptionData) => api.post('/api/v1/subscriptions', subscriptionData),
    cancelSubscription: (subscriptionId) => api.delete(`/api/v1/subscriptions/${subscriptionId}`),

    // ============ Payments ============
    createRazorpayOrder: (paymentData) => {
        const idempotencyKey = Date.now().toString(36) + Math.random().toString(36).substr(2);
        return api.post('/api/v1/payments/razorpay/order', paymentData, { headers: { 'Idempotency-Key': idempotencyKey } });
    },
    verifyRazorpayPayment: (paymentData) => {
        const idempotencyKey = Date.now().toString(36) + Math.random().toString(36).substr(2);
        return api.post('/api/v1/payments/razorpay/verify', paymentData, { headers: { 'Idempotency-Key': idempotencyKey } });
    },

    // ============ Order Tracking ============
    trackOrder: (orderId) => api.get(`/api/v1/orders/${orderId}/track`),
    getDeliveryLocation: (orderId) => api.get(`/api/v1/orders/${orderId}/delivery-location`),

    // ============ Support & Chat ============
    createSupportTicket: (data) => api.post('/api/v1/support/tickets', data),
    getChatMessageHistory: (conversationId) => api.get(`/api/v1/chat/messages/${conversationId}`),
    sendMessage: (data) => api.post('/api/v1/chat/send', data),
    getConversations: () => api.get('/api/v1/chat/conversations'),

    getAuthToken: async () => {
        try {
            const user = auth.currentUser;
            if (user) return await user.getIdToken();
            return await AsyncStorage.getItem('userToken');
        } catch (e) {
            console.error('Error getting auth token', e);
            return null;
        }
    }
};

export default api;
