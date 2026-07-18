import {
    RECIPE_LIST_REQUEST,
    RECIPE_LIST_SUCCESS,
    RECIPE_LIST_FAIL,
    RECIPE_DETAILS_REQUEST,
    RECIPE_DETAILS_SUCCESS,
    RECIPE_DETAILS_FAIL,
    RECIPE_RATE_SUCCESS,
    RECIPE_COMMENT_SUCCESS,
    RECIPE_LIKE_SUCCESS,
    RECIPE_SHARE_SUCCESS,
    RECIPE_COMMENT_LIKE_SUCCESS,
    RECIPE_COMMENT_REPLY_SUCCESS,
} from '../../constants/recipeConstants';
import { apiService } from '../../services/api';

export const getRecipes = (searchQuery = '', category = '', riceType = '') => async (dispatch) => {
    try {
        dispatch({ type: RECIPE_LIST_REQUEST });

        const params = {};
        if (searchQuery) params.search = searchQuery;
        if (category) params.category = category;
        if (riceType) params.riceType = riceType;

        const response = await apiService.getRecipes(params);

        dispatch({
            type: RECIPE_LIST_SUCCESS,
            payload: response.data,
        });
    } catch (error) {
        dispatch({
            type: RECIPE_LIST_FAIL,
            payload: error.response?.data?.message || error.message,
        });
    }
};

export const getRecipeDetails = (id) => async (dispatch) => {
    try {
        dispatch({ type: RECIPE_DETAILS_REQUEST });

        const response = await apiService.getRecipeById(id);

        dispatch({
            type: RECIPE_DETAILS_SUCCESS,
            payload: response.data,
        });
    } catch (error) {
        dispatch({
            type: RECIPE_DETAILS_FAIL,
            payload: error.response?.data?.message || error.message,
        });
    }
};

export const rateRecipe = (id, rating) => async (dispatch) => {
    try {
        const response = await apiService.rateRecipe(id, rating);

        // Dispatch success with updated recipe data
        dispatch({
            type: RECIPE_RATE_SUCCESS,
            payload: response.data,
        });
    } catch (error) {
        console.error('Error rating recipe:', error);
    }
};

export const commentOnRecipe = (id, comment) => async (dispatch) => {
    try {
        const response = await apiService.commentOnRecipe(id, comment);

        // Dispatch success with comment data and recipe ID
        dispatch({
            type: RECIPE_COMMENT_SUCCESS,
            payload: {
                _id: id,
                comment: response.data.comment,
                commentsCount: response.data.commentsCount
            },
        });
    } catch (error) {
        console.error('Error commenting on recipe:', error);
    }
};

export const likeRecipe = (id) => async (dispatch) => {
    try {
        const response = await apiService.likeRecipe(id);
        dispatch({
            type: RECIPE_LIKE_SUCCESS,
            payload: {
                _id: id,
                likesCount: response.data.likesCount,
                userLiked: response.data.userLiked
            },
        });
    } catch (error) {
        console.error('Error liking recipe:', error);
    }
};

export const shareRecipe = (id) => async (dispatch) => {
    try {
        const response = await apiService.shareRecipe(id);
        dispatch({
            type: RECIPE_SHARE_SUCCESS,
            payload: {
                _id: id,
                sharesCount: response.data.sharesCount
            },
        });
    } catch (error) {
        console.error('Error sharing recipe:', error);
    }
};

export const likeRecipeComment = (recipeId, commentId) => async (dispatch) => {
    try {
        const response = await apiService.likeRecipeComment(recipeId, commentId);
        dispatch({
            type: RECIPE_COMMENT_LIKE_SUCCESS,
            payload: { recipeId, commentId, ...response.data },
        });
    } catch (error) {
        console.error('Error liking recipe comment:', error);
    }
};

export const replyToRecipeComment = (recipeId, commentId, comment) => async (dispatch) => {
    try {
        const response = await apiService.replyToRecipeComment(recipeId, commentId, comment);
        dispatch({
            type: RECIPE_COMMENT_REPLY_SUCCESS,
            payload: { recipeId, commentId, comment: response.data.comment },
        });
    } catch (error) {
        console.error('Error replying to recipe comment:', error);
    }
};
