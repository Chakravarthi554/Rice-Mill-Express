import {
  ADMIN_PAYMENT_STATS_REQUEST,
  ADMIN_PAYMENT_STATS_SUCCESS,
  ADMIN_PAYMENT_STATS_FAIL,
  ADMIN_TRANSACTIONS_REQUEST,
  ADMIN_TRANSACTIONS_SUCCESS,
  ADMIN_TRANSACTIONS_FAIL,
  ADMIN_PAYOUTS_LIST_REQUEST,
  ADMIN_PAYOUTS_LIST_SUCCESS,
  ADMIN_PAYOUTS_LIST_FAIL,
  ADMIN_REFUND_REQUEST,
  ADMIN_REFUND_SUCCESS,
  ADMIN_REFUND_FAIL,
  ADMIN_PAYOUT_RELEASE_REQUEST,
  ADMIN_PAYOUT_RELEASE_SUCCESS,
  ADMIN_PAYOUT_RELEASE_FAIL,
  ADMIN_PAYMENT_FLAG_REQUEST,
  ADMIN_PAYMENT_FLAG_SUCCESS,
  ADMIN_PAYMENT_FLAG_FAIL,
  ADMIN_PAYMENT_EXPORT_REQUEST,
  ADMIN_PAYMENT_EXPORT_SUCCESS,
  ADMIN_PAYMENT_EXPORT_FAIL
} from '../constants/adminPaymentConstants';
import axios from 'axios';

// Get admin payment statistics
export const getAdminPaymentStats = () => async (dispatch, getState) => {
  try {
    dispatch({ type: ADMIN_PAYMENT_STATS_REQUEST });

    const { userLogin: { userInfo } } = getState();

    const config = {
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
      },
    };

    const { data } = await axios.get('/api/admin/payments/stats', config);

    dispatch({
      type: ADMIN_PAYMENT_STATS_SUCCESS,
      payload: data,
    });
  } catch (error) {
    dispatch({
      type: ADMIN_PAYMENT_STATS_FAIL,
      payload:
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
    });
  }
};

// Get admin transactions with filters
export const getAdminTransactions = (filters = {}) => async (dispatch, getState) => {
  try {
    dispatch({ type: ADMIN_TRANSACTIONS_REQUEST });

    const { userLogin: { userInfo } } = getState();

    const config = {
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
      },
      params: filters,
    };

    const { data } = await axios.get('/api/admin/payments/transactions', config);

    dispatch({
      type: ADMIN_TRANSACTIONS_SUCCESS,
      payload: data,
    });
  } catch (error) {
    dispatch({
      type: ADMIN_TRANSACTIONS_FAIL,
      payload:
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
    });
  }
};

// Get payouts list
export const getPayoutsList = (filters = {}) => async (dispatch, getState) => {
  try {
    dispatch({ type: ADMIN_PAYOUTS_LIST_REQUEST });

    const { userLogin: { userInfo } } = getState();

    const config = {
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
      },
      params: filters,
    };

    const { data } = await axios.get('/api/admin/payments/payouts', config);

    dispatch({
      type: ADMIN_PAYOUTS_LIST_SUCCESS,
      payload: data,
    });
  } catch (error) {
    dispatch({
      type: ADMIN_PAYOUTS_LIST_FAIL,
      payload:
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
    });
  }
};

// Process refund
export const processRefund = (paymentId, refundData) => async (dispatch, getState) => {
  try {
    dispatch({ type: ADMIN_REFUND_REQUEST });

    const { userLogin: { userInfo } } = getState();

    const config = {
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
      },
    };

    const { data } = await axios.post(`/api/admin/payments/refund/${paymentId}`, refundData, config);

    dispatch({
      type: ADMIN_REFUND_SUCCESS,
      payload: data,
    });

    // Refresh transactions after refund
    dispatch(getAdminTransactions());
    dispatch(getAdminPaymentStats());

  } catch (error) {
    dispatch({
      type: ADMIN_REFUND_FAIL,
      payload:
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
    });
  }
};

// Release payout
export const releasePayout = (payoutId, payoutData) => async (dispatch, getState) => {
  try {
    dispatch({ type: ADMIN_PAYOUT_RELEASE_REQUEST });

    const { userLogin: { userInfo } } = getState();

    const config = {
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
      },
    };

    const { data } = await axios.post(`/api/admin/payments/payout/${payoutId}/release`, payoutData, config);

    dispatch({
      type: ADMIN_PAYOUT_RELEASE_SUCCESS,
      payload: data,
    });

    // Refresh payouts list after release
    dispatch(getPayoutsList());
    dispatch(getAdminPaymentStats());

  } catch (error) {
    dispatch({
      type: ADMIN_PAYOUT_RELEASE_FAIL,
      payload:
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
    });
  }
};

// Flag/unflag payment
export const flagPayment = (paymentId, flagData) => async (dispatch, getState) => {
  try {
    dispatch({ type: ADMIN_PAYMENT_FLAG_REQUEST });

    const { userLogin: { userInfo } } = getState();

    const config = {
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
      },
    };

    const { data } = await axios.post(`/api/admin/payments/flag/${paymentId}`, flagData, config);

    dispatch({
      type: ADMIN_PAYMENT_FLAG_SUCCESS,
      payload: data,
    });

    // Refresh transactions after flagging
    dispatch(getAdminTransactions());

  } catch (error) {
    dispatch({
      type: ADMIN_PAYMENT_FLAG_FAIL,
      payload:
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
    });
  }
};

// Export payment data
export const exportPaymentReport = (exportParams) => async (dispatch, getState) => {
  try {
    dispatch({ type: ADMIN_PAYMENT_EXPORT_REQUEST });

    const { userLogin: { userInfo } } = getState();

    const config = {
      headers: {
        Authorization: `Bearer ${userInfo.token}`,
      },
      responseType: 'blob',
      params: exportParams,
    };

    const response = await axios.get('/api/admin/payments/export', config);

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    
    const filename = exportParams.type === 'payouts' 
      ? `payouts_export_${Date.now()}.csv`
      : `payments_export_${Date.now()}.csv`;
    
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();

    dispatch({
      type: ADMIN_PAYMENT_EXPORT_SUCCESS,
    });

  } catch (error) {
    dispatch({
      type: ADMIN_PAYMENT_EXPORT_FAIL,
      payload:
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message,
    });
  }
};