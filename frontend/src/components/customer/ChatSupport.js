import React from 'react';
import { useState } from 'react';
import { Typography, Paper, Box, TextField, Button } from '@mui/material';
import { Send } from '@mui/icons-material';

const ChatSupport = () => {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    console.log('Sending message to support:', message);
    setMessage('');
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>Chat with Support</Typography>
      <Box sx={{ height: 300, overflowY: 'auto', mb: 2, border: '1px solid #ddd', p: 2 }}>
        {/* Chat messages would go here */}
        <Typography>Support: Hello, how can I help?</Typography>
      </Box>
      <Box sx={{ display: 'flex' }}>
        <TextField fullWidth value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type your message..." />
        <Button variant="contained" onClick={handleSend} endIcon={<Send />}>
          Send
        </Button>
      </Box>
    </Paper>
  );
};

export default ChatSupport;