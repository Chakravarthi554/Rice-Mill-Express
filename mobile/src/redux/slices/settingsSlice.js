import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '../../services/api';

export const fetchSettings = createAsyncThunk(
    'settings/fetchSettings',
    async (_, { rejectWithValue }) => {
        try {
            const response = await apiService.getUserProfile();
            const settings = {
                preferences: response.data.preferences || {
                    language: 'english',
                    theme: 'system',
                    recommendationsEnabled: true,
                },
                privacy: response.data.privacySettings || {
                    profileVisible: true,
                    showActivity: true,
                },

            };

            // Also load accessibility from AsyncStorage since it's local-only usually
            const accessibility = await AsyncStorage.getItem('accessibility');
            if (accessibility) {
                settings.accessibility = JSON.parse(accessibility);
            } else {
                settings.accessibility = {
                    highContrast: 0,
                    textSize: 16,
                    screenReader: false,
                };
            }

            return settings;
        } catch (err) {
            // If it's a 403 error (permission denied), just use default settings
            if (err.response?.status === 403) {
                const accessibility = await AsyncStorage.getItem('accessibility');
                return {
                    preferences: {
                        language: 'english',
                        theme: 'system',
                        recommendationsEnabled: true,
                    },
                    privacy: {
                        profileVisible: true,
                        showActivity: true,
                    },

                    accessibility: accessibility ? JSON.parse(accessibility) : {
                        highContrast: 0,
                        textSize: 16,
                        screenReader: false,
                    },
                };
            }
            return rejectWithValue(err.response?.data?.message || 'Failed to fetch settings');
        }
    }
);

export const updatePreferences = createAsyncThunk(
    'settings/updatePreferences',
    async (preferences, { rejectWithValue }) => {
        try {
            const response = await apiService.updatePreferences(preferences);
            return response.data.preferences;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed to update preferences');
        }
    }
);

export const updatePrivacy = createAsyncThunk(
    'settings/updatePrivacy',
    async (privacy, { rejectWithValue }) => {
        try {
            const response = await apiService.updatePrivacySettings(privacy);
            return response.data.privacySettings;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || 'Failed to update privacy');
        }
    }
);



export const updateAccessibility = createAsyncThunk(
    'settings/updateAccessibility',
    async (accessibility, { rejectWithValue }) => {
        try {
            await AsyncStorage.setItem('accessibility', JSON.stringify(accessibility));
            return accessibility;
        } catch (err) {
            return rejectWithValue('Failed to save accessibility settings');
        }
    }
);

const settingsSlice = createSlice({
    name: 'settings',
    initialState: {
        preferences: {
            language: 'english',
            theme: 'system',
            recommendationsEnabled: true,
        },
        privacy: {
            profileVisible: true,
            showActivity: true,
        },

        accessibility: {
            highContrast: 0,
            textSize: 16,
            screenReader: false,
        },
        loading: false,
        error: null,
        success: false,
    },
    reducers: {
        resetSettingsStatus: (state) => {
            state.success = false;
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch Settings
            .addCase(fetchSettings.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchSettings.fulfilled, (state, action) => {
                state.loading = false;
                state.preferences = action.payload.preferences;
                state.privacy = action.payload.privacy;

                state.accessibility = action.payload.accessibility;
            })
            .addCase(fetchSettings.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Update Preferences
            .addCase(updatePreferences.pending, (state) => {
                state.loading = true;
            })
            .addCase(updatePreferences.fulfilled, (state, action) => {
                state.loading = false;
                state.preferences = action.payload;
                state.success = true;
            })
            .addCase(updatePreferences.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Update Privacy
            .addCase(updatePrivacy.fulfilled, (state, action) => {
                state.privacy = action.payload;
                state.success = true;
            })

            // Update Accessibility
            .addCase(updateAccessibility.fulfilled, (state, action) => {
                state.accessibility = action.payload;
                state.success = true;
            });
    },
});

export const { resetSettingsStatus } = settingsSlice.actions;
export default settingsSlice.reducer;
