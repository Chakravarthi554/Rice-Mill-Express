import {
  SOCIAL_LIKE_REQUEST,
  SOCIAL_LIKE_SUCCESS,
  SOCIAL_LIKE_FAIL,
  SOCIAL_LIKE_RESET,
  SOCIAL_COMMENT_REQUEST,
  SOCIAL_COMMENT_SUCCESS,
  SOCIAL_COMMENT_FAIL,
  SOCIAL_COMMENT_RESET,
  SOCIAL_GET_COMMENTS_REQUEST,
  SOCIAL_GET_COMMENTS_SUCCESS,
  SOCIAL_GET_COMMENTS_FAIL,
  SOCIAL_APPROVE_COMMENT_REQUEST,
  SOCIAL_APPROVE_COMMENT_SUCCESS,
  SOCIAL_APPROVE_COMMENT_FAIL,
  SOCIAL_DELETE_COMMENT_REQUEST,
  SOCIAL_DELETE_COMMENT_SUCCESS,
  SOCIAL_DELETE_COMMENT_FAIL,
  SOCIAL_SHARE_REQUEST,
  SOCIAL_SHARE_SUCCESS,
  SOCIAL_SHARE_FAIL,
  SOCIAL_COMMENT_LIKE_REQUEST,
  SOCIAL_COMMENT_LIKE_SUCCESS,
  SOCIAL_COMMENT_LIKE_FAIL,
  SOCIAL_COMMENT_REPLY_REQUEST,
  SOCIAL_COMMENT_REPLY_SUCCESS,
  SOCIAL_COMMENT_REPLY_FAIL,
  SOCIAL_RATING_DIST_REQUEST,
  SOCIAL_RATING_DIST_SUCCESS,
  SOCIAL_RATING_DIST_FAIL
} from '../constants/socialConstants';

export const socialLikeReducer = (state = {}, action) => {
  switch (action.type) {
    case SOCIAL_LIKE_REQUEST:
      return { loading: true };
    case SOCIAL_LIKE_SUCCESS:
      return { loading: false, success: true, data: action.payload };
    case SOCIAL_LIKE_FAIL:
      return { loading: false, error: action.payload };
    case SOCIAL_LIKE_RESET:
      return {};
    default:
      return state;
  }
};

export const socialCommentReducer = (state = {}, action) => {
  switch (action.type) {
    case SOCIAL_COMMENT_REQUEST:
      return { loading: true };
    case SOCIAL_COMMENT_SUCCESS:
      return { loading: false, success: true, data: action.payload };
    case SOCIAL_COMMENT_FAIL:
      return { loading: false, error: action.payload };
    case SOCIAL_COMMENT_RESET:
      return {};
    default:
      return state;
  }
};

export const socialCommentsListReducer = (state = { comments: [] }, action) => {
  switch (action.type) {
    case SOCIAL_GET_COMMENTS_REQUEST:
      return { loading: true, comments: [] };
    case SOCIAL_GET_COMMENTS_SUCCESS:
      return {
        loading: false,
        comments: action.payload.comments,
        pages: action.payload.pages,
        page: action.payload.page,
        total: action.payload.total
      };
    case SOCIAL_GET_COMMENTS_FAIL:
      return { loading: false, error: action.payload, comments: [] };
    default:
      return state;
  }
};

export const socialCommentApproveReducer = (state = {}, action) => {
  switch (action.type) {
    case SOCIAL_APPROVE_COMMENT_REQUEST:
      return { loading: true };
    case SOCIAL_APPROVE_COMMENT_SUCCESS:
      return { loading: false, success: true, data: action.payload };
    case SOCIAL_APPROVE_COMMENT_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};

export const socialCommentDeleteReducer = (state = {}, action) => {
  switch (action.type) {
    case SOCIAL_DELETE_COMMENT_REQUEST:
      return { loading: true };
    case SOCIAL_DELETE_COMMENT_SUCCESS:
      return { loading: false, success: true };
    case SOCIAL_DELETE_COMMENT_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};

export const socialShareReducer = (state = {}, action) => {
  switch (action.type) {
    case SOCIAL_SHARE_REQUEST:
      return { loading: true };
    case SOCIAL_SHARE_SUCCESS:
      return { loading: false, success: true, data: action.payload };
    case SOCIAL_SHARE_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
}

export const socialCommentLikeReducer = (state = {}, action) => {
  switch (action.type) {
    case SOCIAL_COMMENT_LIKE_REQUEST:
      return { loading: true };
    case SOCIAL_COMMENT_LIKE_SUCCESS:
      return { loading: false, success: true, data: action.payload };
    case SOCIAL_COMMENT_LIKE_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};

export const socialCommentReplyReducer = (state = {}, action) => {
  switch (action.type) {
    case SOCIAL_COMMENT_REPLY_REQUEST:
      return { loading: true };
    case SOCIAL_COMMENT_REPLY_SUCCESS:
      return { loading: false, success: true, data: action.payload };
    case SOCIAL_COMMENT_REPLY_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};

export const socialRatingDistReducer = (state = { distribution: {}, percentages: {} }, action) => {
  switch (action.type) {
    case SOCIAL_RATING_DIST_REQUEST:
      return { loading: true, ...state };
    case SOCIAL_RATING_DIST_SUCCESS:
      return { loading: false, success: true, ...action.payload };
    case SOCIAL_RATING_DIST_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};