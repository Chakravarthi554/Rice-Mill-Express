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
    PUBLIC_SETTINGS_REQUEST,
    PUBLIC_SETTINGS_SUCCESS,
    PUBLIC_SETTINGS_FAIL,
} from '../../constants/rewardsConstants';
import { apiService } from '../../services/api';

export const getRewards = () => async (dispatch) => {
    try {
        dispatch({ type: REWARDS_REQUEST });

        const response = await apiService.getRewards();

        dispatch({
            type: REWARDS_SUCCESS,
            payload: response.data,
        });
    } catch (error) {
        dispatch({
            type: REWARDS_FAIL,
            payload: error.response?.data?.message || error.message,
        });
    }
};

export const getRewardTransactions = () => async (dispatch) => {
    try {
        dispatch({ type: REWARD_TRANSACTIONS_REQUEST });

        const response = await apiService.getRewardTransactions();

        dispatch({
            type: REWARD_TRANSACTIONS_SUCCESS,
            payload: response.data,
        });
    } catch (error) {
        dispatch({
            type: REWARD_TRANSACTIONS_FAIL,
            payload: error.response?.data?.message || error.message,
        });
    }
};

export const redeemReward = (points) => async (dispatch) => {
    try {
        dispatch({ type: REDEEM_REWARD_REQUEST });

        const response = await apiService.redeemReward(points);

        dispatch({
            type: REDEEM_REWARD_SUCCESS,
            payload: response.data,
        });

        // Refresh rewards after redemption
        dispatch(getRewards());
    } catch (error) {
        dispatch({
            type: REDEEM_REWARD_FAIL,
            payload: error.response?.data?.message || error.message,
        });
    }
};

export const resetRedeemReward = () => (dispatch) => {
    dispatch({ type: REDEEM_REWARD_RESET });
};

export const getActiveCampaigns = () => async (dispatch) => {
    try {
        dispatch({ type: CAMPAIGNS_REQUEST });

        const response = await apiService.getActiveCampaigns();

        dispatch({
            type: CAMPAIGNS_SUCCESS,
            payload: response.data,
        });
    } catch (error) {
        dispatch({
            type: CAMPAIGNS_FAIL,
            payload: error.response?.data?.message || error.message,
        });
    }
};

export const getPublicSettings = () => async (dispatch) => {
    try {
        dispatch({ type: PUBLIC_SETTINGS_REQUEST });

        const response = await apiService.getPublicSettings();

        dispatch({
            type: PUBLIC_SETTINGS_SUCCESS,
            payload: response.data,
        });
    } catch (error) {
        dispatch({
            type: PUBLIC_SETTINGS_FAIL,
            payload: error.response?.data?.message || error.message,
        });
    }
};
