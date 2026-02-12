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
    FORUM_COMMENT_LIKE_SUCCESS,
    FORUM_COMMENT_REPLY_SUCCESS,
} from '../../constants/forumConstants';

export const forumPostListReducer = (state = { posts: [] }, action) => {
    switch (action.type) {
        case FORUM_POST_LIST_REQUEST:
            return { ...state, loading: true };
        case FORUM_POST_LIST_SUCCESS:
            return {
                loading: false,
                posts: action.payload.posts,
                pages: action.payload.pages,
                page: action.payload.page
            };
        case FORUM_POST_LIST_FAIL:
            return { loading: false, error: action.payload };
        case FORUM_POST_LIKE_SUCCESS:
            return {
                ...state,
                posts: state.posts.map((p) =>
                    p._id === action.payload.postId
                        ? {
                            ...p,
                            likesCount: action.payload.likesCount,
                            userLiked: action.payload.userLiked,
                            likes: action.payload.userLiked
                                ? [...(p.likes || []), 'current'] // Optimistic add
                                : (p.likes || []).filter(l => l !== 'current') // Optimistic remove
                        }
                        : p
                ),
            };
        case FORUM_POST_COMMENT_SUCCESS:
            return {
                ...state,
                posts: state.posts.map((p) =>
                    p._id === action.payload.postId
                        ? {
                            ...p,
                            replies: [...(p.replies || []), action.payload.comment],
                            commentsCount: (p.commentsCount || 0) + 1,
                        }
                        : p
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
            return {
                ...state,
                post: {
                    ...state.post,
                    likesCount: action.payload.likesCount,
                    userLiked: action.payload.userLiked,
                    likes: action.payload.userLiked
                        ? [...(state.post.likes || []), 'current']
                        : (state.post.likes || []).filter(l => l !== 'current')
                },
            };
        case FORUM_POST_COMMENT_SUCCESS:
            return {
                ...state,
                post: {
                    ...state.post,
                    replies: [...(state.post.replies || []), action.payload.comment],
                },
            };
        case FORUM_COMMENT_LIKE_SUCCESS:
            return {
                ...state,
                post: {
                    ...state.post,
                    replies: (state.post.replies || []).map(c =>
                        c._id === action.payload.commentId
                            ? {
                                ...c,
                                likesCount: action.payload.likesCount,
                                hasLiked: action.payload.hasLiked,
                                likes: action.payload.hasLiked
                                    ? [...(c.likes || []), 'current']
                                    : (c.likes || []).filter(id => id !== 'current')
                            }
                            : c
                    )
                }
            };
        case FORUM_COMMENT_REPLY_SUCCESS:
            return {
                ...state,
                post: {
                    ...state.post,
                    replies: (state.post.replies || []).map(c =>
                        c._id === action.payload.commentId
                            ? {
                                ...c,
                                nestedReplies: [...(c.nestedReplies || []), action.payload.comment]
                            }
                            : c
                    )
                }
            };
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
