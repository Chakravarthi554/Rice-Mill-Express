import { apiService } from '../../services/api';
import {
    ADDRESS_LIST_REQUEST,
    ADDRESS_LIST_SUCCESS,
    ADDRESS_LIST_FAIL,
    ADDRESS_ADD_REQUEST,
    ADDRESS_ADD_SUCCESS,
    ADDRESS_ADD_FAIL,
    ADDRESS_UPDATE_REQUEST,
    ADDRESS_UPDATE_SUCCESS,
    ADDRESS_UPDATE_FAIL,
    ADDRESS_DELETE_REQUEST,
    ADDRESS_DELETE_SUCCESS,
    ADDRESS_DELETE_FAIL,
    ADDRESS_SET_DEFAULT_REQUEST,
    ADDRESS_SET_DEFAULT_SUCCESS,
    ADDRESS_SET_DEFAULT_FAIL,
} from '../../constants/addressConstants';

export const listMyAddresses = () => async (dispatch) => {
    try {
        dispatch({ type: ADDRESS_LIST_REQUEST });

        const { data } = await apiService.getAddresses();

        dispatch({
            type: ADDRESS_LIST_SUCCESS,
            payload: data.addresses || data,
        });
    } catch (error) {
        dispatch({
            type: ADDRESS_LIST_FAIL,
            payload:
                error.response && error.response.data.message
                    ? error.response.data.message
                    : error.message,
        });
    }
};

export const addAddress = (address) => async (dispatch) => {
    try {
        dispatch({ type: ADDRESS_ADD_REQUEST });

        const { data } = await apiService.createAddress(address);

        dispatch({
            type: ADDRESS_ADD_SUCCESS,
            payload: data.address || data,
        });
    } catch (error) {
        dispatch({
            type: ADDRESS_ADD_FAIL,
            payload:
                error.response && error.response.data.message
                    ? error.response.data.message
                    : error.message,
        });
    }
};

export const updateAddress = (id, address) => async (dispatch) => {
    try {
        dispatch({ type: ADDRESS_UPDATE_REQUEST });

        const { data } = await apiService.updateAddress(id, address);

        dispatch({
            type: ADDRESS_UPDATE_SUCCESS,
            payload: data.address || data,
        });
    } catch (error) {
        dispatch({
            type: ADDRESS_UPDATE_FAIL,
            payload:
                error.response && error.response.data.message
                    ? error.response.data.message
                    : error.message,
        });
    }
};

export const deleteAddress = (id) => async (dispatch) => {
    try {
        dispatch({ type: ADDRESS_DELETE_REQUEST });

        await apiService.deleteAddress(id);

        dispatch({ type: ADDRESS_DELETE_SUCCESS, payload: id });
    } catch (error) {
        dispatch({
            type: ADDRESS_DELETE_FAIL,
            payload:
                error.response && error.response.data.message
                    ? error.response.data.message
                    : error.message,
        });
    }
};
