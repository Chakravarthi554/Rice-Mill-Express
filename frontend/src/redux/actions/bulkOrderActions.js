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
  BULK_ORDER_DETAILS_REQUEST,
  BULK_ORDER_DETAILS_SUCCESS,
  BULK_ORDER_DETAILS_FAIL,
} from '../constants/bulkOrderConstants';
import api from '../../utils/api';
import { handleApiError } from '../../utils/handleApiError';

export const createBulkOrder = (orderData) => async (dispatch) => {
  try {
    dispatch({ type: BULK_ORDER_CREATE_REQUEST });
    console.log('Creating bulk order →', orderData);
    const { data } = await api.post('/api/v1/bulk-orders', orderData);
    dispatch({
      type: BULK_ORDER_CREATE_SUCCESS,
      payload: data.order || data.bulkOrder,
    });
    return { success: true, data };
  } catch (error) {
    const message = handleApiError(error);
    dispatch({
      type: BULK_ORDER_CREATE_FAIL,
      payload: message,
    });
    return { success: false, error: message };
  }
};

export const getBulkOrders = (status = '') => async (dispatch) => {
  try {
    dispatch({ type: BULK_ORDER_LIST_REQUEST });
    const config = status ? { params: { status } } : {};
    const { data } = await api.get('/api/v1/bulk-orders', config);
    dispatch({
      type: BULK_ORDER_LIST_SUCCESS,
      payload: data.bulkOrders || [],
    });
    return { success: true, data };
  } catch (error) {
    if (error.response?.status === 404) {
      dispatch({ type: BULK_ORDER_LIST_SUCCESS, payload: [] });
      return { success: true, data: { bulkOrders: [] } };
    }
    const message = handleApiError(error);
    dispatch({
      type: BULK_ORDER_LIST_FAIL,
      payload: message,
    });
    return { success: false, error: message };
  }
};

export const getBulkOrderDetails = (orderId) => async (dispatch) => {
  try {
    dispatch({ type: BULK_ORDER_DETAILS_REQUEST });
    const { data } = await api.get(`/api/v1/bulk-orders/${orderId}`);
    dispatch({
      type: BULK_ORDER_DETAILS_SUCCESS,
      payload: data.bulkOrder,
    });
    return { success: true, data };
  } catch (error) {
    const message = handleApiError(error);
    dispatch({
      type: BULK_ORDER_DETAILS_FAIL,
      payload: message,
    });
    return { success: false, error: message };
  }
};

export const updateBulkOrder = (orderId, updateData) => async (dispatch) => {
  try {
    dispatch({ type: BULK_ORDER_UPDATE_REQUEST });
    const { data } = await api.put(`/api/v1/bulk-orders/${orderId}`, updateData);
    dispatch({
      type: BULK_ORDER_UPDATE_SUCCESS,
      payload: data.bulkOrder,
    });
    dispatch(getBulkOrders());
    return { success: true, data };
  } catch (error) {
    const message = handleApiError(error);
    dispatch({
      type: BULK_ORDER_UPDATE_FAIL,
      payload: message,
    });
    return { success: false, error: message };
  }
};

export const cancelBulkOrder = (orderId, cancellationReason) => async (dispatch) => {
  try {
    dispatch({ type: BULK_ORDER_CANCEL_REQUEST });
    const { data } = await api.put(`/api/v1/bulk-orders/${orderId}/cancel`, {
      cancellationReason,
    });
    dispatch({
      type: BULK_ORDER_CANCEL_SUCCESS,
      payload: data.bulkOrder,
    });
    dispatch(getBulkOrders());
    return { success: true, data };
  } catch (error) {
    const message = handleApiError(error);
    dispatch({
      type: BULK_ORDER_CANCEL_FAIL,
      payload: message,
    });
    return { success: false, error: message };
  }
};
