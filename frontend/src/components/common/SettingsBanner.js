import React, { useEffect, useState } from 'react';
import { Alert, Snackbar, Box } from '@mui/material';
import api from '../../utils/api';

/**
 * Settings Banner Component
 * Displays festival mode, maintenance mode, and other admin-controlled settings
 */
const SettingsBanner = () => {
    const [settings, setSettings] = useState(null);
    const [showFestivalBanner, setShowFestivalBanner] = useState(false);
    const [showMaintenanceAlert, setShowMaintenanceAlert] = useState(false);

    useEffect(() => {
        // Fetch public settings
        const fetchSettings = async () => {
            try {
                const { data } = await api.get('/api/v1/settings/public');
                setSettings(data);

                // Show festival banner if enabled
                if (data.festivalMode?.enabled) {
                    setShowFestivalBanner(true);
                }

                // Show maintenance alert if enabled
                if (data.maintenanceMode?.enabled) {
                    setShowMaintenanceAlert(true);
                }
            } catch (error) {
                console.error('Failed to load settings:', error);
                // Silently fail - settings are not critical
            }
        };

        fetchSettings();
    }, []);

    if (!settings) return null;

    return (
        <>
            {/* Festival Mode Banner */}
            {showFestivalBanner && settings.festivalMode?.enabled && (
                <Box
                    sx={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        padding: '12px 20px',
                        textAlign: 'center',
                        fontWeight: 'bold',
                        fontSize: '1rem',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                        position: 'relative',
                        zIndex: 1000
                    }}
                >
                    🎉 {settings.festivalMode.name}: {settings.festivalMode.bannerText}
                    {settings.festivalMode.extraDiscount > 0 && (
                        <> - Get {settings.festivalMode.extraDiscount}% extra discount on all products!</>
                    )}
                </Box>
            )}

            {/* Maintenance Mode Alert */}
            <Snackbar
                open={showMaintenanceAlert}
                onClose={() => setShowMaintenanceAlert(false)}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                sx={{ mt: 8 }}
            >
                <Alert
                    severity="warning"
                    onClose={() => setShowMaintenanceAlert(false)}
                    sx={{ minWidth: '400px' }}
                >
                    <strong>Maintenance Notice:</strong> {settings.maintenanceMode?.message}
                </Alert>
            </Snackbar>
        </>
    );
};

export default SettingsBanner;
