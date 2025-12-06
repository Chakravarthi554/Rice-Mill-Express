import React from 'react';
import { Paper, Typography, List, ListItem, ListItemText, Link } from '@mui/material';

const policies = [
  { title: 'Privacy Policy', url: '/legal/privacy' },
  { title: 'Terms of Service', url: '/legal/terms' },
  { title: 'Cookie Policy', url: '/legal/cookies' },
];

const LegalPolicies = () => (
  <Paper sx={{ p: 3 }}>
    <Typography variant="h6" gutterBottom>Legal Policies</Typography>
    <List>
      {policies.map((p, i) => (
        <ListItem key={i}>
          <ListItemText primary={<Link href={p.url} target="_blank">{p.title}</Link>} />
        </ListItem>
      ))}
    </List>
  </Paper>
);
export default LegalPolicies;