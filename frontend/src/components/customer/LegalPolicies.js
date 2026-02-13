import React, { useState } from 'react';
import { Paper, Typography, List, ListItem, ListItemText, Link, Button, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const policies = [
  { title: 'Privacy Policy', url: '/legal/privacy', content: 'This is the privacy policy...' },
  { title: 'Terms of Service', url: '/legal/terms', content: 'These are the terms of service...' },
  { title: 'Cookie Policy', url: '/legal/cookies', content: 'How we use cookies...' },
];

const LegalPolicies = () => {
  const navigate = useNavigate();
  const [selectedPolicy, setSelectedPolicy] = useState(null);

  const handlePolicyClick = (policy) => {
    setSelectedPolicy(policy);
  };

  const handleContactClick = () => {
    navigate('/contact');
  };

  return (
    <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
      {/* Policy List */}
      <Paper sx={{ p: 3, flex: 1 }}>
        <Typography variant="h6" gutterBottom>Legal Policies</Typography>
        <List>
          {policies.map((p, i) => (
            <ListItem 
              key={i} 
              button 
              onClick={() => handlePolicyClick(p)}
              selected={selectedPolicy?.title === p.title}
            >
              <ListItemText 
                primary={p.title} 
                secondary="Click to view policy details"
              />
            </ListItem>
          ))}
          
          <ListItem button onClick={handleContactClick}>
            <ListItemText 
              primary="Contact Us" 
              secondary="Get help or send us a message"
            />
          </ListItem>
        </List>
      </Paper>

      {/* Policy Content */}
      <Paper sx={{ p: 3, flex: 2 }}>
        {selectedPolicy ? (
          <>
            <Typography variant="h5" gutterBottom>
              {selectedPolicy.title}
            </Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
              {selectedPolicy.content}
            </Typography>
          </>
        ) : (
          <>
            <Typography variant="h5" gutterBottom>
              Welcome to Our Legal Center
            </Typography>
            <Typography variant="body1" paragraph>
              Please select a policy from the list to view its details. 
              If you have questions about any of our policies or need assistance, 
              feel free to contact our support team.
            </Typography>
            
            <Box sx={{ mt: 3 }}>
              <Button 
                variant="contained" 
                onClick={handleContactClick}
                sx={{ backgroundColor: '#4CAF50' }}
              >
                Contact Support
              </Button>
            </Box>
          </>
        )}
      </Paper>
    </Box>
  );
};

export default LegalPolicies;