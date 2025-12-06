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
} from '../constants/bulkOrderConstants';
import {
 
  BULK_ORDER_DETAILS_REQUEST,
  BULK_ORDER_DETAILS_SUCCESS,
  BULK_ORDER_DETAILS_FAIL,
} from '../constants/bulkOrderConstants';



export const bulkOrderCreateReducer = (state = {}, action) => {
  switch (action.type) {
    case BULK_ORDER_CREATE_REQUEST:
      return { loading: true };
    case BULK_ORDER_CREATE_SUCCESS:
      return { loading: false, success: true, order: action.payload };
    case BULK_ORDER_CREATE_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};

export const bulkOrderListReducer = (state = { bulkOrders: [] }, action) => {
  switch (action.type) {
    case BULK_ORDER_LIST_REQUEST:
      return { loading: true, bulkOrders: [] };
    case BULK_ORDER_LIST_SUCCESS:
      return { loading: false, bulkOrders: action.payload };
    case BULK_ORDER_LIST_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};
export const bulkOrderDetailsReducer = (state = { bulkOrder: {} }, action) => {
  switch (action.type) {
    case BULK_ORDER_DETAILS_REQUEST:
      return { ...state, loading: true };
    case BULK_ORDER_DETAILS_SUCCESS:
      return { loading: false, bulkOrder: action.payload };
    case BULK_ORDER_DETAILS_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};

export const bulkOrderUpdateReducer = (state = {}, action) => {
  switch (action.type) {
    case BULK_ORDER_UPDATE_REQUEST:
      return { loading: true };
    case BULK_ORDER_UPDATE_SUCCESS:
      return { loading: false, success: true, order: action.payload };
    case BULK_ORDER_UPDATE_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};