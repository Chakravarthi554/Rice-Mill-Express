import api from '../../utils/api';
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
    CAMPAIGNS_REQUEST,
    CAMPAIGNS_SUCCESS,
    CAMPAIGNS_FAIL,
    REFERRAL_CODE_REQUEST,
    REFERRAL_CODE_SUCCESS,
    REFERRAL_CODE_FAIL,
    REFERRALS_REQUEST,
    REFERRALS_SUCCESS,
    REFERRALS_FAIL,
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

export const getRewards = () => async (dispatch, getState) => {
    try {
        dispatch({ type: REWARDS_REQUEST });

        const { userLogin: { userInfo } } = getState();
        const config = {
            headers: {
                Authorization: `Bearer ${userInfo.token}`,
            },
        };

        const { data } = await api.get('/api/v1/users/rewards');

        dispatch({
            type: REWARDS_SUCCESS,
            payload: data,
        });
    } catch (error) {
        dispatch({
            type: REWARDS_FAIL,
            payload: error.response && error.response.data.message
                ? error.response.data.message
                : error.message,
        });
    }
};

export const getRewardTransactions = () => async (dispatch, getState) => {
    try {
        dispatch({ type: REWARD_TRANSACTIONS_REQUEST });

        const { userLogin: { userInfo } } = getState();
        const config = {
            headers: {
                Authorization: `Bearer ${userInfo.token}`,
            },
        };

        const { data } = await api.get('/api/v1/users/rewards/transactions');

        dispatch({
            type: REWARD_TRANSACTIONS_SUCCESS,
            payload: data,
        });
    } catch (error) {
        dispatch({
            type: REWARD_TRANSACTIONS_FAIL,
            payload: error.response && error.response.data.message
                ? error.response.data.message
                : error.message,
        });
    }
};

export const redeemReward = (points) => async (dispatch, getState) => {
    try {
        dispatch({ type: REDEEM_REWARD_REQUEST });

        const { userLogin: { userInfo } } = getState();
        const config = {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${userInfo.token}`,
            },
        };

        const { data } = await api.post('/api/v1/users/rewards/redeem', { points });

        dispatch({
            type: REDEEM_REWARD_SUCCESS,
            payload: data,
        });

        // Refresh rewards data
        dispatch(getRewards());
        dispatch(getRewardTransactions());

    } catch (error) {
        dispatch({
            type: REDEEM_REWARD_FAIL,
            payload: error.response && error.response.data.message
                ? error.response.data.message
                : error.message,
        });
    }
};

export const getActiveCampaigns = () => async (dispatch, getState) => {
    try {
        dispatch({ type: CAMPAIGNS_REQUEST });

        // Public route usually, but if authenticated usage is needed:
        const { userLogin: { userInfo } } = getState();
        const config = {
            headers: {
                // Authorization: `Bearer ${userInfo?.token}`, // Optional if public
            },
        };

        const { data } = await api.get('/api/v1/campaigns/active');

        dispatch({
            type: CAMPAIGNS_SUCCESS,
            payload: data,
        });
    } catch (error) {
        dispatch({
            type: CAMPAIGNS_FAIL,
            payload: error.response && error.response.data.message
                ? error.response.data.message
                : error.message,
        });
    }
};

export const getReferralCode = () => async (dispatch, getState) => {
    try {
        dispatch({ type: REFERRAL_CODE_REQUEST });

        const { userLogin: { userInfo } } = getState();
        const config = {
            headers: {
                Authorization: `Bearer ${userInfo.token}`,
            },
        };

        const { data } = await api.get('/api/v1/users/referral-code');

        dispatch({
            type: REFERRAL_CODE_SUCCESS,
            payload: data,
        });
    } catch (error) {
        dispatch({
            type: REFERRAL_CODE_FAIL,
            payload: error.response && error.response.data.message
                ? error.response.data.message
                : error.message,
        });
    }
};

export const getReferrals = () => async (dispatch, getState) => {
    try {
        dispatch({ type: REFERRALS_REQUEST });

        const { userLogin: { userInfo } } = getState();
        const config = {
            headers: {
                Authorization: `Bearer ${userInfo.token}`,
            },
        };

        const { data } = await api.get('/api/v1/users/referrals');

        dispatch({
            type: REFERRALS_SUCCESS,
            payload: data,
        });
    } catch (error) {
        dispatch({
            type: REFERRALS_FAIL,
            payload: error.response && error.response.data.message
                ? error.response.data.message
                : error.message,
        });
    }
};

export const getWalletData = () => async (dispatch, getState) => {
    try {
        dispatch({ type: WALLET_DATA_REQUEST });
        const { userLogin: { userInfo } } = getState();
        const config = {
            headers: { Authorization: `Bearer ${userInfo.token}` },
        };
        const { data } = await api.get('/api/v1/rewards/wallet');
        dispatch({ type: WALLET_DATA_SUCCESS, payload: data });
    } catch (error) {
        dispatch({
            type: WALLET_DATA_FAIL,
            payload: error.response && error.response.data.message
                ? error.response.data.message
                : error.message,
        });
    }
};

export const requestWithdrawal = (withdrawalData) => async (dispatch, getState) => {
    try {
        dispatch({ type: WITHDRAW_REQUEST });
        const { userLogin: { userInfo } } = getState();
        const config = {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${userInfo.token}`
            },
        };
        const { data } = await api.post('/api/v1/rewards/withdraw', withdrawalData);
        dispatch({ type: WITHDRAW_SUCCESS, payload: data });
        dispatch(getWalletData());
    } catch (error) {
        dispatch({
            type: WITHDRAW_FAIL,
            payload: error.response && error.response.data.message
                ? error.response.data.message
                : error.message,
        });
    }
};

export const getWithdrawalHistory = () => async (dispatch, getState) => {
    try {
        dispatch({ type: WITHDRAWAL_HISTORY_REQUEST });
        const { userLogin: { userInfo } } = getState();
        const config = {
            headers: { Authorization: `Bearer ${userInfo.token}` },
        };
        const { data } = await api.get('/api/v1/rewards/withdrawals');
        dispatch({ type: WITHDRAWAL_HISTORY_SUCCESS, payload: data });
    } catch (error) {
        dispatch({
            type: WITHDRAWAL_HISTORY_FAIL,
            payload: error.response && error.response.data.message
                ? error.response.data.message
                : error.message,
        });
    }
};

export const listAdminWithdrawals = () => async (dispatch, getState) => {
    try {
        dispatch({ type: ADMIN_WITHDRAWAL_LIST_REQUEST });
        const { userLogin: { userInfo } } = getState();
        const config = {
            headers: { Authorization: `Bearer ${userInfo.token}` },
        };
        const { data } = await api.get('/api/v1/rewards/admin/withdrawals');
        dispatch({ type: ADMIN_WITHDRAWAL_LIST_SUCCESS, payload: data.withdrawals });
    } catch (error) {
        dispatch({
            type: ADMIN_WITHDRAWAL_LIST_FAIL,
            payload: error.response && error.response.data.message
                ? error.response.data.message
                : error.message,
        });
    }
};

export const updateWithdrawalStatus = (id, updateData) => async (dispatch, getState) => {
    try {
        dispatch({ type: ADMIN_WITHDRAWAL_UPDATE_REQUEST });
        const { userLogin: { userInfo } } = getState();
        const config = {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${userInfo.token}`
            },
        };
        const { data } = await api.put(`/api/v1/rewards/admin/withdrawals/${id}`, updateData);
        dispatch({ type: ADMIN_WITHDRAWAL_UPDATE_SUCCESS, payload: data });
    } catch (error) {
        dispatch({
            type: ADMIN_WITHDRAWAL_UPDATE_FAIL,
            payload: error.response && error.response.data.message
                ? error.response.data.message
                : error.message,
        });
    }
};

export const rechargeWallet = (amount) => async (dispatch, getState) => {
    try {
        await api.post('/api/v1/rewards/recharge', { amount });
        dispatch(getWalletData());
    } catch (error) {
        console.error('Wallet recharge error:', error);
    }
};
