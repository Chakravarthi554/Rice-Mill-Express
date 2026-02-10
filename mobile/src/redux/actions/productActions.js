import { apiService } from '../../services/api';
import {
    PRODUCT_LIST_REQUEST,
    PRODUCT_LIST_SUCCESS,
    PRODUCT_LIST_FAIL,
    PRODUCT_DETAILS_REQUEST,
    PRODUCT_DETAILS_SUCCESS,
    PRODUCT_DETAILS_FAIL,
    PRODUCT_CREATE_REVIEW_REQUEST,
    PRODUCT_CREATE_REVIEW_SUCCESS,
    PRODUCT_CREATE_REVIEW_FAIL,
} from '../../constants/productConstants';

export const listProducts = (keyword = '') => async (dispatch) => {
    try {
        dispatch({ type: PRODUCT_LIST_REQUEST });

        // Pass keyword/params if needed. apiService.getProducts accepts params.
        const { data } = await apiService.getProducts({ keyword });

        dispatch({
            type: PRODUCT_LIST_SUCCESS,
            payload: data.products || [],
        });
    } catch (error) {
        dispatch({
            type: PRODUCT_LIST_FAIL,
            payload: error.response && error.response.data.message
                ? error.response.data.message
                : error.message,
        });
    }
};

export const listProductDetails = (id) => async (dispatch) => {
    try {
        dispatch({ type: PRODUCT_DETAILS_REQUEST });

        const { data } = await apiService.getProductById(id);

        dispatch({
            type: PRODUCT_DETAILS_SUCCESS,
            payload: data.product,
        });
    } catch (error) {
        dispatch({
            type: PRODUCT_DETAILS_FAIL,
            payload: error.response && error.response.data.message
                ? error.response.data.message
                : error.message,
        });
    }
};

export const createProductReview = (productId, review) => async (dispatch) => {
    try {
        dispatch({ type: PRODUCT_CREATE_REVIEW_REQUEST });

        await apiService.createProductReview(productId, review);

        dispatch({
            type: PRODUCT_CREATE_REVIEW_SUCCESS,
        });
    } catch (error) {
        dispatch({
            type: PRODUCT_CREATE_REVIEW_FAIL,
            payload: error.response && error.response.data.message
                ? error.response.data.message
                : error.message,
        });
    }
};
