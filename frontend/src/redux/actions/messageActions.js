import api from "../../utils/api";
import {
  MESSAGE_SEND_REQUEST,
  MESSAGE_SEND_SUCCESS,
  MESSAGE_SEND_FAIL,
  MESSAGE_HISTORY_REQUEST,
  MESSAGE_HISTORY_SUCCESS,
  MESSAGE_HISTORY_FAIL,
  MESSAGE_ADMIN_REQUEST,
  MESSAGE_ADMIN_SUCCESS,
  MESSAGE_ADMIN_FAIL,
  MESSAGE_FLAG_REQUEST,
  MESSAGE_FLAG_SUCCESS,
  MESSAGE_FLAG_FAIL,
  MESSAGE_DELETE_REQUEST,
  MESSAGE_DELETE_SUCCESS,
  MESSAGE_DELETE_FAIL,
  MESSAGE_BLOCK_USER_REQUEST,
  MESSAGE_BLOCK_USER_SUCCESS,
  MESSAGE_BLOCK_USER_FAIL,
  // New constant
  MESSAGE_GET_REQUEST,
  MESSAGE_GET_SUCCESS,
  MESSAGE_GET_FAIL,
} from "../constants/MessageConstants";

export const sendMessage = (messageData) => async (dispatch, getState) => {
  try {
    dispatch({ type: MESSAGE_SEND_REQUEST });
    const { userLogin: { userInfo } } = getState();
    const config = {
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
        "Content-Type": "multipart/form-data",
      },
    };
    const { data } = await api.post("/api/v1/messages/send", messageData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    dispatch({ type: MESSAGE_SEND_SUCCESS, payload: data });
  } catch (error) {
    const errorMessage = error.response && error.response.data.message
      ? error.response.data.message
      : error.message;
    console.error("Send message error:", errorMessage, error);
    dispatch({
      type: MESSAGE_SEND_FAIL,
      payload: errorMessage,
    });
  }
};

export const getChatHistory = (receiverId, page = 1, limit = 10) => async (dispatch, getState) => {
  try {
    dispatch({ type: MESSAGE_HISTORY_REQUEST });
    const { userLogin: { userInfo } } = getState();
    const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
    const { data } = await api.get(`/api/v1/messages/history/${receiverId}?page=${page}&limit=${limit}`);
    dispatch({ type: MESSAGE_HISTORY_SUCCESS, payload: data });
  } catch (error) {
    dispatch({
      type: MESSAGE_HISTORY_FAIL,
      payload: error.response?.data?.message || error.message,
    });
  }
};

export const getAllChatsForAdmin = (page = 1, limit = 10) => async (dispatch, getState) => {
  try {
    dispatch({ type: MESSAGE_ADMIN_REQUEST });
    const { userLogin: { userInfo } } = getState();
    const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
    const { data } = await api.get(`/api/v1/messages/admin/chats?page=${page}&limit=${limit}`);
    dispatch({ type: MESSAGE_ADMIN_SUCCESS, payload: data });
  } catch (error) {
    dispatch({
      type: MESSAGE_ADMIN_FAIL,
      payload: error.response?.data?.message || error.message,
    });
  }
};

export const flagMessage = (messageId) => async (dispatch, getState) => {
  try {
    dispatch({ type: MESSAGE_FLAG_REQUEST });
    const { userLogin: { userInfo } } = getState();
    const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
    const { data } = await api.put(`/api/v1/messages/flag/${messageId}`, {});
    dispatch({ type: MESSAGE_FLAG_SUCCESS, payload: data });
    dispatch(getAllChatsForAdmin()); // Refresh admin chats after flagging
  } catch (error) {
    dispatch({
      type: MESSAGE_FLAG_FAIL,
      payload: error.response?.data?.message || error.message,
    });
  }
};

export const deleteMessage = (messageId) => async (dispatch, getState) => {
  try {
    dispatch({ type: MESSAGE_DELETE_REQUEST });
    const { userLogin: { userInfo } } = getState();
    const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
    const { data } = await api.delete(`/api/v1/messages/delete/${messageId}`);
    dispatch({ type: MESSAGE_DELETE_SUCCESS, payload: data });
    dispatch(getAllChatsForAdmin()); // Refresh admin chats after deletion
  } catch (error) {
    dispatch({
      type: MESSAGE_DELETE_FAIL,
      payload: error.response?.data?.message || error.message,
    });
  }
};

export const blockUser = (userId) => async (dispatch, getState) => {
  try {
    dispatch({ type: MESSAGE_BLOCK_USER_REQUEST });
    const { userLogin: { userInfo } } = getState();
    const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
    const { data } = await api.put(`/api/v1/messages/block/${userId}`, {});
    dispatch({ type: MESSAGE_BLOCK_USER_SUCCESS, payload: data });
    dispatch(getAllChatsForAdmin()); // Refresh admin chats after blocking
  } catch (error) {
    dispatch({
      type: MESSAGE_BLOCK_USER_FAIL,
      payload: error.response?.data?.message || error.message,
    });
  }
};

// New action creator
export const getMessages = (postId) => async (dispatch, getState) => {
  try {
    dispatch({ type: MESSAGE_GET_REQUEST });
    const { userLogin: { userInfo } } = getState();
    const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
    const { data } = await api.get(`/api/v1/messages/post/${postId}`);
    dispatch({ type: MESSAGE_GET_SUCCESS, payload: data });
  } catch (error) {
    dispatch({
      type: MESSAGE_GET_FAIL,
      payload: error.response?.data?.message || error.message,
    });
  }
};