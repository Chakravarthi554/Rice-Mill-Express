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

const LanguageSettings = () => {
    const { language, region, currency, changeLanguage, changeRegion, changeCurrency, availableLanguages, t } = useI18n();

    // Local state for deferred saving
    const [localLanguage, setLocalLanguage] = React.useState(language);
    const [localRegion, setLocalRegion] = React.useState(region);
    const [localCurrency, setLocalCurrency] = React.useState(currency);
    const [saved, setSaved] = React.useState(false);

    const handleSave = () => {
        changeLanguage(localLanguage);
        changeRegion(localRegion);
        changeCurrency(localCurrency);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    // Update local state when global state changes (e.g. initial load)
    React.useEffect(() => {
        setLocalLanguage(language);
        setLocalRegion(region);
        setLocalCurrency(currency);
    }, [language, region, currency]);

    const regions = [
        { code: 'IN', name: 'India', flag: '🇮🇳' },
        { code: 'US', name: 'United States', flag: '🇺🇸' },
        { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
        { code: 'AU', name: 'Australia', flag: '🇦🇺' }
    ];

    const currencies = [
        { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
        { code: 'USD', symbol: '$', name: 'US Dollar' },
        { code: 'GBP', symbol: '£', name: 'British Pound' },
        { code: 'EUR', symbol: '€', name: 'Euro' }
    ];

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

            <Divider sx={{ my: 3 }} />

            {/* Region Selection */}
            <Box sx={{ mb: 4 }}>
                <FormControl fullWidth>
                    <InputLabel id="region-select-label">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PublicIcon fontSize="small" />
                            Region
                        </Box>
                    </InputLabel>
                    <Select
                        labelId="region-select-label"
                        value={localRegion}
                        label="Region"
                        onChange={(e) => setLocalRegion(e.target.value)}
                    >
                        {regions.map((r) => (
                            <MenuItem key={r.code} value={r.code}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <span>{r.flag}</span>
                                    <Typography>{r.name}</Typography>
                                    {region === r.code && (
                                        <Chip label="Current" size="small" color="primary" />
                                    )}
                                </Box>
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Your region affects date formats and number formatting
                </Typography>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Currency Selection */}
            <Box sx={{ mb: 4 }}>
                <FormControl fullWidth>
                    <InputLabel id="currency-select-label">Currency</InputLabel>
                    <Select
                        labelId="currency-select-label"
                        value={localCurrency}
                        label="Currency"
                        onChange={(e) => setLocalCurrency(e.target.value)}
                    >
                        {currencies.map((curr) => (
                            <MenuItem key={curr.code} value={curr.code}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography sx={{ fontWeight: 'bold', minWidth: 30 }}>
                                        {curr.symbol}
                                    </Typography>
                                    <Typography>{curr.name} ({curr.code})</Typography>
                                    {currency === curr.code && (
                                        <Chip label="Current" size="small" color="primary" />
                                    )}
                                </Box>
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Currency for displaying prices and transactions
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
                    <strong>Sample Price:</strong> {new Intl.NumberFormat(region === 'IN' ? 'en-IN' : 'en-US', {
                        style: 'currency',
                        currency: currency
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
