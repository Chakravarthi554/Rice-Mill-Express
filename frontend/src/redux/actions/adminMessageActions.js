import {
  ADMIN_MESSAGES_CONVERSATIONS_REQUEST,
  ADMIN_MESSAGES_CONVERSATIONS_SUCCESS,
  ADMIN_MESSAGES_CONVERSATIONS_FAIL,
  ADMIN_MESSAGES_CONVERSATION_REQUEST,
  ADMIN_MESSAGES_CONVERSATION_SUCCESS,
  ADMIN_MESSAGES_CONVERSATION_FAIL,
  ADMIN_MESSAGES_SEND_REQUEST,
  ADMIN_MESSAGES_SEND_SUCCESS,
  ADMIN_MESSAGES_SEND_FAIL,
  ADMIN_MESSAGES_RESOLVE_REQUEST,
  ADMIN_MESSAGES_RESOLVE_SUCCESS,
  ADMIN_MESSAGES_RESOLVE_FAIL,
  ADMIN_MESSAGES_STATS_REQUEST,
  ADMIN_MESSAGES_STATS_SUCCESS,
  ADMIN_MESSAGES_STATS_FAIL
} from '../constants/adminMessageConstants';
import api from '../../utils/api';

// Get all conversations for admin
export const getAdminConversations = (filters = {}) => async (dispatch, getState) => {
  try {
    dispatch({ type: ADMIN_MESSAGES_CONVERSATIONS_REQUEST });

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

    const { data } = await api.get(`/api/admin/messages/conversations?${params}`, config);
    
    dispatch({
      type: ADMIN_MESSAGES_CONVERSATIONS_SUCCESS,
      payload: data,
    });
  } catch (error) {
    dispatch({
      type: ADMIN_MESSAGES_CONVERSATIONS_FAIL,
      payload: error.response?.data?.message || error.message,
    });
  }
};

// Get conversation with specific user
export const getConversationWithUser = (userId) => async (dispatch, getState) => {
  try {
    dispatch({ type: ADMIN_MESSAGES_CONVERSATION_REQUEST });

    const { userLogin: { userInfo } } = getState();
    
    const config = {
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
      },
    };

    const { data } = await api.get(`/api/admin/messages/conversations/${userId}`, config);
    
    dispatch({
      type: ADMIN_MESSAGES_CONVERSATION_SUCCESS,
      payload: data,
    });
  } catch (error) {
    dispatch({
      type: ADMIN_MESSAGES_CONVERSATION_FAIL,
      payload: error.response?.data?.message || error.message,
    });
  }
};

// Admin sends message to user
export const adminSendMessage = (messageData) => async (dispatch, getState) => {
  try {
    dispatch({ type: ADMIN_MESSAGES_SEND_REQUEST });

    const { userLogin: { userInfo } } = getState();
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userInfo.token}`,
      },
    };

    const { data } = await api.post('/api/admin/messages/send', messageData, config);
    
    dispatch({
      type: ADMIN_MESSAGES_SEND_SUCCESS,
      payload: data,
    });

    // Refresh the conversation
    if (messageData.userId) {
      dispatch(getConversationWithUser(messageData.userId));
    }

    return data;
  } catch (error) {
    dispatch({
      type: ADMIN_MESSAGES_SEND_FAIL,
      payload: error.response?.data?.message || error.message,
    });
    throw error;
  }
};

// Mark conversation as resolved
export const markConversationResolved = (userId, resolutionData) => async (dispatch, getState) => {
  try {
    dispatch({ type: ADMIN_MESSAGES_RESOLVE_REQUEST });

    const { userLogin: { userInfo } } = getState();
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userInfo.token}`,
      },
    };

    const { data } = await api.put(`/api/admin/messages/conversations/${userId}/resolve`, resolutionData, config);
    
    dispatch({
      type: ADMIN_MESSAGES_RESOLVE_SUCCESS,
      payload: data,
    });

    // Refresh conversations
    dispatch(getAdminConversations());

    return data;
  } catch (error) {
    dispatch({
      type: ADMIN_MESSAGES_RESOLVE_FAIL,
      payload: error.response?.data?.message || error.message,
    });
    throw error;
  }
};

// Get message statistics
export const getMessageStats = () => async (dispatch, getState) => {
  try {
    dispatch({ type: ADMIN_MESSAGES_STATS_REQUEST });

    const { userLogin: { userInfo } } = getState();
    
    const config = {
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
      },
    };

    const { data } = await api.get('/api/admin/messages/stats', config);
    
    dispatch({
      type: ADMIN_MESSAGES_STATS_SUCCESS,
      payload: data,
    });
  } catch (error) {
    dispatch({
      type: ADMIN_MESSAGES_STATS_FAIL,
      payload: error.response?.data?.message || error.message,
    });
  }
};