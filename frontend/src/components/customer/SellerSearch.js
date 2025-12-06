import React, { useState } from 'react';
import { TextField, Box } from '@mui/material';

// This component is no longer used as its functionality is merged into CustomerDashboard.js
// Keeping a minimal version for reference or potential reuse
const SellerSearch = () => {
  const [search, setSearch] = useState('');

  return (
    <Box sx={{ mb: 3 }}>
      <TextField
        fullWidth
        label="Search by Seller or Location"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        variant="outlined"
      />
    </Box>
  );
};

export default SellerSearch;