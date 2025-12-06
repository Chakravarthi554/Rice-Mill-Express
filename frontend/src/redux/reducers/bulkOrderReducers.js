import {
  BULK_ORDER_CREATE_REQUEST,
  BULK_ORDER_CREATE_SUCCESS,
  BULK_ORDER_CREATE_FAIL,
  BULK_ORDER_LIST_REQUEST,
  BULK_ORDER_LIST_SUCCESS,
  BULK_ORDER_LIST_FAIL,
  BULK_ORDER_UPDATE_REQUEST,
  BULK_ORDER_UPDATE_SUCCESS,
  BULK_ORDER_UPDATE_FAIL,
  BULK_ORDER_CANCEL_REQUEST,
  BULK_ORDER_CANCEL_SUCCESS,
  BULK_ORDER_CANCEL_FAIL,
} from '../constants/bulkOrderConstants';

export const bulkOrderCreateReducer = (state = {}, action) => {
  switch (action.type) {
    case BULK_ORDER_CREATE_REQUEST:
      return { loading: true };
    case BULK_ORDER_CREATE_SUCCESS:
      return { 
        loading: false, 
        success: true, 
        bulkOrder: action.payload,
        error: null 
      };
    case BULK_ORDER_CREATE_FAIL:
      return { 
        loading: false, 
        error: action.payload,
        bulkOrder: null 
      };
    default:
      return state;
  }
};

export const bulkOrderListReducer = (state = { bulkOrders: [], loading: false }, action) => {
  switch (action.type) {
    case BULK_ORDER_LIST_REQUEST:
      return { 
        loading: true, 
        bulkOrders: [],
        error: null 
      };
    case BULK_ORDER_LIST_SUCCESS:
      return { 
        loading: false, 
        bulkOrders: action.payload,
        error: null 
      };
    case BULK_ORDER_LIST_FAIL:
      return { 
        loading: false, 
        error: action.payload,
        bulkOrders: [] 
      };
    default:
      return state;
  }
};

export const bulkOrderUpdateReducer = (state = {}, action) => {
  switch (action.type) {
    case BULK_ORDER_UPDATE_REQUEST:
      return { loading: true };
    case BULK_ORDER_UPDATE_SUCCESS:
      return { 
        loading: false, 
        success: true, 
        bulkOrder: action.payload,
        error: null 
      };
    case BULK_ORDER_UPDATE_FAIL:
      return { 
        loading: false, 
        error: action.payload,
        bulkOrder: null 
      };
    default:
      return state;
  }
};

export const bulkOrderCancelReducer = (state = {}, action) => {
  switch (action.type) {
    case BULK_ORDER_CANCEL_REQUEST:
      return { loading: true };
    case BULK_ORDER_CANCEL_SUCCESS:
      return { 
        loading: false, 
        success: true, 
        bulkOrder: action.payload,
        error: null 
      };
    case BULK_ORDER_CANCEL_FAIL:
      return { 
        loading: false, 
        error: action.payload,
        bulkOrder: null 
      };
    default:
      return state;
  }
};