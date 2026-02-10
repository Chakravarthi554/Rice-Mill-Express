import {
    REFERRAL_REQUEST,
    REFERRAL_SUCCESS,
    REFERRAL_FAIL,
    REFERRAL_CODE_REQUEST,
    REFERRAL_CODE_SUCCESS,
    REFERRAL_CODE_FAIL,
    SUBSCRIPTION_LIST_REQUEST,
    SUBSCRIPTION_LIST_SUCCESS,
    SUBSCRIPTION_LIST_FAIL,
    SUBSCRIPTION_CREATE_REQUEST,
    SUBSCRIPTION_CREATE_SUCCESS,
    SUBSCRIPTION_CREATE_FAIL,
    SUBSCRIPTION_CREATE_RESET,
    SUBSCRIPTION_CANCEL_REQUEST,
    SUBSCRIPTION_CANCEL_SUCCESS,
    SUBSCRIPTION_CANCEL_FAIL,
} from '../../constants/referralConstants';
import { apiService } from '../../services/api';

export const getReferrals = () => async (dispatch) => {
    try {
        dispatch({ type: REFERRAL_REQUEST });
        const response = await apiService.getReferrals();
        dispatch({ type: REFERRAL_SUCCESS, payload: response.data });
    } catch (error) {
        dispatch({ type: REFERRAL_FAIL, payload: error.response?.data?.message || error.message });
    }
};

export const getReferralCode = () => async (dispatch) => {
    try {
        dispatch({ type: REFERRAL_CODE_REQUEST });
        const response = await apiService.getReferralCode();
        dispatch({ type: REFERRAL_CODE_SUCCESS, payload: response.data });
    } catch (error) {
        dispatch({ type: REFERRAL_CODE_FAIL, payload: error.response?.data?.message || error.message });
    }
};

export const getSubscriptions = () => async (dispatch) => {
    try {
        dispatch({ type: SUBSCRIPTION_LIST_REQUEST });
        const response = await apiService.getSubscriptions();
        dispatch({ type: SUBSCRIPTION_LIST_SUCCESS, payload: response.data });
    } catch (error) {
        dispatch({ type: SUBSCRIPTION_LIST_FAIL, payload: error.response?.data?.message || error.message });
    }
};

export const createSubscription = (data) => async (dispatch) => {
    try {
        dispatch({ type: SUBSCRIPTION_CREATE_REQUEST });
        const response = await apiService.createSubscription(data);
        dispatch({ type: SUBSCRIPTION_CREATE_SUCCESS, payload: response.data });
        dispatch(getSubscriptions());
    } catch (error) {
        dispatch({ type: SUBSCRIPTION_CREATE_FAIL, payload: error.response?.data?.message || error.message });
    }
};

export const cancelSubscription = (id) => async (dispatch) => {
    try {
        dispatch({ type: SUBSCRIPTION_CANCEL_REQUEST });
        await apiService.cancelSubscription(id);
        dispatch({ type: SUBSCRIPTION_CANCEL_SUCCESS, payload: id });
        dispatch(getSubscriptions());
    } catch (error) {
        dispatch({ type: SUBSCRIPTION_CANCEL_FAIL, payload: error.response?.data?.message || error.message });
    }
};

export const resetSubscriptionCreate = () => (dispatch) => {
    dispatch({ type: SUBSCRIPTION_CREATE_RESET });
};
