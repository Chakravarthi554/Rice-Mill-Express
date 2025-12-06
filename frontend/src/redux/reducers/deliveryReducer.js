import {
  DELIVERY_PARTNER_LIST_REQUEST,
  DELIVERY_PARTNER_LIST_SUCCESS,
  DELIVERY_PARTNER_LIST_FAIL,
  DELIVERY_PARTNER_CREATE_REQUEST,
  DELIVERY_PARTNER_CREATE_SUCCESS,
  DELIVERY_PARTNER_CREATE_FAIL,
  DELIVERY_PARTNER_UPDATE_REQUEST,
  DELIVERY_PARTNER_UPDATE_SUCCESS,
  DELIVERY_PARTNER_UPDATE_FAIL,
  DELIVERY_PARTNER_DELETE_REQUEST,
  DELIVERY_PARTNER_DELETE_SUCCESS,
  DELIVERY_PARTNER_DELETE_FAIL,
  DELIVERY_ASSIGN_REQUEST,
  DELIVERY_ASSIGN_SUCCESS,
  DELIVERY_ASSIGN_FAIL,
  ORDER_LIST_FOR_DELIVERY_REQUEST,
  ORDER_LIST_FOR_DELIVERY_SUCCESS,
  ORDER_LIST_FOR_DELIVERY_FAIL
} from '../constants/deliveryConstants';

const initialState = {
  partners: [],
  orders: [],
  loading: false,
  error: null
};

export const deliveryPartnerListReducer = (state = initialState, action) => {
  switch (action.type) {
    case DELIVERY_PARTNER_LIST_REQUEST:
      return { ...state, loading: true };
    case DELIVERY_PARTNER_LIST_SUCCESS:
      return { ...state, loading: false, partners: action.payload };
    case DELIVERY_PARTNER_LIST_FAIL:
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
};

export const deliveryPartnerActionReducer = (state = {}, action) => {
  switch (action.type) {
    case DELIVERY_PARTNER_CREATE_REQUEST:
    case DELIVERY_PARTNER_UPDATE_REQUEST:
    case DELIVERY_PARTNER_DELETE_REQUEST:
    case DELIVERY_ASSIGN_REQUEST:
      return { ...state, loading: true };
    case DELIVERY_PARTNER_CREATE_SUCCESS:
    case DELIVERY_PARTNER_UPDATE_SUCCESS:
    case DELIVERY_ASSIGN_SUCCESS:
      return { ...state, loading: false, success: true };
    case DELIVERY_PARTNER_DELETE_SUCCESS:
      return { ...state, loading: false, success: true, deletedId: action.payload };
    case DELIVERY_PARTNER_CREATE_FAIL:
    case DELIVERY_PARTNER_UPDATE_FAIL:
    case DELIVERY_PARTNER_DELETE_FAIL:
    case DELIVERY_ASSIGN_FAIL:
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
};

export const orderListForDeliveryReducer = (state = initialState, action) => {
  switch (action.type) {
    case ORDER_LIST_FOR_DELIVERY_REQUEST:
      return { ...state, loading: true };
    case ORDER_LIST_FOR_DELIVERY_SUCCESS:
      return { ...state, loading: false, orders: action.payload };
    case ORDER_LIST_FOR_DELIVERY_FAIL:
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
};