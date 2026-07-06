import {
  MODERATION_PENDING_REQUEST,
  MODERATION_PENDING_SUCCESS,
  MODERATION_PENDING_FAIL,
  MODERATION_FLAGGED_REQUEST,
  MODERATION_FLAGGED_SUCCESS,
  MODERATION_FLAGGED_FAIL,
  MODERATION_APPROVE_REQUEST,
  MODERATION_APPROVE_SUCCESS,
  MODERATION_APPROVE_FAIL,
  MODERATION_REJECT_REQUEST,
  MODERATION_REJECT_SUCCESS,
  MODERATION_REJECT_FAIL,
  MODERATION_DELETE_REQUEST,
  MODERATION_DELETE_SUCCESS,
  MODERATION_DELETE_FAIL,
  MODERATION_PIN_REQUEST,
  MODERATION_PIN_SUCCESS,
  MODERATION_PIN_FAIL,
  MODERATION_STATS_REQUEST,
  MODERATION_STATS_SUCCESS,
  MODERATION_STATS_FAIL
} from '../constants/moderationConstants';
import api from '../../utils/api';

// Get pending content
export const getPendingContent = (filters = {}) => async (dispatch, getState) => {
  try {
    dispatch({ type: MODERATION_PENDING_REQUEST });

    const { userLogin: { userInfo } } = getState();
    
    const config = {
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
      },
    };

    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) params.append(key, filters[key]);
    });

    const { data } = await api.get(`/api/v1/admin/moderation/pending?${params}`, config);
    
    dispatch({
      type: MODERATION_PENDING_SUCCESS,
      payload: data,
    });
  } catch (error) {
    dispatch({
      type: MODERATION_PENDING_FAIL,
      payload: error.response?.data?.message || error.message,
    });
  }
};

// Get flagged content
export const getFlaggedContent = (filters = {}) => async (dispatch, getState) => {
  try {
    dispatch({ type: MODERATION_FLAGGED_REQUEST });

    const { userLogin: { userInfo } } = getState();
    
    const config = {
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
      },
    };

    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) params.append(key, filters[key]);
    });

    const { data } = await api.get(`/api/v1/admin/moderation/flagged?${params}`, config);
    
    dispatch({
      type: MODERATION_FLAGGED_SUCCESS,
      payload: data,
    });
  } catch (error) {
    dispatch({
      type: MODERATION_FLAGGED_FAIL,
      payload: error.response?.data?.message || error.message,
    });
  }
};

// Approve content
export const approveContent = (contentType, contentId, moderationData) => async (dispatch, getState) => {
  try {
    dispatch({ type: MODERATION_APPROVE_REQUEST });

    const { userLogin: { userInfo } } = getState();
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userInfo.token}`,
      },
    };

    const { data } = await api.put(
      `/api/v1/admin/moderation/approve/${contentType}/${contentId}`,
      moderationData,
      config
    );
    
    dispatch({
      type: MODERATION_APPROVE_SUCCESS,
      payload: data,
    });

    return data;
  } catch (error) {
    dispatch({
      type: MODERATION_APPROVE_FAIL,
      payload: error.response?.data?.message || error.message,
    });
    throw error;
  }
};

// Reject content
export const rejectContent = (contentType, contentId, moderationData) => async (dispatch, getState) => {
  try {
    dispatch({ type: MODERATION_REJECT_REQUEST });

    const { userLogin: { userInfo } } = getState();
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userInfo.token}`,
      },
    };

    const { data } = await api.put(
      `/api/v1/admin/moderation/reject/${contentType}/${contentId}`,
      moderationData,
      config
    );
    
    dispatch({
      type: MODERATION_REJECT_SUCCESS,
      payload: data,
    });

    return data;
  } catch (error) {
    dispatch({
      type: MODERATION_REJECT_FAIL,
      payload: error.response?.data?.message || error.message,
    });
    throw error;
  }
};

// Delete content
export const deleteContent = (contentType, contentId, moderationData) => async (dispatch, getState) => {
  try {
    dispatch({ type: MODERATION_DELETE_REQUEST });

    const { userLogin: { userInfo } } = getState();
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userInfo.token}`,
      },
    };

    const { data } = await api.delete(
      `/api/v1/admin/moderation/delete/${contentType}/${contentId}`,
      { data: moderationData, ...config }
    );
    
    dispatch({
      type: MODERATION_DELETE_SUCCESS,
      payload: data,
    });

    return data;
  } catch (error) {
    dispatch({
      type: MODERATION_DELETE_FAIL,
      payload: error.response?.data?.message || error.message,
    });
    throw error;
  }
};

// Pin forum post
export const pinForumPost = (postId) => async (dispatch, getState) => {
  try {
    dispatch({ type: MODERATION_PIN_REQUEST });

    const { userLogin: { userInfo } } = getState();
    
    const config = {
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
      },
    };

    const { data } = await api.put(
      `/api/v1/admin/moderation/pin/forum/${postId}`,
      {},
      config
    );
    
    dispatch({
      type: MODERATION_PIN_SUCCESS,
      payload: data,
    });

    return data;
  } catch (error) {
    dispatch({
      type: MODERATION_PIN_FAIL,
      payload: error.response?.data?.message || error.message,
    });
    throw error;
  }
};

// Get moderation statistics
export const getModerationStats = () => async (dispatch, getState) => {
  try {
    dispatch({ type: MODERATION_STATS_REQUEST });

    const { userLogin: { userInfo } } = getState();
    
    const config = {
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
      },
    };

    const { data } = await api.get('/api/v1/admin/moderation/stats', config);
    
    dispatch({
      type: MODERATION_STATS_SUCCESS,
      payload: data,
    });
  } catch (error) {
    dispatch({
      type: MODERATION_STATS_FAIL,
      payload: error.response?.data?.message || error.message,
    });
  }
};