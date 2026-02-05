import { apiService } from '../../services/api';
import {
    CART_ADD_ITEM,
    CART_REMOVE_ITEM,
    CART_FAIL,
} from '../../constants/cartConstants';

export const addToCart = (id, qty) => async (dispatch, getState) => {
    try {
        const { data } = await apiService.getProductById(id);

        let image = data.product.image;
        if (!image && data.product.images && data.product.images.length > 0) {
            image = data.product.images[0];
        }

        dispatch({
            type: CART_ADD_ITEM,
            payload: {
                product: data.product._id,
                name: data.product.name,
                image: image,
                price: data.product.price,
                countInStock: data.product.countInStock,
                qty,
            },
        });

        await apiService.addToCart(id, qty);
    } catch (error) {
        console.error('Add to cart error:', error);
        dispatch({
            type: CART_FAIL,
            payload: 'Failed to add item to cart'
        })
    }
};

export const removeFromCart = (id) => (dispatch, getState) => {
    dispatch({
        type: CART_REMOVE_ITEM,
        payload: id,
    });
};
