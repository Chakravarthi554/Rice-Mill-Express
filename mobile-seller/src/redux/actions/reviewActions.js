import {
    USER_REVIEWS_REQUEST,
    USER_REVIEWS_SUCCESS,
    USER_REVIEWS_FAIL,
    DELETE_REVIEW_REQUEST,
    DELETE_REVIEW_SUCCESS,
    DELETE_REVIEW_FAIL,
    UPDATE_REVIEW_REQUEST,
    UPDATE_REVIEW_SUCCESS,
    UPDATE_REVIEW_FAIL,
} from '../../constants/reviewConstants';
import { apiService } from '../../services/api';

export const getUserReviews = () => async (dispatch) => {
    try {
        dispatch({ type: USER_REVIEWS_REQUEST });

        const response = await apiService.getUserReviews();

        dispatch({
            type: USER_REVIEWS_SUCCESS,
            payload: response.data,
        });
    } catch (error) {
        dispatch({
            type: USER_REVIEWS_FAIL,
            payload: error.response?.data?.message || error.message,
        });
    }
};

export const deleteReview = (reviewId) => async (dispatch) => {
    try {
        dispatch({ type: DELETE_REVIEW_REQUEST });

        await apiService.deleteReview(reviewId);

        dispatch({
            type: DELETE_REVIEW_SUCCESS,
            payload: reviewId,
        });

        // Refresh reviews list
        dispatch(getUserReviews());
    } catch (error) {
        dispatch({
            type: DELETE_REVIEW_FAIL,
            payload: error.response?.data?.message || error.message,
        });
    }
};

export const updateReview = (reviewId, reviewData) => async (dispatch) => {
    try {
        dispatch({ type: UPDATE_REVIEW_REQUEST });

        const response = await apiService.updateReview(reviewId, reviewData);

        dispatch({
            type: UPDATE_REVIEW_SUCCESS,
            payload: response.data,
        });

        // Refresh reviews list
        dispatch(getUserReviews());
    } catch (error) {
        dispatch({
            type: UPDATE_REVIEW_FAIL,
            payload: error.response?.data?.message || error.message,
        });
    }
};
