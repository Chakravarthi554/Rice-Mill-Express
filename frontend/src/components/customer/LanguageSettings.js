import React from 'react';
import {
    Paper,
    Typography,
    Box,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button,
    Divider,
    Alert,
    Chip
} from '@mui/material';
import { Language as LanguageIcon, Public as PublicIcon } from '@mui/icons-material';
import { useI18n } from '../../context/i18nContext';
import { useDispatch, useSelector } from 'react-redux';
import { getSocket } from '../../utils/socket';
import { updateUserProfile } from '../../redux/actions/userActions';

const LanguageSettings = () => {
    const { language, changeLanguage, availableLanguages, t } = useI18n();
    const dispatch = useDispatch();
    const { userInfo } = useSelector(state => state.userLogin);

    // Local state for deferred saving
    const [localLanguage, setLocalLanguage] = React.useState(language);
    const [saved, setSaved] = React.useState(false);

    // ✅ Listen for real-time preference updates from other devices
    React.useEffect(() => {
        const socket = getSocket(userInfo?._id, userInfo?.role, userInfo?.token);

        if (socket) {
            const handlePreferenceUpdate = (data) => {
                if (data.userId === userInfo?._id) {
                    // Update local state to match backend
                    setLocalLanguage(data.preferences?.language || language);

                    // Update global context
                    if (data.preferences?.language && data.preferences.language !== language) {
                        changeLanguage(data.preferences.language);
                    }
                }
            };

            socket.on('PREFERENCES_UPDATED', handlePreferenceUpdate);
            socket.on('GLOBAL_PREFERENCES_UPDATE', handlePreferenceUpdate);

            return () => {
                socket.off('PREFERENCES_UPDATED', handlePreferenceUpdate);
                socket.off('GLOBAL_PREFERENCES_UPDATE', handlePreferenceUpdate);
            };
        }
    }, [userInfo?._id, userInfo?.token, language, changeLanguage]);

    const handleSave = () => {
        // Update context
        changeLanguage(localLanguage);

        // Update backend
        dispatch(updateUserProfile({
            preferences: {
                language: localLanguage
            }
        }));

        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    // Update local state when global state changes (e.g. initial load)
    React.useEffect(() => {
        setLocalLanguage(language);
    }, [language]);


    const languageNames = {
        english: 'English',
        hindi: 'हिन्दी (Hindi)',
        tamil: 'தமிழ் (Tamil)',
        telugu: 'తెలుగు (Telugu)'
    };

    return (
        <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
                Language & Region
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Customize language, region, and currency preferences
            </Typography>

            {saved && (
                <Alert severity="success" sx={{ mb: 3 }}>
                    Settings saved! Changes applied globally.
                </Alert>
            )}

            {/* Language Selection */}
            <Box sx={{ mb: 4 }}>
                <FormControl fullWidth>
                    <InputLabel id="language-select-label">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LanguageIcon fontSize="small" />
                            Language
                        </Box>
                    </InputLabel>
                    <Select
                        labelId="language-select-label"
                        value={localLanguage}
                        label="Language"
                        onChange={(e) => setLocalLanguage(e.target.value)}
                    >
                        {availableLanguages.map((lang) => (
                            <MenuItem key={lang} value={lang}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography>{languageNames[lang]}</Typography>
                                    {language === lang && (
                                        <Chip label="Current" size="small" color="primary" />
                                    )}
                                </Box>
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Select your preferred language for the interface
                </Typography>
            </Box>


            <Box sx={{ mb: 4 }}>
                <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    size="large"
                    onClick={handleSave}
                    sx={{ py: 1.5, fontWeight: 'bold', fontSize: '1.1rem' }}
                >
                    Save & Apply Changes Globally
                </Button>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Preview Section */}
            <Box sx={{ mb: 4, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                    Preview
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Welcome Message:</strong> {t('welcome')}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Dashboard:</strong> {t('dashboard')}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>My Orders:</strong> {t('myOrders')}
                </Typography>
                <Typography variant="body2">
                    <strong>Sample Price:</strong> {new Intl.NumberFormat('en-IN', {
                        style: 'currency',
                        currency: 'INR'
                    }).format(1250.50)}
                </Typography>
            </Box>

            {/* Info Box */}
            <Box sx={{ p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                <Typography variant="caption" color="success.dark">
                    <strong>Note:</strong> Your language and region preferences are saved automatically.
                    The app will remember your choices for future visits.
                </Typography>
            </Box>
        </Paper>
    );
};

export default LanguageSettings;
