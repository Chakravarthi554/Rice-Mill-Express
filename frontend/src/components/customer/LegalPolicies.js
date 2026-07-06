import React, { useState } from 'react';
import { Paper, Typography, List, ListItem, ListItemText, Link, Button, Box, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import api from '../../utils/api';

const LegalPolicies = () => {
  const navigate = useNavigate();
  const [selectedPolicyType, setSelectedPolicyType] = useState('privacy');
  const [policyData, setPolicyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const policyTypes = [
    { title: 'Privacy Policy', type: 'privacy' },
    { title: 'Terms of Service', type: 'terms' },
    { title: 'Refund Policy', type: 'refund' },
  ];

  React.useEffect(() => {
    const fetchPolicy = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get(`/api/v1/legal/${selectedPolicyType}`);
        if (response.data && response.data.success) {
          setPolicyData(response.data.data);
        } else {
          setError('Failed to load policy content.');
        }
      } catch (err) {
        console.error('Legal API Error:', err);
        setError('Connection error. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchPolicy();
  }, [selectedPolicyType]);

  const handlePolicyClick = (type) => {
    setSelectedPolicyType(type);
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
          {policyTypes.map((p, i) => (
            <ListItem
              key={i}
              button
              onClick={() => handlePolicyClick(p.type)}
              selected={selectedPolicyType === p.type}
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
      <Paper sx={{ p: 3, flex: 2, minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
        {loading ? (
          <Box sx={{ display: 'flex', flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <CircularProgress size={30} sx={{ color: '#4CAF50' }} />
            <Typography sx={{ ml: 2 }}>Loading policy...</Typography>
          </Box>
        ) : error ? (
          <Box sx={{ display: 'flex', flex: 1, justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
            <Typography color="error" gutterBottom>{error}</Typography>
            <Button variant="outlined" onClick={() => setSelectedPolicyType(selectedPolicyType)}>Retry</Button>
          </Box>
        ) : policyData ? (
          <>
            <Typography variant="h5" gutterBottom sx={{ color: '#2E7D32', fontWeight: 'bold' }}>
              {policyData.title}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', mb: 2 }}>
              Version: {policyData.version} | Last Updated: {new Date(policyData.lastUpdated).toLocaleDateString()}
            </Typography>
            <Box
              sx={{
                mt: 2,
                color: 'text.primary',
                '& h2': { mt: 3, mb: 1, fontSize: '1.25rem', color: '#333' },
                '& p': { mb: 2, lineHeight: 1.6 },
                '& ul, & ol': { mb: 2, pl: 3 },
                '& li': { mb: 1 }
              }}
              dangerouslySetInnerHTML={{ __html: policyData.content }}
            />
          </>
        ) : (
          <Box sx={{ display: 'flex', flex: 1, justifyContent: 'center', alignItems: 'center', flexDirection: 'column', textAlign: 'center' }}>
            <Typography variant="h5" gutterBottom>
              Welcome to Our Legal Center
            </Typography>
            <Typography variant="body1" paragraph>
              Please select a policy from the list to view its details.
            </Typography>
            <Button
              variant="contained"
              onClick={handleContactClick}
              sx={{ mt: 2, backgroundColor: '#4CAF50', '&:hover': { backgroundColor: '#45a049' } }}
            >
              Contact Support
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default LegalPolicies;