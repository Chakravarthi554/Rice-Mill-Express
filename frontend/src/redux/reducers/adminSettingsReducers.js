import {
  ADMIN_SETTINGS_REQUEST,
  ADMIN_SETTINGS_SUCCESS,
  ADMIN_SETTINGS_FAIL,
  ADMIN_SETTINGS_UPDATE_REQUEST,
  ADMIN_SETTINGS_UPDATE_SUCCESS,
  ADMIN_SETTINGS_UPDATE_FAIL,
  ADMIN_SETTINGS_RESET_REQUEST,
  ADMIN_SETTINGS_RESET_SUCCESS,
  ADMIN_SETTINGS_RESET_FAIL,
  ADMIN_NOTIFICATION_SEND_REQUEST,
  ADMIN_NOTIFICATION_SEND_SUCCESS,
  ADMIN_NOTIFICATION_SEND_FAIL,
  ADMIN_RECIPES_LIST_REQUEST,
  ADMIN_RECIPES_LIST_SUCCESS,
  ADMIN_RECIPES_LIST_FAIL,
  PUBLIC_SETTINGS_REQUEST,
  PUBLIC_SETTINGS_SUCCESS,
  PUBLIC_SETTINGS_FAIL
} from '../constants/adminSettingsConstants';

const initialState = {
  settings: null,
  availableRecipes: [],
  loading: false,
  error: null,
  notificationLoading: false,
  resetLoading: false
};

export const adminSettingsReducer = (state = initialState, action) => {
  switch (action.type) {
    case ADMIN_SETTINGS_REQUEST:
    case ADMIN_SETTINGS_UPDATE_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };

    case ADMIN_SETTINGS_SUCCESS:
    case ADMIN_SETTINGS_UPDATE_SUCCESS:
    case ADMIN_SETTINGS_RESET_SUCCESS:
    case PUBLIC_SETTINGS_SUCCESS:
      return {
        ...state,
        loading: false,
        settings: action.payload,
        publicSettings: action.payload.referralSettings ? action.payload : state.publicSettings,
        error: null
      };

    case PUBLIC_SETTINGS_REQUEST:
      return { ...state, loading: true };

    case PUBLIC_SETTINGS_FAIL:
      return { ...state, loading: false, error: action.payload };

    case ADMIN_SETTINGS_FAIL:
    case ADMIN_SETTINGS_UPDATE_FAIL:
      return {
        ...state,
        loading: false,
        error: action.payload
      };

    case ADMIN_NOTIFICATION_SEND_REQUEST:
      return {
        ...state,
        notificationLoading: true,
        error: null
      };

    case ADMIN_NOTIFICATION_SEND_SUCCESS:
      return {
        ...state,
        notificationLoading: false,
        error: null
      };

    case ADMIN_NOTIFICATION_SEND_FAIL:
      return {
        ...state,
        notificationLoading: false,
        error: action.payload
      };

    case ADMIN_SETTINGS_RESET_REQUEST:
      return {
        ...state,
        resetLoading: true,
        error: null
      };

    case ADMIN_SETTINGS_RESET_FAIL:
      return {
        ...state,
        resetLoading: false,
        error: action.payload
      };

    case ADMIN_RECIPES_LIST_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };

    case ADMIN_RECIPES_LIST_SUCCESS:
      return {
        ...state,
        loading: false,
        availableRecipes: action.payload,
        error: null
      };

    case ADMIN_RECIPES_LIST_FAIL:
      return {
        ...state,
        loading: false,
        error: action.payload
      };

    default:
      return state;
  }
};