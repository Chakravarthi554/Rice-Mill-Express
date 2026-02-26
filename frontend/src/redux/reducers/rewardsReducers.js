import {
    REWARDS_REQUEST,
    REWARDS_SUCCESS,
    REWARDS_FAIL,
    REWARD_TRANSACTIONS_REQUEST,
    REWARD_TRANSACTIONS_SUCCESS,
    REWARD_TRANSACTIONS_FAIL,
    REDEEM_REWARD_REQUEST,
    REDEEM_REWARD_SUCCESS,
    REDEEM_REWARD_FAIL,
    REDEEM_REWARD_RESET,
    CAMPAIGNS_REQUEST,
    CAMPAIGNS_SUCCESS,
    CAMPAIGNS_FAIL,
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
    ADMIN_WITHDRAWAL_LIST_REQUEST,
    ADMIN_WITHDRAWAL_LIST_SUCCESS,
    ADMIN_WITHDRAWAL_LIST_FAIL,
    ADMIN_WITHDRAWAL_UPDATE_REQUEST,
    ADMIN_WITHDRAWAL_UPDATE_SUCCESS,
    ADMIN_WITHDRAWAL_UPDATE_FAIL,
    ADMIN_WITHDRAWAL_UPDATE_RESET,
} from '../constants/rewardsConstants';

export const rewardsReducer = (state = { rewards: {} }, action) => {
    switch (action.type) {
        case REWARDS_REQUEST:
            return { loading: true, rewards: {} };
        case REWARDS_SUCCESS:
            return { loading: false, rewards: action.payload };
        case REWARDS_FAIL:
            return { loading: false, error: action.payload };
        default:
            return state;
    }
};

export const rewardTransactionsReducer = (state = { transactions: [] }, action) => {
    switch (action.type) {
        case REWARD_TRANSACTIONS_REQUEST:
            return { loading: true, transactions: [] };
        case REWARD_TRANSACTIONS_SUCCESS:
            return { loading: false, transactions: action.payload };
        case REWARD_TRANSACTIONS_FAIL:
            return { loading: false, error: action.payload };
        default:
            return state;
    }
};

export const redeemRewardReducer = (state = {}, action) => {
    switch (action.type) {
        case REDEEM_REWARD_REQUEST:
            return { loading: true };
        case REDEEM_REWARD_SUCCESS:
            return { loading: false, success: true, reward: action.payload };
        case REDEEM_REWARD_FAIL:
            return { loading: false, error: action.payload };
        case REDEEM_REWARD_RESET:
            return {};
        default:
            return state;
    }
};

export const campaignsReducer = (state = { campaigns: [] }, action) => {
    switch (action.type) {
        case CAMPAIGNS_REQUEST:
            return { loading: true, campaigns: [] };
        case CAMPAIGNS_SUCCESS:
            return { loading: false, campaigns: action.payload };
        case CAMPAIGNS_FAIL:
            return { loading: false, error: action.payload };
        default:
            return state;
    }
};

export const walletReducer = (state = { walletData: {} }, action) => {
    switch (action.type) {
        case WALLET_DATA_REQUEST:
            return { loading: true, walletData: {} };
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

export const adminWithdrawalListReducer = (state = { withdrawals: [] }, action) => {
    switch (action.type) {
        case ADMIN_WITHDRAWAL_LIST_REQUEST:
            return { loading: true, withdrawals: [] };
        case ADMIN_WITHDRAWAL_LIST_SUCCESS:
            return { loading: false, withdrawals: action.payload };
        case ADMIN_WITHDRAWAL_LIST_FAIL:
            return { loading: false, error: action.payload };
        default:
            return state;
    }
};

export const adminWithdrawalUpdateReducer = (state = {}, action) => {
    switch (action.type) {
        case ADMIN_WITHDRAWAL_UPDATE_REQUEST:
            return { loading: true };
        case ADMIN_WITHDRAWAL_UPDATE_SUCCESS:
            return { loading: false, success: true, withdrawal: action.payload };
        case ADMIN_WITHDRAWAL_UPDATE_FAIL:
            return { loading: false, error: action.payload };
        case ADMIN_WITHDRAWAL_UPDATE_RESET:
            return {};
        default:
            return state;
    }
};
