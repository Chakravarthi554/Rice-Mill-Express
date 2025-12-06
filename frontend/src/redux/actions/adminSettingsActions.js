import {
  ADMIN_SETTINGS_REQUEST,
  ADMIN_SETTINGS_SUCCESS,
  ADMIN_SETTINGS_FAIL,
  ADMIN_SETTINGS_UPDATE_REQUEST,
  ADMIN_SETTINGS_UPDATE_SUCCESS,
  ADMIN_SETTINGS_UPDATE_FAIL,
  ADMIN_SETTINGS_RESET_REQUEST,
  ADMIN_SETTINGS_RESET_SUCCESS,
  ADMIN_SETTINGS_RESET_FAIL,
  ADMIN_NOTIFICATION_SEND_REQUEST,
  ADMIN_NOTIFICATION_SEND_SUCCESS,
  ADMIN_NOTIFICATION_SEND_FAIL,
  ADMIN_RECIPES_LIST_REQUEST,
  ADMIN_RECIPES_LIST_SUCCESS,
  ADMIN_RECIPES_LIST_FAIL
} from '../constants/adminSettingsConstants';
import api from '../../utils/api';

// Get admin settings
export const getAdminSettings = () => async (dispatch, getState) => {
  try {
    dispatch({ type: ADMIN_SETTINGS_REQUEST });

    const { userLogin: { userInfo } } = getState();
    
    const config = {
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
      },
    };

    const { data } = await api.get('/api/admin/settings', config);
    
    dispatch({
      type: ADMIN_SETTINGS_SUCCESS,
      payload: data,
    });
  } catch (error) {
    dispatch({
      type: ADMIN_SETTINGS_FAIL,
      payload: error.response?.data?.message || error.message,
    });
    throw error;
  }
};

// Update admin settings
export const updateAdminSettings = (settingsData) => async (dispatch, getState) => {
  try {
    dispatch({ type: ADMIN_SETTINGS_UPDATE_REQUEST });

    const { userLogin: { userInfo } } = getState();
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userInfo.token}`,
      },
    };

    const { data } = await api.put('/api/admin/settings', settingsData, config);
    
    dispatch({
      type: ADMIN_SETTINGS_UPDATE_SUCCESS,
      payload: data.settings,
    });

    return data;
  } catch (error) {
    dispatch({
      type: ADMIN_SETTINGS_UPDATE_FAIL,
      payload: error.response?.data?.message || error.message,
    });
    throw error;
  }
};

// Send bulk notification
export const sendBulkNotification = (notificationData) => async (dispatch, getState) => {
  try {
    dispatch({ type: ADMIN_NOTIFICATION_SEND_REQUEST });

    const { userLogin: { userInfo } } = getState();
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userInfo.token}`,
      },
    };

    const { data } = await api.post('/api/admin/settings/push-notification', notificationData, config);
    
    dispatch({
      type: ADMIN_NOTIFICATION_SEND_SUCCESS,
      payload: data,
    });

    // Refresh settings to get updated notification info
    dispatch(getAdminSettings());

    return data;
  } catch (error) {
    dispatch({
      type: ADMIN_NOTIFICATION_SEND_FAIL,
      payload: error.response?.data?.message || error.message,
    });
    throw error;
  }
};

// Get available recipes for "Recipe of the Day"
export const getAvailableRecipes = () => async (dispatch, getState) => {
  try {
    dispatch({ type: ADMIN_RECIPES_LIST_REQUEST });

    const { userLogin: { userInfo } } = getState();
    
    const config = {
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
      },
    };

    const { data } = await api.get('/api/admin/settings/recipes', config);
    
    dispatch({
      type: ADMIN_RECIPES_LIST_SUCCESS,
      payload: data,
    });
  } catch (error) {
    dispatch({
      type: ADMIN_RECIPES_LIST_FAIL,
      payload: error.response?.data?.message || error.message,
    });
  }
};

// Reset settings to default
export const resetAdminSettings = () => async (dispatch, getState) => {
  try {
    dispatch({ type: ADMIN_SETTINGS_RESET_REQUEST });

    const { userLogin: { userInfo } } = getState();
    
    const config = {
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
      },
    };

    const { data } = await api.post('/api/admin/settings/reset', {}, config);
    
    dispatch({
      type: ADMIN_SETTINGS_RESET_SUCCESS,
      payload: data.settings,
    });

    return data;
  } catch (error) {
    dispatch({
      type: ADMIN_SETTINGS_RESET_FAIL,
      payload: error.response?.data?.message || error.message,
    });
    throw error;
  }
};