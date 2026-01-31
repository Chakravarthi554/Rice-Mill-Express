import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { createSelector } from 'reselect';

// ==================== IMPORT ALL REDUCERS ====================
import {
  productListReducer, productDetailsReducer, productDeleteReducer,
  productCreateReducer, productUpdateReducer, productReviewCreateReducer,
  productSellerListReducer, productBulkUploadReducer, productAnalyticsReducer,
  sellerAnalyticsReducer, recipeSuggestionReducer,
} from './reducers/productReducers';

import { adminSettingsReducer } from './reducers/adminSettingsReducers';

import {
  userLoginReducer, userRegisterReducer, userDetailsReducer, userUpdateProfileReducer,
  userListReducer, userDeleteReducer, userUpdateReducer, userWishlistReducer,
  userChangePasswordReducer, userForgotPasswordReducer, userResetPasswordReducer,
  userResetPreferencesReducer, userLinkedAccountsReducer,
  userPaymentMethodsReducer,
  userRewardsReducer,
  userSubscriptionReducer,
  userReportProblemReducer,
  userExportDataReducer,
} from './reducers/userReducers';

import {
  orderCreateReducer, orderDetailsReducer, orderPayReducer, orderDeliverReducer,
  orderListReducer, orderListMyReducer, orderCancelReducer, orderListSellerReducer,
  orderUpdateReducer, orderDeliveryPartnersReducer, orderReportCODReducer,
  assignDeliveryPartnerReducer, uploadCODProofReducer,
} from './reducers/orderReducers';

import { cartReducer } from './reducers/cartReducers';

import {
  recipeSubmitReducer, recipeListReducer, recipeDetailsReducer, recipeApproveReducer,
  recipeRateReducer, recipeCommentReducer, recipeListMyReducer, recipeListPendingReducer,
  recipeDeleteReducer,
} from './reducers/recipeReducers';

// ✅ UPDATED FORUM IMPORTS (Added missing reducers)
import {
  forumPostCreateReducer, forumPostListReducer, forumPostDetailsReducer,
  forumPostReplyReducer, forumPostLikeReducer, forumPostApproveReducer,
  forumPostReportReducer, forumPostDeleteReducer, forumPostPinReducer,
  forumCommentModerateReducer, forumCommentReportReducer, forumFlaggedCommentsReducer, forumPostListLiveReducer,
} from './reducers/forumReducers';

import {
  socialLikeReducer, socialCommentReducer, socialCommentsListReducer,
  socialCommentApproveReducer, socialCommentDeleteReducer, socialShareReducer,
  socialCommentLikeReducer, socialCommentReplyReducer, socialRatingDistReducer,
} from './reducers/socialReducers';

import { adminMessagesReducer } from './reducers/adminMessageReducers';

// FIXED: Import only the unique reducers from adminReducers (remove duplicates)
import {
  adminDashboardStatsReducer,
  adminActivitiesReducer,
  adminPlatformOverviewReducer,
  adminRecipeAnalyticsReducer,
  adminDashboardRefreshReducer,
  searchLogsReducer,
  sellerLocationReducer,
  adminCommentsModerationReducer,
  adminAnalyticsReducer,
} from './reducers/adminReducers';

import { moderationReducer } from './reducers/moderationReducers';

import { notificationReducer } from './reducers/notificationReducer';

import {
  addressListReducer, addressAddReducer, addressUpdateReducer,
  addressDeleteReducer, addressSetDefaultReducer,
} from './reducers/addressReducers';

import {
  deliveryPartnerListReducer, deliveryPartnerActionReducer, orderListForDeliveryReducer,
} from './reducers/deliveryReducer';

import {
  razorpayOrderCreateReducer, razorpayVerifyReducer, sellerPaymentsReducer,
  paymentRecordCodReducer, payoutRequestReducer, paymentRecordReducer,
} from './reducers/paymentReducers';

import {
  kycApplicationsReducer, kycSubmitReducer, kycStatusReducer, kycReviewReducer
} from './reducers/kycReducers';

import {
  messageSendReducer, messageHistoryReducer, messageAdminReducer,
  messageFlagReducer, messageDeleteReducer, messageBlockUserReducer, messageGetReducer,
} from './reducers/messageReducers';

// ✅ ADD BULK ORDER REDUCERS
import {
  bulkOrderCreateReducer,
  bulkOrderListReducer,
  bulkOrderUpdateReducer,
} from './reducers/bulkOrderReducers';

// 🔥 NEW: Admin Payment Reducers
import {
  adminPaymentStatsReducer, adminTransactionsReducer, adminRefundReducer,
  adminPayoutReducer, adminPayoutsListReducer, adminPaymentExportReducer,
} from './reducers/adminPaymentReducers';

// ==================== HELPERS ====================
const getParsedItem = (key, defaultValue) => {
  try {
    const item = localStorage.getItem(key);
    if (!item || item === 'undefined' || item === 'null') {
      return defaultValue;
    }
    return JSON.parse(item);
  } catch (e) {
    console.error(`Error parsing ${key} from localStorage:`, e);
    // Clear invalid data
    localStorage.removeItem(key);
    return defaultValue;
  }
};

// ==================== INITIAL STATE ====================
const cartItemsFromStorage = getParsedItem('cartItems', []);
const wishlistItemsFromStorage = getParsedItem('wishlistItems', []);
const userInfoFromStorage = getParsedItem('userInfo', null);
const shippingAddressFromStorage = getParsedItem('shippingAddress', {});

// ✅ FIXED: Enhanced initial state with proper defaults
const initialState = {
  cart: {
    cartItems: cartItemsFromStorage,
    shippingAddress: shippingAddressFromStorage,
    loading: false,
    error: null
  },
  userLogin: {
    userInfo: userInfoFromStorage,
    loading: false,
    error: null
  },
  userWishlist: {
    wishlistItems: wishlistItemsFromStorage,
    loading: false,
    error: null
  },
  recipeList: { recipes: [], loading: false, error: null, page: 1, pages: 1, total: 0 },
  recipeListMy: { recipes: [], loading: false, error: null, page: 1, pages: 1, total: 0 },
  recipeListPending: { recipes: [], loading: false, error: null, page: 1, pages: 1, total: 0 },
  forumPostList: { posts: [], loading: false, error: null, page: 1, pages: 1, total: 0 },
  adminDashboardStats: { stats: {}, recentActivities: {}, loading: false, error: null },
  adminCommentsModeration: { comments: [], loading: false, error: null, page: 1, pages: 1, total: 0 },
  sellerPayments: { payments: [], balance: {}, payoutHistory: [], loading: false, error: null },

  // ✅ ADD BULK ORDER INITIAL STATE
  bulkOrderCreate: { loading: false, success: false, error: null, bulkOrder: null },
  bulkOrderList: { loading: false, bulkOrders: [], error: null },
  bulkOrderUpdate: { loading: false, success: false, error: null, bulkOrder: null },

  // 🔥 NEW: Admin Payment Initial State
  adminPaymentStats: { stats: {}, loading: false, error: null },
  adminTransactions: { transactions: [], loading: false, error: null, page: 1, pages: 1, total: 0 },
  adminPayoutsList: { payouts: [], loading: false, error: null, page: 1, pages: 1, total: 0 },
};

// ==================== ROOT REDUCER ====================
const rootReducer = combineReducers({
  // User
  userLogin: userLoginReducer,
  userRegister: userRegisterReducer,
  userDetails: userDetailsReducer,
  userUpdateProfile: userUpdateProfileReducer,
  userList: userListReducer,
  userDelete: userDeleteReducer,
  userUpdate: userUpdateReducer,
  userWishlist: userWishlistReducer,
  userChangePassword: userChangePasswordReducer,
  userForgotPassword: userForgotPasswordReducer,
  userResetPassword: userResetPasswordReducer,
  userResetPreferences: userResetPreferencesReducer,
  userLinkedAccounts: userLinkedAccountsReducer,
  userPaymentMethods: userPaymentMethodsReducer,
  userRewards: userRewardsReducer,
  userSubscription: userSubscriptionReducer,
  userReportProblem: userReportProblemReducer,
  userExportData: userExportDataReducer,

  // Product
  productList: productListReducer,
  productDetails: productDetailsReducer,
  productDelete: productDeleteReducer,
  productCreate: productCreateReducer,
  productUpdate: productUpdateReducer,
  productReviewCreate: productReviewCreateReducer,
  productSellerList: productSellerListReducer,
  productBulkUpload: productBulkUploadReducer,
  productAnalytics: productAnalyticsReducer,
  sellerAnalytics: sellerAnalyticsReducer,

  // Cart
  cart: cartReducer,

  // ✅ ADD BULK ORDER REDUCERS
  bulkOrderCreate: bulkOrderCreateReducer,
  bulkOrderList: bulkOrderListReducer,
  bulkOrderUpdate: bulkOrderUpdateReducer,

  adminMessages: adminMessagesReducer,

  // Orders
  orderCreate: orderCreateReducer,
  orderDetails: orderDetailsReducer,
  orderPay: orderPayReducer,
  orderDeliver: orderDeliverReducer,
  orderList: orderListReducer,
  orderListMy: orderListMyReducer,
  orderCancel: orderCancelReducer,
  orderListSeller: orderListSellerReducer,
  orderUpdate: orderUpdateReducer,
  orderDeliveryPartners: orderDeliveryPartnersReducer,
  orderReportCOD: orderReportCODReducer,
  assignDeliveryPartner: assignDeliveryPartnerReducer,
  uploadCODProof: uploadCODProofReducer,

  // Addresses
  addressList: addressListReducer,
  addressAdd: addressAddReducer,
  addressUpdate: addressUpdateReducer,
  addressDelete: addressDeleteReducer,
  addressSetDefault: addressSetDefaultReducer,

  adminSettings: adminSettingsReducer,
  moderation: moderationReducer,

  // Recipes
  recipeSubmit: recipeSubmitReducer,
  recipeList: recipeListReducer,
  recipeListMy: recipeListMyReducer,
  recipeListPending: recipeListPendingReducer,
  recipeDetails: recipeDetailsReducer,
  recipeApprove: recipeApproveReducer,
  recipeRate: recipeRateReducer,
  recipeComment: recipeCommentReducer,
  recipeDelete: recipeDeleteReducer,
  recipeSuggestion: recipeSuggestionReducer,

  // ✅ Forum with FULL MODERATION SUPPORT
  forumPostCreate: forumPostCreateReducer,
  forumPostList: forumPostListReducer,
  forumPostDetails: forumPostDetailsReducer,
  forumPostReply: forumPostReplyReducer,
  forumPostLike: forumPostLikeReducer,
  forumPostApprove: forumPostApproveReducer,
  forumPostReport: forumPostReportReducer,
  forumPostDelete: forumPostDeleteReducer,
  forumPostPin: forumPostPinReducer,
  forumCommentModerate: forumCommentModerateReducer,
  forumCommentReport: forumCommentReportReducer,
  forumFlaggedComments: forumFlaggedCommentsReducer,
  forumPostListLive: forumPostListLiveReducer,

  // Social
  socialLike: socialLikeReducer,
  socialComment: socialCommentReducer,
  socialCommentsList: socialCommentsListReducer,
  socialCommentApprove: socialCommentApproveReducer,
  socialCommentDelete: socialCommentDeleteReducer,
  socialShare: socialShareReducer,
  socialCommentLike: socialCommentLikeReducer,
  socialCommentReply: socialCommentReplyReducer,
  socialRatingDist: socialRatingDistReducer,

  // Admin - FIXED: Using only unique reducers from adminReducers
  adminDashboardStats: adminDashboardStatsReducer,
  adminActivities: adminActivitiesReducer,
  adminPlatformOverview: adminPlatformOverviewReducer,
  adminRecipeAnalytics: adminRecipeAnalyticsReducer,
  adminDashboardRefresh: adminDashboardRefreshReducer,
  kycApplications: kycApplicationsReducer,
  searchLogs: searchLogsReducer,
  sellerLocation: sellerLocationReducer,
  adminCommentsModeration: adminCommentsModerationReducer,
  adminAnalytics: adminAnalyticsReducer,

  // Notification
  notification: notificationReducer,

  // Delivery
  deliveryPartnerList: deliveryPartnerListReducer,
  deliveryPartnerAction: deliveryPartnerActionReducer,
  orderListForDelivery: orderListForDeliveryReducer,

  // KYC
  kycSubmit: kycSubmitReducer,
  kycStatus: kycStatusReducer,
  kycReview: kycReviewReducer,

  // Payments
  razorpayOrderCreate: razorpayOrderCreateReducer,
  razorpayVerify: razorpayVerifyReducer,
  sellerPayments: sellerPaymentsReducer,
  paymentRecordCod: paymentRecordCodReducer,
  payoutRequest: payoutRequestReducer,
  paymentRecord: paymentRecordReducer,

  // Messages
  messageSend: messageSendReducer,
  messageHistory: messageHistoryReducer,
  messageAdmin: messageAdminReducer,
  messageFlag: messageFlagReducer,
  messageDelete: messageDeleteReducer,
  messageBlockUser: messageBlockUserReducer,
  messageGet: messageGetReducer,

  // 🔥 NEW: Admin Payment Management
  adminPaymentStats: adminPaymentStatsReducer,
  adminTransactions: adminTransactionsReducer,
  adminRefund: adminRefundReducer,
  adminPayout: adminPayoutReducer,
  adminPayoutsList: adminPayoutsListReducer,
  adminPaymentExport: adminPaymentExportReducer,
});

// ==================== MIDDLEWARE ====================
const middleware = (getDefaultMiddleware) =>
  getDefaultMiddleware({
    serializableCheck: {
      ignoredActions: ['persist/PERSIST'],
      ignoredPaths: ['cart.cartItems', 'userLogin.userInfo'],
    },
    immutableCheck: false,
  });

// ==================== STORE ====================
const store = configureStore({
  reducer: rootReducer,
  preloadedState: initialState,
  middleware,
  devTools: process.env.NODE_ENV !== 'production',
});

// ==================== PERSIST ====================
store.subscribe(() => {
  const state = store.getState();
  try {
    // Only save valid data to localStorage
    if (state.cart.cartItems && Array.isArray(state.cart.cartItems)) {
      localStorage.setItem('cartItems', JSON.stringify(state.cart.cartItems));
    }
    if (state.cart.shippingAddress && typeof state.cart.shippingAddress === 'object') {
      localStorage.setItem('shippingAddress', JSON.stringify(state.cart.shippingAddress));
    }
    if (state.userWishlist.wishlistItems && Array.isArray(state.userWishlist.wishlistItems)) {
      localStorage.setItem('wishlistItems', JSON.stringify(state.userWishlist.wishlistItems));
    }
    if (state.userLogin.userInfo && typeof state.userLogin.userInfo === 'object') {
      localStorage.setItem('userInfo', JSON.stringify(state.userLogin.userInfo));
    }
  } catch (e) {
    console.error('Error saving to localStorage:', e);
  }
});

// ==================== SELECTORS ====================
export const selectCartItems = (state) => state.cart.cartItems;
export const selectUserInfo = (state) => state.userLogin.userInfo;
export const selectSellerPayments = (state) => state.sellerPayments;
export const selectRecipeList = (state) => state.recipeList;
export const selectForumPosts = (state) => state.forumPostList;
export const selectAdminDashboardStats = (state) => state.adminDashboardStats;
export const selectAdminCommentsModeration = (state) => state.adminCommentsModeration;
export const selectSellerAnalytics = createSelector(
  (state) => state.sellerAnalytics,
  (sellerAnalytics) => sellerAnalytics
);

// ✅ ADD BULK ORDER SELECTORS
export const selectBulkOrders = (state) => state.bulkOrderList.bulkOrders;
export const selectBulkOrderCreate = (state) => state.bulkOrderCreate;
export const selectBulkOrderUpdate = (state) => state.bulkOrderUpdate;

// 🔥 NEW: Admin Payment Selectors
export const selectAdminPaymentStats = (state) => state.adminPaymentStats;
export const selectAdminTransactions = (state) => state.adminTransactions;
export const selectAdminPayoutsList = (state) => state.adminPayoutsList;

export default store;