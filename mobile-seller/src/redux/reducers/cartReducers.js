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

export const cartReducer = (state = { cartItems: [], loading: false }, action) => {
    switch (action.type) {
        case CART_FETCH_REQUEST:
            return { ...state, loading: true };
        case CART_FETCH_SUCCESS:
            // Defensive check: if payload is the API envelope object, extract the array. Otherwise fallback to []
            const safePayload = Array.isArray(action.payload) ? action.payload : (action.payload?.data && Array.isArray(action.payload.data) ? action.payload.data : []);
            return { loading: false, cartItems: safePayload };
        case CART_FETCH_FAIL:
            return { ...state, loading: false, error: action.payload };
        case CART_ADD_ITEM:
            return { ...state, loading: false }; // Handled by refresh
        case CART_UPDATE_ITEM_SUCCESS:
            return { ...state, loading: false }; // Handled by refresh
        case CART_REMOVE_ITEM:
            return {
                ...state,
                cartItems: state.cartItems.filter((x) => (x.product?._id || x.product) !== action.payload),
            };
        case CART_FAIL:
            return { ...state, loading: false, error: action.payload };
        case CART_CLEAR_ITEMS:
            return { ...state, cartItems: [] };
        default:
            return state;
    }
};
