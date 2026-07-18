import { apiService } from '../../services/api';
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
  BULK_ORDER_DETAILS_REQUEST,
  BULK_ORDER_DETAILS_SUCCESS,
  BULK_ORDER_DETAILS_FAIL,
} from '../../constants/bulkOrderConstants';

export const createBulkOrder = (orderData) => async (dispatch) => {
  try {
    dispatch({ type: BULK_ORDER_CREATE_REQUEST });
    const { data } = await apiService.createBulkOrder(orderData);
    dispatch({ type: BULK_ORDER_CREATE_SUCCESS, payload: data });
  } catch (error) {
    dispatch({
      type: BULK_ORDER_CREATE_FAIL,
      payload: error.response?.data?.message || error.message,
    });
  }
};

export const getBulkOrders = () => async (dispatch) => {
  try {
    dispatch({ type: BULK_ORDER_LIST_REQUEST });
    const { data } = await apiService.getBulkOrders();
    dispatch({ type: BULK_ORDER_LIST_SUCCESS, payload: data });
  } catch (error) {
    dispatch({
      type: BULK_ORDER_LIST_FAIL,
      payload: error.response?.data?.message || error.message,
    });
  }
};

export const getBulkOrderDetails = (id) => async (dispatch) => {
  try {
    dispatch({ type: BULK_ORDER_DETAILS_REQUEST });
    const { data } = await apiService.getBulkOrderById(id);
    dispatch({ type: BULK_ORDER_DETAILS_SUCCESS, payload: data });
  } catch (error) {
    dispatch({
      type: BULK_ORDER_DETAILS_FAIL,
      payload: error.response?.data?.message || error.message,
    });
  }
};

export const updateBulkOrder = (id, updateData) => async (dispatch) => {
  try {
    dispatch({ type: BULK_ORDER_UPDATE_REQUEST });
    // Assuming updateBulkOrder exists in apiService, if not we'll add it
    const { data } = await apiService.updateBulkOrder(id, updateData);
    dispatch({ type: BULK_ORDER_UPDATE_SUCCESS, payload: data });
    dispatch(getBulkOrders());
  } catch (error) {
    dispatch({
      type: BULK_ORDER_UPDATE_FAIL,
      payload: error.response?.data?.message || error.message,
    });
  }
};
