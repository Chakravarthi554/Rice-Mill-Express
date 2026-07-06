import axios from 'axios';
import store from '../redux/store';

// ✅ CRITICAL FIX: Strip /api from baseURL since all routes already include /api/
const rawBase = process.env.REACT_APP_API_URL || 'http://localhost:5001';
const BASE_URL = rawBase.replace(/\/api\/?$/, '');

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  withCredentials: true,
  xsrfCookieName: '_csrf',
  xsrfHeaderName: 'X-CSRF-Token',
});

// === ENHANCED TOKEN HANDLING ===
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    error ? prom.reject(error) : prom.resolve(token);
  });
  failedQueue = [];
};

// 🔥 CRITICAL FIX: Enhanced request interceptor with detailed logging
axiosInstance.interceptors.request.use(
  (config) => {
    // Get token from multiple possible sources
    let token = localStorage.getItem('token');
    
    if (!token) {
      const userInfo = localStorage.getItem('userInfo');
      if (userInfo) {
        try {
          const parsedUserInfo = JSON.parse(userInfo);
          token = parsedUserInfo.token;
        } catch (e) {
          console.error('❌ Axios: Failed to parse userInfo from localStorage');
        }
      }
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log(`✅ Axios: Attached token to ${config.method?.toUpperCase()} ${config.url}`);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// 🔥 CRITICAL FIX: Enhanced response interceptor with Firebase support
axiosInstance.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ Axios Success: ${response.config.method?.toUpperCase()} ${response.config.url}`);
    }

    // ✅ AUTO-UNWRAP RESPONSE ENVELOPE
    // Backend wraps all responses in { success, data, message }.
    // Unwrap so callers get the actual payload directly.
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
    const originalRequest = error?.config || {};
    const status = error?.response?.status;
    const path = originalRequest.url || '';

    console.error(`❌ Axios Error ${status} ${originalRequest.method?.toUpperCase()} ${path}`);

    const isAuthEndpoint =
      path.includes('/auth/login') ||
      path.includes('/auth/register') ||
      path.includes('/auth/logout') ||
      path.includes('/auth/refresh-token') ||
      path.includes('/auth/firebase-login');

    // Handle 401 - Token refresh
    if (status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      // 1. FIREBASE AUTH REFRESH FLOW
      const { auth } = await import('../firebase');
      if (auth && auth.currentUser) {
        try {
          console.log('🔄 Axios: Attempting Native Firebase token refresh...');
          const accessToken = await auth.currentUser.getIdToken(true);
          
          localStorage.setItem('token', accessToken);
          axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

          const currentState = store.getState();
          const currentToken = currentState.userLogin?.userInfo?.token;

          if (currentState.userLogin && currentState.userLogin.userInfo && currentToken !== accessToken) {
            const updatedUserInfo = { 
              ...currentState.userLogin.userInfo, 
              token: accessToken 
            };
            localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));
            store.dispatch({ type: 'USER_LOGIN_SUCCESS', payload: updatedUserInfo });
          }

          processQueue(null, accessToken);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return axiosInstance(originalRequest);
        } catch (refreshErr) {
          console.error('❌ Axios: Firebase refresh failed');
          isRefreshing = false;
        }
      }

      // 2. LEGACY JWT REFRESH FLOW FALLBACK
      try {
        console.log('🔄 Axios: Attempting Legacy JWT token refresh...');
        const refreshTokenValue = localStorage.getItem('refreshToken');
        if (!refreshTokenValue) throw new Error('No refresh token');

        const { data: refreshData } = await axios.post(
          `${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/api/auth/refresh-token`, 
          { refreshToken: refreshTokenValue }
        );
        
        const newToken = refreshData.accessToken;
        
        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        localStorage.setItem('token', newToken);
        
        processQueue(null, newToken);
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        console.error('❌ Axios: Token refresh failed:', refreshError.message);
        processQueue(refreshError, null);
        localStorage.removeItem('userInfo');
        localStorage.removeItem('token');
        delete axiosInstance.defaults.headers.common['Authorization'];
        try {
          const { disconnectSocket } = require('./socket');
          disconnectSocket();
        } catch (socketErr) {
          console.error('Failed to disconnect socket:', socketErr.message);
        }
        store.dispatch({ type: 'USER_LOGOUT' });
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ✅ ADD: Helper method for API calls with better error handling
export const apiCall = async (method, url, data = null, config = {}) => {
  try {
    const response = await axiosInstance({
      method,
      url,
      data,
      ...config
    });
    return response.data;
  } catch (error) {
    // Enhanced error handling
    const errorMessage = error.response?.data?.message || 
                        error.message || 
                        'An unexpected error occurred';
    
    console.error(`API Call Error (${method} ${url}):`, errorMessage);
    throw new Error(errorMessage);
  }
};

// ✅ ADD: Convenience methods
export const apiGet = (url, config = {}) => apiCall('GET', url, null, config);
export const apiPost = (url, data, config = {}) => apiCall('POST', url, data, config);
export const apiPut = (url, data, config = {}) => apiCall('PUT', url, data, config);
export const apiDelete = (url, config = {}) => apiCall('DELETE', url, null, config);
export const apiPatch = (url, data, config = {}) => apiCall('PATCH', url, data, config);

export default axiosInstance;
