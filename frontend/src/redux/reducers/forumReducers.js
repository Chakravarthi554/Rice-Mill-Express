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
  FORUM_POST_UPDATE_REQUEST,
  FORUM_POST_UPDATE_SUCCESS,
  FORUM_POST_UPDATE_FAIL,
  FORUM_POST_DELETE_REQUEST,
  FORUM_POST_DELETE_SUCCESS,
  FORUM_POST_DELETE_FAIL,
  FORUM_POST_LIKE_REQUEST,
  FORUM_POST_LIKE_SUCCESS,
  FORUM_POST_LIKE_FAIL,
  FORUM_POST_REPLY_REQUEST,
  FORUM_POST_REPLY_SUCCESS,
  FORUM_POST_REPLY_FAIL,
  FORUM_POST_APPROVE_REQUEST,
  FORUM_POST_APPROVE_SUCCESS,
  FORUM_POST_APPROVE_FAIL,
  FORUM_POST_REPORT_REQUEST,
  FORUM_POST_REPORT_SUCCESS,
  FORUM_POST_REPORT_FAIL,
  FORUM_POST_PIN_REQUEST,
  FORUM_POST_PIN_SUCCESS,
  FORUM_POST_PIN_FAIL,
  FORUM_COMMENT_MODERATE_REQUEST,
  FORUM_COMMENT_MODERATE_SUCCESS,
  FORUM_COMMENT_MODERATE_FAIL,
  FORUM_COMMENT_REPORT_REQUEST,
  FORUM_COMMENT_REPORT_SUCCESS,
  FORUM_COMMENT_REPORT_FAIL,
  FORUM_FLAGGED_COMMENTS_REQUEST,
  FORUM_FLAGGED_COMMENTS_SUCCESS,
  FORUM_FLAGGED_COMMENTS_FAIL,
  FORUM_POST_LIST_LIVE_FAIL,
  FORUM_POST_LIST_LIVE_REQUEST,
  FORUM_POST_LIST_LIVE_SUCCESS,
} from '../constants/ForumConstants';

export const forumPostListReducer = (state = { posts: [] }, action) => {
  switch (action.type) {
    case FORUM_POST_LIST_REQUEST:
      return { loading: true, posts: [] };
    case FORUM_POST_LIST_SUCCESS:
      return {
        loading: false,
        posts: action.payload.posts,
        page: action.payload.page,
        pages: action.payload.pages,
        total: action.payload.total,
      };
    case FORUM_POST_LIST_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};

export const forumPostDetailsReducer = (state = { post: { comments: [] } }, action) => {
  switch (action.type) {
    case FORUM_POST_DETAILS_REQUEST:
      return { ...state, loading: true };
    case FORUM_POST_DETAILS_SUCCESS:
      return { loading: false, post: action.payload };
    case FORUM_POST_DETAILS_FAIL:
      return { loading: false, error: action.payload };
    case FORUM_POST_LIKE_SUCCESS:
      if (state.post) {
        return {
          ...state,
          post: {
            ...state.post,
            likesCount: action.payload?.likesCount ?? state.post.likesCount,
            userLiked: action.payload?.hasLiked ?? !state.post.userLiked,
          }
        };
      }
      return state;
    case FORUM_POST_REPLY_SUCCESS:
      if (state.post) {
        return {
          ...state,
          post: {
            ...state.post,
            comments: [...(state.post.comments || []), action.payload],
            commentsCount: (state.post.commentsCount || 0) + 1,
          }
        };
      }
      return state;
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
    default:
      return state;
  }
};

export const forumPostDeleteReducer = (state = {}, action) => {
  switch (action.type) {
    case FORUM_POST_DELETE_REQUEST:
      return { loading: true };
    case FORUM_POST_DELETE_SUCCESS:
      return { loading: false, success: true };
    case FORUM_POST_DELETE_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};

export const forumPostLikeReducer = (state = {}, action) => {
  switch (action.type) {
    case FORUM_POST_LIKE_REQUEST:
      return { loading: true };
    case FORUM_POST_LIKE_SUCCESS:
      return { loading: false, success: true, likes: action.payload };
    case FORUM_POST_LIKE_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};

export const forumPostReplyReducer = (state = {}, action) => {
  switch (action.type) {
    case FORUM_POST_REPLY_REQUEST:
      return { loading: true };
    case FORUM_POST_REPLY_SUCCESS:
      return { loading: false, success: true, comment: action.payload };
    case FORUM_POST_REPLY_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};

export const forumPostApproveReducer = (state = {}, action) => {
  switch (action.type) {
    case FORUM_POST_APPROVE_REQUEST:
      return { loading: true };
    case FORUM_POST_APPROVE_SUCCESS:
      return { loading: false, success: true, post: action.payload };
    case FORUM_POST_APPROVE_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};

export const forumPostReportReducer = (state = {}, action) => {
  switch (action.type) {
    case FORUM_POST_REPORT_REQUEST:
      return { loading: true };
    case FORUM_POST_REPORT_SUCCESS:
      return { loading: false, success: true };
    case FORUM_POST_REPORT_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};

export const forumPostPinReducer = (state = {}, action) => {
  switch (action.type) {
    case FORUM_POST_PIN_REQUEST:
      return { loading: true };
    case FORUM_POST_PIN_SUCCESS:
      return { loading: false, success: true, post: action.payload };
    case FORUM_POST_PIN_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};

export const forumCommentModerateReducer = (state = {}, action) => {
  switch (action.type) {
    case FORUM_COMMENT_MODERATE_REQUEST:
      return { loading: true };
    case FORUM_COMMENT_MODERATE_SUCCESS:
      return { loading: false, success: true };
    case FORUM_COMMENT_MODERATE_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};

export const forumCommentReportReducer = (state = {}, action) => {
  switch (action.type) {
    case FORUM_COMMENT_REPORT_REQUEST:
      return { loading: true };
    case FORUM_COMMENT_REPORT_SUCCESS:
      return { loading: false, success: true };
    case FORUM_COMMENT_REPORT_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};

// NEW: Flagged Comments Reducer
export const forumFlaggedCommentsReducer = (state = { comments: [] }, action) => {
  switch (action.type) {
    case FORUM_FLAGGED_COMMENTS_REQUEST:
      return { loading: true, comments: [] };
    case FORUM_FLAGGED_COMMENTS_SUCCESS:
      return {
        loading: false,
        comments: action.payload.comments,
        page: action.payload.page,
        pages: action.payload.pages,
        total: action.payload.total,
      };
    case FORUM_FLAGGED_COMMENTS_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};
export const forumPostListLiveReducer = (state = { posts: [] }, action) => {
  switch (action.type) {
    case FORUM_POST_LIST_LIVE_REQUEST:
      return { loading: true, posts: [] };
    case FORUM_POST_LIST_LIVE_SUCCESS:
      return {
        loading: false,
        posts: action.payload.posts,
        page: action.payload.page,
        pages: action.payload.pages,
        total: action.payload.total,
      };
    case FORUM_POST_LIST_LIVE_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};
