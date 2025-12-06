import {
  ADDRESS_LIST_REQUEST,
  ADDRESS_LIST_SUCCESS,
  ADDRESS_LIST_FAIL,
  ADDRESS_ADD_REQUEST,
  ADDRESS_ADD_SUCCESS,
  ADDRESS_ADD_FAIL,
  ADDRESS_UPDATE_REQUEST,
  ADDRESS_UPDATE_SUCCESS,
  ADDRESS_UPDATE_FAIL,
  ADDRESS_DELETE_REQUEST,
  ADDRESS_DELETE_SUCCESS,
  ADDRESS_DELETE_FAIL,
  ADDRESS_SET_DEFAULT_REQUEST,
  ADDRESS_SET_DEFAULT_SUCCESS,
  ADDRESS_SET_DEFAULT_FAIL,
} from '../constants/addressConstants';

export const addressListReducer = (state = { addresses: [] }, action) => {
  switch (action.type) {
    case ADDRESS_LIST_REQUEST:
      return { loading: true, addresses: [] };
    case ADDRESS_LIST_SUCCESS:
      return { loading: false, addresses: action.payload };
    case ADDRESS_LIST_FAIL:
      return { loading: false, error: action.payload };
    case ADDRESS_ADD_SUCCESS:
      return { ...state, addresses: [...state.addresses, action.payload] };
    case ADDRESS_UPDATE_SUCCESS:
      return {
        ...state,
        addresses: state.addresses.map((addr) =>
          addr._id === action.payload._id ? action.payload : addr
        ),
      };
    case ADDRESS_DELETE_SUCCESS:
      return {
        ...state,
        addresses: state.addresses.filter((addr) => addr._id !== action.payload),
      };
    case ADDRESS_SET_DEFAULT_SUCCESS:
      return {
        ...state,
        addresses: state.addresses.map((addr) => ({
          ...addr,
          isDefault: addr._id === action.payload._id,
        })),
      };
    default:
      return state;
  }
};

export const addressAddReducer = (state = {}, action) => {
  switch (action.type) {
    case ADDRESS_ADD_REQUEST:
      return { loading: true };
    case ADDRESS_ADD_SUCCESS:
      return { loading: false, success: true, address: action.payload };
    case ADDRESS_ADD_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};

export const addressUpdateReducer = (state = {}, action) => {
  switch (action.type) {
    case ADDRESS_UPDATE_REQUEST:
      return { loading: true };
    case ADDRESS_UPDATE_SUCCESS:
      return { loading: false, success: true, address: action.payload };
    case ADDRESS_UPDATE_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};

export const addressDeleteReducer = (state = {}, action) => {
  switch (action.type) {
    case ADDRESS_DELETE_REQUEST:
      return { loading: true };
    case ADDRESS_DELETE_SUCCESS:
      return { loading: false, success: true };
    case ADDRESS_DELETE_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};

export const addressSetDefaultReducer = (state = {}, action) => {
  switch (action.type) {
    case ADDRESS_SET_DEFAULT_REQUEST:
      return { loading: true };
    case ADDRESS_SET_DEFAULT_SUCCESS:
      return { loading: false, success: true };
    case ADDRESS_SET_DEFAULT_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};