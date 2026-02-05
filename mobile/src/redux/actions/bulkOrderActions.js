import axios from 'axios';
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
} from '../../constants/bulkOrderConstants';

export const createBulkOrder = (orderData) => async (dispatch, getState) => {
  try {
    dispatch({
      type: BULK_ORDER_CREATE_REQUEST,
    });

    const {
      userLogin: { userInfo },
    } = getState();

    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userInfo.token}`,
      },
    };

    const { data } = await axios.post('/api/bulkorders', orderData, config);

    dispatch({
      type: BULK_ORDER_CREATE_SUCCESS,
      payload: data,
    });

  } catch (error) {
    dispatch({
      type: BULK_ORDER_CREATE_FAIL,
      payload:
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
    });
  }
};

export const getBulkOrders = () => async (dispatch, getState) => {
  try {
    dispatch({
      type: BULK_ORDER_LIST_REQUEST,
    });

    const {
      userLogin: { userInfo },
    } = getState();

    const config = {
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
      },
    };

    const { data } = await axios.get('/api/bulkorders', config);

    dispatch({
      type: BULK_ORDER_LIST_SUCCESS,
      payload: data,
    });
  } catch (error) {
    dispatch({
      type: BULK_ORDER_LIST_FAIL,
      payload:
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
    });
  }
};

export const updateBulkOrder = (id, updateData) => async (dispatch, getState) => {
  try {
    dispatch({
      type: BULK_ORDER_UPDATE_REQUEST,
    });

    const {
      userLogin: { userInfo },
    } = getState();

    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userInfo.token}`,
      },
    };

    const { data } = await axios.put(`/api/bulkorders/${id}`, updateData, config);

    dispatch({
      type: BULK_ORDER_UPDATE_SUCCESS,
      payload: data,
    });

    // Refresh the orders list after update
    dispatch(getBulkOrders());

  } catch (error) {
    dispatch({
      type: BULK_ORDER_UPDATE_FAIL,
      payload:
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
    });
  }
};