import {
    REFERRAL_REQUEST,
    REFERRAL_SUCCESS,
    REFERRAL_FAIL,
    REFERRAL_CODE_REQUEST,
    REFERRAL_CODE_SUCCESS,
    REFERRAL_CODE_FAIL,
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

