import React from 'react';
import { Typography } from '@mui/material';

const Reviews = () => {
  return (
    <div>
      <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
        My Reviews
      </Typography>
      <Typography>Your product reviews will appear here</Typography>
    </div>
  );
};

export default Reviews;