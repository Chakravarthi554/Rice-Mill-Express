import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { auth } from '../../config/firebase';
import { API_URL } from '../../config/env';

// Async thunk for login
export const login = createAsyncThunk(
    'auth/login',
    async ({ email, password }, { rejectWithValue }) => {
        try {
            // 1. Sign in with Firebase
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const idToken = await userCredential.user.getIdToken();

            // 2. Get user profile from backend
            const response = await axios.post(
                `${API_URL}/api/auth/firebase-login`,
                { idToken },
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );

            // ⚠️ 2FA Check
            if (response.data.requires2FA) {
                return response.data; // Return raw response without storing
            }

            // 3. Store token and user info
            await AsyncStorage.setItem('userToken', idToken);
            await AsyncStorage.setItem('userInfo', JSON.stringify(response.data));

            return { user: response.data, token: idToken };
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

// Async thunk for register
export const register = createAsyncThunk(
    'auth/register',
    async ({ name, email, password, phone, role, referralCode, deviceId }, { rejectWithValue }) => {
        try {
            // 1. Create user in Firebase
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const idToken = await userCredential.user.getIdToken();

            // 2. Create user profile in backend
            const response = await axios.post(
                `${API_URL}/api/auth/register`,
                { name, email, password, phone, role, referralCode, deviceId },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${idToken}`,
                    },
                }
            );

            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

// Async thunk for logout
export const logout = createAsyncThunk('auth/logout', async () => {
    await signOut(auth);
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userInfo');
});

// Async thunk to load user from storage
export const loadUserFromStorage = createAsyncThunk(
    'auth/loadFromStorage',
    async (_, { rejectWithValue }) => {
        try {
            const token = await AsyncStorage.getItem('userToken');
            const userInfo = await AsyncStorage.getItem('userInfo');

            if (token && userInfo) {
                return { user: JSON.parse(userInfo), token };
            }
            return rejectWithValue('No stored credentials');
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

const authSlice = createSlice({
    name: 'auth',
    initialState: {
        user: null,
        token: null,
        loading: false,
        error: null,
        isAuthenticated: false,
        isAuthReady: false,
    },
    reducers: {
        setAuthReady: (state, action) => {
            state.isAuthReady = action.payload;
        },
        setCredentials: (state, action) => {
            state.user = action.payload.user;
            state.token = action.payload.token;
            state.isAuthenticated = true;
        },
        setUser: (state, action) => {
            state.user = action.payload;
        },
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Login
            .addCase(login.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(login.fulfilled, (state, action) => {
                state.loading = false;
                if (action.payload.requires2FA) {
                    // Don't set authenticated yet
                    return;
                }
                state.user = action.payload.user;
                state.token = action.payload.token;
                state.isAuthenticated = true;
            })
            .addCase(login.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                state.isAuthenticated = false;
            })
            // Register
            .addCase(register.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(register.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(register.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Logout
            .addCase(logout.fulfilled, (state) => {
                state.user = null;
                state.token = null;
                state.isAuthenticated = false;
            })
            // Load from storage
            .addCase(loadUserFromStorage.pending, (state) => {
                state.loading = true;
            })
            .addCase(loadUserFromStorage.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload.user;
                state.token = action.payload.token;
                state.isAuthenticated = true;
            })
            .addCase(loadUserFromStorage.rejected, (state) => {
                state.loading = false;
                state.isAuthenticated = false;
            });
    },
});

export const { setCredentials, clearError, setAuthReady, setUser } = authSlice.actions;
export default authSlice.reducer;
