import {
  PRODUCT_LIST_REQUEST,
  PRODUCT_LIST_SUCCESS,
  PRODUCT_LIST_FAIL,
  PRODUCT_FILTER_REQUEST,
  PRODUCT_FILTER_SUCCESS,
  PRODUCT_FILTER_FAIL,
  PRODUCT_DETAILS_REQUEST,
  PRODUCT_DETAILS_SUCCESS,
  PRODUCT_DETAILS_FAIL,
  PRODUCT_DELETE_REQUEST,
  PRODUCT_DELETE_SUCCESS,
  PRODUCT_DELETE_FAIL,
  PRODUCT_CREATE_REQUEST,
  PRODUCT_CREATE_SUCCESS,
  PRODUCT_CREATE_FAIL,
  PRODUCT_CREATE_RESET,
  PRODUCT_UPDATE_REQUEST,
  PRODUCT_UPDATE_SUCCESS,
  PRODUCT_UPDATE_FAIL,
  PRODUCT_UPDATE_RESET,
  PRODUCT_CREATE_REVIEW_REQUEST,
  PRODUCT_CREATE_REVIEW_SUCCESS,
  PRODUCT_CREATE_REVIEW_FAIL,
  PRODUCT_CREATE_REVIEW_RESET,
  PRODUCT_SELLER_LIST_REQUEST,
  PRODUCT_SELLER_LIST_SUCCESS,
  PRODUCT_SELLER_LIST_FAIL,
  PRODUCT_BULK_UPLOAD_REQUEST,
  PRODUCT_BULK_UPLOAD_SUCCESS,
  PRODUCT_BULK_UPLOAD_FAIL,
  PRODUCT_ANALYTICS_REQUEST,
  PRODUCT_ANALYTICS_SUCCESS,
  PRODUCT_ANALYTICS_FAIL,
  RECIPE_SUGGESTION_REQUEST,
  RECIPE_SUGGESTION_SUCCESS,
  RECIPE_SUGGESTION_FAIL,
  FORUM_POST_REQUEST,
  FORUM_POST_SUCCESS,
  FORUM_POST_FAIL,
  SELLER_ANALYTICS_REQUEST,
  SELLER_ANALYTICS_SUCCESS,
  SELLER_ANALYTICS_FAIL,
  FORUM_MESSAGES_REQUEST,
  FORUM_MESSAGES_SUCCESS,
  FORUM_MESSAGES_FAIL,
  SUGGEST_RECIPE_REQUEST,
  SUGGEST_RECIPE_SUCCESS,
  SUGGEST_RECIPE_FAIL,
} from '../constants/productConstants';

export const productListReducer = (state = { products: [], total: 0, page: 1, pages: 1 }, action) => {
  switch (action.type) {
    case PRODUCT_LIST_REQUEST:
      return { ...state, loading: true, products: [] };
    case PRODUCT_LIST_SUCCESS:
      return {
        loading: false,
        products: action.payload.products || action.payload || [],
        total: action.payload.total || 0,
        page: action.payload.page || 1,
        pages: action.payload.pages || 1,
      };
    case PRODUCT_LIST_FAIL:
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
};

export const productFilterReducer = (state = { filteredProducts: [], total: 0, page: 1, pages: 1 }, action) => {
  switch (action.type) {
    case PRODUCT_FILTER_REQUEST:
      return { ...state, loading: true, filteredProducts: [] };

    case PRODUCT_FILTER_SUCCESS:
      return {
        loading: false,
        filteredProducts: action.payload.products || [],   // ← ALWAYS ARRAY
        total: action.payload.total || 0,
        page: action.payload.page || 1,
        pages: action.payload.pages || 1,
      };

    case PRODUCT_FILTER_FAIL:
      return { ...state, loading: false, error: action.payload, filteredProducts: [] };

    default:
      return state;
  }
};

export const productDetailsReducer = (state = { product: { reviews: [] } }, action) => {
  switch (action.type) {
    case PRODUCT_DETAILS_REQUEST:
      return { ...state, loading: true };
    case PRODUCT_DETAILS_SUCCESS:
      return { loading: false, product: action.payload };
    case PRODUCT_DETAILS_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};

export const productDeleteReducer = (state = {}, action) => {
  switch (action.type) {
    case PRODUCT_DELETE_REQUEST:
      return { loading: true };
    case PRODUCT_DELETE_SUCCESS:
      return { loading: false, success: true };
    case PRODUCT_DELETE_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};

export const productCreateReducer = (state = {}, action) => {
  switch (action.type) {
    case PRODUCT_CREATE_REQUEST:
      return { loading: true };
    case PRODUCT_CREATE_SUCCESS:
      return { loading: false, success: true, product: action.payload };
    case PRODUCT_CREATE_FAIL:
      return { loading: false, error: action.payload };
    case PRODUCT_CREATE_RESET:
      return {};
    default:
      return state;
  }
};

export const productUpdateReducer = (state = { product: {} }, action) => {
  switch (action.type) {
    case PRODUCT_UPDATE_REQUEST:
      return { loading: true };
    case PRODUCT_UPDATE_SUCCESS:
      return { loading: false, success: true, product: action.payload };
    case PRODUCT_UPDATE_FAIL:
      return { loading: false, error: action.payload };
    case PRODUCT_UPDATE_RESET:
      return { product: {} };
    default:
      return state;
  }
};

export const productReviewCreateReducer = (state = {}, action) => {
  switch (action.type) {
    case PRODUCT_CREATE_REVIEW_REQUEST:
      return { loading: true };
    case PRODUCT_CREATE_REVIEW_SUCCESS:
      return { loading: false, success: true };
    case PRODUCT_CREATE_REVIEW_FAIL:
      return { loading: false, error: action.payload };
    case PRODUCT_CREATE_REVIEW_RESET:
      return {};
    default:
      return state;
  }
};

export const productSellerListReducer = (state = { products: [] }, action) => {
  switch (action.type) {
    case PRODUCT_SELLER_LIST_REQUEST:
      return { loading: true, products: [] };
    case PRODUCT_SELLER_LIST_SUCCESS:
      return { loading: false, products: action.payload };
    case PRODUCT_SELLER_LIST_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};

export const productBulkUploadReducer = (state = {}, action) => {
  switch (action.type) {
    case PRODUCT_BULK_UPLOAD_REQUEST:
      return { loading: true };
    case PRODUCT_BULK_UPLOAD_SUCCESS:
      return { loading: false, success: true, message: action.payload };
    case PRODUCT_BULK_UPLOAD_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};

export const productAnalyticsReducer = (state = {}, action) => {
  switch (action.type) {
    case PRODUCT_ANALYTICS_REQUEST:
      return { loading: true };
    case PRODUCT_ANALYTICS_SUCCESS:
      return { loading: false, analytics: action.payload };
    case PRODUCT_ANALYTICS_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};

export const recipeSuggestionReducer = (state = {}, action) => {
  switch (action.type) {
    case RECIPE_SUGGESTION_REQUEST:
      return { loading: true };
    case RECIPE_SUGGESTION_SUCCESS:
      return { loading: false, recipes: action.payload };
    case RECIPE_SUGGESTION_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};

export const forumReducer = (state = {}, action) => {
  switch (action.type) {
    case FORUM_POST_REQUEST:
      return { loading: true };
    case FORUM_POST_SUCCESS:
      return { loading: false, success: true, post: action.payload };
    case FORUM_POST_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};

export const sellerAnalyticsReducer = (state = { loading: false, error: null, analytics: { totalSales: 0, totalOrders: 0, sales: [], popularProducts: [] } }, action) => {
  switch (action.type) {
    case SELLER_ANALYTICS_REQUEST:
      return { ...state, loading: true, error: null };
    case SELLER_ANALYTICS_SUCCESS:
      return { loading: false, error: null, analytics: action.payload || { totalSales: 0, totalOrders: 0, sales: [], popularProducts: [] } };
    case SELLER_ANALYTICS_FAIL:
      return { loading: false, error: action.payload, analytics: { totalSales: 0, totalOrders: 0, sales: [], popularProducts: [] } };
    default:
      return state;
  }
};

export const forumMessagesReducer = (state = { messages: [] }, action) => {
  switch (action.type) {
    case FORUM_MESSAGES_REQUEST:
      return { loading: true, messages: [] };
    case FORUM_MESSAGES_SUCCESS:
      return { loading: false, messages: action.payload };
    case FORUM_MESSAGES_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};

export const suggestRecipeReducer = (state = {}, action) => {
  switch (action.type) {
    case SUGGEST_RECIPE_REQUEST:
      return { loading: true };
    case SUGGEST_RECIPE_SUCCESS:
      return { loading: false, success: true, recipe: action.payload };
    case SUGGEST_RECIPE_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};