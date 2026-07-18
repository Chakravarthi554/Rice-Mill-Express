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

export const userReviewsReducer = (state = { reviews: [] }, action) => {
    switch (action.type) {
        case USER_REVIEWS_REQUEST:
            return { loading: true, reviews: [] };
        case USER_REVIEWS_SUCCESS:
            return { loading: false, reviews: action.payload };
        case USER_REVIEWS_FAIL:
            return { loading: false, error: action.payload };
        default:
            return state;
    }
};

export const deleteReviewReducer = (state = {}, action) => {
    switch (action.type) {
        case DELETE_REVIEW_REQUEST:
            return { loading: true };
        case DELETE_REVIEW_SUCCESS:
            return { loading: false, success: true };
        case DELETE_REVIEW_FAIL:
            return { loading: false, error: action.payload };
        default:
            return state;
    }
};

export const updateReviewReducer = (state = {}, action) => {
    switch (action.type) {
        case UPDATE_REVIEW_REQUEST:
            return { loading: true };
        case UPDATE_REVIEW_SUCCESS:
            return { loading: false, success: true, review: action.payload };
        case UPDATE_REVIEW_FAIL:
            return { loading: false, error: action.payload };
        default:
            return state;
    }
};
