import {
    WISHLIST_ADD_ITEM,
    WISHLIST_REMOVE_ITEM,
    WISHLIST_FETCH_REQUEST,
    WISHLIST_FETCH_SUCCESS,
    WISHLIST_FETCH_FAIL,
} from '../../constants/wishlistConstants';

export const wishlistReducer = (state = { wishlistItems: [], loading: false }, action) => {
    switch (action.type) {
        case WISHLIST_FETCH_REQUEST:
            return { ...state, loading: true };
        case WISHLIST_FETCH_SUCCESS:
            return { loading: false, wishlistItems: action.payload };
        case WISHLIST_FETCH_FAIL:
            return { ...state, loading: false, error: action.payload };
        case WISHLIST_ADD_ITEM:
            // Optimistic update: add productId to the list (as a temporary object if needed)
            // But since getWishlist() is usually called right after, we just ensure it doesn't crash
            // and maybe add it if it's not there.
            const exists = state.wishlistItems.find(x => (x._id || x) === action.payload);
            if (exists) return state;
            return {
                ...state,
                wishlistItems: [...state.wishlistItems, { _id: action.payload, name: 'Loading...' }]
            };
        case WISHLIST_REMOVE_ITEM:
            return {
                ...state,
                wishlistItems: state.wishlistItems.filter((x) => (x._id || x) !== action.payload),
            };
        default:
            return state;
    }
};
