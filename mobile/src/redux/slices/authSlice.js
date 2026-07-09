import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../../config/firebase';
import api from '../../services/api';

// Async thunk for login
export const login = createAsyncThunk(
    'auth/login',
    async ({ email, password }, { rejectWithValue }) => {
        try {
            let token;
            let response;
            try {
                // 1. Sign in with Firebase
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                token = await userCredential.user.getIdToken();

                // 2. Get user profile from backend
                response = await api.post(
                    '/api/v1/auth/firebase-login',
                    { idToken: token }
                );
            } catch (firebaseError) {
                console.log('Firebase login failed, falling back to legacy backend login', firebaseError.message);
                // Fallback to legacy backend login (e.g. for delivery partners not in Firebase)
                response = await api.post('/api/v1/auth/login', { email, password });
                token = response.data.accessToken;
            }

            // ⚠️ 2FA Check
            if (response.data.requires2FA) {
                return response.data; // Return raw response without storing
            }

            // 3. Store user info ONLY (not the token)
            // Firebase ID tokens expire in 1 hour — always get a fresh one from auth.currentUser.
            // Storing the token causes 401 flood on restart if the cached token is expired.
            await AsyncStorage.setItem('userInfo', JSON.stringify(response.data));
            // For non-Firebase legacy users (delivery partners), store their backend token
            if (!auth.currentUser) {
                await AsyncStorage.setItem('userToken', token);
            }

            return { user: response.data, token: token };
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
            // Note: api service already has Authorization header interceptor
            const response = await api.post(
                '/api/v1/auth/register',
                { name, email, password, phone, role, referralCode, deviceId }
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
            const userInfo = await AsyncStorage.getItem('userInfo');

            if (userInfo) {
                // For Firebase users, don't use the stored token — get a fresh one from auth.currentUser
                // For legacy users (delivery partners), fall back to stored token
                const legacyToken = await AsyncStorage.getItem('userToken');
                return { user: JSON.parse(userInfo), token: legacyToken || null };
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
            .addCase(logout.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(logout.fulfilled, (state) => {
                state.user = null;
                state.token = null;
                state.loading = false;
                state.error = null;
                state.isAuthenticated = false;
                state.isAuthReady = true;
            })
            .addCase(logout.rejected, (state) => {
                state.loading = false;
                state.user = null;
                state.token = null;
                state.isAuthenticated = false;
                state.isAuthReady = true;
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
