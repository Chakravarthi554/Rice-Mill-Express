import React from 'react';
import { Paper, Typography, Box, Divider, List, ListItem, ListItemText, ListItemIcon } from '@mui/material';
import { Info, Verified, Description, Lock } from '@mui/icons-material';

const About = () => {
    return (
        <Box sx={{ maxWidth: 800, mx: 'auto' }}>
            <Paper sx={{ p: 4 }}>
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <Typography variant="h4" gutterBottom sx={{ color: '#2E7D32', fontWeight: 'bold' }}>
                        RiceMill Express
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary">
                        Version 1.0.0
                    </Typography>
                </Box>

                <Typography variant="body1" paragraph>
                    Welcome to RiceMill Express, your premium destination for high-quality rice and agricultural products.
                    We connect local mills directly with consumers, ensuring freshness, quality, and fair pricing.
                </Typography>

                <Divider sx={{ my: 4 }} />

                <Typography variant="h6" gutterBottom>Key Features</Typography>
                <List>
                    <ListItem>
                        <ListItemIcon><Verified color="primary" /></ListItemIcon>
                        <ListItemText primary="Quality Guaranteed" secondary="Every product is source-verified and quality-tested." />
                    </ListItem>
                    <ListItem>
                        <ListItemIcon><Info color="primary" /></ListItemIcon>
                        <ListItemText primary="Direct Sourcing" secondary="We eliminate middlemen to provide the best value." />
                    </ListItem>
                    <ListItem>
                        <ListItemIcon><Description color="primary" /></ListItemIcon>
                        <ListItemText primary="Transparent Policies" secondary="Clear returns, refunds, and privacy terms." />
                    </ListItem>
                    <ListItem>
                        <ListItemIcon><Lock color="primary" /></ListItemIcon>
                        <ListItemText primary="Secure Payments" secondary="Your transactions are protected by industry-standard encryption." />
                    </ListItem>
                </List>

                <Box sx={{ mt: 4, p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary" display="block" align="center">
                        © {new Date().getFullYear()} RiceMill Express. All rights reserved.
                    </Typography>
                </Box>
            </Paper>
        </Box>
    );
};

export default About;
