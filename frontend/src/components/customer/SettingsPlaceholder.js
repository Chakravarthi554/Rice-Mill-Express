// frontend/src/components/customer/SettingsPlaceholder.js
import React from 'react';
import { Typography, Paper, Box } from '@mui/material';
import ConstructionIcon from '@mui/icons-material/Construction';

const SettingsPlaceholder = ({ title }) => {
  return (
    <Paper sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <ConstructionIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
      <Typography variant="h5" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body1" color="text.secondary">
        This feature is under construction.
      </Typography>
    </Paper>
  );
};

export default SettingsPlaceholder;