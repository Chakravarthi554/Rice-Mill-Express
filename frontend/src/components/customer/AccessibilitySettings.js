import React from 'react';
import {
  Paper, Typography, Box, Slider, Button, Divider, Alert
} from '@mui/material';
import { Accessibility } from '@mui/icons-material';
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
    <Box sx={{ maxWidth: 600 }}>
      <Paper sx={{ p: 3, borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.04)', bgcolor: '#FFFBEB', border: '1px solid #FDE68A' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
          <Accessibility sx={{ color: '#D97706', fontSize: 24 }} />
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#111827' }}>
            Accessibility Settings
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: '#9CA3AF', mb: 2.5 }}>
          Customize the app's appearance for better readability and accessibility
        </Typography>

        <Alert severity="info" sx={{ mb: 4, borderRadius: 3 }}>
          Changes apply globally across the entire application
        </Alert>

        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#374151', mb: 1 }}>
            High Contrast
          </Typography>
          <Typography variant="body2" sx={{ color: '#9CA3AF', mb: 2 }}>
            Increase contrast for better visibility (0-100%)
          </Typography>
          <Box sx={{ px: 1 }}>
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
              sx={{ '& .MuiSlider-valueLabel': { bgcolor: '#16A34A' }, '& .MuiSlider-track': { bgcolor: '#16A34A' }, '& .MuiSlider-thumb': { bgcolor: '#16A34A' } }}
            />
          </Box>
          <Typography variant="caption" sx={{ color: '#9CA3AF', mt: 1, display: 'block' }}>
            Current: {highContrast}% {highContrast > 50 ? '(High Contrast Mode Active)' : ''}
          </Typography>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#374151', mb: 1 }}>
            Text Size
          </Typography>
          <Typography variant="body2" sx={{ color: '#9CA3AF', mb: 2 }}>
            Adjust base font size for all text (12px - 24px)
          </Typography>
          <Box sx={{ px: 1 }}>
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
              sx={{ '& .MuiSlider-valueLabel': { bgcolor: '#16A34A' }, '& .MuiSlider-track': { bgcolor: '#16A34A' }, '& .MuiSlider-thumb': { bgcolor: '#16A34A' } }}
            />
          </Box>
          <Typography variant="caption" sx={{ color: '#9CA3AF', mt: 1, display: 'block' }}>
            Current: {textSize}px (Default: 16px)
          </Typography>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ mb: 4, p: 3, bgcolor: '#F9FAFB', borderRadius: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#374151', mb: 2 }}>
            Preview
          </Typography>
          <Typography variant="body1" sx={{ fontSize: `${textSize}px`, color: '#374151' }}>
            This is how your text will appear with the current settings.
          </Typography>
          <Typography variant="body2" sx={{ fontSize: `${textSize * 0.875}px`, mt: 1, color: '#9CA3AF' }}>
            Secondary text and descriptions will scale proportionally.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, pt: 2, borderTop: '1px solid #F3F4F6' }}>
          <Button variant="outlined" onClick={resetToDefaults} sx={{ borderRadius: 3, fontWeight: 700 }}>
            Reset to Defaults
          </Button>
          <Button variant="contained" color="success" sx={{ borderRadius: 3, fontWeight: 700 }}>
            Settings Applied
          </Button>
        </Box>

        <Box sx={{ mt: 3, p: 2, bgcolor: '#F0FDF4', borderRadius: 3 }}>
          <Typography variant="caption" sx={{ color: '#166534' }}>
            <strong>Tip:</strong> These settings are saved automatically and will persist across sessions. For best results, combine high contrast with larger text sizes.
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default AccessibilitySettings;
