import {
  RAZORPAY_ORDER_CREATE_REQUEST,
  RAZORPAY_ORDER_CREATE_SUCCESS,
  RAZORPAY_ORDER_CREATE_FAIL,
  RAZORPAY_ORDER_CREATE_RESET,
  RAZORPAY_VERIFY_REQUEST,
  RAZORPAY_VERIFY_SUCCESS,
  RAZORPAY_VERIFY_FAIL,
  RAZORPAY_VERIFY_RESET,
  SELLER_PAYMENTS_REQUEST,
  SELLER_PAYMENTS_SUCCESS,
  SELLER_PAYMENTS_FAIL,
  PAYMENT_RECORD_COD_REQUEST,
  PAYMENT_RECORD_COD_SUCCESS,
  PAYMENT_RECORD_COD_FAIL,
  PAYMENT_RECORD_COD_RESET,
  PAYMENT_RECORD_REQUEST,
  PAYMENT_RECORD_SUCCESS,
  PAYMENT_RECORD_FAIL,
  PAYOUT_REQUEST_REQUEST,
  PAYOUT_REQUEST_SUCCESS,
  PAYOUT_REQUEST_FAIL,
  PAYOUT_REQUEST_RESET,
  SELLER_PAYOUTS_HISTORY_REQUEST,
  SELLER_PAYOUTS_HISTORY_SUCCESS,
  SELLER_PAYOUTS_HISTORY_FAIL,
} from '../constants/paymentConstants';

// Remove references to SELLER_PAYOUTS_REQUEST, SELLER_PAYOUTS_SUCCESS, SELLER_PAYOUTS_FAIL
// Remove references to REPORT_COD_REQUEST, REPORT_COD_SUCCESS, REPORT_COD_FAIL

export const razorpayOrderCreateReducer = (state = {}, action) => {
  switch (action.type) {
    case RAZORPAY_ORDER_CREATE_REQUEST:
      return { loading: true };
    case RAZORPAY_ORDER_CREATE_SUCCESS:
      return { loading: false, success: true, razorpayOrder: action.payload };
    case RAZORPAY_ORDER_CREATE_FAIL:
      return { loading: false, error: action.payload };
    case RAZORPAY_ORDER_CREATE_RESET:
      return {};
    default:
      return state;
  }
};

export const razorpayVerifyReducer = (state = {}, action) => {
  switch (action.type) {
    case RAZORPAY_VERIFY_REQUEST:
      return { loading: true };
    case RAZORPAY_VERIFY_SUCCESS:
      return {
        loading: false,
        success: action.payload.success,
        verification: action.payload,
      };
    case RAZORPAY_VERIFY_FAIL:
      return { loading: false, error: action.payload };
    case RAZORPAY_VERIFY_RESET:
      return {};
    default:
      return state;
  }
};

const initialSellerPaymentsState = {
  payments: [],
  balance: { totalEarnings: 0, availableBalance: 0, pendingPayouts: 0 },
  payoutHistory: [],
  codOrders: [],
  loading: false,
  error: null,
  totalEarnings: 0,
  availableBalance: 0,
  totalCommission: 0,
};

export const sellerPaymentsReducer = (state = initialSellerPaymentsState, action) => {
  switch (action.type) {
    case SELLER_PAYMENTS_REQUEST:
    case SELLER_PAYOUTS_HISTORY_REQUEST:
      return { ...state, loading: true, error: null };

    case SELLER_PAYMENTS_SUCCESS:
      return {
        ...state,
        loading: false,
        payments: action.payload.payments || [],
        balance: action.payload.balance || state.balance,
        payoutHistory: action.payload.payoutHistory || state.payoutHistory,
        totalEarnings: action.payload.totalEarnings ?? state.totalEarnings,
        availableBalance: action.payload.availableBalance ?? state.availableBalance,
        totalCommission: action.payload.totalCommission ?? state.totalCommission,
        codOrders: action.payload.codOrders || [],
      };

    case SELLER_PAYOUTS_HISTORY_SUCCESS:
      return { ...state, loading: false, payoutHistory: action.payload || [] };

    case SELLER_PAYMENTS_FAIL:
    case SELLER_PAYOUTS_HISTORY_FAIL:
      return { ...state, loading: false, error: action.payload };

    default:
      return state;
  }
};

export const paymentRecordCodReducer = (state = {}, action) => {
  switch (action.type) {
    case PAYMENT_RECORD_COD_REQUEST:
      return { loading: true };
    case PAYMENT_RECORD_COD_SUCCESS:
      return { loading: false, success: true, payment: action.payload };
    case PAYMENT_RECORD_COD_FAIL:
      return { loading: false, error: action.payload };
    case PAYMENT_RECORD_COD_RESET:
      return {};
    default:
      return state;
  }
};

export const payoutRequestReducer = (state = {}, action) => {
  switch (action.type) {
    case PAYOUT_REQUEST_REQUEST:
      return { loading: true };
    case PAYOUT_REQUEST_SUCCESS:
      return { loading: false, success: true, payout: action.payload };
    case PAYOUT_REQUEST_FAIL:
      return { loading: false, error: action.payload };
    case PAYOUT_REQUEST_RESET:
      return {};
    default:
      return state;
  }
};

export const paymentRecordReducer = (state = {}, action) => {
  switch (action.type) {
    case PAYMENT_RECORD_REQUEST:
      return { ...state, loading: true };
    case PAYMENT_RECORD_SUCCESS:
      return { ...state, loading: false, success: true, record: action.payload };
    case PAYMENT_RECORD_FAIL:
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
};