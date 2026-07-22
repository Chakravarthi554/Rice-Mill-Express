import {
    RECIPE_LIST_REQUEST,
    RECIPE_LIST_SUCCESS,
    RECIPE_LIST_FAIL,
    RECIPE_DETAILS_REQUEST,
    RECIPE_DETAILS_SUCCESS,
    RECIPE_DETAILS_FAIL,
    RECIPE_RATE_SUCCESS,
    RECIPE_COMMENT_SUCCESS,
    RECIPE_LIKE_SUCCESS,
    RECIPE_SHARE_SUCCESS,
    RECIPE_COMMENT_LIKE_SUCCESS,
    RECIPE_COMMENT_REPLY_SUCCESS,
    RECIPE_MY_LIST_REQUEST,
    RECIPE_MY_LIST_SUCCESS,
    RECIPE_MY_LIST_FAIL,
    RECIPE_SUBMIT_REQUEST,
    RECIPE_SUBMIT_SUCCESS,
    RECIPE_SUBMIT_FAIL,
    RECIPE_SUBMIT_RESET,
    RECIPE_DELETE_REQUEST,
    RECIPE_DELETE_SUCCESS,
    RECIPE_DELETE_FAIL,
} from '../../constants/recipeConstants';

export const recipeListReducer = (state = { recipes: [] }, action) => {
    switch (action.type) {
        case RECIPE_LIST_REQUEST:
            return { ...state, loading: true, error: null };
        case RECIPE_LIST_SUCCESS:
            return {
                loading: false,
                recipes: action.payload.recipes,
                pages: action.payload.pages,
                page: action.payload.page,
                total: action.payload.total
            };
        case RECIPE_LIST_FAIL:
            return { ...state, loading: false, error: action.payload };
        case RECIPE_RATE_SUCCESS:
            return {
                ...state,
                recipes: state.recipes.map((r) =>
                    r._id === action.payload._id ? { ...r, ...action.payload } : r
                ),
            };
        case RECIPE_COMMENT_SUCCESS:
            return {
                ...state,
                recipes: state.recipes.map((r) =>
                    r._id === action.payload._id
                        ? {
                            ...r,
                            comments: [action.payload.comment, ...(r.comments || [])],
                            commentsCount: action.payload.commentsCount
                        }
                        : r
                ),
            };
        case RECIPE_LIKE_SUCCESS:
        case RECIPE_SHARE_SUCCESS:
            return {
                ...state,
                recipes: state.recipes.map((r) =>
                    r._id === action.payload._id ? { ...r, ...action.payload } : r
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
            return { ...state, recipe: { ...state.recipe, ...action.payload } };
        case RECIPE_COMMENT_SUCCESS:
            return {
                ...state,
                recipe: {
                    ...state.recipe,
                    comments: [action.payload.comment, ...(state.recipe.comments || [])],
                    commentsCount: action.payload.commentsCount
                }
            };
        case RECIPE_LIKE_SUCCESS:
        case RECIPE_SHARE_SUCCESS:
            return {
                ...state,
                recipe: { ...state.recipe, ...action.payload },
            };
        case RECIPE_COMMENT_LIKE_SUCCESS:
            return {
                ...state,
                recipe: {
                    ...state.recipe,
                    comments: state.recipe.comments.map((c) =>
                        c._id === action.payload.commentId
                            ? { ...c, likesCount: action.payload.likes, userLiked: action.payload.userLiked }
                            : c
                    ),
                },
            };
        case RECIPE_COMMENT_REPLY_SUCCESS:
            return {
                ...state,
                recipe: {
                    ...state.recipe,
                    comments: state.recipe.comments.map((c) =>
                        c._id === action.payload.commentId
                            ? { ...c, replies: [...(c.replies || []), action.payload.comment] }
                            : c
                    ),
                },
            };
        default:
            return state;
    }
};

export const recipeMyListReducer = (state = { recipes: [] }, action) => {
    switch (action.type) {
        case RECIPE_MY_LIST_REQUEST:
            return { ...state, loading: true, error: null };
        case RECIPE_MY_LIST_SUCCESS:
            return { loading: false, recipes: action.payload };
        case RECIPE_MY_LIST_FAIL:
            return { ...state, loading: false, error: action.payload };
        case RECIPE_DELETE_SUCCESS:
            return {
                ...state,
                recipes: state.recipes.filter(r => r._id !== action.payload)
            };
        default:
            return state;
    }
};

export const recipeSubmitReducer = (state = {}, action) => {
    switch (action.type) {
        case RECIPE_SUBMIT_REQUEST:
            return { loading: true };
        case RECIPE_SUBMIT_SUCCESS:
            return { loading: false, success: true, recipe: action.payload };
        case RECIPE_SUBMIT_FAIL:
            return { loading: false, error: action.payload };
        case RECIPE_SUBMIT_RESET:
            return {};
        default:
            return state;
    }
};
