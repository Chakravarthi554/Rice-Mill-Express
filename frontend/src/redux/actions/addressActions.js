import axios from 'axios';
import {
  ADDRESS_ADD_REQUEST,
  ADDRESS_ADD_SUCCESS,
  ADDRESS_ADD_FAIL,
  ADDRESS_LIST_REQUEST,
  ADDRESS_LIST_SUCCESS,
  ADDRESS_LIST_FAIL,
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

export const listAddresses = () => async (dispatch, getState) => {
  try {
    dispatch({ type: ADDRESS_LIST_REQUEST });

    const {
      userLogin: { userInfo },
    } = getState();

    const config = {
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
      },
    };

    const { data } = await axios.get('/api/addresses', config);

    dispatch({
      type: ADDRESS_LIST_SUCCESS,
      payload: data,
    });
  } catch (error) {
    dispatch({
      type: ADDRESS_LIST_FAIL,
      payload:
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
    });
  }
};

export const addAddress = (address) => async (dispatch, getState) => {
  try {
    dispatch({ type: ADDRESS_ADD_REQUEST });

    const {
      userLogin: { userInfo },
    } = getState();

    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userInfo.token}`,
      },
    };

    const { data } = await axios.post('/api/addresses', address, config);

    dispatch({
      type: ADDRESS_ADD_SUCCESS,
      payload: data,
    });
  } catch (error) {
    dispatch({
      type: ADDRESS_ADD_FAIL,
      payload:
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
    });
  }
};

export const updateAddress = (id, address) => async (dispatch, getState) => {
  try {
    dispatch({ type: ADDRESS_UPDATE_REQUEST });

    const {
      userLogin: { userInfo },
    } = getState();

    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userInfo.token}`,
      },
    };

    const { data } = await axios.put(`/api/addresses/${id}`, address, config);

    dispatch({
      type: ADDRESS_UPDATE_SUCCESS,
      payload: data,
    });
  } catch (error) {
    dispatch({
      type: ADDRESS_UPDATE_FAIL,
      payload:
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
    });
  }
};

export const deleteAddress = (id) => async (dispatch, getState) => {
  try {
    dispatch({ type: ADDRESS_DELETE_REQUEST });

    const {
      userLogin: { userInfo },
    } = getState();

    const config = {
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
      },
    };

    await axios.delete(`/api/addresses/${id}`, config);

    dispatch({ type: ADDRESS_DELETE_SUCCESS, payload: id });
  } catch (error) {
    dispatch({
      type: ADDRESS_DELETE_FAIL,
      payload:
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
    });
  }
};

export const setDefaultAddress = (id) => async (dispatch, getState) => {
  try {
    dispatch({ type: ADDRESS_SET_DEFAULT_REQUEST });

    const {
      userLogin: { userInfo },
    } = getState();

    const config = {
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
      },
    };

    const { data } = await axios.put(`/api/addresses/${id}/default`, {}, config);

    dispatch({
      type: ADDRESS_SET_DEFAULT_SUCCESS,
      payload: data,
    });
  } catch (error) {
    dispatch({
      type: ADDRESS_SET_DEFAULT_FAIL,
      payload:
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
    });
  }
};