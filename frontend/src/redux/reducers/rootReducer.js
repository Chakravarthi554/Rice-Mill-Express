import { combineReducers } from 'redux';

// 🛒 Product reducers
import {
  productListReducer,
  productDetailsReducer,
  productDeleteReducer,
  productCreateReducer,
  productUpdateReducer,
  productReviewCreateReducer,
  productTopRatedReducer,
  productFilterReducer,
} from './productReducers';

import { adminSettingsReducer } from './adminSettingsReducers';

// 🧺 Cart reducer
import { cartReducer } from './cartReducers';

import {
  bulkOrderCreateReducer,
  bulkOrderListReducer,
  bulkOrderUpdateReducer,
} from './bulkOrderReducers';

// 👤 User reducers
import {
  userLoginReducer,
  userRegisterReducer,
  userDetailsReducer,
  userUpdateProfileReducer,
  userListReducer,
  userDeleteReducer,
  userUpdateReducer,
  userDeleteAccountReducer,
} from './userReducers';

// 📦 Order reducers
import {
  orderCreateReducer,
  orderDetailsReducer,
  orderPayReducer,
  orderListMyReducer,
  orderListReducer,
  orderUpdateReducer,
  orderDeliverReducer,
} from './orderReducers';

// 🚚 Delivery reducers
import {
  deliveryPartnerListReducer,
  deliveryPartnerActionReducer,
  orderListForDeliveryReducer,
} from './deliveryReducers';

// 💳 Payment reducers
import {
  sellerPaymentsReducer,
  paymentRecordReducer,
  payoutRequestReducer,
} from './paymentReducers';

// 🧾 Admin reducers - 🔥 UPDATED: Added missing admin reducers
import {
  adminDashboardStatsReducer,
  adminActivitiesReducer,
  adminPlatformOverviewReducer,
  adminRecipeAnalyticsReducer,
  adminDashboardRefreshReducer,
  userListReducer,
  orderListReducer,
  kycApplicationsReducer,
  searchLogsReducer,
  sellerLocationReducer,
  adminCommentsModerationReducer,
  adminAnalyticsReducer,
} from './adminReducers';

// 🍚 Recipe reducers
import {
  recipeSubmitReducer,
  recipeListReducer,
  recipeListMyReducer,
  recipeListPendingReducer,
  recipeDetailsReducer,
  recipeApproveReducer,
  recipeRateReducer,
  recipeCommentReducer,
  recipeDeleteReducer,
  recipeCommentModerateReducer,
  recipeCommentReportReducer,
  recipeFlaggedCommentsReducer,
} from './recipeReducers';

import { kycReviewReducer } from './kycReducers';


// 💬 Forum reducers
import {
  forumPostCreateReducer,
  forumPostListReducer,
  forumPostDetailsReducer,
  forumPostReplyReducer,
  forumPostLikeReducer,
  forumPostApproveReducer,
  forumPostReportReducer,
  forumPostDeleteReducer,
  forumPostPinReducer,
  forumCommentModerateReducer,
  forumCommentReportReducer,
  forumFlaggedCommentsReducer,
} from './forumReducers';

import { adminMessagesReducer } from './adminMessageReducers';

import { moderationReducer } from './moderationReducers';

// 🌐 Social feature reducers
import {
  socialLikeReducer,
  socialCommentReducer,
  socialCommentsListReducer,
  socialCommentApproveReducer,
  socialCommentDeleteReducer,
  socialShareReducer,
} from './socialReducers';

// 📈 Analytics reducers
import {
  analyticsSalesReducer,
  analyticsUsersReducer,
  analyticsPerformanceReducer,
} from './analyticsReducers';

// 💬 Message reducers
import {
  messageSendReducer,
  messageListReducer,
  messageAdminReducer,
} from './messageReducers';

// 🔔 Notification reducers
import { notificationReducer } from './notificationReducer';

// 📍 Address reducers
import { addressReducer } from './addressReducers';

// 📋 Bulk Order reducers
import { bulkOrderReducer } from './bulkOrderReducers';

// 🔥 NEW: Admin Payment Reducers
import {
  adminPaymentStatsReducer,
  adminTransactionsReducer,
  adminRefundReducer,
  adminPayoutReducer,
  adminPayoutsListReducer,
  adminPaymentExportReducer,
} from './adminPaymentReducers';

const rootReducer = combineReducers({
  // 👤 User
  userLogin: userLoginReducer,
  userRegister: userRegisterReducer,
  userDetails: userDetailsReducer,
  userUpdateProfile: userUpdateProfileReducer,
  userList: userListReducer,
  userDelete: userDeleteReducer,
  userUpdate: userUpdateReducer,

  bulkOrderCreate: bulkOrderCreateReducer,
  bulkOrderList: bulkOrderListReducer,
  bulkOrderUpdate: bulkOrderUpdateReducer,

  // 🛒 Product
  productList: productListReducer,
  productDetails: productDetailsReducer,
  productDelete: productDeleteReducer,
  productCreate: productCreateReducer,
  productUpdate: productUpdateReducer,
  productReviewCreate: productReviewCreateReducer,
  productTopRated: productTopRatedReducer,
  productFilter: productFilterReducer, // 🔥 ADDED: Missing product filter reducer

  // 🧺 Cart
  cart: cartReducer,

  // 📦 Orders - 🔥 UPDATED: Added orderUpdateReducer
  orderCreate: orderCreateReducer,
  orderDetails: orderDetailsReducer,
  orderPay: orderPayReducer,
  orderListMy: orderListMyReducer,
  orderList: orderListReducer,
  orderUpdate: orderUpdateReducer, // 🔥 ADDED: Critical for admin order updates
  orderDeliver: orderDeliverReducer,

  kycApplications: kycApplicationsReducer,
  kycReview: kycReviewReducer,

  moderation: moderationReducer,

  // 🚚 Delivery
  deliveryPartnerList: deliveryPartnerListReducer,
  deliveryPartnerAction: deliveryPartnerActionReducer,
  orderListForDelivery: orderListForDeliveryReducer,

  // 💳 Payments
  sellerPayments: sellerPaymentsReducer,
  paymentRecord: paymentRecordReducer,
  payoutRequest: payoutRequestReducer,

  adminMessages: adminMessagesReducer,

  // 🧾 Admin - 🔥 UPDATED: Complete admin reducers
  adminDashboardStats: adminDashboardStatsReducer,
  adminActivities: adminActivitiesReducer,
  adminPlatformOverview: adminPlatformOverviewReducer,
  adminRecipeAnalytics: adminRecipeAnalyticsReducer,
  adminDashboardRefresh: adminDashboardRefreshReducer,
  userList: userListReducer,
  orderList: orderListReducer,
  kycApplications: kycApplicationsReducer,
  searchLogs: searchLogsReducer,
  sellerLocation: sellerLocationReducer,
  adminCommentsModeration: adminCommentsModerationReducer,
  adminAnalytics: adminAnalyticsReducer,
  adminSettings: adminSettingsReducer,

  // 🍚 Recipes
  recipeSubmit: recipeSubmitReducer,
  recipeList: recipeListReducer,
  recipeListMy: recipeListMyReducer,
  recipeListPending: recipeListPendingReducer,
  recipeDetails: recipeDetailsReducer,
  recipeApprove: recipeApproveReducer,
  recipeRate: recipeRateReducer,
  recipeComment: recipeCommentReducer,
  recipeDelete: recipeDeleteReducer,
  recipeCommentModerate: recipeCommentModerateReducer,
  recipeCommentReport: recipeCommentReportReducer,
  recipeFlaggedComments: recipeFlaggedCommentsReducer,

  // 💬 Forum
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

  // 🌐 Social
  socialLike: socialLikeReducer,
  socialComment: socialCommentReducer,
  socialCommentsList: socialCommentsListReducer,
  socialCommentApprove: socialCommentApproveReducer,
  socialCommentDelete: socialCommentDeleteReducer,
  socialShare: socialShareReducer,

  // 📈 Analytics
  analyticsSales: analyticsSalesReducer,
  analyticsUsers: analyticsUsersReducer,
  analyticsPerformance: analyticsPerformanceReducer,

  // 💬 Messages - 🔥 ADDED: Critical for admin messages
  messageSend: messageSendReducer,
  messageList: messageListReducer,
  messageAdmin: messageAdminReducer,

  // 🔔 Notifications - 🔥 ADDED: For admin notifications
  notification: notificationReducer,

  // 📍 Address - 🔥 ADDED: For user address management
  address: addressReducer,

  // 📋 Bulk Orders - 🔥 ADDED: For bulk order management
  bulkOrder: bulkOrderReducer,

  // 🔥 NEW: Admin Payment Management
  adminPaymentStats: adminPaymentStatsReducer,
  adminTransactions: adminTransactionsReducer,
  adminRefund: adminRefundReducer,
  adminPayout: adminPayoutReducer,
  adminPayoutsList: adminPayoutsListReducer,
  adminPaymentExport: adminPaymentExportReducer,
});

export default rootReducer;