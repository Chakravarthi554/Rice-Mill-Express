import {
    WALLET_DATA_REQUEST,
    WALLET_DATA_SUCCESS,
    WALLET_DATA_FAIL,
    WITHDRAW_REQUEST,
    WITHDRAW_SUCCESS,
    WITHDRAW_FAIL,
    WITHDRAWAL_HISTORY_REQUEST,
    WITHDRAWAL_HISTORY_SUCCESS,
    WITHDRAWAL_HISTORY_FAIL,
} from '../../constants/walletConstants';
import { apiService } from '../../services/api';

export const getWalletData = () => async (dispatch) => {
    try {
        dispatch({ type: WALLET_DATA_REQUEST });
        const response = await apiService.getWalletData();
        dispatch({ type: WALLET_DATA_SUCCESS, payload: response.data });
    } catch (error) {
        dispatch({
            type: WALLET_DATA_FAIL,
            payload: error.response?.data?.message || error.message,
        });
    }
};

export const requestWithdrawal = (withdrawalData) => async (dispatch) => {
    try {
        dispatch({ type: WITHDRAW_REQUEST });
        const response = await apiService.requestWithdrawal(withdrawalData);
        dispatch({ type: WITHDRAW_SUCCESS, payload: response.data });
        // Refresh wallet data after withdrawal request
        dispatch(getWalletData());
    } catch (error) {
        dispatch({
            type: WITHDRAW_FAIL,
            payload: error.response?.data?.message || error.message,
        });
    }
};

export const getWithdrawalHistory = () => async (dispatch) => {
    try {
        dispatch({ type: WITHDRAWAL_HISTORY_REQUEST });
        const response = await apiService.getWithdrawalHistory();
        dispatch({ type: WITHDRAWAL_HISTORY_SUCCESS, payload: response.data });
    } catch (error) {
        dispatch({
            type: WITHDRAWAL_HISTORY_FAIL,
            payload: error.response?.data?.message || error.message,
        });
    }
};
