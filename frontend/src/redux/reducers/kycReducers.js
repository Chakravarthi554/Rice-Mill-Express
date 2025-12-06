import {
  KYC_SUBMIT_REQUEST,
  KYC_SUBMIT_SUCCESS,
  KYC_SUBMIT_FAIL,
  KYC_STATUS_REQUEST,
  KYC_STATUS_SUCCESS,
  KYC_STATUS_FAIL,
  KYC_REVIEW_REQUEST,
  KYC_REVIEW_SUCCESS,
  KYC_REVIEW_FAIL,
  KYC_APPLICATIONS_REQUEST,
  KYC_APPLICATIONS_SUCCESS,
  KYC_APPLICATIONS_FAIL,
} from '../constants/kycConstants';

export const kycApplicationsReducer = (state = { kycApplications: [] }, action) => {
  switch (action.type) {
    case KYC_APPLICATIONS_REQUEST:
      return { ...state, loading: true };
    case KYC_APPLICATIONS_SUCCESS:
      return { loading: false, kycApplications: action.payload };
    case KYC_APPLICATIONS_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};

export const kycSubmitReducer = (state = {}, action) => {
  switch (action.type) {
    case KYC_SUBMIT_REQUEST:
      return { loading: true };
    case KYC_SUBMIT_SUCCESS:
      return { loading: false, success: true, kyc: action.payload };
    case KYC_SUBMIT_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};

export const kycStatusReducer = (state = {}, action) => {
  switch (action.type) {
    case KYC_STATUS_REQUEST:
      return { loading: true };
    case KYC_STATUS_SUCCESS:
      return { loading: false, status: action.payload.status, kycApplication: action.payload.kycApplication };
    case KYC_STATUS_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};

export const kycReviewReducer = (state = {}, action) => {
  switch (action.type) {
    case KYC_REVIEW_REQUEST:
      return { ...state, loading: true };
    case KYC_REVIEW_SUCCESS:
      return { loading: false, success: true };
    case KYC_REVIEW_FAIL:
      return { loading: false, error: action.payload };
    default:
      return state;
  }
};