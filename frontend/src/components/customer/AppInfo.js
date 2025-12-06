import React from 'react';
import { Paper, Typography, Button, Box } from '@mui/material';
import { InfoOutlined } from '@mui/icons-material';

const AppInfo = () => (
  <Paper sx={{ p: 3 }}>
    <Typography variant="h6" gutterBottom>App Info</Typography>
    <Typography>Version: 1.0.0</Typography>
    <Typography>Build Date: {new Date().toLocaleDateString()}</Typography>
    <Box sx={{ mt: 2 }}>
      <Button variant="contained" startIcon={<InfoOutlined />}>
        Check for Updates
      </Button>
    </Box>
  </Paper>
);
export default AppInfo;