import axios from 'axios';
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
} from '../constants/orderConstants';
import api from '../../utils/api';
import { handleApiError } from '../../utils/handleApiError';

// ✅ NEW: Download Invoice PDF
export const downloadInvoice = (orderId) => async (dispatch) => {
  try {
    console.log(`🔄 Downloading invoice for order: ${orderId}`);

    // 1. Enqueue the generation job
    const { data: initData } = await api.get(`/api/v1/orders/${orderId}/invoice`);
    
    let isReady = false;
    let attempts = 0;
    const maxAttempts = 30; // 60 seconds timeout

    // 2. Poll for status
    while (!isReady && attempts < maxAttempts) {
      const { data: statusData } = await api.get(`/api/v1/orders/${orderId}/invoice/status`);
      if (statusData.status === 'completed') {
        isReady = true;
      } else {
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 2000)); // wait 2 seconds
      }
    }

    if (!isReady) {
      throw new Error('Invoice generation timed out. Please try again later.');
    }

    // 3. Download the actual file
    const { data: blobData } = await api.get(`/api/v1/orders/${orderId}/invoice/download`, {
      responseType: 'blob'
    });

    const blob = new Blob([blobData], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `invoice_${orderId.toString().slice(-8).toUpperCase()}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    console.log('✅ Invoice download triggered');
    return { success: true };
  } catch (error) {
    console.error('❌ Download invoice error:', error);
    const message = handleApiError(error);
    return { success: false, error: message };
  }
};

// ✅ FIXED: Enhanced getMyOrders with bulk order integration
export const listMyOrders = () => async (dispatch, getState) => {
  try {
    dispatch({ type: ORDER_LIST_MY_REQUEST });

    console.log('🔄 Fetching my orders...');

    const { data } = await api.get('/api/v1/orders/myorders');

    console.log(`✅ Found ${data.length} orders`);

    dispatch({
      type: ORDER_LIST_MY_SUCCESS,
      payload: data || []
    });

    return { success: true, data };

  } catch (error) {
    console.error('❌ Get my orders error:', error);

    // Handle 404 gracefully - return empty array
    if (error.isEndpointNotFound) {
      console.log('⚠️ Orders endpoint not found, returning empty list');
      dispatch({
        type: ORDER_LIST_MY_SUCCESS,
        payload: []
      });
      return { success: true, data: [] };
    }

    const message = handleApiError(error);
    dispatch({
      type: ORDER_LIST_MY_FAIL,
      payload: message
    });

    return { success: false, error: message };
  }
};

// ✅ FIXED: Enhanced createOrder with better error handling
export const createOrder = (order) => async (dispatch, getState) => {
  try {
    dispatch({ type: ORDER_CREATE_REQUEST });

    console.log('🔄 Creating order with data:', {
      itemsCount: order.orderItems?.length,
      paymentMethod: order.paymentMethod,
      total: order.totalPrice
    });

    const { data } = await api.post('/api/v1/orders', order);

    console.log('✅ Order created successfully:', data);

    dispatch({
      type: ORDER_CREATE_SUCCESS,
      payload: data
    });

    // Clear cart after successful order
    if (data.orders) {
      localStorage.removeItem('cartItems');
    }

    return { success: true, data };

  } catch (error) {
    console.error('❌ Create order error:', error);

    const message = handleApiError(error);
    dispatch({
      type: ORDER_CREATE_FAIL,
      payload: message
    });

    throw new Error(message);
  }
};

// ✅ FIXED: Enhanced getOrderDetails
export const getOrderDetails = (id) => async (dispatch, getState) => {
  try {
    dispatch({ type: ORDER_DETAILS_REQUEST });

    console.log(`🔄 Fetching order details: ${id}`);

    const { data } = await api.get(`/api/v1/orders/${id}`);

    console.log('✅ Order details received:', data._id);

    dispatch({
      type: ORDER_DETAILS_SUCCESS,
      payload: data
    });

    return { success: true, data };

  } catch (error) {
    console.error('❌ Get order details error:', error);

    const message = handleApiError(error);
    dispatch({
      type: ORDER_DETAILS_FAIL,
      payload: message
    });

    return { success: false, error: message };
  }
};

// ✅ FIXED: Enhanced listOrders (Admin)
export const listOrders = (filters = {}) => async (dispatch, getState) => {
  try {
    dispatch({ type: ORDER_LIST_REQUEST });

    const queryParams = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) queryParams.append(key, filters[key]);
    });

    const url = `/api/v1/orders${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    console.log(`🔄 Fetching orders: ${url}`);

    const { data } = await api.get(url);

    console.log(`✅ Admin orders received: ${data.orders?.length || 0}`);

    dispatch({
      type: ORDER_LIST_SUCCESS,
      payload: data
    });

    return { success: true, data };

  } catch (error) {
    console.error('❌ List orders error:', error);

    const message = handleApiError(error);
    dispatch({
      type: ORDER_LIST_FAIL,
      payload: message
    });

    return { success: false, error: message };
  }
};

// ✅ FIXED: Enhanced listSellerOrders
export const listSellerOrders = (filters = {}) => async (dispatch, getState) => {
  try {
    dispatch({ type: ORDER_LIST_SELLER_REQUEST });

    const queryParams = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) queryParams.append(key, filters[key]);
    });

    const url = `/api/v1/orders/sellerorders${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    console.log(`🔄 Fetching seller orders: ${url}`);

    const { data } = await api.get(url);

    console.log(`✅ Seller orders received: ${data.orders?.length || 0}`);

    dispatch({
      type: ORDER_LIST_SELLER_SUCCESS,
      payload: data
    });

    return { success: true, data };

  } catch (error) {
    console.error('❌ List seller orders error:', error);

    // Handle 404 gracefully
    if (error.isEndpointNotFound) {
      console.log('⚠️ Seller orders endpoint not found, returning empty list');
      dispatch({
        type: ORDER_LIST_SELLER_SUCCESS,
        payload: { orders: [], total: 0, page: 1, pages: 1 }
      });
      return { success: true, data: { orders: [], total: 0 } };
    }

    const message = handleApiError(error);
    dispatch({
      type: ORDER_LIST_SELLER_FAIL,
      payload: message
    });

    return { success: false, error: message };
  }
};

// ✅ FIXED: Enhanced cancelOrder
export const cancelOrder = (orderId, cancellationReason) => async (dispatch, getState) => {
  try {
    dispatch({ type: ORDER_CANCEL_REQUEST });

    console.log(`🔄 Cancelling order: ${orderId}`);

    const { data } = await api.put(`/api/v1/orders/${orderId}/cancel`, {
      cancellationReason
    });

    console.log('✅ Order cancelled successfully');

    dispatch({
      type: ORDER_CANCEL_SUCCESS,
      payload: data
    });

    // Refresh orders list
    dispatch(listMyOrders());

    return { success: true, data };

  } catch (error) {
    console.error('❌ Cancel order error:', error);

    const message = handleApiError(error);
    dispatch({
      type: ORDER_CANCEL_FAIL,
      payload: message
    });

    return { success: false, error: message };
  }
};

// ✅ FIXED: Enhanced deliverOrder
export const deliverOrder = (orderId) => async (dispatch, getState) => {
  try {
    dispatch({ type: ORDER_DELIVER_REQUEST });

    console.log(`🔄 Marking order as delivered: ${orderId}`);

    const { data } = await api.put(`/api/v1/orders/${orderId}/deliver`, {});

    console.log('✅ Order marked as delivered');

    dispatch({
      type: ORDER_DELIVER_SUCCESS,
      payload: data
    });

    return { success: true, data };

  } catch (error) {
    console.error('❌ Deliver order error:', error);

    const message = handleApiError(error);
    dispatch({
      type: ORDER_DELIVER_FAIL,
      payload: message
    });

    return { success: false, error: message };
  }
};

// ✅ FIXED: Enhanced updateOrderStatus
export const updateOrderStatus = (orderId, status, note = '') => async (dispatch, getState) => {
  try {
    dispatch({ type: ORDER_UPDATE_REQUEST });

    console.log(`🔄 Updating order status: ${orderId} to ${status}`);

    const { data } = await api.put(`/api/v1/orders/${orderId}/status`, {
      status,
      note
    });

    console.log('✅ Order status updated successfully:', data);

    dispatch({
      type: ORDER_UPDATE_SUCCESS,
      payload: data
    });

    return { success: true, data };

  } catch (error) {
    console.error('❌ Update order status error:', error);

    const message = handleApiError(error);
    dispatch({
      type: ORDER_UPDATE_FAIL,
      payload: message
    });

    return { success: false, error: message };
  }
};

// ✅ FIXED: Enhanced payOrder
export const payOrder = (orderId, paymentResult) => async (dispatch, getState) => {
  try {
    dispatch({ type: ORDER_PAY_REQUEST });

    console.log(`🔄 Processing payment for order: ${orderId}`);

    const { data } = await api.put(`/api/v1/orders/${orderId}/pay`, paymentResult);

    console.log('✅ Payment processed successfully');

    dispatch({
      type: ORDER_PAY_SUCCESS,
      payload: data
    });

    return { success: true, data };

  } catch (error) {
    console.error('❌ Pay order error:', error);

    const message = handleApiError(error);
    dispatch({
      type: ORDER_PAY_FAIL,
      payload: message
    });

    return { success: false, error: message };
  }
};

// Refresh orders action for real-time updates
export const refreshOrders = () => async (dispatch) => {
  console.log('🔄 Refreshing orders due to real-time update');
  try {
    await dispatch(listMyOrders());
  } catch (error) {
    console.error('Error refreshing orders:', error);
  }
};