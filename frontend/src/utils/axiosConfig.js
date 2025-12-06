import axios from 'axios';
import { logout } from '../redux/actions/userActions';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  withCredentials: true, // 🔑 allow sending refreshToken cookie
});

// Request interceptor → attach access token
api.interceptors.request.use(
  (config) => {
    const userInfo = localStorage.getItem('userInfo')
      ? JSON.parse(localStorage.getItem('userInfo'))
      : null;

    if (userInfo?.accessToken) {
      config.headers.Authorization = `Bearer ${userInfo.accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor → auto-refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      error.response?.data?.message?.toLowerCase().includes('expired')
    ) {
      originalRequest._retry = true;
      try {
        // 🔄 Ask backend for a new access token (refreshToken is in cookie)
        const { data } = await api.post('/auth/refresh-token');

        // Save new access token
        const userInfo = localStorage.getItem('userInfo')
          ? JSON.parse(localStorage.getItem('userInfo'))
          : {};

        userInfo.accessToken = data.accessToken;
        localStorage.setItem('userInfo', JSON.stringify(userInfo));

        // Update default header for new requests
        api.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`;
        originalRequest.headers['Authorization'] = `Bearer ${data.accessToken}`;

        // Retry original request
        return api(originalRequest);
      } catch (refreshError) {
        console.error('🔴 Refresh token failed, logging out');
        localStorage.removeItem('userInfo');
        logout();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
