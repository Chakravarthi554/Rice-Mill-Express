import {
  MODERATION_PENDING_REQUEST,
  MODERATION_PENDING_SUCCESS,
  MODERATION_PENDING_FAIL,
  MODERATION_FLAGGED_REQUEST,
  MODERATION_FLAGGED_SUCCESS,
  MODERATION_FLAGGED_FAIL,
  MODERATION_APPROVE_REQUEST,
  MODERATION_APPROVE_SUCCESS,
  MODERATION_APPROVE_FAIL,
  MODERATION_REJECT_REQUEST,
  MODERATION_REJECT_SUCCESS,
  MODERATION_REJECT_FAIL,
  MODERATION_DELETE_REQUEST,
  MODERATION_DELETE_SUCCESS,
  MODERATION_DELETE_FAIL,
  MODERATION_PIN_REQUEST,
  MODERATION_PIN_SUCCESS,
  MODERATION_PIN_FAIL,
  MODERATION_STATS_REQUEST,
  MODERATION_STATS_SUCCESS,
  MODERATION_STATS_FAIL
} from '../constants/moderationConstants';

const initialState = {
  pendingContent: [],
  flaggedContent: [],
  stats: {},
  loading: false,
  error: null
};

export const moderationReducer = (state = initialState, action) => {
  switch (action.type) {
    case MODERATION_PENDING_REQUEST:
    case MODERATION_FLAGGED_REQUEST:
    case MODERATION_STATS_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };

    case MODERATION_PENDING_SUCCESS:
      return {
        ...state,
        loading: false,
        pendingContent: action.payload.content,
        error: null
      };

    case MODERATION_FLAGGED_SUCCESS:
      return {
        ...state,
        loading: false,
        flaggedContent: action.payload.content,
        error: null
      };

    case MODERATION_STATS_SUCCESS:
      return {
        ...state,
        loading: false,
        stats: action.payload,
        error: null
      };

    case MODERATION_APPROVE_REQUEST:
    case MODERATION_REJECT_REQUEST:
    case MODERATION_DELETE_REQUEST:
    case MODERATION_PIN_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };

    case MODERATION_APPROVE_SUCCESS:
    case MODERATION_REJECT_SUCCESS:
    case MODERATION_DELETE_SUCCESS:
    case MODERATION_PIN_SUCCESS:
      return {
        ...state,
        loading: false,
        error: null
      };

    case MODERATION_PENDING_FAIL:
    case MODERATION_FLAGGED_FAIL:
    case MODERATION_APPROVE_FAIL:
    case MODERATION_REJECT_FAIL:
    case MODERATION_DELETE_FAIL:
    case MODERATION_PIN_FAIL:
    case MODERATION_STATS_FAIL:
      return {
        ...state,
        loading: false,
        error: action.payload
      };

    default:
      return state;
  }
};