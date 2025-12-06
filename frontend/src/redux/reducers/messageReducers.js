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
  // New constants
  MESSAGE_GET_REQUEST,
  MESSAGE_GET_SUCCESS,
  MESSAGE_GET_FAIL,
} from '../constants/MessageConstants';

export const messageSendReducer = (state = {}, action) => {
  switch (action.type) {
    case MESSAGE_SEND_REQUEST:
      return { loading: true };
    case MESSAGE_SEND_SUCCESS:
      return { loading: false, success: true, message: action.payload };
    case MESSAGE_SEND_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};

export const messageHistoryReducer = (state = { messages: [], loading: false, error: null, totalPages: 1, currentPage: 1 }, action) => {
  switch (action.type) {
    case MESSAGE_HISTORY_REQUEST:
      return { ...state, loading: true, error: null };
    case MESSAGE_HISTORY_SUCCESS:
      return { loading: false, messages: action.payload.messages || [], totalPages: action.payload.totalPages || 1, currentPage: action.payload.currentPage || 1, error: null };
    case MESSAGE_HISTORY_FAIL:
      return { loading: false, messages: [], totalPages: 1, currentPage: 1, error: action.payload };
    default:
      return state;
  }
};

export const messageAdminReducer = (state = { chats: [], loading: false, error: null, totalPages: 1, currentPage: 1 }, action) => {
  switch (action.type) {
    case MESSAGE_ADMIN_REQUEST:
      return { loading: true, chats: [], error: null, totalPages: 1, currentPage: 1 };
    case MESSAGE_ADMIN_SUCCESS:
      return { loading: false, chats: action.payload.messages || [], totalPages: action.payload.totalPages || 1, currentPage: action.payload.currentPage || 1, error: null };
    case MESSAGE_ADMIN_FAIL:
      return { loading: false, chats: [], totalPages: 1, currentPage: 1, error: action.payload };
    default:
      return state;
  }
};

export const messageFlagReducer = (state = {}, action) => {
  switch (action.type) {
    case MESSAGE_FLAG_REQUEST:
      return { loading: true };
    case MESSAGE_FLAG_SUCCESS:
      return { loading: false, success: true };
    case MESSAGE_FLAG_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};

export const messageDeleteReducer = (state = {}, action) => {
  switch (action.type) {
    case MESSAGE_DELETE_REQUEST:
      return { loading: true };
    case MESSAGE_DELETE_SUCCESS:
      return { loading: false, success: true };
    case MESSAGE_DELETE_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};

export const messageBlockUserReducer = (state = {}, action) => {
  switch (action.type) {
    case MESSAGE_BLOCK_USER_REQUEST:
      return { loading: true };
    case MESSAGE_BLOCK_USER_SUCCESS:
      return { loading: false, success: true };
    case MESSAGE_BLOCK_USER_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};

// New reducer
export const messageGetReducer = (state = { messages: [], loading: false, error: null }, action) => {
  switch (action.type) {
    case MESSAGE_GET_REQUEST:
      return { ...state, loading: true, error: null };
    case MESSAGE_GET_SUCCESS:
      return { loading: false, messages: action.payload, error: null };
    case MESSAGE_GET_FAIL:
      return { loading: false, messages: [], error: action.payload };
    default:
      return state;
  }
};