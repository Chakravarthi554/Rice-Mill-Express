import {
    WALLET_DATA_REQUEST,
    WALLET_DATA_SUCCESS,
    WALLET_DATA_FAIL,
    WITHDRAW_REQUEST,
    WITHDRAW_SUCCESS,
    WITHDRAW_FAIL,
    WITHDRAW_RESET,
    WITHDRAWAL_HISTORY_REQUEST,
    WITHDRAWAL_HISTORY_SUCCESS,
    WITHDRAWAL_HISTORY_FAIL,
} from '../../constants/walletConstants';

export const walletReducer = (state = { walletData: {} }, action) => {
    switch (action.type) {
        case WALLET_DATA_REQUEST:
            return { ...state, loading: true };
        case WALLET_DATA_SUCCESS:
            return { loading: false, walletData: action.payload };
        case WALLET_DATA_FAIL:
            return { loading: false, error: action.payload };
        default:
            return state;
    }
};

export const withdrawalReducer = (state = {}, action) => {
    switch (action.type) {
        case WITHDRAW_REQUEST:
            return { loading: true };
        case WITHDRAW_SUCCESS:
            return { loading: false, success: true, withdrawal: action.payload };
        case WITHDRAW_FAIL:
            return { loading: false, error: action.payload };
        case WITHDRAW_RESET:
            return {};
        default:
            return state;
    }
};

export const withdrawalHistoryReducer = (state = { withdrawals: [] }, action) => {
    switch (action.type) {
        case WITHDRAWAL_HISTORY_REQUEST:
            return { loading: true, withdrawals: [] };
        case WITHDRAWAL_HISTORY_SUCCESS:
            return { loading: false, withdrawals: action.payload };
        case WITHDRAWAL_HISTORY_FAIL:
            return { loading: false, error: action.payload };
        default:
            return state;
    }
};
