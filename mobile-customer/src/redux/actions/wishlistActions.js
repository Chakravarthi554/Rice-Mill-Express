import {
    WISHLIST_ADD_ITEM,
    WISHLIST_REMOVE_ITEM,
    WISHLIST_FETCH_REQUEST,
    WISHLIST_FETCH_SUCCESS,
    WISHLIST_FETCH_FAIL,
} from '../../constants/wishlistConstants';
import { apiService } from '../../services/api';

export const getWishlist = () => async (dispatch) => {
    try {
        dispatch({ type: WISHLIST_FETCH_REQUEST });

        const response = await apiService.getWishlist();

        dispatch({
            type: WISHLIST_FETCH_SUCCESS,
            payload: response.data || [],
        });
    } catch (error) {
        dispatch({
            type: WISHLIST_FETCH_FAIL,
            payload: error.response && error.response.data.message
                ? error.response.data.message
                : error.message,
        });
    }
};

export const addToWishlist = (productId) => async (dispatch) => {
    try {
        await apiService.addToWishlist(productId);

        dispatch({
            type: WISHLIST_ADD_ITEM,
            payload: productId,
        });

        // Optionally refresh the whole list to ensure UI sync
        dispatch(getWishlist());
    } catch (error) {
        console.error('Add to wishlist error:', error);
    }
};

export const removeFromWishlist = (productId) => async (dispatch) => {
    try {
        await apiService.removeFromWishlist(productId);

        dispatch({
            type: WISHLIST_REMOVE_ITEM,
            payload: productId,
        });
    } catch (error) {
        console.error('Remove from wishlist error:', error);
    }
};
