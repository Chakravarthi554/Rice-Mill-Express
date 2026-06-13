import axios from 'axios';
import { USER_LOGOUT, USER_LOGIN_SUCCESS } from '../redux/constants/userConstants';
import store from '../redux/store';
import { auth } from '../firebase';
import { updateSocketToken } from './socket';
import { refreshFirebaseToken } from './authUtils';

// ✅ CRITICAL FIX: baseURL must be the server root ONLY.
// Action files already include /api/ in their paths.
// REACT_APP_API_URL may contain /api suffix — strip it here.
const rawBaseURL = process.env.REACT_APP_API_URL || 'http://localhost:5001';
const API_BASE_URL = rawBaseURL.replace(/\/api\/?$/, '');

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => (error ? prom.reject(error) : prom.resolve(token)));
  failedQueue = [];
};

api.interceptors.request.use(
  (config) => {
    const path = config.url || '';
    const isAuthEndpoint =
      path.includes('/auth/login') ||
      path.includes('/auth/register') ||
      path.includes('/auth/logout') ||
      path.includes('/auth/refresh-token') ||
      path.includes('/auth/firebase-login');

    const token = localStorage.getItem('token') || store.getState().userLogin?.userInfo?.token;
    
    // Don't attach token to auth endpoints if we are doing a fresh login or sync
    if (token && !isAuthEndpoint) {
      config.headers.Authorization = `Bearer ${token}`;
      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ API: Attached token to ${config.method?.toUpperCase()} ${config.url}`);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    // Log successful API calls in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ API ${response.config.method?.toUpperCase()} ${response.config.url}:`, response.status);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error?.config || {};
    const status = error?.response?.status;
    const path = originalRequest.url || '';

    // Log API errors
    console.error(`❌ API Error ${status} ${originalRequest.method?.toUpperCase()} ${path}:`, error.response?.data || error.message);

    const isAuthEndpoint =
      path.includes('/auth/login') ||
      path.includes('/auth/register') ||
      path.includes('/auth/logout') ||
      path.includes('/auth/refresh-token') ||
      path.includes('/auth/firebase-login'); // ✅ Added firebase-login

    // Handle 401 Unauthorized (token expired)
    if (status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
            },
            reject,
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      // 1. FIREBASE AUTH REFRESH FLOW
      const storedUser = JSON.parse(localStorage.getItem('userInfo') || '{}');
      const hasFirebase = storedUser?.firebaseUid || store.getState().userLogin?.userInfo?.firebaseUid || (auth && auth.currentUser);

      if (hasFirebase) {
        try {
          console.log('🔄 API: Refreshing token via authUtils...');
          const accessToken = await refreshFirebaseToken();
          
          if (!accessToken) throw new Error('Token refresh returned empty');

          processQueue(null, accessToken);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          console.log('✅ API: Global refresh successful');
          return api(originalRequest);
        } catch (refreshErr) {
          console.error('❌ API: Firebase Token refresh failed:', refreshErr.message);
          store.dispatch({ type: USER_LOGOUT });
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('userInfo');
          processQueue(refreshErr);
          isRefreshing = false;
          
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
          return Promise.reject(refreshErr);
        } finally {
          isRefreshing = false;
        }
      }

      // 2. LEGACY JWT REFRESH FLOW FALLBACK
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        console.error('❌ API: No refresh token available');
        store.dispatch({ type: USER_LOGOUT });
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userInfo');
        processQueue(new Error('No refresh token'));
        isRefreshing = false;
        
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      try {
        console.log('🔄 API: Attempting Legacy JWT token refresh...');
        
        const res = await axios.post(
          `${API_BASE_URL}/api/auth/refresh-token`,
          { refreshToken },
          { 
            withCredentials: true,
            timeout: 10000 
          }
        );

        const { accessToken, refreshToken: newRefreshToken } = res.data;
        localStorage.setItem('token', accessToken);
        if (newRefreshToken) {
          localStorage.setItem('refreshToken', newRefreshToken);
        }

        api.defaults.headers.Authorization = `Bearer ${accessToken}`;
        
        // Update Redux store if needed
        const currentState = store.getState();
        if (currentState.userLogin && currentState.userLogin.userInfo) {
          const updatedUserInfo = { 
            ...currentState.userLogin.userInfo, 
            token: accessToken 
          };
          localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));
          store.dispatch({ 
            type: USER_LOGIN_SUCCESS, 
            payload: updatedUserInfo 
          });
          // Update Socket auth dynamically
          updateSocketToken(accessToken);
        }

        processQueue(null, accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        console.log('✅ API: Legacy Token refresh successful');
        return api(originalRequest);
      } catch (refreshErr) {
        console.error('❌ API: Legacy Token refresh failed:', refreshErr.response?.data || refreshErr.message);
        store.dispatch({ type: USER_LOGOUT });
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userInfo');
        processQueue(refreshErr);
        isRefreshing = false;
        
        // Only redirect if not already on login page
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle 404 Not Found gracefully
    if (status === 404) {
      console.warn(`⚠️ API: Endpoint not found - ${originalRequest.method?.toUpperCase()} ${path}`);
      // Return a structured error that components can handle
      return Promise.reject({
        ...error,
        isEndpointNotFound: true,
        message: `API endpoint not found: ${path}`
      });
    }

    // Handle 500 Internal Server Error
    if (status === 500) {
      console.error('❌ API: Server error -', error.response?.data || 'Internal server error');
      return Promise.reject({
        ...error,
        isServerError: true,
        message: 'Server error. Please try again later.'
      });
    }

    // Handle network errors
    if (!error.response) {
      console.error('❌ API: Network error -', error.message);
      return Promise.reject({
        ...error,
        isNetworkError: true,
        message: 'Network error. Please check your connection.'
      });
    }

    return Promise.reject(error);
  }
);

// Helper function to check if API is reachable
export const checkAPIHealth = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/health`, { timeout: 5000 });
    return { 
      success: true, 
      data: response.data,
      status: response.status 
    };
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      status: error.response?.status 
    };
  }
};

export default api;
