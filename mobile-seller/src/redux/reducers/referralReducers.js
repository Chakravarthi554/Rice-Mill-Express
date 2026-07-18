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
} from '../../constants/referralConstants';

export const referralReducer = (state = { referrals: [] }, action) => {
    switch (action.type) {
        case REFERRAL_REQUEST:
            return { loading: true, referrals: [] };
        case REFERRAL_SUCCESS:
            return {
                loading: false,
                referrals: action.payload.referrals,
                code: action.payload.code,
                stats: action.payload.stats
            };
        case REFERRAL_FAIL:
            return { loading: false, error: action.payload, referrals: [] };
        default:
            return state;
    }
};

export const referralCodeReducer = (state = { code: null }, action) => {
    switch (action.type) {
        case REFERRAL_CODE_REQUEST:
            return { loading: true };
        case REFERRAL_CODE_SUCCESS:
            return { loading: false, code: action.payload };
        case REFERRAL_CODE_FAIL:
            return { loading: false, error: action.payload };
        default:
            return state;
    }
};

export const subscriptionListReducer = (state = { subscriptions: [] }, action) => {
    switch (action.type) {
        case SUBSCRIPTION_LIST_REQUEST:
            return { loading: true, subscriptions: [] };
        case SUBSCRIPTION_LIST_SUCCESS:
            return { loading: false, subscriptions: action.payload };
        case SUBSCRIPTION_LIST_FAIL:
            return { loading: false, error: action.payload };
        default:
            return state;
    }
};

export const subscriptionCreateReducer = (state = {}, action) => {
    switch (action.type) {
        case SUBSCRIPTION_CREATE_REQUEST:
            return { loading: true };
        case SUBSCRIPTION_CREATE_SUCCESS:
            return { loading: false, success: true, subscription: action.payload };
        case SUBSCRIPTION_CREATE_FAIL:
            return { loading: false, error: action.payload };
        case SUBSCRIPTION_CREATE_RESET:
            return {};
        default:
            return state;
    }
};
