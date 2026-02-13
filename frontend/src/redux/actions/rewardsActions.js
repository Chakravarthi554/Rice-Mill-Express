import axios from 'axios';
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

        const { data } = await axios.get('/api/users/rewards', config);

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

        const { data } = await axios.get('/api/users/rewards/transactions', config);

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

        const { data } = await axios.post('/api/users/rewards/redeem', { points }, config);

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

        const { data } = await axios.get('/api/campaigns/active', config);

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
