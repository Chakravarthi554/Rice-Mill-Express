import {
  // Dashboard Stats
  ADMIN_DASHBOARD_STATS_REQUEST,
  ADMIN_DASHBOARD_STATS_SUCCESS,
  ADMIN_DASHBOARD_STATS_FAIL,
  
  // Activities
  ADMIN_ACTIVITIES_REQUEST,
  ADMIN_ACTIVITIES_SUCCESS,
  ADMIN_ACTIVITIES_FAIL,
  
  // Platform Overview
  ADMIN_PLATFORM_OVERVIEW_REQUEST,
  ADMIN_PLATFORM_OVERVIEW_SUCCESS,
  ADMIN_PLATFORM_OVERVIEW_FAIL,
  
  // Recipe Analytics
  ADMIN_RECIPE_ANALYTICS_REQUEST,
  ADMIN_RECIPE_ANALYTICS_SUCCESS,
  ADMIN_RECIPE_ANALYTICS_FAIL,
  
  // Dashboard Refresh
  ADMIN_DASHBOARD_REFRESH_REQUEST,
  ADMIN_DASHBOARD_REFRESH_SUCCESS,
  ADMIN_DASHBOARD_REFRESH_FAIL,
  
  // User Management
  USER_LIST_REQUEST,
  USER_LIST_SUCCESS,
  USER_LIST_FAIL,
  
  // Order Management
  ORDER_LIST_REQUEST,
  ORDER_LIST_SUCCESS,
  ORDER_LIST_FAIL,
  
  // KYC Management
  KYC_APPLICATIONS_REQUEST,
  KYC_APPLICATIONS_SUCCESS,
  KYC_APPLICATIONS_FAIL,
  APPROVE_KYC_REQUEST,
  APPROVE_KYC_SUCCESS,
  APPROVE_KYC_FAIL,
  REJECT_KYC_REQUEST,
  REJECT_KYC_SUCCESS,
  REJECT_KYC_FAIL,
  
  // Search Logs
  SEARCH_LOGS_REQUEST,
  SEARCH_LOGS_SUCCESS,
  SEARCH_LOGS_FAIL,
  
  // Seller Location
  SELLER_LOCATION_UPDATE_REQUEST,
  SELLER_LOCATION_UPDATE_SUCCESS,
  SELLER_LOCATION_UPDATE_FAIL,
  
  // Comments Moderation
  ADMIN_COMMENTS_MODERATION_REQUEST,
  ADMIN_COMMENTS_MODERATION_SUCCESS,
  ADMIN_COMMENTS_MODERATION_FAIL,
} from '../constants/adminConstants';

// Initial States
const initialDashboardState = {
  loading: false,
  stats: {},
  topSellingRice: [],
  topSellers: [],
  monthlyRevenue: [],
  growthPercentage: 0,
  systemHealth: {},
  error: null,
};

const initialActivitiesState = {
  loading: false,
  activities: [],
  error: null,
};

const initialPlatformOverviewState = {
  loading: false,
  overview: {},
  error: null,
};

const initialRecipeAnalyticsState = {
  loading: false,
  analytics: {},
  error: null,
};

const initialDashboardRefreshState = {
  loading: false,
  success: false,
  error: null,
};

const initialUserListState = {
  loading: false,
  users: [],
  error: null,
};

const initialOrderListState = {
  loading: false,
  orders: [],
  error: null,
};

const initialKycApplicationsState = {
  loading: false,
  applications: [],
  error: null,
};

const initialSearchLogsState = {
  loading: false,
  logs: [],
  error: null,
};

const initialSellerLocationState = {
  loading: false,
  success: false,
  error: null,
};

const initialCommentsModerationState = {
  loading: false,
  comments: [],
  total: 0,
  pages: 0,
  page: 1,
  error: null,
};

const initialAnalyticsState = {
  loading: false,
  data: {},
  error: null,
};
// Dashboard Stats Reducer
export const adminDashboardStatsReducer = (state = initialDashboardState, action) => {
  switch (action.type) {
    case ADMIN_DASHBOARD_STATS_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };
    case ADMIN_DASHBOARD_STATS_SUCCESS:
      return {
        ...state,
        loading: false,
        stats: action.payload.stats || {},
        topSellingRice: action.payload.topSellingRice || [],
        topSellers: action.payload.topSellers || [],
        monthlyRevenue: action.payload.monthlyRevenue || [],
        growthPercentage: action.payload.growthPercentage || 0,
        systemHealth: action.payload.systemHealth || {},
        error: null,
      };
    case ADMIN_DASHBOARD_STATS_FAIL:
      return {
        ...state,
        loading: false,
        error: action.payload,
        stats: {},
        topSellingRice: [],
        topSellers: [],
        monthlyRevenue: [],
        growthPercentage: 0,
        systemHealth: {},
      };
    default:
      return state;
  }
};

// Activities Reducer - FIXED: Using correct constants
export const adminActivitiesReducer = (state = initialActivitiesState, action) => {
  switch (action.type) {
    case ADMIN_ACTIVITIES_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };
    case ADMIN_ACTIVITIES_SUCCESS:
      return {
        ...state,
        loading: false,
        activities: action.payload.activities || [],
        error: null,
      };
    case ADMIN_ACTIVITIES_FAIL:
      return {
        ...state,
        loading: false,
        error: action.payload,
        activities: [],
      };
    default:
      return state;
  }
};

// Platform Overview Reducer
export const adminPlatformOverviewReducer = (state = initialPlatformOverviewState, action) => {
  switch (action.type) {
    case ADMIN_PLATFORM_OVERVIEW_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };
    case ADMIN_PLATFORM_OVERVIEW_SUCCESS:
      return {
        ...state,
        loading: false,
        overview: action.payload.overview || {},
        error: null,
      };
    case ADMIN_PLATFORM_OVERVIEW_FAIL:
      return {
        ...state,
        loading: false,
        error: action.payload,
        overview: {},
      };
    default:
      return state;
  }
};

// Recipe Analytics Reducer
export const adminRecipeAnalyticsReducer = (state = initialRecipeAnalyticsState, action) => {
  switch (action.type) {
    case ADMIN_RECIPE_ANALYTICS_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };
    case ADMIN_RECIPE_ANALYTICS_SUCCESS:
      return {
        ...state,
        loading: false,
        analytics: action.payload.analytics || {},
        error: null,
      };
    case ADMIN_RECIPE_ANALYTICS_FAIL:
      return {
        ...state,
        loading: false,
        error: action.payload,
        analytics: {},
      };
    default:
      return state;
  }
};

// Dashboard Refresh Reducer
export const adminDashboardRefreshReducer = (state = initialDashboardRefreshState, action) => {
  switch (action.type) {
    case ADMIN_DASHBOARD_REFRESH_REQUEST:
      return {
        ...state,
        loading: true,
        success: false,
        error: null,
      };
    case ADMIN_DASHBOARD_REFRESH_SUCCESS:
      return {
        ...state,
        loading: false,
        success: true,
        error: null,
      };
    case ADMIN_DASHBOARD_REFRESH_FAIL:
      return {
        ...state,
        loading: false,
        success: false,
        error: action.payload,
      };
    default:
      return state;
  }
};

// User List Reducer
export const userListReducer = (state = initialUserListState, action) => {
  switch (action.type) {
    case USER_LIST_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };
    case USER_LIST_SUCCESS:
      return {
        ...state,
        loading: false,
        users: action.payload,
        error: null,
      };
    case USER_LIST_FAIL:
      return {
        ...state,
        loading: false,
        error: action.payload,
        users: [],
      };
    default:
      return state;
  }
};

// Order List Reducer
export const orderListReducer = (state = initialOrderListState, action) => {
  switch (action.type) {
    case ORDER_LIST_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };
    case ORDER_LIST_SUCCESS:
      return {
        ...state,
        loading: false,
        orders: action.payload,
        error: null,
      };
    case ORDER_LIST_FAIL:
      return {
        ...state,
        loading: false,
        error: action.payload,
        orders: [],
      };
    default:
      return state;
  }
};

// KYC Applications Reducer
export const kycApplicationsReducer = (state = initialKycApplicationsState, action) => {
  switch (action.type) {
    case KYC_APPLICATIONS_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };
    case KYC_APPLICATIONS_SUCCESS:
      return {
        ...state,
        loading: false,
        applications: action.payload,
        error: null,
      };
    case KYC_APPLICATIONS_FAIL:
      return {
        ...state,
        loading: false,
        error: action.payload,
        applications: [],
      };
    case APPROVE_KYC_REQUEST:
    case REJECT_KYC_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };
    case APPROVE_KYC_SUCCESS:
    case REJECT_KYC_SUCCESS:
      return {
        ...state,
        loading: false,
        error: null,
      };
    case APPROVE_KYC_FAIL:
    case REJECT_KYC_FAIL:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };
    default:
      return state;
  }
};

// Search Logs Reducer
export const searchLogsReducer = (state = initialSearchLogsState, action) => {
  switch (action.type) {
    case SEARCH_LOGS_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };
    case SEARCH_LOGS_SUCCESS:
      return {
        ...state,
        loading: false,
        logs: action.payload,
        error: null,
      };
    case SEARCH_LOGS_FAIL:
      return {
        ...state,
        loading: false,
        error: action.payload,
        logs: [],
      };
    default:
      return state;
  }
};

// Seller Location Reducer
export const sellerLocationReducer = (state = initialSellerLocationState, action) => {
  switch (action.type) {
    case SELLER_LOCATION_UPDATE_REQUEST:
      return {
        ...state,
        loading: true,
        success: false,
        error: null,
      };
    case SELLER_LOCATION_UPDATE_SUCCESS:
      return {
        ...state,
        loading: false,
        success: true,
        error: null,
      };
    case SELLER_LOCATION_UPDATE_FAIL:
      return {
        ...state,
        loading: false,
        success: false,
        error: action.payload,
      };
    default:
      return state;
  }
};

// Comments Moderation Reducer
export const adminCommentsModerationReducer = (state = initialCommentsModerationState, action) => {
  switch (action.type) {
    case ADMIN_COMMENTS_MODERATION_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };
    case ADMIN_COMMENTS_MODERATION_SUCCESS:
      return {
        ...state,
        loading: false,
        comments: action.payload.comments || [],
        total: action.payload.total || 0,
        pages: action.payload.pages || 0,
        page: action.payload.page || 1,
        error: null,
      };
    case ADMIN_COMMENTS_MODERATION_FAIL:
      return {
        ...state,
        loading: false,
        error: action.payload,
        comments: [],
        total: 0,
        pages: 0,
        page: 1,
      };
    default:
      return state;
  }
};

export const adminAnalyticsReducer = (state = initialAnalyticsState, action) => {
  switch (action.type) {
    case 'ADMIN_ANALYTICS_REQUEST':
      return {
        ...state,
        loading: true,
        error: null,
      };
    case 'ADMIN_ANALYTICS_SUCCESS':
      return {
        ...state,
        loading: false,
        data: action.payload,
        error: null,
      };
    case 'ADMIN_ANALYTICS_FAIL':
      return {
        ...state,
        loading: false,
        error: action.payload,
        data: {},
      };
    default:
      return state;
  }
};