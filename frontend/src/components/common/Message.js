import React from 'react';
import { Alert } from '@mui/material';

const Message = ({ variant = 'info', children }) => {
  return <Alert severity={variant}>{children}</Alert>;
};

export default Message;