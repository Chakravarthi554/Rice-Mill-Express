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
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

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

  // ✅ Firebase Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('🔥 AuthContext: Firebase Auth State Changed:', firebaseUser?.uid);

      if (firebaseUser) {
        // Only fetch profile if we don't have user data yet
        if (!user && !userInfo) {
          try {
            console.log('🔄 AuthContext: Fetching profile for UID:', firebaseUser.uid);

            // Get Firebase ID token
            const idToken = await firebaseUser.getIdToken();
            const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

            // ✅ Use unified Firebase login endpoint
            const response = await axios.post(`${API_BASE_URL}/api/auth/firebase-login`, { idToken });
            const profile = response.data;

            const userData = {
              ...profile,
              uid: firebaseUser.uid,
              emailVerified: firebaseUser.emailVerified,
              token: idToken
            };

            // ✅ Check email verification for sellers/customers
            if (['seller', 'customer'].includes(userData.role) && firebaseUser.email && !firebaseUser.emailVerified) {
              console.log(`🚫 AuthContext: ${userData.role} email not verified in Firebase`);
              userData.requiresVerification = true;
            }

            localStorage.setItem('userInfo', JSON.stringify(userData));
            localStorage.setItem('token', userData.token);
            axios.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;

            dispatch({ type: USER_LOGIN_SUCCESS, payload: userData });
            updateUser(userData);

            console.log('✅ AuthContext: Profile loaded successfully, Role:', userData.role);
          } catch (error) {
            console.error('❌ AuthContext: Error fetching profile:', error.message);

            // If user not found in MongoDB, they need to complete registration
            if (error.response?.status === 404) {
              console.log('⚠️ AuthContext: User not found in MongoDB, may need to register');
              // Don't logout, let them complete registration
            }
          }
        }
      } else {
        console.log('❌ AuthContext: No Firebase user found');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [dispatch, updateUser, user, userInfo]);

  // Handle Redirection Persistence
  useEffect(() => {
    const storedUserInfo = localStorage.getItem('userInfo');
    if (storedUserInfo && !user && !userInfo) {
      try {
        const parsed = JSON.parse(storedUserInfo);
        dispatch({ type: USER_LOGIN_SUCCESS, payload: parsed });
        updateUser(parsed);
      } catch (e) { }
    }
  }, [dispatch, updateUser, user, userInfo]);

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
    const isAuthPath = location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/';
    if (!loading && userInfo && isAuthPath) {
      const redirectPath = () => {
        if (userInfo.role === 'admin') return '/admin/dashboard';
        if (userInfo.role === 'customer') return '/customer/dashboard';
        if (userInfo.role === 'deliveryPartner') return '/delivery/dashboard';

        // Mandatory email verification check for Sellers/Customers
        if (!userInfo.emailVerified && userInfo.requiresVerification) {
          return '/verify-email-notice';
        }

        if (userInfo.role === 'seller') {
          return userInfo.kycStatus === 'approved'
            ? '/seller/dashboard'
            : '/seller/kyc';
        }
        return '/customer/dashboard';
      };

      const path = redirectPath();
      console.log('🔀 AuthContext: Redirecting to:', path);
      navigate(path, { replace: true });
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
      // 1. Create user in Firebase FIRST
      const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');
      const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
      const firebaseUser = userCredential.user;

      // Update Firebase display name
      await updateProfile(firebaseUser, { displayName: userData.name });

      // ✅ Send Verification Email automatically
      const { sendEmailVerification } = await import('firebase/auth');
      await sendEmailVerification(firebaseUser);
      console.log('📧 AuthContext: Verification email sent to:', userData.email);

      const registrationData = {
        ...userData,
        firebaseUid: firebaseUser.uid,
        kycStatus: userData.role === 'seller' ? 'not_submitted' : 'not_required',
        phone: userData.phone || '',
      };

      // 2. Sync with MongoDB
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const { data } = await axios.post(`${API_BASE_URL}/api/auth/register`, registrationData);

      if (data.success) {
        const idToken = await firebaseUser.getIdToken();
        localStorage.setItem('token', idToken);
        localStorage.setItem('refreshToken', firebaseUser.refreshToken);

        // Fetch full profile (bridging MongoDB roles)
        const { data: profileData } = await axios.get(`${API_BASE_URL}/api/users/profile`, {
          headers: { Authorization: `Bearer ${idToken}` },
        });

        const fullUserData = { ...profileData, token: idToken };
        localStorage.setItem('userInfo', JSON.stringify(fullUserData));

        dispatch({ type: USER_LOGIN_SUCCESS, payload: fullUserData });
        updateUser(fullUserData);
        getSocket(fullUserData._id, fullUserData.role, idToken);
        axios.defaults.headers.common['Authorization'] = `Bearer ${idToken}`;

        // ✅ UX: Show success message before any redirect
        window.alert('✅ Registration successful! Welcome to Rice-Express.');
        setMessage('Registration successful! Welcome to Rice-Express.');
        return { success: true };
      } else {
        const msg = data.message || 'Registration failed at profile sync';
        dispatch({ type: USER_REGISTER_FAIL, payload: msg });
        return { success: false, message: msg };
      }
    } catch (error) {
      console.error('Registration Error:', error);
      const errMsg = error.response?.data?.message || error.message || 'Registration failed';
      dispatch({ type: USER_REGISTER_FAIL, payload: errMsg });
      setMessage(errMsg);
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