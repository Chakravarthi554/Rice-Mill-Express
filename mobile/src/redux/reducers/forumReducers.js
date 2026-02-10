import {
    FORUM_POST_LIST_REQUEST,
    FORUM_POST_LIST_SUCCESS,
    FORUM_POST_LIST_FAIL,
    FORUM_POST_DETAILS_REQUEST,
    FORUM_POST_DETAILS_SUCCESS,
    FORUM_POST_DETAILS_FAIL,
    FORUM_POST_CREATE_REQUEST,
    FORUM_POST_CREATE_SUCCESS,
    FORUM_POST_CREATE_FAIL,
    FORUM_POST_CREATE_RESET,
    FORUM_POST_LIKE_SUCCESS,
    FORUM_POST_COMMENT_SUCCESS,
} from '../../constants/forumConstants';

export const forumPostListReducer = (state = { posts: [] }, action) => {
    switch (action.type) {
        case FORUM_POST_LIST_REQUEST:
            return { loading: true, posts: [] };
        case FORUM_POST_LIST_SUCCESS:
            return { loading: false, posts: action.payload };
        case FORUM_POST_LIST_FAIL:
            return { loading: false, error: action.payload };
        case FORUM_POST_LIKE_SUCCESS:
            return {
                ...state,
                posts: state.posts.map((p) =>
                    p._id === action.payload._id ? action.payload : p
                ),
            };
        case FORUM_POST_COMMENT_SUCCESS:
            return {
                ...state,
                posts: state.posts.map((p) =>
                    p._id === action.payload._id ? action.payload : p
                ),
            };
        default:
            return state;
    }
};

export const forumPostDetailsReducer = (state = { post: {} }, action) => {
    switch (action.type) {
        case FORUM_POST_DETAILS_REQUEST:
            return { ...state, loading: true };
        case FORUM_POST_DETAILS_SUCCESS:
            return { loading: false, post: action.payload };
        case FORUM_POST_DETAILS_FAIL:
            return { loading: false, error: action.payload };
        case FORUM_POST_LIKE_SUCCESS:
            return { ...state, post: action.payload };
        case FORUM_POST_COMMENT_SUCCESS:
            return { ...state, post: action.payload };
        default:
            return state;
    }
};

export const forumPostCreateReducer = (state = {}, action) => {
    switch (action.type) {
        case FORUM_POST_CREATE_REQUEST:
            return { loading: true };
        case FORUM_POST_CREATE_SUCCESS:
            return { loading: false, success: true, post: action.payload };
        case FORUM_POST_CREATE_FAIL:
            return { loading: false, error: action.payload };
        case FORUM_POST_CREATE_RESET:
            return {};
        default:
            return state;
    }
};
