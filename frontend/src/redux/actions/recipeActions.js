import axios from 'axios';
import {
  RECIPE_SUBMIT_REQUEST, RECIPE_SUBMIT_SUCCESS, RECIPE_SUBMIT_FAIL,
  RECIPE_LIST_REQUEST, RECIPE_LIST_SUCCESS, RECIPE_LIST_FAIL,
  RECIPE_LIST_MY_REQUEST, RECIPE_LIST_MY_SUCCESS, RECIPE_LIST_MY_FAIL,
  RECIPE_LIST_PENDING_REQUEST, RECIPE_LIST_PENDING_SUCCESS, RECIPE_LIST_PENDING_FAIL,
  RECIPE_DETAILS_REQUEST, RECIPE_DETAILS_SUCCESS, RECIPE_DETAILS_FAIL,
  RECIPE_APPROVE_REQUEST, RECIPE_APPROVE_SUCCESS, RECIPE_APPROVE_FAIL,
  RECIPE_RATE_REQUEST, RECIPE_RATE_SUCCESS, RECIPE_RATE_FAIL,
  RECIPE_COMMENT_REQUEST, RECIPE_COMMENT_SUCCESS, RECIPE_COMMENT_FAIL,
  RECIPE_DELETE_REQUEST, RECIPE_DELETE_SUCCESS, RECIPE_DELETE_FAIL,
  RECIPE_COMMENT_MODERATE_REQUEST, RECIPE_COMMENT_MODERATE_SUCCESS, RECIPE_COMMENT_MODERATE_FAIL,
  RECIPE_COMMENT_REPORT_REQUEST, RECIPE_COMMENT_REPORT_SUCCESS, RECIPE_COMMENT_REPORT_FAIL,
  RECIPE_FLAGGED_COMMENTS_REQUEST, RECIPE_FLAGGED_COMMENTS_SUCCESS, RECIPE_FLAGGED_COMMENTS_FAIL,
} from '../constants/RecipeConstants';
import { handleApiError } from '../../utils/handleApiError';

// Submit a recipe (Seller) - Expects FormData
export const submitRecipe = (formData) => async (dispatch, getState) => {
  try {
    dispatch({ type: RECIPE_SUBMIT_REQUEST });
    const { userLogin: { userInfo } } = getState();
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${userInfo.token}`,
      },
    };

    console.log('📝 Submitting recipe...');
    const { data } = await axios.post('/api/recipes/submit', formData, config);

    dispatch({
      type: RECIPE_SUBMIT_SUCCESS,
      payload: data
    });

    console.log('✅ Recipe submitted successfully');
    return Promise.resolve(data);
  } catch (error) {
    const message = handleApiError(error);
    console.error('❌ Recipe submission failed:', message);
    dispatch({
      type: RECIPE_SUBMIT_FAIL,
      payload: message
    });
    return Promise.reject(message);
  }
};

// List approved recipes (Public/Customer)
export const listRecipes = (query = {}) => async (dispatch) => {
  try {
    dispatch({ type: RECIPE_LIST_REQUEST });
    const { data } = await axios.get('/api/recipes', { params: query });
    dispatch({ type: RECIPE_LIST_SUCCESS, payload: data });
  } catch (error) {
    dispatch({
      type: RECIPE_LIST_FAIL,
      payload: handleApiError(error),
    });
  }
};

// List recipes created by the logged-in seller
export const listMyRecipes = (query = {}) => async (dispatch, getState) => {
  try {
    dispatch({ type: RECIPE_LIST_MY_REQUEST });
    const { userLogin: { userInfo } } = getState();
    const config = {
      headers: { Authorization: `Bearer ${userInfo.token}` },
      params: query
    };
    const { data } = await axios.get('/api/recipes/myrecipes', config);
    dispatch({ type: RECIPE_LIST_MY_SUCCESS, payload: data });
  } catch (error) {
    dispatch({
      type: RECIPE_LIST_MY_FAIL,
      payload: handleApiError(error),
    });
  }
};

// List pending recipes (Admin)
export const listPendingRecipes = (query = {}) => async (dispatch, getState) => {
  try {
    dispatch({ type: RECIPE_LIST_PENDING_REQUEST });
    const { userLogin: { userInfo } } = getState();
    const config = {
      headers: { Authorization: `Bearer ${userInfo.token}` },
      params: query
    };
    const { data } = await axios.get('/api/recipes/pending', config);
    dispatch({ type: RECIPE_LIST_PENDING_SUCCESS, payload: data });
  } catch (error) {
    dispatch({
      type: RECIPE_LIST_PENDING_FAIL,
      payload: handleApiError(error),
    });
  }
};

// Get recipe details
export const getRecipeDetails = (id) => async (dispatch) => {
  try {
    dispatch({ type: RECIPE_DETAILS_REQUEST });
    const { data } = await axios.get(`/api/recipes/${id}`);
    dispatch({ type: RECIPE_DETAILS_SUCCESS, payload: data });
  } catch (error) {
    dispatch({
      type: RECIPE_DETAILS_FAIL,
      payload: handleApiError(error),
    });
  }
};

// Approve or reject a recipe (Admin)
export const approveRecipe = (id, status, rejectionReason = '') => async (dispatch, getState) => {
  try {
    dispatch({ type: RECIPE_APPROVE_REQUEST });
    const { userLogin: { userInfo } } = getState();
    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userInfo.token}`
      }
    };

    const requestBody = { status };
    if (status === 'rejected' && rejectionReason) {
      requestBody.rejectionReason = rejectionReason;
    }

    const { data } = await axios.put(`/api/recipes/${id}/approve`, requestBody, config);
    dispatch({ type: RECIPE_APPROVE_SUCCESS, payload: data });
    return Promise.resolve(data);
  } catch (error) {
    const message = handleApiError(error);
    dispatch({ type: RECIPE_APPROVE_FAIL, payload: message });
    return Promise.reject(message);
  }
};

// Rate a recipe
export const rateRecipe = (id, rating) => async (dispatch, getState) => {
  try {
    dispatch({ type: RECIPE_RATE_REQUEST });
    const { userLogin: { userInfo } } = getState();
    const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
    const { data } = await axios.post(`/api/social/recipes/${id}/rate`, { rating }, config);
    dispatch({ type: RECIPE_RATE_SUCCESS, payload: data });
    dispatch(getRecipeDetails(id));
    return Promise.resolve(data);
  } catch (error) {
    const message = handleApiError(error);
    dispatch({ type: RECIPE_RATE_FAIL, payload: message });
    return Promise.reject(message);
  }
};

// Comment on a recipe
export const commentOnRecipe = (id, comment) => async (dispatch, getState) => {
  try {
    dispatch({ type: RECIPE_COMMENT_REQUEST });
    const { userLogin: { userInfo } } = getState();
    const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
    const { data } = await axios.post(`/api/social/recipes/${id}/comment`, { content: comment }, config);
    dispatch({ type: RECIPE_DETAILS_SUCCESS, payload: data });
    dispatch({ type: RECIPE_COMMENT_SUCCESS });
    return Promise.resolve(data);
  } catch (error) {
    const message = handleApiError(error);
    dispatch({ type: RECIPE_COMMENT_FAIL, payload: message });
    return Promise.reject(message);
  }
};

// Delete a recipe (Admin or Seller)
export const deleteRecipe = (id) => async (dispatch, getState) => {
  try {
    dispatch({ type: RECIPE_DELETE_REQUEST });
    const { userLogin: { userInfo } } = getState();
    const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
    await axios.delete(`/api/recipes/${id}`, config);
    dispatch({ type: RECIPE_DELETE_SUCCESS, payload: id });
    return Promise.resolve();
  } catch (error) {
    const message = handleApiError(error);
    dispatch({ type: RECIPE_DELETE_FAIL, payload: message });
    return Promise.reject(message);
  }
};

// NEW: Moderate recipe comment (Admin)
export const moderateRecipeComment = (recipeId, commentId, action) => async (dispatch, getState) => {
  try {
    dispatch({ type: RECIPE_COMMENT_MODERATE_REQUEST });

    const { userLogin: { userInfo } } = getState();
    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userInfo.token}`,
      },
    };

    const { data } = await axios.put(
      `/api/social/comments/${commentId}/moderate`,
      { action },
      config
    );

    dispatch({
      type: RECIPE_COMMENT_MODERATE_SUCCESS,
      payload: data
    });

    return Promise.resolve(data);
  } catch (error) {
    const message = handleApiError(error);
    dispatch({
      type: RECIPE_COMMENT_MODERATE_FAIL,
      payload: message
    });
    return Promise.reject(message);
  }
};

// NEW: Report recipe comment
export const reportRecipeComment = (recipeId, commentId, reason = '') => async (dispatch, getState) => {
  try {
    dispatch({ type: RECIPE_COMMENT_REPORT_REQUEST });

    const { userLogin: { userInfo } } = getState();
    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userInfo.token}`,
      },
    };

    const { data } = await axios.post(
      `/api/social/recipes/${recipeId}/comments/${commentId}/report`,
      { reason },
      config
    );

    dispatch({
      type: RECIPE_COMMENT_REPORT_SUCCESS,
      payload: data
    });

    return Promise.resolve(data);
  } catch (error) {
    const message = handleApiError(error);
    dispatch({
      type: RECIPE_COMMENT_REPORT_FAIL,
      payload: message
    });
    return Promise.reject(message);
  }
};

// NEW: Get flagged recipe comments (Admin)
export const getFlaggedRecipeComments = (page = 1, limit = 20) => async (dispatch, getState) => {
  try {
    dispatch({ type: RECIPE_FLAGGED_COMMENTS_REQUEST });

    const { userLogin: { userInfo } } = getState();
    const config = {
      headers: { Authorization: `Bearer ${userInfo.token}` },
    };

    const { data } = await axios.get('/api/social/flagged', {
      params: { page, limit, type: 'recipes' },
      ...config
    });

    dispatch({
      type: RECIPE_FLAGGED_COMMENTS_SUCCESS,
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
      type: RECIPE_FLAGGED_COMMENTS_FAIL,
      payload: message,
    });
    return Promise.reject(message);
  }
};