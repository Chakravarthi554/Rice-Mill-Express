import React from 'react';
import {
    Paper,
    Typography,
    Box,
    Slider,
    Button,
    Divider,
    Alert
} from '@mui/material';
import { useTheme } from '../../context/ThemeContext';

const AccessibilitySettings = () => {
    const { highContrast, textSize, adjustHighContrast, adjustTextSize, resetToDefaults } = useTheme();

    const handleContrastChange = (event, newValue) => {
        adjustHighContrast(newValue);
    };

    const handleTextSizeChange = (event, newValue) => {
        adjustTextSize(newValue);
    };

    return (
        <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
                Accessibility Settings
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Customize the app's appearance for better readability and accessibility
            </Typography>

            <Alert severity="info" sx={{ mb: 3 }}>
                Changes apply globally across the entire application
            </Alert>

            {/* High Contrast Control */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                    High Contrast
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Increase contrast for better visibility (0-100%)
                </Typography>
                <Box sx={{ px: 2 }}>
                    <Slider
                        value={highContrast}
                        onChange={handleContrastChange}
                        min={0}
                        max={100}
                        step={5}
                        marks={[
                            { value: 0, label: '0%' },
                            { value: 50, label: '50%' },
                            { value: 100, label: '100%' }
                        ]}
                        valueLabelDisplay="on"
                        sx={{
                            '& .MuiSlider-valueLabel': {
                                backgroundColor: 'primary.main'
                            }
                        }}
                    />
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Current: {highContrast}% {highContrast > 50 ? '(High Contrast Mode Active)' : ''}
                </Typography>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Text Size Control */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                    Text Size
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Adjust base font size for all text (12px - 24px)
                </Typography>
                <Box sx={{ px: 2 }}>
                    <Slider
                        value={textSize}
                        onChange={handleTextSizeChange}
                        min={12}
                        max={24}
                        step={1}
                        marks={[
                            { value: 12, label: '12px' },
                            { value: 16, label: '16px' },
                            { value: 20, label: '20px' },
                            { value: 24, label: '24px' }
                        ]}
                        valueLabelDisplay="on"
                        sx={{
                            '& .MuiSlider-valueLabel': {
                                backgroundColor: 'secondary.main'
                            }
                        }}
                    />
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Current: {textSize}px (Default: 16px)
                </Typography>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Preview Section */}
            <Box sx={{ mb: 4, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                    Preview
                </Typography>
                <Typography variant="body1" sx={{ fontSize: `${textSize}px` }}>
                    This is how your text will appear with the current settings.
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: `${textSize * 0.875}px`, mt: 1 }}>
                    Secondary text and descriptions will scale proportionally.
                </Typography>
            </Box>

            {/* Reset Button */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                    variant="outlined"
                    onClick={resetToDefaults}
                    sx={{ mr: 2 }}
                >
                    Reset to Defaults
                </Button>
                <Button
                    variant="contained"
                    color="success"
                >
                    Settings Applied
                </Button>
            </Box>

            {/* Additional Info */}
            <Box sx={{ mt: 3, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                <Typography variant="caption" color="info.dark">
                    <strong>Tip:</strong> These settings are saved automatically and will persist across sessions.
                    For best results, combine high contrast with larger text sizes.
                </Typography>
            </Box>
        </Paper>
    );
};

export default AccessibilitySettings;
