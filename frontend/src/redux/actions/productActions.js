import api from '../../utils/api';
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
  PRODUCT_UPDATE_REQUEST,
  PRODUCT_UPDATE_SUCCESS,
  PRODUCT_UPDATE_FAIL,
  PRODUCT_CREATE_REVIEW_REQUEST,
  PRODUCT_CREATE_REVIEW_SUCCESS,
  PRODUCT_CREATE_REVIEW_FAIL,
  PRODUCT_SELLER_LIST_REQUEST,
  PRODUCT_SELLER_LIST_SUCCESS,
  PRODUCT_SELLER_LIST_FAIL,
  PRODUCT_BULK_UPLOAD_REQUEST,
  PRODUCT_BULK_UPLOAD_SUCCESS,
  PRODUCT_BULK_UPLOAD_FAIL,
  PRODUCT_ANALYTICS_REQUEST,
  PRODUCT_ANALYTICS_SUCCESS,
  PRODUCT_ANALYTICS_FAIL,
  SELLER_ANALYTICS_REQUEST,
  SELLER_ANALYTICS_SUCCESS,
  SELLER_ANALYTICS_FAIL,
  FORUM_POST_REQUEST,
  FORUM_POST_SUCCESS,
  FORUM_POST_FAIL,
  FORUM_MESSAGES_REQUEST,
  FORUM_MESSAGES_SUCCESS,
  FORUM_MESSAGES_FAIL,
} from '../constants/productConstants';
import handleApiError from '../../utils/handleApiError';

// =======================
// Product list
// =======================
export const listProducts = (keyword = '', pageNumber = '') => async (dispatch) => {
  try {
    dispatch({ type: PRODUCT_LIST_REQUEST });

    console.log('🔄 Fetching products...');

    const { data } = await api.get(`/api/products?keyword=${keyword}&pageNumber=${pageNumber}`);

    console.log(`✅ Products received: ${data.products?.length || 0}`);

    dispatch({
      type: PRODUCT_LIST_SUCCESS,
      payload: data
    });

    return { success: true, data };

  } catch (error) {
    console.error('❌ List products error:', error);

    const message = handleApiError(error);
    dispatch({
      type: PRODUCT_LIST_FAIL,
      payload: message
    });

    return { success: false, error: message };
  }
};

// =======================
// Filtered products
// =======================
export const listFilteredProducts = (filters = {}) => async (dispatch) => {
  try {
    dispatch({ type: PRODUCT_FILTER_REQUEST });
    console.log('Filtering products with:', filters);

    const queryParams = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        if (Array.isArray(filters[key])) {
          if (filters[key].length > 0) {
            queryParams.append(key, filters[key].join(','));
          }
        } else if (key === 'priceRange') {
          queryParams.append('priceMin', filters[key][0]);
          queryParams.append('priceMax', filters[key][1]);
        } else {
          queryParams.append(key, filters[key]);
        }
      }
    });

    const { data } = await api.get(`/api/products/filter?${queryParams.toString()}`);

    dispatch({
      type: PRODUCT_LIST_SUCCESS,
      payload: {
        products: data.products || [],   // ← Always array
        total: data.total || 0,
        page: data.page || 1,
        pages: data.pages || 1
      }
    });
  } catch (error) {
    console.error('Filter products error:', error);
    dispatch({
      type: PRODUCT_FILTER_FAIL,
      payload: error.response?.data?.message || error.message
    });
  }
};

// =======================
// Product details
// =======================
export const listProductDetails = (id) => async (dispatch) => {
  try {
    dispatch({ type: PRODUCT_DETAILS_REQUEST });

    console.log(`🔄 Fetching product details: ${id}`);

    const { data } = await api.get(`/api/products/${id}`);

    console.log('✅ Product details received:', data.product?._id);

    dispatch({
      type: PRODUCT_DETAILS_SUCCESS,
      payload: data.product
    });

    return { success: true, data };

  } catch (error) {
    console.error('❌ Product details error:', error);

    const message = handleApiError(error);
    dispatch({
      type: PRODUCT_DETAILS_FAIL,
      payload: message
    });

    return { success: false, error: message };
  }
};

// =======================
// Delete product
// =======================
export const deleteProduct = (id) => async (dispatch, getState) => {
  try {
    dispatch({ type: PRODUCT_DELETE_REQUEST });

    const {
      userLogin: { userInfo },
    } = getState();

    const config = {
      headers: { Authorization: `Bearer ${userInfo?.token || ''}` },
    };

    await api.delete(`/api/products/${id}`);

    dispatch({ type: PRODUCT_DELETE_SUCCESS, payload: id });
  } catch (error) {
    dispatch({
      type: PRODUCT_DELETE_FAIL,
      payload: error.response?.data?.message || error.message,
    });
  }
};

// =======================
// Create product
// =======================
export const createProduct = (product) => async (dispatch, getState) => {
  try {
    dispatch({ type: PRODUCT_CREATE_REQUEST });

    const {
      userLogin: { userInfo },
    } = getState();

    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${userInfo?.token || ''}`,
      },
    };

    const { data } = await api.post(`/api/products`, product, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    dispatch({ type: PRODUCT_CREATE_SUCCESS, payload: data });
  } catch (error) {
    dispatch({
      type: PRODUCT_CREATE_FAIL,
      payload: error.response?.data?.message || error.message,
    });
  }
};

// =======================
// Update product
// =======================
export const updateProduct = (productId, productData) => async (dispatch, getState) => {
  try {
    dispatch({ type: PRODUCT_UPDATE_REQUEST });

    const {
      userLogin: { userInfo },
    } = getState();

    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${userInfo?.token || ''}`,
      },
    };

    const { data } = await api.put(`/api/products/${productId}`, productData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    dispatch({ type: PRODUCT_UPDATE_SUCCESS, payload: data });
  } catch (error) {
    dispatch({
      type: PRODUCT_UPDATE_FAIL,
      payload: error.response?.data?.message || error.message,
    });
  }
};

// =======================
// Create product review
// =======================
export const createProductReview = (productId, review) => async (dispatch, getState) => {
  try {
    dispatch({ type: PRODUCT_CREATE_REVIEW_REQUEST });

    const {
      userLogin: { userInfo },
    } = getState();

    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userInfo?.token || ''}`,
      },
    };

    await api.post(`/api/social/products/${productId}/rate`, review);

    dispatch({ type: PRODUCT_CREATE_REVIEW_SUCCESS });
  } catch (error) {
    dispatch({
      type: PRODUCT_CREATE_REVIEW_FAIL,
      payload: error.response?.data?.message || error.message,
    });
  }
};

// =======================
// Seller products
// =======================
export const listSellerProducts = () => async (dispatch, getState) => {
  try {
    dispatch({ type: PRODUCT_SELLER_LIST_REQUEST });

    const {
      userLogin: { userInfo },
    } = getState();

    if (!userInfo || !userInfo._id) {
      throw new Error('User not authenticated or missing _id');
    }

    const config = {
      headers: { Authorization: `Bearer ${userInfo.token || ''}` },
    };

    const { data } = await api.get('/api/products/seller');

    dispatch({ type: PRODUCT_SELLER_LIST_SUCCESS, payload: data });
  } catch (error) {
    dispatch({
      type: PRODUCT_SELLER_LIST_FAIL,
      payload: error.response?.data?.message || error.message,
    });
  }
};

// =======================
// Bulk upload products
// =======================
export const bulkUploadProducts = (fileUrl) => async (dispatch, getState) => {
  try {
    dispatch({ type: PRODUCT_BULK_UPLOAD_REQUEST });

    const {
      userLogin: { userInfo },
    } = getState();

    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userInfo?.token || ''}`,
      },
    };

    const { data } = await api.post('/api/products/bulk', { fileUrl });

    dispatch({ type: PRODUCT_BULK_UPLOAD_SUCCESS, payload: data });
  } catch (error) {
    dispatch({
      type: PRODUCT_BULK_UPLOAD_FAIL,
      payload: error.response?.data?.message || error.message,
    });
  }
};

// =======================
// Product analytics
// =======================
export const getProductAnalytics = () => async (dispatch, getState) => {
  try {
    dispatch({ type: PRODUCT_ANALYTICS_REQUEST });

    const {
      userLogin: { userInfo },
    } = getState();

    const config = {
      headers: { Authorization: `Bearer ${userInfo?.token || ''}` },
    };

    const { data } = await api.get('/api/products/analytics');

    dispatch({ type: PRODUCT_ANALYTICS_SUCCESS, payload: data });
  } catch (error) {
    dispatch({
      type: PRODUCT_ANALYTICS_FAIL,
      payload: error.response?.data?.message || error.message,
    });
  }
};

// =======================
// Seller analytics
// =======================
export const listSellerAnalytics = (timeframe = '30d') => async (dispatch, getState) => {
  try {
    dispatch({ type: SELLER_ANALYTICS_REQUEST });

    const {
      userLogin: { userInfo },
    } = getState();

    const config = {
      headers: { Authorization: `Bearer ${userInfo?.token || ''}` },
      params: { timeframe },
    };

    const { data } = await api.get('/api/seller/analytics', config);

    dispatch({ type: SELLER_ANALYTICS_SUCCESS, payload: data });
  } catch (error) {
    dispatch({
      type: SELLER_ANALYTICS_FAIL,
      payload: error.response?.data?.message || error.message,
    });
  }
};

// =======================
// Forum actions
// =======================
export const postForumMessage = (message) => async (dispatch, getState) => {
  try {
    dispatch({ type: FORUM_POST_REQUEST });

    const {
      userLogin: { userInfo },
    } = getState();

    const { data } = await api.post('/api/forum/post', message);

    dispatch({ type: FORUM_POST_SUCCESS, payload: data });
  } catch (error) {
    dispatch({
      type: FORUM_POST_FAIL,
      payload: error.response?.data?.message || error.message,
    });
  }
};

export const listForumMessages = () => async (dispatch, getState) => {
  try {
    dispatch({ type: FORUM_MESSAGES_REQUEST });

    const {
      userLogin: { userInfo },
    } = getState();

    const { data } = await api.get('/api/forum/messages');

    dispatch({ type: FORUM_MESSAGES_SUCCESS, payload: data });
  } catch (error) {
    dispatch({
      type: FORUM_MESSAGES_FAIL,
      payload: error.response?.data?.message || error.message,
    });
  }
};