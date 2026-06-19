import {
  ORDER_LIST_REQUEST,
  ORDER_LIST_SUCCESS,
  ORDER_LIST_FAIL,
  ORDER_DETAILS_REQUEST,
  ORDER_DETAILS_SUCCESS,
  ORDER_DETAILS_FAIL,
  ORDER_CREATE_REQUEST,
  ORDER_CREATE_SUCCESS,
  ORDER_CREATE_FAIL,
  ORDER_PAY_REQUEST,
  ORDER_PAY_SUCCESS,
  ORDER_PAY_FAIL,
  ORDER_LIST_MY_REQUEST,
  ORDER_LIST_MY_SUCCESS,
  ORDER_LIST_MY_FAIL,
  ORDER_CANCEL_REQUEST,
  ORDER_CANCEL_SUCCESS,
  ORDER_CANCEL_FAIL,
  ORDER_DELIVER_REQUEST,
  ORDER_DELIVER_SUCCESS,
  ORDER_DELIVER_FAIL,
  ORDER_LIST_SELLER_REQUEST,
  ORDER_LIST_SELLER_SUCCESS,
  ORDER_LIST_SELLER_FAIL,
  ORDER_UPDATE_REQUEST,
  ORDER_UPDATE_SUCCESS,
  ORDER_UPDATE_FAIL,
  ORDER_DELIVERY_PARTNERS_REQUEST,
  ORDER_DELIVERY_PARTNERS_SUCCESS,
  ORDER_DELIVERY_PARTNERS_FAIL,
  ORDER_REPORT_COD_REQUEST,
  ORDER_REPORT_COD_SUCCESS,
  ORDER_REPORT_COD_FAIL,
  ASSIGN_DELIVERY_PARTNER_REQUEST,
  ASSIGN_DELIVERY_PARTNER_SUCCESS,
  ASSIGN_DELIVERY_PARTNER_FAIL,
  UPLOAD_COD_PROOF_REQUEST,
  UPLOAD_COD_PROOF_SUCCESS,
  UPLOAD_COD_PROOF_FAIL,
} from '../constants/orderConstants';

import { DELIVERY_ASSIGN_SUCCESS } from '../constants/deliveryConstants';

export const orderListReducer = (state = { orders: [] }, action) => {
  switch (action.type) {
    case ORDER_LIST_REQUEST:
      return { loading: true, orders: [] };
    case ORDER_LIST_SUCCESS:
      return { loading: false, orders: action.payload };
    case ORDER_LIST_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};

export const orderListMyReducer = (state = { orders: [] }, action) => {
  switch (action.type) {
    case ORDER_LIST_MY_REQUEST:
      return { loading: true, orders: [] };
    case ORDER_LIST_MY_SUCCESS:
      return { loading: false, orders: action.payload };
    case ORDER_LIST_MY_FAIL:
      return { loading: false, error: action.payload };
    case ORDER_UPDATE_SUCCESS:
      return {
        ...state,
        orders: state.orders.map((order) =>
          order._id === action.payload._id ? action.payload : order
        ),
      };
    case ORDER_UPDATE_FAIL:
      return { ...state, error: action.payload };
    case ORDER_CANCEL_SUCCESS:
      return {
        ...state,
        orders: state.orders.map((order) =>
          order._id === action.payload._id ? action.payload : order
        ),
      };
    default:
      return state;
  }
};

export const orderDetailsReducer = (state = { order: {} }, action) => {
  switch (action.type) {
    case ORDER_DETAILS_REQUEST:
      return { ...state, loading: true };
    case ORDER_DETAILS_SUCCESS:
      return { loading: false, order: action.payload };
    case ORDER_DETAILS_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};

export const orderCreateReducer = (state = {}, action) => {
  switch (action.type) {
    case ORDER_CREATE_REQUEST:
      return { loading: true };
    case ORDER_CREATE_SUCCESS:
      return { loading: false, success: true, order: action.payload };
    case ORDER_CREATE_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};

export const orderPayReducer = (state = {}, action) => {
  switch (action.type) {
    case ORDER_PAY_REQUEST:
      return { loading: true };
    case ORDER_PAY_SUCCESS:
      return { loading: false, success: true, order: action.payload };
    case ORDER_PAY_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};

export const orderDeliverReducer = (state = {}, action) => {
  switch (action.type) {
    case ORDER_DELIVER_REQUEST:
      return { loading: true };
    case ORDER_DELIVER_SUCCESS:
      return { loading: false, success: true };
    case ORDER_DELIVER_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};

export const orderListSellerReducer = (state = { orders: [] }, action) => {
  switch (action.type) {
    case ORDER_LIST_SELLER_REQUEST:
      return { loading: true, orders: [] };
    case ORDER_LIST_SELLER_SUCCESS:
      return { loading: false, orders: action.payload };
    case ORDER_LIST_SELLER_FAIL:
      return { loading: false, error: action.payload };
    case ORDER_UPDATE_SUCCESS:
    case DELIVERY_ASSIGN_SUCCESS:
      // The payload from backend is the updated order object
      const updatedOrder = action.payload;

      // state.orders can be either:
      // 1. An array of orders (direct from backend)
      // 2. An object with { orders: [...], page, pages, total }

      if (Array.isArray(state.orders)) {
        // Case 1: Direct array
        return {
          ...state,
          orders: state.orders.map(order =>
            order._id === updatedOrder._id ? { ...order, ...updatedOrder } : order
          )
        };
      } else if (state.orders && Array.isArray(state.orders.orders)) {
        // Case 2: Paginated object
        return {
          ...state,
          orders: {
            ...state.orders,
            orders: state.orders.orders.map(order =>
              order._id === updatedOrder._id ? { ...order, ...updatedOrder } : order
            )
          }
        };
      }
      return state;
    default:
      return state;
  }
};

export const orderUpdateReducer = (state = {}, action) => {
  switch (action.type) {
    case ORDER_UPDATE_REQUEST:
      return { loading: true };
    case ORDER_UPDATE_SUCCESS:
      return { loading: false, success: true, order: action.payload };
    case ORDER_UPDATE_FAIL:
      return { loading: false, error: action.payload };
    case 'ORDER_UPDATE_RESET':
      return {};
    default:
      return state;
  }
};

export const orderDeliveryPartnersReducer = (state = { partners: [] }, action) => {
  switch (action.type) {
    case ORDER_DELIVERY_PARTNERS_REQUEST:
      return { loading: true, partners: [] };
    case ORDER_DELIVERY_PARTNERS_SUCCESS:
      return { loading: false, partners: action.payload };
    case ORDER_DELIVERY_PARTNERS_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};

export const orderReportCODReducer = (state = {}, action) => {
  switch (action.type) {
    case ORDER_REPORT_COD_REQUEST:
      return { loading: true };
    case ORDER_REPORT_COD_SUCCESS:
      return { loading: false, success: true, order: action.payload };
    case ORDER_REPORT_COD_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};

export const assignDeliveryPartnerReducer = (state = {}, action) => {
  switch (action.type) {
    case ASSIGN_DELIVERY_PARTNER_REQUEST:
      return { loading: true };
    case ASSIGN_DELIVERY_PARTNER_SUCCESS:
      return { loading: false, success: true, order: action.payload };
    case ASSIGN_DELIVERY_PARTNER_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};

export const uploadCODProofReducer = (state = {}, action) => {
  switch (action.type) {
    case UPLOAD_COD_PROOF_REQUEST:
      return { loading: true };
    case UPLOAD_COD_PROOF_SUCCESS:
      return { loading: false, success: true, url: action.payload };
    case UPLOAD_COD_PROOF_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};

export const orderCancelReducer = (state = {}, action) => {
  switch (action.type) {
    case ORDER_CANCEL_REQUEST:
      return { loading: true };
    case ORDER_CANCEL_SUCCESS:
      return { loading: false, success: true, order: action.payload };
    case ORDER_CANCEL_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};
