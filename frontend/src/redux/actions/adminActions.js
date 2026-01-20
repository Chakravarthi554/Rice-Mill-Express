import {
  USER_LIST_REQUEST, USER_LIST_SUCCESS, USER_LIST_FAIL,
  USER_DELETE_REQUEST, USER_DELETE_SUCCESS, USER_DELETE_FAIL,
  USER_UPDATE_REQUEST, USER_UPDATE_SUCCESS, USER_UPDATE_FAIL,
} from '../constants/userConstants';

import {
  ORDER_LIST_REQUEST, ORDER_LIST_SUCCESS, ORDER_LIST_FAIL,
  ORDER_DETAILS_REQUEST, ORDER_DETAILS_SUCCESS, ORDER_DETAILS_FAIL,
} from '../constants/orderConstants';

import {
  KYC_APPLICATIONS_REQUEST, KYC_APPLICATIONS_SUCCESS, KYC_APPLICATIONS_FAIL,
  APPROVE_KYC_REQUEST, APPROVE_KYC_SUCCESS, APPROVE_KYC_FAIL,
  REJECT_KYC_REQUEST, REJECT_KYC_SUCCESS, REJECT_KYC_FAIL,
  SEARCH_LOGS_REQUEST, SEARCH_LOGS_SUCCESS, SEARCH_LOGS_FAIL,
  SELLER_LOCATION_UPDATE_REQUEST, SELLER_LOCATION_UPDATE_SUCCESS, SELLER_LOCATION_UPDATE_FAIL,
  ADMIN_COMMENTS_MODERATION_REQUEST,
  ADMIN_COMMENTS_MODERATION_SUCCESS,
  ADMIN_COMMENTS_MODERATION_FAIL,
  ADMIN_DASHBOARD_STATS_REQUEST,
  ADMIN_DASHBOARD_STATS_SUCCESS,
  ADMIN_DASHBOARD_STATS_FAIL,
  ADMIN_PLATFORM_OVERVIEW_REQUEST,
  ADMIN_PLATFORM_OVERVIEW_SUCCESS,
  ADMIN_PLATFORM_OVERVIEW_FAIL,
  ADMIN_RECIPE_ANALYTICS_REQUEST,
  ADMIN_RECIPE_ANALYTICS_SUCCESS,
  ADMIN_RECIPE_ANALYTICS_FAIL,
  ADMIN_ACTIVITIES_REQUEST,
  ADMIN_ACTIVITIES_SUCCESS,
  ADMIN_ACTIVITIES_FAIL,
  ADMIN_DASHBOARD_REFRESH_REQUEST,
  ADMIN_DASHBOARD_REFRESH_SUCCESS,
  ADMIN_DASHBOARD_REFRESH_FAIL,
} from '../constants/adminConstants';

import api from '../../utils/api';
import { handleApiError } from '../../utils/handleApiError';

// ✅ FIXED: Get users with correct endpoint and better error handling
export const listUsers = () => async (dispatch, getState) => {
  try {
    dispatch({ type: USER_LIST_REQUEST });
    const { userLogin: { userInfo } } = getState();

    const config = {
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
      },
    };

    console.log('🔄 Fetching users...');
    const { data } = await api.get('/api/admin/users', config);
    console.log('✅ Users received:', data?.length || 0);

    dispatch({
      type: USER_LIST_SUCCESS,
      payload: Array.isArray(data) ? data : (data.users || [])
    });

    return { success: true, data: Array.isArray(data) ? data : (data.users || []) };
  } catch (error) {
    console.error('❌ Users error:', error.response?.data || error.message);
    const errorMessage = handleApiError(error);

    dispatch({
      type: USER_LIST_FAIL,
      payload: errorMessage
    });

    return { success: false, error: errorMessage };
  }
};

export const deleteUser = (id) => async (dispatch, getState) => {
  try {
    dispatch({ type: USER_DELETE_REQUEST });
    const { userLogin: { userInfo } } = getState();
    const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
    await api.delete(`/api/users/${id}`, config);
    dispatch({ type: USER_DELETE_SUCCESS });
    dispatch(listUsers());
    return { success: true };
  } catch (error) {
    const message = handleApiError(error);
    dispatch({ type: USER_DELETE_FAIL, payload: message });
    return { success: false, error: message };
  }
};

export const updateUser = (user) => async (dispatch, getState) => {
  try {
    dispatch({ type: USER_UPDATE_REQUEST });
    const { userLogin: { userInfo } } = getState();
    const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
    const { data } = await api.put(`/api/users/${user._id}`, user, config);
    dispatch({ type: USER_UPDATE_SUCCESS });
    dispatch(listUsers());
    return { success: true, data };
  } catch (error) {
    const message = handleApiError(error);
    dispatch({ type: USER_UPDATE_FAIL, payload: message });
    return { success: false, error: message };
  }
};

// ✅ FIXED: Get orders with correct endpoint
export const listOrders = () => async (dispatch, getState) => {
  try {
    dispatch({ type: ORDER_LIST_REQUEST });
    const { userLogin: { userInfo } } = getState();

    const config = {
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
      },
    };

    console.log('🔄 Fetching orders...');
    const { data } = await api.get('/api/admin/orders', config);
    console.log('✅ Orders received:', data?.length || 0);

    dispatch({
      type: ORDER_LIST_SUCCESS,
      payload: Array.isArray(data) ? data : (data.orders || [])
    });

    return { success: true, data: Array.isArray(data) ? data : (data.orders || []) };
  } catch (error) {
    console.error('❌ Orders error:', error.response?.data || error.message);
    const errorMessage = handleApiError(error);

    dispatch({
      type: ORDER_LIST_FAIL,
      payload: errorMessage
    });

    return { success: false, error: errorMessage };
  }
};

export const getOrderDetails = (id) => async (dispatch, getState) => {
  try {
    dispatch({ type: ORDER_DETAILS_REQUEST });
    const { userLogin: { userInfo } } = getState();
    const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
    const { data } = await api.get(`/api/orders/${id}`, config);
    dispatch({ type: ORDER_DETAILS_SUCCESS, payload: data });
    return { success: true, data };
  } catch (error) {
    const message = handleApiError(error);
    dispatch({ type: ORDER_DETAILS_FAIL, payload: message });
    return { success: false, error: message };
  }
};

export const getOrdersList = () => async (dispatch) => {
  try {
    dispatch({ type: ORDER_LIST_REQUEST });

    const response = await api.get('/api/admin/orders');

    dispatch({
      type: ORDER_LIST_SUCCESS,
      payload: response.data,
    });

    return { success: true, data: response.data };
  } catch (error) {
    const errorMessage = handleApiError(error);
    dispatch({
      type: ORDER_LIST_FAIL,
      payload: errorMessage,
    });

    return { success: false, error: errorMessage };
  }
};

export const getKycApplications = () => async (dispatch) => {
  try {
    dispatch({ type: KYC_APPLICATIONS_REQUEST });

    const response = await api.get('/api/kyc/applications');

    dispatch({
      type: KYC_APPLICATIONS_SUCCESS,
      payload: response.data,
    });

    return { success: true, data: response.data };
  } catch (error) {
    const errorMessage = handleApiError(error);
    dispatch({
      type: KYC_APPLICATIONS_FAIL,
      payload: errorMessage,
    });

    return { success: false, error: errorMessage };
  }
};

export const getUsersList = () => async (dispatch) => {
  try {
    dispatch({ type: USER_LIST_REQUEST });

    const response = await api.get('/api/admin/users');

    dispatch({
      type: USER_LIST_SUCCESS,
      payload: response.data,
    });

    return { success: true, data: response.data };
  } catch (error) {
    const errorMessage = handleApiError(error);
    dispatch({
      type: USER_LIST_FAIL,
      payload: errorMessage,
    });

    return { success: false, error: errorMessage };
  }
};

// ✅ FIXED: KYC applications with better error handling
export const listKycApplications = () => async (dispatch, getState) => {
  try {
    dispatch({ type: KYC_APPLICATIONS_REQUEST });
    const { userLogin: { userInfo } } = getState();

    const config = {
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
      },
    };

    const { data } = await api.get('/api/kyc/applications', config);
    dispatch({ type: KYC_APPLICATIONS_SUCCESS, payload: data });

    return { success: true, data };
  } catch (error) {
    const errorMessage = handleApiError(error);
    dispatch({
      type: KYC_APPLICATIONS_FAIL,
      payload: errorMessage
    });

    return { success: false, error: errorMessage };
  }
};

export const approveKycApplication = (kycId, reviewNotes) => async (dispatch, getState) => {
  try {
    dispatch({ type: APPROVE_KYC_REQUEST });
    const { userLogin: { userInfo } } = getState();

    const config = {
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
      },
    };

    const { data } = await api.put(`/api/kyc/approve/${kycId}`, { reviewNotes }, config);
    dispatch({ type: APPROVE_KYC_SUCCESS, payload: data });
    dispatch(listKycApplications());

    return { success: true, data };
  } catch (error) {
    const errorMessage = handleApiError(error);
    dispatch({
      type: APPROVE_KYC_FAIL,
      payload: errorMessage
    });

    return { success: false, error: errorMessage };
  }
};

export const rejectKycApplication = (kycId, reviewNotes) => async (dispatch, getState) => {
  try {
    dispatch({ type: REJECT_KYC_REQUEST });
    const { userLogin: { userInfo } } = getState();

    const config = {
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
      },
    };

    const { data } = await api.put(`/api/kyc/reject/${kycId}`, { reviewNotes }, config);
    dispatch({ type: REJECT_KYC_SUCCESS, payload: data });
    dispatch(listKycApplications());

    return { success: true, data };
  } catch (error) {
    const errorMessage = handleApiError(error);
    dispatch({
      type: REJECT_KYC_FAIL,
      payload: errorMessage
    });

    return { success: false, error: errorMessage };
  }
};

// ✅ FIXED: Search logs with better error handling
export const getSearchLogs = () => async (dispatch, getState) => {
  try {
    dispatch({ type: SEARCH_LOGS_REQUEST });
    const { userLogin: { userInfo } } = getState();

    const config = {
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
      },
    };

    const { data } = await api.get('/api/admin/search-logs', config);
    dispatch({ type: SEARCH_LOGS_SUCCESS, payload: data });

    return { success: true, data };
  } catch (error) {
    const errorMessage = handleApiError(error);
    dispatch({
      type: SEARCH_LOGS_FAIL,
      payload: errorMessage
    });

    return { success: false, error: errorMessage };
  }
};

export const updateSellerLocation = (locationData) => async (dispatch, getState) => {
  try {
    dispatch({ type: SELLER_LOCATION_UPDATE_REQUEST });
    const { userLogin: { userInfo } } = getState();

    const config = {
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
      },
    };

    const { data } = await api.put('/api/admin/seller-location', locationData, config);
    dispatch({ type: SELLER_LOCATION_UPDATE_SUCCESS, payload: data });

    return { success: true, data };
  } catch (error) {
    const errorMessage = handleApiError(error);
    dispatch({
      type: SELLER_LOCATION_UPDATE_FAIL,
      payload: errorMessage
    });

    return { success: false, error: errorMessage };
  }
};

// ✅ FIXED: Dashboard stats with comprehensive error handling
export const getDashboardStats = () => async (dispatch) => {
  try {
    dispatch({ type: ADMIN_DASHBOARD_STATS_REQUEST });

    console.log('🔄 Fetching comprehensive dashboard stats...');

    const response = await api.get('/api/admin/stats');

    console.log('✅ Dashboard stats received:', response.data);

    dispatch({
      type: ADMIN_DASHBOARD_STATS_SUCCESS,
      payload: response.data,
    });

    return { success: true, data: response.data };
  } catch (error) {
    console.error('❌ Dashboard stats error:', error);

    const errorMessage = handleApiError(error);

    dispatch({
      type: ADMIN_DASHBOARD_STATS_FAIL,
      payload: errorMessage,
    });

    return { success: false, error: errorMessage };
  }
};

// Get real-time activities
export const getRealTimeActivities = () => async (dispatch) => {
  try {
    dispatch({ type: ADMIN_ACTIVITIES_REQUEST });

    console.log('🔄 Fetching real-time activities...');

    const response = await api.get('/api/admin/activities');

    console.log('✅ Real-time activities received:', response.data);

    dispatch({
      type: ADMIN_ACTIVITIES_SUCCESS,
      payload: response.data,
    });

    return { success: true, data: response.data };
  } catch (error) {
    console.error('❌ Real-time activities error:', error);

    const errorMessage = handleApiError(error);

    dispatch({
      type: ADMIN_ACTIVITIES_FAIL,
      payload: errorMessage,
    });

    return { success: false, error: errorMessage };
  }
};

// ✅ FIXED: Comments moderation with better error handling
export const getCommentsForModeration = (type = '', page = 1, limit = 20) => async (dispatch, getState) => {
  try {
    dispatch({ type: ADMIN_COMMENTS_MODERATION_REQUEST });

    const { userLogin: { userInfo } } = getState();
    const config = {
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
      },
    };

    const params = { page, limit };
    if (type) params.type = type;

    console.log('🔄 Fetching comments for moderation...');
    const { data } = await api.get('/api/admin/comments/moderation', {
      params,
      ...config
    });

    console.log('✅ Comments received:', data.comments?.length || 0);

    dispatch({
      type: ADMIN_COMMENTS_MODERATION_SUCCESS,
      payload: {
        comments: data.comments || [],
        page: data.page || 1,
        pages: data.pages || 1,
        total: data.total || 0,
      },
    });

    return { success: true, data };
  } catch (error) {
    console.error('❌ Comments moderation error:', error);
    const message = handleApiError(error);
    dispatch({
      type: ADMIN_COMMENTS_MODERATION_FAIL,
      payload: message,
    });

    return { success: false, error: message };
  }
};

export const fetchAdminStats = () => async (dispatch, getState) => {
  try {
    dispatch({ type: 'ADMIN_STATS_REQUEST' });
    const { userLogin: { userInfo } } = getState();
    const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
    const { data } = await api.get('/api/admin/stats', config);
    dispatch({ type: 'ADMIN_STATS_SUCCESS', payload: data });

    return { success: true, data };
  } catch (error) {
    const errorMessage = handleApiError(error);
    dispatch({ type: 'ADMIN_STATS_FAIL', payload: errorMessage });

    return { success: false, error: errorMessage };
  }
};

export const getPlatformOverview = () => async (dispatch) => {
  try {
    dispatch({ type: ADMIN_PLATFORM_OVERVIEW_REQUEST });

    console.log('🔄 Fetching platform overview...');

    const response = await api.get('/api/admin/platform-overview');

    console.log('✅ Platform overview received:', response.data);

    dispatch({
      type: ADMIN_PLATFORM_OVERVIEW_SUCCESS,
      payload: response.data,
    });

    return { success: true, data: response.data };
  } catch (error) {
    console.error('❌ Platform overview error:', error);

    const errorMessage = handleApiError(error);

    dispatch({
      type: ADMIN_PLATFORM_OVERVIEW_FAIL,
      payload: errorMessage,
    });

    return { success: false, error: errorMessage };
  }
};

export const getRecipeAnalytics = (timeframe = 'month') => async (dispatch) => {
  try {
    dispatch({ type: ADMIN_RECIPE_ANALYTICS_REQUEST });

    console.log('🔄 Fetching recipe analytics...');

    const response = await api.get(`/api/admin/recipe-analytics?timeframe=${timeframe}`);

    console.log('✅ Recipe analytics received:', response.data);

    dispatch({
      type: ADMIN_RECIPE_ANALYTICS_SUCCESS,
      payload: response.data,
    });

    return { success: true, data: response.data };
  } catch (error) {
    console.error('❌ Recipe analytics error:', error);

    const errorMessage = handleApiError(error);

    dispatch({
      type: ADMIN_RECIPE_ANALYTICS_FAIL,
      payload: errorMessage,
    });

    return { success: false, error: errorMessage };
  }
};

export const exportAnalyticsData = (type = 'sales', timeframe = 'month') => async () => {
  try {
    console.log(`🔄 Exporting ${type} analytics data for ${timeframe}...`);

    const response = await api.get(`/api/admin/analytics/export?type=${type}&timeframe=${timeframe}`, {
      responseType: 'blob'
    });

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `analytics-${type}-${timeframe}-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    console.log('✅ Analytics data exported successfully');

    return { success: true, message: 'Data exported successfully' };
  } catch (error) {
    console.error('❌ Export analytics error:', error);

    const errorMessage = handleApiError(error);
    return { success: false, message: errorMessage };
  }
};

// Refresh all dashboard data
export const refreshDashboardData = () => async (dispatch) => {
  try {
    dispatch({ type: ADMIN_DASHBOARD_REFRESH_REQUEST });

    console.log('🔄 Refreshing all dashboard data...');

    await Promise.all([
      dispatch(getDashboardStats()),
      dispatch(getRealTimeActivities()),
      dispatch(getPlatformOverview())
    ]);

    console.log('✅ All dashboard data refreshed successfully');

    dispatch({ type: ADMIN_DASHBOARD_REFRESH_SUCCESS });

    return { success: true, message: 'Dashboard data refreshed' };
  } catch (error) {
    console.error('❌ Dashboard refresh error:', error);

    const errorMessage = handleApiError(error);
    dispatch({ type: ADMIN_DASHBOARD_REFRESH_FAIL, payload: errorMessage });
    return { success: false, message: errorMessage };
  }
};

export const getAnalyticsData = (timeframe = 'week') => async (dispatch) => {
  try {
    dispatch({ type: 'ADMIN_ANALYTICS_REQUEST' });

    console.log('🔄 Fetching analytics data...');

    const response = await api.get(`/api/admin/analytics?timeframe=${timeframe}`);

    console.log('✅ Analytics data received:', response.data);

    dispatch({
      type: 'ADMIN_ANALYTICS_SUCCESS',
      payload: response.data,
    });

    return { success: true, data: response.data };
  } catch (error) {
    console.error('❌ Analytics data error:', error);

    const errorMessage = handleApiError(error);

    dispatch({
      type: 'ADMIN_ANALYTICS_FAIL',
      payload: errorMessage,
    });

    return { success: false, error: errorMessage };
  }
};

// ✅ FIXED: Test admin API connection
export const testAdminAPI = () => async () => {
  try {
    const response = await api.get('/api/admin/health');
    return { success: true, data: response.data };
  } catch (error) {
    console.error('❌ Admin API test failed:', error);
    return {
      success: false,
      error: handleApiError(error)
    };
  }
};