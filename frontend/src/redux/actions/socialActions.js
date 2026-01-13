import axios from 'axios'
import {
  SOCIAL_LIKE_REQUEST,
  SOCIAL_LIKE_SUCCESS,
  SOCIAL_LIKE_FAIL,
  SOCIAL_COMMENT_REQUEST,
  SOCIAL_COMMENT_SUCCESS,
  SOCIAL_COMMENT_FAIL,
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
  SOCIAL_TYPE_PRODUCT,
  SOCIAL_TYPE_RECIPE,
  SOCIAL_TYPE_FORUM,
  SOCIAL_COMMENT_LIKE_REQUEST,
  SOCIAL_COMMENT_LIKE_SUCCESS,
  SOCIAL_COMMENT_LIKE_FAIL,
  SOCIAL_COMMENT_REPLY_REQUEST,
  SOCIAL_COMMENT_REPLY_SUCCESS,
  SOCIAL_COMMENT_REPLY_FAIL,
  SOCIAL_RATING_DIST_REQUEST,
  SOCIAL_RATING_DIST_SUCCESS,
  SOCIAL_RATING_DIST_FAIL
} from '../constants/socialConstants'

// Like/Unlike an item
export const likeItem = (itemType, itemId) => async (dispatch, getState) => {
  try {
    dispatch({ type: SOCIAL_LIKE_REQUEST })

    const {
      userLogin: { userInfo },
    } = getState()

    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userInfo.token}`,
      },
    }

    const { data } = await axios.post(
      `/api/social/${itemType}/${itemId}/like`,
      {},
      config
    )

    dispatch({
      type: SOCIAL_LIKE_SUCCESS,
      payload: data,
    })

    // Emit socket event for real-time updates
    if (window.socket) {
      window.socket.emit('SOCIAL_ACTION', {
        type: 'LIKE',
        itemType,
        itemId,
        userId: userInfo._id,
        data
      })
    }

  } catch (error) {
    dispatch({
      type: SOCIAL_LIKE_FAIL,
      payload:
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
    })
  }
}

// Add comment to an item
export const addComment = (itemType, itemId, comment) => async (dispatch, getState) => {
  try {
    dispatch({ type: SOCIAL_COMMENT_REQUEST })

    const {
      userLogin: { userInfo },
    } = getState()

    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userInfo.token}`,
      },
    }

    const { data } = await axios.post(
      `/api/social/${itemType}/${itemId}/comment`,
      { content: comment },
      config
    )

    dispatch({
      type: SOCIAL_COMMENT_SUCCESS,
      payload: data,
    })

    // Emit socket event for real-time updates
    if (window.socket) {
      window.socket.emit('SOCIAL_ACTION', {
        type: 'COMMENT',
        itemType,
        itemId,
        userId: userInfo._id,
        data
      })
    }

  } catch (error) {
    dispatch({
      type: SOCIAL_COMMENT_FAIL,
      payload:
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
    })
  }
}

// Get comments for an item
export const getComments = (itemType, itemId, page = 1) => async (dispatch) => {
  try {
    dispatch({ type: SOCIAL_GET_COMMENTS_REQUEST })

    const { data } = await axios.get(
      `/api/social/${itemType}/${itemId}/comments?page=${page}`
    )

    dispatch({
      type: SOCIAL_GET_COMMENTS_SUCCESS,
      payload: data,
    })

  } catch (error) {
    dispatch({
      type: SOCIAL_GET_COMMENTS_FAIL,
      payload:
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
    })
  }
}

// Approve comment (Admin only)
export const approveComment = (itemType, itemId, commentId) => async (dispatch, getState) => {
  try {
    dispatch({ type: SOCIAL_APPROVE_COMMENT_REQUEST })

    const {
      userLogin: { userInfo },
    } = getState()

    const config = {
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
      },
    }

    const { data } = await axios.put(
      `/api/social/comments/${commentId}/approve`,
      {},
      config
    )

    dispatch({
      type: SOCIAL_APPROVE_COMMENT_SUCCESS,
      payload: data,
    })

    // Emit socket event for real-time updates
    if (window.socket) {
      window.socket.emit('SOCIAL_ACTION', {
        type: 'COMMENT_APPROVED',
        itemType,
        itemId,
        commentId,
        data
      })
    }

  } catch (error) {
    dispatch({
      type: SOCIAL_APPROVE_COMMENT_FAIL,
      payload:
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
    })
  }
}

// Delete comment
export const deleteComment = (itemType, itemId, commentId) => async (dispatch, getState) => {
  try {
    dispatch({ type: SOCIAL_DELETE_COMMENT_REQUEST })

    const {
      userLogin: { userInfo },
    } = getState()

    const config = {
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
      },
    }

    await axios.delete(
      `/api/social/${itemType}/${itemId}/comments/${commentId}`,
      config
    )

    dispatch({
      type: SOCIAL_DELETE_COMMENT_SUCCESS,
      payload: commentId,
    })

  } catch (error) {
    dispatch({
      type: SOCIAL_DELETE_COMMENT_FAIL,
      payload:
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
    })
  }
}

// Track share action
export const trackShare = (itemType, itemId, platform) => async (dispatch, getState) => {
  try {
    dispatch({ type: SOCIAL_SHARE_REQUEST })

    const {
      userLogin: { userInfo },
    } = getState()

    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userInfo.token}`,
      },
    }

    const { data } = await axios.post(
      `/api/social/${itemType}/${itemId}/share`,
      { platform },
      config
    )

    dispatch({
      type: SOCIAL_SHARE_SUCCESS,
      payload: data,
    })

    // Emit socket event for real-time updates
    if (window.socket) {
      window.socket.emit('SOCIAL_ACTION', {
        type: 'SHARE',
        itemType,
        itemId,
        userId: userInfo._id,
        platform,
        data
      })
    }

  } catch (error) {
    dispatch({
      type: SOCIAL_SHARE_FAIL,
      payload:
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
    })
  }
}

// Like/Unlike a comment
export const likeComment = (itemType, itemId, commentId) => async (dispatch, getState) => {
  try {
    dispatch({ type: SOCIAL_COMMENT_LIKE_REQUEST })

    const {
      userLogin: { userInfo },
    } = getState()

    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userInfo.token}`,
      },
    }

    const { data } = await axios.post(
      `/api/social/${itemType}/${itemId}/comments/${commentId}/like`,
      {},
      config
    )

    dispatch({
      type: SOCIAL_COMMENT_LIKE_SUCCESS,
      payload: { commentId, ...data },
    })

  } catch (error) {
    dispatch({
      type: SOCIAL_COMMENT_LIKE_FAIL,
      payload:
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
    })
  }
}

// Reply to a comment
export const replyToComment = (itemType, itemId, commentId, text) => async (dispatch, getState) => {
  try {
    dispatch({ type: SOCIAL_COMMENT_REPLY_REQUEST })

    const {
      userLogin: { userInfo },
    } = getState()

    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userInfo.token}`,
      },
    }

    const { data } = await axios.post(
      `/api/social/${itemType}/${itemId}/comments/${commentId}/reply`,
      { content: text },
      config
    )

    dispatch({
      type: SOCIAL_COMMENT_REPLY_SUCCESS,
      payload: data,
    })

    // Emit socket event
    if (window.socket) {
      window.socket.emit('SOCIAL_ACTION', {
        type: 'COMMENT_REPLY',
        itemType,
        itemId,
        commentId,
        userId: userInfo._id,
        data
      })
    }

  } catch (error) {
    dispatch({
      type: SOCIAL_COMMENT_REPLY_FAIL,
      payload:
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
    })
  }
}

// Get sorted comments
export const getSortedComments = (itemType, itemId, sortBy = 'recent', page = 1) => async (dispatch) => {
  try {
    dispatch({ type: SOCIAL_GET_COMMENTS_REQUEST })

    const { data } = await axios.get(
      `/api/social/${itemType}/${itemId}/comments/sorted?sortBy=${sortBy}&page=${page}`
    )

    dispatch({
      type: SOCIAL_GET_COMMENTS_SUCCESS,
      payload: data,
    })

  } catch (error) {
    dispatch({
      type: SOCIAL_GET_COMMENTS_FAIL,
      payload:
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
    })
  }
}

// Get rating distribution
export const getRatingDistribution = (id) => async (dispatch) => {
  try {
    dispatch({ type: SOCIAL_RATING_DIST_REQUEST })

    const { data } = await axios.get(`/api/social/recipes/${id}/rating-distribution`)

    dispatch({
      type: SOCIAL_RATING_DIST_SUCCESS,
      payload: data,
    })

  } catch (error) {
    dispatch({
      type: SOCIAL_RATING_DIST_FAIL,
      payload:
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
    })
  }
}