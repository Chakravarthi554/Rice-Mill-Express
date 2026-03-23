import axios from 'axios';
import { logoutUser } from '../redux/actions/userActions';
import store from '../redux/store';

// ✅ FIXED: Remove /api from base URL since routes already include /api
const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5001',
  timeout: 30000,
  withCredentials: true,
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
          console.log('🔑 Axios: Retrieved token from userInfo');
        } catch (e) {
          console.error('❌ Axios: Failed to parse userInfo from localStorage');
        }
      }
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log(`✅ Axios: Attached token to ${config.method?.toUpperCase()} ${config.url}`);
    } else {
      console.warn(`⚠️ Axios: No token found for ${config.method?.toUpperCase()} ${config.url} - proceeding without auth`);
    }

    return config;
  },
  (error) => {
    console.error('❌ Axios Request Interceptor Error:', error);
    return Promise.reject(error);
  }
);

// 🔥 CRITICAL FIX: Enhanced response interceptor with better error handling
axiosInstance.interceptors.response.use(
  (response) => {
    // Log successful API calls in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ Axios: ${response.config.method?.toUpperCase()} ${response.config.url} - Success`);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    console.error(`❌ Axios: ${originalRequest?.method?.toUpperCase()} ${originalRequest?.url} - Error:`, error.response?.status, error.response?.data);

    // Handle timeout
    if (error.code === 'ECONNABORTED' && !originalRequest._retry) {
      originalRequest._retry = true;
      console.log('⏰ Axios: Retrying request due to timeout...');
      return axiosInstance(originalRequest);
    }

    // Handle 401 - Token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log('🔐 Axios: 401 detected, checking token refresh...');
      
      if (isRefreshing) {
        console.log('🔄 Axios: Token refresh in progress, queuing request...');
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          })
          .catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        console.log('🔄 Axios: Attempting token refresh...');
        
        const refreshTokenValue = localStorage.getItem('refreshToken');
        
        if (!refreshTokenValue) {
          throw new Error('No refresh token available');
        }

        // ✅ FIXED: Use the same base URL without /api
        const refreshResponse = await axios.post(
          `${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/api/auth/refresh-token`, 
          { refreshToken: refreshTokenValue }
        );
        
        const newToken = refreshResponse.data.accessToken;
        const newRefreshToken = refreshResponse.data.refreshToken;
        
        console.log('✅ Axios: Token refresh successful');
        
        // Update default header and localStorage
        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        localStorage.setItem('token', newToken);
        
        if (newRefreshToken) {
          localStorage.setItem('refreshToken', newRefreshToken);
        }
        
        // Update userInfo in localStorage
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
          const parsedUserInfo = JSON.parse(userInfo);
          parsedUserInfo.token = newToken;
          localStorage.setItem('userInfo', JSON.stringify(parsedUserInfo));
        }

        processQueue(null, newToken);
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        
        console.log('🔄 Axios: Retrying original request with new token');
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        console.error('❌ Axios: Token refresh failed:', refreshError);
        processQueue(refreshError, null);
        
        // Clear storage and logout
        console.log('🚪 Axios: Clearing storage and logging out...');
        localStorage.removeItem('userInfo');
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        
        // Dispatch logout action
        store.dispatch(logoutUser());
        
        // Redirect to login
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle 404 - Not Found
    if (error.response?.status === 404) {
      console.error('🚨 Axios: 404 - Endpoint not found:', originalRequest.url);
      // You can add custom 404 handling here
    }

    // Handle 500 - Server Error
    if (error.response?.status === 500) {
      console.error('🚨 Axios: 500 - Internal Server Error');
      // You can add custom 500 handling here
    }

    // Handle network errors
    if (!error.response) {
      console.error('🚨 Axios: Network Error - No response from server');
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
