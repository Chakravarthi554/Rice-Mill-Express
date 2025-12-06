import {
  ADMIN_MESSAGES_CONVERSATIONS_REQUEST,
  ADMIN_MESSAGES_CONVERSATIONS_SUCCESS,
  ADMIN_MESSAGES_CONVERSATIONS_FAIL,
  ADMIN_MESSAGES_CONVERSATION_REQUEST,
  ADMIN_MESSAGES_CONVERSATION_SUCCESS,
  ADMIN_MESSAGES_CONVERSATION_FAIL,
  ADMIN_MESSAGES_SEND_REQUEST,
  ADMIN_MESSAGES_SEND_SUCCESS,
  ADMIN_MESSAGES_SEND_FAIL,
  ADMIN_MESSAGES_RESOLVE_REQUEST,
  ADMIN_MESSAGES_RESOLVE_SUCCESS,
  ADMIN_MESSAGES_RESOLVE_FAIL,
  ADMIN_MESSAGES_STATS_REQUEST,
  ADMIN_MESSAGES_STATS_SUCCESS,
  ADMIN_MESSAGES_STATS_FAIL
} from '../constants/adminMessageConstants';

const initialState = {
  conversations: [],
  currentConversation: null,
  stats: {},
  loading: false,
  error: null
};

export const adminMessagesReducer = (state = initialState, action) => {
  switch (action.type) {
    case ADMIN_MESSAGES_CONVERSATIONS_REQUEST:
    case ADMIN_MESSAGES_CONVERSATION_REQUEST:
    case ADMIN_MESSAGES_STATS_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };

    case ADMIN_MESSAGES_CONVERSATIONS_SUCCESS:
      return {
        ...state,
        loading: false,
        conversations: action.payload.conversations || [],
        error: null
      };

    case ADMIN_MESSAGES_CONVERSATION_SUCCESS:
      return {
        ...state,
        loading: false,
        currentConversation: action.payload,
        error: null
      };

    case ADMIN_MESSAGES_STATS_SUCCESS:
      return {
        ...state,
        loading: false,
        stats: action.payload,
        error: null
      };

    case ADMIN_MESSAGES_SEND_REQUEST:
    case ADMIN_MESSAGES_RESOLVE_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };

    case ADMIN_MESSAGES_SEND_SUCCESS:
    case ADMIN_MESSAGES_RESOLVE_SUCCESS:
      return {
        ...state,
        loading: false,
        error: null
      };

    case ADMIN_MESSAGES_CONVERSATIONS_FAIL:
    case ADMIN_MESSAGES_CONVERSATION_FAIL:
    case ADMIN_MESSAGES_SEND_FAIL:
    case ADMIN_MESSAGES_RESOLVE_FAIL:
    case ADMIN_MESSAGES_STATS_FAIL:
      return {
        ...state,
        loading: false,
        error: action.payload
      };

    default:
      return state;
  }
};