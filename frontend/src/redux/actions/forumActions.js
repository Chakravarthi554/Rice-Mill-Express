import axios from 'axios';
import {
  FORUM_POST_LIST_REQUEST,
  FORUM_POST_LIST_SUCCESS,
  FORUM_POST_LIST_FAIL,
  FORUM_POST_DETAILS_REQUEST,
  FORUM_POST_DETAILS_SUCCESS,
  FORUM_POST_DETAILS_FAIL,
  FORUM_POST_CREATE_REQUEST,
  FORUM_POST_CREATE_SUCCESS,
  FORUM_POST_CREATE_FAIL,
  FORUM_POST_UPDATE_REQUEST,
  FORUM_POST_UPDATE_SUCCESS,
  FORUM_POST_UPDATE_FAIL,
  FORUM_POST_DELETE_REQUEST,
  FORUM_POST_DELETE_SUCCESS,
  FORUM_POST_DELETE_FAIL,
  FORUM_POST_LIKE_REQUEST,
  FORUM_POST_LIKE_SUCCESS,
  FORUM_POST_LIKE_FAIL,
  FORUM_POST_REPLY_REQUEST,
  FORUM_POST_REPLY_SUCCESS,
  FORUM_POST_REPLY_FAIL,
  FORUM_POST_APPROVE_REQUEST,
  FORUM_POST_APPROVE_SUCCESS,
  FORUM_POST_APPROVE_FAIL,
  FORUM_POST_REPORT_REQUEST,
  FORUM_POST_REPORT_SUCCESS,
  FORUM_POST_REPORT_FAIL,
  FORUM_POST_PIN_REQUEST,
  FORUM_POST_PIN_SUCCESS,
  FORUM_POST_PIN_FAIL,
  FORUM_COMMENT_MODERATE_REQUEST,
  FORUM_COMMENT_MODERATE_SUCCESS,
  FORUM_COMMENT_MODERATE_FAIL,
  FORUM_COMMENT_REPORT_REQUEST,
  FORUM_COMMENT_REPORT_SUCCESS,
  FORUM_COMMENT_REPORT_FAIL,
  FORUM_FLAGGED_COMMENTS_REQUEST,
  FORUM_FLAGGED_COMMENTS_SUCCESS,
  FORUM_FLAGGED_COMMENTS_FAIL,
  FORUM_POST_LIST_LIVE_REQUEST,
  FORUM_POST_LIST_LIVE_SUCCESS,
  FORUM_POST_LIST_LIVE_FAIL,
  // New report and bookmark constants
  FORUM_REPORTS_LIST_REQUEST,
  FORUM_REPORTS_LIST_SUCCESS,
  FORUM_REPORTS_LIST_FAIL,
  FORUM_REPORT_DETAILS_REQUEST,
  FORUM_REPORT_DETAILS_SUCCESS,
  FORUM_REPORT_DETAILS_FAIL,
  FORUM_REPORT_ACTION_REQUEST,
  FORUM_REPORT_ACTION_SUCCESS,
  FORUM_REPORT_ACTION_FAIL,
  FORUM_REPORT_STATS_REQUEST,
  FORUM_REPORT_STATS_SUCCESS,
  FORUM_REPORT_STATS_FAIL,
  FORUM_BOOKMARK_REQUEST,
  FORUM_BOOKMARK_SUCCESS,
  FORUM_BOOKMARK_FAIL,
  FORUM_BOOKMARKS_LIST_REQUEST,
  FORUM_BOOKMARKS_LIST_SUCCESS,
  FORUM_BOOKMARKS_LIST_FAIL,
  FORUM_POST_SHARE_REQUEST,
  FORUM_POST_SHARE_SUCCESS,
  FORUM_POST_SHARE_FAIL,
} from '../constants/ForumConstants';
import { handleApiError } from '../../utils/handleApiError';
import axiosInstance from '../../utils/axiosInstance';

// 🔥 CRITICAL FIX: Enhanced authentication helper with better error handling
// Falls back to localStorage token (used by AuthContext) if Redux state has no token
const getAuthConfig = (userInfo) => {
  const token = userInfo?.token || localStorage.getItem('token');
  if (!token) {
    console.error('❌ No user token available for forum request');
    throw new Error('Authentication required. Please log in again.');
  }

  return {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  };
};

// 🔥 CRITICAL FIX: Safe API call wrapper
const safeApiCall = async (apiCall, errorMessage) => {
  try {
    return await apiCall();
  } catch (error) {
    console.error(`❌ ${errorMessage}:`, error);

    // Handle authentication errors
    if (error.response?.status === 401) {
      console.log('🔐 Authentication failed, clearing storage...');
      localStorage.removeItem('userInfo');
      localStorage.removeItem('token');
      window.location.href = '/login';
      throw new Error('Session expired. Please log in again.');
    }

    // Handle authorization errors
    if (error.response?.status === 403) {
      throw new Error('Access denied. You do not have permission to perform this action.');
    }

    throw error;
  }
};

// Create Post
export const createForumPost = (postData) => async (dispatch, getState) => {
  try {
    dispatch({ type: FORUM_POST_CREATE_REQUEST });

    const {
      userLogin: { userInfo },
    } = getState();

    const config = getAuthConfig(userInfo);

    const { data } = await safeApiCall(
      () => axiosInstance.post('/api/forum', postData, config),
      'Create forum post failed'
    );

    dispatch({
      type: FORUM_POST_CREATE_SUCCESS,
      payload: data,
    });

    return Promise.resolve(data);
  } catch (error) {
    const message = handleApiError(error);
    dispatch({
      type: FORUM_POST_CREATE_FAIL,
      payload: message,
    });
    return Promise.reject(message);
  }
};

// Get Forum Posts with filters
export const getForumPosts = (page = 1, limit = 50, category = '', search = '', filters = {}) => async (dispatch, getState) => {
  try {
    dispatch({ type: FORUM_POST_LIST_REQUEST });

    const {
      userLogin: { userInfo },
    } = getState();

    const config = userInfo?.token ? getAuthConfig(userInfo) : {};

    const params = { page, limit, ...filters };
    if (category) params.category = category;
    if (search) params.search = search;

    console.log('🔄 Fetching forum posts with params:', params);

    const { data } = await safeApiCall(
      () => axiosInstance.get('/api/forum', { params, ...config }),
      'Fetch forum posts failed'
    );

    dispatch({
      type: FORUM_POST_LIST_SUCCESS,
      payload: {
        posts: data.posts || [],
        page: data.page || 1,
        pages: data.pages || 1,
        total: data.total || 0,
      },
    });

    return Promise.resolve(data);
  } catch (error) {
    const message = handleApiError(error);
    console.error('❌ Error fetching forum posts:', message);
    dispatch({
      type: FORUM_POST_LIST_FAIL,
      payload: message,
    });
    return Promise.reject(message);
  }
};

// 🔥 CRITICAL FIX: Get Pending Posts (Admin only) - Enhanced error handling
export const getPendingPosts = (page = 1, limit = 10) => async (dispatch, getState) => {
  try {
    dispatch({ type: FORUM_POST_LIST_REQUEST });

    const {
      userLogin: { userInfo },
    } = getState();

    console.log('🔄 getPendingPosts: Checking user authentication...');
    console.log('User Info:', userInfo ? `Role: ${userInfo.role}, ID: ${userInfo._id}` : 'No user info');

    if (!userInfo) {
      throw new Error('User not authenticated. Please log in.');
    }

    if (userInfo.role !== 'admin') {
      console.warn(`⚠️ Non-admin user ${userInfo._id} with role ${userInfo.role} attempted to access pending posts`);
      throw new Error('Access denied. Admin role required.');
    }

    const config = getAuthConfig(userInfo);

    console.log('🔄 Fetching pending posts...');
    const { data } = await safeApiCall(
      () => axiosInstance.get('/api/forum/admin/pending', {
        params: { page, limit },
        ...config,
      }),
      'Fetch pending posts failed'
    );

    console.log(`✅ Found ${data.posts?.length || 0} pending posts`);

    dispatch({
      type: FORUM_POST_LIST_SUCCESS,
      payload: {
        posts: data.posts || [],
        page: data.page || 1,
        pages: data.pages || 1,
        total: data.total || 0,
      },
    });

    return Promise.resolve(data);
  } catch (error) {
    console.error('❌ Error in getPendingPosts:', error);

    let message = 'Failed to fetch pending posts';
    if (error.response?.status === 401) {
      message = 'Authentication failed. Please log in again.';
    } else if (error.response?.status === 403) {
      message = 'Access denied. Admin privileges required.';
    } else {
      message = handleApiError(error);
    }

    dispatch({
      type: FORUM_POST_LIST_FAIL,
      payload: message,
    });

    return Promise.reject(message);
  }
};

// Get Post by ID
export const getPostById = (id) => async (dispatch, getState) => {
  try {
    dispatch({ type: FORUM_POST_DETAILS_REQUEST });

    const {
      userLogin: { userInfo },
    } = getState();
    const config = userInfo?.token ? getAuthConfig(userInfo) : {};

    const { data } = await safeApiCall(
      () => axiosInstance.get(`/api/forum/${id}`, config),
      'Fetch post by ID failed'
    );

    dispatch({
      type: FORUM_POST_DETAILS_SUCCESS,
      payload: data,
    });

    return Promise.resolve(data);
  } catch (error) {
    const message = handleApiError(error);
    dispatch({
      type: FORUM_POST_DETAILS_FAIL,
      payload: message,
    });
    return Promise.reject(message);
  }
};

// Like/Unlike Post
export const likePost = (postId) => async (dispatch, getState) => {
  try {
    dispatch({ type: FORUM_POST_LIKE_REQUEST });

    const {
      userLogin: { userInfo },
    } = getState();
    const config = getAuthConfig(userInfo);

    const { data } = await safeApiCall(
      () => axiosInstance.post(`/api/forum/${postId}/like`, {}, config),
      'Like post failed'
    );

    dispatch({
      type: FORUM_POST_LIKE_SUCCESS,
      payload: data,
    });

    return Promise.resolve(data);
  } catch (error) {
    const message = handleApiError(error);
    dispatch({
      type: FORUM_POST_LIKE_FAIL,
      payload: message,
    });
    return Promise.reject(message);
  }
};

// Add Comment/Reply
export const addComment = (postId, content) => async (dispatch, getState) => {
  try {
    dispatch({ type: FORUM_POST_REPLY_REQUEST });

    const {
      userLogin: { userInfo },
    } = getState();
    const config = getAuthConfig(userInfo);

    console.log(`Adding comment to post ${postId}:`, content);

    const { data } = await safeApiCall(
      () => axiosInstance.post(`/api/forum/${postId}/reply`, { content }, config),
      'Add comment failed'
    );

    console.log('Comment added successfully:', data);

    dispatch({
      type: FORUM_POST_REPLY_SUCCESS,
      payload: data,
    });

    return Promise.resolve(data);
  } catch (error) {
    console.error('Error adding comment:', error);
    const message = handleApiError(error);
    dispatch({
      type: FORUM_POST_REPLY_FAIL,
      payload: message,
    });
    return Promise.reject(message);
  }
};

// Approve/Reject Post (Admin)
export const approvePost = (postId, status) => async (dispatch, getState) => {
  try {
    dispatch({ type: FORUM_POST_APPROVE_REQUEST });

    const {
      userLogin: { userInfo },
    } = getState();
    const config = getAuthConfig(userInfo);

    const { data } = await safeApiCall(
      () => axiosInstance.put(`/api/forum/admin/${postId}/approve`, { status }, config),
      'Approve post failed'
    );

    dispatch({
      type: FORUM_POST_APPROVE_SUCCESS,
      payload: data,
    });

    return Promise.resolve(data);
  } catch (error) {
    const message = handleApiError(error);
    dispatch({
      type: FORUM_POST_APPROVE_FAIL,
      payload: message,
    });
    return Promise.reject(message);
  }
};

// Report Post - Enhanced with comprehensive data
export const reportPost = (postId, reportData) => async (dispatch, getState) => {
  try {
    dispatch({ type: FORUM_POST_REPORT_REQUEST });

    const {
      userLogin: { userInfo },
    } = getState();
    const config = getAuthConfig(userInfo);

    const { data } = await safeApiCall(
      () => axiosInstance.post(`/api/forum/${postId}/report`, reportData, config),
      'Report post failed'
    );

    dispatch({
      type: FORUM_POST_REPORT_SUCCESS,
      payload: data,
    });

    return Promise.resolve(data);
  } catch (error) {
    const message = handleApiError(error);
    dispatch({
      type: FORUM_POST_REPORT_FAIL,
      payload: message,
    });
    return Promise.reject(message);
  }
};

// Delete Post
export const deleteForumPost = (id) => async (dispatch, getState) => {
  try {
    dispatch({ type: FORUM_POST_DELETE_REQUEST });

    const {
      userLogin: { userInfo },
    } = getState();
    const config = getAuthConfig(userInfo);

    await safeApiCall(
      () => axiosInstance.delete(`/api/forum/${id}`, config),
      'Delete post failed'
    );

    dispatch({
      type: FORUM_POST_DELETE_SUCCESS,
      payload: id,
    });

    return Promise.resolve();
  } catch (error) {
    const message = handleApiError(error);
    dispatch({
      type: FORUM_POST_DELETE_FAIL,
      payload: message,
    });
    return Promise.reject(message);
  }
};

// Pin/Unpin Post (Admin)
export const pinPost = (id) => async (dispatch, getState) => {
  try {
    dispatch({ type: FORUM_POST_PIN_REQUEST });

    const {
      userLogin: { userInfo },
    } = getState();
    const config = getAuthConfig(userInfo);

    const { data } = await safeApiCall(
      () => axiosInstance.put(`/api/forum/admin/${id}/pin`, {}, config),
      'Pin post failed'
    );

    dispatch({
      type: FORUM_POST_PIN_SUCCESS,
      payload: data,
    });

    return Promise.resolve(data);
  } catch (error) {
    const message = handleApiError(error);
    dispatch({
      type: FORUM_POST_PIN_FAIL,
      payload: message,
    });
    return Promise.reject(message);
  }
};

// Moderate forum comment (Admin)
export const moderateForumComment = (postId, commentId, action) => async (dispatch, getState) => {
  try {
    dispatch({ type: FORUM_COMMENT_MODERATE_REQUEST });

    const {
      userLogin: { userInfo },
    } = getState();
    const config = getAuthConfig(userInfo);

    const { data } = await safeApiCall(
      () => axiosInstance.post(
        `/api/forum/admin/${postId}/comments/${commentId}/moderate`,
        { action },
        config
      ),
      'Moderate comment failed'
    );

    dispatch({
      type: FORUM_COMMENT_MODERATE_SUCCESS,
      payload: data,
    });

    return Promise.resolve(data);
  } catch (error) {
    const message = handleApiError(error);
    dispatch({
      type: FORUM_COMMENT_MODERATE_FAIL,
      payload: message,
    });
    return Promise.reject(message);
  }
};

// Report forum comment
export const reportForumComment = (postId, commentId, reason = '') => async (dispatch, getState) => {
  try {
    dispatch({ type: FORUM_COMMENT_REPORT_REQUEST });

    const {
      userLogin: { userInfo },
    } = getState();
    const config = getAuthConfig(userInfo);

    const { data } = await safeApiCall(
      () => axiosInstance.post(
        `/api/forum/${postId}/comments/${commentId}/report`,
        { reason },
        config
      ),
      'Report comment failed'
    );

    dispatch({
      type: FORUM_COMMENT_REPORT_SUCCESS,
      payload: data,
    });

    return Promise.resolve(data);
  } catch (error) {
    const message = handleApiError(error);
    dispatch({
      type: FORUM_COMMENT_REPORT_FAIL,
      payload: message,
    });
    return Promise.reject(message);
  }
};

// Get flagged forum comments (Admin)
export const getFlaggedForumComments = (page = 1, limit = 20) => async (dispatch, getState) => {
  try {
    dispatch({ type: FORUM_FLAGGED_COMMENTS_REQUEST });

    const {
      userLogin: { userInfo },
    } = getState();

    if (!userInfo || userInfo.role !== 'admin') {
      throw new Error('Access denied. Admin role required.');
    }

    const config = getAuthConfig(userInfo);

    const { data } = await safeApiCall(
      () => axiosInstance.get('/api/forum/admin/moderation/flagged-comments', {
        params: { page, limit },
        ...config,
      }),
      'Fetch flagged comments failed'
    );

    dispatch({
      type: FORUM_FLAGGED_COMMENTS_SUCCESS,
      payload: {
        comments: data.comments || [],
        page: data.page || 1,
        pages: data.pages || 1,
        total: data.total || 0,
      },
    });

    return Promise.resolve(data);
  } catch (error) {
    const message = handleApiError(error);
    dispatch({
      type: FORUM_FLAGGED_COMMENTS_FAIL,
      payload: message,
    });
    return Promise.reject(message);
  }
};

export const getForumPostsLive = (page = 1, limit = 50, category = '', search = '', filters = {}) => async (dispatch, getState) => {
  try {
    dispatch({ type: FORUM_POST_LIST_LIVE_REQUEST });
    const { userLogin: { userInfo } } = getState();
    const config = userInfo?.token ? getAuthConfig(userInfo) : {};
    const params = { page, limit, status: 'approved', ...filters };
    if (category) params.category = category;
    if (search) params.search = search;

    const { data } = await safeApiCall(
      () => axiosInstance.get('/api/forum', { params, ...config }),
      'Fetch live forum posts failed'
    );

    dispatch({
      type: FORUM_POST_LIST_LIVE_SUCCESS,
      payload: { posts: data.posts || [], page: data.page, pages: data.pages, total: data.total }
    });

    return Promise.resolve(data);
  } catch (error) {
    const message = handleApiError(error);
    dispatch({ type: FORUM_POST_LIST_LIVE_FAIL, payload: message });
    return Promise.reject(message);
  }
};
//  NEW: Get all reports (Admin only)
export const getReports = (filters = {}) => async (dispatch, getState) => {
  try {
    dispatch({ type: FORUM_REPORTS_LIST_REQUEST });

    const {
      userLogin: { userInfo },
    } = getState();

    if (!userInfo || userInfo.role !== 'admin') {
      throw new Error('Admin access required');
    }

    const config = getAuthConfig(userInfo);
    const params = new URLSearchParams(filters).toString();

    const { data } = await safeApiCall(
      () => axiosInstance.get(`/api/forum/admin/reports?${params}`, config),
      'Fetch reports failed'
    );

    dispatch({
      type: FORUM_REPORTS_LIST_SUCCESS,
      payload: data,
    });

    return Promise.resolve(data);
  } catch (error) {
    const message = handleApiError(error);
    dispatch({
      type: FORUM_REPORTS_LIST_FAIL,
      payload: message,
    });
    return Promise.reject(message);
  }
};

//  NEW: Toggle bookmark on post
export const toggleBookmark = (postId) => async (dispatch, getState) => {
  try {
    dispatch({ type: FORUM_BOOKMARK_REQUEST });

    const {
      userLogin: { userInfo },
    } = getState();
    const config = getAuthConfig(userInfo);

    const { data } = await safeApiCall(
      () => axiosInstance.post(`/api/forum/${postId}/bookmark`, {}, config),
      'Bookmark action failed'
    );

    dispatch({
      type: FORUM_BOOKMARK_SUCCESS,
      payload: data,
    });

    return Promise.resolve(data);
  } catch (error) {
    const message = handleApiError(error);
    dispatch({
      type: FORUM_BOOKMARK_FAIL,
      payload: message,
    });
    return Promise.reject(message);
  }
};

//  NEW: Get user's bookmarked posts
export const getUserBookmarks = (page = 1, limit = 20) => async (dispatch, getState) => {
  try {
    dispatch({ type: FORUM_BOOKMARKS_LIST_REQUEST });

    const {
      userLogin: { userInfo },
    } = getState();
    const config = getAuthConfig(userInfo);

    const { data } = await safeApiCall(
      () => axiosInstance.get(`/api/forum/bookmarks?page=${page}&limit=${limit}`, config),
      'Fetch bookmarks failed'
    );

    dispatch({
      type: FORUM_BOOKMARKS_LIST_SUCCESS,
      payload: data,
    });

    return Promise.resolve(data);
  } catch (error) {
    const message = handleApiError(error);
    dispatch({
      type: FORUM_BOOKMARKS_LIST_FAIL,
      payload: message,
    });
    return Promise.reject(message);
  }
};

// NEW: Share Post (Increment count)
export const sharePost = (postId) => async (dispatch) => {
  try {
    dispatch({ type: FORUM_POST_SHARE_REQUEST });
    const { data } = await axiosInstance.post(`/api/forum/${postId}/share`);
    dispatch({ type: FORUM_POST_SHARE_SUCCESS, payload: data });
    return Promise.resolve(data);
  } catch (error) {
    const message = handleApiError(error);
    dispatch({ type: FORUM_POST_SHARE_FAIL, payload: message });
    return Promise.reject(message);
  }
};
