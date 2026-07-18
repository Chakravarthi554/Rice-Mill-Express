import {
  USER_LOGIN_REQUEST,
  USER_LOGIN_SUCCESS,
  USER_LOGIN_FAIL,
  USER_LOGOUT,
  USER_UPDATE_PROFILE_REQUEST,
  USER_UPDATE_PROFILE_SUCCESS,
  USER_UPDATE_PROFILE_FAIL,
  USER_WISHLIST_REQUEST,
  USER_WISHLIST_SUCCESS,
  USER_WISHLIST_FAIL,
  USER_WISHLIST_REMOVE_ITEM,
  LIST_DELIVERY_PARTNERS_REQUEST,
  LIST_DELIVERY_PARTNERS_SUCCESS,
  LIST_DELIVERY_PARTNERS_FAIL,
  USER_REGISTER_REQUEST,
  USER_REGISTER_SUCCESS,
  USER_REGISTER_FAIL,
  USER_DETAILS_REQUEST,
  USER_DETAILS_SUCCESS,
  USER_DETAILS_FAIL,
  USER_DETAILS_RESET,
  USER_UPDATE_PROFILE_RESET,
  USER_LIST_REQUEST,
  USER_LIST_SUCCESS,
  USER_LIST_FAIL,
  USER_LIST_RESET,
  USER_DELETE_REQUEST,
  USER_DELETE_SUCCESS,
  USER_DELETE_FAIL,
  USER_UPDATE_REQUEST,
  USER_UPDATE_SUCCESS,
  USER_UPDATE_FAIL,
  USER_UPDATE_RESET,
  USER_CHANGE_PASSWORD_REQUEST,
  USER_CHANGE_PASSWORD_SUCCESS,
  USER_CHANGE_PASSWORD_FAIL,
  USER_CHANGE_PASSWORD_RESET,
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
  USER_RESET_PREFERENCES_RESET,

  USER_EXPORT_DATA_SUCCESS,
  USER_EXPORT_DATA_FAIL,
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
USER_REPORT_PROBLEM_REQUEST,
USER_REPORT_PROBLEM_SUCCESS,
USER_UNSUBSCRIBE_FAIL,
USER_UNSUBSCRIBE_REQUEST,
USER_UNSUBSCRIBE_SUCCESS,
USER_GET_SUBSCRIPTION_FAIL,
USER_GET_SUBSCRIPTION_REQUEST,
USER_GET_SUBSCRIPTION_SUCCESS,
} from '../constants/userConstants';
// --- LOGIN REDUCER (merged & improved) ---
export const userLoginReducer = (state = { userInfo: null, loading: false }, action) => {
  switch (action.type) {
    case USER_LOGIN_REQUEST:
      return { ...state, loading: true, error: null }; // Clear error on new request
    case USER_LOGIN_SUCCESS:
      return { loading: false, userInfo: action.payload, error: null };
    case USER_LOGIN_FAIL:
      return { loading: false, error: action.payload, userInfo: null };
    case USER_LOGOUT:
      return { userInfo: null, loading: false, error: null };
    default:
      return state;
  }
};
// --- REGISTER REDUCER ---
export const userRegisterReducer = (state = {}, action) => {
  switch (action.type) {
    case USER_REGISTER_REQUEST:
      return { loading: true };
    case USER_REGISTER_SUCCESS:
      return { loading: false, userInfo: action.payload };
    case USER_REGISTER_FAIL:
      return { loading: false, error: action.payload };
    case USER_LOGOUT:
      return {};
    default:
      return state;
  }
};
// --- USER DETAILS REDUCER ---
export const userDetailsReducer = (state = { user: {} }, action) => {
  switch (action.type) {
    case USER_DETAILS_REQUEST:
      return { ...state, loading: true };
    case USER_DETAILS_SUCCESS:
      return { loading: false, user: action.payload };
    case USER_UPDATE_PROFILE_SUCCESS:
      return { ...state, loading: false, user: action.payload };
    case USER_DETAILS_FAIL:
      return { loading: false, error: action.payload };
    case USER_DETAILS_RESET:
      return { user: {} };
    default:
      return state;
  }
};
// --- UPDATE PROFILE REDUCER (improved payload structure) ---
export const userUpdateProfileReducer = (state = {}, action) => {
  switch (action.type) {
    case USER_UPDATE_PROFILE_REQUEST:
      return { loading: true };
    case USER_UPDATE_PROFILE_SUCCESS:
      return { loading: false, success: true, userInfo: action.payload };
    case USER_UPDATE_PROFILE_FAIL:
      return { loading: false, error: action.payload };
    case USER_UPDATE_PROFILE_RESET:
      return {};
    default:
      return state;
  }
};
// --- CHANGE PASSWORD REDUCER ---
export const userChangePasswordReducer = (state = {}, action) => {
  switch (action.type) {
    case USER_CHANGE_PASSWORD_REQUEST:
      return { loading: true };
    case USER_CHANGE_PASSWORD_SUCCESS:
      return { loading: false, success: true };
    case USER_CHANGE_PASSWORD_FAIL:
      return { loading: false, error: action.payload };
    case USER_CHANGE_PASSWORD_RESET:
      return {};
    default:
      return state;
  }
};
// --- USER LIST REDUCER (Admin) ---
export const userListReducer = (state = { users: [] }, action) => {
  switch (action.type) {
    case USER_LIST_REQUEST:
      return { loading: true };
    case USER_LIST_SUCCESS:
      return { loading: false, users: action.payload };
    case USER_LIST_FAIL:
      return { loading: false, error: action.payload };
    case USER_LIST_RESET:
      return { users: [] };
    default:
      return state;
  }
};
// --- DELETE USER REDUCER ---
export const userDeleteReducer = (state = {}, action) => {
  switch (action.type) {
    case USER_DELETE_REQUEST:
      return { loading: true };
    case USER_DELETE_SUCCESS:
      return { loading: false, success: true };
    case USER_DELETE_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};
// --- ADMIN UPDATE USER REDUCER ---
export const userUpdateReducer = (state = { user: {} }, action) => {
  switch (action.type) {
    case USER_UPDATE_REQUEST:
      return { loading: true };
    case USER_UPDATE_SUCCESS:
      return { loading: false, success: true };
    case USER_UPDATE_FAIL:
      return { loading: false, error: action.payload };
    case USER_UPDATE_RESET:
      return { user: {} };
    default:
      return state;
  }
};
// --- WISHLIST REDUCER ---
export const userWishlistReducer = (state = { wishlistItems: [] }, action) => {
  switch (action.type) {
    case USER_WISHLIST_REQUEST:
      return { loading: true };
    case USER_WISHLIST_SUCCESS:
      return { loading: false, wishlistItems: action.payload || [] };
    case USER_WISHLIST_FAIL:
      return { loading: false, error: action.payload };
    case USER_WISHLIST_REMOVE_ITEM:
      return {
        ...state,
        wishlistItems: state.wishlistItems.filter((x) => x._id !== action.payload),
      };
    default:
      return state;
  }
};
// --- DELIVERY PARTNERS REDUCER ---
export const deliveryPartnerListReducer = (state = { partners: [] }, action) => {
  switch (action.type) {
    case LIST_DELIVERY_PARTNERS_REQUEST:
      return { loading: true, partners: [] };
    case LIST_DELIVERY_PARTNERS_SUCCESS:
      return { loading: false, partners: action.payload };
    case LIST_DELIVERY_PARTNERS_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};
// --- FORGOT PASSWORD REDUCER ---
export const userForgotPasswordReducer = (state = {}, action) => {
  switch (action.type) {
    case USER_FORGOT_PASSWORD_REQUEST:
      return { loading: true };
    case USER_FORGOT_PASSWORD_SUCCESS:
      return { loading: false, success: true, message: action.payload };
    case USER_FORGOT_PASSWORD_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};
// --- RESET PASSWORD REDUCER ---
export const userResetPasswordReducer = (state = {}, action) => {
  switch (action.type) {
    case USER_RESET_PASSWORD_REQUEST:
      return { loading: true };
    case USER_RESET_PASSWORD_SUCCESS:
      return { loading: false, success: true, message: action.payload };
    case USER_RESET_PASSWORD_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};
export const userDeleteAccountReducer = (state = {}, action) => {
  switch (action.type) {
    case USER_DELETE_ACCOUNT_REQUEST:
      return { loading: true };
    case USER_DELETE_ACCOUNT_SUCCESS:
      return { loading: false, success: true };
    case USER_DELETE_ACCOUNT_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};


export const userResetPreferencesReducer = (state = {}, action) => {
  switch (action.type) {
    case USER_RESET_PREFERENCES_REQUEST:
      return { loading: true };
    case USER_RESET_PREFERENCES_SUCCESS:
      return { loading: false, success: true };
    case USER_RESET_PREFERENCES_FAIL:
      return { loading: false, error: action.payload };
    case USER_RESET_PREFERENCES_RESET: // ADD THIS
      return {};
    default:
      return state;
  }
};

export const userLinkedAccountsReducer = (state = {}, action) => {
  switch (action.type) {
    case USER_LINK_ACCOUNT_REQUEST:
      return { loading: true };
    case USER_LINK_ACCOUNT_SUCCESS:
      return { loading: false, success: true };
    case USER_LINK_ACCOUNT_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};

export const userPaymentMethodsReducer = (state = {}, action) => {
  switch (action.type) {
    case USER_ADD_PAYMENT_REQUEST:
      return { loading: true };
    case USER_ADD_PAYMENT_SUCCESS:
      return { loading: false, success: true };
    case USER_ADD_PAYMENT_FAIL:
      return { loading: false, error: action.payload };
    case USER_DELETE_PAYMENT_REQUEST:
      return { loading: true };
    case USER_DELETE_PAYMENT_SUCCESS:
      return { loading: false, success: true };
    case USER_DELETE_PAYMENT_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};

export const userRewardsReducer = (state = {}, action) => {
  switch (action.type) {
    case USER_GET_REWARDS_REQUEST:
      return { loading: true };
    case USER_GET_REWARDS_SUCCESS:
      return { loading: false, rewards: action.payload };
    case USER_GET_REWARDS_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};

export const userSubscriptionReducer = (state = {}, action) => {
  switch (action.type) {
    case USER_GET_SUBSCRIPTION_REQUEST:
    case USER_SUBSCRIBE_REQUEST:
    case USER_UNSUBSCRIBE_REQUEST:
      return { ...state, loading: true };
    case USER_GET_SUBSCRIPTION_SUCCESS:
      return { loading: false, subscription: action.payload };
    case USER_SUBSCRIBE_SUCCESS:
    case USER_UNSUBSCRIBE_SUCCESS:
      return { loading: false, subscription: action.payload };
    case USER_GET_SUBSCRIPTION_FAIL:
    case USER_SUBSCRIBE_FAIL:
    case USER_UNSUBSCRIBE_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};

export const userReportProblemReducer = (state = {}, action) => {
  switch (action.type) {
    case USER_REPORT_PROBLEM_REQUEST:
      return { loading: true };
    case USER_REPORT_PROBLEM_SUCCESS:
      return { loading: false, success: true };
    case USER_REPORT_PROBLEM_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};

export const userExportDataReducer = (state = {}, action) => {
  switch (action.type) {
    case USER_EXPORT_DATA_REQUEST:
      return { loading: true };
    case USER_EXPORT_DATA_SUCCESS:
      return { loading: false, success: true, data: action.payload };
    case USER_EXPORT_DATA_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};