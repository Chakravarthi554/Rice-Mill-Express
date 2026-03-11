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

// Payment Statistics Reducer
export const adminPaymentStatsReducer = (state = { stats: {}, loading: false }, action) => {
  switch (action.type) {
    case ADMIN_PAYMENT_STATS_REQUEST:
      return { ...state, loading: true };
    case ADMIN_PAYMENT_STATS_SUCCESS:
      return { loading: false, stats: action.payload.stats || action.payload.data || action.payload };
    case ADMIN_PAYMENT_STATS_FAIL:
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
};

// Transactions Reducer
export const adminTransactionsReducer = (state = { transactions: [], loading: false }, action) => {
  switch (action.type) {
    case ADMIN_TRANSACTIONS_REQUEST:
      return { ...state, loading: true };
    case ADMIN_TRANSACTIONS_SUCCESS:
      return {
        loading: false,
        transactions: action.payload.transactions,
        total: action.payload.total,
        totalPages: action.payload.totalPages,
        currentPage: action.payload.currentPage
      };
    case ADMIN_TRANSACTIONS_FAIL:
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
};

// Payouts List Reducer
export const adminPayoutsListReducer = (state = { payouts: [], loading: false }, action) => {
  switch (action.type) {
    case ADMIN_PAYOUTS_LIST_REQUEST:
      return { ...state, loading: true };
    case ADMIN_PAYOUTS_LIST_SUCCESS:
      return {
        loading: false,
        payouts: action.payload.payouts,
        total: action.payload.total,
        totalPages: action.payload.totalPages,
        currentPage: action.payload.currentPage
      };
    case ADMIN_PAYOUTS_LIST_FAIL:
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
};

// Refund Reducer
export const adminRefundReducer = (state = { loading: false }, action) => {
  switch (action.type) {
    case ADMIN_REFUND_REQUEST:
      return { loading: true };
    case ADMIN_REFUND_SUCCESS:
      return { loading: false, success: true, refund: action.payload };
    case ADMIN_REFUND_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};

// Payout Release Reducer
export const adminPayoutReducer = (state = { loading: false }, action) => {
  switch (action.type) {
    case ADMIN_PAYOUT_RELEASE_REQUEST:
      return { loading: true };
    case ADMIN_PAYOUT_RELEASE_SUCCESS:
      return { loading: false, success: true, payout: action.payload };
    case ADMIN_PAYOUT_RELEASE_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};

// Payment Flag Reducer
export const adminPaymentFlagReducer = (state = { loading: false }, action) => {
  switch (action.type) {
    case ADMIN_PAYMENT_FLAG_REQUEST:
      return { loading: true };
    case ADMIN_PAYMENT_FLAG_SUCCESS:
      return { loading: false, success: true, payment: action.payload };
    case ADMIN_PAYMENT_FLAG_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};

// Payment Export Reducer
export const adminPaymentExportReducer = (state = { loading: false }, action) => {
  switch (action.type) {
    case ADMIN_PAYMENT_EXPORT_REQUEST:
      return { loading: true };
    case ADMIN_PAYMENT_EXPORT_SUCCESS:
      return { loading: false, success: true };
    case ADMIN_PAYMENT_EXPORT_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};