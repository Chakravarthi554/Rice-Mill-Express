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
