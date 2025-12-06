import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import {
  USER_LOGIN_REQUEST,
  USER_LOGIN_SUCCESS,
  USER_LOGIN_FAIL,
  USER_REGISTER_REQUEST,
  USER_REGISTER_FAIL,
  USER_LOGOUT,
} from '../redux/constants/userConstants';
import { getSocket, disconnectSocket } from '../utils/socket';
import { translations } from '../utils/constants';
import { loginUser } from '../redux/actions/userActions';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [tokenRefreshing, setTokenRefreshing] = useState(false);
  const [language, setLanguage] = useState('english');
  const [theme, setTheme] = useState('system');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const userLogin = useSelector((state) => state.userLogin || {});
  const { userInfo, loading: authLoading, error: loginError } = userLogin;
  const [user, setUser] = useState(null);

  const updateUser = useCallback((userData) => {
    setUser(userData);
  }, []);

  useEffect(() => {
    if (userInfo?.preferences) {
      if (userInfo.preferences.language) setLanguage(userInfo.preferences.language);
      if (userInfo.preferences.theme) setTheme(userInfo.preferences.theme);
    }
  }, [userInfo]);

  useEffect(() => {
    const applyTheme = () => {
      const root = document.documentElement;
      const actualTheme =
        theme === 'system'
          ? window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light'
          : theme;
      root.setAttribute('data-theme', actualTheme);
      document.body.className = actualTheme === 'dark' ? 'dark-theme' : 'light-theme';
    };
    applyTheme();
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => applyTheme();
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const t = (key) =>
    translations[language]?.[key] ||
    translations.english[key] ||
    key;

  const logout = useCallback(
    (redirect = true) => {
      console.log('🚪 AuthContext: Logging out...');
      localStorage.removeItem('userInfo');
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('pendingSocialActions');
      document.cookie = 'refreshToken=; Max-Age=0; path=/; domain=localhost;';
      disconnectSocket();
      delete axios.defaults.headers.common['Authorization'];
      dispatch({ type: USER_LOGOUT });
      updateUser(null);
      setMessage('Logged out successfully!');
      if (redirect) navigate('/login', { replace: true });
    },
    [dispatch, navigate, updateUser]
  );

  // ✅ FIXED: Enhanced token refresh with proper error handling
  const refreshToken = useCallback(async () => {
    if (tokenRefreshing) {
      console.log('🔄 Token refresh already in progress...');
      return null;
    }
    
    setTokenRefreshing(true);
    console.log('🔄 AuthContext: Starting token refresh...');
    
    try {
      const refreshTokenValue = localStorage.getItem('refreshToken');
      
      if (!refreshTokenValue) {
        console.error('❌ AuthContext: No refresh token found');
        logout(false);
        return null;
      }

      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const response = await axios.post(
        `${API_BASE_URL}/api/auth/refresh-token`, 
        { refreshToken: refreshTokenValue }
      );
      
      const { accessToken, refreshToken: newRefreshToken, user: userData } = response.data;
      console.log('✅ AuthContext: Token refresh successful');

      // Update localStorage
      localStorage.setItem('token', accessToken);
      if (newRefreshToken) {
        localStorage.setItem('refreshToken', newRefreshToken);
      }
      
      // Update userInfo with new token and user data
      const updatedUserInfo = { 
        ...userData, 
        token: accessToken 
      };
      localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));
      
      // Update axios headers
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      
      // Update state
      dispatch({ type: USER_LOGIN_SUCCESS, payload: updatedUserInfo });
      updateUser(updatedUserInfo);

      // Reconnect socket with new token
      getSocket(updatedUserInfo._id, updatedUserInfo.role, accessToken);

      return accessToken;
    } catch (error) {
      console.error('❌ AuthContext: Token refresh failed:', error.response?.data || error.message);
      
      // If refresh token is invalid, logout user
      if (error.response?.status === 401 || error.response?.status === 400) {
        console.log('🔐 AuthContext: Refresh token invalid, logging out...');
        logout(false);
      }
      
      return null;
    } finally {
      setTokenRefreshing(false);
    }
  }, [dispatch, logout, tokenRefreshing, updateUser]);

  // ✅ FIXED: Enhanced initialization with better error handling
  useEffect(() => {
    let isMounted = true;
    
    const initialize = async () => {
      console.log('🔐 AuthContext: Initializing authentication...');
      
      const storedUserInfo = localStorage.getItem('userInfo');
      const storedToken = localStorage.getItem('token');
      const storedRefreshToken = localStorage.getItem('refreshToken');
      
      let userFromStorage = null;
      
      if (storedUserInfo) {
        try {
          userFromStorage = JSON.parse(storedUserInfo);
          console.log('📁 AuthContext: Found user in storage:', userFromStorage._id);
        } catch (e) {
          console.error('❌ AuthContext: Failed to parse stored user info');
          localStorage.clear();
        }
      }

      if (userFromStorage && storedToken) {
        console.log('✅ AuthContext: Restoring user session...');
        
        // Set axios header
        axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        
        // Verify token is still valid by making a test request
        try {
          const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
          await axios.get(`${API_BASE_URL}/api/users/profile`, { 
            headers: { Authorization: `Bearer ${storedToken}` },
            timeout: 5000
          });
          
          // Token is valid, restore session
          dispatch({ type: USER_LOGIN_SUCCESS, payload: userFromStorage });
          updateUser(userFromStorage);
          getSocket(userFromStorage._id, userFromStorage.role, storedToken);
          
          console.log('✅ AuthContext: Session restored successfully');
        } catch (error) {
          console.log('🔄 AuthContext: Token validation failed, attempting refresh...');
          
          // If we have a refresh token, try to refresh
          if (storedRefreshToken) {
            const newToken = await refreshToken();
            if (!newToken) {
              console.log('❌ AuthContext: Token refresh failed, clearing session');
              localStorage.removeItem('userInfo');
              localStorage.removeItem('token');
              localStorage.removeItem('refreshToken');
              updateUser(null);
            }
          } else {
            console.log('❌ AuthContext: No refresh token available, clearing session');
            localStorage.removeItem('userInfo');
            localStorage.removeItem('token');
            updateUser(null);
          }
        }
      } else {
        console.log('❌ AuthContext: No valid session found');
        localStorage.removeItem('userInfo');
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        updateUser(null);
      }
      
      if (isMounted) {
        setLoading(false);
        console.log('✅ AuthContext: Initialization complete');
      }
    };

    initialize();
    
    return () => { 
      isMounted = false; 
    };
  }, [dispatch, refreshToken, updateUser]);

  // Response interceptor for token refresh
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && !originalRequest._retry) {
          console.log('🔐 AuthContext: 401 detected in interceptor, refreshing token...');
          originalRequest._retry = true;
          const newToken = await refreshToken();
          if (newToken) {
            originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
            return axios(originalRequest);
          } else {
            // Refresh failed, logout user
            logout(false);
            return Promise.reject(error);
          }
        }
        
        // Handle 404 errors for missing endpoints gracefully
        if (error.response?.status === 404) {
          console.warn('⚠️ API endpoint not found:', originalRequest.url);
          // Don't throw for 404s, let components handle them
        }
        
        return Promise.reject(error);
      }
    );
    
    return () => axios.interceptors.response.eject(interceptor);
  }, [refreshToken, logout]);

  // Redirect logic
  useEffect(() => {
    if (!loading && userInfo && location.pathname === '/login') {
      const redirectPath = () => {
        if (userInfo.role === 'admin') return '/admin/dashboard';
        if (userInfo.role === 'customer') return '/customer/dashboard';
        if (userInfo.role === 'seller') {
          return userInfo.kycStatus === 'approved'
            ? '/seller/dashboard'
            : '/seller/kyc';
        }
        return '/';
      };
      
      navigate(redirectPath(), { replace: true });
    }
  }, [loading, userInfo, navigate, location.pathname]);

  const login = async (email, password) => {
    dispatch({ type: USER_LOGIN_REQUEST });
    try {
      await dispatch(loginUser(email, password));
      if (loginError) {
        setMessage(loginError);
        return { success: false, message: loginError };
      }
      setMessage('Successfully logged in!');
      return { success: true };
    } catch (error) {
      const errMsg = error.response?.data?.message || error.message || 'Login failed';
      dispatch({ type: USER_LOGIN_FAIL, payload: errMsg });
      setMessage(errMsg);
      return { success: false, message: errMsg };
    }
  };

  const register = async (userData) => {
    dispatch({ type: USER_REGISTER_REQUEST });
    try {
      const registrationData = {
        ...userData,
        kycStatus: userData.role === 'seller' ? 'not_submitted' : 'not_required',
        phone: userData.phone || '',
      };
      
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const { data } = await axios.post(`${API_BASE_URL}/api/auth/register`, registrationData);
      
      if (data.success) {
        localStorage.setItem('token', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        
        const { data: profileData } = await axios.get(`${API_BASE_URL}/api/users/profile`, {
          headers: { Authorization: `Bearer ${data.accessToken}` },
        });
        
        const fullUserData = { ...profileData, token: data.accessToken };
        localStorage.setItem('userInfo', JSON.stringify(fullUserData));
        dispatch({ type: USER_LOGIN_SUCCESS, payload: fullUserData });
        updateUser(fullUserData);
        getSocket(fullUserData._id, fullUserData.role, data.accessToken);
        axios.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`;
        return { success: true };
      } else {
        const msg = data.message || 'Registration failed';
        dispatch({ type: USER_REGISTER_FAIL, payload: msg });
        return { success: false, message: msg };
      }
    } catch (error) {
      const errMsg = error.response?.data?.message || error.message;
      dispatch({ type: USER_REGISTER_FAIL, payload: errMsg });
      return { success: false, message: errMsg };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user: user || userInfo,
        loading: loading || authLoading,
        login,
        register,
        logout,
        isAuthenticated: !!(user || userInfo),
        message,
        setMessage,
        refreshToken,
        language,
        setLanguage,
        theme,
        setTheme,
        t,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };