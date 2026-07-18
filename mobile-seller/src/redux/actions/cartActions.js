import { apiService } from '../../services/api';
import {
    CART_ADD_ITEM,
    CART_REMOVE_ITEM,
    CART_FAIL,
    CART_FETCH_REQUEST,
    CART_FETCH_SUCCESS,
    CART_FETCH_FAIL,
    CART_UPDATE_ITEM_SUCCESS,
    CART_CLEAR_ITEMS,
} from '../../constants/cartConstants';

export const getCart = () => async (dispatch) => {
    try {
        dispatch({ type: CART_FETCH_REQUEST });

        const response = await apiService.getCart();

        dispatch({
            type: CART_FETCH_SUCCESS,
            payload: response.data || [],
        });
    } catch (error) {
        dispatch({
            type: CART_FETCH_FAIL,
            payload: error.response && error.response.data.message
                ? error.response.data.message
                : error.message,
        });
    }
};

export const addToCart = (productId, qty) => async (dispatch) => {
    try {
        // optimistically add to cart or just wait for API
        await apiService.addToCart(productId, qty);

        // Refresh full cart state from server after adding
        dispatch(getCart());
    } catch (error) {
        console.error('Add to cart error:', error);
        dispatch({
            type: CART_FAIL,
            payload: 'Failed to add item to cart'
        });
    }
};

export const removeFromCart = (productId) => async (dispatch) => {
    try {
        dispatch({ type: CART_REMOVE_ITEM, payload: productId });
        await apiService.removeFromCart(productId);
        // Sync with server
        dispatch(getCart());
    } catch (error) {
        console.error('Remove from cart error:', error);
    }
};

export const updateCartItem = (productId, qty) => async (dispatch) => {
    try {
        await apiService.updateCartItem(productId, qty);
        dispatch({ type: CART_UPDATE_ITEM_SUCCESS });
        dispatch(getCart());
    } catch (error) {
        console.error('Update cart error:', error);
    }
};

export const clearCart = () => (dispatch) => {
    dispatch({ type: CART_CLEAR_ITEMS });
};
