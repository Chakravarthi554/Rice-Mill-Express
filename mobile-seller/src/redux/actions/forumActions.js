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
import { apiService } from '../../services/api';

export const getForumPosts = (searchQuery = '', category = '') => async (dispatch) => {
  try {
    dispatch({ type: FORUM_POST_LIST_REQUEST });

    const params = { status: 'approved' };
    if (searchQuery) params.search = searchQuery;
    if (category) params.category = category;

    const response = await apiService.getForumPosts(params);

    dispatch({
      type: FORUM_POST_LIST_SUCCESS,
      payload: response.data,
    });
  } catch (error) {
    dispatch({
      type: FORUM_POST_LIST_FAIL,
      payload: error.response?.data?.message || error.message,
    });
  }
};

export const getForumPostDetails = (id) => async (dispatch) => {
  try {
    dispatch({ type: FORUM_POST_DETAILS_REQUEST });

    const response = await apiService.getForumPostById(id);

    dispatch({
      type: FORUM_POST_DETAILS_SUCCESS,
      payload: response.data,
    });
  } catch (error) {
    dispatch({
      type: FORUM_POST_DETAILS_FAIL,
      payload: error.response?.data?.message || error.message,
    });
  }
};

export const createForumPost = (postData) => async (dispatch) => {
  try {
    dispatch({ type: FORUM_POST_CREATE_REQUEST });

    const response = await apiService.createForumPost(postData);

    dispatch({
      type: FORUM_POST_CREATE_SUCCESS,
      payload: response.data,
    });
  } catch (error) {
    dispatch({
      type: FORUM_POST_CREATE_FAIL,
      payload: error.response?.data?.message || error.message,
    });
  }
};

export const likeForumPost = (id) => async (dispatch) => {
  try {
    const response = await apiService.likeForumPost(id);

    // Dispatch success with structured payload
    dispatch({
      type: FORUM_POST_LIKE_SUCCESS,
      payload: { postId: id, ...response.data },
    });
  } catch (error) {
    console.error('Error liking post:', error);
  }
};

export const commentOnForumPost = (id, comment) => async (dispatch) => {
  try {
    const response = await apiService.commentOnForumPost(id, comment);

    // Dispatch success with new comment and postId
    dispatch({
      type: FORUM_POST_COMMENT_SUCCESS,
      payload: { postId: id, comment: response.data },
    });
  } catch (error) {
    console.error('Error commenting on post:', error);
  }
};

export const likeForumComment = (postId, commentId) => async (dispatch) => {
  try {
    const response = await apiService.likeForumComment(postId, commentId);

    dispatch({
      type: FORUM_COMMENT_LIKE_SUCCESS,
      payload: { postId, commentId, ...response.data },
    });
  } catch (error) {
    console.error('Error liking comment:', error);
  }
};

export const replyToForumComment = (postId, commentId, comment) => async (dispatch) => {
  try {
    const response = await apiService.replyToForumComment(postId, commentId, comment);

    dispatch({
      type: FORUM_COMMENT_REPLY_SUCCESS,
      payload: { postId, commentId, comment: response.data.comment },
    });
  } catch (error) {
    console.error('Error replying to comment:', error);
  }
};

export const resetForumPostCreate = () => (dispatch) => {
  dispatch({ type: FORUM_POST_CREATE_RESET });
};
