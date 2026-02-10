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
} from '../../constants/rewardsConstants';

export const rewardsReducer = (state = { rewards: null }, action) => {
    switch (action.type) {
        case REWARDS_REQUEST:
            return { loading: true };
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
            return { loading: false, success: true, redemption: action.payload };
        case REDEEM_REWARD_FAIL:
            return { loading: false, error: action.payload };
        case REDEEM_REWARD_RESET:
            return {};
        default:
            return state;
    }
};
