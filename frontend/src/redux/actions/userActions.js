import axios from 'axios';
import {
  USER_LOGIN_REQUEST,
  USER_LOGIN_SUCCESS,
  USER_LOGIN_FAIL,
  USER_LOGOUT,
  USER_REGISTER_REQUEST,
  USER_REGISTER_SUCCESS,
  USER_REGISTER_FAIL,
  USER_DETAILS_REQUEST,
  USER_DETAILS_SUCCESS,
  USER_DETAILS_FAIL,
  USER_UPDATE_PROFILE_REQUEST,
  USER_UPDATE_PROFILE_SUCCESS,
  USER_UPDATE_PROFILE_FAIL,
  USER_CHANGE_PASSWORD_REQUEST,
  USER_CHANGE_PASSWORD_SUCCESS,
  USER_CHANGE_PASSWORD_FAIL,
  USER_LIST_REQUEST,
  USER_LIST_SUCCESS,
  USER_LIST_FAIL,
  USER_DELETE_REQUEST,
  USER_DELETE_SUCCESS,
  USER_DELETE_FAIL,
  USER_UPDATE_REQUEST,
  USER_UPDATE_SUCCESS,
  USER_UPDATE_FAIL,
  USER_WISHLIST_ADD_ITEM,
  USER_WISHLIST_REQUEST,
  USER_WISHLIST_SUCCESS,
  USER_WISHLIST_FAIL,
  USER_WISHLIST_REMOVE_ITEM,
  CREATE_DELIVERY_PARTNER_REQUEST,
  CREATE_DELIVERY_PARTNER_SUCCESS,
  CREATE_DELIVERY_PARTNER_FAIL,
  LIST_DELIVERY_PARTNERS_REQUEST,
  LIST_DELIVERY_PARTNERS_SUCCESS,
  LIST_DELIVERY_PARTNERS_FAIL,
  UPDATE_DELIVERY_PARTNER_REQUEST,
  UPDATE_DELIVERY_PARTNER_SUCCESS,
  UPDATE_DELIVERY_PARTNER_FAIL,
  DELETE_DELIVERY_PARTNER_REQUEST,
  DELETE_DELIVERY_PARTNER_SUCCESS,
  DELETE_DELIVERY_PARTNER_FAIL,
  SELLER_UPDATE_PROFILE_REQUEST,
  SELLER_UPDATE_PROFILE_SUCCESS,
  SELLER_UPDATE_PROFILE_FAIL,
  USER_FORGOT_PASSWORD_REQUEST,
  USER_FORGOT_PASSWORD_SUCCESS,
  USER_FORGOT_PASSWORD_FAIL,
  USER_RESET_PASSWORD_REQUEST,
  USER_RESET_PASSWORD_SUCCESS,
  USER_RESET_PASSWORD_FAIL,
  USER_DELETE_ACCOUNT_REQUEST,
  USER_DELETE_ACCOUNT_SUCCESS,
  USER_DELETE_ACCOUNT_FAIL,
  USER_RESET_PREFERENCES_REQUEST,
  USER_RESET_PREFERENCES_SUCCESS,
  USER_RESET_PREFERENCES_FAIL,
  USER_EXPORT_DATA_FAIL,
  USER_EXPORT_DATA_SUCCESS,
  USER_GET_REWARDS_FAIL,
  USER_EXPORT_DATA_REQUEST,
  USER_GET_REWARDS_REQUEST,
  USER_GET_REWARDS_SUCCESS,
  USER_SUBSCRIBE_FAIL,
  USER_SUBSCRIBE_REQUEST,
  USER_SUBSCRIBE_SUCCESS,
  USER_ADD_PAYMENT_FAIL,
  USER_ADD_PAYMENT_REQUEST,
  USER_ADD_PAYMENT_SUCCESS,
  USER_DELETE_PAYMENT_FAIL,
  USER_DELETE_PAYMENT_REQUEST,
  USER_DELETE_PAYMENT_SUCCESS,
  USER_LINK_ACCOUNT_FAIL,
  USER_LINK_ACCOUNT_REQUEST,
  USER_LINK_ACCOUNT_SUCCESS,
  USER_REPORT_PROBLEM_FAIL,
  USER_UNLINK_ACCOUNT_FAIL,
  USER_UNLINK_ACCOUNT_REQUEST,
  USER_UNLINK_ACCOUNT_SUCCESS,
  USER_REPORT_PROBLEM_REQUEST,
  USER_REPORT_PROBLEM_SUCCESS,
  USER_UNSUBSCRIBE_FAIL,
  USER_UNSUBSCRIBE_REQUEST,
  USER_UNSUBSCRIBE_SUCCESS,

  USER_GET_SUBSCRIPTION_FAIL,
  USER_GET_SUBSCRIPTION_REQUEST,
  USER_GET_SUBSCRIPTION_SUCCESS,
} from '../constants/userConstants';

import axiosInstance from '../../utils/axiosInstance';
import { getSocket, disconnectSocket } from '../../utils/socket';
// --- LOGIN USER (Improved: Full profile + token + cleanup) ---
export const loginUser = (email, password) => async (dispatch) => {
  try {
    dispatch({ type: USER_LOGIN_REQUEST });

    console.log('🔄 Attempting login...');

    const loginConfig = {
      headers: { 'Content-Type': 'application/json' },
      withCredentials: true,
      timeout: 30000
    };

    const { data: loginData } = await axios.post('/api/auth/login', { email, password }, loginConfig);

    if (!loginData.accessToken) {
      throw new Error('No access token received from server');
    }

    const profileConfig = {
      headers: { Authorization: `Bearer ${loginData.accessToken}` },
      timeout: 30000
    };

    console.log('✅ Login successful, fetching full profile...');
    const { data: profileData } = await axios.get('/api/users/profile', profileConfig);

    const fullUserData = { ...profileData, token: loginData.accessToken };

    dispatch({ type: USER_LOGIN_SUCCESS, payload: fullUserData });

    // Save to localStorage
    localStorage.setItem('userInfo', JSON.stringify(fullUserData));
    localStorage.setItem('token', loginData.accessToken);

    // Set axios default header
    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${loginData.accessToken}`;

    // Initialize socket connection
    console.log('🔄 Initializing socket connection...');
    getSocket(fullUserData._id, fullUserData.role, loginData.accessToken);

    console.log('✅ Login process completed successfully');

  } catch (error) {
    console.error('❌ Login Action Error:', error.response?.data || error.message);

    let errorMessage = 'Login failed. Please try again.';

    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.code === 'ECONNABORTED') {
      errorMessage = 'Login timeout. Please check your connection and try again.';
    } else if (error.message) {
      errorMessage = error.message;
    }

    dispatch({ type: USER_LOGIN_FAIL, payload: errorMessage });

    // Clear any partial storage
    localStorage.removeItem('userInfo');
    localStorage.removeItem('token');
    delete axiosInstance.defaults.headers.common['Authorization'];

    throw new Error(errorMessage);
  }
};

// 🔥 CRITICAL FIX: Enhanced logout with socket cleanup
export const logoutUser = () => (dispatch) => {
  console.log('🚪 Logging out user...');

  // Clear localStorage
  localStorage.removeItem('userInfo');
  localStorage.removeItem('token');

  // Clear axios headers
  delete axiosInstance.defaults.headers.common['Authorization'];

  // Disconnect socket
  disconnectSocket();

  // Dispatch logout action
  dispatch({ type: USER_LOGOUT });

  console.log('✅ Logout completed');
};

// --- LOGOUT USER ---

// --- GET USER DETAILS (Profile) ---
export const getUserDetails = (id = 'profile') => async (dispatch, getState) => {
  try {
    dispatch({ type: USER_DETAILS_REQUEST });
    const { userLogin: { userInfo } } = getState();

    if (!userInfo?.token) {
      throw new Error('No authentication token available');
    }

    const config = {
      headers: { Authorization: `Bearer ${userInfo.token}` },
      timeout: 30000
    };

    const url = id === 'profile' ? '/api/users/profile' : `/api/users/${id}`;
    const { data } = await axiosInstance.get(url, config);

    dispatch({ type: USER_DETAILS_SUCCESS, payload: data });

    return data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch user details';
    console.error('❌ Get user details error:', errorMessage);

    dispatch({
      type: USER_DETAILS_FAIL,
      payload: errorMessage,
    });

    // If it's an auth error, logout
    if (error.response?.status === 401) {
      dispatch(logoutUser());
    }

    throw new Error(errorMessage);
  }
};
// --- CHANGE USER PASSWORD ---
export const changeUserPassword = (currentPassword, newPassword) => async (dispatch, getState) => {
  try {
    dispatch({ type: USER_CHANGE_PASSWORD_REQUEST });
    const { userLogin: { userInfo } } = getState();
    const config = {
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userInfo.token}` },
    };
    const { data } = await axios.put('/api/users/change-password', { currentPassword, newPassword }, config);
    dispatch({ type: USER_CHANGE_PASSWORD_SUCCESS, payload: data });
  } catch (error) {
    dispatch({
      type: USER_CHANGE_PASSWORD_FAIL,
      payload: error.response?.data?.message || error.message,
    });
  }
};
// --- LIST USERS (ADMIN) ---
export const listUsers = () => async (dispatch, getState) => {
  try {
    dispatch({ type: USER_LIST_REQUEST });
    const { userLogin: { userInfo } } = getState();
    const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
    const { data } = await axios.get('/api/users', config);
    dispatch({ type: USER_LIST_SUCCESS, payload: data });
  } catch (error) {
    dispatch({
      type: USER_LIST_FAIL,
      payload: error.response?.data?.message || error.message,
    });
  }
};
// --- DELETE USER (ADMIN) ---
export const deleteUser = (id) => async (dispatch, getState) => {
  try {
    dispatch({ type: USER_DELETE_REQUEST });
    const { userLogin: { userInfo } } = getState();
    const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
    await axios.delete(`/api/users/${id}`, config);
    dispatch({ type: USER_DELETE_SUCCESS });
  } catch (error) {
    dispatch({
      type: USER_DELETE_FAIL,
      payload: error.response?.data?.message || error.message,
    });
  }
};
// --- UPDATE USER (ADMIN) ---
export const updateUser = (user) => async (dispatch, getState) => {
  try {
    dispatch({ type: USER_UPDATE_REQUEST });
    const { userLogin: { userInfo } } = getState();
    const config = {
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userInfo.token}` },
    };
    const { data } = await axios.put(`/api/users/${user._id}`, user, config);
    dispatch({ type: USER_UPDATE_SUCCESS });
    dispatch({ type: USER_DETAILS_SUCCESS, payload: data });
  } catch (error) {
    dispatch({
      type: USER_UPDATE_FAIL,
      payload: error.response?.data?.message || error.message,
    });
  }
};
// frontend/src/redux/actions/userActions.js - Only showing the updated updateUserProfile function
// --- UPDATE USER PROFILE (Fixed: Better nested object handling) ---
export const updateUserProfile = (userData) => async (dispatch, getState) => {
  try {
    dispatch({ type: USER_UPDATE_PROFILE_REQUEST });
    const { userLogin: { userInfo } } = getState();

    if (!userInfo?.token) {
      throw new Error('No authentication token available');
    }

    console.log('🔄 Updating profile with data:', userData);

    const formData = new FormData();
    Object.keys(userData).forEach((key) => {
      const value = userData[key];
      if (key === 'profileImage' && value instanceof File) {
        formData.append('profileImage', value);
        console.log('✅ Added profile image to form data');
      } else if (typeof value === 'object' && value !== null && !(value instanceof File)) {
        // Stringify nested objects (e.g. preferences, personalization)
        const stringifiedValue = JSON.stringify(value);
        formData.append(key, stringifiedValue);
        console.log(`✅ Stringified ${key}:`, stringifiedValue);
      } else if (value !== null && value !== undefined) {
        formData.append(key, value);
        console.log(`✅ Added ${key}:`, value);
      }
    });

    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${userInfo.token}`,
      },
      timeout: 30000
    };

    console.log('🔄 Sending profile update request...');
    const { data } = await axiosInstance.put('/api/users/profile', formData, config);
    console.log('✅ Profile update response:', data);

    if (data.success) {
      dispatch({ type: USER_UPDATE_PROFILE_SUCCESS, payload: data.user });

      // Update login state and localStorage
      const newUserInfoState = { ...userInfo, ...data.user };
      dispatch({ type: USER_LOGIN_SUCCESS, payload: newUserInfoState });
      localStorage.setItem('userInfo', JSON.stringify(newUserInfoState));

      return data.user;
    } else {
      throw new Error(data.message || 'Profile update failed');
    }
  } catch (error) {
    console.error('❌ Update profile error:', error);

    let errorMessage = 'Failed to update profile';
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.response?.data?.errors) {
      errorMessage = error.response.data.errors.join(', ');
    } else if (error.message) {
      errorMessage = error.message;
    }

    dispatch({
      type: USER_UPDATE_PROFILE_FAIL,
      payload: errorMessage,
    });

    throw new Error(errorMessage);
  }
};


// --- WISHLIST ACTIONS ---
export const getWishlistAction = () => async (dispatch, getState) => { // Renamed for clarity
  try {
    dispatch({ type: USER_WISHLIST_REQUEST }); // ✅ FIXED: Dispatch REQUEST for loading state
    const { userLogin: { userInfo } } = getState();
    if (!userInfo?.token) return;
    const config = {
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
      },
    };
    const { data } = await axios.get('/api/users/wishlist', config);
    dispatch({ type: USER_WISHLIST_SUCCESS, payload: data }); // FIXED: Dispatch SUCCESS with full populated data
  } catch (error) {
    console.error('Get Wishlist Error:', error);
    dispatch({ type: USER_WISHLIST_FAIL, payload: error.response?.data?.message || error.message }); // ✅ FIXED: Dispatch FAIL
  }
};

export const addToWishlist = (productId) => async (dispatch, getState) => {
  try {
    const { userLogin: { userInfo } } = getState();
    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userInfo.token}`,
      },
    };
    // FIXED: Send productId in body
    const { data } = await axios.post('/api/users/wishlist', { productId }, config);
    dispatch({ type: USER_WISHLIST_SUCCESS, payload: data }); // FIXED: Dispatch SUCCESS with full updated wishlist from backend
  } catch (error) {
    console.error('Wishlist Error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to add to wishlist');
  }
};

export const removeFromWishlist = (productId) => async (dispatch, getState) => {
  try {
    const { userLogin: { userInfo } } = getState();
    if (!userInfo?.token) return;
    const config = {
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
      },
    };
    const { data } = await axios.delete(`/api/users/wishlist/${productId}`, config); // FIXED: Await response (backend returns updated wishlist)
    dispatch({ type: USER_WISHLIST_SUCCESS, payload: data }); // FIXED: Dispatch SUCCESS with full updated wishlist from backend
  } catch (error) {
    console.error('Remove Wishlist Error:', error);
  }
};

export const getWishlist = () => async (dispatch, getState) => {
  try {
    const { userLogin: { userInfo } } = getState();

    if (!userInfo?.token) return;

    const config = {
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
      },
    };

    const { data } = await axios.get('/api/users/wishlist', config);
    dispatch({ type: USER_WISHLIST_REQUEST, payload: data });
  } catch (error) {
    console.error('Get Wishlist Error:', error);
  }
};

// --- DELIVERY PARTNER ACTIONS ---
export const createDeliveryPartner = (partnerData) => async (dispatch, getState) => {
  try {
    dispatch({ type: CREATE_DELIVERY_PARTNER_REQUEST });
    const { userLogin: { userInfo } } = getState();
    const config = {
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userInfo.token}` },
    };
    const { data } = await axios.post('/api/delivery/partners', partnerData, config);
    dispatch({ type: CREATE_DELIVERY_PARTNER_SUCCESS, payload: data });
  } catch (error) {
    dispatch({
      type: CREATE_DELIVERY_PARTNER_FAIL,
      payload: error.response?.data?.message || error.message,
    });
  }
};
export const listDeliveryPartners = () => async (dispatch, getState) => {
  try {
    dispatch({ type: LIST_DELIVERY_PARTNERS_REQUEST });
    const { userLogin: { userInfo } } = getState();
    const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
    const { data } = await axios.get('/api/delivery/partners', config);
    dispatch({ type: LIST_DELIVERY_PARTNERS_SUCCESS, payload: data });
  } catch (error) {
    dispatch({
      type: LIST_DELIVERY_PARTNERS_FAIL,
      payload: error.response?.data?.message || error.message,
    });
  }
};
export const updateDeliveryPartner = (partnerId, partnerData) => async (dispatch, getState) => {
  try {
    dispatch({ type: UPDATE_DELIVERY_PARTNER_REQUEST });
    const { userLogin: { userInfo } } = getState();
    const config = {
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userInfo.token}` },
    };
    const { data } = await axios.put(`/api/delivery/partners/${partnerId}`, partnerData, config);
    dispatch({ type: UPDATE_DELIVERY_PARTNER_SUCCESS, payload: data });
  } catch (error) {
    dispatch({
      type: UPDATE_DELIVERY_PARTNER_FAIL,
      payload: error.response?.data?.message || error.message,
    });
  }
};
export const deleteDeliveryPartner = (partnerId) => async (dispatch, getState) => {
  try {
    dispatch({ type: DELETE_DELIVERY_PARTNER_REQUEST });
    const { userLogin: { userInfo } } = getState();
    const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
    await axios.delete(`/api/delivery/partners/${partnerId}`, config);
    dispatch({ type: DELETE_DELIVERY_PARTNER_SUCCESS });
  } catch (error) {
    dispatch({
      type: DELETE_DELIVERY_PARTNER_FAIL,
      payload: error.response?.data?.message || error.message,
    });
  }
};
// --- SELLER PROFILE UPDATE ---
export const updateSellerProfile = (profileData) => async (dispatch, getState) => {
  try {
    dispatch({ type: SELLER_UPDATE_PROFILE_REQUEST });
    const { userLogin: { userInfo } } = getState();
    const config = {
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${userInfo.token}` },
    };
    const { data } = await axios.put('/api/sellers/profile', profileData, config);
    dispatch({ type: SELLER_UPDATE_PROFILE_SUCCESS, payload: data });
  } catch (error) {
    dispatch({
      type: SELLER_UPDATE_PROFILE_FAIL,
      payload: error.response?.data?.message || error.message,
    });
  }
};
// --- FORGOT PASSWORD ---
export const forgotPassword = (email) => async (dispatch) => {
  try {
    dispatch({ type: USER_FORGOT_PASSWORD_REQUEST });
    const config = { headers: { 'Content-Type': 'application/json' } };
    const { data } = await axios.post('/api/users/forgotpassword', { email }, config);
    dispatch({ type: USER_FORGOT_PASSWORD_SUCCESS, payload: data.message });
  } catch (error) {
    dispatch({
      type: USER_FORGOT_PASSWORD_FAIL,
      payload: error.response?.data?.message || error.message,
    });
  }
};
// --- RESET PASSWORD ---
export const resetPassword = (token, password) => async (dispatch) => {
  try {
    dispatch({ type: USER_RESET_PASSWORD_REQUEST });
    const config = { headers: { 'Content-Type': 'application/json' } };
    const { data } = await axios.put(`/api/users/resetpassword/${token}`, { password }, config);
    dispatch({ type: USER_RESET_PASSWORD_SUCCESS, payload: data.message });
  } catch (error) {
    dispatch({
      type: USER_RESET_PASSWORD_FAIL,
      payload: error.response?.data?.message || error.message,
    });
  }
};
export const deleteAccount = (password) => async (dispatch, getState) => {
  try {
    dispatch({ type: USER_DELETE_ACCOUNT_REQUEST });
    const { userLogin: { userInfo } } = getState();
    await axios.delete('/api/users/me', {
      data: { password },
      headers: { Authorization: `Bearer ${userInfo.token}` }
    });
    dispatch({ type: USER_DELETE_ACCOUNT_SUCCESS });
  } catch (error) {
    dispatch({
      type: USER_DELETE_ACCOUNT_FAIL,
      payload: error.response?.data?.message || error.message
    });
  }
};

export const resetPreferences = () => async (dispatch, getState) => {
  try {
    dispatch({ type: USER_RESET_PREFERENCES_REQUEST });

    const {
      userLogin: { userInfo },
    } = getState();

    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userInfo.token}`,
      },
    };

    const { data } = await axios.post('/api/users/reset-preferences', {}, config);

    const updatedUserInfo = { ...userInfo, ...data.user };
    dispatch({ type: USER_LOGIN_SUCCESS, payload: updatedUserInfo });
    localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));

    dispatch({ type: USER_RESET_PREFERENCES_SUCCESS });
  } catch (error) {
    dispatch({
      type: USER_RESET_PREFERENCES_FAIL,
      payload: error.response?.data?.message || error.message,
    });
  }
};

export const linkAccount = (provider) => async (dispatch, getState) => {
  try {
    dispatch({ type: USER_LINK_ACCOUNT_REQUEST });
    const { userLogin: { userInfo } } = getState();
    const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
    const { data } = await axios.post('/api/users/linked-accounts', { provider }, config);
    dispatch({ type: USER_LINK_ACCOUNT_SUCCESS, payload: data });
    dispatch(getUserDetails('profile'));
  } catch (error) {
    dispatch({ type: USER_LINK_ACCOUNT_FAIL, payload: error.response?.data?.message || error.message });
  }
};

export const unlinkAccount = (provider) => async (dispatch, getState) => {
  try {
    dispatch({ type: USER_UNLINK_ACCOUNT_REQUEST });
    const { userLogin: { userInfo } } = getState();
    const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
    const { data } = await axios.delete('/api/users/linked-accounts', { ...config, data: { provider } });
    dispatch({ type: USER_UNLINK_ACCOUNT_SUCCESS, payload: data });
    dispatch(getUserDetails('profile'));
  } catch (error) {
    dispatch({ type: USER_UNLINK_ACCOUNT_FAIL, payload: error.response?.data?.message || error.message });
  }
};

export const addPaymentMethod = (method) => async (dispatch, getState) => {
  try {
    dispatch({ type: USER_ADD_PAYMENT_REQUEST });
    const { userLogin: { userInfo } } = getState();
    const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
    const { data } = await axios.post('/api/users/payment-methods', method, config);
    dispatch({ type: USER_ADD_PAYMENT_SUCCESS, payload: data });
    dispatch(getUserDetails('profile'));
  } catch (error) {
    dispatch({ type: USER_ADD_PAYMENT_FAIL, payload: error.response?.data?.message || error.message });
  }
};

export const deletePaymentMethod = (id) => async (dispatch, getState) => {
  try {
    dispatch({ type: USER_DELETE_PAYMENT_REQUEST });
    const { userLogin: { userInfo } } = getState();
    const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
    await axios.delete(`/api/users/payment-methods/${id}`, config);
    dispatch({ type: USER_DELETE_PAYMENT_SUCCESS });
    dispatch(getUserDetails('profile'));
  } catch (error) {
    dispatch({ type: USER_DELETE_PAYMENT_FAIL, payload: error.response?.data?.message || error.message });
  }
};

export const getRewards = () => async (dispatch, getState) => {
  try {
    dispatch({ type: USER_GET_REWARDS_REQUEST });
    const { userLogin: { userInfo } } = getState();
    const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
    const { data } = await axios.get('/api/users/rewards', config);
    dispatch({ type: USER_GET_REWARDS_SUCCESS, payload: data });
  } catch (error) {
    dispatch({ type: USER_GET_REWARDS_FAIL, payload: error.response?.data?.message || error.message });
  }
};

export const subscribe = () => async (dispatch, getState) => {
  try {
    dispatch({ type: USER_SUBSCRIBE_REQUEST });
    const { userLogin: { userInfo } } = getState();
    const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
    const { data } = await axios.post('/api/users/subscribe', {}, config);
    dispatch({ type: USER_SUBSCRIBE_SUCCESS, payload: data });
    dispatch(getUserDetails('profile'));
  } catch (error) {
    dispatch({ type: USER_SUBSCRIBE_FAIL, payload: error.response?.data?.message || error.message });
  }
};

export const unsubscribe = () => async (dispatch, getState) => {
  try {
    dispatch({ type: USER_UNSUBSCRIBE_REQUEST });
    const { userLogin: { userInfo } } = getState();
    const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
    const { data } = await axios.post('/api/users/unsubscribe', {}, config);
    dispatch({ type: USER_UNSUBSCRIBE_SUCCESS, payload: data });
    dispatch(getUserDetails('profile'));
  } catch (error) {
    dispatch({ type: USER_UNSUBSCRIBE_FAIL, payload: error.response?.data?.message || error.message });
  }
};

export const reportProblem = (report) => async (dispatch, getState) => {
  try {
    dispatch({ type: USER_REPORT_PROBLEM_REQUEST });
    const { userLogin: { userInfo } } = getState();
    const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
    const { data } = await axios.post('/api/users/report-problem', report, config);
    dispatch({ type: USER_REPORT_PROBLEM_SUCCESS, payload: data });
  } catch (error) {
    dispatch({ type: USER_REPORT_PROBLEM_FAIL, payload: error.response?.data?.message || error.message });
  }
};

export const exportUserData = () => async (dispatch, getState) => {
  try {
    dispatch({ type: USER_EXPORT_DATA_REQUEST });
    const { userLogin: { userInfo } } = getState();
    const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
    const { data } = await axios.get('/api/users/export-data', config);
    dispatch({ type: USER_EXPORT_DATA_SUCCESS, payload: data });
  } catch (error) {
    dispatch({ type: USER_EXPORT_DATA_FAIL, payload: error.response?.data?.message || error.message });
  }
};

export const getSubscription = () => async (dispatch, getState) => {
  try {
    dispatch({ type: USER_GET_SUBSCRIPTION_REQUEST });
    const {
      userLogin: { userInfo },
    } = getState();
    const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
    const { data } = await axios.get('/api/users/subscription', config);
    dispatch({ type: USER_GET_SUBSCRIPTION_SUCCESS, payload: data });
  } catch (error) {
    dispatch({
      type: USER_GET_SUBSCRIPTION_FAIL,
      payload: error.response?.data?.message || error.message,
    });
  }
};

export const getReferrals = () => async (dispatch, getState) => {
  try {
    const { userLogin: { userInfo } } = getState();
    const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
    const { data } = await axios.get('/api/users/referrals', config);
    // Dispatch success or update user info if needed
    // For now we just return data or dispatch a generic success? 
    // Maybe better to update a specific reducer. Let's assume we update details.
    // Or just let the component handle local state?
    // Let's dispatch USER_DETAILS_SUCCESS with merged data if possible, or a new type.
    return data;
  } catch (error) {
    console.error(error);
  }
};

export const getPrivacySettings = () => async (dispatch, getState) => {
  try {
    const { userLogin: { userInfo } } = getState();
    const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
    const { data } = await axios.get('/api/users/privacy', config);
    return data;
  } catch (error) {
    console.error(error);
  }
};

export const updatePrivacySettings = (settings) => async (dispatch, getState) => {
  try {
    const { userLogin: { userInfo } } = getState();
    const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
    const { data } = await axios.put('/api/users/privacy', settings, config);
    return data;
  } catch (error) {
    throw error;
  }
};