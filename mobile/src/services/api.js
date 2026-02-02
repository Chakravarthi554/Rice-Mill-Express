import axios from 'axios';
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
            const user = auth.currentUser;
            if (user) {
                const token = await user.getIdToken();
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (error) {
            console.error('Error getting auth token:', error);
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            // Server responded with error status
            console.error('API Error:', error.response.status, error.response.data);
        } else if (error.request) {
            // Request made but no response
            console.error('Network Error:', error.message);
        } else {
            // Something else happened
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
    getAssignedOrders: () => api.get('/api/dp/assigned-orders'),
    getDeliveryOrderById: (id) => api.get(`/api/dp/orders/${id}`),
    updateDeliveryStatus: (orderId, status, location) =>
        api.put(`/api/dp/orders/${orderId}/status`, { status, location }),
    uploadDeliveryPhoto: (orderId, formData) =>
        api.post(`/api/delivery/confirm/${orderId}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }),
    startDelivery: (orderId) => api.post(`/api/dp/orders/${orderId}/start`),
    completeDelivery: (orderId, data) => api.post(`/api/dp/orders/${orderId}/complete`, data),

    // ============ Seller ============
    getSellerOrders: () => api.get('/api/seller/orders'),
    getSellerProducts: () => api.get('/api/seller/products'),
    createProduct: (productData) => api.post('/api/seller/products', productData),
    updateProduct: (id, productData) => api.put(`/api/seller/products/${id}`, productData),
    deleteProduct: (id) => api.delete(`/api/seller/products/${id}`),
    assignDeliveryPartner: (orderId, partnerId) =>
        api.put(`/api/delivery-partners/orders/${orderId}`, { partnerId }),
    getSellerStats: () => api.get('/api/seller/stats'),
    submitKyc: (formData) => api.post('/api/kyc', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }),

    // ============ User Profile ============
    getUserProfile: () => api.get('/api/users/profile'),
    updateUserProfile: (data) => api.put('/api/users/profile', data),

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
