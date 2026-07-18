import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';

import api from '../utils/api';
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
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import i18n from '../i18n';

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
  const [language, setLanguage] = useState(() => localStorage.getItem('rice-mill-language') || 'english');
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

      // Toggle dark-mode / light-mode classes on documentElement for theme.css variables
      if (actualTheme === 'dark') {
        root.classList.add('dark-mode');
        root.classList.remove('light-mode');
      } else {
        root.classList.add('light-mode');
        root.classList.remove('dark-mode');
      }
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
    async (redirect = true) => {
      console.log('🚪 AuthContext: Logging out...');

      // Sign out from Firebase first
      try {
        await auth.signOut();
        console.log('✅ AuthContext: Firebase sign-out successful');
      } catch (error) {
        console.error('❌ AuthContext: Firebase sign-out error:', error);
      }

      // Clear local storage and state
      localStorage.removeItem('userInfo');
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('pendingSocialActions');
      document.cookie = `refreshToken=; Max-Age=0; path=/; domain=${window.location.hostname};`;
      disconnectSocket();
      delete api.defaults.headers.common['Authorization'];
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

      const response = await api.post('/api/v1/auth/refresh-token', { refreshToken: refreshTokenValue });

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
      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

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

  // ✅ Dynamic background user profile synchronization from MongoDB
  const syncProfileInBackground = useCallback(async (firebaseUser, signal) => {
    try {
      console.log('🔄 AuthContext: Background syncing profile for UID:', firebaseUser.uid);
      const idToken = await firebaseUser.getIdToken(true);
      const response = await api.post('/api/v1/auth/firebase-login', { idToken }, { signal });
      console.log('📦 AuthContext: Background sync successful');

      const userData = {
        ...response.data,
        uid: firebaseUser.uid,
        token: idToken
      };

      const storedUser = localStorage.getItem('userInfo');
      let mergedUser = userData;
      let hasChanges = true;

      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          
          mergedUser = {
            profileImage: parsed.profileImage || userData.profileImage || '/uploads/default_avatar.jpg',
            preferences: {
              ...(parsed.preferences || {}),
              ...(userData.preferences || {})
            },
            businessDetails: {
              ...(parsed.businessDetails || {}),
              ...(userData.businessDetails || {})
            },
            ...userData,
            _id: userData._id || parsed._id,
            role: userData.role,
            kycStatus: userData.kycStatus,
            isVerified: userData.isVerified !== undefined ? userData.isVerified : parsed.isVerified,
            email: userData.email || parsed.email,
            phone: userData.phone || parsed.phone,
            token: userData.token || parsed.token,
            uid: userData.uid || parsed.uid,
          };

          hasChanges =
            parsed.role !== mergedUser.role ||
            parsed.email !== mergedUser.email ||
            parsed.kycStatus !== mergedUser.kycStatus ||
            parsed.isVerified !== mergedUser.isVerified ||
            parsed._id !== mergedUser._id ||
            parsed.token !== mergedUser.token ||
            parsed.profileImage !== mergedUser.profileImage ||
            JSON.stringify(parsed.preferences) !== JSON.stringify(mergedUser.preferences) ||
            JSON.stringify(parsed.businessDetails) !== JSON.stringify(mergedUser.businessDetails);
            
        } catch (e) {
          console.warn('⚠️ AuthContext: Failed to parse stored user during background sync merge');
        }
      }

      if (hasChanges) {
        console.log(`📝 AuthContext: Background sync detected changed profile data. Updating state...`);
        localStorage.setItem('userInfo', JSON.stringify(mergedUser));
        localStorage.setItem('token', mergedUser.token);
        dispatch({ type: USER_LOGIN_SUCCESS, payload: mergedUser });
        updateUser(mergedUser);
      } else {
        console.log('✅ AuthContext: Background sync complete, no changes.');
      }
    } catch (err) {
      if (axios.isCancel(err)) {
        console.log('⏩ AuthContext: Background sync cancelled');
      } else {
        console.error('⚠️ AuthContext: Background sync failed (non-critical):', err.message);
      }
    }
  }, [dispatch, updateUser]);

  // ✅ Track which UID we're currently fetching to prevent infinite loops
  const fetchingUidRef = React.useRef(null);

  // ✅ Firebase Auth State Listener
  useEffect(() => {
    let active = true;
    const abortController = new AbortController();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('🔥 AuthContext: Firebase Auth State Changed:', firebaseUser?.uid);

      try {
        if (firebaseUser) {
          // ✅ ROBUST GUARD: Prevent multiple fetches for the same UID
          if (fetchingUidRef.current === firebaseUser.uid) {
            console.log('⏩ AuthContext: Already fetching profile for UID:', firebaseUser.uid);
            setLoading(false);
            return;
          }

          const isAuthPath = window.location.pathname === '/login' || window.location.pathname === '/register' || window.location.pathname === '/';

          // Check if we already have this user loaded
          const storedUser = localStorage.getItem('userInfo');
          if (storedUser) {
            try {
              const parsed = JSON.parse(storedUser);
              if (parsed.uid === firebaseUser.uid && parsed.token) {
                // If we are on a public auth path, we CANNOT trust the cache immediately!
                // We must verify the role with the backend first before setting loading to false or redirecting.
                if (isAuthPath) {
                  console.log('🏁 AuthContext: Stale cache check bypassed because user is on auth path. Forcing full backend sync...');
                } else {
                  console.log('⏩ AuthContext: User profile found in localStorage for UID:', firebaseUser.uid);
                  if (active) {
                    dispatch({ type: USER_LOGIN_SUCCESS, payload: parsed });
                    updateUser(parsed);
                    setLoading(false);
                    // Trigger background verification of metadata
                    syncProfileInBackground(firebaseUser, abortController.signal);
                  }
                  return;
                }
              }
            } catch (e) {
              console.warn('⚠️ AuthContext: Failed to parse stored user, will fetch fresh');
            }
          }

          // Mark this UID as being fetched
          fetchingUidRef.current = firebaseUser.uid;
          setLoading(true);

          try {
            console.log('🔄 AuthContext: Fetching profile for UID:', firebaseUser.uid);
            const idToken = await firebaseUser.getIdToken(true);

            const response = await api.post('/api/v1/auth/firebase-login', { idToken }, { signal: abortController.signal });
            console.log('📦 AuthContext: Sync successful');

            const userData = {
              ...response.data,
              uid: firebaseUser.uid,
              token: idToken
            };

            const storedUser = localStorage.getItem('userInfo');
            let mergedUser = userData;
            if (storedUser) {
              try {
                const parsed = JSON.parse(storedUser);
                if (parsed.uid === firebaseUser.uid) {
                  mergedUser = {
                    profileImage: parsed.profileImage || userData.profileImage || '/uploads/default_avatar.jpg',
                    preferences: {
                      ...(parsed.preferences || {}),
                      ...(userData.preferences || {})
                    },
                    businessDetails: {
                      ...(parsed.businessDetails || {}),
                      ...(userData.businessDetails || {})
                    },
                    ...userData,
                    _id: userData._id || parsed._id,
                    role: userData.role,
                    kycStatus: userData.kycStatus,
                    isVerified: userData.isVerified !== undefined ? userData.isVerified : parsed.isVerified,
                    email: userData.email || parsed.email,
                    phone: userData.phone || parsed.phone,
                    token: userData.token || parsed.token,
                    uid: userData.uid || parsed.uid,
                  };
                }
              } catch (e) {
                console.warn('⚠️ AuthContext: Failed to parse stored user during auth sync merge');
              }
            }

            if (active) {
              localStorage.setItem('userInfo', JSON.stringify(mergedUser));
              localStorage.setItem('token', mergedUser.token);
              dispatch({ type: USER_LOGIN_SUCCESS, payload: mergedUser });
              updateUser(mergedUser);
            }
          } catch (syncError) {
            if (axios.isCancel(syncError)) {
              console.log('⏩ AuthContext: Sync request aborted');
              return;
            }

            console.error('❌ AuthContext: Sync failed:', syncError.message);
            const errMsg = syncError.response?.data?.message || syncError.message || 'Login synchronization failed';

            // Try to fall back to cached data ONLY if UID matches
            let mergedUser = null;
            const cachedRaw = localStorage.getItem('userInfo');
            if (cachedRaw) {
              try {
                const cached = JSON.parse(cachedRaw);
                if (cached.uid === firebaseUser.uid) {
                  const freshToken = await firebaseUser.getIdToken().catch(() => cached.token);
                  mergedUser = { ...cached, token: freshToken };
                }
              } catch (_e) { }
            }

            if (mergedUser && active) {
              console.log('🔄 AuthContext: Sync failed, falling back to cached user details');
              if (mergedUser.token) localStorage.setItem('token', mergedUser.token);
              localStorage.setItem('userInfo', JSON.stringify(mergedUser));
              dispatch({ type: USER_LOGIN_SUCCESS, payload: mergedUser });
              updateUser(mergedUser);
            } else {
              // No cached user or mismatch. STRICT ENFORCEMENT: Reject fallback, logout
              console.error('🛑 AuthContext: Authentication sync failed and no valid cached profile found. Rejecting session.');
              setMessage(errMsg);
              if (active) {
                logout(true);
              }
            }
          } finally {
            if (active) {
              fetchingUidRef.current = null;
              setLoading(false);
            }
          }
        } else {
          console.log('❌ AuthContext: No Firebase user');
          if (active) {
            setUser(null);
            fetchingUidRef.current = null;
            const storedUser = localStorage.getItem('userInfo');
            if (storedUser) {
              dispatch({ type: USER_LOGOUT });
            }
            localStorage.removeItem('userInfo');
            localStorage.removeItem('token');
          }
        }
      } catch (globalError) {
        console.error('❌ AuthContext Global Error:', globalError);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    });

    return () => {
      active = false;
      abortController.abort();
      console.log('🧹 AuthContext: Cleaned up onAuthStateChanged listener and aborted in-flight syncs');
      unsubscribe();
    };
  }, [dispatch, updateUser, syncProfileInBackground, logout]);

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

  // Keep local user state synchronized when Redux userInfo updates
  useEffect(() => {
    if (userInfo) {
      updateUser(userInfo);
    }
  }, [userInfo, updateUser]);

  // Bridge i18n localization and synchronise language changes globally
  useEffect(() => {
    if (language) {
      i18n.changeLanguage(language);
      localStorage.setItem('rice-mill-language', language);
    }
  }, [language]);


  // ✅ CONSOLIDATED REDIRECTION LOGIC
  useEffect(() => {
    const isAuthPath = location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/';

    // PRIORITIZE Local State over Redux for redirection to prevent race conditions during registration
    const currentUser = user || userInfo;

    if (!loading && currentUser?.token && isAuthPath) {
      console.log('🏁 AuthContext: Redirection checking for user:', currentUser.email, 'Role:', currentUser.role);

      const getSafeRedirectPath = () => {
        // High priority: Email Verification
        if (!currentUser.emailVerified && currentUser.requiresVerification) {
          console.log('⚠️ AuthContext: Email verification required');
          return '/verify-email-notice';
        }

        // Role-based routing
        const role = currentUser.role;
        switch (role) {
          case 'admin': return '/admin/dashboard';
          case 'seller':
            return currentUser.kycStatus === 'approved' ? '/seller/dashboard' : '/seller/kyc';
          case 'customer': return '/customer/dashboard';
          case 'deliveryPartner':
            console.warn('🛑 Delivery Partner attempted desktop login');
            setTimeout(() => {
              logout(true);
              setMessage('Delivery Partners must use the mobile application.');
            }, 100);
            return '/login';
          default:
            console.log('ℹ️ AuthContext: No specific role path, defaulting to customer dashboard');
            return '/customer/dashboard';
        }
      };

      const targetPath = getSafeRedirectPath();

      // Prevent redundant navigation to the same path
      if (location.pathname !== targetPath) {
        console.log('🔀 AuthContext: 🚀 Navigating from', location.pathname, 'to', targetPath);
        navigate(targetPath, { replace: true });
      }
    }
  }, [loading, user, userInfo, navigate, location.pathname, logout]);

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
    let firebaseUser = null;
    
    try {
      // 1. Create user in Firebase FIRST
      const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');
      const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
      firebaseUser = userCredential.user;

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
      const { data } = await api.post('/api/v1/auth/register', registrationData);

      if (data) {
        const idToken = await firebaseUser.getIdToken();
        localStorage.setItem('token', idToken);
        localStorage.setItem('refreshToken', firebaseUser.refreshToken);

        // Fetch full profile (bridging MongoDB roles)
        const { data: profileData } = await api.get('/api/v1/users/profile', {
          headers: { Authorization: `Bearer ${idToken}` },
        });

        const fullUserData = { ...profileData, token: idToken };
        localStorage.setItem('userInfo', JSON.stringify(fullUserData));

        dispatch({ type: USER_LOGIN_SUCCESS, payload: fullUserData });
        updateUser(fullUserData);
        getSocket(fullUserData._id, fullUserData.role, idToken);
        api.defaults.headers.common['Authorization'] = `Bearer ${idToken}`;

        // ✅ UX: Show success message before any redirect
        window.alert('✅ Registration successful! Welcome to Rice-Express.');
        setMessage('Registration successful! Welcome to Rice-Express.');
        return { success: true };
      } else {
        // MongoDB registration returned success: false
        if (firebaseUser) await firebaseUser.delete();

        const msg = data.message || 'Registration failed at profile sync';
        dispatch({ type: USER_REGISTER_FAIL, payload: msg });
        return { success: false, message: msg };
      }
    } catch (error) {
      console.error('Registration Error:', error);

      // Handle specific Firebase errors
      let errMsg = error.message || 'Registration failed';

      if (error.code === 'auth/email-already-in-use') {
        errMsg = 'This email is already registered. Please login instead or use a different email.';
      } else if (error.code === 'auth/weak-password') {
        errMsg = 'Password is too weak. Please use at least 8 characters.';
      } else if (error.code === 'auth/invalid-email') {
        errMsg = 'Invalid email address format.';
      } else if (error.response?.data?.message) {
        // Backend API error (like "Mobile number is already registered")
        errMsg = error.response.data.message;
        
        // Clean up orphaned Firebase user if backend registration failed
        if (firebaseUser) {
          try {
            await firebaseUser.delete();
            console.log('🧹 Cleaned up Firebase user because MongoDB registration failed');
          } catch (delErr) {
            console.error('Failed to cleanup Firebase user', delErr);
          }
        }
      }

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
