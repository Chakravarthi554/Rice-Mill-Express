import {
    RECIPE_LIST_REQUEST,
    RECIPE_LIST_SUCCESS,
    RECIPE_LIST_FAIL,
    RECIPE_DETAILS_REQUEST,
    RECIPE_DETAILS_SUCCESS,
    RECIPE_DETAILS_FAIL,
    RECIPE_RATE_SUCCESS,
    RECIPE_COMMENT_SUCCESS,
} from '../../constants/recipeConstants';
import { apiService } from '../../services/api';

export const getRecipes = (searchQuery = '', category = '') => async (dispatch) => {
    try {
        dispatch({ type: RECIPE_LIST_REQUEST });

        const params = {};
        if (searchQuery) params.search = searchQuery;
        if (category) params.category = category;

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

        // Dispatch success with updated recipe data
        dispatch({
            type: RECIPE_COMMENT_SUCCESS,
            payload: response.data,
        });
    } catch (error) {
        console.error('Error commenting on recipe:', error);
    }
};
