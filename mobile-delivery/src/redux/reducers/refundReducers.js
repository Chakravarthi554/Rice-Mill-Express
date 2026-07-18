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

export const refundCreateReducer = (state = {}, action) => {
    switch (action.type) {
        case REFUND_REQUEST_CREATE_REQUEST:
            return { loading: true };
        case REFUND_REQUEST_CREATE_SUCCESS:
            return { loading: false, success: true, refund: action.payload };
        case REFUND_REQUEST_CREATE_FAIL:
            return { loading: false, error: action.payload };
        case REFUND_REQUEST_CREATE_RESET:
            return {};
        default:
            return state;
    }
};

export const refundListReducer = (state = { refunds: [] }, action) => {
    switch (action.type) {
        case REFUND_LIST_REQUEST:
            return { loading: true, refunds: [] };
        case REFUND_LIST_SUCCESS:
            return { loading: false, refunds: action.payload };
        case REFUND_LIST_FAIL:
            return { loading: false, error: action.payload };
        default:
            return state;
    }
};

export const refundDetailsReducer = (state = { refund: {} }, action) => {
    switch (action.type) {
        case REFUND_DETAILS_REQUEST:
            return { ...state, loading: true };
        case REFUND_DETAILS_SUCCESS:
            return { loading: false, refund: action.payload };
        case REFUND_DETAILS_FAIL:
            return { loading: false, error: action.payload };
        default:
            return state;
    }
};
