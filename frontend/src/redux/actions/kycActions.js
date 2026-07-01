import api from '../../utils/api';
import {
  KYC_SUBMIT_REQUEST,
  KYC_SUBMIT_SUCCESS,
  KYC_SUBMIT_FAIL,
  KYC_STATUS_REQUEST,
  KYC_STATUS_SUCCESS,
  KYC_STATUS_FAIL,
  KYC_APPLICATIONS_REQUEST,
  KYC_APPLICATIONS_SUCCESS,
  KYC_APPLICATIONS_FAIL,
  KYC_REVIEW_REQUEST,
  KYC_REVIEW_SUCCESS,
  KYC_REVIEW_FAIL,
} from '../constants/kycConstants';

export const submitKycApplication = (formData, navigate) => async (dispatch, getState) => {
  try {
    dispatch({ type: KYC_SUBMIT_REQUEST });
    const config = {
      headers: {
        Authorization: `Bearer ${getState().userLogin.userInfo.token}`,
      },
    };
    const { data } = await api.post('/api/kyc/submit', formData, config);
    dispatch({ type: KYC_SUBMIT_SUCCESS, payload: data });
    dispatch(getKycStatus());
    navigate('/seller/kyc');
  } catch (error) {
    dispatch({
      type: KYC_SUBMIT_FAIL,
      payload: error.response?.data?.message || error.message,
    });
  }
};

export const getKycStatus = () => async (dispatch, getState) => {
  try {
    dispatch({ type: KYC_STATUS_REQUEST });
    const config = {
      headers: {
        Authorization: `Bearer ${getState().userLogin.userInfo.token}`,
      },
    };
    const { data } = await api.get('/api/kyc/status', config);
    dispatch({ type: KYC_STATUS_SUCCESS, payload: data });
  } catch (error) {
    dispatch({
      type: KYC_STATUS_FAIL,
      payload: error.response?.data?.message || error.message,
    });
  }
};

export const getKycApplications = () => async (dispatch, getState) => {
  try {
    dispatch({ type: KYC_APPLICATIONS_REQUEST });
    const { userLogin: { userInfo } } = getState();
    const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
    const { data } = await api.get('/api/kyc/applications', config);
    dispatch({ type: KYC_APPLICATIONS_SUCCESS, payload: data });
  } catch (error) {
    dispatch({
      type: KYC_APPLICATIONS_FAIL,
      payload: error.response?.data?.message || error.message,
    });
  }
};

// FIXED: Use /approve and /reject endpoints
export const reviewKycApplication = (id, actionData) => async (dispatch, getState) => {
  try {
    dispatch({ type: KYC_REVIEW_REQUEST });
    const { userLogin: { userInfo } } = getState();
    const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };

    let endpoint = '';
    if (actionData.status === 'approved') {
      endpoint = `/api/kyc/approve/${id}`;
    } else if (actionData.status === 'rejected') {
      endpoint = `/api/kyc/reject/${id}`;
    }

    const { data } = await api.put(endpoint, { reviewNotes: actionData.reviewNotes }, config);
    dispatch({ type: KYC_REVIEW_SUCCESS, payload: data });
    dispatch(getKycApplications());
  } catch (error) {
    dispatch({
      type: KYC_REVIEW_FAIL,
      payload: error.response?.data?.message || error.message,
    });
  }
};