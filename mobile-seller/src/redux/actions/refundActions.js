import {
    REFUND_REQUEST_CREATE_REQUEST,
    REFUND_REQUEST_CREATE_SUCCESS,
    REFUND_REQUEST_CREATE_FAIL,
    REFUND_REQUEST_CREATE_RESET,
    REFUND_LIST_REQUEST,
    REFUND_LIST_SUCCESS,
    REFUND_LIST_FAIL,
    REFUND_DETAILS_REQUEST,
    REFUND_DETAILS_SUCCESS,
    REFUND_DETAILS_FAIL,
} from '../../constants/refundConstants';
import { apiService } from '../../services/api';

export const createRefundRequest = (orderId, refundData) => async (dispatch) => {
    try {
        dispatch({ type: REFUND_REQUEST_CREATE_REQUEST });

        const response = await apiService.createRefundRequest(orderId, refundData);

        dispatch({
            type: REFUND_REQUEST_CREATE_SUCCESS,
            payload: response.data,
        });
    } catch (error) {
        dispatch({
            type: REFUND_REQUEST_CREATE_FAIL,
            payload: error.response?.data?.message || error.message,
        });
    }
};

export const getRefunds = () => async (dispatch) => {
    try {
        dispatch({ type: REFUND_LIST_REQUEST });

        const response = await apiService.getRefunds();

        dispatch({
            type: REFUND_LIST_SUCCESS,
            payload: response.data,
        });
    } catch (error) {
        dispatch({
            type: REFUND_LIST_FAIL,
            payload: error.response?.data?.message || error.message,
        });
    }
};

export const getRefundDetails = (refundId) => async (dispatch) => {
    try {
        dispatch({ type: REFUND_DETAILS_REQUEST });

        const response = await apiService.getRefundById(refundId);

        dispatch({
            type: REFUND_DETAILS_SUCCESS,
            payload: response.data,
        });
    } catch (error) {
        dispatch({
            type: REFUND_DETAILS_FAIL,
            payload: error.response?.data?.message || error.message,
        });
    }
};

export const resetRefundCreate = () => (dispatch) => {
    dispatch({ type: REFUND_REQUEST_CREATE_RESET });
};
