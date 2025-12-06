import axios from 'axios';
import {
  RAZORPAY_ORDER_CREATE_REQUEST,
  RAZORPAY_ORDER_CREATE_SUCCESS,
  RAZORPAY_ORDER_CREATE_FAIL,
  RAZORPAY_VERIFY_REQUEST,
  RAZORPAY_VERIFY_SUCCESS,
  RAZORPAY_VERIFY_FAIL,
  SELLER_PAYMENTS_REQUEST,
  SELLER_PAYMENTS_SUCCESS,
  SELLER_PAYMENTS_FAIL,
  PAYMENT_RECORD_COD_REQUEST,
  PAYMENT_RECORD_COD_SUCCESS,
  PAYMENT_RECORD_COD_FAIL,
  PAYOUT_REQUEST_REQUEST,
  PAYOUT_REQUEST_SUCCESS,
  PAYOUT_REQUEST_FAIL,
  SELLER_PAYOUTS_HISTORY_REQUEST,
  SELLER_PAYOUTS_HISTORY_SUCCESS,
  SELLER_PAYOUTS_HISTORY_FAIL,
} from '../constants/paymentConstants';
import { handleApiError } from '../../utils/handleApiError'; // Ensure correct path

/**
 * 1️⃣ Create Razorpay Order
 * orderData = { amount, currency, receipt }
 * amount should be in paisa for INR
 */
export const createRazorpayOrder = (orderData) => async (dispatch, getState) => {
  try {
    dispatch({ type: RAZORPAY_ORDER_CREATE_REQUEST });
    const { userLogin: { userInfo } } = getState();
    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userInfo.token}`,
      },
    };
    const { data } = await axios.post('/api/payments/razorpay/order', orderData, config);
    dispatch({ type: RAZORPAY_ORDER_CREATE_SUCCESS, payload: data });
    return Promise.resolve(data);
  } catch (error) {
    const message = handleApiError(error);
    dispatch({ type: RAZORPAY_ORDER_CREATE_FAIL, payload: message });
    return Promise.reject(message);
  }
};

/**
 * 2️⃣ Verify Razorpay Payment
 * paymentData = { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 */
export const verifyRazorpayPayment = (paymentData) => async (dispatch, getState) => {
  try {
    dispatch({ type: RAZORPAY_VERIFY_REQUEST });
    const { userLogin: { userInfo } } = getState();
    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userInfo.token}`,
      },
    };
    
    const { data } = await axios.post('/api/payments/razorpay/verify', paymentData, config);

    if (data.success) {
      dispatch({ type: RAZORPAY_VERIFY_SUCCESS, payload: data });
      return Promise.resolve(data);
    } else {
      throw new Error(data.message || 'Payment verification failed');
    }
  } catch (error) {
    const message = handleApiError(error);
    dispatch({ type: RAZORPAY_VERIFY_FAIL, payload: message });
    return Promise.reject(message);
  }
};

/**
 * 3️⃣ Fetch Seller Payments Summary
 * Includes balance, total earnings, and payout history
 */
export const getSellerPayments = () => async (dispatch, getState) => {
  try {
    dispatch({ type: SELLER_PAYMENTS_REQUEST });
    const { userLogin: { userInfo } } = getState();
    const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
    const { data } = await axios.get('/api/payments/seller', config);
    dispatch({ type: SELLER_PAYMENTS_SUCCESS, payload: data });
  } catch (error) {
    dispatch({ type: SELLER_PAYMENTS_FAIL, payload: handleApiError(error) });
  }
};

/**
 * 4️⃣ Seller Record COD Payment
 * orderId, amountReceived, proof (optional text)
 */
export const recordCodReceived = (orderId, amountReceived, proof = 'Seller confirmed') => async (dispatch, getState) => {
  try {
    dispatch({ type: PAYMENT_RECORD_COD_REQUEST });
    const { userLogin: { userInfo } } = getState();
    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userInfo.token}`,
      },
    };
    const { data } = await axios.post(`/api/payments/cod-report/${orderId}`, { amountReceived, proof }, config);

    dispatch({ type: PAYMENT_RECORD_COD_SUCCESS, payload: data.payment });
    return Promise.resolve(data);
  } catch (error) {
    const message = handleApiError(error);
    dispatch({ type: PAYMENT_RECORD_COD_FAIL, payload: message });
    return Promise.reject(message);
  }
};

/**
 * 5️⃣ Seller Request Payout
 * payoutData = { amount }
 */
export const requestPayout = (payoutData) => async (dispatch, getState) => {
  try {
    dispatch({ type: PAYOUT_REQUEST_REQUEST });
    const { userLogin: { userInfo } } = getState();
    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userInfo.token}`,
      },
    };
    const { data } = await axios.post('/api/payments/request-payout', payoutData, config);
    dispatch({ type: PAYOUT_REQUEST_SUCCESS, payload: data.payout });
    // Refresh seller balance after payout request
    dispatch(getSellerPayments());
    return Promise.resolve(data);
  } catch (error) {
    const message = handleApiError(error);
    dispatch({ type: PAYOUT_REQUEST_FAIL, payload: message });
    return Promise.reject(message);
  }
};

/**
 * 6️⃣ Seller Payout History
 * Optional - can be integrated with getSellerPayments
 */
export const getPayoutHistory = () => async (dispatch, getState) => {
  try {
    dispatch({ type: SELLER_PAYOUTS_HISTORY_REQUEST });
    const { userLogin: { userInfo } } = getState();
    const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
    const { data } = await axios.get('/api/payments/payout-history', config);
    dispatch({ type: SELLER_PAYOUTS_HISTORY_SUCCESS, payload: data });
  } catch (error) {
    dispatch({ type: SELLER_PAYOUTS_HISTORY_FAIL, payload: handleApiError(error) });
  }
};