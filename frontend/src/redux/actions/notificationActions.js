import {
  NOTIFICATION_LIST_REQUEST,
  NOTIFICATION_LIST_SUCCESS,
  NOTIFICATION_LIST_FAIL,
  NOTIFICATION_MARK_READ_REQUEST,
  NOTIFICATION_MARK_READ_SUCCESS,
  NOTIFICATION_MARK_READ_FAIL,
  NOTIFICATION_MARK_ALL_READ_REQUEST,
  NOTIFICATION_MARK_ALL_READ_SUCCESS,
  NOTIFICATION_MARK_ALL_READ_FAIL,
  NOTIFICATION_DELETE_REQUEST,
  NOTIFICATION_DELETE_SUCCESS,
  NOTIFICATION_DELETE_FAIL,
  NOTIFICATION_CLEAR_ALL_REQUEST,
  NOTIFICATION_CLEAR_ALL_SUCCESS,
  NOTIFICATION_CLEAR_ALL_FAIL,
  NOTIFICATION_STATS_REQUEST,
  NOTIFICATION_STATS_SUCCESS,
  NOTIFICATION_STATS_FAIL,
  NOTIFICATION_ADD,
  NOTIFICATION_UPDATE,
  NOTIFICATION_REMOVE
} from '../constants/notificationConstants';

// Get user notifications
export const listNotifications = (filters = {}) => async (dispatch, getState) => {
  try {
    dispatch({ type: NOTIFICATION_LIST_REQUEST });

    const { userLogin: { userInfo } } = getState();
    
    const queryParams = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) queryParams.append(key, filters[key]);
    });

    const response = await fetch(`/api/notifications?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${userInfo.token}`
      }
    });
    
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch notifications');
    }

    dispatch({
      type: NOTIFICATION_LIST_SUCCESS,
      payload: data
    });
  } catch (error) {
    dispatch({
      type: NOTIFICATION_LIST_FAIL,
      payload: error.message
    });
  }
};

// Mark notification as read
export const markNotificationAsRead = (notificationId) => async (dispatch, getState) => {
  try {
    dispatch({ type: NOTIFICATION_MARK_READ_REQUEST });

    const { userLogin: { userInfo } } = getState();

    const response = await fetch(`/api/notifications/${notificationId}/read`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${userInfo.token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to mark notification as read');
    }

    dispatch({
      type: NOTIFICATION_MARK_READ_SUCCESS,
      payload: { notificationId }
    });

    // Also emit socket event
    const { markNotificationRead } = require('../../utils/socket');
    markNotificationRead(notificationId, userInfo._id);
  } catch (error) {
    dispatch({
      type: NOTIFICATION_MARK_READ_FAIL,
      payload: error.message
    });
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = () => async (dispatch, getState) => {
  try {
    dispatch({ type: NOTIFICATION_MARK_ALL_READ_REQUEST });

    const { userLogin: { userInfo } } = getState();

    const response = await fetch('/api/notifications/read-all', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${userInfo.token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to mark all notifications as read');
    }

    dispatch({
      type: NOTIFICATION_MARK_ALL_READ_SUCCESS
    });
  } catch (error) {
    dispatch({
      type: NOTIFICATION_MARK_ALL_READ_FAIL,
      payload: error.message
    });
  }
};

// Delete notification
export const deleteNotification = (notificationId) => async (dispatch, getState) => {
  try {
    dispatch({ type: NOTIFICATION_DELETE_REQUEST });

    const { userLogin: { userInfo } } = getState();

    const response = await fetch(`/api/notifications/${notificationId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${userInfo.token}`
      }
    });
    
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to delete notification');
    }

    dispatch({
      type: NOTIFICATION_DELETE_SUCCESS,
      payload: { notificationId }
    });
  } catch (error) {
    dispatch({
      type: NOTIFICATION_DELETE_FAIL,
      payload: error.message
    });
  }
};

// Clear all notifications
export const clearAllNotifications = () => async (dispatch, getState) => {
  try {
    dispatch({ type: NOTIFICATION_CLEAR_ALL_REQUEST });

    const { userLogin: { userInfo } } = getState();

    const response = await fetch('/api/notifications', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${userInfo.token}`
      }
    });
    
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to clear all notifications');
    }

    dispatch({
      type: NOTIFICATION_CLEAR_ALL_SUCCESS
    });
  } catch (error) {
    dispatch({
      type: NOTIFICATION_CLEAR_ALL_FAIL,
      payload: error.message
    });
  }
};

// Get notification statistics
export const getNotificationStats = () => async (dispatch, getState) => {
  try {
    dispatch({ type: NOTIFICATION_STATS_REQUEST });

    const { userLogin: { userInfo } } = getState();

    const response = await fetch('/api/notifications/stats', {
      headers: {
        'Authorization': `Bearer ${userInfo.token}`
      }
    });
    
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch notification stats');
    }

    dispatch({
      type: NOTIFICATION_STATS_SUCCESS,
      payload: data
    });
  } catch (error) {
    dispatch({
      type: NOTIFICATION_STATS_FAIL,
      payload: error.message
    });
  }
};

// Add new notification (for real-time updates)
export const addNotification = (notification) => (dispatch) => {
  dispatch({
    type: NOTIFICATION_ADD,
    payload: notification
  });
};

// Update notification (for real-time updates)
export const updateNotification = (notificationId, updates) => (dispatch) => {
  dispatch({
    type: NOTIFICATION_UPDATE,
    payload: { notificationId, updates }
  });
};

// Remove notification (for real-time updates)
export const removeNotification = (notificationId) => (dispatch) => {
  dispatch({
    type: NOTIFICATION_REMOVE,
    payload: { notificationId }
  });
};

