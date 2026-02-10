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

export const recipeListReducer = (state = { recipes: [] }, action) => {
    switch (action.type) {
        case RECIPE_LIST_REQUEST:
            return { loading: true, recipes: [] };
        case RECIPE_LIST_SUCCESS:
            return { loading: false, recipes: action.payload };
        case RECIPE_LIST_FAIL:
            return { loading: false, error: action.payload };
        case RECIPE_RATE_SUCCESS:
            return {
                ...state,
                recipes: state.recipes.map((r) =>
                    r._id === action.payload._id ? action.payload : r
                ),
            };
        case RECIPE_COMMENT_SUCCESS:
            return {
                ...state,
                recipes: state.recipes.map((r) =>
                    r._id === action.payload._id ? action.payload : r
                ),
            };
        default:
            return state;
    }
};

export const recipeDetailsReducer = (state = { recipe: {} }, action) => {
    switch (action.type) {
        case RECIPE_DETAILS_REQUEST:
            return { ...state, loading: true };
        case RECIPE_DETAILS_SUCCESS:
            return { loading: false, recipe: action.payload };
        case RECIPE_DETAILS_FAIL:
            return { loading: false, error: action.payload };
        case RECIPE_RATE_SUCCESS:
            return { ...state, recipe: action.payload };
        case RECIPE_COMMENT_SUCCESS:
            return { ...state, recipe: action.payload };
        default:
            return state;
    }
};
