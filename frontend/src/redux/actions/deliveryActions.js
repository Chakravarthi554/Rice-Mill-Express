import axios from 'axios';
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
  DELIVERY_PARTNER_LIST_FAIL as ORDER_LIST_FOR_DELIVERY_FAIL
} from '../constants/deliveryConstants';

export const listDeliveryPartners = () => async (dispatch, getState) => {
  try {
    dispatch({ type: DELIVERY_PARTNER_LIST_REQUEST });
    const {
      userLogin: { userInfo },
    } = getState();

    console.log('🔄 Fetching delivery partners...', {
      userId: userInfo.user?._id,
      token: userInfo.token ? 'Present' : 'Missing'
    });

    const config = {
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
      },
    };
    const { data } = await axios.get('/api/delivery-partners/partners', config);

    console.log('✅ Delivery partners fetched:', {
      count: data.length,
      data: data
    });

    dispatch({ type: DELIVERY_PARTNER_LIST_SUCCESS, payload: data });
  } catch (error) {
    console.error('❌ Failed to fetch delivery partners:', error.response?.data || error.message);
    dispatch({
      type: DELIVERY_PARTNER_LIST_FAIL,
      payload: error.response?.data?.message || error.message
    });
  }
};

export const createDeliveryPartner = (partnerData) => async (dispatch, getState) => {
  try {
    dispatch({ type: DELIVERY_PARTNER_CREATE_REQUEST });
    const {
      userLogin: { userInfo },
    } = getState();
    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userInfo.token}`,
      },
    };
    const { data } = await axios.post('/api/delivery-partners/partners', partnerData, config);
    dispatch({ type: DELIVERY_PARTNER_CREATE_SUCCESS, payload: data });
  } catch (error) {
    dispatch({
      type: DELIVERY_PARTNER_CREATE_FAIL,
      payload: error.response?.data?.message || error.message
    });
  }
};

export const updateDeliveryPartner = (id, partnerData) => async (dispatch, getState) => {
  try {
    dispatch({ type: DELIVERY_PARTNER_UPDATE_REQUEST });
    const {
      userLogin: { userInfo },
    } = getState();
    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userInfo.token}`,
      },
    };
    const { data } = await axios.put(`/api/delivery-partners/partners/${id}`, partnerData, config);
    dispatch({ type: DELIVERY_PARTNER_UPDATE_SUCCESS, payload: data });
  } catch (error) {
    dispatch({
      type: DELIVERY_PARTNER_UPDATE_FAIL,
      payload: error.response?.data?.message || error.message
    });
  }
};

export const deleteDeliveryPartner = (id) => async (dispatch, getState) => {
  try {
    dispatch({ type: DELIVERY_PARTNER_DELETE_REQUEST });
    const {
      userLogin: { userInfo },
    } = getState();
    const config = {
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
      },
    };
    await axios.delete(`/api/delivery-partners/partners/${id}`, config);
    dispatch({ type: DELIVERY_PARTNER_DELETE_SUCCESS, payload: id });
  } catch (error) {
    dispatch({
      type: DELIVERY_PARTNER_DELETE_FAIL,
      payload: error.response?.data?.message || error.message
    });
  }
};

export const assignDeliveryPartner = (orderId, deliveryData) => async (dispatch, getState) => {
  try {
    console.log('🚀 Redux Action: Assigning delivery partner', {
      orderId,
      deliveryData,
      endpoint: `/api/delivery-partners/orders/${orderId}`
    });

    dispatch({ type: DELIVERY_ASSIGN_REQUEST });
    const {
      userLogin: { userInfo },
    } = getState();
    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userInfo.token}`,
      },
    };

    const { data } = await axios.put(`/api/orders/${orderId}/assign-partner`, deliveryData, config);
    console.log('✅ Partner assigned successfully:', data);

    dispatch({ type: DELIVERY_ASSIGN_SUCCESS, payload: data });

    // CRITICAL: Refresh both delivery orders AND seller orders to show the update
    console.log('🔄 Refreshing orders after partner assignment...');
    dispatch(listOrdersForDelivery());

    // Import and call listSellerOrders from orderActions
    const { listSellerOrders } = require('./orderActions');
    await dispatch(listSellerOrders());

  } catch (error) {
    console.error('❌ Partner assignment failed:', {
      message: error.response?.data?.message || error.message,
      status: error.response?.status,
      data: error.response?.data
    });

    dispatch({
      type: DELIVERY_ASSIGN_FAIL,
      payload: error.response?.data?.message || error.message
    });
  }
};

export const listOrdersForDelivery = () => async (dispatch, getState) => {
  try {
    dispatch({ type: ORDER_LIST_FOR_DELIVERY_REQUEST });
    const {
      userLogin: { userInfo },
    } = getState();
    const config = {
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
      },
    };
    const { data } = await axios.get('/api/delivery-partners/orders/ready-for-delivery', config);
    dispatch({ type: ORDER_LIST_FOR_DELIVERY_SUCCESS, payload: data });
  } catch (error) {
    dispatch({
      type: ORDER_LIST_FOR_DELIVERY_FAIL,
      payload: error.response?.data?.message || error.message
    });
  }
};